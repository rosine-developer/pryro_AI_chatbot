# Getting Started with AI Company Chatbot

This guide will help you get the AI Company Chatbot system up and running on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 20+ and npm 10+
- **Docker** and Docker Compose
- **Groq API Key** (get one from [https://console.groq.com](https://console.groq.com))

## Quick Start (5 minutes)

### 1. Install Dependencies

```bash
# Install all dependencies for both frontend and backend
npm install
```

### 2. Set Up Environment Variables

Create the backend environment file:

```bash
cp packages/backend/.env.example packages/backend/.env
```

Edit `packages/backend/.env` and add your Groq API key:

```env
GROQ_API_KEY=your-groq-api-key-here
```

### 3. Start Docker Services

Start PostgreSQL and Redis:

```bash
docker-compose up -d postgres redis
```

Wait a few seconds for the services to be ready.

### 4. Set Up the Database

```bash
cd packages/backend

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run migrate

# Seed the database with sample data
npm run seed
```

This will create:
- Admin user: `admin` / `admin123`
- Test user: `testuser` / `user123`
- 5 sample knowledge base entries

### 5. Start the Application

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd packages/backend
npm run dev
```

The backend will start at http://localhost:3000

**Terminal 2 - Frontend:**
```bash
cd packages/frontend
npm run dev
```

The frontend will start at http://localhost:5173

### 6. Test the Application

Open your browser and go to http://localhost:5173

**Login as User:**
- Username: `testuser`
- Password: `user123`

**Login as Admin:**
- Username: `admin`
- Password: `admin123`

## What's Working

✅ **Core Features:**
- User and admin authentication with JWT
- Chat session management
- AI-powered responses (keyword matching + Groq API)
- Message history and persistence
- Admin health monitoring
- Unanswered questions tracking

✅ **AI Modes:**
- **Keyword Mode**: Fast, pattern-based responses
- **AI API Mode**: Advanced responses using Groq
- **Hybrid Mode** (default): Tries keyword first, falls back to AI API

## Testing the Chat

Try these sample questions:

1. **"How do I reset my password?"** - Should match keyword pattern
2. **"Tell me about your features"** - Should match keyword pattern
3. **"What's the weather like?"** - Will use AI API or fallback
4. **"Help me with my account"** - Should match keyword pattern

## API Endpoints

### Chat Endpoints (Requires Authentication)

```bash
# Create a session
curl -X POST http://localhost:3000/api/chat/sessions \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"

# Send a message
curl -X POST http://localhost:3000/api/chat/messages \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "sessionId": "SESSION_ID",
    "content": "How do I reset my password?"
  }'

# Get chat history
curl http://localhost:3000/api/chat/history \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Admin Endpoints

```bash
# Admin login
curl -X POST http://localhost:3000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "admin123"
  }'

# Health check (requires admin token)
curl http://localhost:3000/api/admin/health \
  -H "Authorization: Bearer ADMIN_TOKEN"

# Unanswered questions
curl http://localhost:3000/api/admin/unanswered \
  -H "Authorization: Bearer ADMIN_TOKEN"
```

## Database Management

### View Database with Prisma Studio

```bash
cd packages/backend
npm run prisma:studio
```

This opens a web interface at http://localhost:5555 where you can view and edit database records.

### Reset Database

```bash
cd packages/backend

# Drop and recreate database
npm run migrate -- --reset

# Seed again
npm run seed
```

## Configuration

### AI Mode Configuration

Edit `packages/backend/src/services/ai-response-engine.service.ts`:

```typescript
this.config = {
  mode: 'hybrid', // 'keyword' | 'ai-api' | 'hybrid'
  keywordMatcherEnabled: true,
  aiApiEnabled: true,
  fallbackToKeyword: true,
  maxContextMessages: 10,
  maxContextLength: 5000,
};
```

Or set via environment variable:

```env
AI_MODE=hybrid  # keyword | ai-api | hybrid
```

### Add Knowledge Base Entries

You can add entries via Prisma Studio or directly in the seed file:

```typescript
// packages/backend/prisma/seed.ts
{
  category: 'Support',
  keywords: ['help', 'support', 'contact'],
  response: 'Contact us at support@example.com',
  priority: 1,
  createdBy: admin.id,
}
```

## Troubleshooting

### Port Already in Use

If ports 3000 or 5173 are in use:

**Backend:**
```env
# packages/backend/.env
PORT=3001
```

**Frontend:**
```javascript
// packages/frontend/vite.config.ts
server: {
  port: 5174,
}
```

### Database Connection Error

Make sure PostgreSQL is running:

```bash
docker-compose ps
```

If not running:

```bash
docker-compose up -d postgres
```

### Redis Connection Error

Make sure Redis is running:

```bash
docker-compose up -d redis
```

### Groq API Errors

1. Check your API key is correct in `.env`
2. Verify you have API credits at https://console.groq.com
3. Check the logs for specific error messages

### "Module not found" Errors

```bash
# Clean install
rm -rf node_modules package-lock.json
rm -rf packages/*/node_modules packages/*/package-lock.json
npm install
```

## Development Tips

### Hot Reload

Both frontend and backend support hot reload:
- Backend: Uses `tsx watch`
- Frontend: Uses Vite HMR

Changes will automatically reload.

### View Logs

**Backend logs:**
```bash
tail -f packages/backend/logs/combined.log
```

**Error logs:**
```bash
tail -f packages/backend/logs/error.log
```

### Debug Mode

Set log level to debug:

```env
# packages/backend/.env
LOG_LEVEL=debug
```

## Next Steps

Now that you have the basic system running, you can:

1. **Customize the Knowledge Base** - Add your own FAQs and responses
2. **Modify the UI** - Customize the frontend components
3. **Add Features** - Implement additional endpoints or functionality
4. **Deploy** - Follow the deployment guide (coming soon)

## Need Help?

- Check `IMPLEMENTATION_STATUS.md` for what's implemented
- Review the code in `packages/backend/src` and `packages/frontend/src`
- Check the logs for error messages

## What's Next?

The following features are planned but not yet implemented:

- WebSocket real-time messaging
- Admin dashboard UI (knowledge base management, user management)
- Rate limiting
- Data encryption at rest
- Production deployment configuration
- Comprehensive test suite

See `IMPLEMENTATION_STATUS.md` for the complete status.
