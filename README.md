# Mindfulness Chatbot

A modern web application that combines AI-powered chat interactions with mood tracking capabilities to support mental wellness and mindfulness practices. Fully responsive and optimized for mobile devices, including iPhone.

## Features

### AI Chat Assistant
- Personalized mindfulness and meditation guidance
- Real-time chat interface with AI responses
- Support for various topics including breathing exercises, meditation, and stress management

### Mood Tracking
- Daily mood logging with multiple mood options
- Factor tracking to identify mood influences
- Notes feature for personal reflections
- Visual mood history and trends
- Insights dashboard with weekly and monthly analytics

### Mobile Optimization
- Responsive design adapting to all screen sizes
- iOS-specific optimizations for iPhone compatibility
- Touch-friendly navigation with 44px minimum tap targets
- Mobile-optimized inputs preventing keyboard zoom issues
- Safe area handling for notches and dynamic islands
- Enhanced performance on mobile networks
- Optimized for both portrait and landscape orientations

### Authentication System
- Secure Auth0 integration with Vercel deployment
- Persistent login sessions
- Protected routes with mobile-aware redirects
- Optimized authentication flow for mobile devices

## Prerequisites

Before you begin, ensure you have installed:
- [Node.js](https://nodejs.org/) (version 18 or higher)
- npm (comes with Node.js) or [yarn](https://yarnpkg.com/)

## Installation

1. Clone the repository:
```bash
git clone [your-repository-url]
cd mindfulness-chatbot
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Create a `.env.local` file in the root directory with your API keys:
```env
OPENROUTER_API_KEY=your_openrouter_api_key
AUTH0_SECRET=your_auth0_secret
AUTH0_BASE_URL=https://your-vercel-app-url.vercel.app
AUTH0_ISSUER_BASE_URL=https://your-tenant.auth0.com
AUTH0_CLIENT_ID=your_auth0_client_id
AUTH0_CLIENT_SECRET=your_auth0_client_secret
NEXT_PUBLIC_APP_URL=https://your-vercel-app-url.vercel.app
```

## Running the Application

Start the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.
For mobile testing, you can use your local IP address with the port number to access from a mobile device on the same network.

## Project Structure

```
mindfulness-chatbot/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── api/             # API routes including Auth0 callback
│   │   ├── auth/            # Authentication pages
│   │   ├── mood-tracker/    # Mood tracking feature
│   │   └── chat/            # Chat interface
│   ├── components/          # Reusable React components
│   │   ├── auth/            # Authentication components including Auth0Provider
│   │   ├── layout/          # Layout components (Header, Sidebar)
│   │   └── chat/            # Chat interface components
│   ├── lib/                 # Utility libraries
│   │   ├── auth0.ts         # Auth0 utilities
│   │   ├── auth0Client.ts   # Auth0 client for Vercel integration
│   │   └── openrouter.ts    # OpenRouter API integration
│   ├── types/               # TypeScript type definitions
│   └── utils/               # Utility functions
├── public/                  # Static files
└── package.json             # Project dependencies and scripts
```

## Key Features Usage

### Chat Interface
- Navigate to the chat section
- Type your message or select from suggested responses
- Interact with the AI assistant for mindfulness guidance
- Mobile-optimized chat input prevents keyboard issues

### Mood Tracking
- Access the mood tracking section
- Select your current mood from available options
- Add relevant factors affecting your mood
- Add optional notes for context
- View your mood history and insights
- Optimized for touch interaction on mobile devices

### Authentication
- Secure login and signup through Auth0
- Protected routes requiring authentication
- Persistent sessions across devices
- Mobile-friendly authentication flow

## Mobile Compatibility

The application is fully optimized for mobile devices:

- **Responsive Design**: Adapts fluidly to different screen sizes from phones to tablets to desktops
- **Touch Interface**: All interactive elements are sized appropriately for touch (44px minimum)
- **iOS Enhancements**:
  - Safe area insets for notches and home indicators
  - Momentum scrolling for native feel
  - Fixed font sizing to prevent zoom when focusing on inputs
  - Keyboard awareness to prevent input field obstruction
- **Performance**: Optimized asset loading and network handling for mobile connections
- **Offline Support**: Basic functionality remains available even with intermittent connectivity

## Deployment

The application is configured for seamless deployment on Vercel:

1. Push your code to a GitHub repository
2. Sign up on Vercel with your GitHub account
3. Import your repository
4. Configure environment variables:
   - Add all required Auth0 environment variables
   - Add your `OPENROUTER_API_KEY`
   - Set `NEXT_PUBLIC_APP_URL` to your Vercel deployment URL
5. In your Auth0 dashboard:
   - Update Allowed Callback URLs to include: `https://your-vercel-app-url.vercel.app/api/auth/callback`
   - Update Allowed Logout URLs to include: `https://your-vercel-app-url.vercel.app`
   - Update Allowed Web Origins to include: `https://your-vercel-app-url.vercel.app`
6. Deploy

The application will be automatically deployed and available at your Vercel URL.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, please open an issue in the GitHub repository or contact the maintainers.
