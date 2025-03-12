# Mindfulness Chatbot Project
## ALWAYS DELETE MOCK DATA

## Overview
This project is an AI-powered mindfulness chatbot that provides personalized mental health support through natural conversation. The AI chatbot is the core of the application, actively listening to users and dynamically creating personalized exercises while tracking their emotional well-being through the mood tracker.

## Tech Stack
- **Frontend**: Next.js
- **Styling**: Tailwind CSS
- **AI Integration**: OpenRouter API
- **Authentication**: Auth0
- **Backend/Database**: MongoDB

## Folder Structure
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   └── signup/
│   │       └── page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── exercises/
│   │   └── page.tsx
│   ├── mood-tracker/
│   │   └── page.tsx
│   └── chat/
│       └── page.tsx
├── components/
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   └── SignupForm.tsx
│   ├── chat/
│   │   ├── ChatContainer.tsx
│   │   ├── MessageBubble.tsx
│   │   └── ChatInput.tsx
│   ├── exercises/
│   │   └── ExerciseCard.tsx
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Sidebar.tsx
│   │   └── Footer.tsx
│   └── mood/
│       └── MoodTracker.tsx
├── lib/
│   ├── auth0.ts
│   └── openrouter.ts
└── types/
    └── index.ts

## Features
1. **Guided Meditation Sessions**
   - Timed meditation exercises
   - Different meditation styles (focused attention, body scan, loving-kindness)
   - Background ambient sounds

2. **Breathing Exercises**
   - Box breathing
   - 4-7-8 breathing technique
   - Deep breathing guidance

3. **Mindfulness Prompts**
   - Daily mindfulness challenges
   - Gratitude journaling prompts
   - Present moment awareness exercises

4. **Mood Tracking**
   - Daily mood check-ins
   - Mood history visualization
   - Pattern recognition and insights

5. **Personalized Recommendations**
   - AI-powered suggestions based on user's mood and history
   - Customized exercise recommendations

## User Flow
1. User signs up/logs in (Auth0 authentication)
2. Completes initial assessment for personalization
3. Accesses dashboard with recommended exercises
4. Interacts with the chatbot for guided exercises
5. Tracks progress and receives insights

## Data Structure (MongoDB)
- **Users Collection**: User profiles and preferences
- **Sessions Collection**: Record of completed exercises
- **Moods Collection**: Mood tracking data
- **Exercises Collection**: Library of available exercises

## AI Integration (OpenRouter)
- Natural language processing for understanding user inputs
- Contextual responses based on user's emotional state
- Personalized guidance through exercises
- Progress tracking and adaptive recommendations

## Implementation Plan
1. Set up Next.js project with Auth0 and MongoDB integration
2. Implement user authentication
3. Design and implement chat interface
4. Integrate OpenRouter API for AI capabilities
5. Develop exercise library and recommendation system
6. Implement mood tracking and visualization
7. Testing and refinement
8. Deployment

## Detailed Step-by-Step Implementation Guide

### Phase 1: Project Setup and Configuration

1. **Initialize Next.js Project**
   ```bash
   npx create-next-app@latest mindfulness-chatbot
   cd mindfulness-chatbot
   ```

2. **Install Required Dependencies**
   ```bash
   npm install @auth0/auth0-react @auth0/nextjs-auth0 openrouter tailwindcss @headlessui/react @heroicons/react react-markdown
   ```

3. **Set Up Tailwind CSS**
   ```bash
   npx tailwindcss init -p
   ```

4. **Set Up Environment Variables**
   - Create `.env.local` file with:
   ```
   AUTH0_SECRET='your-auth0-secret'
   AUTH0_BASE_URL='http://localhost:3000'
   AUTH0_ISSUER_BASE_URL='https://your-tenant.auth0.com'
   AUTH0_CLIENT_ID='your-auth0-client-id'
   AUTH0_CLIENT_SECRET='your-auth0-client-secret'
   MONGODB_URI='your-mongodb-connection-string'
   OPENROUTER_API_KEY='your-openrouter-api-key'
   ```

5. **Create MongoDB Database Collections**
   - Users Collection
   - Sessions Collection
   - Moods Collection
   - Exercises Collection

### Phase 2: Authentication and User Management

1. **Create Authentication Components**
   - Sign Up Form
   - Login Form
   - Password Reset

2. **Implement Authentication Logic**
   - Auth0 Hooks
   - Protected Routes
   - User Context Provider

3. **Create User Profile Management**
   - Profile Settings Page
   - Preference Management

### Phase 3: Chat Interface Development

1. **Design Chat UI Components**
   - Chat Container
   - Message Bubbles
   - Input Area
   - Quick Action Buttons

2. **Implement Chat Logic**
   - Message State Management
   - Message History
   - Typing Indicators

3. **Create Initial Assessment Flow**
   - Questionnaire UI
   - Storing User Preferences

### Phase 4: AI Integration

1. **Set Up OpenRouter Connection**
   - API Client Setup
   - Error Handling
   - Rate Limiting

2. **Implement Conversation Handling**
   - Context Management
   - Prompt Engineering
   - Response Processing

3. **Create Exercise-Specific Prompts**
   - Meditation Guidance
   - Breathing Exercise Instructions
   - Mindfulness Prompts

### Phase 5: Exercise Library and Recommendations

1. **Build Exercise Database**
   - Seed Database with Initial Exercises
   - Categorization System
   - Difficulty Levels

2. **Create Recommendation Algorithm**
   - Based on User Preferences
   - Based on Usage History
   - Based on Mood Data

3. **Implement Exercise UI**
   - Exercise Cards
   - Detail Views
   - Progress Tracking

### Phase 6: Mood Tracking System

1. **Design Mood Input Interface**
   - Mood Selection UI
   - Optional Notes
   - Time Tracking

2. **Create Visualization Components**
   - Mood History Chart
   - Trend Analysis
   - Insights Generation

3. **Implement Notification System**
   - Reminder Setup
   - Custom Schedules

### Phase 7: Testing and Refinement

1. **Implement Testing**
   - Unit Tests
   - Integration Tests
   - User Testing

2. **Performance Optimization**
   - Code Splitting
   - Image Optimization
   - API Response Caching

3. **Accessibility Improvements**
   - Screen Reader Support
   - Keyboard Navigation
   - Color Contrast

### Phase 8: Deployment

1. **Prepare for Production**
   - Environment Configuration
   - Build Optimization
   - Security Checks

2. **Deploy Application**
   - Vercel Deployment
   - Database Migration
   - DNS Configuration

3. **Set Up Monitoring**
   - Error Tracking
   - Analytics
   - Performance Monitoring

## Future Enhancements
- Voice-guided exercises
- Community features
- Integration with wearable devices
- Expanded exercise library
- Therapist connection options

## Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Auth0 Documentation](https://auth0.com/docs)
- [MongoDB Documentation](https://www.mongodb.com/docs)
- [OpenRouter Documentation](https://openrouter.ai/docs)

## Key Features
1. **AI-Driven Personalization**
   - Natural conversation interface
   - Real-time exercise generation
