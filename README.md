# JANMITRA – Civic Issue Reporting App

A comprehensive civic issue reporting platform connecting citizens with municipal authorities through AI-powered complaint management.

## 🚀 Features

### For Citizens
- **Report Issues**: File complaints with photos, videos, text, or voice + location
- **Track Progress**: Monitor complaint status and resolution timeline
- **Upvote Issues**: Support important community problems
- **Refile Complaints**: Report unresolved issues
- **Nearby Issues**: Discover and support local civic problems

### For Staff
- **Dashboard**: Prioritized complaint management with AI insights
- **Status Updates**: Update complaint progress with comments and media
- **Ward Management**: Handle complaints by assigned areas
- **History Tracking**: View resolved complaints and performance metrics

### AI-Powered Features
- **Auto-Categorization**: Intelligent complaint categorization
- **Duplicate Detection**: Identify and merge similar complaints
- **Danger Scoring**: Prioritize urgent issues automatically
- **Smart Insights**: AI-driven recommendations for staff

## 🏗️ Architecture

```
JANMITRA/
├── backend/          # Node.js + Express API server
├── frontend/         # React Native (Expo) mobile app
├── ai-services/      # Python Flask AI microservice
└── docs/            # API documentation
```

## 🛠️ Tech Stack

### Backend
- **Node.js** + **Express** - RESTful API server
- **JWT** - Staff authentication
- **In-memory Store** - Data persistence (MongoDB ready)
- **CORS** - Cross-origin resource sharing

### Frontend
- **React Native** + **Expo** - Cross-platform mobile app
- **React Native Paper** - Material Design components
- **Expo Router** - File-based navigation
- **TypeScript** - Type-safe development

### AI Services
- **Python** + **Flask** - AI microservice
- **Rule-based Categorization** - Smart complaint classification
- **Duplicate Detection** - Similarity analysis
- **Danger Scoring** - Urgency assessment

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Python 3.8+
- Expo CLI (`npm install -g @expo/cli`)
- Git

### 1. Clone and Setup
```bash
git clone <repository-url>
cd JANMITRA
```

### 2. Start Backend
```bash
cd backend
npm install
npm start
# Backend runs on http://localhost:5000
```

### 3. Start AI Services
```bash
cd ai-services
pip install -r requirements.txt
python app.py
# AI service runs on http://localhost:5001
```

### 4. Start Frontend
```bash
cd frontend
npm install
npm start
# Opens Expo development server
```

### 5. Test the System
```bash
# Run comprehensive system test
node test-full-system.js
```

## 📱 Mobile App Usage

1. **Install Expo Go** on your phone from App Store/Play Store
2. **Start the frontend** with `npm start` in the frontend directory
3. **Scan the QR code** with Expo Go app
4. **Test the features**:
   - Report a new complaint
   - View nearby issues
   - Check your reported issues
   - Access staff login (Profile → Staff Login)

## 🔧 API Endpoints

### Citizen Endpoints
- `POST /api/complaints` - Create complaint
- `GET /api/complaints` - List complaints (with location filtering)
- `GET /api/complaints/:id` - Get complaint details
- `POST /api/complaints/:id/upvote` - Upvote complaint
- `POST /api/complaints/:id/refile` - Refile complaint
- `POST /api/complaints/:id/confirm_resolution` - Confirm resolution

### Staff Endpoints
- `POST /api/staff/login` - Staff authentication
- `GET /api/staff/complaints` - Get staff dashboard
- `POST /api/staff/complaints/:id/update` - Update complaint status
- `GET /api/staff/complaints/history` - Get resolved complaints

### AI Service Endpoints
- `POST /categorize` - Categorize complaint
- `POST /detect-duplicates` - Find duplicate complaints
- `POST /danger-score` - Calculate urgency score
- `POST /analyze` - Complete AI analysis

## 🧪 Testing

### Backend Testing
```bash
cd backend
node simple-test.js
```

### Full System Testing
```bash
node test-full-system.js
```

### Manual Testing with curl
```bash
# Create a complaint
curl -X POST http://localhost:5000/api/complaints \
  -H "Content-Type: application/json" \
  -d '{
    "citizen_id": "user-123",
    "description": "Large pothole on main road",
    "location": {"lat": 28.7041, "lng": 77.1025, "address": "Main Road"}
  }'

# Staff login
curl -X POST http://localhost:5000/api/staff/login \
  -H "Content-Type: application/json" \
  -d '{"dept": "sanitation", "staff_id": "staff-001"}'
```

## 🎯 Roadmap Progress

- [x] **Section 1**: Repository & project skeleton
- [x] **Section 2**: Backend Core APIs
- [x] **Section 3**: Frontend Core with React Native
- [x] **Section 4**: Citizen Features (report, track, upvote)
- [x] **Section 5**: Staff Features (dashboard, management)
- [x] **Section 6**: AI Services (categorization, duplicates)
- [x] **Section 7**: Authentication & JWT
- [ ] **Section 8**: UI Polishing & animations
- [ ] **Section 9**: Testing & edge cases
- [ ] **Section 10**: Deployment & production

## 🔮 Next Steps

1. **Staff Dashboard UI** - Complete staff management screens
2. **Media Upload** - Implement photo/video upload functionality
3. **Push Notifications** - Real-time updates for citizens
4. **MongoDB Integration** - Replace in-memory store
5. **Cloud Deployment** - Deploy to production
6. **Advanced AI** - Machine learning models for better categorization

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with modern web technologies
- AI-first approach for civic engagement
- Designed for hackathon and production use
- Community-driven development

---

**JANMITRA** - Making cities better, one complaint at a time! 🏙️✨
