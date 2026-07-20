import hmac
import hashlib
import base64
import json
import os
from datetime import datetime, timedelta

# Production-grade cryptographic key
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "autonomous-research-agent-secure-token-signing-key-998811")
ALGORITHM = "HS256"
DEFAULT_EXPIRY_MINUTES = 120

def base64url_encode(data: bytes) -> str:
    """Encode bytes to Base64URL string without padding."""
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def base64url_decode(data: str) -> bytes:
    """Decode Base64URL string back to bytes with correct padding."""
    padding = '=' * (4 - (len(data) % 4))
    return base64.urlsafe_b64decode(data + padding)

def create_access_token(data: dict, expires_delta: timedelta = None) -> str:
    """
    Creates a signed HMAC-SHA256 JWT access token.
    Parameters:
        data (dict): The payload dictionary (e.g. {"sub": username})
        expires_delta (timedelta): Optional custom expiration delta
    Returns:
        str: Cryptographically signed JWT token string
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=DEFAULT_EXPIRY_MINUTES)
    
    # Store standard JWT expiration timestamp claim (exp)
    to_encode.update({"exp": int(expire.timestamp())})
    
    # Standard header
    header = {"alg": ALGORITHM, "typ": "JWT"}
    
    # Base64url encode Header and Payload
    header_b64 = base64url_encode(json.dumps(header).encode('utf-8'))
    payload_b64 = base64url_encode(json.dumps(to_encode).encode('utf-8'))
    
    # Sign with HMAC-SHA256
    signature_input = f"{header_b64}.{payload_b64}".encode('utf-8')
    signature = hmac.new(SECRET_KEY.encode('utf-8'), signature_input, hashlib.sha256).digest()
    signature_b64 = base64url_encode(signature)
    
    return f"{header_b64}.{payload_b64}.{signature_b64}"

def decode_access_token(token: str) -> dict:
    """
    Verifies and decodes a signed JWT access token.
    Parameters:
        token (str): The signed JWT string
    Returns:
        dict: The decoded payload if valid and unexpired, None otherwise
    """
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
            
        header_b64, payload_b64, signature_b64 = parts
        
        # Verify signature
        signature_input = f"{header_b64}.{payload_b64}".encode('utf-8')
        expected_signature = hmac.new(SECRET_KEY.encode('utf-8'), signature_input, hashlib.sha256).digest()
        expected_signature_b64 = base64url_encode(expected_signature)
        
        # Timing-attack-resistant comparison
        if not hmac.compare_digest(signature_b64, expected_signature_b64):
            return None
            
        payload = json.loads(base64url_decode(payload_b64).decode('utf-8'))
        
        # Verify expiration (exp claim)
        exp = payload.get("exp")
        if exp and datetime.utcnow().timestamp() > exp:
            return None
            
        return payload
    except Exception:
        return None
