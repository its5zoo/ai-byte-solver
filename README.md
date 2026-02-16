# AI Byte Solver

Education-focused AI doubt-solving platform for students. **Hybrid Smart Architecture** with FREE (Ollama + Llama 3) and optional Premium (Gemini) modes.

## Hybrid Smart Architecture

| Mode | Provider | Cost | Use Case |
|------|----------|------|----------|
| **Default (FREE)** | Ollama + Llama 3 | Zero cost | PDF syllabus answers, high accuracy |
| **Optional Premium** | Gemini | Controlled usage | Advanced reasoning only |

## Features

- **Authentication**: JWT + Google OAuth, email/password
- **PDF Upload**: Syllabus PDFs, text extraction, syllabus grounding
- **Chat**: Syllabus Mode (from PDF) and Open Source Mode (academic)
- **Quiz**: MCQ and short-answer generation from chat
- **Analytics**: Doubts solved, study time, streaks
- **Math**: KaTeX rendering in chat

## Setup

### 1. Ollama (FREE mode – required)

```bash
# Install Ollama: https://ollama.com
ollama pull llama3.2
ollama run llama3.2   # Verify it works
```

### 2. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env: MONGODB_URI, JWT_SECRET
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. MongoDB

Ensure MongoDB is running locally or set `MONGODB_URI` in `.env`.

## Environment Variables

### Backend (.env)

| Variable | Description |
|----------|-------------|
| PORT | Server port (default 5000) |
| MONGODB_URI | MongoDB connection string |
| JWT_SECRET | JWT signing secret |
| FRONTEND_URL | CORS origin |
| OLLAMA_BASE_URL | Ollama API URL (default http://localhost:11434) |
| OLLAMA_MODEL | Model name (default llama3.2) |
| GEMINI_API_KEY | Optional – for premium mode |

## Docs

- **[How to run (Ollama + Gemini)](RUN.md)** – connect Ollama, Gemini, and run the project
- [Architecture](docs/ARCHITECTURE.md)
- [API Design](docs/API_DESIGN.md)
- [Database Design](docs/DATABASE_DESIGN.md)
- [AI System Prompt](docs/AI_SYSTEM_PROMPT.md)
