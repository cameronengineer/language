from datetime import datetime, timedelta, timezone
import jwt
from typing import Dict, Any
from fastapi import HTTPException, status
from core.config import settings

class JWTManager:
    def __init__(self):
        self.secret_key = settings.jwt_secret_key
        self.algorithm = settings.jwt_algorithm
        self.access_token_expire_minutes = settings.jwt_access_token_expire_minutes
        self.refresh_token_expire_days = settings.jwt_refresh_token_expire_days
        self.issuer = "language-learning-api"
        self.audience = "language-learning-app"
    
    def create_access_token(self, user) -> str:
        """Create JWT access token for user"""
        expire = datetime.now(timezone.utc) + timedelta(minutes=self.access_token_expire_minutes)
        
        # Get user's language codes
        native_lang_code = user.native_language.code if user.native_language else None
        study_lang_code = user.study_language.code if user.study_language else None
        
        payload = {
            # Standard claims
            "sub": str(user.id),
            "iat": datetime.now(timezone.utc),
            "exp": expire,
            "iss": self.issuer,
            "aud": self.audience,
            
            # Custom claims
            "username": user.username,
            "email": user.email,
            "is_active": user.is_active,
            "native_lang": native_lang_code,
            "study_lang": study_lang_code,
            "scopes": ["user", "study"]
        }
        
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def create_refresh_token(self, user) -> str:
        """Create JWT refresh token for user"""
        expire = datetime.now(timezone.utc) + timedelta(days=self.refresh_token_expire_days)
        
        payload = {
            "sub": str(user.id),
            "iat": datetime.now(timezone.utc),
            "exp": expire,
            "iss": self.issuer,
            "aud": self.audience,
            "type": "refresh"
        }
        
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def verify_token(self, token: str) -> Dict[str, Any]:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(
                token, 
                self.secret_key, 
                algorithms=[self.algorithm],
                audience=self.audience,
                issuer=self.issuer
            )
            return payload
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

# Global JWT manager instance
jwt_manager = JWTManager()