# Mindfulness Chatbot

A modern web application that combines AI-powered chat interactions with mood tracking capabilities to support mental wellness and mindfulness practices.

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
```

## Running the Application

Start the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

## Project Structure

```
mindfulness-chatbot/
├── src/
│   ├── app/                 # Next.js app directory
│   │   ├── mood/           # Mood tracking feature
│   │   └── chat/           # Chat interface
│   ├── components/         # Reusable React components
│   ├── types/             # TypeScript type definitions
│   └── utils/             # Utility functions
├── public/                # Static files
└── package.json          # Project dependencies and scripts
```

## Key Features Usage

### Chat Interface
- Navigate to the chat section
- Type your message or select from suggested responses
- Interact with the AI assistant for mindfulness guidance

### Mood Tracking
- Access the mood tracking section
- Select your current mood from available options
- Add relevant factors affecting your mood
- Add optional notes for context
- View your mood history and insights

## Deployment

The easiest way to deploy this application is using the [Vercel Platform](https://vercel.com/new).

1. Push your code to a GitHub repository
2. Sign up on Vercel with your GitHub account
3. Import your repository
4. Configure environment variables:
   - Add your `OPENROUTER_API_KEY`
5. Deploy

The application will be automatically deployed and available at a `.vercel.app` domain.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
## Support

For support, please open an issue in the GitHub repository or contact the maintainers.

