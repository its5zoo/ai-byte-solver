# AI Byte Solver — REST API Design

Base URL: `/api/v1`

---

## Authentication

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Email/password registration |
| POST | `/auth/login` | Email/password login |
| POST | `/auth/google` | Google OAuth token exchange |
| POST | `/auth/refresh` | Refresh JWT |
| POST | `/auth/logout` | Invalidate token (client-side handled) |
| GET | `/auth/me` | Get current user (protected) |

### Request/Response Examples

**POST /auth/register**
```json
// Request
{ "email": "student@example.com", "password": "securePass123", "name": "John" }

// Response 201
{ "user": { "id", "email", "name" }, "accessToken", "refreshToken", "expiresIn" }
```

**POST /auth/google**
```json
// Request
{ "credential": "google_id_token" }

// Response 200
{ "user": {...}, "accessToken", "refreshToken", "expiresIn" }
```

---

## User Profile

| Method | Path | Description |
|--------|------|-------------|
| GET | `/users/me` | Get profile (protected) |
| PATCH | `/users/me` | Update profile (name, avatar) |

---

## PDF Upload & Retrieval

| Method | Path | Description |
|--------|------|-------------|
| POST | `/pdf/upload` | Upload PDF (multipart/form-data) |
| GET | `/pdf` | List user's PDFs |
| GET | `/pdf/:id` | Get single PDF metadata + extracted text |
| DELETE | `/pdf/:id` | Delete PDF |

**POST /pdf/upload** — `multipart/form-data`: `file` (PDF only)

**Response 201**
```json
{
  "id", "filename", "originalName", "size", "pages", "extractedText",
  "topics", "uploadedAt"
}
```

---

## Chat

| Method | Path | Description |
|--------|------|-------------|
| POST | `/chat/sessions` | Create new session |
| GET | `/chat/sessions` | List user's sessions |
| GET | `/chat/sessions/:id` | Get session + messages |
| DELETE | `/chat/sessions/:id` | Delete session |
| POST | `/chat/sessions/:id/messages` | Send message, stream AI reply |

**POST /chat/sessions**
```json
// Request
{ "title": "Physics Ch 2", "pdfId": "optional", "mode": "syllabus" | "open" }

// Response 201
{ "id", "title", "mode", "createdAt" }
```

**POST /chat/sessions/:id/messages**
```json
// Request
{ "content": "What is Newton's second law?" }

// Response 200 (streaming or JSON)
{ "message": { "id", "role", "content" }, "aiMessage": { ... } }
```

---

## AI Message Handling

- Same endpoint: `POST /chat/sessions/:id/messages`
- Optional headers: `Accept: text/event-stream` for SSE streaming
- Mode passed in session; PDF context loaded for syllabus mode

---

## Quiz

| Method | Path | Description |
|--------|------|-------------|
| POST | `/quiz/generate` | Generate quiz from session strict mode |
| POST | `/quiz/custom-generate` | Generate quiz via Chat or General mode |
| GET | `/quiz/:id` | Get quiz questions |
| POST | `/quiz/:id/attempt` | Submit attempt |
| GET | `/quiz/attempts` | List user attempts |

**POST /quiz/custom-generate**
```json
// Request
{ "subject": "Physics", "topic": "Thermodynamics", "level": "medium", "count": 5, "mode": "chat" | "general" }

// Response 201
{ "quizId", "questions": [...] }
```

**POST /quiz/:id/attempt**
```json
// Request
{ "answers": [{ "questionId", "selectedOption" | "shortAnswer" }] }

// Response 200
{ "score", "total", "correctCount", "details": [...] }
```

---

## IDE Workspace

| Method | Path | Description |
|--------|------|-------------|
| POST | `/ide/execute` | Execute code using Piston API |

**POST /ide/execute**
```json
// Request
{ "language": "python", "version": "3.10.0", "files": [{ "name": "main.py", "content": "print('hello')" }] }

// Response 200
{ "run": { "stdout": "hello", "stderr": "", "code": 0 } }
```

---

## Statistics & Analytics

| Method | Path | Description |
|--------|------|-------------|
| GET | `/stats/summary` | Overall stats (doubts, time, accuracy) |
| GET | `/stats/topics` | Topic coverage |
| GET | `/stats/timeline` | Daily/weekly/monthly progress |
| GET | `/stats/quiz` | Quiz performance |

**GET /stats/summary**
```json
{
  "doubtsSolved", "studyTimeMinutes", "accuracyPercent",
  "topicsCovered", "quizAttempts", "averageQuizScore"
}
```

---

## Streaks

| Method | Path | Description |
|--------|------|-------------|
| GET | `/streaks` | Current streak + history |
| POST | `/streaks/heartbeat` | Record activity (internal/cron) |

**GET /streaks**
```json
{
  "currentStreak", "longestStreak", "lastActiveDate",
  "weeklyActivity": [0,1,1,0,1,1,1]
}
```

---

## Error Response Format

```json
{
  "success": false,
  "error": { "code": "AUTH_INVALID", "message": "Invalid token" }
}
```

HTTP status: 400, 401, 403, 404, 422, 500
