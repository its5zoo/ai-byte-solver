
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import ChatMessage from '../src/models/ChatMessage.js';
import ChatSession from '../src/models/ChatSession.js';
import Doubt from '../src/models/Doubt.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const migrate = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-byte-solver';
        console.log(`Connecting to: ${uri}`);
        await mongoose.connect(uri);
        console.log('Connected to MongoDB');

        // Get all user messages
        const messages = await ChatMessage.find({ role: 'user' }).lean();
        console.log(`Found ${messages.length} user messages to process.`);

        for (const msg of messages) {
            // Find session to get userId
            const session = await ChatSession.findById(msg.sessionId).lean();
            if (!session || !session.userId) continue;

            const content = msg.content;
            if (!content || content.length < 5) continue; // Skip short ones

            // Record doubt
            const normalizedQuestion = content.trim();
            // Simple heuristic for topic: "General" (since we don't have AI here easily)
            const topic = 'General';

            console.log(`Processing: ${normalizedQuestion.substring(0, 30)}...`);

            await Doubt.findOneAndUpdate(
                { userId: session.userId, question: normalizedQuestion },
                {
                    $inc: { frequency: 1 },
                    $set: {
                        topic: topic,
                        lastAsked: msg.createdAt || new Date()
                    }
                },
                { upsert: true, new: true }
            );
        }

        console.log('Migration complete!');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrate();
