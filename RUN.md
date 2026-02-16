# How to Run AI Byte Solver

This guide gets the app running with **Ollama** (Intelligence mode) and optional **Gemini** (Gemini mode), plus MongoDB and the backend/frontend.

---

## 1. Prerequisites

- **Node.js** 18+ and **npm**
- **MongoDB** running locally (or a MongoDB Atlas connection string)
- (Optional) **Ollama** for local AI; **Gemini API key** for cloud AI

---

## 2. Connect & Run Ollama (Intelligence Mode)

Ollama runs the model locally. No API key needed.

### Install Ollama

- **Windows / macOS / Linux**: [https://ollama.com](https://ollama.com) — download and install.

### Pull the model and run

```bash
# Pull the default model used by the app
ollama pull llama3.2

# Optional: run it once to confirm it works
ollama run llama3.2
```

Ollama starts a local server at `http://localhost:11434`. The backend uses this URL by default.

### If Ollama is on another machine or port

In backend `.env`:

```env
OLLAMA_BASE_URL=http://YOUR_IP:11434
OLLAMA_MODEL=llama3.2
```

---

## 3. Connect Gemini (Gemini Mode)

Gemini is used when the user selects **Gemini** in the chat input (or when a session is created with Gemini).

### Get an API key

1. Open [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Create an API key.

### Configure the backend

In `backend/.env`:

```env
GEMINI_API_KEY=your-gemini-api-key-here
```

If `GEMINI_API_KEY` is missing, only **Intelligence (Ollama)** mode works; Gemini mode will show an error.

---

## 4. Backend setup and run

### Install and env

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` and set at least:

| Variable        | Description |
|----------------|-------------|
| `MONGODB_URI`  | e.g. `mongodb://localhost:27017/ai-byte-solver` |
| `JWT_SECRET`   | Any long random string for JWT signing |
| `FRONTEND_URL` | Frontend URL, e.g. `http://localhost:5173` |

Optional:

- `OLLAMA_BASE_URL` – default `http://localhost:11434`
- `OLLAMA_MODEL` – default `llama3.2`
- `GEMINI_API_KEY` – for Gemini mode

### Start backend

```bash
npm run dev
```

Backend runs at **http://localhost:5000** (or the `PORT` in `.env`).

---

## 5. Frontend setup and run

### Install and start

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at **http://localhost:5173** (or the port Vite shows).

### Point frontend to your backend

If the backend is not at `http://localhost:5000`, set:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

in `frontend/.env` (create the file if needed).

---

## 6. Run the full stack (summary)

1. **MongoDB** – running (local or Atlas).
2. **Ollama** (optional but recommended):
   ```bash
   ollama pull llama3.2
   ollama serve   # or just leave Ollama app running
   ```
3. **Backend**:
   ```bash
   cd backend
   npm install && cp .env.example .env
   # Edit .env: MONGODB_URI, JWT_SECRET, and optionally GEMINI_API_KEY
   npm run dev
   ```
4. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

Open **http://localhost:5173**, register/login, then:

- Use **Intelligence** (Ollama) for local, free answers (Ollama must be running).
- Use **Gemini** for cloud AI (requires `GEMINI_API_KEY` in backend `.env`).

---

## 7. PDF upload and database

- **Upload**: Use **Upload PDF** in the sidebar → **Browse** or drag-and-drop (max **25 MB**).
- **Storage**: Files are saved under `backend/uploads/` and metadata (filename, size, extracted text, topics) is stored in MongoDB (`UploadedPDF`).
- **Usage**: In **Syllabus Mode**, the app uses the text extracted from your PDFs to answer; upload at least one PDF for syllabus-grounded answers.

---

## 8. Troubleshooting

| Issue | What to check |
|-------|----------------|
| “Ollama error” / no AI reply | Ollama running? `ollama list` and `ollama run llama3.2`. Backend `.env`: `OLLAMA_BASE_URL`, `OLLAMA_MODEL`. |
| Gemini mode fails | `GEMINI_API_KEY` set in backend `.env` and valid. |
| PDF upload fails / “No file uploaded” | Backend running; no proxy stripping `multipart/form-data`. Try a PDF &lt; 25 MB. |
| CORS / network errors | `FRONTEND_URL` in backend `.env` matches the URL you use for the frontend (e.g. `http://localhost:5173`). |
| DB errors | MongoDB running; `MONGODB_URI` correct in backend `.env`. |

Once Ollama (and optionally Gemini) and MongoDB are configured and the backend and frontend are running, the project is fully runnable end-to-end.
