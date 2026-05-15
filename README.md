# Team Task Manager

Full-stack web app for creating projects, assigning tasks, and tracking progress with **Admin** and **Member** role-based access control.

Built with **Express + PostgreSQL + Prisma** (backend) and **React + Vite + Tailwind** (frontend). Authentication uses **JWT + bcrypt** — no Clerk or Supabase.

## Features

- **Authentication** — Sign up and log in
- **RBAC** — Admin vs Member permissions
- **Projects** — Create projects, add/remove team members (Admin)
- **Tasks** — Create, assign, update status, due dates
- **Dashboard** — Task counts by status, overdue tasks, assigned work

## Tech stack

| Layer | Technology |
|-------|------------|
| API | Express 5, REST |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT, bcryptjs |
| Frontend | React 19, React Router, Tailwind CSS 4 |
| Validation | Zod |

## Quick start (local)

### Prerequisites

- Node.js 20+
- PostgreSQL (local or Docker)

### 1. Database

```bash
docker run --name ttm-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=team_task_manager -p 5432:5432 -d postgres:16
```

### 2. Environment

```bash
cp server/.env.example server/.env
```

Edit `server/.env` if needed. Default `DATABASE_URL`:

```
postgresql://postgres:postgres@localhost:5432/team_task_manager
```

### 3. Install & migrate

```bash
npm install
cd server && npx prisma migrate deploy && npm run db:seed
```

### 4. Run

```bash
npm run dev
```

- Frontend: http://localhost:5173  
- API: http://localhost:3001  

### Demo accounts (after seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | password123 |
| Member | member@example.com | password123 |

## API overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project (Admin) |
| GET | `/api/projects/:id` | Project detail + tasks |
| POST | `/api/projects/:id/members` | Add member (Admin) |
| GET | `/api/tasks/project/:projectId` | List tasks |
| POST | `/api/tasks/project/:projectId` | Create task |
| PATCH | `/api/tasks/:id` | Update task |
| GET | `/api/dashboard` | Dashboard stats |

All protected routes require `Authorization: Bearer <token>`.

## RBAC

| Action | Admin | Member |
|--------|-------|--------|
| Create/delete projects | Yes | No |
| Add/remove members | Yes | No |
| View own projects | Yes | Yes |
| Create tasks | Yes | Yes (in member projects) |
| Update task status | Yes | Yes (assigned or project member) |
| Edit task details / delete | Yes | No |

## Deploy on Railway

1. Push this repo to GitHub.
2. Create a [Railway](https://railway.app) project → **Deploy from GitHub**.
3. Add a **PostgreSQL** plugin; Railway sets `DATABASE_URL` automatically.
4. Set environment variables on the web service:
   - `JWT_SECRET` — long random string
   - `NODE_ENV` — `production`
   - `CLIENT_URL` — your Railway app URL (e.g. `https://your-app.up.railway.app`)
5. Deploy. The start command runs migrations, seeds demo data, and serves API + frontend.

### Build / start (configured in `nixpacks.toml`)

- **Build:** `npm run build` + `prisma generate`
- **Start:** migrate → seed → `node server/dist/index.js`

## Submission checklist

- [ ] Live Railway URL
- [ ] GitHub repository link
- [ ] This README
- [ ] 2–5 minute demo video (signup, projects, tasks, dashboard, admin vs member)

## Project structure

```
├── client/          React frontend
├── server/          Express API + Prisma
│   └── prisma/      Schema, migrations, seed
├── package.json     Root scripts
└── README.md
```

## License

MIT
