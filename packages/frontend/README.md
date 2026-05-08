# AI Chatbot Frontend

React frontend application for the AI Company Chatbot System.

## Features

- Modern React 18+ with TypeScript
- Vite for fast development and optimized builds
- Tailwind CSS for styling
- Socket.io for real-time updates
- React Router for navigation
- Context API for state management
- Responsive design for desktop and mobile

## Getting Started

### Prerequisites

- Node.js 20+
- Backend API running on http://localhost:3000

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

The application will be available at http://localhost:5173.

## Building for Production

```bash
npm run build
```

The production build will be in the `dist` directory.

## Testing

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run E2E tests
npm run test:e2e

# Run tests in watch mode
npm run test:watch
```

## Project Structure

```
packages/frontend/
├── public/               # Static assets
├── src/
│   ├── components/       # React components
│   │   ├── chat/        # Chat interface components
│   │   ├── admin/       # Admin dashboard components
│   │   └── common/      # Shared components
│   ├── contexts/        # React contexts
│   ├── hooks/           # Custom React hooks
│   ├── services/        # API services
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   ├── App.tsx          # Main App component
│   └── main.tsx         # Application entry point
├── tests/
│   ├── unit/            # Unit tests
│   └── e2e/             # E2E tests with Playwright
└── package.json
```

## Available Routes

- `/` - Chat interface (requires authentication)
- `/login` - User login
- `/admin` - Admin dashboard (requires admin role)
- `/admin/knowledge` - Knowledge base management
- `/admin/users` - User management
- `/admin/history` - Chat history viewer
- `/admin/health` - System health dashboard
- `/admin/audit` - Audit logs

## License

MIT
