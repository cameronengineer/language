import uuid
import json
import re
from typing import Tuple, Dict
from datetime import datetime
from sqlmodel import Session, select
from models import User, Language
from auth.social_validators import validate_social_token

class UserService:
    """Service for user-related operations"""
    
    def __init__(self, session: Session):
        self.session = session
    
    async def create_or_get_user_from_social(
        self,
        provider: str,
        token: str
    ) -> Tuple[User, bool]:
        """
        Create new user or return existing user from social login
        Returns (user, is_new_user)
        """
        # 1. Validate token with social provider
        provider_data = await validate_social_token(provider, token)
        
        # 2. Check if user already exists with this provider and provider_user_id
        existing_user = self.session.exec(
            select(User).where(
                User.provider == provider,
                User.provider_user_id == provider_data['id']
            )
        ).first()
        
        if existing_user:
            # Update last login and return existing user
            existing_user.last_login = datetime.utcnow()
            self.session.add(existing_user)
            self.session.commit()
            return existing_user, False
        
        # 3. Create new user (no account linking - one provider per user)
        username = await self._generate_unique_username(provider_data)
        
        # Get default language IDs (English native, Spanish study)
        english_lang = self.session.exec(select(Language).where(Language.code == "en")).first()
        spanish_lang = self.session.exec(select(Language).where(Language.code == "es")).first()
        
        if not english_lang or not spanish_lang:
            raise ValueError("Required default languages (English and Spanish) not found in database")
        
        user_data = {
            'email': provider_data.get('email', f"{username}@{provider}.local"),
            'first_name': provider_data.get('given_name', ''),
            'last_name': provider_data.get('family_name', ''),
            'username': username,
            'profile_picture_url': provider_data.get('picture'),
            'last_login': datetime.utcnow(),
            'provider': provider,
            'provider_user_id': provider_data['id'],
            'provider_email': provider_data.get('email'),
            'provider_username': provider_data.get('username'),
            'provider_name': provider_data.get('name'),
            'raw_data': json.dumps(provider_data),
            'native_language_id': english_lang.id,
            'study_language_id': spanish_lang.id
        }
        
        user = User(**user_data)
        self.session.add(user)
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
    