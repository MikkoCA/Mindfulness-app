# Mindfulness Chatbot Project
## ALWAYS DELETE MOCK DATA

## Overview
This project is an AI-powered mindfulness chatbot that provides personalized mental health support through natural conversation. The AI chatbot is the core of the application, actively listening to users and dynamically creating personalized exercises while tracking their emotional well-being through the mood tracker. The application is fully responsive and optimized for mobile devices, providing a seamless experience across all platforms.

## Tech Stack
- **Frontend**: Next.js 15+
- **Styling**: Tailwind CSS
- **AI Integration**: OpenRouter API
- **Authentication**: Auth0
- **Backend/Database**: MongoDB
- **Deployment**: Vercel

## Mobile Optimizations
- **Responsive Design**: Fully responsive UI that adapts to all screen sizes
- **Touch Optimization**: Touch-friendly interface with 44px minimum tap targets
- **iOS-Specific Features**: 
  - Safe area handling for notches and dynamic islands
  - Momentum scrolling for natural feel
  - Keyboard awareness to prevent input field obstruction
- **Performance Optimizations**:
  - Reduced animation complexity for mobile devices
  - Optimized asset loading for faster mobile performance
- **Typography Enhancements**:
  - Mobile-friendly font sizes (16px minimum for inputs to prevent zoom)
  - Line clamping for better text display on small screens

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
│   │   ├── SignupForm.tsx
│   │   └── Auth0Provider.tsx
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
│   ├── auth0Client.ts
│   └── openrouter.ts
└── types/
    └── index.ts

## Features
1. **Guided Meditation Sessions**
   - Timed meditation exercises
   - Different meditation styles (focused attention, body scan, loving-kindness)
   - Background ambient sounds
   - Mobile-friendly breathing visualization

2. **Breathing Exercises**
   - Box breathing
   - 4-7-8 breathing technique
   - Deep breathing guidance
   - Touch-responsive breathing animations

3. **Mindfulness Prompts**
   - Daily mindfulness challenges
   - Gratitude journaling prompts
   - Present moment awareness exercises
   - Mobile notification integration

4. **Mood Tracking**
   - Daily mood check-ins
   - Mood history visualization
   - Pattern recognition and insights
   - Mobile-optimized mood input interface

5. **Personalized Recommendations**
   - AI-powered suggestions based on user's mood and history
   - Customized exercise recommendations
   - Adaptive UI based on device type

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

## Auth0 Integration with Vercel
- **Production-Ready Authentication**: Seamless Auth0 integration configured for Vercel deployment
- **Custom Callback Handling**: Properly configured OAuth callbacks with secure token exchange
- **Mobile-Friendly Login**: Optimized authentication flow for mobile devices
- **Persistent Sessions**: Secure session management across page refreshes and app restarts
- **Protected Routes**: Authentication-gated content with mobile-aware redirects

## Implementation Plan
1. Set up Next.js project with Auth0 and MongoDB integration
2. Implement user authentication
3. Design and implement chat interface
4. Integrate OpenRouter API for AI capabilities
5. Develop exercise library and recommendation system
6. Implement mood tracking and visualization
7. Apply mobile optimizations and responsive design
8. Testing and refinement
9. Deployment to Vercel

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
   AUTH0_BASE_URL='https://your-vercel-app-url.vercel.app'
   AUTH0_ISSUER_BASE_URL='https://your-tenant.auth0.com'
   AUTH0_CLIENT_ID='your-auth0-client-id'
   AUTH0_CLIENT_SECRET='your-auth0-client-secret'
   MONGODB_URI='your-mongodb-connection-string'
   OPENROUTER_API_KEY='your-openrouter-api-key'
   NEXT_PUBLIC_APP_URL='https://your-vercel-app-url.vercel.app'
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
   - Auth0Provider for context management

2. **Implement Authentication Logic**
   - Auth0 Hooks
   - Protected Routes
   - User Context Provider
   - Mobile-aware authentication flows

3. **Create User Profile Management**
   - Profile Settings Page
   - Preference Management
   - Device-specific settings

### Phase 3: Chat Interface Development

1. **Design Chat UI Components**
   - Chat Container
   - Message Bubbles
   - Input Area
   - Quick Action Buttons
   - Mobile-optimized keyboard handling

2. **Implement Chat Logic**
   - Message State Management
   - Message History
   - Typing Indicators
   - Mobile network state awareness

3. **Create Initial Assessment Flow**
   - Questionnaire UI
   - Storing User Preferences
   - Touch-friendly input options

### Phase 4: AI Integration

1. **Set Up OpenRouter Connection**
   - API Client Setup
   - Error Handling
   - Rate Limiting
   - Mobile offline caching

2. **Implement Conversation Handling**
   - Context Management
   - Prompt Engineering
   - Response Processing
   - Low-bandwidth optimizations

3. **Create Exercise-Specific Prompts**
   - Meditation Guidance
   - Breathing Exercise Instructions
   - Mindfulness Prompts
   - Device-aware exercise variants

### Phase 5: Exercise Library and Recommendations

1. **Build Exercise Database**
   - Seed Database with Initial Exercises
   - Categorization System
   - Difficulty Levels
   - Mobile suitability tags

2. **Create Recommendation Algorithm**
   - Based on User Preferences
   - Based on Usage History
   - Based on Mood Data
   - Device type consideration

3. **Implement Exercise UI**
   - Exercise Cards
   - Detail Views
   - Progress Tracking
   - Touch-optimized controls

### Phase 6: Mood Tracking System

1. **Design Mood Input Interface**
   - Mood Selection UI
   - Optional Notes
   - Time Tracking
   - Mobile-friendly emotion selectors

2. **Create Visualization Components**
   - Mood History Chart
   - Trend Analysis
   - Insights Generation
   - Responsive data visualization

3. **Implement Notification System**
   - Reminder Setup
   - Custom Schedules
   - Mobile push notification support

### Phase 7: Mobile Optimization

1. **Implement Responsive Layouts**
   - Mobile-first grid systems
   - Touch-friendly UI elements
   - Screen size adaptations

2. **Optimize for iOS/iPhone**
   - Safe area margins
   - Notch/Dynamic Island accommodations
   - iOS-specific gesture support

3. **Enhance Performance**
   - Mobile network optimizations
   - Asset size reduction
   - Offline capability

### Phase 8: Testing and Refinement

1. **Implement Testing**
   - Unit Tests
   - Integration Tests
   - User Testing
   - Mobile device testing suite

2. **Performance Optimization**
   - Code Splitting
   - Image Optimization
   - API Response Caching
   - Mobile data saving techniques

3. **Accessibility Improvements**
   - Screen Reader Support
   - Keyboard Navigation
   - Color Contrast
   - Touch target sizing

### Phase 9: Deployment

1. **Prepare for Production**
   - Environment Configuration
   - Build Optimization
   - Security Checks
   - Mobile viewport configuration

2. **Deploy Application to Vercel**
   - Connect to GitHub repository
   - Configure environment variables
   - Set up Auth0 callback URLs for production
   - Enable automatic deployments

3. **Set Up Monitoring**
   - Error Tracking
   - Analytics
   - Performance Monitoring
   - Mobile usage metrics

## Future Enhancements
- Voice-guided exercises
- Community features
- Integration with wearable devices
- Expanded exercise library
- Therapist connection options
- Native mobile app versions
- Offline exercise packs

## Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Auth0 Documentation](https://auth0.com/docs)
- [MongoDB Documentation](https://www.mongodb.com/docs)
- [OpenRouter Documentation](https://openrouter.ai/docs)
- [Vercel Deployment Guide](https://vercel.com/docs/frameworks/nextjs)
- [Mobile Web Best Practices](https://developer.mozilla.org/en-US/docs/Web/Guide/Mobile)

## Key Features
1. **AI-Driven Personalization**
   - Natural conversation interface
   - Real-time exercise generation
   - Device-aware content adaptation
