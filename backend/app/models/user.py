from datetime import datetime
from sqlalchemy import Column, String, DateTime, Boolean
from app.models.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True)
    username = Column(String, unique=True, index=True)
    email = Column(String, unique=True, index=True, nullable=True)
    password = Column(String)
    reset_token = Column(String, nullable=True)
    is_blocked = Column(Boolean, default=False, nullable=True)
    login_otp = Column(String, nullable=True)
    login_otp_expires_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
