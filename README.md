# AI Company Chatbot System

A full-stack web application that provides intelligent conversational assistance through a modern chat interface. The system supports both keyword matching and AI-powered natural language processing using the Groq API.

## Features

- 💬 Real-time chat interface with WebSocket support
- 🤖 Dual AI modes: Keyword matching and Groq AI API
- 👥 User and admin authentication with JWT
- 📊 Admin dashboard for knowledge base and user management
- 🔒 Comprehensive security (TLS, encryption, input sanitization)
- 📈 System monitoring and health checks
- 🧪 Property-based testing for correctness guarantees

## Tech Stack

### Frontend
- React 18+ with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- Socket.io-client for real-time updates
- React Router for navigation

### Backend
- Node.js 20+ with Express
- TypeScript for type safety
- Prisma ORM for database access
- PostgreSQL 15+ for data storage
- Redis 7+ for caching
- Socket.io for WebSocket support
- Groq SDK for AI integration

## Project Structure

```
ai-company-chatbot/
├── packages/
│   ├── frontend/          # React frontend application
│   └── backend/           # Express backend API
├── docker-compose.yml     # Docker services configuration
├── package.json           # Root package.json with workspaces
└── README.md             # This file
```

## Getting Started

### Prerequisites

- Node.js 20+ and npm 10+
- Docker and Docker Compose
- Groq API key (for AI features)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp packages/backend/.env.example packages/backend/.env
   # Edit .env with your configuration
   ```

4. Start Docker services:
   ```bash
   docker-compose up -d
   ```

5. Run database migrations:
   ```bash
   npm run migrate --workspace=packages/backend
   ```

6. Start development servers:
   ```bash
   npm run dev
   ```

The frontend will be available at http://localhost:5173 and the backend at http://localhost:3000.

## Development

### Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run build` - Build both packages for production
- `npm run test` - Run all tests
- `npm run test:unit` - Run unit tests
- `npm run test:integration` - Run integration tests
- `npm run test:properties` - Run property-based tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run lint` - Lint all packages
- `npm run format` - Format code with Prettier

### Testing

The project uses multiple testing strategies:

- **Property-based testing** with fast-check for universal correctness properties
- **Unit testing** with Jest for specific examples and edge cases
- **Integration testing** with Supertest and Testcontainers
- **E2E testing** with Playwright for complete user workflows

## Deployment

See [packages/backend/docs/deployment.md](packages/backend/docs/deployment.md) for deployment instructions.

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guidelines before submitting pull requests.
