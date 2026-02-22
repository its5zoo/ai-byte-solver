# How to Run AI Byte Solver

This guide gets the app running with **Ollama** and MongoDB, plus the backend and frontend.

---

## 1. Prerequisites

- **Node.js** 18+ and **npm**
- **MongoDB** running locally (or a MongoDB Atlas connection string)
- **Ollama** for local AI (no API key needed)

---

## 2. Connect & Run Ollama

Ollama runs the model locally.

### Install Ollama

- **Windows / macOS / Linux**: [https://ollama.com](https://ollama.com) — download and install.

### Pull and run your model

By default this project expects a model called **gpt-oss:120b-cloud** (or a compatible proxy). If you are using Ollama directly, pull and run a model that matches the name you configure:

```bash
ollama pull gpt-oss:120b-cloud
ollama run gpt-oss:120b-cloud
```

Ollama starts a local server at `http://localhost:11434`. The backend uses this URL by default. If you use **https** or another host/port, set `OLLAMA_BASE_URL` in `backend/.env` (e.g. `https://localhost:11434`).

### Tell the app which model to use

In `backend/.env`, set **OLLAMA_MODEL** to the exact name you use with your Ollama or proxy model:

```env
# Recommended default
OLLAMA_MODEL=gpt-oss:120b-cloud

# Example: a local Llama model instead
# OLLAMA_MODEL=llama3.2
```

Then restart the backend (`npm run dev`). The app will use this model for chat and quiz.

### If Ollama is on another machine or port

In backend `.env`:

```env
OLLAMA_BASE_URL=http://YOUR_IP:11434
OLLAMA_MODEL=gpt-oss:120b-cloud
```

---

## 3. Backend setup and run

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
- `OLLAMA_MODEL` – default `gpt-oss:120b-cloud`

### Start backend

```bash
npm run dev
```

Backend runs at **http://localhost:5000** (or the `PORT` in `.env`).

---

## 4. Frontend setup and run

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

## 5. Run the full stack (summary)

1. **MongoDB** – running (local or Atlas).
2. **Ollama**:
   ```bash
   ollama pull llama3.2
   ollama serve   # or just leave Ollama app running
   ```
3. **Backend**:
   ```bash
   cd backend
   npm install && cp .env.example .env
   # Edit .env: MONGODB_URI, JWT_SECRET
   npm run dev
   ```
4. **Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

Open **http://localhost:5173**, register/login. Chat and quiz use **Ollama** (ensure Ollama is running).

---

## 6. Project Modules

- **IDE Workspace**: Write, compile, and execute code within the browser. The IDE comes with a dynamic file explorer and resizable panels.
- **PDF Upload & Context**: Use **Upload PDF** in the chat sidebar. Files are stored and parsed so the AI can ground its answers in your specific syllabus.
- **PYQ Analysis**: Inside the chat, one-click analysis queries the document for Previous Year Questions strings or important diagrams.
- **Quiz Generation**: From the right sidebar, click **Practice Quiz** to open the Quiz Modal. Select **Chat Mode** to generate tests based on your recent conversations, or **General Mode** for broad topics (the AI will actively validate if your selected subject and topic match).

---

## 7. Troubleshooting

| Issue | What to check |
|-------|----------------|
| “Ollama error” / no AI reply | Run `ollama pull gpt-oss:120b-cloud` then `ollama run gpt-oss:120b-cloud` (or whatever you set as `OLLAMA_MODEL`). Backend `.env`: `OLLAMA_BASE_URL`, `OLLAMA_MODEL`. 404 = model not found. |
| PDF upload fails / “No file uploaded” | Backend running; no proxy stripping `multipart/form-data`. Try a PDF &lt; 25 MB. |
| CORS / network errors | `FRONTEND_URL` in backend `.env` matches the URL you use for the frontend (e.g. `http://localhost:5173`). |
| DB errors | MongoDB running; `MONGODB_URI` correct in backend `.env`. |

Once Ollama and MongoDB are configured and the backend and frontend are running, the project is fully runnable end-to-end.
