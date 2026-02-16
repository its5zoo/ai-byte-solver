import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import pdfRoutes from './routes/pdfRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import statsRoutes from './routes/statsRoutes.js';
import streakRoutes from './routes/streakRoutes.js';
import userRoutes from './routes/userRoutes.js';

const app = express();

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/pdf', pdfRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/quiz', quizRoutes);
app.use('/api/v1/stats', statsRoutes);
app.use('/api/v1/streaks', streakRoutes);

app.get('/health', (req, res) => res.json({ ok: true }));

app.use(errorHandler);

export default app;
