import uuid
from fastapi import APIRouter, HTTPException, status, Depends
from sqlmodel import Session
from database import get_session
from models import User
from auth.schemas import (
    SimpleSocialLoginRequest, TokenResponse, RefreshTokenRequest,
    TokenRefreshResponse, UserWithProvider
)
from auth.jwt_manager import jwt_manager
from auth.dependencies import get_current_user
from auth.social_validators import InvalidSocialTokenError, SocialProviderError
from services.user_service import UserService
import logging

logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/auth",
    tags=["authentication"],
    responses={
        401: {"description": "Authentication failed"},
        502: {"description": "Social provider error"}
    }
)

@router.post("/social-login", response_model=TokenResponse)
async def social_login(
    request: SimpleSocialLoginRequest,
    session: Session = Depends(get_session)
) -> TokenResponse:
    """
    Authenticate user via social login and return JWT tokens
    """
    try:
        # Create user service
        user_service = UserService(session)
        
        # Create or get user
        user, is_new_user = await user_service.create_or_get_user_from_social(
            provider=request.provider.value,
            token=request.token
        )
        
        # Generate JWT tokens
        access_token = jwt_manager.create_access_token(user)
        refresh_token = jwt_manager.create_refresh_token(user)
        
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=3600,  # 1 hour
            user=user,
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

@router.post("/refresh", response_model=TokenRefreshResponse)
async def refresh_token(
    refresh_request: RefreshTokenRequest,
    session: Session = Depends(get_session)
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
        
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )

@router.post("/logout")
async def logout(
    current_user: User = Depends(get_current_user)
) -> dict:
    """
    Logout user (client should discard tokens)
    """
    logger.info(f"User {current_user.email} logged out")
    return {"message": "Successfully logged out"}

@router.get("/me", response_model=UserWithProvider)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user)
) -> UserWithProvider:
    """
    Get current user profile with social provider info
    """
    return UserWithProvider.model_validate(current_user)
