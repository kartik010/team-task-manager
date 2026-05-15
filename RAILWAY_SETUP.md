# Railway setup — fix empty DATABASE_URL

## Quick fix (most common)

1. On your Railway project canvas, click the **PostgreSQL** service.
2. Open **Settings** → set **Service name** to exactly: **`Postgres`** (capital P, rest lowercase).
3. Ensure you have two services: **Postgres** (database) + **team-task-manager** (web app from GitHub).
4. On the **web app** service → **Settings** → confirm **Config file** is `railway.toml` (repo root).
5. **Redeploy** the web service.

This repo’s `railway.toml` wires the database automatically:

```toml
DATABASE_URL = "${{Postgres.DATABASE_URL}}"
```

The name **`Postgres`** must match your PostgreSQL service name **exactly** (case-sensitive).

---

## If your Postgres service has a different name

Example: service is named `PostgreSQL` or `team-task-manager-db`

Edit `railway.toml` and replace every `Postgres` with your exact name:

```toml
DATABASE_URL = "${{PostgreSQL.DATABASE_URL}}"
PGHOST = "${{PostgreSQL.PGHOST}}"
# ... etc
```

Commit, push, redeploy.

---

## Manual fallback (when references never work)

1. Open **Postgres** service → **Variables** → copy the full **`DATABASE_URL`** value.
2. Open **web app** service → **Variables** → **Raw Editor** add:
   ```
   DATABASE_URL=postgresql://postgres:xxxx@xxxx.railway.internal:5432/railway
   NODE_ENV=production
   JWT_SECRET=your-long-random-secret
   ```
3. Use a **plain pasted value**, not `${{...}}` syntax.
4. Redeploy.

---

## Required web service variables

| Variable | How to set |
|----------|------------|
| `DATABASE_URL` | Auto via `railway.toml` OR paste manually |
| `NODE_ENV` | `production` (in railway.toml) |
| `JWT_SECRET` | Generate: `openssl rand -hex 32` |

---

## Verify deploy logs

Success looks like:

```
→ Running migrations...
→ Seeding demo data...
→ Starting server on port 8080...
```

Login: `admin@example.com` / `password123`
