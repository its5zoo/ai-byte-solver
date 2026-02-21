import IdeProject from '../models/IdeProject.js';
import IdeFile from '../models/IdeFile.js';
import ChatMessage from '../models/ChatMessage.js';
import ChatSession from '../models/ChatSession.js';

// ─── History & Session State ─────────────────────────────────────────────────

export const getProjectHistory = async (req, res, next) => {
    try {
        const { mode } = req.query; // 'chat', 'fix', or 'optimize'
        const validModes = ['chat', 'fix', 'optimize', 'explain', 'feature'];
        const targetMode = validModes.includes(mode) ? mode : 'chat';

        const project = await IdeProject.findOne({ _id: req.params.id, user: req.user._id });
        if (!project) return res.status(404).json({ error: { message: 'Project not found' } });

        const sessionId = project.sessions?.[targetMode];
        if (!sessionId) {
            return res.json({ messages: [] });
        }

        const messages = await ChatMessage.find({ sessionId }).sort({ createdAt: 1 });
        res.json({ messages });
    } catch (err) {
        next(err);
    }
};

export const saveProjectHistory = async (req, res, next) => {
    try {
        const { role, content, model, mode } = req.body;
        const validModes = ['chat', 'fix', 'optimize', 'explain', 'feature'];
        const targetMode = validModes.includes(mode) ? mode : 'chat';

        const project = await IdeProject.findOne({ _id: req.params.id, user: req.user._id });
        if (!project) return res.status(404).json({ error: { message: 'Project not found' } });

        // Initialize sessions object if missing (backward compatibility)
        if (!project.sessions) project.sessions = {};

        let sessionId = project.sessions[targetMode];
        if (!sessionId) {
            const session = await ChatSession.create({
                userId: req.user._id,
                title: `IDE: ${project.name} (${targetMode})`,
                category: 'ide',
            });
            sessionId = session._id;
            project.sessions[targetMode] = sessionId;

            // Mark modified for mixed type or nested object updates
            project.markModified('sessions');
            await project.save();
        }

        const message = await ChatMessage.create({
            sessionId,
            role,
            content,
            model,
        });

        res.status(201).json({ message });
    } catch (err) {
        next(err);
    }
};

export const updateProjectState = async (req, res, next) => {
    try {
        const { lastOpenFileId, language } = req.body;
        const update = {};
        if (lastOpenFileId !== undefined) update.lastOpenFileId = lastOpenFileId;
        if (language !== undefined) update.language = language;

        const project = await IdeProject.findOneAndUpdate(
            { _id: req.params.id, user: req.user._id },
            { $set: update },
            { new: true }
        );
        if (!project) return res.status(404).json({ error: { message: 'Project not found' } });
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
};

// ─── Projects ────────────────────────────────────────────────────────────────

export const listProjects = async (req, res, next) => {
    try {
        const projects = await IdeProject.find({ user: req.user._id }).sort({ updatedAt: -1 });
        res.json({ projects });
    } catch (err) {
        next(err);
    }
};

export const createProject = async (req, res, next) => {
    try {
        let { name, description, language } = req.body;
        if (!name?.trim()) return res.status(400).json({ error: { message: 'Project name is required' } });

        // Default to 'text' (txt) unless specified/detected
        const nameStr = name.trim();
        const detectedLang = detectLanguage(nameStr);
        let resolvedLang = language || detectedLang;

        // If it was detected as 'text' or not specified, force 'c' as default
        if (resolvedLang === 'text' || !resolvedLang) {
            resolvedLang = 'c';
        }

        const project = await IdeProject.create({
            user: req.user._id,
            name: nameStr,
            description: description?.trim() || '',
            language: resolvedLang,
        });

        /* 
        // Create a starter file matching the project language
        const ext = languageToExt(resolvedLang);
        // If project name has extension use it as filename, otherwise make index.<ext>
        const hasExt = nameStr.includes('.');
        const startFileName = hasExt ? nameStr : `index.${ext}`;

        await IdeFile.create({
            project: project._id,
            user: req.user._id,
            name: startFileName,
            path: `/${startFileName}`,
            content: getBoilerplate(resolvedLang),
            language: resolvedLang,
        });
        */

        res.status(201).json({ project });
    } catch (err) {
        next(err);
    }
};

export const getProject = async (req, res, next) => {
    try {
        const project = await IdeProject.findOne({ _id: req.params.id, user: req.user._id });
        if (!project) return res.status(404).json({ error: { message: 'Project not found' } });
        const files = await IdeFile.find({ project: project._id }).sort({ path: 1 });
        res.json({ project, files });
    } catch (err) {
        next(err);
    }
};

export const deleteProject = async (req, res, next) => {
    try {
        const project = await IdeProject.findOneAndDelete({ _id: req.params.id, user: req.user._id });
        if (!project) return res.status(404).json({ error: { message: 'Project not found' } });
        await IdeFile.deleteMany({ project: req.params.id });
        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
};

// ─── Files ───────────────────────────────────────────────────────────────────

export const listFiles = async (req, res, next) => {
    try {
        const project = await IdeProject.findOne({ _id: req.params.id, user: req.user._id });
        if (!project) return res.status(404).json({ error: { message: 'Project not found' } });
        const files = await IdeFile.find({ project: project._id }).sort({ path: 1 });
        res.json({ files });
    } catch (err) {
        next(err);
    }
};

export const createFile = async (req, res, next) => {
    try {
        const project = await IdeProject.findOne({ _id: req.params.id, user: req.user._id });
        if (!project) return res.status(404).json({ error: { message: 'Project not found' } });

        const { name, path, content, language } = req.body;
        if (!name?.trim()) return res.status(400).json({ error: { message: 'File name is required' } });

        const trimmedName = name.trim();
        const filePath = path || `/${trimmedName}`;
        const lang = language || detectLanguage(trimmedName);
        const fileContent = content !== undefined ? content : getBoilerplate(lang);

        const file = await IdeFile.create({
            project: project._id,
            user: req.user._id,
            name: trimmedName,
            path: filePath,
            content: fileContent,
            language: lang,
        });

        // Touch project updatedAt
        await IdeProject.findByIdAndUpdate(project._id, { updatedAt: new Date() });

        res.status(201).json({ file });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: { message: 'A file with this name already exists in this project' } });
        }
        next(err);
    }
};

export const updateFile = async (req, res, next) => {
    try {
        const project = await IdeProject.findOne({ _id: req.params.id, user: req.user._id });
        if (!project) return res.status(404).json({ error: { message: 'Project not found' } });

        const { content, name, language } = req.body;
        const update = {};
        if (content !== undefined) update.content = content;
        if (name !== undefined) {
            const trimmedName = name.trim();
            update.name = trimmedName;
            update.path = `/${trimmedName}`;
            // Auto-update language when renamed to a known extension
            if (!language) {
                const newLang = detectLanguage(trimmedName);
                if (newLang !== 'text') update.language = newLang;
            }
        }
        if (language !== undefined) {
            update.language = language;

            // AUTOMATIC EXTENSION UPDATE
            // If the user changed the language, we should update the filename extension
            // unless the user also provided a NEW name in the same request
            if (name === undefined) {
                const currentFile = await IdeFile.findOne({ _id: req.params.fid, project: project._id });
                if (currentFile) {
                    const currentName = currentFile.name;
                    const baseName = currentName.includes('.') ? currentName.substring(0, currentName.lastIndexOf('.')) : currentName;
                    const newExt = languageToExt(language);
                    const newName = `${baseName}.${newExt}`;

                    update.name = newName;
                    update.path = `/${newName}`;
                }
            }
        }

        const file = await IdeFile.findOneAndUpdate(
            { _id: req.params.fid, project: project._id },
            { $set: update },
            { new: true }
        );
        if (!file) return res.status(404).json({ error: { message: 'File not found' } });

        // Touch project updatedAt
        await IdeProject.findByIdAndUpdate(project._id, { updatedAt: new Date() });

        res.json({ file });
    } catch (err) {
        next(err);
    }
};

export const deleteFile = async (req, res, next) => {
    try {
        const project = await IdeProject.findOne({ _id: req.params.id, user: req.user._id });
        if (!project) return res.status(404).json({ error: { message: 'Project not found' } });

        const file = await IdeFile.findOneAndDelete({ _id: req.params.fid, project: project._id });
        if (!file) return res.status(404).json({ error: { message: 'File not found' } });

        res.json({ ok: true });
    } catch (err) {
        next(err);
    }
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function detectLanguage(filename) {
    const ext = filename.includes('.') ? filename.split('.').pop()?.toLowerCase() : '';
    const map = {
        js: 'javascript',
        jsx: 'javascript',
        ts: 'typescript',
        tsx: 'typescript',
        py: 'python',
        cpp: 'cpp',
        cc: 'cpp',
        cxx: 'cpp',
        c: 'c',
        cs: 'csharp',
        java: 'java',
        html: 'html',
        htm: 'html',
        css: 'css',
        scss: 'scss',
        json: 'json',
        md: 'markdown',
        sh: 'shell',
        bash: 'shell',
        yaml: 'yaml',
        yml: 'yaml',
        xml: 'xml',
        sql: 'sql',
        rs: 'rust',
        go: 'go',
        rb: 'ruby',
        php: 'php',
        swift: 'swift',
        kt: 'kotlin',
    };
    return map[ext] || 'text';
}

function languageToExt(lang) {
    const map = {
        javascript: 'js',
        typescript: 'ts',
        python: 'py',
        cpp: 'cpp',
        c: 'c',
        csharp: 'cs',
        java: 'java',
        html: 'html',
        css: 'css',
        scss: 'scss',
        json: 'json',
        markdown: 'md',
        shell: 'sh',
        yaml: 'yml',
        rust: 'rs',
        go: 'go',
        ruby: 'rb',
        php: 'php',
        swift: 'swift',
        kotlin: 'kt',
    };
    return map[lang] || 'txt';
}

function getBoilerplate(lang) {
    switch (lang) {
        case 'python':
            return '# Python\nprint("Hello, World!")\n';
        case 'java':
            return 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, World!");\n    }\n}\n';
        case 'cpp':
            return '#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, World!" << endl;\n    return 0;\n}\n';
        case 'c':
            return '#include <stdio.h>\n\nint main() {\n    printf("Hello, World!\\n");\n    return 0;\n}\n';
        case 'csharp':
            return 'using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, World!");\n    }\n}\n';
        case 'typescript':
            return '// TypeScript\nconst message: string = "Hello, World!";\nconsole.log(message);\n';
        case 'html':
            return '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8" />\n  <title>Document</title>\n</head>\n<body>\n  <h1>Hello, World!</h1>\n</body>\n</html>\n';
        case 'css':
            return '/* CSS */\nbody {\n  margin: 0;\n  font-family: sans-serif;\n}\n';
        case 'rust':
            return 'fn main() {\n    println!("Hello, World!");\n}\n';
        case 'go':
            return 'package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, World!")\n}\n';
        case 'shell':
            return '#!/bin/bash\necho "Hello, World!"\n';
        case 'ruby':
            return '# Ruby\nputs "Hello, World!"\n';
        default:
            return '// Code\nconsole.log("Hello, World!");\n';
    }
}
