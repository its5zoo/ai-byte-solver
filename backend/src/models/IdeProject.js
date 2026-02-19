import mongoose from 'mongoose';

const ideProjectSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: [true, 'Project name is required'],
            trim: true,
            maxlength: 100,
        },
        description: {
            type: String,
            default: '',
            maxlength: 500,
        },
        language: {
            type: String,
            enum: ['javascript', 'typescript', 'python', 'cpp', 'java', 'html', 'css', 'other'],
            default: 'javascript',
        },
        lastOpenFileId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'IdeFile',
        },
        sessions: {
            chat: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'ChatSession',
            },
            fix: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'ChatSession',
            },
            optimize: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'ChatSession',
            },
        },
    },
    { timestamps: true }
);

const IdeProject = mongoose.model('IdeProject', ideProjectSchema);
export default IdeProject;
