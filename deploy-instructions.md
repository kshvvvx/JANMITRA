# JANMITRA Production Deployment Guide

## Prerequisites
- Docker and Docker Compose installed
- Railway/Render/Heroku account
- Expo EAS CLI installed (`npm install -g @expo/eas-cli`)
- MongoDB Atlas account (for production database)

## Backend Deployment Options

### Option 1: Railway Deployment
1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Create new project: `railway new`
4. Set environment variables:
   ```bash
   railway variables set NODE_ENV=production
   railway variables set JWT_SECRET=your-super-secure-jwt-secret
   railway variables set MONGODB_URI=your-mongodb-atlas-connection-string
   railway variables set PORT=5000
   ```
5. Deploy: `railway up`

### Option 2: Render Deployment
1. Connect your GitHub repository to Render
2. Create new Web Service from `render.yaml`
3. Set environment variables in Render dashboard
4. Deploy automatically on git push

### Option 3: Heroku Deployment
1. Install Heroku CLI
2. Create Heroku app: `heroku create janmitra-backend`
3. Set environment variables:
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=your-super-secure-jwt-secret
   heroku config:set MONGODB_URI=your-mongodb-atlas-connection-string
   ```
4. Deploy: `git push heroku main`

## Local Docker Development
```bash
# Build and run all services
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

## Frontend Deployment with Expo EAS

### Setup EAS
1. Install EAS CLI: `npm install -g @expo/eas-cli`
2. Login: `eas login`
3. Configure project: `eas build:configure`

### Update Production API URL
Before building, update `frontend/utils/config.ts`:
```typescript
production: {
  API_BASE_URL: 'https://your-actual-backend-url.com/api',
  AI_SERVICE_URL: 'https://your-actual-ai-service-url.com',
}
```

### Build for Android
```bash
cd frontend
eas build --platform android --profile production
```

### Build for iOS
```bash
cd frontend
eas build --platform ios --profile production
```

### Submit to App Stores
```bash
# Android Play Store
eas submit --platform android

# iOS App Store
eas submit --platform ios
```

## Environment Variables

### Backend (.env)
```
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/janmitra
JWT_SECRET=your-super-secure-jwt-secret-change-this
AI_SERVICE_URL=https://your-ai-service-url.com
```

### AI Services (.env)
```
FLASK_ENV=production
FLASK_APP=app.py
```

## Database Setup (MongoDB Atlas)
1. Create MongoDB Atlas account
2. Create new cluster
3. Create database user
4. Whitelist IP addresses (0.0.0.0/0 for production)
5. Get connection string
6. Update MONGODB_URI in environment variables

## Post-Deployment Checklist
- [ ] Backend health check: `GET /health`
- [ ] AI services health check: `GET /health`
- [ ] Test user registration/login
- [ ] Test complaint submission
- [ ] Test GPS location features
- [ ] Test nearby complaints
- [ ] Verify file uploads work
- [ ] Test all API endpoints
- [ ] Monitor logs for errors

## Monitoring and Maintenance
- Set up error monitoring (Sentry, LogRocket)
- Configure log aggregation
- Set up uptime monitoring
- Regular database backups
- Monitor API response times
- Update dependencies regularly

## Security Considerations
- Use strong JWT secrets
- Enable HTTPS in production
- Validate all inputs
- Rate limiting on API endpoints
- Regular security audits
- Keep dependencies updated
