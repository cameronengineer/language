import httpx
import jwt
import json
from abc import ABC, abstractmethod
from typing import Dict
from fastapi import HTTPException, status
from core.config import settings

class SocialTokenValidationError(Exception):
    """Base exception for social token validation errors"""
    pass

class InvalidSocialTokenError(SocialTokenValidationError):
    """Token is invalid or expired"""
    pass

class SocialProviderError(SocialTokenValidationError):
    """Error communicating with social provider"""
    pass

class SocialTokenValidator(ABC):
    """Abstract base class for social token validators"""
    
    @abstractmethod
    async def validate_token(self, token: str) -> Dict:
        """Validate token and return user data"""
        pass

class GoogleTokenValidator(SocialTokenValidator):
    """Google OAuth 2.0 token validator"""
    
    VERIFY_URL = "https://oauth2.googleapis.com/tokeninfo"
    USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
    
    async def validate_token(self, token: str) -> Dict:
        """Validate Google ID token or access token"""
        async with httpx.AsyncClient() as client:
            # Try ID token verification first
            try:
                response = await client.get(
                    self.VERIFY_URL,
                    params={"id_token": token},
                    timeout=10.0
                )
                if response.status_code == 200:
                    token_info = response.json()
                    # Verify audience (client ID)
                    if token_info.get("aud") != settings.google_client_id:
                        raise InvalidSocialTokenError("Invalid Google client ID")
                    
                    return {
                        "id": token_info["sub"],
                        "email": token_info["email"],
                        "given_name": token_info.get("given_name", ""),
                        "family_name": token_info.get("family_name", ""),
                        "name": token_info.get("name", ""),
                        "picture": token_info.get("picture"),
                        "email_verified": token_info.get("email_verified", False)
                    }
            except httpx.RequestError:
                pass
            
            # Try access token
            response = await client.get(
                self.USERINFO_URL,
                headers={"Authorization": f"Bearer {token}"},
                timeout=10.0
            )
            
            if response.status_code != 200:
                raise InvalidSocialTokenError("Invalid Google token")
            
            user_data = response.json()
            return {
                "id": user_data["id"],
                "email": user_data["email"],
                "given_name": user_data.get("given_name", ""),
                "family_name": user_data.get("family_name", ""),
                "name": user_data.get("name", ""),
                "picture": user_data.get("picture"),
                "email_verified": user_data.get("verified_email", False)
            }

class FacebookTokenValidator(SocialTokenValidator):
    """Facebook token validator"""
    
    VERIFY_URL = "https://graph.facebook.com/me"
    
    async def validate_token(self, token: str) -> Dict:
        """Validate Facebook access token"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                self.VERIFY_URL,
                params={
                    "access_token": token,
                    "fields": "id,email,first_name,last_name,name,picture"
                },
                timeout=10.0
            )
            
            if response.status_code != 200:
                raise InvalidSocialTokenError("Invalid Facebook token")
            
            user_data = response.json()
            return {
                "id": user_data["id"],
                "email": user_data.get("email"),
                "given_name": user_data.get("first_name", ""),
                "family_name": user_data.get("last_name", ""),
                "name": user_data.get("name", ""),
                "picture": user_data.get("picture", {}).get("data", {}).get("url"),
                "email_verified": True  # Facebook emails are verified
            }

class AppleTokenValidator(SocialTokenValidator):
    """Apple Sign In token validator"""
    
    APPLE_KEYS_URL = "https://appleid.apple.com/auth/keys"
    
    async def validate_token(self, token: str) -> Dict:
        """Validate Apple ID token (JWT)"""
        try:
            # Decode header to get key ID
            header = jwt.get_unverified_header(token)
            kid = header.get("kid")
            
            # Get Apple's public keys
            async with httpx.AsyncClient() as client:
                response = await client.get(self.APPLE_KEYS_URL, timeout=10.0)
                if response.status_code != 200:
                    raise SocialProviderError("Could not fetch Apple public keys")
                
                keys = response.json()["keys"]
                
            # Find matching key
            public_key = None
            for key in keys:
                if key["kid"] == kid:
                    public_key = jwt.algorithms.RSAAlgorithm.from_jwk(key)
                    break
            
            if not public_key:
                raise InvalidSocialTokenError("Could not find Apple public key")
            
            # Verify token
            payload = jwt.decode(
                token,
                public_key,
                algorithms=["RS256"],
                audience=settings.apple_client_id,
                issuer="https://appleid.apple.com"
            )
            
            return {
                "id": payload["sub"],
                "email": payload.get("email"),
                "given_name": payload.get("given_name", ""),
                "family_name": payload.get("family_name", ""),
                "name": f"{payload.get('given_name', '')} {payload.get('family_name', '')}".strip(),
                "email_verified": payload.get("email_verified", False)
            }
            
        except jwt.InvalidTokenError as e:
            raise InvalidSocialTokenError(f"Invalid Apple token: {str(e)}")

class TwitterTokenValidator(SocialTokenValidator):
    """Twitter OAuth 2.0 token validator"""
    
    VERIFY_URL = "https://api.twitter.com/2/users/me"
    
    async def validate_token(self, token: str) -> Dict:
        """Validate Twitter Bearer token"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                self.VERIFY_URL,
                headers={"Authorization": f"Bearer {token}"},
                params={
                    "user.fields": "id,username,name,email,profile_image_url"
                },
                timeout=10.0
            )
            
            if response.status_code != 200:
                raise InvalidSocialTokenError("Invalid Twitter token")
            
            user_data = response.json()["data"]
            return {
                "id": user_data["id"],
                "email": user_data.get("email"),  # Requires special permission
                "username": user_data["username"],
                "name": user_data["name"],
                "picture": user_data.get("profile_image_url"),
                "email_verified": True if user_data.get("email") else False
            }

class MockSocialTokenValidator(SocialTokenValidator):
    """Mock validator for development/testing"""
    
    async def validate_token(self, token: str) -> Dict:
        """Mock validation - returns test user data"""
        if token == "invalid":
            raise InvalidSocialTokenError("Invalid token")
        
        return {
            "id": "test_user_123",
            "email": "test@example.com",
            "given_name": "Test",
            "family_name": "User",
            "name": "Test User",
            "picture": "https://example.com/avatar.jpg",
            "email_verified": True
        }

# Validator registry
VALIDATORS = {
    "google": GoogleTokenValidator(),
    "facebook": FacebookTokenValidator(),
    "apple": AppleTokenValidator(),
    "twitter": TwitterTokenValidator(),
    "mock": MockSocialTokenValidator(),  # For testing
}

async def validate_social_token(provider: str, token: str) -> Dict:
    """Validate social token and return user data"""
    validator = VALIDATORS.get(provider)
    if not validator:
        raise ValueError(f"Unsupported provider: {provider}")
    
    return await validator.validate_token(token)