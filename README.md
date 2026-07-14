# Typeform Builder — Full Stack Form Platform

A full-stack Typeform clone built with Next.js, FastAPI, SQLite, and TypeScript. Features a drag-and-drop form builder, conversational one-question-at-a-time experience, response analytics, and a modern Typeform-inspired UI.

---

## 🚀 Quick Links

| Link | Description |
|------|-------------|
| [Live Demo](https://typeform-builder-one.vercel.app) | Live production app |
| [Getting Started](#-getting-started-local-setup) | Run the app on your machine |
| [Architecture](#-architecture-at-a-glance) | System design and data flow |
| [Project Structure](#-project-structure) | Codebase overview |
| [API Reference](#-api-reference) | Backend endpoints |

---

## 🌐 Production URLs

| Service | URL |
|---------|-----|
| **Frontend** | https://typeform-builder-one.vercel.app |
| **Backend API** | Deployed on Render |

---

## 🏗️ Architecture at a Glance

```
User (Browser)
    │
    ▼
[Next.js Frontend — TypeScript]     → Vercel
    │
    │  REST API calls
    ▼
[FastAPI Backend — Python]          → Render
    ├── /forms      → Form CRUD
    ├── /questions  → Question management
    ├── /responses  → Response collection
    └── /analytics  → Response analytics
    │
    ▼
[SQLite Database]
    ├── forms
    ├── questions
    └── responses
```

---

## 📁 Project Structure

```
typeform-builder/
│
├── frontend/                        # Next.js + TypeScript
│   ├── src/
│   │   ├── app/                     # Next.js App Router pages
│   │   ├── components/              # Reusable UI components
│   │   │   ├── FormBuilder/         # Drag-and-drop form builder
│   │   │   ├── QuestionEditor/      # Question type editor
│   │   │   └── FormPreview/         # Live form preview
│   │   ├── lib/                     # API client and utilities
│   │   └── types/                   # TypeScript type definitions
│   ├── package.json
│   └── tsconfig.json
│
├── backend/                         # FastAPI + Python
│   ├── main.py                      # FastAPI app entry point
│   ├── routers/
│   │   ├── forms.py                 # Form CRUD endpoints
│   │   ├── questions.py             # Question management
│   │   ├── responses.py             # Response collection
│   │   └── analytics.py            # Response analytics
│   ├── models/
│   │   ├── form.py                  # Form model
│   │   ├── question.py              # Question model
│   │   └── response.py              # Response model
│   ├── database.py                  # SQLite database setup
│   └── requirements.txt             # Python dependencies
```

---

## 🛠️ Getting Started (Local Setup)

### 1. Clone the Repository

```bash
git clone https://github.com/Shaambhavi58/typeform--builder.git
cd typeform--builder
```

### 2. Setup the Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Mac/Linux

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Setup the Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Open the App

Go to **http://localhost:3000**

---

## 📡 API Reference

### Forms
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/forms` | List all forms |
| `POST` | `/forms` | Create new form |
| `GET` | `/forms/{id}` | Get form with questions |
| `PUT` | `/forms/{id}` | Update form |
| `DELETE` | `/forms/{id}` | Delete form |

### Questions
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/forms/{id}/questions` | Add question to form |
| `PUT` | `/questions/{id}` | Update question |
| `DELETE` | `/questions/{id}` | Delete question |

### Responses
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/forms/{id}/responses` | Submit form response |
| `GET` | `/forms/{id}/responses` | Get all responses |
| `GET` | `/forms/{id}/analytics` | Get response analytics |

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🏗️ **Form Builder** | Drag-and-drop interface to build forms visually |
| 💬 **Conversational UI** | One-question-at-a-time experience like Typeform |
| 📊 **Analytics** | Response analytics and completion rates |
| 🎨 **Modern UI** | Clean, Typeform-inspired dark interface |
| 📝 **Question Types** | Multiple choice, short text, long text, rating, and more |
| 🔗 **Shareable Links** | Share forms via unique URLs |
| ⚡ **Live Preview** | Preview form as you build it |

---

## 🚀 Deployment

| Service | Purpose | Free Tier |
|---------|---------|-----------|
| **Vercel** | Frontend hosting | Unlimited |
| **Render** | Backend hosting | Free tier |
| **SQLite** | Database | Built-in |

### Frontend (Vercel)
1. Push to GitHub
2. Go to https://vercel.com → **New Project**
3. Import `Shaambhavi58/typeform--builder`
4. Set root directory to `frontend`
5. Deploy

### Backend (Render)
1. Go to https://render.com → **New Web Service**
2. Connect GitHub repo
3. Set root directory to `backend`
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14 + TypeScript |
| Styling | CSS Modules / Tailwind |
| Backend | FastAPI + Python |
| Database | SQLite |
| ORM | SQLAlchemy |
| Deployment | Vercel + Render |

---

## 📜 License

MIT License — feel free to use this project for learning, portfolios, and interviews.
