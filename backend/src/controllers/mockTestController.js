import MockTest from '../models/MockTest.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { AppError } from '../middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const EXAM_CONFIGS = {
    'jee-main': {
        title: 'JEE Main (Full Mock)',
        durationMinutes: 180,
        positiveMarks: 4,
        negativeMarks: -1,
        questionCount: 75,
        subject: 'Physics, Chemistry, Mathematics',
        difficulty: 'hard'
    },
    'neet': {
        title: 'NEET (UG) Full Mock',
        durationMinutes: 180,
        positiveMarks: 4,
        negativeMarks: -1,
        questionCount: 180,
        subject: 'Physics, Chemistry, Botany, Zoology',
        difficulty: 'medium-hard'
    },
    'upsc': {
        title: 'UPSC Civil Services (Prelims GS Paper I)',
        durationMinutes: 120,
        positiveMarks: 2,
        negativeMarks: -0.66,
        questionCount: 100,
        subject: 'History, Geography, Polity, Economy, Environment, Science, Current Affairs',
        difficulty: 'hard'
    },
    'gate': {
        title: 'GATE (Full Mock)',
        durationMinutes: 180,
        positiveMarks: 2,
        negativeMarks: -0.66,
        questionCount: 65,
        subject: 'Engineering Mathematics, General Aptitude, Core Subject',
        difficulty: 'very-hard'
    }
};

export const listMockTests = async (req, res, next) => {
    try {
        const tests = await MockTest.find({ userId: req.user.id })
            .sort({ createdAt: -1 })
            .select('-questions.explanation'); // Exclude explanations for list view

        res.json({ success: true, tests });
    } catch (err) {
        next(err);
    }
};

export const getMockTest = async (req, res, next) => {
    try {
        const test = await MockTest.findOne({ _id: req.params.id, userId: req.user.id });
        if (!test) return next(new AppError('Mock test not found', 404));

        // If test is in progress, do not send down the correct answers or explanations
        if (test.status === 'in-progress') {
            const secureTest = test.toObject();
            secureTest.questions = secureTest.questions.map(q => {
                const { correctAnswerIndex, explanation, ...safeQ } = q;
                return safeQ;
            });
            return res.json({ success: true, test: secureTest });
        }

        res.json({ success: true, test });
    } catch (err) {
        next(err);
    }
};

export const generateMockTest = async (req, res, next) => {
    try {
        const { examId } = req.body;
        const config = EXAM_CONFIGS[examId];

        if (!config) {
            return next(new AppError('Invalid or unsupported Exam ID', 400));
        }

        // Fetch PYQs from our internal offline/online dataset to bypass AI timeout for 180 questions
        const datasetPath = path.join(__dirname, '../data/pyqDataset.json');
        let pyqData = {};
        try {
            const rawData = fs.readFileSync(datasetPath, 'utf8');
            pyqData = JSON.parse(rawData);
        } catch (err) {
            console.error("Failed to read PYQ dataset:", err);
            return next(new AppError('Internal PYQ Database is temporarily unavailable.', 500));
        }

        let examQuestions = pyqData[examId];
        if (!examQuestions || examQuestions.length === 0) {
            // Fallback
            examQuestions = pyqData['jee-main'] || [];
        }

        const subjectList = config.subject.split(',').map(s => s.trim());
        const questionsPerSubject = Math.ceil(config.questionCount / subjectList.length);

        let parsedQuestions = [];

        for (const subject of subjectList) {
            // Find all questions in dataset for this specific subject
            const subjectQuestions = examQuestions.filter(q => q.subject === subject);

            // If the dataset doesn't have specific questions for this subject, fallback to the entire pool
            const pool = subjectQuestions.length > 0 ? subjectQuestions : examQuestions;

            // Shuffle the pool
            let currentSubjQ = [...pool].sort(() => 0.5 - Math.random());

            // If the pool is smaller than the required questions for this section, repeat to simulate a full mock
            while (currentSubjQ.length < questionsPerSubject && pool.length > 0) {
                currentSubjQ.push(pool[Math.floor(Math.random() * pool.length)]);
            }

            // Slice to EXACT questionsPerSubject and ensure the subject matches the config tab
            parsedQuestions.push(...currentSubjQ.slice(0, questionsPerSubject).map(q => ({ ...q, subject })));
        }

        // The total might exceed slightly due to Math.ceil, so slice to exact config.questionCount
        parsedQuestions = parsedQuestions.slice(0, config.questionCount);

        const test = await MockTest.create({
            userId: req.user.id,
            examId,
            title: config.title,
            durationMinutes: config.durationMinutes,
            totalQuestions: parsedQuestions.length,
            questions: parsedQuestions
        });

        // Return secure version to immediately start taking the test safely
        const secureTest = test.toObject();
        secureTest.questions = secureTest.questions.map(q => {
            const { correctAnswerIndex, explanation, ...safeQ } = q;
            return safeQ;
        });

        res.status(201).json({ success: true, test: secureTest });
    } catch (err) {
        next(err);
    }
};

export const submitMockTest = async (req, res, next) => {
    try {
        const { answers } = req.body; // Array of numbers matching question indices. null for unattempted.

        if (!Array.isArray(answers)) {
            return next(new AppError('Answers must be an array', 400));
        }

        const test = await MockTest.findOne({ _id: req.params.id, userId: req.user.id });
        if (!test) return next(new AppError('Mock test not found', 404));
        if (test.status === 'completed') return next(new AppError('Test already submitted', 400));

        const config = EXAM_CONFIGS[test.examId] || EXAM_CONFIGS['jee-main']; // fallback layout

        let correctAttempts = 0;
        let incorrectAttempts = 0;
        let score = 0;

        // Evaluate answers
        test.questions.forEach((q, i) => {
            const userAns = answers[i] !== undefined ? answers[i] : null;
            q.userAnswerIndex = userAns;

            if (userAns !== null) {
                if (userAns === q.correctAnswerIndex) {
                    correctAttempts++;
                    score += config.positiveMarks;
                } else {
                    incorrectAttempts++;
                    // Negative marking is usually a negative number, so we add it (e.g., score += -1)
                    score += config.negativeMarks;
                }
            }
        });

        test.status = 'completed';
        test.correctAnswers = correctAttempts;
        test.incorrectAnswers = incorrectAttempts;
        test.score = Number(score.toFixed(2)); // Round to two decimals for things like -0.66

        await test.save();

        res.json({ success: true, test });
    } catch (err) {
        next(err);
    }
};
