# Matsu Matcha Dashboard - Setup Guide

## Step-by-Step Setup

### Step 1: Install MySQL

You need MySQL running on your machine. Choose one option:

**Option A: Homebrew (Mac)**
```bash
brew install mysql
brew services start mysql
```

**Option B: Docker**
```bash
docker run -d --name manus-mysql \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=manus_ai \
  -p 3306:3306 \
  mysql:8
```

**Option C: Download MySQL** from https://dev.mysql.com/downloads/mysql/

---

### Step 2: Create the database

**If using Homebrew or installed MySQL:**
```bash
mysql -u root -p
# In MySQL prompt:
CREATE DATABASE manus_ai;
EXIT;
```

**If using Docker:** The database `manus_ai` is already created.

---

### Step 3: Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set your `DATABASE_URL`:

```env
DATABASE_URL=mysql://root:YOUR_PASSWORD@localhost:3306/manus_ai
```

- Replace `YOUR_PASSWORD` with your MySQL root password
- If no password: `mysql://root@localhost:3306/manus_ai`
- If using Docker: `mysql://root:password@127.0.0.1:3306/manus_ai`

---

### Step 4: Run migrations (create tables)

```bash
npm run db:push
```

Or with npx:
```bash
npx drizzle-kit push
```

---

### Step 5: Seed demo data (optional but recommended)

```bash
node seed-data.mjs
```

This creates sample suppliers, products, clients, and transactions.

---

### Step 6: Install dependencies & run

```bash
npm install --legacy-peer-deps
npm run dev
```

---

### Step 7: Open in browser

Go to **http://localhost:3000**

You'll see the landing page. The full dashboard requires auth to be configured (see .env for optional auth vars).

---

## Quick Reference

| Step | Command |
|------|---------|
| Start MySQL (Homebrew) | `brew services start mysql` |
| Create DB | `mysql -u root -p` then `CREATE DATABASE manus_ai;` |
| Copy env | `cp .env.example .env` |
| Edit env | Set `DATABASE_URL` in `.env` |
| Create tables | `npm run db:push` |
| Seed data | `node seed-data.mjs` |
| Run app | `npm run dev` |

---

## Troubleshooting

**"DATABASE_URL is required"**  
→ Create `.env` file with `DATABASE_URL=...`

**"connect ECONNREFUSED"**  
→ MySQL isn't running. Start it: `brew services start mysql` or `docker start manus-mysql`

**"Access denied for user"**  
→ Wrong password in DATABASE_URL. Check your MySQL password.

**"Unknown database 'manus_ai'"**  
→ Create the database: `mysql -u root -p -e "CREATE DATABASE manus_ai;"`
