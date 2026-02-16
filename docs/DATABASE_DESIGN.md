# AI Byte Solver — MongoDB Schema Design

---

## User

| Field | Type | Index | Notes |
|-------|------|-------|-------|
| _id | ObjectId | PK | |
| email | String | unique | Required, lowercase |
| password | String | - | Hashed (bcrypt), required if not OAuth |
| name | String | - | Required |
| avatar | String | - | URL or path |
| googleId | String | sparse unique | For OAuth users |
| role | String | - | "student" (default), "admin" |
| preferences | Object | - | theme, language, etc. |
| createdAt | Date | - | |
| updatedAt | Date | - | |

**Indexes:** `email` unique, `googleId` sparse unique

---

## ChatSession

| Field | Type | Index | Notes |
|-------|------|-------|-------|
| _id | ObjectId | PK | |
| userId | ObjectId | ref User | Required |
| title | String | - | "New Chat" default |
| mode | String | - | "syllabus" \| "open" |
| pdfId | ObjectId | ref UploadedPDF | Optional, for syllabus mode |
| createdAt | Date | - | |
| updatedAt | Date | - | |
| lastMessageAt | Date | - | For sorting |

**Indexes:** `{ userId: 1, lastMessageAt: -1 }`, `{ userId: 1 }`

---

## ChatMessage

| Field | Type | Index | Notes |
|-------|------|-------|-------|
| _id | ObjectId | PK | |
| sessionId | ObjectId | ref ChatSession | Required |
| role | String | - | "user" \| "assistant" |
| content | String | - | Text content |
| difficulty | String | - | "easy" \| "medium" \| "hard" (AI-detected) |
| sources | Array | - | [{ pdfId, chapter, topic }] for syllabus mode |
| createdAt | Date | - | |

**Indexes:** `{ sessionId: 1, createdAt: 1 }`

---

## UploadedPDF

| Field | Type | Index | Notes |
|-------|------|-------|-------|
| _id | ObjectId | PK | |
| userId | ObjectId | ref User | Required |
| filename | String | - | Stored filename |
| originalName | String | - | User's filename |
| size | Number | - | Bytes |
| pages | Number | - | Page count |
| extractedText | String | - | Full text for AI context |
| topics | [String] | - | Extracted/suggested topics |
| mimeType | String | - | "application/pdf" |
| uploadedAt | Date | - | |

**Indexes:** `{ userId: 1, uploadedAt: -1 }`

---

## Quiz

| Field | Type | Index | Notes |
|-------|------|-------|-------|
| _id | ObjectId | PK | |
| userId | ObjectId | ref User | Required |
| sessionId | ObjectId | ref ChatSession | Optional |
| title | String | - | "Quiz - Physics Ch 2" |
| difficulty | String | - | "mixed" \| "easy" \| "medium" \| "hard" |
| questions | Array | - | See QuizQuestion sub-schema |
| createdAt | Date | - | |

**QuizQuestion sub-schema:**
- type: "mcq" \| "short"
- question: String
- options: [String] (for MCQ)
- correctOption: Number or String (index or answer)
- correctAnswer: String (for short)
- topic: String
- difficulty: String

**Indexes:** `{ userId: 1, createdAt: -1 }`

---

## QuizAttempt

| Field | Type | Index | Notes |
|-------|------|-------|-------|
| _id | ObjectId | PK | |
| userId | ObjectId | ref User | Required |
| quizId | ObjectId | ref Quiz | Required |
| answers | Array | - | [{ questionId, selectedOption \| shortAnswer }] |
| score | Number | - | Correct count |
| total | Number | - | Total questions |
| percentage | Number | - | |
| completedAt | Date | - | |

**Indexes:** `{ userId: 1, completedAt: -1 }`, `{ quizId: 1 }`

---

## LearningStatistics

| Field | Type | Index | Notes |
|-------|------|-------|-------|
| _id | ObjectId | PK | |
| userId | ObjectId | ref User | Required |
| date | Date | - | Day (start of day) |
| doubtsSolved | Number | - | Messages exchanged |
| studyTimeMinutes | Number | - | Estimated or tracked |
| topicsCovered | [String] | - | |
| quizAttempts | Number | - | |
| quizCorrect | Number | - | |

**Indexes:** `{ userId: 1, date: -1 }` (unique compound)

---

## StudyStreak

| Field | Type | Index | Notes |
|-------|------|-------|-------|
| _id | ObjectId | PK | |
| userId | ObjectId | ref User | Required, unique |
| currentStreak | Number | - | Days in a row |
| longestStreak | Number | - | All-time max |
| lastActiveDate | Date | - | Last study day |
| weeklyActivity | [Number] | - | [0,1,1,0,1,1,1] for Sun–Sat |
| totalStudyDays | Number | - | |
| updatedAt | Date | - | |

**Indexes:** `userId` unique

---

## Relationships Summary

- User → ChatSession (1:N)
- User → UploadedPDF (1:N)
- User → Quiz (1:N)
- User → QuizAttempt (1:N)
- User → LearningStatistics (1:N)
- User → StudyStreak (1:1)
- ChatSession → ChatMessage (1:N)
- ChatSession → UploadedPDF (N:1, optional)
- Quiz → QuizAttempt (1:N)

---

## Analytics & Streak Support

- **LearningStatistics** per day enables daily/weekly/monthly charts
- **StudyStreak** per user enables streak UI and gamification
- **QuizAttempt** linked to **LearningStatistics** for accuracy tracking
- **ChatMessage.sources** and **difficulty** support topic coverage and level analysis
