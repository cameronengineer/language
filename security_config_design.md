# Security Configuration and Environment Management

## Environment Configuration

### Environment Variables
```python
# .env file structure
# JWT Configuration
JWT_SECRET_KEY=your-super-secret-256-bit-key-here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=60
JWT_REFRESH_TOKEN_EXPIRE_DAYS=30

# Social Provider Configuration
GOOGLE_CLIENT_ID=your-google-client-id.googleusercontent.com
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
APPLE_CLIENT_ID=your.apple.bundle.id
TWITTER_CLIENT_ID=your-twitter-client-id

# Database Configuration
DATABASE_URL=sqlite:////tmp/language_app.db

# CORS Configuration
ALLOWED_ORIGINS=["http://localhost:3000", "https://yourdomain.com"]

# App Configuration
APP_ENV=development  # development, staging, production
DEBUG=true
LOG_LEVEL=info

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_PER_MINUTE=60
```

### Pydantic Settings
```python
from pydantic_settings import BaseSettings
from pydantic import Field
from typing import List

class Settings(BaseSettings):
    """Application settings with environment variable support"""
    
    # JWT Settings
    jwt_secret_key: str = Field(..., alias="JWT_SECRET_KEY")
    jwt_algorithm: str = Field("HS256", alias="JWT_ALGORITHM")
    jwt_access_token_expire_minutes: int = Field(60, alias="JWT_ACCESS_TOKEN_EXPIRE_MINUTES")
    jwt_refresh_token_expire_days: int = Field(30, alias="JWT_REFRESH_TOKEN_EXPIRE_DAYS")
    
    # Social Provider Settings
    google_client_id: str = Field(..., alias="GOOGLE_CLIENT_ID")
    facebook_app_id: str = Field(..., alias="FACEBOOK_APP_ID")
    facebook_app_secret: str = Field(..., alias="FACEBOOK_APP_SECRET")
    apple_client_id: str = Field(..., alias="APPLE_CLIENT_ID")
    twitter_client_id: str = Field(..., alias="TWITTER_CLIENT_ID")
    
    # Database Settings
    database_url: str = Field("sqlite:////tmp/language_app.db", alias="DATABASE_URL")
    
    # CORS Settings
    allowed_origins: List[str] = Field(["*"], alias="ALLOWED_ORIGINS")
    
    # App Settings
    app_env: str = Field("development", alias="APP_ENV")
    debug: bool = Field(False, alias="DEBUG")
    log_level: str = Field("info", alias="LOG_LEVEL")
    
    # Security Settings
    bcrypt_rounds: int = Field(12, alias="BCRYPT_ROUNDS")
    rate_limit_per_minute: int = Field(60, alias="RATE_LIMIT_PER_MINUTE")
    
    # API Settings
    api_title: str = "Language Learning API"
    api_version: str = "1.0.0"
    api_description: str = "API for managing language learning with social authentication"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )
    
    @property
    def is_production(self) -> bool:
        return self.app_env == "production"
    
    @property
    def is_development(self) -> bool:
        return self.app_env == "development"

# Global settings instance
settings = Settings()
```

## Security Middleware and Dependencies

### Rate Limiting Middleware
```python
from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
import time
from collections import defaultdict, deque
import asyncio

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Rate limiting middleware to prevent API abuse"""
    
    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.requests = defaultdict(deque)
        self.lock = asyncio.Lock()
    
    async def dispatch(self, request: Request, call_next):
        # Get client IP
        client_ip = request.client.host
        
        # Skip rate limiting for health checks
        if request.url.path in ["/health", "/docs", "/redoc", "/openapi.json"]:
            return await call_next(request)
        
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
```

### Security Headers Middleware
```python
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """Add security headers to all responses"""
    
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        # Only add HSTS in production with HTTPS
        if settings.is_production:
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        return response
```

### Enhanced Authentication Dependencies
```python
from functools import wraps
from typing import Optional, List

class AuthDependencies:
    """Enhanced authentication dependencies with additional security"""
    
    def __init__(self, jwt_manager: JWTManager):
        self.jwt_manager = jwt_manager
        self.security = HTTPBearer(auto_error=False)
    
    async def get_current_user_optional(
        self,
        credentials: Optional[HTTPAuthorizationCredentials] = Depends(self.security),
        session: Session = Depends(get_session)
    ) -> Optional[User]:
        """Get current user if authenticated, None otherwise"""
        if not credentials:
            return None
        
        try:
            return await self.get_current_user(credentials, session)
        except HTTPException:
            return None
    
    async def get_current_user(
        self,
        credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer()),
        session: Session = Depends(get_session)
    ) -> User:
        """Get current authenticated user with enhanced validation"""
        token = credentials.credentials
        
        try:
            # Verify JWT token
            payload = self.jwt_manager.verify_token(token)
            
            # Extract and validate user ID
            user_id = payload.get("sub")
            if not user_id:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token: missing user ID"
                )
            
            # Validate UUID format
            try:
                user_uuid = uuid.UUID(user_id)
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token: malformed user ID"
                )
            
            # Get user from database
            user = session.get(User, user_uuid)
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User not found"
                )
            
            # Check if user is active
            if not user.is_active:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="User account is deactivated"
                )
            
            # Validate token claims against user data
            if payload.get("email") != user.email:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Token validation failed"
                )
            
            return user
            
        except jwt.ExpiredSignatureError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has expired",
                headers={"WWW-Authenticate": "Bearer"}
            )
        except jwt.InvalidTokenError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication token",
                headers={"WWW-Authenticate": "Bearer"}
            )
    
    def require_active_user(self):
        """Dependency for routes requiring active authenticated user"""
        return Depends(self.get_current_user)
    
    def optional_user(self):
        """Dependency for routes with optional authentication"""
        return Depends(self.get_current_user_optional)

# Global auth dependencies instance
auth_deps = AuthDependencies(jwt_manager)
```

### Route Protection Helper
```python
def require_auth(func):
    """Decorator to require authentication for route handlers"""
    @wraps(func)
    async def wrapper(*args, **kwargs):
        # This would be used with dependency injection
        # The actual authentication is handled by FastAPI dependencies
        return await func(*args, **kwargs)
    return wrapper

def with_user(user_dependency=auth_deps.require_active_user()):
    """Route dependency to inject authenticated user"""
    def decorator(func):
        # Add user parameter to function signature
        func.__annotations__['current_user'] = User
        return func
    return decorator
```

## Logging and Monitoring

### Structured Logging
```python
import logging
import json
from datetime import datetime
from typing import Any, Dict

class JSONFormatter(logging.Formatter):
    """JSON formatter for structured logging"""
    
    def format(self, record: logging.LogRecord) -> str:
        log_entry = {
            "timestamp": datetime.utcnow().isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno
        }
        
        # Add extra fields
        if hasattr(record, 'user_id'):
            log_entry['user_id'] = record.user_id
        if hasattr(record, 'request_id'):
            log_entry['request_id'] = record.request_id
        if hasattr(record, 'ip_address'):
            log_entry['ip_address'] = record.ip_address
        
        # Add exception info
        if record.exc_info:
            log_entry['exception'] = self.formatException(record.exc_info)
        
        return json.dumps(log_entry)

def setup_logging():
    """Configure application logging"""
    logger = logging.getLogger()
    logger.setLevel(getattr(logging, settings.log_level.upper()))
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setFormatter(JSONFormatter())
    logger.addHandler(console_handler)
    
    # File handler for production
    if settings.is_production:
        file_handler = logging.FileHandler('/var/log/language-api.log')
        file_handler.setFormatter(JSONFormatter())
        logger.addHandler(file_handler)
    
    return logger

# Setup logger
app_logger = setup_logging()
```

### Security Event Logging
```python
class SecurityLogger:
    """Logger for security-related events"""
    
    def __init__(self, logger: logging.Logger):
        self.logger = logger
    
    def log_login_attempt(self, email: str, provider: str, success: bool, ip: str):
        """Log authentication attempts"""
        self.logger.info(
            f"Login attempt: {provider}",
            extra={
                'event_type': 'login_attempt',
                'email': email,
                'provider': provider,
                'success': success,
                'ip_address': ip
            }
        )
    
    def log_token_refresh(self, user_id: str, ip: str):
        """Log token refresh events"""
        self.logger.info(
            "Token refreshed",
            extra={
                'event_type': 'token_refresh',
                'user_id': user_id,
                'ip_address': ip
            }
        )
    
    def log_suspicious_activity(self, user_id: str, activity: str, ip: str):
        """Log suspicious activities"""
        self.logger.warning(
            f"Suspicious activity: {activity}",
            extra={
                'event_type': 'suspicious_activity',
                'user_id': user_id,
                'activity': activity,
                'ip_address': ip
            }
        )
    
    def log_security_error(self, error: str, ip: str, details: Dict[str, Any] = None):
        """Log security errors"""
        self.logger.error(
            f"Security error: {error}",
            extra={
                'event_type': 'security_error',
                'error': error,
                'ip_address': ip,
                'details': details or {}
            }
        )

# Global security logger
security_logger = SecurityLogger(app_logger)
```

## Production Security Considerations

### HTTPS Configuration
```python
# uvicorn configuration for production
# This would be in deployment scripts or docker-compose

# For production deployment
UVICORN_CONFIG = {
    "host": "0.0.0.0",
    "port": 8000,
    "ssl_keyfile": "/path/to/private.key",
    "ssl_certfile": "/path/to/certificate.crt",
    "ssl_ca_certs": "/path/to/ca-bundle.crt",
    "ssl_cert_reqs": 2  # CERT_REQUIRED
}
```

### Database Security
```python
# Enhanced database configuration for production
def get_production_database_url():
    """Get database URL with SSL configuration for production"""
    if settings.is_production:
        return (
            f"postgresql://{settings.db_user}:{settings.db_password}"
            f"@{settings.db_host}:{settings.db_port}/{settings.db_name}"
            f"?sslmode=require"
        )
    return settings.database_url

# Connection pool configuration
engine = create_engine(
    get_production_database_url(),
    pool_size=20,
    max_overflow=30,
    pool_timeout=30,
    pool_recycle=3600,  # Recycle connections every hour
    echo=settings.debug
)
```

### Secret Management
```python
import os
import hashlib
import secrets

def generate_jwt_secret() -> str:
    """Generate a secure JWT secret key"""
    return secrets.token_urlsafe(32)

def verify_environment_security():
    """Verify security of environment configuration"""
    issues = []
    
    # Check JWT secret strength
    if len(settings.jwt_secret_key) < 32:
        issues.append("JWT secret key is too short (minimum 32 characters)")
    
    # Check if using default/weak secrets
    weak_secrets = ["secret", "password", "changeme", "default"]
    if any(weak in settings.jwt_secret_key.lower() for weak in weak_secrets):
        issues.append("JWT secret key appears to be weak or default")
    
    # Check production settings
    if settings.is_production:
        if settings.debug:
            issues.append("Debug mode should be disabled in production")
        
        if "*" in settings.allowed_origins:
            issues.append("CORS should not allow all origins in production")
    
    if issues:
        for issue in issues:
            app_logger.warning(f"Security issue: {issue}")
        
        if settings.is_production:
            raise RuntimeError("Security issues found in production configuration")
    
    return len(issues) == 0

# Verify security on startup
verify_environment_security()
```

### Input Validation and Sanitization
```python
from pydantic import validator, Field
import re

class SecureBaseModel(BaseModel):
    """Base model with security enhancements"""
    
    @validator('*', pre=True)
    def strip_whitespace(cls, v):
        """Strip whitespace from string fields"""
        if isinstance(v, str):
            return v.strip()
        return v
    
    class Config:
        # Validate assignment to prevent injection
        validate_assignment = True
        # Don't allow extra fields
        extra = "forbid"

class SecureUserInput(SecureBaseModel):
    """Secure user input validation"""
    username: str = Field(..., min_length=3, max_length=50, regex=r'^[a-zA-Z0-9_]+$')
    email: str = Field(..., max_length=255)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    
    @validator('username')
    def validate_username(cls, v):
        """Validate username format"""
        if not re.match(r'^[a-zA-Z0-9_]+$', v):
            raise ValueError('Username can only contain letters, numbers, and underscores')
        return v.lower()
    
    @validator('first_name', 'last_name')
    def validate_names(cls, v):
        """Validate name fields"""
        # Remove any HTML/script tags
        import html
        v = html.escape(v)
        
        # Check for suspicious patterns
        suspicious_patterns = ['<script', 'javascript:', 'data:']
        if any(pattern in v.lower() for pattern in suspicious_patterns):
            raise ValueError('Invalid characters in name field')
        
        return v
```

## Deployment Security Checklist

### Pre-deployment Security Verification
```python
def security_checklist():
    """Security checklist for deployment"""
    checks = {
        "JWT secret configured": bool(settings.jwt_secret_key and len(settings.jwt_secret_key) >= 32),
        "HTTPS enabled": settings.is_production and "https" in settings.allowed_origins[0] if settings.allowed_origins else False,
        "Debug disabled": not settings.debug if settings.is_production else True,
        "CORS properly configured": "*" not in settings.allowed_origins if settings.is_production else True,
        "Rate limiting enabled": settings.rate_limit_per_minute > 0,
        "Logging configured": app_logger.level <= logging.INFO,
        "Social provider keys set": all([
            settings.google_client_id,
            settings.facebook_app_id,
            settings.apple_client_id,
            settings.twitter_client_id
        ])
    }
    
    passed = all(checks.values())
    
    app_logger.info("Security checklist", extra={
        'checks': checks,
        'passed': passed
    })
    
    if not passed and settings.is_production:
        failed_checks = [check for check, status in checks.items() if not status]
        raise RuntimeError(f"Security checklist failed: {failed_checks}")
    
    return passed