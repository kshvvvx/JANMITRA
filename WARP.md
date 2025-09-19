# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

JANMITRA is a comprehensive civic issue reporting platform connecting citizens with municipal authorities through AI-powered complaint management. The system consists of three main components:

- **Backend**: Node.js/Express API server with MongoDB/in-memory storage
- **Frontend**: React Native (Expo) cross-platform mobile application
- **AI Services**: Python Flask microservice for complaint analysis

## Common Development Commands

### Backend Development
```bash
cd backend
npm install              # Install dependencies
npm start               # Start production server
npm run dev             # Start development server with nodemon
npm test                # Run Jest tests
npm run test:simple     # Run basic backend test
npm run lint            # Run ESLint
npm run format          # Format code with Prettier
```

### Frontend Development  
```bash
cd frontend
npm install             # Install dependencies
npm start               # Start Expo development server
npm run android         # Run on Android device/emulator
npm run ios             # Run on iOS device/simulator
npm run web             # Run in web browser
npm run lint            # Run Expo lint
npm test                # Run Jest tests
npm run test:coverage   # Run tests with coverage
```

### AI Services Development
```bash
cd ai-services
pip install -r requirements.txt  # Install Python dependencies
python app.py                    # Start Flask server on port 5001
```

### Full System Testing
```bash
# From project root
node test-full-system.js         # Comprehensive system test
node backend/simple-test.js      # Basic backend functionality test
node test-mongo-connection.js    # Test MongoDB connection
```

### Docker Operations
```bash
docker-compose up -d             # Start all services
docker-compose logs -f           # View logs
docker-compose down              # Stop all services
docker-compose build             # Rebuild containers
```

## Architecture & Code Structure

### Backend Architecture
The backend follows a modular Express.js structure with:

- **Routes**: API endpoints organized by feature (`/routes/`)
  - `auth.js` - Authentication (citizen OTP, staff login) 
  - `complaints.js` - Core complaint CRUD operations
  - `departments.js` - Department management
  - `supervisor.js` - Supervisor features
  - `auditLogs.js` - System audit trails

- **Models**: Mongoose schemas in `/models/`
  - User roles: Citizens, Staff, Supervisors, Departments
  - Complaints with status tracking and confirmation system
  - Audit logging for all actions

- **Middleware**: Security, rate limiting, authentication
  - JWT-based authentication with department-specific access
  - Redis-backed rate limiting for different endpoints
  - Comprehensive security headers and input sanitization

- **Key Features**:
  - Department-based staff authentication (not individual accounts)
  - Complaint confirmation system requiring citizen validation
  - AI integration for categorization and duplicate detection
  - Auto-resolution after timeout or sufficient confirmations

### Frontend Architecture  
React Native with Expo using file-based routing:

- **App Structure** (`/app/`):
  - `(tabs)/` - Main tabbed interface for authenticated users
  - `auth/` - Authentication flows for all user types
  - `complaint-flow/` - Multi-step complaint submission process

- **Services** (`/services/`):
  - `api.ts` - Centralized API communication with retry logic
  - `guestService.ts` - Guest mode complaint handling
  - `locationService.ts` - GPS and location management
  - `offlineService.ts` - Offline functionality and sync

- **Key Features**:
  - Trilingual support (English/Hindi) with i18next
  - Three user modes: Citizen, Staff (Nagar Nigam Adhikaari), Supervisor
  - Offline-first design with local storage and sync
  - Guest mode for users without accounts
  - Push notifications for status updates

### AI Services Architecture
Python Flask microservice providing:

- **Categorization**: Rule-based complaint classification into departments
- **Duplicate Detection**: Similarity analysis to find related complaints  
- **Danger Scoring**: Urgency assessment based on keywords and context
- **Complete Analysis**: Combined processing pipeline

### Data Flow & Authentication

1. **Multi-role Authentication**:
   - Citizens: OTP-based phone verification
   - Staff: Department unique ID + phone number selection
   - Supervisors: Separate login with enhanced permissions

2. **Complaint Lifecycle**:
   - Creation → AI Analysis → Department Assignment → Staff Review → Resolution → Citizen Confirmation
   - Auto-resolution after 1 week if insufficient citizen confirmations
   - Refile system for unresolved issues

3. **AI Integration Points**:
   - Complaint submission: Auto-categorization and duplicate detection
   - Prioritization: Danger scoring for urgent issues
   - Brief generation: 7-8 word AI summaries for lists

### Database Schema Considerations

The system supports both in-memory storage (development) and MongoDB (production):

- **Complaints**: Core entity with embedded location, media, status history
- **Departments**: Unique ID system with associated staff phone numbers
- **Users**: Role-based with different authentication methods
- **Audit Logs**: Comprehensive tracking of all user actions

### Testing Strategy

- **Unit Tests**: Jest for both backend and frontend components
- **Integration Tests**: Full system testing with `test-full-system.js`
- **API Tests**: Comprehensive endpoint testing in `/backend/simple-test.js`
- **Component Tests**: React Native component testing with Testing Library

### Environment Configuration

The application uses different configurations for development vs production:

- **Development**: In-memory storage, detailed logging, CORS open
- **Production**: MongoDB, compressed responses, strict security headers
- **Docker**: Multi-service setup with nginx reverse proxy option

### Deployment Notes

- **Backend**: Containerized Node.js with health checks
- **AI Services**: Python Flask with FastAPI/uvicorn in requirements
- **Frontend**: Expo build for mobile apps, web export for browsers
- **Database**: MongoDB Atlas recommended for production

When working with this codebase, pay attention to the department-based authentication system rather than individual user accounts, and the citizen confirmation system that requires active user validation for complaint resolution.

## Implementation Status

The project is currently in advanced development with core features implemented. Key areas under active development include UI polishing, advanced AI features, and production deployment preparation. See `IMPLEMENTATION_PLAN.md` for detailed roadmap and current progress.
