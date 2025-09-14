# JANMITRA App - Implementation Plan to Match User's Draft

## Overview
This document outlines the plan to modify the current JANMITRA implementation to exactly match the user's detailed draft and amendments.

## Phase 1: Core Architecture Changes (High Priority)

### 1.1 Authentication System Overhaul
- **Current**: Individual staff accounts with JWT
- **Target**: Department-based unique ID system
- **Changes Needed**:
  - Create Department model with unique_id and associated phone numbers
  - Modify staff login to use department unique_id + phone selection
  - Implement single device login restriction
  - Add secondary device approval system

### 1.2 Language Selection & Access Modes
- **Add**: Language selection screen (English/Hindi) on app start
- **Add**: Three access mode selection: Citizen, Nagar Nigam Adhikaari, Supervisor
- **Modify**: Route users to appropriate interfaces based on selection

### 1.3 Complaint Confirmation System
- **Current**: Auto-resolve after 3+ citizen confirmations
- **Target**: Staff marks resolved → Citizens vote "yes/refile" → 3 "yes" votes = resolved
- **Changes**:
  - Add "awaiting_citizen_confirmation" status
  - Implement citizen voting system with "yes/refile" buttons
  - Auto-resolve after 1 week if not enough votes

## Phase 2: UI/UX Alignment (High Priority)

### 2.1 Home Page Structure
- **Citizen Home**: 3 cards (Register New Complaint, Previous Complaints, Complaints Near You)
- **Bottom Navigation**: Notifications, Profile, Contact
- **Staff Home**: Complaints list with urgent markers, total count display

### 2.2 Complaint Flow Redesign
- **Location Screen**: State > City > Area dropdowns with current location toggle
- **Input Screen**: Writing vs Speaking choice
- **Preview Format**: Brief description (AI-generated), complaint number, date, location, upvotes/refiles bubbles

### 2.3 Complaint Pages
- **Two Sections**: Complaint Section + Resolution/Status Section
- **Resolved**: Show resolution media, comments, date/time
- **Unresolved**: Show status progress bar, expected resolution date

## Phase 3: Advanced Features (Medium Priority)

### 3.1 AI Integration
- **Danger Factor Scoring**: Analyze media + description + location for priority
- **Brief Description Generation**: 7-8 word summaries
- **Category Assignment**: Auto-categorize complaints for department routing
- **Duplicate Detection**: Check for same location + category + description
- **Comment Translation**: Translate staff comments to user's language

### 3.2 Guest Mode & Offline Functionality
- **Guest Reporting**: Allow complaint submission without account
- **Draft Saving**: Save incomplete complaints locally
- **Auto-Upload**: Upload drafts when network available

### 3.3 Supervisor Interface
- **Chat System**: Real-time messaging with departments
- **Complaint Forwarding**: Receive urgent complaints from citizens
- **Department Efficiency**: View performance metrics and ratings
- **Urgent Marking**: Mark complaints as urgent for staff

## Phase 4: Additional Features (Low Priority)

### 4.1 Enhanced Functionality
- **Complaints Near You**: Location-based complaint discovery
- **Notification System**: Status updates, general notifications
- **Profile Management**: Editable profiles with statistics
- **History & Filters**: Complaint history with filtering options

### 4.2 Administrative Features
- **Phone Number Banning**: Department ability to ban spam numbers
- **Audit Logging**: Track all user actions for accountability
- **Device Management**: Primary/secondary device login system

## Implementation Strategy

### Immediate Actions (Week 1)
1. Create language selection screen
2. Implement access mode selection
3. Restructure authentication for department-based login
4. Modify complaint confirmation logic

### Short Term (Week 2-3)
1. Redesign UI components to match draft
2. Implement AI danger factor scoring
3. Add guest reporting mode
4. Create supervisor interface foundation

### Medium Term (Week 4-6)
1. Add offline functionality
2. Implement chat system
3. Create comprehensive complaint management
4. Add location dropdown system

### Long Term (Week 7+)
1. Advanced AI features
2. Performance optimization
3. Comprehensive testing
4. Production deployment

## Technical Considerations

### Database Schema Changes
- Add Department model
- Modify Staff model for department association
- Add complaint confirmation tracking
- Add audit log tables

### API Modifications
- Department-based authentication endpoints
- Citizen confirmation voting endpoints
- Supervisor chat endpoints
- AI integration endpoints

### Frontend Restructuring
- Language selection component
- Access mode routing
- Complaint preview components
- Chat interface components

## Success Metrics
- All features from draft implemented
- UI/UX matches user specifications
- Authentication system works as specified
- Complaint flow follows exact user journey
- AI features provide expected functionality

## Risk Mitigation
- Maintain backward compatibility during transition
- Implement feature flags for gradual rollout
- Comprehensive testing at each phase
- User feedback integration throughout development

---

*This plan ensures the JANMITRA app will exactly match the user's detailed draft and amendments while maintaining code quality and system reliability.*
