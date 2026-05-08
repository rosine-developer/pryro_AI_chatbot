// Vercel serverless entry point
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

import { logger } from '../src/utils/logger';

const app = express();

// Middleware
app.use(helmet({
  contentSecurityPolicy: false, // relaxed for API
}));

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS === '*'
    ? '*'
    : process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes
app.use('/health', require('../src/routes/health').healthRouter);
app.use('/api/auth', require('../src/routes/auth.routes').authRouter);
app.use('/api/chat', require('../src/routes/chat.routes').chatRouter);
app.use('/api/admin', require('../src/routes/admin.routes').adminRouter);

// 404
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({ error: 'Not Found', message: `Route ${req.method} ${req.path} not found` });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message });
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'An unexpected error occurred',
  });
});

export default app;
