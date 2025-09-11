from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
import time
from collections import defaultdict, deque
import asyncio
from core.config import settings

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware to prevent API abuse"""
    
    def __init__(self, app, requests_per_minute: int = None):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute or settings.rate_limit_per_minute
        self.requests = defaultdict(deque)
        self.lock = asyncio.Lock()
    
    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks and docs
        if request.url.path in ["/health", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)
        
        client_ip = request.client.host
        
        async with self.lock:
            now = time.time()
            minute_ago = now - 60
            
            # Clean old requests
            while self.requests[client_ip] and self.requests[client_ip][0] < minute_ago:
                self.requests[client_ip].popleft()
            
            # Check rate limit
            if len(self.requests[client_ip]) >= self.requests_per_minute:
                raise HTTPException(
                    status_code=429,
                    detail="Rate limit exceeded. Please try again later."
                )
            
            # Add current request
            self.requests[client_ip].append(now)
        
        return await call_next(request)