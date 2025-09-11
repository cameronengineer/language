# User Model Design for Social Authentication Only

## Modified User Model (Social Login Only)

### Enhanced User Table
```python
class UserBase(SQLModel):
    """Base class for User with shared fields"""
    username: str = Field(index=True, unique=True, description="Unique username")
    email: str = Field(index=True, unique=True, description="User email address")
    first_name: str = Field(description="User's first name")
    last_name: str = Field(description="User's last name")
    native_language_id: uuid.UUID = Field(foreign_key="languages.id", description="ID of user's native language")
    study_language_id: uuid.UUID = Field(foreign_key="languages.id", description="ID of user's study language")
    
    # New fields for social authentication only
    is_active: bool = Field(default=True, description="User account status")
    email_verified: bool = Field(default=True, description="Email verification (always true for social)")
    profile_picture_url: str | None = Field(default=None, description="User profile picture URL from social provider")
    
    # Timestamps
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Account creation timestamp")
    last_login: datetime | None = Field(default=None, description="Last login timestamp")

class User(UserBase, table=True):
    """User table model"""
    __tablename__ = "users"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    
    # Existing relationships
    native_language: "Language" = Relationship(back_populates="native_speakers", sa_relationship_kwargs={"foreign_keys": "[User.native_language_id]"})
    study_language: "Language" = Relationship(back_populates="study_speakers", sa_relationship_kwargs={"foreign_keys": "[User.study_language_id]"})
    translations: List["Translation"] = Relationship(back_populates="user")
    study_sessions: List["StudySession"] = Relationship(back_populates="user")
    
    # New relationships
    social_accounts: List["SocialAccount"] = Relationship(back_populates="user", cascade_delete=True)
```

## New SocialAccount Model

### Social Account Table
```python
from sqlalchemy import UniqueConstraint
from datetime import datetime
import json

class SocialAccountBase(SQLModel):
    """Base class for SocialAccount"""
    provider: str = Field(description="Social provider name (google, facebook, apple, twitter)")
    provider_user_id: str = Field(description="User ID from the social provider")
    provider_email: str | None = Field(default=None, description="Email from social provider")
    provider_username: str | None = Field(default=None, description="Username from social provider")
    provider_name: str | None = Field(default=None, description="Display name from social provider")
    raw_data: str | None = Field(default=None, description="JSON of additional provider data")
    
    # Relationships
    user_id: uuid.UUID = Field(foreign_key="users.id", description="ID of associated user")

class SocialAccount(SocialAccountBase, table=True):
    """SocialAccount table model"""
    __tablename__ = "social_accounts"
    
    id: uuid.UUID = Field(default_factory=uuid.uuid4, primary_key=True)
    created_at: datetime = Field(default_factory=datetime.utcnow, description="Account link timestamp")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="Last update timestamp")
    
    # Relationships
    user: User = Relationship(back_populates="social_accounts")
    
    # Unique constraint on provider + provider_user_id
    __table_args__ = (
        UniqueConstraint('provider', 'provider_user_id', name='unique_provider_user'),
    )

# Pydantic models for API
class SocialAccountPublic(SQLModel):
    """Public schema for reading SocialAccount"""
    id: uuid.UUID
    provider: str
    provider_username: str | None
    provider_name: str | None
    created_at: datetime
```

## User Creation Logic (Social Only)

### Social Login Flow
```python
async def create_or_get_user_from_social(
    provider: str,
    provider_data: dict,
    language_preferences: dict
) -> User:
    """
    Create new user account or return existing user from social login
    """
    # 1. Check if social account already exists
    existing_social = session.exec(
        select(SocialAccount).where(
            SocialAccount.provider == provider,
            SocialAccount.provider_user_id == provider_data['id']
        )
    ).first()
    
    if existing_social:
        # Update last login and return existing user
        existing_social.user.last_login = datetime.utcnow()
        session.add(existing_social.user)
        session.commit()
        return existing_social.user
    
    # 2. Check if user with email exists (link social account)
    existing_user = session.exec(
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
        session.add(social_account)
        existing_user.last_login = datetime.utcnow()
        session.add(existing_user)
        session.commit()
        return existing_user
    
    # 3. Create new user
    user_data = {
        'email': provider_data['email'],
        'first_name': provider_data.get('given_name', provider_data.get('first_name', '')),
        'last_name': provider_data.get('family_name', provider_data.get('last_name', '')),
        'username': await generate_unique_username(provider_data),
        'profile_picture_url': provider_data.get('picture'),
        'last_login': datetime.utcnow(),
        **language_preferences
    }
    
    user = User(**user_data)
    session.add(user)
    session.flush()  # Get user.id
    
    # 4. Create social account record
    social_account = SocialAccount(
        user_id=user.id,
        provider=provider,
        provider_user_id=provider_data['id'],
        provider_email=provider_data['email'],
        provider_username=provider_data.get('username'),
        provider_name=provider_data.get('name'),
        raw_data=json.dumps(provider_data)
    )
    session.add(social_account)
    session.commit()
    session.refresh(user)
    
    return user

async def generate_unique_username(provider_data: dict) -> str:
    """Generate a unique username from social provider data"""
    base_username = (
        provider_data.get('username') or 
        provider_data.get('email', '').split('@')[0] or
        f"{provider_data.get('given_name', '')}_{provider_data.get('family_name', '')}"
    ).lower().replace(' ', '_')
    
    # Remove special characters
    import re
    base_username = re.sub(r'[^a-z0-9_]', '', base_username)
    
    # Ensure minimum length
    if len(base_username) < 3:
        base_username = f"user_{base_username}"
    
    # Check for uniqueness and append number if needed
    counter = 0
    username = base_username
    while session.exec(select(User).where(User.username == username)).first():
        counter += 1
        username = f"{base_username}_{counter}"
    
    return username
```

## Database Migration

### Migration Steps
1. Add new columns to existing users table:
   - `is_active: bool DEFAULT true`
   - `email_verified: bool DEFAULT true` 
   - `profile_picture_url: text NULL`
   - `created_at: timestamp DEFAULT CURRENT_TIMESTAMP`
   - `last_login: timestamp NULL`

2. Create new social_accounts table

3. Backfill existing users:
   - Set all existing users to `is_active=true`, `email_verified=true`
   - Set `created_at` to current timestamp for existing users

### Indexes for Performance
```sql
-- Social account lookups
CREATE INDEX idx_social_accounts_provider_user_id ON social_accounts(provider, provider_user_id);
CREATE INDEX idx_social_accounts_user_id ON social_accounts(user_id);
CREATE INDEX idx_social_accounts_provider_email ON social_accounts(provider_email);

-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_is_active ON users(is_active);
```

## Updated Pydantic Models

### Enhanced User Schemas
```python
class UserCreate(SQLModel):
    """Schema for creating a User (not used directly - users created via social login)"""
    first_name: str
    last_name: str
    native_language_id: uuid.UUID
    study_language_id: uuid.UUID

class UserPublic(UserBase):
    """Public schema for reading a User"""
    id: uuid.UUID
    social_accounts: List[SocialAccountPublic] = []

class UserUpdate(SQLModel):
    """Schema for updating a User"""
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    native_language_id: uuid.UUID | None = None
    study_language_id: uuid.UUID | None = None
    profile_picture_url: str | None = None

class UserWithProvider(UserPublic):
    """User with linked social provider info"""
    primary_provider: str | None = None  # Most recently used provider