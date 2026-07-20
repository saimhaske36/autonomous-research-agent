import os
import json
import uuid
import hashlib
from fastapi import APIRouter, Depends, HTTPException, Security, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.jwt import create_access_token, decode_access_token
from app.core.limiter import rate_limit_auth, rate_limit_research

from app.core.database import get_db
from app.models.user import User
from app.models.research_job import ResearchJob
from app.services.research_service import ResearchService

from app.schemas.research import (
    CreateResearchRequest,
    CreateResearchResponse,
    ResearchStatusResponse
)
from app.schemas.source import SourceResponse
from app.schemas.finding import FindingResponse
from app.schemas.analysis import AnalysisResponse
from app.schemas.auth import LoginRequest, LoginResponse, SignUpRequest, SignUpResponse, UpdateAdminProfileRequest, ForgotPasswordRequest, ResetPasswordRequest, VerifyLoginOTPRequest

router = APIRouter()
security = HTTPBearer()

def hash_password(password: str) -> str:
    # Secure SHA-256 salted hash for local DB profiles
    salt = "autonomous-research-agent-salt"
    return hashlib.sha256((password + salt).encode('utf-8')).hexdigest()

def send_smtp_email(to_email: str, subject: str, html_body: str) -> bool:
    smtp_server = os.getenv("SMTP_SERVER")
    smtp_port = os.getenv("SMTP_PORT")
    smtp_username = os.getenv("SMTP_USERNAME")
    smtp_password = os.getenv("SMTP_PASSWORD")
    smtp_sender = os.getenv("SMTP_SENDER", smtp_username)

    if not all([smtp_server, smtp_port, smtp_username, smtp_password]):
        print(f"[MAIL SIMULATOR] To: {to_email} | Subject: {subject}")
        # Print inline plain text summary to console
        print(f"[MAIL SIMULATOR] Body: {html_body[:200]}...")
        return False

    import smtplib
    from email.mime.text import MIMEText
    from email.mime.multipart import MIMEMultipart

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = smtp_sender
        msg["To"] = to_email

        part = MIMEText(html_body, "html")
        msg.attach(part)

        with smtplib.SMTP(smtp_server, int(smtp_port)) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.sendmail(smtp_sender, to_email, msg.as_string())
        return True
    except Exception as e:
        print("SMTP Error sending email:", e)
        return False

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Security(security),
    db: Session = Depends(get_db)
):
    token = credentials.credentials
    # Bypassing option for admin secret token (for easier initial API testing)
    if token == "admin-secret-token":
        return "admin"
        
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials or token expired"
        )

    username = payload.get("sub")
    role = payload.get("role")

    if role == "admin" or username == "admin":
        return "admin"

    user = db.query(User).filter(User.username == username).first()
    if user:
        if user.is_blocked:
            raise HTTPException(
                status_code=403,
                detail="Access Denied: Your account has been suspended by the administrator."
            )
        return user

    raise HTTPException(
        status_code=401,
        detail="User not found"
    )

def get_user_id(current_user):
    if isinstance(current_user, str):
        return current_user
    return current_user.id

def check_job_ownership(job: ResearchJob, current_user):
    user_id = get_user_id(current_user)
    if user_id == "admin":
        return
    if job.user_id and job.user_id != user_id:
        raise HTTPException(
            status_code=403,
            detail="Forbidden: You do not own this research job."
        )

@router.post(
    "/research",
    response_model=CreateResearchResponse,
    dependencies=[Depends(rate_limit_research)]
)
def create_research_job(
    request: CreateResearchRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    service = ResearchService(db)
    job = service.create_job(
        topic=request.topic,
        user_id=get_user_id(current_user),
        background_tasks=background_tasks
    )
    return CreateResearchResponse(
        job_id=job.id,
        status=job.status
    )

@router.get("/research/stats")
def get_stats(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    service = ResearchService(db)
    return service.get_stats(user_id=get_user_id(current_user))

@router.get(
    "/research/{job_id}",
    response_model=ResearchStatusResponse
)
def get_research_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    service = ResearchService(db)
    job = service.get_job(job_id)
    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )
    check_job_ownership(job, current_user)
    return ResearchStatusResponse(
        job_id=job.id,
        topic=job.topic,
        status=job.status,
        progress=job.progress,
        source_count=job.source_count,
        finding_count=job.finding_count
    )

@router.get(
    "/research/{job_id}/sources",
    response_model=list[SourceResponse]
)
def get_sources(
    job_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    service = ResearchService(db)
    job = service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    check_job_ownership(job, current_user)
    sources = service.get_sources(job_id)
    return [
        SourceResponse(
            title=s.title,
            url=s.url,
            content=s.content
        )
        for s in sources
    ]

@router.get(
    "/research/{job_id}/findings",
    response_model=list[FindingResponse]
)
def get_findings(
    job_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    service = ResearchService(db)
    job = service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    check_job_ownership(job, current_user)
    findings = service.get_findings(job_id)
    return [
        FindingResponse(
            finding=f.finding,
            source_url=f.source_url
        )
        for f in findings
    ]

@router.get(
    "/research/{job_id}/analysis"
)
def get_analysis(
    job_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    service = ResearchService(db)
    job = service.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    check_job_ownership(job, current_user)
    analysis = service.get_analysis(job_id)
    return {
        "executive_summary": analysis.executive_summary,
        "trends": json.loads(analysis.trends or "[]"),
        "opportunities": json.loads(analysis.opportunities or "[]"),
        "risks": json.loads(analysis.risks or "[]")
    }

@router.get(
    "/research/{job_id}/report"
)
def download_report(
    job_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    service = ResearchService(db)
    job = service.get_job(job_id)
    if not job or not job.pdf_path:
        raise HTTPException(
            status_code=404,
            detail="Report not found"
        )
    check_job_ownership(job, current_user)
    return FileResponse(
        path=job.pdf_path,
        media_type="application/pdf",
        filename=f"{job_id}.pdf"
    )

@router.get(
    "/research"
)
def get_all_jobs(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    service = ResearchService(db)
    return service.get_all_jobs(user_id=get_user_id(current_user))

@router.post(
    "/auth/login",
    response_model=LoginResponse,
    dependencies=[Depends(rate_limit_auth)]
)
def login(
    request: LoginRequest,
    db: Session = Depends(get_db)
):
    portal = request.portal or "user"

    # Reload environment settings dynamically from local .env
    from dotenv import load_dotenv
    from pathlib import Path
    env_path = Path(__file__).resolve().parents[4] / ".env"
    if env_path.exists():
        load_dotenv(dotenv_path=env_path, override=True)

    # 1. Admin Portal Authentication logic
    if portal == "admin":
        expected_username = os.getenv("ADMIN_USERNAME", "admin")
        expected_password = os.getenv("ADMIN_PASSWORD", "admin")
        if request.username == expected_username and request.password == expected_password:
            token = create_access_token(data={"sub": "admin", "role": "admin"})
            return LoginResponse(
                success=True,
                token=token,
                message="Login successful (admin portal)"
            )
        raise HTTPException(
            status_code=401,
            detail="Invalid administrative credentials"
        )

    # 2. User Portal Authentication logic (explicitly block admin logins here)
    expected_username = os.getenv("ADMIN_USERNAME", "admin")
    if request.username == expected_username:
        raise HTTPException(
            status_code=403,
            detail="Access Denied: Administrators must use the Admin Portal."
        )

    # Check users table for regular users by email
    user = db.query(User).filter(User.email == request.username).first()
    if user and user.password == hash_password(request.password):
        if user.is_blocked:
            raise HTTPException(
                status_code=403,
                detail="Access Denied: Your account has been suspended by the administrator."
            )
        
        token = create_access_token(data={"sub": user.username, "role": "user"})
        return LoginResponse(
            success=True,
            token=token,
            message="Login successful"
        )

    raise HTTPException(
        status_code=401,
        detail="Invalid credentials"
    )

@router.post(
    "/auth/signup",
    response_model=SignUpResponse,
    dependencies=[Depends(rate_limit_auth)]
)
def signup(
    request: SignUpRequest,
    db: Session = Depends(get_db)
):
    if not request.username or not request.email or not request.password:
        raise HTTPException(
            status_code=400,
            detail="Username, email, and password are required"
        )

    existing_user = db.query(User).filter(User.username == request.username).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username already exists"
        )

    existing_email = db.query(User).filter(User.email == request.email).first()
    if existing_email:
        raise HTTPException(
            status_code=400,
            detail="Email address already registered"
        )

    new_user = User(
        id=str(uuid.uuid4()),
        username=request.username,
        email=request.email,
        password=hash_password(request.password)
    )
    db.add(new_user)
    db.commit()

    return SignUpResponse(
        success=True,
        message="Registration successful"
    )

@router.get(
    "/auth/users"
)
def list_users(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    user_id = get_user_id(current_user)
    if user_id != "admin":
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Admin access only."
        )

    users = db.query(User).all()
    results = []
    for u in users:
        if u.username == "admin":
            continue
        job_count = db.query(ResearchJob).filter(ResearchJob.user_id == u.id).count()
        results.append({
            "id": u.id,
            "username": u.username,
            "password_hash": u.password,
            "is_blocked": u.is_blocked or False,
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "job_count": job_count
        })

    return results

@router.delete(
    "/research/{job_id}"
)
def delete_research_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    service = ResearchService(db)
    job = service.get_job(job_id)
    if not job:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )
    check_job_ownership(job, current_user)
    success = service.delete_job(job_id)
    if not success:
        raise HTTPException(
            status_code=404,
            detail="Job not found"
        )
    return {"message": "Job deleted successfully"}

@router.put(
    "/auth/admin/profile"
)
def update_admin_profile(
    request: UpdateAdminProfileRequest,
    current_user = Depends(get_current_user)
):
    user_id = get_user_id(current_user)
    if user_id != "admin":
        raise HTTPException(
            status_code=403,
            detail="Forbidden: Admin access only."
        )

    new_username = request.new_username.strip()
    new_password = request.new_password

    if not new_username or not new_password:
        raise HTTPException(
            status_code=400,
            detail="Admin username and password cannot be empty."
        )

    # Update environment variables
    os.environ["ADMIN_USERNAME"] = new_username
    os.environ["ADMIN_PASSWORD"] = new_password

    # Write to .env file to persist across restarts
    from pathlib import Path
    env_path = Path(__file__).resolve().parents[4] / ".env"
    
    lines = []
    if env_path.exists():
        with open(env_path, "r", encoding="utf-8") as f:
            lines = f.readlines()

    username_found = False
    password_found = False

    for i, line in enumerate(lines):
        if line.strip().startswith("ADMIN_USERNAME="):
            lines[i] = f"ADMIN_USERNAME={new_username}\n"
            username_found = True
        elif line.strip().startswith("ADMIN_PASSWORD="):
            lines[i] = f"ADMIN_PASSWORD={new_password}\n"
            password_found = True

    if lines and not lines[-1].endswith("\n"):
        lines[-1] = lines[-1] + "\n"

    if not username_found:
        lines.append(f"ADMIN_USERNAME={new_username}\n")
    if not password_found:
        lines.append(f"ADMIN_PASSWORD={new_password}\n")

    with open(env_path, "w", encoding="utf-8") as f:
        f.writelines(lines)

    return {"message": "Admin profile updated successfully."}

@router.post(
    "/auth/forgot-password"
)
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="Email address not found."
        )

    import random
    token = f"RESET-{random.randint(100000, 999999)}"
    user.reset_token = token
    db.commit()

    # Generate direct reset link
    reset_link = f"http://127.0.0.1:8000/?action=reset-password&email={user.email}&token={token}"
    
    email_subject = "Password Reset Request - ResearchX.AI"
    email_html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #faf5ff;">
        <h2 style="color: #7c3aed; text-align: center;">ResearchX.AI Password Reset</h2>
        <p>Hello <strong>{user.username}</strong>,</p>
        <p>We received a request to reset the password for your account. Please click the button below to choose a new password:</p>
        <div style="margin: 24px 0; text-align: center;">
            <a href="{reset_link}" style="display: inline-block; padding: 12px 24px; background: #7c3aed; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 6px; box-shadow: 0 4px 6px rgba(124, 58, 237, 0.25);">Reset Password</a>
        </div>
        <p style="color: #64748b; font-size: 0.85rem;">If the button above does not work, copy and paste the following URL into your web browser:</p>
        <p style="word-break: break-all; background: #f1f5f9; padding: 10px; border-radius: 4px; font-size: 0.8rem; color: #475569;">{reset_link}</p>
        <p style="color: #64748b; font-size: 0.85rem; text-align: center; margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 16px;">If you did not request a password reset, you can safely ignore this email.</p>
    </div>
    """

    send_smtp_email(user.email, email_subject, email_html)

    return {
        "success": True,
        "message": "Password reset link sent to your email address.",
        "simulated_token": token
    }

@router.post(
    "/auth/reset-password"
)
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=404,
            detail="Email address not found."
        )

    if not user.reset_token or user.reset_token != request.token:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired reset token."
        )

    user.password = hash_password(request.new_password)
    user.reset_token = None
    db.commit()

    return {
        "success": True,
        "message": "Password reset successful. You can now log in."
    }

@router.put("/auth/users/{user_id}/toggle-block")
def toggle_block_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Ensure requester is admin
    if get_user_id(current_user) != "admin":
        raise HTTPException(status_code=403, detail="Forbidden: Admin access only.")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    user.is_blocked = not (user.is_blocked or False)
    db.commit()
    
    return {
        "success": True,
        "is_blocked": user.is_blocked,
        "message": f"User suspension status updated to {user.is_blocked}."
    }

@router.delete("/auth/users/{user_id}")
def delete_user(
    user_id: str,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    # Ensure requester is admin
    if get_user_id(current_user) != "admin":
        raise HTTPException(status_code=403, detail="Forbidden: Admin access only.")
    
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    
    # Cascade deletions for all user research data
    jobs = db.query(ResearchJob).filter(ResearchJob.user_id == user.id).all()
    for job in jobs:
        db.query(ResearchSource).filter(ResearchSource.job_id == job.id).delete()
        db.query(ResearchFinding).filter(ResearchFinding.job_id == job.id).delete()
        db.query(ResearchReport).filter(ResearchReport.job_id == job.id).delete()
        db.query(ResearchAnalysis).filter(ResearchAnalysis.job_id == job.id).delete()
        db.delete(job)
        
    db.delete(user)
    db.commit()
    
    return {
        "success": True,
        "message": "User and all associated research data permanently deleted."
    }
