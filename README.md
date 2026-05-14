# CBT School Examination System — Frontend

A production-ready React frontend for the Computer Based Test platform.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — set VITE_API_URL to your backend URL

# 3. Start development server
npm run dev

# 4. Build for production
npm run build
```

---

## 📁 Project Structure

```
src/
├── App.jsx                    # Root router + auth guards
├── main.jsx                   # Entry point
├── index.css                  # Global styles + Tailwind layers
├── context/
│   └── AuthContext.jsx        # Auth state, login/logout
├── services/
│   ├── api.js                 # Axios instance with interceptors
│   └── index.js               # All API service functions
├── hooks/
│   └── index.js               # useAsync, useDebounce, useLocalStorage
├── utils/
│   └── index.js               # Formatters, helpers
├── components/
│   └── common/
│       ├── Layout.jsx         # Sidebar + page shell
│       └── UI.jsx             # Modal, Table, Spinner, StatCard, etc.
└── pages/
    ├── auth/
    │   ├── Login.jsx
    │   └── Register.jsx
    ├── student/
    │   ├── Dashboard.jsx      # Exam listing
    │   ├── ExamPage.jsx       # Full CBT engine
    │   ├── Results.jsx        # Result history
    │   └── ResultDetail.jsx   # Per-attempt review
    ├── teacher/
    │   ├── Dashboard.jsx      # Exam management table
    │   ├── CreateExam.jsx     # Create + edit exam form
    │   ├── ManageExam.jsx     # Re-exports CreateExam (edit mode)
    │   ├── ExamQuestions.jsx  # Add/edit/bulk questions
    │   └── ClassResults.jsx   # Result analytics per exam
    └── admin/
        ├── Dashboard.jsx      # Global platform stats
        ├── ManageUsers.jsx    # Approve, suspend, assign class
        ├── ManageClasses.jsx  # CRUD classes + assign teacher
        ├── ManageSubjects.jsx # CRUD subjects
        └── Analytics.jsx     # Charts and deep analytics
```

---

## 🔑 Role Routing

| Role    | Landing Page  |
|---------|---------------|
| student | `/student`    |
| teacher | `/teacher`    |
| admin   | `/admin`      |

All routes are protected. Unauthenticated users are redirected to `/login`. Wrong-role access redirects to the user's own home.

---

## 🛡️ Anti-Cheat (ExamPage)

The exam engine implements all anti-cheat measures from the backend spec:

| Trigger           | Action                              |
|-------------------|-------------------------------------|
| Tab switch        | Logs `tab_switch` violation         |
| Window blur       | Logs `window_blur` violation        |
| Fullscreen exit   | Logs `fullscreen_exit` violation    |
| Right-click       | Prevented + logs `right_click`      |
| Copy (Ctrl+C)     | Prevented + logs `copy_attempt`     |
| 3 violations      | Auto-submits exam immediately       |
| Timer expires     | Auto-submits exam                   |

---

## 💡 Key Features

- **Auto-save answers** — every answer PATCH is sent immediately
- **Resume exam** — re-starting an exam resumes from saved answers
- **Question navigator** — sidebar grid shows answered/unanswered
- **Bulk question upload** — paste JSON array in teacher panel
- **Score ring** — animated SVG progress ring on result pages
- **Recharts analytics** — bar charts, pie charts, score distributions
- **Responsive** — mobile-first with collapsible sidebar

---

## ☁️ Deployment (Vercel)

1. Push to GitHub
2. Import project in Vercel
3. Set environment variable: `VITE_API_URL=https://your-backend.onrender.com/api`
4. Deploy — `vercel.json` handles SPA routing

---

## 🎨 Design System

- **Font**: Sora (display) + DM Sans (body) + JetBrains Mono (code)
- **Theme**: Dark surface (#0f1117) with brand blue (#3474f5) accents
- **Reusable classes**: `.btn-primary`, `.btn-secondary`, `.card`, `.card-hover`, `.input`, `.label`, `.badge-*`, `.stat-card`

---

## 🔧 Environment Variables

| Variable       | Description                    | Default                      |
|----------------|--------------------------------|------------------------------|
| `VITE_API_URL` | Backend API base URL           | `http://localhost:5000/api`  |
