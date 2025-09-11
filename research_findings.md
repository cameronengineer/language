# JWT Authentication Research Findings

## Current Architecture Analysis

### Existing Structure
- **Framework**: FastAPI with SQLModel/SQLAlchemy
- **Database**: SQLite with UUID primary keys
- **User Model**: Basic user with username, email, names, and language preferences
- **Route Structure**: Modular routers with dependency injection
- **Current State**: No authentication - all endpoints are open

### User Model Current Fields
```python
- id: UUID (primary key)
- username: str (unique)
- email: str (unique) 
- first_name: str
- last_name: str
- native_language_id: UUID (foreign key)
- study_language_id: UUID (foreign key)
```

## FastAPI JWT Patterns (from official docs)

### Recommended Libraries
- **JWT Library**: PyJWT (as used in FastAPI docs)
- **Password Hashing**: passlib with bcrypt
- **Security Module**: fastapi.security.OAuth2PasswordBearer

### Authentication Flow Pattern
1. Client requests token via `/token` endpoint
2. Server validates credentials and returns JWT
3. Client includes JWT in Authorization header: `Bearer <token>`
4. Server validates JWT on protected routes using dependencies

### Key Components
- **OAuth2PasswordBearer**: Token URL and extraction
- **Security Dependencies**: `Depends(get_current_user)` pattern
- **JWT Structure**: Standard claims (sub, exp, iat)
- **Error Handling**: 401 Unauthorized with WWW-Authenticate header

## Social Login Integration Patterns

### Supported Providers
- Google OAuth 2.0
- Facebook Login
- Apple Sign In  
- X/Twitter OAuth 2.0

### Social Login Flow
1. **Client Side**: User authenticates with social provider
2. **Token Exchange**: Client sends social token to API
3. **Token Validation**: API validates social token with provider
4. **User Resolution**: Create or find existing user
5. **JWT Generation**: Return our JWT token

### Provider-Specific Validation
- **Google**: Validate ID token using Google's token validation endpoint
- **Facebook**: Validate access token using Facebook Graph API
- **Apple**: Validate JWT ID token using Apple's public keys
- **X/Twitter**: Validate using OAuth 2.0 Bearer Token Authentication

## Required Dependencies
```
pyjwt==2.8.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6  # Already included
httpx==0.26.0  # Already included for social token validation