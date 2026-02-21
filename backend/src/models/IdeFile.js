import mongoose from 'mongoose';

const ideFileSchema = new mongoose.Schema(
    {
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'IdeProject',
            required: true,
            index: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: [true, 'File name is required'],
            trim: true,
            maxlength: 255,
        },
        path: {
            type: String,
            required: true,
            trim: true,
        },
        content: {
            type: String,
            default: '',
        },
        language: {
            type: String,
            enum: [
                'javascript', 'typescript', 'python', 'cpp', 'c', 'csharp',
                'java', 'html', 'css', 'scss', 'json', 'markdown',
                'shell', 'yaml', 'xml', 'sql', 'rust', 'go',
                'ruby', 'php', 'swift', 'kotlin', 'text', 'other'
            ],
            default: 'javascript',
        },
        isUnsaved: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Ensure unique path per project
ideFileSchema.index({ project: 1, path: 1 }, { unique: true });

const IdeFile = mongoose.model('IdeFile', ideFileSchema);
export default IdeFile;
