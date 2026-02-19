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
import doubtRoutes from './routes/doubtRoutes.js';
import ideRoutes from './routes/ideRoutes.js';
import aiRouterRoutes from './routes/aiRouterRoutes.js';


const app = express();

// Allow multiple frontend origins (Vite may use 5173 or 5174+)
const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
];
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl)
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, true); // Allow all origins in development
        }
    },
    credentials: true,
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/pdf', pdfRoutes);
app.use('/api/v1/chat', chatRoutes);
app.use('/api/v1/quiz', quizRoutes);
app.use('/api/v1/stats', statsRoutes);
app.use('/api/v1/streaks', streakRoutes);
app.use('/api/v1/doubts', doubtRoutes);
app.use('/api/v1/ide', ideRoutes);
app.use('/api/v1/ai-router', aiRouterRoutes);


app.get('/health', (req, res) => res.json({ ok: true }));

app.use(errorHandler);

export default app;
