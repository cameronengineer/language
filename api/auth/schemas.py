from pydantic import BaseModel, Field
from enum import Enum
from models import UserPublic

class SocialProvider(str, Enum):
    GOOGLE = "google"
    FACEBOOK = "facebook"
    APPLE = "apple"
    TWITTER = "twitter"

class LanguagePreference(BaseModel):
    """Language preference for new user setup"""
    native_language_code: str = Field("en", description="ISO language code for native language")
    study_language_code: str = Field("es", description="ISO language code for study language")

class SocialLoginRequest(BaseModel):
    """Request schema for social login"""
    provider: SocialProvider
    token: str = Field(..., description="Access token or ID token from social provider")
    language_preferences: LanguagePreference | None = None

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
    """User with linked social provider info"""
    primary_provider: str | None = None  # Most recently used provider