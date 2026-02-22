# AI Byte Solver — Project Architecture

> **Product:** Education-focused AI doubt-solving platform for students  
> **Stack:** MERN (MongoDB, Express, React, Node.js)

---

## Frontend Structure (React + Vite)

```
frontend/
├── public/                 # Static assets
├── src/
│   ├── assets/             # Images, fonts, SVGs
│   ├── components/         # Reusable UI components
│   │   ├── ui/             # ShadCN/Radix base components
│   │   ├── chat/           # Chat-specific components
│   │   ├── ide/            # IDE layout, code editor, terminal, AI panel
│   │   ├── analytics/      # Charts, stats widgets
│   │   ├── layout/         # Sidebar, header, panels
│   │   └── forms/          # Upload, settings forms
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Utils, API client, constants
│   ├── pages/              # Route-level pages
│   ├── stores/             # State management (Zustand/Context)
│   ├── styles/             # Global CSS, Tailwind config
│   ├── types/              # TypeScript interfaces
│   ├── App.tsx
│   └── main.tsx
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

### Responsibilities

| Folder | Responsibility |
|--------|----------------|
| `components/ui` | Base design system (Button, Card, Input, etc.) |
| `components/chat` | Message bubbles, typing indicator, math rendering |
| `components/ide` | Code editor (Monaco), local terminal output, specialized AI panel |
| `components/analytics` | Charts, streak widget, topic coverage |
| `components/layout` | Sidebar, dashboard panels, responsive layout |
| `hooks` | Data fetching, auth, theme, scroll memory |
| `lib` | API client, auth helpers, formatting utilities |
| `pages` | Dashboard, Profile, Settings, Login |
| `stores` | User state, theme, chat session state |

---

## Backend Structure (Node.js + Express)

```
backend/
├── src/
│   ├── config/             # DB, env, constants
│   ├── controllers/        # Route handlers
│   ├── middleware/         # Auth, validation, error handling
│   ├── models/             # Mongoose schemas
│   ├── routes/             # API route definitions
│   ├── services/           # Business logic
│   │   ├── ai/             # AI prompts, mode logic, streaming, PYQ extraction
│   │   ├── pdf/            # PDF parse, text extraction
│   │   ├── ide/            # Piston API execution helpers (if applicable)
│   │   └── quiz/           # Quiz generation, General mode validations, scoring
│   ├── utils/              # Helpers, validators
│   └── app.js              # Express app setup
├── uploads/                # Temporary PDF storage (or use cloud)
├── package.json
└── server.js               # Entry point
```

### Responsibilities

| Folder | Responsibility |
|--------|----------------|
| `config` | MongoDB connection, JWT secrets, CORS, env vars |
| `controllers` | HTTP req/res handling, validation, service calls |
| `middleware` | JWT verify, rate limit, file upload, error handler |
| `models` | User, ChatSession, ChatMessage, PDF, Quiz, etc. |
| `routes` | REST endpoints grouped by domain (auth, chat, pdf, quiz, ide) |
| `services/ai` | System prompts, syllabus grounding, mode switching, PYQ extraction |
| `services/pdf` | Multer handling, pdf-parse, text extraction |
| `services/quiz` | MCQ/short-answer generation, General and Chat mode validations |

---

## Separation of Concerns

- **Routes** → Define paths and HTTP methods
- **Controllers** → Parse input, call services, format response
- **Services** → Business logic, external APIs, AI calls
- **Models** → Data shape, validation, indexing
- **Middleware** → Cross-cutting: auth, logging, errors

---

## Scalability Notes

- Stateless API (JWT) for horizontal scaling
- MongoDB indexing on `userId`, `sessionId`, `createdAt`
- AI context limited per session to control token usage
- PDF text stored in DB for fast retrieval; files optionally in S3
