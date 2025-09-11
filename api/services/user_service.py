import uuid
import json
import re
from typing import Tuple, Dict
from datetime import datetime
from sqlmodel import Session, select
from models import User, SocialAccount, Language
from auth.social_validators import validate_social_token

class UserService:
    """Service for user-related operations"""
    
    def __init__(self, session: Session):
        self.session = session
    
    async def create_or_get_user_from_social(
        self,
        provider: str,
        token: str,
        language_preferences: Dict = None
    ) -> Tuple[User, bool]:
        """
        Create new user or return existing user from social login
        Returns (user, is_new_user)
        """
        # 1. Validate token with social provider
        provider_data = await validate_social_token(provider, token)
        
        # 2. Check if social account already exists
        existing_social = self.session.exec(
            select(SocialAccount).where(
                SocialAccount.provider == provider,
                SocialAccount.provider_user_id == provider_data['id']
            )
        ).first()
        
        if existing_social:
            # Update last login and return existing user
            existing_social.user.last_login = datetime.utcnow()
            self.session.add(existing_social.user)
            self.session.commit()
            return existing_social.user, False
        
        # 3. Check if user with email exists (link social account)
        if provider_data.get('email'):
            existing_user = self.session.exec(
                select(User).where(User.email == provider_data['email'])
            ).first()
            
            if existing_user:
                # Link new social account to existing user
                social_account = SocialAccount(
                    user_id=existing_user.id,
                    provider=provider,
                    provider_user_id=provider_data['id'],
                    provider_email=provider_data['email'],
                    provider_username=provider_data.get('username'),
                    provider_name=provider_data.get('name'),
                    raw_data=json.dumps(provider_data)
                )
                self.session.add(social_account)
                existing_user.last_login = datetime.utcnow()
                self.session.add(existing_user)
                self.session.commit()
                return existing_user, False
        
        # 4. Create new user
        username = await self._generate_unique_username(provider_data)
        language_prefs = await self._prepare_language_preferences(language_preferences or {})
        
        user_data = {
            'email': provider_data.get('email', f"{username}@{provider}.local"),
            'first_name': provider_data.get('given_name', ''),
            'last_name': provider_data.get('family_name', ''),
            'username': username,
            'profile_picture_url': provider_data.get('picture'),
            'last_login': datetime.utcnow(),
            **language_prefs
        }
        
        user = User(**user_data)
        self.session.add(user)
        self.session.flush()  # Get user.id
        
        # 5. Create social account record
        social_account = SocialAccount(
            user_id=user.id,
            provider=provider,
            provider_user_id=provider_data['id'],
            provider_email=provider_data.get('email'),
            provider_username=provider_data.get('username'),
            provider_name=provider_data.get('name'),
            raw_data=json.dumps(provider_data)
        )
        self.session.add(social_account)
        self.session.commit()
        self.session.refresh(user)
        
        return user, True
    
    async def _generate_unique_username(self, provider_data: Dict) -> str:
        """Generate a unique username from social provider data"""
        base_username = (
            provider_data.get('username') or 
            provider_data.get('email', '').split('@')[0] or
            f"{provider_data.get('given_name', '')}_{provider_data.get('family_name', '')}"
        ).lower().replace(' ', '_')
        
        # Remove special characters
        base_username = re.sub(r'[^a-z0-9_]', '', base_username)
        
        # Ensure minimum length
        if len(base_username) < 3:
            base_username = f"user_{base_username}"
        
        # Check for uniqueness and append number if needed
        counter = 0
        username = base_username
        while self.session.exec(select(User).where(User.username == username)).first():
            counter += 1
            username = f"{base_username}_{counter}"
        
        return username
    
    async def _prepare_language_preferences(self, preferences: Dict) -> Dict:
        """Prepare language preferences with default fallbacks"""
        native_code = preferences.get('native_language_code', 'en')
        study_code = preferences.get('study_language_code', 'es')
        
        # Get language IDs from codes
        native_lang = self.session.exec(
            select(Language).where(Language.code == native_code)
        ).first()
        
        study_lang = self.session.exec(
            select(Language).where(Language.code == study_code)
        ).first()
        
        if not native_lang:
            # Default to English
            native_lang = self.session.exec(
                select(Language).where(Language.code == "en")
            ).first()
        
        if not study_lang:
            # Default to Spanish  
            study_lang = self.session.exec(
                select(Language).where(Language.code == "es")
            ).first()
        
        if not native_lang or not study_lang:
            raise ValueError("Required default languages not found in database")
        
        return {
            "native_language_id": native_lang.id,
            "study_language_id": study_lang.id
        }