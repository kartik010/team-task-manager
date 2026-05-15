# Team Task Manager

Full-stack web application for creating projects, assigning tasks, and tracking team progress with **role-based access control** (Admin & Member).

**Live app:** _Add your Railway URL here after deploy (Settings → Networking → Generate Domain)_

**GitHub:** https://github.com/kartik010/team-task-manager

---

## Assignment overview

| Requirement | Implementation |
|-------------|----------------|
| Authentication | JWT + bcrypt signup/login |
| Projects & teams | CRUD projects, add/remove members |
| Tasks | Create, assign, status tracking, due dates |
| Dashboard | Status breakdown, overdue tasks, my tasks |
| REST API | Express 5 (`/api/*`) |
| Database | PostgreSQL + Prisma ORM |
| RBAC | Admin vs Member permissions |
| Deployment | Railway + PostgreSQL plugin |

Built **without Clerk or Supabase** — custom auth and self-hosted PostgreSQL.

---

## Demo accounts

After the database is seeded (automatic on Railway deploy):

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@example.com | password123 |
| **Member** | member@example.com | password123 |

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, Tailwind CSS 4, React Router |
| Backend | Node.js, Express 5, Zod validation |
| Database | PostgreSQL 16 |
| ORM | Prisma 6 |
| Auth | jsonwebtoken + bcryptjs |
| Hosting | Railway |

---

## Features

### Authentication
- User registration and login
- JWT bearer tokens (7-day expiry)
- First registered user becomes Admin

### Role-based access control

| Action | Admin | Member |
|--------|:-----:|:------:|
| Create / delete projects | ✅ | ❌ |
| Add / remove team members | ✅ | ❌ |
| View projects they belong to | ✅ | ✅ |
| Create tasks in a project | ✅ | ✅ |
| Update task status | ✅ | ✅ |
| Edit task details / delete tasks | ✅ | ❌ |

### Dashboard
- Project and task counts
- Tasks grouped by status (To Do, In Progress, Done)
- Overdue task highlights
- Recently updated tasks

---

## API reference

Base URL (local): `http://localhost:3001`  
Base URL (production): `https://<your-railway-domain>`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/signup` | — | Register new user |
| `POST` | `/api/auth/login` | — | Login, returns JWT |
| `GET` | `/api/auth/me` | ✅ | Current user profile |
| `GET` | `/api/auth/users` | ✅ | List users (for assigning members) |
| `GET` | `/api/projects` | ✅ | List accessible projects |
| `POST` | `/api/projects` | Admin | Create project |
| `GET` | `/api/projects/:id` | ✅ | Project detail + tasks |
| `PATCH` | `/api/projects/:id` | Admin | Update project |
| `DELETE` | `/api/projects/:id` | Admin | Delete project |
| `POST` | `/api/projects/:id/members` | Admin | Add team member |
| `DELETE` | `/api/projects/:id/members/:userId` | Admin | Remove member |
| `GET` | `/api/tasks/project/:projectId` | ✅ | List project tasks |
| `POST` | `/api/tasks/project/:projectId` | ✅ | Create task |
| `PATCH` | `/api/tasks/:id` | ✅ | Update task |
| `DELETE` | `/api/tasks/:id` | Admin | Delete task |
| `GET` | `/api/dashboard` | ✅ | Dashboard statistics |
| `GET` | `/api/health` | — | Health check |

Protected routes require header: `Authorization: Bearer <token>`

---

## Local development

### Prerequisites
- Node.js 20+
- PostgreSQL (Homebrew, Docker, or native)

### Setup

```bash
# Clone
git clone https://github.com/kartik010/team-task-manager.git
cd team-task-manager

# Install dependencies
npm install

# Configure environment (local only — not used on Railway)
cp server/.env.example server/.env
# Edit DATABASE_URL in .env for your local Postgres user (see comments in file)

# Create database (if needed)
createdb team_task_manager

# Migrate & seed
cd server
npx prisma migrate deploy
npm run db:seed
cd ..

# Run (API :3001, UI :5173)
npm run dev
```

Open **http://localhost:5173**

---

## Deploy on Railway

### Option A — GitHub (recommended)

1. Go to [railway.app/new](https://railway.app/new) → **Deploy from GitHub repo**
2. Select **`kartik010/team-task-manager`**
3. Click **+ New** → **Database** → **PostgreSQL**
4. **Name your PostgreSQL service exactly `Postgres`** (Settings → Service name).  
   This repo’s `railway.toml` auto-wires `DATABASE_URL` via config-as-code — see [RAILWAY_SETUP.md](./RAILWAY_SETUP.md) if it’s empty.
5. On the **web app service**, add:

   | Variable | Value |
   |----------|-------|
   | `NODE_ENV` | `production` |
   | `JWT_SECRET` | *(run `openssl rand -hex 32`)* |
   | `CLIENT_URL` | *(optional — auto-detected from `RAILWAY_PUBLIC_DOMAIN`)* |

6. **Settings** → **Networking** → **Generate Domain**
7. **Redeploy** the web service (Deployments → Redeploy)
8. Copy the public URL into this README under **Live app**

> **Troubleshooting:** Empty `DATABASE_URL`? Rename Postgres service to **`Postgres`** or follow [RAILWAY_SETUP.md](./RAILWAY_SETUP.md).

### Option B — Railway CLI

```bash
npm install -g @railway/cli
railway login
cd team-task-manager
railway init
railway add --database postgres
railway variables set NODE_ENV=production JWT_SECRET="$(openssl rand -hex 32)"
railway up
railway domain
```

### What runs on deploy

Configured in `nixpacks.toml` / `railway.json`:

1. `npm install` → `npm run build` → `prisma generate`
2. `prisma migrate deploy` — apply schema
3. `prisma/seed.ts` — demo users & sample project
4. `node server/dist/index.js` — serves API + React build

---

## Submission checklist

- [ ] **Live URL** — Railway public domain (update top of README)
- [x] **GitHub** — https://github.com/kartik010/team-task-manager
- [x] **README** — this file
- [ ] **Demo video** (2–5 min) covering:
  - Login as Admin and Member
  - Create a project and add a member
  - Create and assign tasks, change status
  - Dashboard (overdue + status counts)

---

## Project structure

```
team-task-manager/
├── client/                 # React frontend (Vite)
│   └── src/
│       ├── pages/          # Login, Dashboard, Projects
│       ├── context/        # Auth state
│       └── api/            # Fetch wrapper
├── server/                 # Express API
│   ├── prisma/
│   │   ├── schema.prisma   # Data model
│   │   ├── migrations/
│   │   └── seed.ts         # Demo data
│   └── src/
│       ├── routes/         # REST endpoints
│       └── middleware/     # JWT + RBAC
├── nixpacks.toml           # Railway build config
├── railway.json
└── README.md
```

---

## Data model

```
User ──┬── owns ──► Project ──► Task
       ├── member of ──► ProjectMember ◄── Project
       ├── assigned ──► Task
       └── creates ──► Task
```

**Enums:** `Role` (ADMIN, MEMBER) · `TaskStatus` (TODO, IN_PROGRESS, DONE)

---

## Environment variables

### Local (`server/.env` — copy from `.env.example`)

| Variable | Example (local) |
|----------|-------------------|
| `DATABASE_URL` | `postgresql://YOUR_USER@localhost:5432/team_task_manager` |
| `JWT_SECRET` | any string for dev |
| `PORT` | `3001` |
| `NODE_ENV` | `development` |
| `CLIENT_URL` | `http://localhost:5173` |

### Production (Railway — **do not use `.env.example` values**)

| Variable | How to set |
|----------|------------|
| `DATABASE_URL` | Auto via `railway.toml` → `${{Postgres.DATABASE_URL}}` |
| `JWT_SECRET` | **Required** — set in Railway Variables (`openssl rand -hex 32`) |
| `NODE_ENV` | `production` (in `railway.toml`) |
| `PORT` | Set automatically by Railway |
| `CLIENT_URL` | Optional — auto from `RAILWAY_PUBLIC_DOMAIN` |

See `server/.env.production.example` and [RAILWAY_SETUP.md](./RAILWAY_SETUP.md).

---

## License

MIT
