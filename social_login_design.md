# Social Login Endpoint Specifications

## Main Social Login Endpoint

### `/auth/social-login` - POST

#### Request Schema
```python
from pydantic import BaseModel, Field
from enum import Enum

class SocialProvider(str, Enum):
    GOOGLE = "google"
    FACEBOOK = "facebook"
    APPLE = "apple"
    TWITTER = "twitter"

class SocialLoginRequest(BaseModel):
    """Request schema for social login"""
    provider: SocialProvider
    token: str = Field(..., description="Access token or ID token from social provider")
    # Optional: Include user preferences for new accounts
    native_language_code: str | None = Field(None, description="ISO language code for native language")
    study_language_code: str | None = Field(None, description="ISO language code for study language")

class LanguagePreference(BaseModel):
    """Language preference for new user setup"""
    native_language_code: str = Field("en", description="ISO language code for native language")
    study_language_code: str = Field("es", description="ISO language code for study language")

class SocialLoginRequestWithPrefs(BaseModel):
    """Enhanced request schema with language preferences"""
    provider: SocialProvider
    token: str
    language_preferences: LanguagePreference | None = None
```

#### Response Schema
```python
class SocialLoginResponse(BaseModel):
    """Response schema for successful social login"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # Seconds until access token expires
    user: UserPublic
    is_new_user: bool = Field(description="True if this was the first login (new account created)")

class ErrorResponse(BaseModel):
    """Standard error response"""
    detail: str
    error_code: str | None = None
```

#### Endpoint Implementation
```python
@router.post("/social-login", response_model=SocialLoginResponse)
async def social_login(
    request: SocialLoginRequestWithPrefs,
    session: SessionDep,
    background_tasks: BackgroundTasks
) -> SocialLoginResponse:
    """
    Authenticate user via social login and return JWT tokens
    """
    try:
        # 1. Validate token with social provider
        user_data = await validate_social_token(request.provider, request.token)
        
        # 2. Prepare language preferences
        language_prefs = await prepare_language_preferences(
            request.language_preferences, 
            session
        )
        
        # 3. Create or get user
        user, is_new_user = await create_or_get_user_from_social(
            provider=request.provider.value,
            provider_data=user_data,
            language_preferences=language_prefs,
            session=session
        )
        
        # 4. Generate JWT tokens
        access_token = jwt_manager.create_access_token(user)
        refresh_token = jwt_manager.create_refresh_token(user)
        
        # 5. Update last login
        user.last_login = datetime.utcnow()
        session.add(user)
        session.commit()
        
        # 6. Background tasks (analytics, welcome email, etc.)
        if is_new_user:
            background_tasks.add_task(send_welcome_notification, user.email)
        
        return SocialLoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=3600,  # 1 hour
            user=UserPublic.model_validate(user),
            is_new_user=is_new_user
        )
        
    except InvalidSocialTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid {request.provider.value} token: {str(e)}"
        )
    except SocialProviderError as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Error communicating with {request.provider.value}: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Social login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during authentication"
        )
```

## Provider-Specific Token Validation

### Social Token Validator
```python
import httpx
from abc import ABC, abstractmethod

class SocialTokenValidator(ABC):
    """Abstract base class for social token validators"""
    
    @abstractmethod
    async def validate_token(self, token: str) -> dict:
        """Validate token and return user data"""
        pass

class GoogleTokenValidator(SocialTokenValidator):
    """Google OAuth 2.0 token validator"""
    
    VERIFY_URL = "https://oauth2.googleapis.com/tokeninfo"
    USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"
    
    async def validate_token(self, token: str) -> dict:
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
                    if token_info.get("aud") != settings.GOOGLE_CLIENT_ID:
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
    
    async def validate_token(self, token: str) -> dict:
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
    
    async def validate_token(self, token: str) -> dict:
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
                audience=settings.APPLE_CLIENT_ID,
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
    
    async def validate_token(self, token: str) -> dict:
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

# Validator factory
VALIDATORS = {
    SocialProvider.GOOGLE: GoogleTokenValidator(),
    SocialProvider.FACEBOOK: FacebookTokenValidator(),
    SocialProvider.APPLE: AppleTokenValidator(),
    SocialProvider.TWITTER: TwitterTokenValidator(),
}

async def validate_social_token(provider: SocialProvider, token: str) -> dict:
    """Validate social token and return user data"""
    validator = VALIDATORS.get(provider)
    if not validator:
        raise ValueError(f"Unsupported provider: {provider}")
    
    return await validator.validate_token(token)
```

## Additional Authentication Endpoints

### Token Refresh Endpoint
```python
@router.post("/refresh", response_model=TokenRefreshResponse)
async def refresh_token(
    refresh_request: RefreshTokenRequest,
    session: SessionDep
) -> TokenRefreshResponse:
    """
    Refresh access token using refresh token
    """
    try:
        # Verify refresh token
        payload = jwt_manager.verify_token(refresh_request.refresh_token)
        
        # Check if it's a refresh token
        if payload.get("type") != "refresh":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Get user
        user_id = uuid.UUID(payload["sub"])
        user = session.get(User, user_id)
        
        if not user or not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive"
            )
        
        # Generate new access token
        access_token = jwt_manager.create_access_token(user)
        
        return TokenRefreshResponse(
            access_token=access_token,
            expires_in=3600
        )
        
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

class RefreshTokenRequest(BaseModel):
    refresh_token: str
```

### Logout Endpoint
```python
@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user)
) -> dict:
    """
    Logout user (client should discard tokens)
    """
    # Note: With stateless JWT, we can't truly invalidate tokens
    # Client must discard tokens. For true revocation, we'd need
    # a token blacklist or shorter token expiration times.
    
    # Update last logout time for analytics
    current_user.last_login = None  # Or add last_logout field
    session.add(current_user)
    session.commit()
    
    return {"message": "Successfully logged out"}
```

### User Profile Endpoint
```python
@router.get("/me", response_model=UserWithProvider)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
) -> UserWithProvider:
    """
    Get current user profile with social provider info
    """
    # Get primary provider (most recently used)
    primary_provider = None
    if current_user.social_accounts:
        # Sort by created_at desc and get first
        sorted_accounts = sorted(
            current_user.social_accounts, 
            key=lambda x: x.created_at, 
            reverse=True
        )
        primary_provider = sorted_accounts[0].provider
    
    user_data = UserWithProvider.model_validate(current_user)
    user_data.primary_provider = primary_provider
    
    return user_data
```

## Error Handling

### Custom Exceptions
```python
class SocialAuthError(Exception):
    """Base exception for social authentication errors"""
    pass

class InvalidSocialTokenError(SocialAuthError):
    """Token is invalid or expired"""
    pass

class SocialProviderError(SocialAuthError):
    """Error communicating with social provider"""
    pass

class UserCreationError(SocialAuthError):
    """Error creating user account"""
    pass

# Global exception handlers
@app.exception_handler(InvalidSocialTokenError)
async def invalid_token_handler(request: Request, exc: InvalidSocialTokenError):
    return JSONResponse(
        status_code=401,
        content={"detail": str(exc), "error_code": "INVALID_SOCIAL_TOKEN"}
    )

@app.exception_handler(SocialProviderError)
async def provider_error_handler(request: Request, exc: SocialProviderError):
    return JSONResponse(
        status_code=502,
        content={"detail": str(exc), "error_code": "SOCIAL_PROVIDER_ERROR"}
    )
```

## Helper Functions

### Language Preference Setup
```python
async def prepare_language_preferences(
    preferences: LanguagePreference | None,
    session: Session
) -> dict:
    """
    Prepare language preferences with default fallbacks
    """
    if not preferences:
        preferences = LanguagePreference()
    
    # Get language IDs from codes
    native_lang = session.exec(
        select(Language).where(Language.code == preferences.native_language_code)
    ).first()
    
    study_lang = session.exec(
        select(Language).where(Language.code == preferences.study_language_code)
    ).first()
    
    if not native_lang:
        # Default to English
        native_lang = session.exec(
            select(Language).where(Language.code == "en")
        ).first()
    
    if not study_lang:
        # Default to Spanish
        study_lang = session.exec(
            select(Language).where(Language.code == "es")
        ).first()
    
    if not native_lang or not study_lang:
        raise UserCreationError("Required default languages not found in database")
    
    return {
        "native_language_id": native_lang.id,
        "study_language_id": study_lang.id
    }

async def send_welcome_notification(email: str):
    """Background task to send welcome notification"""
    # Implementation for welcome email/notification
    logger.info(f"Sending welcome notification to {email}")
```

## Router Setup

### Authentication Router
```python
from fastapi import APIRouter

auth_router = APIRouter(
    prefix="/auth",
    tags=["authentication"],
    responses={
        401: {"description": "Authentication failed"},
        502: {"description": "Social provider error"}
    }
)

auth_router.post("/social-login")(social_login)
auth_router.post("/refresh")(refresh_token)
auth_router.post("/logout")(logout)
auth_router.get("/me")(get_current_user_profile)