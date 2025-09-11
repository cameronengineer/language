# JWT Authentication System Deployment Guide

## Pre-Deployment Checklist

### 1. Install Dependencies
```bash
cd api
pip install -r requirements.txt
```

### 2. Generate Secure JWT Secret
```bash
# Generate a secure 256-bit secret key
openssl rand -hex 32
```

### 3. Configure Environment Variables
Copy `.env.production` to `.env` and update:
- `JWT_SECRET_KEY`: Use the generated secret from step 2
- Social provider credentials (Google, Facebook, Apple, Twitter)
- Database URL for production
- Allowed origins for CORS

### 4. Run Database Migration
```bash
python migrate_auth.py
```

### 5. Test the System
```bash
python test_auth_system.py
```

## Production Deployment

### Using Docker (Recommended)

1. **Build the container:**
```bash
docker build -t language-api .
```

2. **Run with environment file:**
```bash
docker run -d \
  --name language-api \
  --env-file .env.production \
  -p 8000:8000 \
  language-api
```

### Using Docker Compose

1. **Use the provided docker-compose.yml:**
```bash
docker-compose up -d
```

### Manual Deployment

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Run with production settings:**
```bash
APP_ENV=production uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

## Security Verification

### Required Security Features ✅
- [x] JWT token authentication
- [x] Social login (Google, Facebook, Apple, Twitter)
- [x] Rate limiting (30 requests/minute in production)
- [x] Security headers (XSS, CSRF protection)
- [x] CORS properly configured
- [x] Input validation and sanitization
- [x] Route protection on all endpoints
- [x] User data isolation (users can only access their own data)

### Production Security Checklist
- [ ] HTTPS/SSL certificates configured
- [ ] JWT secret key is cryptographically secure (256-bit)
- [ ] Social provider credentials are production keys
- [ ] Database uses SSL/TLS encryption
- [ ] CORS origins are restricted to your domains
- [ ] Rate limiting is enabled
- [ ] Monitoring and logging are configured

## API Endpoints

### Authentication Endpoints
- `POST /auth/social-login` - Social media authentication
- `POST /auth/refresh` - Refresh JWT token
- `POST /auth/logout` - Logout user
- `GET /auth/me` - Get current user profile

### Protected Endpoints
All existing endpoints now require JWT authentication:
- `/users/*` - User management
- `/translations/*` - Translation management
- `/terms/*` - Term management
- `/languages/*` - Language management
- `/types/*` - Type management
- `/catalogues/*` - Catalogue management
- `/study-sessions/*` - Study session management

### Public Endpoints
- `GET /` - API information
- `GET /health` - Health check
- `GET /docs` - API documentation

## Social Login Integration

### For Mobile Apps (React Native)

```javascript
// Example Google login integration
import { GoogleSignin } from '@react-native-google-signin/google-signin';

const signInWithGoogle = async () => {
  try {
    const userInfo = await GoogleSignin.signIn();
    const idToken = userInfo.idToken;
    
    // Send to your API
    const response = await fetch('https://your-api.com/auth/social-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'google',
        token: idToken,
        language_preferences: {
          native_language_code: 'en',
          study_language_code: 'es'
        }
      })
    });
    
    const data = await response.json();
    // Store JWT tokens for API calls
    await SecureStore.setItemAsync('access_token', data.access_token);
    await SecureStore.setItemAsync('refresh_token', data.refresh_token);
    
  } catch (error) {
    console.error('Login failed:', error);
  }
};
```

## Monitoring

### Health Check
```bash
curl https://your-api.com/health
```

### Authentication Test
```bash
curl -X POST https://your-api.com/auth/social-login \
  -H "Content-Type: application/json" \
  -d '{"provider": "google", "token": "your-google-token"}'
```

### Log Monitoring
Monitor these log patterns:
- Failed authentication attempts
- Rate limit violations
- JWT token validation errors
- Social provider communication errors

## Troubleshooting

### Common Issues

1. **JWT Secret Not Set**
   - Error: "JWT_SECRET_KEY is required"
   - Solution: Set a secure 256-bit secret key

2. **Social Login Fails**
   - Error: "Invalid social token"
   - Solution: Check provider credentials and token validity

3. **Database Migration Fails**
   - Error: "Migration failed"
   - Solution: Ensure database is accessible and user has permissions

4. **Rate Limiting Too Aggressive**
   - Error: "Rate limit exceeded"
   - Solution: Adjust RATE_LIMIT_PER_MINUTE in environment

5. **CORS Issues**
   - Error: "CORS policy blocked"
   - Solution: Add your domain to ALLOWED_ORIGINS

## Performance Optimization

### Database
- Use connection pooling
- Add indexes on frequently queried fields
- Consider PostgreSQL for production scale

### API
- Use Redis for token blacklisting (if needed)
- Implement response caching for static data
- Monitor response times and optimize slow queries

### Security
- Implement token rotation
- Set up automated security scanning
- Monitor for suspicious activity patterns

## Backup and Recovery

### Database Backup
```bash
# PostgreSQL backup
pg_dump your_database > backup.sql
```

### Configuration Backup
- Backup environment files (without secrets)
- Document social provider setup
- Keep JWT secret key in secure vault

## Support and Maintenance

### Regular Tasks
- Update dependencies monthly
- Rotate JWT secrets quarterly
- Review security logs weekly
- Monitor API performance daily

### Emergency Procedures
- How to revoke all JWT tokens (change secret)
- How to disable social providers
- How to enable emergency access
- Incident response contacts