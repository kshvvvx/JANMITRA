# JANMITRA - Integrated Civic Issue Reporting System

A comprehensive civic issue reporting application with full backend, AI service, and frontend integration.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- MongoDB
- Redis (optional, for caching)

### 1. Backend Setup

```bash
cd backend
npm install
cp .env.example .env  # Configure your environment variables
npm start
```

Backend runs on: http://localhost:3000

### 2. AI Service Setup

```bash
cd ai-services
pip install -r requirements.txt
python ai_service.py
```

AI Service runs on: http://localhost:8000

### 3. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on: http://localhost:8080

## 📁 Project Structure

### Backend (`backend/`)
- **Node.js/Express** server
- **MongoDB** integration
- **JWT Authentication** with role-based access
- **Push notification** system
- **Auto-resolution** cron jobs

### AI Service (`ai-services/`)
- **FastAPI/Python** service
- **AI-powered** complaint analysis
- **Danger scoring** and sentiment analysis
- **Auto-description** generation
- **Duplicate detection**

### Frontend (`frontend/`)
- **React/TypeScript** application
- **Vite** build system
- **Shadcn UI** components
- **React Query** for state management
- **React Router** for navigation

## 🔗 API Integration

### Backend API Endpoints

#### Complaints
- `POST /api/complaints` - Create new complaint
- `GET /api/complaints` - List complaints with pagination
- `GET /api/complaints/:id` - Get complaint details
- `PUT /api/complaints/:id/status` - Update status (staff)
- `POST /api/complaints/:id/upvote` - Upvote complaint
- `POST /api/complaints/:id/refile` - Refile complaint
- `POST /api/complaints/:id/confirm-resolution` - Confirm resolution

#### Authentication
- `POST /auth/citizen/send-otp` - Send OTP
- `POST /auth/citizen/verify-otp` - Verify OTP
- `POST /auth/staff/login` - Staff login

### AI Service Endpoints

#### Analysis
- `POST /api/ai/analyze` - Comprehensive complaint analysis
- `GET /api/ai/stats` - Service statistics
- `POST /api/ai/feedback` - Submit feedback

#### Individual Services
- `POST /api/ai/danger-score` - Get danger score
- `POST /api/ai/auto-description` - Generate description

## 🧪 Testing Integration

1. **Start all services** in separate terminals
2. **Navigate to** http://localhost:8080
3. **Go to Test Integration** page
4. **Click test buttons** to verify:
   - AI service connectivity
   - Complaint creation
   - Complaint fetching

## 🔧 Configuration

### Frontend Environment Variables

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:3000
VITE_AI_SERVICE_URL=http://localhost:8000
VITE_ENABLE_MOCK_API=false
```

### Backend Environment Variables

Create `backend/.env`:

```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/janmitra
JWT_SECRET=your-secret-key
REDIS_URL=redis://localhost:6379/0
FRONTEND_URL=http://localhost:8080
AI_SERVICE_URL=http://localhost:8000
```

### AI Service Environment Variables

Create `ai-services/.env`:

```env
OPENAI_API_KEY=your-openai-key
MONGODB_URI=mongodb://localhost:27017/ai_service
REDIS_URL=redis://localhost:6379/0
ENVIRONMENT=development
```

## 🎯 Key Features

### Complaint Management
- **Multi-step** complaint submission
- **AI-powered** analysis and scoring
- **Real-time** status updates
- **Upvoting** system
- **Auto-resolution** with citizen confirmation

### User Roles
- **Citizens** - Submit and track complaints
- **Staff** - Handle and resolve complaints
- **Supervisors** - Oversee operations
- **Guest** - Limited access for quick reporting

### AI Integration
- **Danger scoring** for priority assessment
- **Sentiment analysis** for complaint categorization
- **Auto-description** generation
- **Duplicate detection** to prevent spam
- **Feedback system** for continuous improvement

## 📱 Frontend Components

### Pages
- **Landing** - App entry point
- **Citizen Dashboard** - Main user interface
- **Register Complaint** - Multi-step complaint form
- **My Complaints** - User's complaint history
- **Complaint Detail** - Individual complaint view
- **Notifications** - Push notification management

### Hooks
- **useComplaints** - Complaint CRUD operations
- **useAI** - AI service integration
- **useAuth** - Authentication state management

## 🛠 Development

### Adding New Features

1. **Backend API** - Add routes in `backend/routes/`
2. **Frontend Service** - Add methods in `frontend/src/lib/api/`
3. **React Hooks** - Create custom hooks in `frontend/src/hooks/`
4. **Components** - Build UI in `frontend/src/components/`
5. **Pages** - Add routes in `App.tsx`

### Testing

```bash
# Frontend
cd frontend
npm test

# Backend
cd backend
npm test

# AI Service
cd ai-services
python -m pytest
```

## 🚀 Deployment

### Production Setup

1. **Environment Variables** - Set production values
2. **Database** - Configure MongoDB Atlas
3. **File Storage** - Set up cloud storage
4. **SSL** - Configure HTTPS
5. **CDN** - Set up static asset delivery

### Docker Deployment

```bash
# Build and run all services
docker-compose up -d

# Or build individually
docker build -t janmitra-backend ./backend
docker build -t janmitra-ai ./ai-services
```

## 📊 Monitoring

- **Backend Metrics** - Health checks at `/health`
- **AI Service Metrics** - Prometheus at `/metrics`
- **Error Tracking** - Sentry integration
- **Logging** - Structured JSON logs

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support, please create an issue on GitHub or contact the development team.

---

**JANMITRA** - Making civic reporting efficient and transparent through technology.
