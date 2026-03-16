# CU Student AI — University Complaint Management System

A full-stack AI-powered complaint management system for Chandigarh University students, built with React.js, Node.js/Express, PostgreSQL, and Google Gemini AI.

---

## ✨ Features

### Student Portal
- **Registration & Login** — Secure JWT-based authentication
- **Multi-language Support** — Full English and Hindi (हिंदी) interface via react-i18next
- **File Complaints** — Drag-and-drop file attachments (screenshots, videos, PDFs)
- **Real-time Status Tracking** — Live dashboard showing complaint progress
- **Appeal System** — File and track appeals for resolved/rejected complaints
- **Feedback Rating** — Rate complaint resolution with 1–5 stars

### Department Dashboard
- View complaints assigned to your department
- Update complaint status and add internal notes
- Provide official responses to students
- Track resolution time and performance metrics

### PVC / Admin Analytics Dashboard
- Real-time complaint statistics
- Department performance metrics and charts
- Complaint trend analysis (daily/weekly/monthly)
- PDF and Excel report export
- Date range filtering

### AI Integration (Google Gemini)
- **Auto-categorization** into 13 university departments
- **Priority assessment** — Low / Medium / High / Critical
- **Sentiment analysis** on complaint text
- **Intelligent routing** to the correct department
- Bilingual NLP support (Hindi + English)

### Security & Infrastructure
- JWT authentication with role-based access control
- Helmet, CORS, rate limiting (3-tier)
- Input validation (Joi + express-validator)
- SQL injection prevention via parameterized queries
- Audit logging for all actions
- Docker & Docker Compose setup

---

## 🏗️ Architecture

```
┌─────────────┐    ┌──────────────────┐    ┌─────────────┐
│  React.js   │◄──►│  Node.js/Express  │◄──►│ PostgreSQL  │
│  Frontend   │    │     Backend       │    │  Database   │
│  (Port 3000)│    │   (Port 5000)     │    │ (Port 5432) │
└─────────────┘    └──────────────────┘    └─────────────┘
                            │
                            ▼
                   ┌─────────────────┐
                   │  Google Gemini  │
                   │   AI Service    │
                   └─────────────────┘
```

### 13 University Departments
Academic Affairs · Examination · Hostel & Accommodation · Library · Sports & Recreation · Transportation · Scholarship & Financial Aid · IT Services · Student Welfare · Campus Safety & Security · Health Services · Canteen & Food Services · Administration

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+ (for local development)
- PostgreSQL 16+ (for local development)
- Google Gemini API key

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repository
git clone https://github.com/25lmmc1065/cu_stdent_ai.git
cd cu_stdent_ai

# Copy and configure environment variables
cp .env.example .env
# Edit .env with your GEMINI_API_KEY, JWT_SECRET, SMTP credentials

# Start all services
docker compose up -d

# Access the app
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# API Health: http://localhost:5000/health
```

### Option 2: Local Development

#### Backend
```bash
cd backend
cp .env.example .env        # Configure DB, JWT, Gemini, SMTP
npm install

# Initialize database
psql -U postgres -c "CREATE DATABASE cu_student_ai;"
psql -U postgres -d cu_student_ai -f migrations/init.sql

# Start development server
npm run dev                  # http://localhost:5000
```

#### Frontend
```bash
cd frontend
npm install
npm run dev                  # http://localhost:3000
```

---

## 📁 Project Structure

```
cu_stdent_ai/
├── backend/
│   ├── src/
│   │   ├── config/          # Database & Gemini AI config
│   │   ├── middleware/       # Auth, rate limiting, upload, validation
│   │   ├── routes/          # API route definitions
│   │   ├── controllers/     # Business logic
│   │   ├── services/        # Gemini AI & email services
│   │   └── index.js         # Express app entry point
│   ├── migrations/
│   │   └── init.sql         # PostgreSQL schema + department seeds
│   ├── .env.example
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/         # Login, Register
│   │   │   ├── student/      # Dashboard, FileComplaint, ComplaintList, etc.
│   │   │   ├── department/   # Department dashboard & complaint management
│   │   │   ├── admin/        # Admin dashboard & analytics
│   │   │   └── common/       # Navbar, Sidebar, LanguageToggle, etc.
│   │   ├── context/          # AuthContext (JWT + role management)
│   │   ├── services/         # Axios API client
│   │   ├── translations/     # en.json + hi.json
│   │   └── i18n.js
│   ├── package.json
│   ├── vite.config.js
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🔌 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Student registration |
| POST | `/api/v1/auth/login` | Login (all roles) |
| GET | `/api/v1/auth/profile` | Get current user |
| PUT | `/api/v1/auth/profile` | Update profile |

### Complaints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/complaints` | File new complaint (with AI analysis) |
| GET | `/api/v1/complaints` | List complaints (filtered) |
| GET | `/api/v1/complaints/:id` | Get complaint details |
| PATCH | `/api/v1/complaints/:id/status` | Update status (dept/admin) |
| POST | `/api/v1/complaints/:id/notes` | Add internal note (dept) |
| POST | `/api/v1/complaints/:id/response` | Add department response |
| POST | `/api/v1/complaints/:id/feedback` | Submit feedback (student) |

### Appeals
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/appeals` | File appeal |
| GET | `/api/v1/appeals` | List appeals |
| PATCH | `/api/v1/appeals/:id/resolve` | Resolve appeal (admin) |

### Analytics (Admin/PVC)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/analytics/stats` | Real-time statistics |
| GET | `/api/v1/analytics/performance` | Department performance |
| GET | `/api/v1/analytics/trends` | Complaint trends |
| GET | `/api/v1/analytics/export` | Export PDF/Excel |

---

## 🛡️ Security

- **JWT tokens** with configurable expiry
- **bcrypt** password hashing (10 salt rounds)
- **Helmet** HTTP security headers
- **Rate limiting**: 100 req/15min general, 5 req/15min auth, 10 req/hr upload
- **Input validation** on all endpoints
- **Parameterized SQL** queries (no injection risk)
- **CORS** configured for frontend origin only
- **Audit logs** for all sensitive operations

---

## 🌐 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `5000` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_NAME` | Database name | `cu_student_ai` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | — |
| `JWT_SECRET` | JWT signing secret | — |
| `JWT_EXPIRES_IN` | Token expiry | `7d` |
| `GEMINI_API_KEY` | Google Gemini API key | — |
| `SMTP_HOST` | Email SMTP host | `smtp.gmail.com` |
| `SMTP_USER` | Email address | — |
| `SMTP_PASS` | Email app password | — |
| `FRONTEND_URL` | Frontend origin for CORS | `http://localhost:3000` |

---

## 📄 License

MIT
