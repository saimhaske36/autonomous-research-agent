from pydantic import BaseModel

class LoginRequest(BaseModel):
    username: str
    password: str
    portal: str = "user"

class LoginResponse(BaseModel):
    success: bool
    token: str = None
    message: str = None
    otp_required: bool = False
    email: str = None
    simulated_otp: str = None

class SignUpRequest(BaseModel):
    username: str
    email: str
    password: str

class SignUpResponse(BaseModel):
    success: bool
    message: str

class UpdateAdminProfileRequest(BaseModel):
    new_username: str
    new_password: str

class ForgotPasswordRequest(BaseModel):
    email: str

class ResetPasswordRequest(BaseModel):
    email: str
    token: str
    new_password: str

class VerifyLoginOTPRequest(BaseModel):
    email: str
    otp: str
