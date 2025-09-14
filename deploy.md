# JANMITRA Deployment Guide

This guide covers deploying JANMITRA to various cloud platforms.

## 🐳 Docker Deployment

### Local Docker Setup
```bash
# Build and run with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Docker Setup
```bash
# Build production image
docker build -t janmitra:latest .

# Run with environment variables
docker run -d \
  -p 5000:5000 \
  -p 5001:5001 \
  -e MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/janmitra \
  -e STAFF_JWT_SECRET=your-secure-secret \
  janmitra:latest
```

## ☁️ Cloud Deployment Options

### 1. Railway (Recommended for MVP)
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up
```

**Railway Configuration:**
- Backend: Node.js app on port 5000
- AI Services: Python app on port 5001
- Database: MongoDB Atlas connection
- Environment: Production variables

### 2. Render
```bash
# Backend Service
# - Build Command: cd backend && npm install
# - Start Command: cd backend && npm start
# - Environment: Node.js 18

# AI Services
# - Build Command: cd ai-services && pip install -r requirements.txt
# - Start Command: cd ai-services && python app.py
# - Environment: Python 3.9
```

### 3. Heroku
```bash
# Install Heroku CLI
npm install -g heroku

# Create apps
heroku create janmitra-backend
heroku create janmitra-ai

# Deploy backend
cd backend
heroku git:remote -a janmitra-backend
git subtree push --prefix=backend heroku main

# Deploy AI services
cd ai-services
heroku git:remote -a janmitra-ai
git subtree push --prefix=ai-services heroku main
```

### 4. DigitalOcean App Platform
```yaml
# .do/app.yaml
name: janmitra
services:
- name: backend
  source_dir: /backend
  github:
    repo: your-username/janmitra
    branch: main
  run_command: npm start
  environment_slug: node-js
  instance_count: 1
  instance_size_slug: basic-xxs
  envs:
  - key: MONGODB_URI
    value: ${MONGODB_URI}
  - key: STAFF_JWT_SECRET
    value: ${STAFF_JWT_SECRET}

- name: ai-services
  source_dir: /ai-services
  github:
    repo: your-username/janmitra
    branch: main
  run_command: python app.py
  environment_slug: python
  instance_count: 1
  instance_size_slug: basic-xxs
```

## 🗄️ Database Setup

### MongoDB Atlas (Recommended)
1. Create account at [MongoDB Atlas](https://cloud.mongodb.com)
2. Create cluster (M0 free tier available)
3. Create database user
4. Whitelist IP addresses
5. Get connection string
6. Set `MONGODB_URI` environment variable

### Local MongoDB
```bash
# Install MongoDB
brew install mongodb/brew/mongodb-community  # macOS
sudo apt-get install mongodb                 # Ubuntu

# Start MongoDB
brew services start mongodb/brew/mongodb-community
sudo systemctl start mongod

# Connect
mongosh
```

## 🔧 Environment Variables

### Required Variables
```bash
# Server
PORT=5000
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/janmitra

# Security
STAFF_JWT_SECRET=your-super-secure-jwt-secret-here

# AI Services
AI_SERVICE_URL=http://localhost:5001
```

### Optional Variables
```bash
# CORS
CORS_ORIGIN=https://your-frontend-domain.com

# Logging
LOG_LEVEL=info

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 📱 Frontend Deployment

### Expo Build
```bash
# Install EAS CLI
npm install -g @expo/eas-cli

# Login to Expo
eas login

# Configure build
eas build:configure

# Build for Android
eas build --platform android

# Build for iOS
eas build --platform ios
```

### Web Deployment
```bash
# Build for web
cd frontend
npx expo export --platform web

# Deploy to Vercel
npx vercel --prod

# Deploy to Netlify
npx netlify deploy --prod --dir=dist
```

## 🔍 Monitoring & Logging

### Health Checks
```bash
# Backend health
curl https://your-backend-url.com/api/health

# AI services health
curl https://your-ai-url.com/health
```

### Logging
```bash
# View logs (Railway)
railway logs

# View logs (Render)
# Available in dashboard

# View logs (Heroku)
heroku logs --tail -a janmitra-backend
```

## 🚀 Production Checklist

- [ ] Environment variables configured
- [ ] MongoDB Atlas cluster set up
- [ ] SSL certificates installed
- [ ] CORS configured for frontend domain
- [ ] Rate limiting enabled
- [ ] Error monitoring set up (Sentry)
- [ ] Backup strategy implemented
- [ ] Performance monitoring configured
- [ ] Security headers configured
- [ ] API documentation updated

## 🔒 Security Considerations

1. **JWT Secrets**: Use strong, unique secrets
2. **Database**: Enable authentication and SSL
3. **CORS**: Restrict to known domains
4. **Rate Limiting**: Implement API rate limits
5. **Input Validation**: Validate all inputs
6. **HTTPS**: Use SSL certificates
7. **Environment Variables**: Never commit secrets

## 📊 Performance Optimization

1. **Database Indexes**: Ensure proper indexing
2. **Caching**: Implement Redis for caching
3. **CDN**: Use CDN for static assets
4. **Compression**: Enable gzip compression
5. **Connection Pooling**: Configure MongoDB connection pooling
6. **Load Balancing**: Use multiple instances for high traffic

## 🆘 Troubleshooting

### Common Issues
1. **MongoDB Connection**: Check connection string and network access
2. **CORS Errors**: Verify CORS configuration
3. **JWT Errors**: Check secret and token expiration
4. **AI Service Timeout**: Increase timeout values
5. **Memory Issues**: Monitor memory usage and scale accordingly

### Debug Commands
```bash
# Check service status
docker-compose ps

# View detailed logs
docker-compose logs backend
docker-compose logs ai-services

# Test API endpoints
curl -X GET http://localhost:5000/api/health
curl -X GET http://localhost:5001/health
```
