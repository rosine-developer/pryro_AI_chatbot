# Design Document: AI Company Chatbot System

## Overview

The AI Company Chatbot System is a full-stack web application that provides intelligent conversational assistance through a modern chat interface. The system supports two AI processing modes: a beginner-friendly keyword matching engine and an advanced natural language processing engine powered by the Groq AI API. The architecture follows a three-tier design with a React-based frontend, Node.js/Express backend, and PostgreSQL database.

### Key Design Goals

1. **Dual AI Modes**: Support both keyword-based matching (fast, predictable) and AI API processing (advanced, context-aware)
2. **Real-time Responsiveness**: Sub-second UI updates with typing indicators and optimistic rendering
3. **Scalability**: Handle 1000+ concurrent users with connection pooling and caching
4. **Security**: End-to-end encryption, authentication, input sanitization, and audit logging
5. **Maintainability**: Clear separation between frontend, backend, and data layers with well-defined APIs

## Architecture

### System Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        UI[React Chat Interface]
        Admin[React Admin Dashboard]
    end
    
    subgraph "API Gateway Layer"
        Gateway[Express API Gateway]
        Auth[Authentication Middleware]
        RateLimit[Rate Limiter]
    end
    
    subgraph "Application Layer"
        ChatAPI[Chat API Service]
        AdminAPI[Admin API Service]
        AIEngine[AI Response Engine]
        KWMatcher[Keyword Matcher]
        AIProcessor[AI API Processor]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL Database)]
        Cache[Redis Cache]
    end
    
    subgraph "External Services"
        GroqAPI[Groq AI API]
    end
    
    UI --> Gateway
    Admin --> Gateway
    Gateway --> Auth
    Auth --> RateLimit
    RateLimit --> ChatAPI
    RateLimit --> AdminAPI
    ChatAPI --> AIEngine
    AdminAPI --> DB
    AIEngine --> KWMatcher
    AIEngine --> AIProcessor
    AIProcessor --> GroqAPI
    KWMatcher --> Cache
    AIEngine --> DB
    ChatAPI --> DB
    Cache --> DB
```

### Technology Stack

#### Frontend
- **Framework**: React 18+ with TypeScript
- **State Management**: React Context API + useReducer for chat state
- **UI Components**: Tailwind CSS for styling, Headless UI for accessible components
- **HTTP Client**: Axios with interceptors for authentication
- **Real-time Updates**: WebSocket (Socket.io-client) for typing indicators and live responses
- **Build Tool**: Vite for fast development and optimized production builds

#### Backend
- **Runtime**: Node.js 20+ LTS
- **Framework**: Express.js 4.x
- **Language**: TypeScript for type safety
- **WebSocket**: Socket.io for real-time communication
- **Authentication**: JWT (jsonwebtoken) with bcrypt for password hashing
- **Validation**: Zod for request/response schema validation
- **ORM**: Prisma for type-safe database access
- **Caching**: Redis for knowledge base and session caching
- **AI Integration**: Groq SDK for AI API calls

#### Database
- **Primary Database**: PostgreSQL 15+
- **Caching Layer**: Redis 7+
- **Migration Tool**: Prisma Migrate

#### Infrastructure
- **Containerization**: Docker with docker-compose for local development
- **Reverse Proxy**: Nginx for SSL termination and load balancing
- **Monitoring**: Winston for logging, Prometheus metrics
- **Deployment**: Docker containers on cloud platform (AWS/GCP/Azure)

### Deployment Architecture

```mermaid
graph LR
    subgraph "Load Balancer"
        LB[Nginx Load Balancer<br/>SSL Termination]
    end
    
    subgraph "Application Tier"
        App1[Node.js Instance 1]
        App2[Node.js Instance 2]
        App3[Node.js Instance N]
    end
    
    subgraph "Data Tier"
        Primary[(PostgreSQL Primary)]
        Replica[(PostgreSQL Replica)]
        RedisCluster[Redis Cluster]
    end
    
    Client[Clients] --> LB
    LB --> App1
    LB --> App2
    LB --> App3
    App1 --> Primary
    App2 --> Primary
    App3 --> Primary
    Primary --> Replica
    App1 --> RedisCluster
    App2 --> RedisCluster
    App3 --> RedisCluster
```

## Components and Interfaces

### Frontend Components

#### 1. Chat Interface Component

**Responsibility**: Render the chat UI, handle user input, display messages and responses

**Key Sub-Components**:
- `ChatContainer`: Main container managing chat state
- `MessageList`: Scrollable list of messages with auto-scroll
- `MessageInput`: Text input with character counter and validation
- `MessageBubble`: Individual message display (user vs bot styling)
- `TypingIndicator`: Animated indicator during AI processing
- `ErrorBoundary`: Graceful error handling for component failures

**State Management**:
```typescript
interface ChatState {
  messages: Message[];
  currentSessionId: string;
  isTyping: boolean;
  error: string | null;
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
}
```

**Props Interface**:
```typescript
interface ChatInterfaceProps {
  userId: string;
  sessionId?: string;
  onNewSession: () => void;
}
```

#### 2. Admin Dashboard Component

**Responsibility**: Provide admin interface for system management

**Key Sub-Components**:
- `KnowledgeBaseManager`: CRUD operations for knowledge entries
- `UserManager`: User account management interface
- `ChatHistoryViewer`: Search and view conversation logs
- `SystemHealthDashboard`: Real-time system metrics
- `AuditLogViewer`: View administrative action logs
- `AIConfigPanel`: Configure keyword patterns and AI API settings

### Backend Services

#### 1. Chat API Service

**Responsibility**: Handle chat-related HTTP and WebSocket requests

**Endpoints**:
```typescript
// REST Endpoints
POST   /api/chat/sessions          // Create new session
GET    /api/chat/sessions/:id      // Get session details
GET    /api/chat/sessions/:id/messages  // Get session messages
POST   /api/chat/messages          // Send message (also triggers AI processing)
GET    /api/chat/history           // Get user's chat history

// WebSocket Events
socket.on('message:send', handler)     // Real-time message submission
socket.emit('message:received', data)  // Broadcast user message
socket.emit('typing:start', data)      // AI processing started
socket.emit('typing:stop', data)       // AI processing completed
socket.emit('response:ready', data)    // AI response available
```

**Interface**:
```typescript
interface ChatAPIService {
  createSession(userId: string): Promise<Session>;
  sendMessage(sessionId: string, userId: string, content: string): Promise<Message>;
  getSessionMessages(sessionId: string, userId: string): Promise<Message[]>;
  getUserHistory(userId: string, filters: HistoryFilters): Promise<Session[]>;
}
```

#### 2. Admin API Service

**Responsibility**: Handle administrative operations

**Endpoints**:
```typescript
// Authentication
POST   /api/admin/login            // Admin login
POST   /api/admin/logout           // Admin logout
GET    /api/admin/verify           // Verify JWT token

// Knowledge Base Management
GET    /api/admin/knowledge        // List all knowledge entries
POST   /api/admin/knowledge        // Create knowledge entry
PUT    /api/admin/knowledge/:id    // Update knowledge entry
DELETE /api/admin/knowledge/:id    // Delete knowledge entry
POST   /api/admin/knowledge/test   // Test keyword patterns

// User Management
GET    /api/admin/users            // List all users
POST   /api/admin/users            // Create user
PUT    /api/admin/users/:id        // Update user
DELETE /api/admin/users/:id        // Deactivate user

// Monitoring
GET    /api/admin/health           // System health status
GET    /api/admin/metrics          // Performance metrics
GET    /api/admin/audit-logs       // Audit log entries
GET    /api/admin/unanswered       // Unanswered questions report
```

#### 3. AI Response Engine

**Responsibility**: Core AI processing logic, orchestrates keyword matching and AI API calls

**Architecture**:
```typescript
interface AIResponseEngine {
  processMessage(
    message: string,
    sessionContext: ConversationContext,
    config: AIConfig
  ): Promise<AIResponse>;
}

interface AIConfig {
  mode: 'keyword' | 'ai-api' | 'hybrid';
  keywordMatcherEnabled: boolean;
  aiApiEnabled: boolean;
  fallbackToKeyword: boolean;
  maxContextMessages: number;
  maxContextLength: number;
}

interface ConversationContext {
  sessionId: string;
  previousMessages: Message[];
  userId: string;
}

interface AIResponse {
  content: string;
  confidence: number;
  source: 'keyword' | 'ai-api' | 'fallback';
  processingTime: number;
  matchedKnowledge?: KnowledgeEntry[];
}
```

**Processing Flow**:
```mermaid
graph TD
    Start[Receive Message] --> LoadContext[Load Session Context]
    LoadContext --> CheckMode{AI Mode?}
    
    CheckMode -->|Keyword| KW[Keyword Matcher]
    CheckMode -->|AI API| API[AI API Processor]
    CheckMode -->|Hybrid| TryKW[Try Keyword First]
    
    TryKW --> KWMatch{Match Found?}
    KWMatch -->|Yes| Return1[Return Keyword Response]
    KWMatch -->|No| API
    
    KW --> KWResult{Match Found?}
    KWResult -->|Yes| Return2[Return Response]
    KWResult -->|No| Fallback1[Fallback Response]
    
    API --> APICall[Call Groq API]
    APICall --> APISuccess{Success?}
    APISuccess -->|Yes| Return3[Return AI Response]
    APISuccess -->|No| CheckFallback{Fallback Enabled?}
    CheckFallback -->|Yes| KW
    CheckFallback -->|No| Fallback2[Fallback Response]
    
    Return1 --> Store[Store Response]
    Return2 --> Store
    Return3 --> Store
    Fallback1 --> Store
    Fallback2 --> Store
    Store --> End[Return to User]
```

#### 4. Keyword Matcher

**Responsibility**: Fast keyword-based response matching

**Algorithm**:
```typescript
interface KeywordMatcher {
  match(message: string, knowledgeBase: KnowledgeEntry[]): MatchResult | null;
}

interface KnowledgeEntry {
  id: string;
  keywords: string[];
  response: string;
  priority: number;
  category: string;
}

interface MatchResult {
  entry: KnowledgeEntry;
  matchedKeywords: string[];
  matchScore: number;
}

// Matching Algorithm:
// 1. Normalize message (lowercase, remove punctuation)
// 2. Tokenize message into words
// 3. For each knowledge entry:
//    - Count matching keywords
//    - Calculate score = (matched_keywords / total_keywords) * priority
// 4. Return entry with highest score (if score > threshold)
```

**Caching Strategy**:
- Cache all knowledge entries in Redis on startup
- Invalidate cache on knowledge base updates
- TTL: 1 hour with background refresh

#### 5. AI API Processor

**Responsibility**: Interface with Groq AI API for natural language processing

**Implementation**:
```typescript
interface AIAPIProcessor {
  generateResponse(
    message: string,
    context: ConversationContext,
    knowledgeBase: KnowledgeEntry[]
  ): Promise<string>;
}

// Request Construction:
// 1. Build system prompt with knowledge base context
// 2. Include last N messages from conversation
// 3. Add user message
// 4. Call Groq API with configured model
// 5. Parse and return response
```

**Groq API Configuration**:
```typescript
interface GroqConfig {
  apiKey: string;
  model: string; // e.g., 'mixtral-8x7b-32768'
  maxTokens: number;
  temperature: number;
  timeout: number; // milliseconds
}
```

**Context Building**:
```typescript
function buildPrompt(
  message: string,
  context: ConversationContext,
  knowledge: KnowledgeEntry[]
): GroqPrompt {
  const systemPrompt = `You are a helpful company chatbot assistant. 
Use the following knowledge base to answer questions:

${knowledge.map(k => `Topic: ${k.category}\nInfo: ${k.response}`).join('\n\n')}

Provide concise, accurate answers based on this knowledge.`;

  const conversationHistory = context.previousMessages
    .slice(-10) // Last 10 messages
    .map(m => ({
      role: m.isUser ? 'user' : 'assistant',
      content: m.content
    }));

  return {
    model: config.model,
    messages: [
      { role: 'system', content: systemPrompt },
      ...conversationHistory,
      { role: 'user', content: message }
    ]
  };
}
```

## Data Models

### Database Schema

```sql
-- Users Table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user', -- 'user' or 'admin'
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_activity_at TIMESTAMP,
  CONSTRAINT valid_role CHECK (role IN ('user', 'admin'))
);

-- Sessions Table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  started_at TIMESTAMP NOT NULL DEFAULT NOW(),
  last_message_at TIMESTAMP NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  context_summary TEXT, -- Optional summary for long sessions
  INDEX idx_user_sessions (user_id, started_at DESC),
  INDEX idx_active_sessions (is_active, last_message_at)
);

-- Messages Table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_user_message BOOLEAN NOT NULL,
  ai_source VARCHAR(50), -- 'keyword', 'ai-api', 'fallback'
  confidence_score DECIMAL(3,2), -- 0.00 to 1.00
  processing_time_ms INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  INDEX idx_session_messages (session_id, created_at),
  INDEX idx_user_messages (user_id, created_at DESC),
  CONSTRAINT valid_ai_source CHECK (ai_source IN ('keyword', 'ai-api', 'fallback') OR ai_source IS NULL)
);

-- Knowledge Base Table
CREATE TABLE knowledge_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category VARCHAR(255) NOT NULL,
  keywords TEXT[] NOT NULL, -- PostgreSQL array of keywords
  response TEXT NOT NULL,
  priority INTEGER NOT NULL DEFAULT 1,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  INDEX idx_category (category),
  INDEX idx_keywords USING GIN(keywords) -- GIN index for array search
);

-- Audit Logs Table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES users(id),
  action_type VARCHAR(100) NOT NULL, -- 'create', 'update', 'delete', 'view'
  resource_type VARCHAR(100) NOT NULL, -- 'knowledge', 'user', 'chat_history'
  resource_id UUID,
  details JSONB, -- Flexible JSON for action-specific details
  ip_address INET,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  INDEX idx_admin_actions (admin_id, created_at DESC),
  INDEX idx_resource_audit (resource_type, resource_id, created_at DESC)
);

-- System Metrics Table (for monitoring)
CREATE TABLE system_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_type VARCHAR(100) NOT NULL, -- 'response_time', 'error_rate', 'active_users'
  metric_value DECIMAL(10,2) NOT NULL,
  metadata JSONB,
  recorded_at TIMESTAMP NOT NULL DEFAULT NOW(),
  INDEX idx_metric_type_time (metric_type, recorded_at DESC)
);

-- Unanswered Questions Log
CREATE TABLE unanswered_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  session_id UUID NOT NULL REFERENCES sessions(id),
  question TEXT NOT NULL,
  attempted_source VARCHAR(50), -- What was tried
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  resolved BOOLEAN NOT NULL DEFAULT false,
  INDEX idx_unresolved (resolved, created_at DESC)
);
```

### TypeScript Data Models

```typescript
// User Model
interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  isActive: boolean;
  createdAt: Date;
  lastActivityAt: Date | null;
}

// Session Model
interface Session {
  id: string;
  userId: string;
  startedAt: Date;
  lastMessageAt: Date;
  isActive: boolean;
  contextSummary: string | null;
}

// Message Model
interface Message {
  id: string;
  sessionId: string;
  userId: string;
  content: string;
  isUserMessage: boolean;
  aiSource: 'keyword' | 'ai-api' | 'fallback' | null;
  confidenceScore: number | null;
  processingTimeMs: number | null;
  createdAt: Date;
}

// Knowledge Entry Model
interface KnowledgeEntry {
  id: string;
  category: string;
  keywords: string[];
  response: string;
  priority: number;
  createdBy: string | null;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

// Audit Log Model
interface AuditLog {
  id: string;
  adminId: string;
  actionType: 'create' | 'update' | 'delete' | 'view';
  resourceType: 'knowledge' | 'user' | 'chat_history';
  resourceId: string | null;
  details: Record<string, any>;
  ipAddress: string | null;
  createdAt: Date;
}
```

## API Design

### REST API Specification

#### Authentication

All authenticated endpoints require JWT token in Authorization header:
```
Authorization: Bearer <jwt_token>
```

#### Chat Endpoints

**POST /api/chat/sessions**
```typescript
// Request
{
  userId: string;
}

// Response (201 Created)
{
  sessionId: string;
  startedAt: string; // ISO 8601
}
```

**POST /api/chat/messages**
```typescript
// Request
{
  sessionId: string;
  userId: string;
  content: string; // Max 2000 characters
}

// Response (200 OK)
{
  userMessage: {
    id: string;
    content: string;
    createdAt: string;
  };
  botResponse: {
    id: string;
    content: string;
    source: 'keyword' | 'ai-api' | 'fallback';
    confidence: number;
    processingTime: number;
    createdAt: string;
  };
}

// Error Response (400 Bad Request)
{
  error: string;
  code: 'EMPTY_MESSAGE' | 'MESSAGE_TOO_LONG' | 'INVALID_SESSION';
}
```

**GET /api/chat/sessions/:sessionId/messages**
```typescript
// Query Parameters
?limit=50&offset=0

// Response (200 OK)
{
  messages: Message[];
  total: number;
  hasMore: boolean;
}
```

#### Admin Endpoints

**POST /api/admin/login**
```typescript
// Request
{
  username: string;
  password: string;
}

// Response (200 OK)
{
  token: string;
  expiresIn: number; // seconds
  user: {
    id: string;
    username: string;
    role: string;
  };
}
```

**POST /api/admin/knowledge**
```typescript
// Request
{
  category: string;
  keywords: string[];
  response: string;
  priority?: number; // Default: 1
}

// Response (201 Created)
{
  id: string;
  category: string;
  keywords: string[];
  response: string;
  priority: number;
  createdAt: string;
}
```

**GET /api/admin/health**
```typescript
// Response (200 OK)
{
  status: 'healthy' | 'degraded' | 'unhealthy';
  components: {
    database: {
      status: 'up' | 'down';
      responseTime: number; // ms
    };
    redis: {
      status: 'up' | 'down';
      responseTime: number;
    };
    aiApi: {
      status: 'up' | 'down';
      responseTime: number;
    };
  };
  metrics: {
    activeUsers: number;
    avgResponseTime: number;
    errorRate: number;
  };
  timestamp: string;
}
```

### WebSocket Events

**Client → Server Events**

```typescript
// Send message (alternative to REST endpoint)
socket.emit('message:send', {
  sessionId: string;
  userId: string;
  content: string;
});

// User typing indicator
socket.emit('user:typing', {
  sessionId: string;
  userId: string;
});
```

**Server → Client Events**

```typescript
// Message received confirmation
socket.on('message:received', (data: {
  messageId: string;
  timestamp: string;
}) => {});

// Bot typing indicator
socket.on('bot:typing', (data: {
  sessionId: string;
}) => {});

// Bot response ready
socket.on('response:ready', (data: {
  messageId: string;
  content: string;
  source: string;
  confidence: number;
  timestamp: string;
}) => {});

// Error occurred
socket.on('error', (data: {
  code: string;
  message: string;
}) => {});
```

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

This system contains several pure functions suitable for property-based testing, particularly in message validation, keyword matching, and context management.


### Property 1: Message Length Validation

*For any* string input, the message validation function SHALL accept messages with length ≤ 2000 characters and reject messages with length > 2000 characters.

**Validates: Requirements 1.4**

### Property 2: Keyword Matching with Case-Insensitive Scoring

*For any* user message and knowledge base entries, the keyword matcher SHALL:
- Match keywords using case-insensitive comparison
- Calculate match scores based on the number of matching keywords
- Select the entry with the highest match score when multiple entries match

**Validates: Requirements 2.2, 16.3, 16.4**

### Property 3: Fallback Response Generation

*For any* user message when the knowledge base is empty or contains no matching entries, the AI Response Engine SHALL generate a fallback response indicating the limitation.

**Validates: Requirements 2.5**

### Property 4: Text Formatting Preservation

*For any* text containing multiple paragraphs or list structures, the rendering function SHALL preserve the formatting structure in the output.

**Validates: Requirements 3.5**

### Property 5: Data Association Integrity

*For any* message or session data, the system SHALL correctly associate each record with its corresponding User ID and Session ID, maintaining referential integrity.

**Validates: Requirements 4.3, 9.5**

### Property 6: Password Hashing Security

*For any* password string, the hashing function SHALL:
- Produce a hash that is different from the original password
- Produce a hash that can be successfully verified against the original password
- Produce different hashes for the same password on repeated calls (due to unique salts)

**Validates: Requirements 6.4**

### Property 7: Chat History Filtering Correctness

*For any* set of chat history records and filter criteria (date range, user ID, or keyword), the filtering function SHALL return only records that match all specified criteria.

**Validates: Requirements 7.3**

### Property 8: Chronological Sorting

*For any* set of messages with timestamps, the sorting function SHALL order them chronologically (earliest to latest or latest to earliest as specified).

**Validates: Requirements 7.4**

### Property 9: Pagination Correctness

*For any* result set and page size of 50, the pagination function SHALL:
- Split results into pages of exactly 50 items (except the last page)
- Maintain the original order of items across pages
- Include each item exactly once across all pages

**Validates: Requirements 7.5**

### Property 10: User Activation State Round-Trip

*For any* user account, deactivating and then reactivating the account SHALL restore the user's access permissions to their original state.

**Validates: Requirements 8.3, 8.4**

### Property 11: Data Encryption Round-Trip

*For any* sensitive data string, encrypting and then decrypting SHALL produce a value equivalent to the original input.

**Validates: Requirements 12.2**

### Property 12: SQL Injection Prevention

*For any* user input string including SQL injection patterns (e.g., `'; DROP TABLE users; --`), the query builder SHALL produce parameterized queries that treat the input as data, not executable code.

**Validates: Requirements 12.4**

### Property 13: XSS Attack Prevention

*For any* user input string including XSS patterns (e.g., `<script>alert('XSS')</script>`), the sanitization function SHALL escape or remove malicious code while preserving safe content.

**Validates: Requirements 12.5**

### Property 14: Exponential Backoff Retry Logic

*For any* failure scenario requiring retries, the retry mechanism SHALL:
- Attempt exactly 3 retries
- Apply exponential backoff between attempts (e.g., 1s, 2s, 4s)
- Respect the calculated delay times within acceptable tolerance

**Validates: Requirements 13.2**

### Property 15: AI Context Building

*For any* user message and knowledge base, the context builder SHALL include relevant knowledge entries in the AI API request based on keyword or semantic relevance.

**Validates: Requirements 17.3**

### Property 16: AI Response Formatting

*For any* AI API response, the formatting function SHALL produce output suitable for display in the chat interface with proper structure and readability.

**Validates: Requirements 17.4**

### Property 17: Conversation Context Window

*For any* session with N messages where N ≥ 10, the context selection function SHALL include exactly the last 10 messages. For sessions with N < 10, it SHALL include all N messages.

**Validates: Requirements 18.2**

### Property 18: Context Length Truncation

*For any* conversation context exceeding 5000 characters, the truncation function SHALL reduce it to ≤ 5000 characters while preserving message boundaries and maintaining chronological order.

**Validates: Requirements 18.5**

### Property 19: Fallback Message Content Validation

*For any* fallback response generated, the message content SHALL include suggestions for alternative actions (e.g., rephrasing the question or contacting support).

**Validates: Requirements 19.2**

### Property 20: Metrics Calculation Accuracy

*For any* dataset of numeric values (response times, success/failure counts), the metrics calculation function SHALL correctly compute:
- Average (mean) value
- Minimum value
- Maximum value
- Error rate (failures / total attempts)

**Validates: Requirements 20.2, 20.3**


## Error Handling

### Error Classification

The system implements a comprehensive error handling strategy with four error severity levels:

1. **Critical**: System-wide failures requiring immediate attention (database down, service crash)
2. **High**: Feature-breaking errors affecting user experience (AI API failure, authentication failure)
3. **Medium**: Recoverable errors with fallback options (cache miss, timeout)
4. **Low**: Expected edge cases (validation errors, empty results)

### Error Handling Strategies

#### 1. Input Validation Errors (Low Severity)

**Scenarios**:
- Empty message submission
- Message exceeding 2000 characters
- Invalid credentials
- Malformed request data

**Handling**:
```typescript
try {
  validateMessage(content);
} catch (error) {
  if (error instanceof ValidationError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.userMessage,
        field: error.field
      }
    };
  }
}
```

**User Experience**:
- Display inline validation error near the input field
- Highlight the problematic field
- Provide clear, actionable error message
- Do not log to error tracking (expected behavior)

#### 2. AI Processing Errors (High Severity)

**Scenarios**:
- Keyword matcher finds no matches
- AI API returns error response
- AI API timeout (>3 seconds)
- AI API rate limit exceeded

**Handling**:
```typescript
async function processMessage(message: string): Promise<AIResponse> {
  try {
    if (config.mode === 'keyword' || config.mode === 'hybrid') {
      const keywordResult = await keywordMatcher.match(message);
      if (keywordResult) {
        return formatResponse(keywordResult, 'keyword');
      }
    }
    
    if (config.mode === 'ai-api' || config.mode === 'hybrid') {
      try {
        const aiResult = await aiApiProcessor.generate(message);
        return formatResponse(aiResult, 'ai-api');
      } catch (apiError) {
        logger.error('AI API failed', { error: apiError, message });
        
        if (config.fallbackToKeyword && config.mode === 'ai-api') {
          const fallbackResult = await keywordMatcher.match(message);
          if (fallbackResult) {
            return formatResponse(fallbackResult, 'keyword');
          }
        }
      }
    }
    
    // No matches found - return fallback
    return generateFallbackResponse();
    
  } catch (error) {
    logger.error('AI processing failed', { error, message });
    throw new AIProcessingError('Failed to generate response', error);
  }
}
```

**User Experience**:
- Display fallback message with helpful suggestions
- Log error details for admin review
- Track unanswered questions for knowledge base improvement
- Maintain conversation flow (don't break the chat)

#### 3. Database Errors (Critical Severity)

**Scenarios**:
- Connection pool exhausted
- Query timeout
- Connection lost
- Deadlock detected

**Handling**:
```typescript
class DatabaseService {
  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (this.isRetryableError(error)) {
          const delay = Math.pow(2, attempt) * 1000; // Exponential backoff
          logger.warn(`Database operation failed, retrying in ${delay}ms`, {
            attempt: attempt + 1,
            maxRetries,
            error
          });
          await this.sleep(delay);
        } else {
          throw error; // Non-retryable error
        }
      }
    }
    
    logger.error('Database operation failed after retries', {
      maxRetries,
      error: lastError
    });
    throw new DatabaseError('Operation failed after retries', lastError);
  }
  
  private isRetryableError(error: any): boolean {
    return (
      error.code === 'ECONNRESET' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ECONNREFUSED' ||
      error.message.includes('deadlock')
    );
  }
}
```

**User Experience**:
- Display generic error message ("Service temporarily unavailable")
- Automatically retry failed operations
- Send alert to administrators
- Maintain system stability (circuit breaker pattern)

#### 4. External Service Errors (High Severity)

**Scenarios**:
- Groq AI API unavailable
- Redis cache unavailable
- Network timeout

**Handling**:
```typescript
class CircuitBreaker {
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'half-open';
      } else {
        throw new ServiceUnavailableError('Circuit breaker is open');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    this.failureCount = 0;
    this.state = 'closed';
  }
  
  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.threshold) {
      this.state = 'open';
      logger.error('Circuit breaker opened', {
        failureCount: this.failureCount
      });
    }
  }
}
```

**User Experience**:
- Graceful degradation (fall back to keyword matching)
- Display appropriate error message
- Continue serving requests with reduced functionality
- Automatic recovery when service returns

### Error Logging Strategy

All errors are logged with structured data for debugging and monitoring:

```typescript
interface ErrorLog {
  timestamp: string;
  level: 'error' | 'warn' | 'info';
  message: string;
  errorType: string;
  errorCode?: string;
  stack?: string;
  context: {
    userId?: string;
    sessionId?: string;
    endpoint?: string;
    requestId: string;
  };
  metadata?: Record<string, any>;
}
```

**Log Destinations**:
- **Console**: Development environment
- **File**: Production environment (rotated daily)
- **External Service**: Error tracking (e.g., Sentry) for critical errors
- **Database**: Audit logs for security-related errors

### Frontend Error Handling

```typescript
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logger.error('React component error', {
      error,
      componentStack: errorInfo.componentStack
    });
    
    // Display fallback UI
    this.setState({ hasError: true });
  }
  
  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback
          message="Something went wrong. Please refresh the page."
          onRetry={() => window.location.reload()}
        />
      );
    }
    
    return this.props.children;
  }
}
```

### Error Recovery Mechanisms

1. **Automatic Retry**: Database operations, external API calls
2. **Fallback Responses**: AI processing failures
3. **Circuit Breaker**: External service failures
4. **Graceful Degradation**: Feature-specific failures
5. **User Retry**: Network errors during message submission

## Testing Strategy

### Testing Approach Overview

The AI Company Chatbot System requires a comprehensive testing strategy that combines multiple testing methodologies to ensure correctness, reliability, and performance. The strategy includes:

1. **Property-Based Testing**: For pure functions and core business logic
2. **Unit Testing**: For specific examples, edge cases, and component behavior
3. **Integration Testing**: For database operations, external APIs, and component interactions
4. **End-to-End Testing**: For complete user workflows
5. **Performance Testing**: For scalability and response time requirements
6. **Security Testing**: For authentication, authorization, and input sanitization

### 1. Property-Based Testing

**Framework**: fast-check (JavaScript/TypeScript property-based testing library)

**Configuration**:
- Minimum 100 iterations per property test
- Seed-based reproducibility for failed tests
- Shrinking enabled for minimal failing examples

**Test Organization**:
```typescript
// tests/properties/message-validation.property.test.ts
import * as fc from 'fast-check';

describe('Property: Message Length Validation', () => {
  it('should accept messages ≤ 2000 characters and reject messages > 2000', () => {
    // Feature: ai-company-chatbot, Property 1: Message Length Validation
    fc.assert(
      fc.property(fc.string(), (message) => {
        const result = validateMessage(message);
        
        if (message.length <= 2000) {
          expect(result.isValid).toBe(true);
        } else {
          expect(result.isValid).toBe(false);
          expect(result.error).toBeDefined();
        }
      }),
      { numRuns: 100 }
    );
  });
});
```

**Properties to Test** (20 total - see Correctness Properties section):
- Message validation
- Keyword matching with scoring
- Fallback response generation
- Text formatting preservation
- Data association integrity
- Password hashing security
- Chat history filtering
- Chronological sorting
- Pagination correctness
- User activation state round-trip
- Data encryption round-trip
- SQL injection prevention
- XSS attack prevention
- Exponential backoff retry logic
- AI context building
- AI response formatting
- Conversation context window
- Context length truncation
- Fallback message content validation
- Metrics calculation accuracy

### 2. Unit Testing

**Framework**: Jest with React Testing Library (frontend), Jest (backend)

**Coverage Targets**:
- Line coverage: 80%
- Branch coverage: 75%
- Function coverage: 85%

**Test Categories**:

#### Frontend Component Tests
```typescript
// tests/unit/components/ChatInterface.test.tsx
describe('ChatInterface Component', () => {
  it('should render text input field', () => {
    render(<ChatInterface userId="user-1" />);
    expect(screen.getByRole('textbox')).toBeInTheDocument();
  });
  
  it('should display validation error for empty message', async () => {
    render(<ChatInterface userId="user-1" />);
    const submitButton = screen.getByRole('button', { name: /send/i });
    
    fireEvent.click(submitButton);
    
    expect(await screen.findByText(/message cannot be empty/i)).toBeInTheDocument();
  });
  
  it('should display typing indicator when bot is processing', async () => {
    render(<ChatInterface userId="user-1" />);
    
    // Simulate message submission
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.submit(input);
    
    expect(await screen.findByTestId('typing-indicator')).toBeInTheDocument();
  });
});
```

#### Backend Service Tests
```typescript
// tests/unit/services/keyword-matcher.test.ts
describe('KeywordMatcher Service', () => {
  it('should return null when no keywords match', () => {
    const matcher = new KeywordMatcher();
    const knowledge = [
      { id: '1', keywords: ['password', 'reset'], response: 'Reset info', priority: 1 }
    ];
    
    const result = matcher.match('How do I login?', knowledge);
    
    expect(result).toBeNull();
  });
  
  it('should select entry with highest match score', () => {
    const matcher = new KeywordMatcher();
    const knowledge = [
      { id: '1', keywords: ['login'], response: 'Login info', priority: 1 },
      { id: '2', keywords: ['login', 'password'], response: 'Login with password', priority: 1 }
    ];
    
    const result = matcher.match('How do I login with password?', knowledge);
    
    expect(result?.entry.id).toBe('2'); // More keywords matched
  });
});
```

### 3. Integration Testing

**Framework**: Jest with Supertest (API testing), Testcontainers (database)

**Test Environment**:
- Dockerized PostgreSQL for database tests
- Dockerized Redis for cache tests
- Mocked external APIs (Groq)

**Test Categories**:

#### API Integration Tests
```typescript
// tests/integration/api/chat.test.ts
describe('POST /api/chat/messages', () => {
  let app: Express;
  let db: PrismaClient;
  
  beforeAll(async () => {
    // Start test database container
    db = await setupTestDatabase();
    app = createApp(db);
  });
  
  it('should create message and return bot response', async () => {
    const session = await db.session.create({
      data: { userId: 'user-1' }
    });
    
    const response = await request(app)
      .post('/api/chat/messages')
      .send({
        sessionId: session.id,
        userId: 'user-1',
        content: 'Hello chatbot'
      })
      .expect(200);
    
    expect(response.body.userMessage).toBeDefined();
    expect(response.body.botResponse).toBeDefined();
    expect(response.body.botResponse.content).toBeTruthy();
  });
  
  it('should return 400 for empty message', async () => {
    const response = await request(app)
      .post('/api/chat/messages')
      .send({
        sessionId: 'session-1',
        userId: 'user-1',
        content: ''
      })
      .expect(400);
    
    expect(response.body.error).toBe('EMPTY_MESSAGE');
  });
});
```

#### Database Integration Tests
```typescript
// tests/integration/database/chat-history.test.ts
describe('Chat History Persistence', () => {
  it('should store message with correct associations', async () => {
    const user = await db.user.create({
      data: { username: 'testuser', email: 'test@example.com', passwordHash: 'hash' }
    });
    
    const session = await db.session.create({
      data: { userId: user.id }
    });
    
    const message = await db.message.create({
      data: {
        sessionId: session.id,
        userId: user.id,
        content: 'Test message',
        isUserMessage: true
      }
    });
    
    expect(message.userId).toBe(user.id);
    expect(message.sessionId).toBe(session.id);
  });
});
```

### 4. End-to-End Testing

**Framework**: Playwright

**Test Scenarios**:
- Complete user conversation flow
- Admin knowledge base management
- User authentication and session management
- Cross-browser compatibility

```typescript
// tests/e2e/chat-flow.spec.ts
test('user can have complete conversation with chatbot', async ({ page }) => {
  await page.goto('/');
  
  // Login
  await page.fill('[name="username"]', 'testuser');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // Wait for chat interface
  await page.waitForSelector('[data-testid="chat-interface"]');
  
  // Send message
  await page.fill('[data-testid="message-input"]', 'How do I reset my password?');
  await page.click('[data-testid="send-button"]');
  
  // Wait for typing indicator
  await page.waitForSelector('[data-testid="typing-indicator"]');
  
  // Wait for response
  const response = await page.waitForSelector('[data-testid="bot-message"]');
  expect(await response.textContent()).toContain('password');
  
  // Verify message appears in history
  const messages = await page.$$('[data-testid="message-bubble"]');
  expect(messages.length).toBeGreaterThanOrEqual(2); // User message + bot response
});
```

### 5. Performance Testing

**Framework**: Artillery (load testing), Lighthouse (frontend performance)

**Performance Requirements**:
- Keyword matching: < 1 second response time
- AI API processing: < 3 seconds response time
- Support 1000 concurrent users
- Database queries: < 100ms average

**Load Test Configuration**:
```yaml
# artillery-config.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 300
      arrivalRate: 100
      name: "Sustained load"
    - duration: 60
      arrivalRate: 200
      name: "Spike test"
  
scenarios:
  - name: "Send chat message"
    flow:
      - post:
          url: "/api/chat/messages"
          json:
            sessionId: "{{ sessionId }}"
            userId: "{{ userId }}"
            content: "Test message"
          capture:
            - json: "$.botResponse.processingTime"
              as: "responseTime"
      - think: 2
```

### 6. Security Testing

**Test Categories**:

#### Authentication Tests
```typescript
describe('Authentication Security', () => {
  it('should reject requests without valid JWT', async () => {
    const response = await request(app)
      .get('/api/admin/users')
      .expect(401);
    
    expect(response.body.error).toBe('Unauthorized');
  });
  
  it('should reject expired JWT tokens', async () => {
    const expiredToken = generateExpiredToken();
    
    const response = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${expiredToken}`)
      .expect(401);
  });
});
```

#### Input Sanitization Tests
```typescript
describe('XSS Prevention', () => {
  it('should sanitize script tags in messages', () => {
    const maliciousInput = '<script>alert("XSS")</script>Hello';
    const sanitized = sanitizeInput(maliciousInput);
    
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toContain('Hello');
  });
});

describe('SQL Injection Prevention', () => {
  it('should use parameterized queries', async () => {
    const maliciousInput = "'; DROP TABLE users; --";
    
    // Should not throw error or execute malicious SQL
    await expect(
      db.user.findMany({
        where: { username: maliciousInput }
      })
    ).resolves.toEqual([]);
  });
});
```

### Test Execution Strategy

**Development**:
```bash
# Run unit tests in watch mode
npm run test:watch

# Run property tests
npm run test:properties

# Run integration tests (requires Docker)
npm run test:integration
```

**CI/CD Pipeline**:
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run test:unit
      - run: npm run test:properties
  
  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:15
      redis:
        image: redis:7
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm run test:integration
  
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npx playwright install
      - run: npm run test:e2e
```

**Pre-deployment**:
```bash
# Full test suite
npm run test:all

# Performance tests
npm run test:performance

# Security scan
npm run test:security
```

### Test Data Management

**Fixtures**:
```typescript
// tests/fixtures/knowledge-base.ts
export const knowledgeBaseFixtures = {
  passwordReset: {
    id: '1',
    category: 'Account',
    keywords: ['password', 'reset', 'forgot'],
    response: 'To reset your password, visit /reset-password',
    priority: 1
  },
  loginHelp: {
    id: '2',
    category: 'Account',
    keywords: ['login', 'sign in', 'access'],
    response: 'Login at /login with your credentials',
    priority: 1
  }
};
```

**Database Seeding**:
```typescript
// tests/helpers/seed-database.ts
export async function seedTestDatabase(db: PrismaClient) {
  await db.user.createMany({
    data: [
      { username: 'testuser1', email: 'user1@test.com', passwordHash: 'hash1' },
      { username: 'testuser2', email: 'user2@test.com', passwordHash: 'hash2' }
    ]
  });
  
  await db.knowledgeEntry.createMany({
    data: Object.values(knowledgeBaseFixtures)
  });
}
```

### Continuous Testing

- **Pre-commit hooks**: Run unit tests and linting
- **Pull request checks**: Full test suite must pass
- **Nightly builds**: Performance and security tests
- **Production monitoring**: Synthetic tests every 5 minutes


## Security Architecture

### Security Principles

The AI Company Chatbot System follows defense-in-depth security principles with multiple layers of protection:

1. **Authentication & Authorization**: Verify identity and control access
2. **Data Protection**: Encrypt data in transit and at rest
3. **Input Validation**: Sanitize and validate all user inputs
4. **Audit Logging**: Track all security-relevant actions
5. **Least Privilege**: Grant minimum necessary permissions
6. **Secure Defaults**: Security enabled by default

### Authentication Architecture

#### User Authentication

**JWT-Based Authentication**:
```typescript
interface JWTPayload {
  userId: string;
  username: string;
  role: 'user' | 'admin';
  iat: number; // Issued at
  exp: number; // Expiration
}

// Token generation
function generateToken(user: User): string {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      role: user.role
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: '24h',
      algorithm: 'HS256'
    }
  );
}

// Token verification middleware
function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(' ')[1]; // Bearer TOKEN
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}
```

**Password Security**:
```typescript
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Password requirements
const PASSWORD_POLICY = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true
};

function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];
  
  if (password.length < PASSWORD_POLICY.minLength) {
    errors.push(`Password must be at least ${PASSWORD_POLICY.minLength} characters`);
  }
  if (PASSWORD_POLICY.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letter');
  }
  if (PASSWORD_POLICY.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letter');
  }
  if (PASSWORD_POLICY.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain number');
  }
  if (PASSWORD_POLICY.requireSpecialChars && !/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}
```

#### Admin Authentication

**Enhanced Security for Admin Access**:
- Separate admin login endpoint
- Shorter session timeout (30 minutes)
- IP address logging
- Failed login attempt tracking
- Account lockout after 5 failed attempts

```typescript
class AdminAuthService {
  private failedAttempts = new Map<string, number>();
  private lockouts = new Map<string, number>();
  
  async login(username: string, password: string, ipAddress: string): Promise<LoginResult> {
    // Check if account is locked
    if (this.isLocked(username)) {
      await this.logAudit({
        action: 'login_attempt_locked',
        username,
        ipAddress
      });
      throw new AccountLockedError('Account is locked due to failed login attempts');
    }
    
    // Verify credentials
    const admin = await db.user.findUnique({
      where: { username, role: 'admin' }
    });
    
    if (!admin || !await verifyPassword(password, admin.passwordHash)) {
      this.recordFailedAttempt(username);
      await this.logAudit({
        action: 'login_failed',
        username,
        ipAddress
      });
      throw new AuthenticationError('Invalid credentials');
    }
    
    // Check if account is active
    if (!admin.isActive) {
      throw new AuthenticationError('Account is deactivated');
    }
    
    // Success - clear failed attempts
    this.clearFailedAttempts(username);
    
    // Generate token with shorter expiration
    const token = generateToken(admin, '30m');
    
    await this.logAudit({
      action: 'login_success',
      username,
      ipAddress,
      userId: admin.id
    });
    
    return { token, user: admin };
  }
  
  private recordFailedAttempt(username: string): void {
    const attempts = (this.failedAttempts.get(username) || 0) + 1;
    this.failedAttempts.set(username, attempts);
    
    if (attempts >= 5) {
      this.lockouts.set(username, Date.now() + 15 * 60 * 1000); // 15 min lockout
    }
  }
  
  private isLocked(username: string): boolean {
    const lockoutUntil = this.lockouts.get(username);
    if (!lockoutUntil) return false;
    
    if (Date.now() > lockoutUntil) {
      this.lockouts.delete(username);
      this.clearFailedAttempts(username);
      return false;
    }
    
    return true;
  }
}
```

### Authorization Architecture

**Role-Based Access Control (RBAC)**:

```typescript
enum Permission {
  // User permissions
  CHAT_SEND_MESSAGE = 'chat:send_message',
  CHAT_VIEW_HISTORY = 'chat:view_history',
  
  // Admin permissions
  ADMIN_VIEW_DASHBOARD = 'admin:view_dashboard',
  ADMIN_MANAGE_KNOWLEDGE = 'admin:manage_knowledge',
  ADMIN_MANAGE_USERS = 'admin:manage_users',
  ADMIN_VIEW_AUDIT_LOGS = 'admin:view_audit_logs',
  ADMIN_VIEW_CHAT_HISTORY = 'admin:view_chat_history'
}

const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  user: [
    Permission.CHAT_SEND_MESSAGE,
    Permission.CHAT_VIEW_HISTORY
  ],
  admin: [
    Permission.CHAT_SEND_MESSAGE,
    Permission.CHAT_VIEW_HISTORY,
    Permission.ADMIN_VIEW_DASHBOARD,
    Permission.ADMIN_MANAGE_KNOWLEDGE,
    Permission.ADMIN_MANAGE_USERS,
    Permission.ADMIN_VIEW_AUDIT_LOGS,
    Permission.ADMIN_VIEW_CHAT_HISTORY
  ]
};

function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const userPermissions = ROLE_PERMISSIONS[user.role] || [];
    
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    next();
  };
}

// Usage
app.post('/api/chat/messages',
  authenticateToken,
  requirePermission(Permission.CHAT_SEND_MESSAGE),
  chatController.sendMessage
);

app.get('/api/admin/users',
  authenticateToken,
  requirePermission(Permission.ADMIN_MANAGE_USERS),
  adminController.listUsers
);
```

**Resource-Level Authorization**:
```typescript
// Users can only access their own chat history
async function getUserChatHistory(userId: string, requestingUserId: string) {
  if (userId !== requestingUserId) {
    throw new ForbiddenError('Cannot access other users\' chat history');
  }
  
  return db.session.findMany({
    where: { userId },
    include: { messages: true }
  });
}

// Admins can access any user's chat history
async function getAnyChatHistory(userId: string, requestingUser: User) {
  if (requestingUser.role !== 'admin') {
    throw new ForbiddenError('Admin access required');
  }
  
  return db.session.findMany({
    where: { userId },
    include: { messages: true }
  });
}
```

### Data Protection

#### Encryption in Transit

**TLS Configuration**:
```typescript
import https from 'https';
import fs from 'fs';

const tlsOptions = {
  key: fs.readFileSync('/path/to/private-key.pem'),
  cert: fs.readFileSync('/path/to/certificate.pem'),
  minVersion: 'TLSv1.2' as const,
  ciphers: [
    'ECDHE-ECDSA-AES128-GCM-SHA256',
    'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-ECDSA-AES256-GCM-SHA384',
    'ECDHE-RSA-AES256-GCM-SHA384'
  ].join(':')
};

const server = https.createServer(tlsOptions, app);
```

**HTTPS Enforcement**:
```typescript
function enforceHTTPS(req: Request, res: Response, next: NextFunction) {
  if (req.secure || req.headers['x-forwarded-proto'] === 'https') {
    next();
  } else {
    res.redirect(301, `https://${req.headers.host}${req.url}`);
  }
}

app.use(enforceHTTPS);
```

#### Encryption at Rest

**Database Encryption**:
```typescript
import crypto from 'crypto';

const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32 bytes
const ALGORITHM = 'aes-256-gcm';

function encrypt(plaintext: string): EncryptedData {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
  
  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag();
  
  return {
    ciphertext: encrypted,
    iv: iv.toString('hex'),
    authTag: authTag.toString('hex')
  };
}

function decrypt(encryptedData: EncryptedData): string {
  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    ENCRYPTION_KEY,
    Buffer.from(encryptedData.iv, 'hex')
  );
  
  decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'hex'));
  
  let decrypted = decipher.update(encryptedData.ciphertext, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}

// Usage for sensitive data
async function storeUserEmail(userId: string, email: string) {
  const encrypted = encrypt(email);
  
  await db.user.update({
    where: { id: userId },
    data: {
      emailCiphertext: encrypted.ciphertext,
      emailIv: encrypted.iv,
      emailAuthTag: encrypted.authTag
    }
  });
}
```

### Input Validation and Sanitization

#### Request Validation

**Schema Validation with Zod**:
```typescript
import { z } from 'zod';

const SendMessageSchema = z.object({
  sessionId: z.string().uuid(),
  userId: z.string().uuid(),
  content: z.string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message exceeds maximum length')
    .trim()
});

function validateRequest(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Validation failed',
          details: error.errors
        });
      }
      next(error);
    }
  };
}

// Usage
app.post('/api/chat/messages',
  validateRequest(SendMessageSchema),
  chatController.sendMessage
);
```

#### XSS Prevention

**Output Sanitization**:
```typescript
import DOMPurify from 'isomorphic-dompurify';

function sanitizeHTML(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: []
  });
}

// Frontend rendering
function MessageBubble({ content }: { content: string }) {
  const sanitized = sanitizeHTML(content);
  
  return (
    <div
      className="message-content"
      dangerouslySetInnerHTML={{ __html: sanitized }}
    />
  );
}
```

#### SQL Injection Prevention

**Parameterized Queries with Prisma**:
```typescript
// SAFE - Prisma automatically parameterizes queries
async function searchMessages(keyword: string) {
  return db.message.findMany({
    where: {
      content: {
        contains: keyword, // Automatically parameterized
        mode: 'insensitive'
      }
    }
  });
}

// UNSAFE - Never use raw SQL with user input
// async function searchMessages(keyword: string) {
//   return db.$queryRaw`SELECT * FROM messages WHERE content LIKE '%${keyword}%'`;
// }
```

### Security Headers

**HTTP Security Headers**:
```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Minimize unsafe-inline in production
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", 'https://api.groq.com'],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// CORS configuration
import cors from 'cors';

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### Rate Limiting

**API Rate Limiting**:
```typescript
import rateLimit from 'express-rate-limit';

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

// Stricter limit for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per window
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again later'
});

// Chat message rate limit (per user)
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 messages per minute
  keyGenerator: (req) => req.user?.userId || req.ip,
  message: 'Message rate limit exceeded'
});

app.use('/api/', apiLimiter);
app.use('/api/admin/login', authLimiter);
app.use('/api/chat/messages', chatLimiter);
```

### Audit Logging

**Security Event Logging**:
```typescript
interface AuditLogEntry {
  timestamp: Date;
  adminId: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  ipAddress: string;
  userAgent: string;
  details: Record<string, any>;
  success: boolean;
}

async function logAuditEvent(entry: AuditLogEntry): Promise<void> {
  await db.auditLog.create({
    data: {
      adminId: entry.adminId,
      actionType: entry.action,
      resourceType: entry.resourceType,
      resourceId: entry.resourceId,
      ipAddress: entry.ipAddress,
      details: entry.details,
      createdAt: entry.timestamp
    }
  });
  
  // Also log to external security monitoring
  logger.info('Audit event', {
    category: 'security',
    ...entry
  });
}

// Audit middleware for admin actions
function auditAdminAction(action: string, resourceType: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const originalSend = res.send;
    
    res.send = function(data: any) {
      const success = res.statusCode >= 200 && res.statusCode < 300;
      
      logAuditEvent({
        timestamp: new Date(),
        adminId: req.user!.userId,
        action,
        resourceType,
        resourceId: req.params.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'] || '',
        details: {
          method: req.method,
          path: req.path,
          body: req.body
        },
        success
      }).catch(error => {
        logger.error('Failed to log audit event', { error });
      });
      
      return originalSend.call(this, data);
    };
    
    next();
  };
}

// Usage
app.delete('/api/admin/users/:id',
  authenticateToken,
  requirePermission(Permission.ADMIN_MANAGE_USERS),
  auditAdminAction('delete_user', 'user'),
  adminController.deleteUser
);
```

### Secrets Management

**Environment Variables**:
```typescript
// .env.example
DATABASE_URL=postgresql://user:password@localhost:5432/chatbot
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key-here-min-32-chars
ENCRYPTION_KEY=hex-encoded-32-byte-key
GROQ_API_KEY=your-groq-api-key
NODE_ENV=production
ALLOWED_ORIGINS=https://yourdomain.com
```

**Secrets Validation**:
```typescript
import { z } from 'zod';

const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  ENCRYPTION_KEY: z.string().length(64), // 32 bytes in hex
  GROQ_API_KEY: z.string().min(1),
  NODE_ENV: z.enum(['development', 'production', 'test']),
  ALLOWED_ORIGINS: z.string()
});

function validateEnvironment() {
  try {
    EnvSchema.parse(process.env);
  } catch (error) {
    console.error('Environment validation failed:', error);
    process.exit(1);
  }
}

validateEnvironment();
```

### Security Monitoring

**Security Metrics**:
```typescript
interface SecurityMetrics {
  failedLoginAttempts: number;
  blockedRequests: number;
  suspiciousPatterns: number;
  xssAttempts: number;
  sqlInjectionAttempts: number;
}

class SecurityMonitor {
  private metrics: SecurityMetrics = {
    failedLoginAttempts: 0,
    blockedRequests: 0,
    suspiciousPatterns: 0,
    xssAttempts: 0,
    sqlInjectionAttempts: 0
  };
  
  recordFailedLogin(username: string, ipAddress: string): void {
    this.metrics.failedLoginAttempts++;
    
    logger.warn('Failed login attempt', {
      category: 'security',
      username,
      ipAddress
    });
    
    // Alert if threshold exceeded
    if (this.metrics.failedLoginAttempts > 10) {
      this.sendSecurityAlert('High number of failed login attempts');
    }
  }
  
  recordXSSAttempt(input: string, userId: string): void {
    this.metrics.xssAttempts++;
    
    logger.warn('XSS attempt detected', {
      category: 'security',
      userId,
      input: input.substring(0, 100) // Log first 100 chars
    });
  }
  
  private sendSecurityAlert(message: string): void {
    // Send alert to admin notification system
    logger.error('Security alert', {
      category: 'security',
      alert: message,
      metrics: this.metrics
    });
  }
}
```

### Deployment Security Checklist

- [ ] TLS 1.2+ enabled with strong cipher suites
- [ ] All secrets stored in environment variables or secret manager
- [ ] Database credentials rotated regularly
- [ ] JWT secret is cryptographically random (32+ bytes)
- [ ] Password hashing uses bcrypt with 12+ rounds
- [ ] Rate limiting enabled on all public endpoints
- [ ] CORS configured with specific allowed origins
- [ ] Security headers configured (CSP, HSTS, X-Frame-Options)
- [ ] Input validation on all user inputs
- [ ] Output sanitization for all user-generated content
- [ ] SQL injection prevention via parameterized queries
- [ ] Audit logging enabled for all admin actions
- [ ] Failed login attempt tracking and account lockout
- [ ] Session timeout configured (24h users, 30m admins)
- [ ] Database backups encrypted and tested
- [ ] Security monitoring and alerting configured
- [ ] Dependency vulnerability scanning in CI/CD
- [ ] Regular security updates and patches applied

## Conclusion

This design document provides a comprehensive technical blueprint for the AI Company Chatbot System. The architecture balances functionality, performance, security, and maintainability through:

- **Modular Architecture**: Clear separation between frontend, backend, and data layers
- **Dual AI Modes**: Flexible keyword matching and advanced AI API processing
- **Scalable Design**: Support for 1000+ concurrent users with caching and connection pooling
- **Security-First Approach**: Multiple layers of protection including authentication, encryption, and input validation
- **Comprehensive Testing**: Property-based testing for core logic, integration tests for components, and end-to-end tests for workflows
- **Robust Error Handling**: Graceful degradation, automatic retries, and fallback mechanisms

The system is designed to be deployed as containerized services with horizontal scalability, comprehensive monitoring, and security best practices throughout.

