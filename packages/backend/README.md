# AI Chatbot Backend

Express.js backend API for the AI Company Chatbot System.

## Features

- RESTful API with Express
- WebSocket support with Socket.io
- PostgreSQL database with Prisma ORM
- Redis caching
- JWT authentication
- Role-based authorization
- Groq AI API integration
- Comprehensive error handling
- Request validation with Zod
- Security headers and rate limiting

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis 7+
- Groq API key

### Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. Run database migrations:
   ```bash
   npm run migrate
   ```

4. (Optional) Seed the database:
   ```bash
   npm run seed
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The API will be available at http://localhost:3000.

## API Documentation

### Authentication Endpoints

- `POST /api/admin/login` - Admin login
- `POST /api/admin/logout` - Admin logout

### Chat Endpoints

- `POST /api/chat/sessions` - Create new chat session
- `POST /api/chat/messages` - Send message and get AI response
- `GET /api/chat/sessions/:id/messages` - Get session messages
- `GET /api/chat/history` - Get user chat history

### Admin Endpoints

- `GET /api/admin/knowledge` - List knowledge base entries
- `POST /api/admin/knowledge` - Create knowledge entry
- `PUT /api/admin/knowledge/:id` - Update knowledge entry
- `DELETE /api/admin/knowledge/:id` - Delete knowledge entry
- `POST /api/admin/knowledge/test` - Test keyword patterns
- `GET /api/admin/users` - List users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Deactivate user
- `GET /api/admin/health` - System health check
- `GET /api/admin/metrics` - Performance metrics
- `GET /api/admin/audit-logs` - Audit logs
- `GET /api/admin/unanswered` - Unanswered questions report

## Testing

```bash
# Run all tests
npm test

# Run unit tests
npm run test:unit

# Run integration tests
npm run test:integration

# Run property-based tests
npm run test:properties

# Run tests in watch mode
npm run test:watch
```

## Database

### Migrations

```bash
# Create a new migration
npm run migrate

# Deploy migrations to production
npm run migrate:deploy

# Open Prisma Studio
npm run prisma:studio
```

## Project Structure

```
packages/backend/
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── migrations/        # Database migrations
│   └── seed.ts           # Seed data
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Express middleware
│   ├── models/           # Data models and interfaces
│   ├── routes/           # API routes
│   ├── services/         # Business logic
│   ├── utils/            # Utility functions
│   └── index.ts          # Application entry point
├── tests/
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── properties/       # Property-based tests
└── package.json
```

## License

MIT
