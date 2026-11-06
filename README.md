Here is a complete, professional README that covers what you built, how to set it up, and how to deploy it. Copy this into `README.md` at the **root** of your project (not inside `backend/` or `frontend/`).

```markdown
# 🚀 ClickUp Clone

A **full-stack, multi-tenant project management app** built with Next.js, Express, PostgreSQL, and Socket.io. Inspired by ClickUp — includes workspaces, projects, lists, tasks, Kanban boards, real-time collaboration, file attachments, email notifications, and a complete audit log.

![Banner](https://img.shields.io/badge/Stack-Next.js%20%7C%20Express%20%7C%20Prisma%20%7C%20PostgreSQL-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Status](https://img.shields.io/badge/Status-Production%20Ready-brightgreen)

---

## 🌐 Live Demo

- **Frontend**: [clickup-clone.vercel.app](https://clickup-clone.vercel.app) *(replace with your live URL)*
- **Backend API**: [clickup-backend.onrender.com](https://clickup-backend.onrender.com) *(replace with your live URL)*

> ⚠️ Render free tier sleeps after 15 min of inactivity — first request may take ~30 seconds to wake up.

---

## ✨ Features

### 🔐 Authentication
- Google OAuth 2.0 login via Passport.js
- JWT access + refresh token rotation
- HttpOnly refresh cookie with automatic silent refresh
- Session persistence across page reloads

### 🏢 Multi-Tenant Workspaces
- Create and switch between multiple workspaces
- Invite team members by email (instant add — no invite link needed)
- Role-based access control: **Admin** vs **Member**
- Admin-only: create projects, lists, tasks; delete members; edit roles

### 📁 Projects & Lists
- Create projects with custom colors and descriptions
- Add multiple lists inside each project (Kanban columns)
- Drag-and-drop reordering for lists and tasks
- Project settings modal (edit name, description, delete)

### ✅ Tasks
- Full task management: title, description, status, priority, due date, assignee
- **Subtasks** with progress tracking
- **Comments** with edit/delete and real-time updates
- **File attachments** via UploadThing
- Full task detail page (`/tasks/[id]`)
- Drag-and-drop between Kanban columns (status change)
- Assign tasks to any workspace member → email notification

### 📊 Views
- **List View** — compact table with all task details
- **Kanban Board View** — drag-and-drop columns (To Do, In Progress, Done)
- **My Tasks** — personal dashboard with pending task count badge
- **Activity History** — admin-only audit log of all workspace events

### ⚡ Real-Time Collaboration
- Socket.io with JWT authentication
- Live updates across browser windows (task create/update/delete)
- Instant workspace activity broadcasting
- Real-time pending task count in sidebar

### 📧 Notifications
- Welcome email on signup (via Resend)
- Task assignment email (only on assignee change)
- Workspace addition email
- Beautiful HTML templates

### 🎨 UX & Polish
- **Dark mode** with system detection
- **Command Palette** (`⌘K` / `Ctrl+K`) for global search
- Custom **404 page**
- Skeleton loaders on every data fetch
- Toast notifications via Sonner
- Responsive design (mobile → desktop)
- Hierarchical sidebar with collapsible workspaces → projects → lists

---

## 🏗️ Tech Stack

### Frontend
| Tech | Purpose |
|---|---|
| **Next.js 15 (App Router)** | React framework with SSR |
| **TypeScript** | Type safety |
| **Tailwind CSS** | Styling |
| **Shadcn UI** | Component library |
| **Zustand** | Global state management |
| **Axios** | HTTP client with interceptors |
| **Socket.io Client** | Real-time WebSocket |
| **@dnd-kit** | Drag-and-drop |
| **Sonner** | Toast notifications |
| **next-themes** | Dark mode |
| **UploadThing** | File uploads |
| **Lucide React** | Icons |

### Backend
| Tech | Purpose |
|---|---|
| **Node.js + Express 5** | REST API |
| **TypeScript** | Type safety |
| **Prisma 7** | ORM |
| **PostgreSQL (Neon)** | Database |
| **Passport.js** | Google OAuth |
| **JWT** | Auth tokens |
| **Socket.io** | Real-time server |
| **Resend** | Transactional email |
| **UploadThing** | File upload backend |
| **Morgan** | Request logging |

---

## 📂 Project Structure

```
clickup-clone/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # DB schema
│   │   └── migrations/            # Migration history
│   ├── src/
│   │   ├── config/                # env, passport, socket
│   │   ├── controllers/           # Route handlers
│   │   ├── middleware/            # auth, error handling
│   │   ├── models/                # Prisma model wrappers
│   │   ├── routes/                # Express routes
│   │   ├── services/              # Business logic
│   │   ├── utils/                 # asyncHandler, helpers
│   │   ├── app.ts                 # Express app config
│   │   └── server.ts              # HTTP + Socket.io server
│   ├── prisma.config.ts           # Prisma 7 config
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── app/
│   │   ├── (app)/                 # Authenticated routes
│   │   │   ├── dashboard/         # Overview page
│   │   │   ├── projects/[id]/     # Project detail
│   │   │   ├── tasks/[id]/        # Task detail page
│   │   │   ├── members/           # Team management
│   │   │   ├── my-tasks/          # Personal tasks
│   │   │   ├── history/           # Activity log
│   │   │   └── settings/          # Workspace settings
│   │   ├── login/                 # Auth page
│   │   └── layout.tsx             # Root layout
│   ├── components/                # Reusable UI
│   ├── lib/                       # api, socket, auth
│   ├── store/                     # Zustand stores
│   ├── types/                     # TypeScript types
│   └── next.config.ts
│
└── README.md
```

---

## 🚀 Getting Started (Local Development)

### Prerequisites
- **Node.js 20+**
- **PostgreSQL** database (local or [Neon](https://neon.tech) free tier)
- **Google OAuth credentials** from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
- **Resend API key** from [Resend](https://resend.com)
- **UploadThing token** from [UploadThing](https://uploadthing.com)

### 1. Clone the repo
```bash
git clone https://github.com/M-SuhaibGM/clickup_backend.git
cd clickup_backend
```

### 2. Backend setup
```bash
cd backend
npm install
cp .env.example .env   # Then fill in your values
```

**`backend/.env`**:
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback

SESSION_SECRET=random-string
ACCESS_TOKEN_SECRET=random-string
REFRESH_TOKEN_SECRET=random-string
ACCESS_TOKEN_EXPIRES=15m
REFRESH_TOKEN_EXPIRES=7d

RESEND_API_KEY=re_your_key
UPLOADTHING_TOKEN=sk_live_your_token
```

Run migrations and start:
```bash
npx prisma migrate deploy
npx prisma generate
npm run dev
```
Backend runs on **http://localhost:5000**.

### 3. Frontend setup
```bash
cd ../frontend
npm install
```

**`frontend/.env.local`**:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_AUTH_URL=http://localhost:5000/api/auth
```

Start the dev server:
```bash
npm run dev
```
Frontend runs on **http://localhost:3000**.

### 4. Google OAuth setup
In [Google Cloud Console](https://console.cloud.google.com/apis/credentials):
- **Authorized JavaScript origins**: `http://localhost:3000`
- **Authorized redirect URIs**: `http://localhost:5000/api/auth/google/callback`

---

## 🐳 Docker (Optional)

To run the backend in Docker locally:

```bash
cd backend
docker build -t clickup-backend .
docker run -p 5000:5000 --env-file .env clickup-backend
```

The `Dockerfile` uses Node 22 Alpine with OpenSSL for Prisma. It runs `prisma migrate deploy` automatically on startup.

---

## ☁️ Deployment

### Database — Neon
1. Create a project at [neon.tech](https://neon.tech)
2. Copy the connection string (ends with `?sslmode=require`)
3. Run migrations: `npx prisma migrate deploy`

### Backend — Render
1. Create **New Web Service** → connect GitHub repo
2. **Root Directory**: `backend`
3. **Runtime**: Node
4. **Build Command**: `npm install && npx prisma generate && npm run build`
5. **Start Command**: `npm start`
6. **Environment Variables**: Copy all from `backend/.env`, updating:
   - `NODE_ENV=production`
   - `FRONTEND_URL=https://your-frontend.vercel.app`
   - `GOOGLE_CALLBACK_URL=https://your-backend.onrender.com/api/auth/google/callback`

### Frontend — Vercel
1. Create **New Project** → connect GitHub repo
2. **Root Directory**: `frontend`
3. **Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
   NEXT_PUBLIC_AUTH_URL=https://your-backend.onrender.com/api/auth
   ```
4. Deploy

### Final Step — Google OAuth
Update Google Console:
- **Authorized JavaScript origins**: `https://your-frontend.vercel.app`
- **Authorized redirect URIs**: `https://your-backend.onrender.com/api/auth/google/callback`

---

## 🧪 Testing Checklist

- [ ] Sign in with Google
- [ ] Create a workspace
- [ ] Create a project → list → task
- [ ] Assign task to a team member (email arrives)
- [ ] Drag task between Kanban columns
- [ ] Add a comment, subtask, and attachment
- [ ] Invite another email to workspace
- [ ] Switch between workspaces
- [ ] Press `⌘K` to open Command Palette
- [ ] Toggle dark mode
- [ ] Check Activity History (admin only)
- [ ] Test real-time: two browser windows, drag task in one → updates in other

---

## 🔒 Security Features

- ✅ HttpOnly refresh cookies (XSS safe)
- ✅ JWT access token rotation
- ✅ Role-based access control enforced on backend
- ✅ SQL injection protected via Prisma
- ✅ CORS with credentials
- ✅ Environment variables never committed
- ✅ Google OAuth with state verification

---

## 🐛 Known Limitations

- **Render free tier**: Cold starts (~30s) after 15 min inactivity
- **Resend free tier**: Can only send to verified addresses until domain verified
- **UploadThing free tier**: 2GB storage limit
- **No rate limiting** (add `express-rate-limit` for production use)
- **No test suite** (add Jest/Vitest for production)

---

## 📝 License

MIT License — feel free to fork, extend, or use commercially.

---

## 🙌 Acknowledgments

- [ClickUp](https://clickup.com) for the design inspiration
- [Shadcn UI](https://ui.shadcn.com) for the component primitives
- [Vercel](https://vercel.com), [Render](https://render.com), and [Neon](https://neon.tech) for free hosting

---

**Built with ❤️ by [Muhammad Suhaib](https://github.com/M-SuhaibGM)**