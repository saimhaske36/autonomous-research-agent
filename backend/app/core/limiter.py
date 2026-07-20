import time
from fastapi import Request, HTTPException

class RateLimiter:
    """
    Self-contained, in-memory sliding-window rate limiter.
    Keeps track of request timestamps mapped to client IPs.
    """
    def __init__(self, requests_limit: int, window_seconds: int):
        self.requests_limit = requests_limit
        self.window_seconds = window_seconds
        self.history = {}  # client_ip -> list of timestamps

    def check_limit(self, client_ip: str) -> bool:
        now = time.time()
        
        # Initialize client history if first visit
        if client_ip not in self.history:
            self.history[client_ip] = []

        # Retain only timestamps that fall within the current sliding window
        self.history[client_ip] = [
            t for t in self.history[client_ip]
            if now - t < self.window_seconds
        ]

        # Block if request count exceeds window threshold
        if len(self.history[client_ip]) >= self.requests_limit:
            return False

        # Add current request timestamp
        self.history[client_ip].append(now)
        return True

# Initialize global rate limiters:
# 1. Auth: Max 5 logins or signups per minute per client IP.
auth_limiter = RateLimiter(requests_limit=5, window_seconds=60)

# 2. Research: Max 10 job creations per minute per client IP (protects LLM cost).
research_limiter = RateLimiter(requests_limit=10, window_seconds=60)


def rate_limit_auth(request: Request):
    """FastAPI dependency to rate limit authentication routes."""
    client_ip = request.client.host if request.client else "unknown"
    if not auth_limiter.check_limit(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Too many authentication attempts. Please try again in a minute."
        )


def rate_limit_research(request: Request):
    """FastAPI dependency to rate limit research job creation routes."""
    client_ip = request.client.host if request.client else "unknown"
    if not research_limiter.check_limit(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Too many research creations requested. Please slow down."
        )
