from pydantic import BaseModel, Field
from enum import Enum
from models import UserPublic

class SocialProvider(str, Enum):
    GOOGLE = "google"
    FACEBOOK = "facebook"
    APPLE = "apple"
    TWITTER = "twitter"
    MOCK = "mock"  # For testing


class SimpleSocialLoginRequest(BaseModel):
    """Simplified request schema for social login"""
    provider: SocialProvider
    token: str = Field(..., description="Access token or ID token from social provider")

class TokenResponse(BaseModel):
    """Response schema for successful social login"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # Seconds until access token expires
    user: UserPublic
    is_new_user: bool = Field(description="True if this was the first login")

class RefreshTokenRequest(BaseModel):
    """Request schema for token refresh"""
    refresh_token: str

class TokenRefreshResponse(BaseModel):
    """Response schema for token refresh"""
    access_token: str
    token_type: str = "bearer"
    expires_in: int

class UserWithProvider(UserPublic):
    """User with social provider info"""
    provider: str
    provider_username: str | None = None
    provider_name: str | None = None