# Language Learning App - Production Deployment Guide

**Version:** 1.0.0  
**Date:** December 13, 2025  
**Environment:** Production-Ready  
**Phase:** 12 - Performance Optimization & Polish Complete

---

## 🚀 Deployment Overview

This guide provides step-by-step instructions for deploying the performance-optimized language learning application to production environments. The application has been thoroughly tested and optimized for enterprise-grade performance.

### **Prerequisites**
- Node.js 18+ and npm 8+
- Expo CLI 49+
- Docker (for API deployment)
- Production environment credentials
- SSL certificates for HTTPS
- Domain names configured

---

## 📋 Pre-Deployment Checklist

### **✅ Performance Validation**
```bash
# 1. Run complete test suite
cd gui && npm test

# 2. Run performance-specific tests
npm test -- --testPathPatterns=performance-optimization

# 3. Validate bundle size
npx expo export --platform all --dev false
du -sh dist/

# 4. Check memory usage in development
npm start
# Monitor with React DevTools Profiler
```

### **✅ Configuration Verification**
```bash
# 1. Verify environment configuration
node -e "
const { productionConfig } = require('./src/config/production');
console.log('Environment:', productionConfig.getEnvironment());
console.log('API URL:', productionConfig.get('API_BASE_URL'));
console.log('Features:', productionConfig.getFullConfig().FEATURES);
"

# 2. Check dependencies
npm audit --production
npm outdated
```

### **✅ Security Validation**
```bash
# 1. Security audit
npm audit --audit-level high

# 2. Check for sensitive data exposure
grep -r "password\|secret\|key" src/ --exclude-dir=node_modules

# 3. Validate HTTPS configuration
curl -I https://your-api-domain.com/health
```

---

## 🔧 Backend API Deployment

### **1. Docker Container Setup**

#### **Build Production Image**
```bash
cd api
docker build -t language-learning-api:latest .
```

#### **Docker Compose Production**
```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  api:
    image: language-learning-api:latest
    environment:
      - DATABASE_URL=postgresql://user:password@db:5432/language_learning
      - JWT_SECRET=${JWT_SECRET}
      - REDIS_URL=redis://redis:6379
      - NODE_ENV=production
    ports:
      - "8000:8000"
    depends_on:
      - db
      - redis
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=language_learning
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

#### **Deploy with Docker Compose**
```bash
# Set environment variables
export JWT_SECRET="your-super-secure-jwt-secret"
export DB_USER="language_app"
export DB_PASSWORD="secure-database-password"

# Deploy
docker-compose -f docker-compose.prod.yml up -d

# Verify deployment
docker-compose -f docker-compose.prod.yml ps
docker-compose -f docker-compose.prod.yml logs api
```

### **2. Health Check Validation**
```bash
# API Health Check
curl https://your-api-domain.com/health

# Expected Response:
{
  "status": "healthy",
  "timestamp": "2025-12-13T00:00:00.000Z",
  "version": "1.0.0",
  "uptime": 1234567,
  "database": "connected",
  "redis": "connected"
}
```

---

## 📱 Frontend Mobile App Deployment

### **1. Environment Configuration**

#### **Production Environment Variables**
```bash
# Create .env.production
cat > .env.production << 'EOF'
EXPO_PUBLIC_API_BASE_URL=https://api.languageapp.com/api
EXPO_PUBLIC_WS_BASE_URL=wss://api.languageapp.com/ws
EXPO_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
EXPO_PUBLIC_ANALYTICS_TRACKING_ID=GA-TRACKING-ID
EXPO_PUBLIC_BUGSNAG_API_KEY=your-bugsnag-api-key
EXPO_PUBLIC_MIXPANEL_TOKEN=your-mixpanel-token
EXPO_PUBLIC_AMPLITUDE_API_KEY=your-amplitude-api-key
EOF
```

#### **App Configuration (app.json)**
```json
{
  "expo": {
    "name": "Language Learning Pro",
    "slug": "language-learning-pro",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/images/icon.png",
    "userInterfaceStyle": "automatic",
    "splash": {
      "image": "./assets/images/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "assetBundlePatterns": ["**/*"],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.languagelearning.pro",
      "buildNumber": "1"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/android-icon-foreground.png",
        "backgroundImage": "./assets/images/android-icon-background.png"
      },
      "package": "com.languagelearning.pro",
      "versionCode": 1
    },
    "web": {
      "bundler": "metro",
      "output": "static",
      "favicon": "./assets/images/favicon.png"
    },
    "plugins": [
      "expo-router",
      "expo-font",
      "expo-secure-store",
      "expo-av"
    ],
    "experiments": {
      "typedRoutes": true
    },
    "extra": {
      "router": {
        "origin": false
      },
      "eas": {
        "projectId": "your-eas-project-id"
      }
    }
  }
}
```

### **2. Build Configuration**

#### **EAS Build Configuration (eas.json)**
```json
{
  "cli": {
    "version": ">= 5.9.0"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "staging": {
      "distribution": "internal",
      "env": {
        "NODE_ENV": "staging"
      }
    },
    "production": {
      "distribution": "store",
      "env": {
        "NODE_ENV": "production"
      },
      "android": {
        "buildType": "apk"
      },
      "ios": {
        "autoIncrement": true
      }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "your-apple-id@example.com",
        "ascAppId": "your-app-store-connect-app-id"
      },
      "android": {
        "serviceAccountKeyPath": "./path/to/service-account-key.json",
        "track": "production"
      }
    }
  }
}
```

### **3. Performance-Optimized Builds**

#### **Production Build Commands**
```bash
cd gui

# 1. Clean previous builds
rm -rf dist/ .expo/

# 2. Install dependencies
npm ci --production

# 3. Build for all platforms
npx expo export --platform all --dev false --clear

# 4. Verify bundle size
du -sh dist/
echo "Bundle size should be < 15MB"

# 5. Test exported app
npx serve dist/
# Navigate to http://localhost:3000 and test functionality
```

#### **Platform-Specific Builds**

##### **iOS Production Build**
```bash
# 1. Build for iOS
npx eas build --platform ios --profile production

# 2. Submit to App Store (optional)
npx eas submit --platform ios --profile production
```

##### **Android Production Build**
```bash
# 1. Build for Android
npx eas build --platform android --profile production

# 2. Submit to Google Play (optional)
npx eas submit --platform android --profile production
```

##### **Web Production Build**
```bash
# 1. Build for web
npx expo export:web --dev false

# 2. Deploy to hosting service
# Example: Deploy to Netlify
npm install -g netlify-cli
netlify deploy --prod --dir=web-build

# Example: Deploy to Vercel
npm install -g vercel
vercel --prod web-build
```

---

## 🖥️ Web Deployment Options

### **1. Static Hosting (Recommended)**

#### **Netlify Deployment**
```bash
# Build for web
npx expo export:web --dev false

# Deploy
npm install -g netlify-cli
netlify login
netlify deploy --prod --dir=web-build

# Configure redirects for SPA
echo '/*    /index.html   200' > web-build/_redirects
```

#### **Vercel Deployment**
```bash
# Build for web
npx expo export:web --dev false

# Deploy
npm install -g vercel
vercel login
vercel --prod web-build
```

#### **AWS S3 + CloudFront**
```bash
# Build for web
npx expo export:web --dev false

# Sync to S3
aws s3 sync web-build/ s3://your-bucket-name/ --delete

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id YOUR_DISTRIBUTION_ID --paths "/*"
```

### **2. Performance Monitoring Setup**

#### **Google Analytics 4**
```javascript
// Add to web-build/index.html
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_TRACKING_ID');
</script>
```

#### **Performance Monitoring**
```javascript
// Performance observer for real user monitoring
if ('PerformanceObserver' in window) {
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      // Send to analytics
      gtag('event', 'web_vital', {
        event_category: 'Performance',
        event_label: entry.name,
        value: Math.round(entry.value)
      });
    });
  });
  
  observer.observe({ type: 'largest-contentful-paint', buffered: true });
  observer.observe({ type: 'first-input', buffered: true });
  observer.observe({ type: 'layout-shift', buffered: true });
}
```

---

## 🔒 Security Configuration

### **1. HTTPS Setup**

#### **SSL Certificate Installation**
```bash
# Using Let's Encrypt with Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Generate certificate
sudo certbot --nginx -d api.languageapp.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### **Nginx Configuration**
```nginx
# /etc/nginx/sites-available/language-learning-api
server {
    listen 443 ssl http2;
    server_name api.languageapp.com;

    ssl_certificate /etc/letsencrypt/live/api.languageapp.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.languageapp.com/privkey.pem;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains";

    # API proxy
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name api.languageapp.com;
    return 301 https://$server_name$request_uri;
}
```

### **2. Environment Security**

#### **Secrets Management**
```bash
# Use environment variables for sensitive data
export JWT_SECRET=$(openssl rand -base64 32)
export DB_PASSWORD=$(openssl rand -base64 24)
export ENCRYPTION_KEY=$(openssl rand -base64 32)

# Store in secure location (e.g., AWS Secrets Manager, HashiCorp Vault)
```

#### **Database Security**
```bash
# PostgreSQL security configuration
# /etc/postgresql/15/main/postgresql.conf
ssl = on
ssl_cert_file = '/path/to/server.crt'
ssl_key_file = '/path/to/server.key'

# /etc/postgresql/15/main/pg_hba.conf
hostssl all all 0.0.0.0/0 md5
```

---

## 📊 Monitoring & Observability

### **1. Application Monitoring**

#### **Performance Metrics**
```typescript
// Initialize monitoring
import { initializePerformanceOptimizations } from './src/services/performance';

const { 
  stopMemoryTracking, 
  stopPerformanceMetrics, 
  stopAnimationMonitoring 
} = await initializePerformanceOptimizations();

// Set up alerts
performanceMetrics.onAlert((alert) => {
  // Send to external monitoring service
  fetch('/api/alerts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(alert)
  });
});
```

#### **Error Tracking**
```typescript
// Sentry configuration
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

// Custom error reporting
import { handleCriticalError } from './src/components/ui/EnhancedErrorHandling';

// Report critical errors
window.addEventListener('unhandledrejection', (event) => {
  handleCriticalError(new Error(event.reason), 'unhandled_promise_rejection');
});
```

### **2. Infrastructure Monitoring**

#### **Docker Container Monitoring**
```bash
# Container health monitoring
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Resource usage
docker stats --no-stream

# Logs monitoring
docker-compose logs -f api
```

#### **Database Monitoring**
```sql
-- PostgreSQL monitoring queries
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Database size
SELECT pg_size_pretty(pg_database_size('language_learning'));

-- Slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

---

## 🚀 Deployment Automation

### **1. CI/CD Pipeline**

#### **GitHub Actions Workflow**
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]
    tags: ['v*']

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: gui/package-lock.json
      
      - name: Install dependencies
        run: cd gui && npm ci
      
      - name: Run tests
        run: cd gui && npm test -- --watchAll=false
      
      - name: Performance tests
        run: cd gui && npm test -- --testPathPatterns=performance-optimization

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/v')
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Build API Docker image
        run: |
          cd api
          docker build -t ${{ secrets.DOCKER_REGISTRY }}/language-learning-api:${{ github.ref_name }} .
          docker push ${{ secrets.DOCKER_REGISTRY }}/language-learning-api:${{ github.ref_name }}
      
      - name: Build mobile app
        run: |
          cd gui
          npm ci
          npx eas build --platform all --profile production --non-interactive
      
      - name: Deploy to production
        run: |
          # Deploy API
          ssh ${{ secrets.PRODUCTION_SERVER }} "
            docker pull ${{ secrets.DOCKER_REGISTRY }}/language-learning-api:${{ github.ref_name }}
            docker-compose -f /opt/language-learning/docker-compose.prod.yml up -d api
          "
```

### **2. Health Check Script**
```bash
#!/bin/bash
# health-check.sh

echo "🔍 Performing deployment health checks..."

# API Health Check
API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" https://api.languageapp.com/health)
if [ "$API_HEALTH" -eq 200 ]; then
    echo "✅ API Health: OK"
else
    echo "❌ API Health: FAILED (HTTP $API_HEALTH)"
    exit 1
fi

# Database Connection
DB_STATUS=$(curl -s https://api.languageapp.com/health | jq -r '.database')
if [ "$DB_STATUS" = "connected" ]; then
    echo "✅ Database: Connected"
else
    echo "❌ Database: FAILED"
    exit 1
fi

# Performance Check
RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" https://api.languageapp.com/health)
if (( $(echo "$RESPONSE_TIME < 1.0" | bc -l) )); then
    echo "✅ Response Time: ${RESPONSE_TIME}s"
else
    echo "⚠️  Response Time: ${RESPONSE_TIME}s (slow)"
fi

# Memory Usage Check
MEMORY_USAGE=$(docker stats --no-stream --format "{{.MemUsage}}" language-learning-api | cut -d'/' -f1)
echo "📊 Memory Usage: $MEMORY_USAGE"

echo "🎉 Health check completed successfully!"
```

---

## 🔄 Rollback Procedures

### **1. Application Rollback**
```bash
#!/bin/bash
# rollback.sh

PREVIOUS_VERSION=$1

if [ -z "$PREVIOUS_VERSION" ]; then
    echo "Usage: ./rollback.sh <previous_version>"
    exit 1
fi

echo "🔄 Rolling back to version $PREVIOUS_VERSION..."

# Rollback API
docker pull $DOCKER_REGISTRY/language-learning-api:$PREVIOUS_VERSION
docker-compose -f docker-compose.prod.yml down api
docker-compose -f docker-compose.prod.yml up -d api

# Verify rollback
sleep 10
./health-check.sh

echo "✅ Rollback completed to version $PREVIOUS_VERSION"
```

### **2. Database Rollback**
```bash
# Database migration rollback
cd api
npm run migrate:rollback

# Database backup restoration
psql -h localhost -U language_app -d language_learning < backup_before_deployment.sql
```

---

## 📋 Post-Deployment Verification

### **1. Functional Testing**
```bash
# API endpoints testing
curl -X POST https://api.languageapp.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'

# Mobile app testing
# Test critical user flows:
# 1. User registration/login
# 2. Language selection
# 3. Practice session
# 4. Progress tracking
# 5. Audio playback
```

### **2. Performance Validation**
```bash
# Load testing with Artillery
npm install -g artillery
artillery quick --count 100 --num 10 https://api.languageapp.com/health

# Monitor performance metrics
curl https://api.languageapp.com/api/metrics | jq '.performance'
```

### **3. Monitoring Setup Verification**
```bash
# Check error reporting
curl -X POST https://api.languageapp.com/api/test-error

# Verify alerts are working
# Should receive notifications in configured channels
```

---

## 🆘 Troubleshooting

### **Common Issues**

#### **High Memory Usage**
```bash
# Check memory usage
docker stats language-learning-api

# If high, restart with memory limits
docker-compose -f docker-compose.prod.yml down api
docker-compose -f docker-compose.prod.yml up -d api
```

#### **Slow API Responses**
```bash
# Check database connections
docker-compose logs db | grep connection

# Monitor slow queries
docker exec -it language-learning-db psql -U language_app -c "
SELECT query, mean_time FROM pg_stat_statements 
ORDER BY mean_time DESC LIMIT 5;"
```

#### **Mobile App Performance Issues**
```bash
# Check bundle size
npx expo export --platform all --dev false
du -sh dist/

# Performance profiling
npm start
# Use React DevTools Profiler
```

### **Emergency Contacts**
- **Technical Lead**: technical-lead@languageapp.com
- **DevOps Team**: devops@languageapp.com
- **On-Call Engineer**: +1-xxx-xxx-xxxx

---

## ✅ Deployment Checklist

### **Pre-Deployment**
- [ ] All tests passing (unit, integration, performance)
- [ ] Bundle size under 15MB
- [ ] Security audit completed
- [ ] Environment variables configured
- [ ] SSL certificates installed
- [ ] Database migrations ready
- [ ] Backup created

### **Deployment**
- [ ] API deployed and healthy
- [ ] Database migrated successfully
- [ ] Mobile apps built and distributed
- [ ] Web app deployed and accessible
- [ ] CDN configured and optimized
- [ ] DNS records updated

### **Post-Deployment**
- [ ] Health checks passing
- [ ] Performance metrics within targets
- [ ] Error reporting configured
- [ ] Monitoring dashboards active
- [ ] User acceptance testing completed
- [ ] Documentation updated

---

## 🎉 Success Criteria

**Deployment is considered successful when:**

✅ **Performance Targets Met**
- Cold start < 2 seconds
- API response time < 500ms
- Memory usage < 75MB
- 60fps animations

✅ **Quality Metrics Achieved**
- Zero critical bugs
- < 0.1% crash rate
- 99.9% uptime
- All features functional

✅ **User Experience Validated**
- Smooth navigation
- Responsive interactions
- Professional polish
- Accessible design

**The Language Learning Application is now ready for production use with enterprise-grade performance and reliability.**

---

*Deployment Guide Complete - Ready for Production*