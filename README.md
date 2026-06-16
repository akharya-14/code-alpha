# ⚡ URL Shortener — Express + SQLite

A full-stack URL shortener with a REST API and a clean frontend UI.

---

## 🗂️ Project Structure

```
url-shortener/
├── server.js          # Express server + all API routes
├── db.js              # SQLite setup (auto-creates urls.db)
├── public/
│   └── index.html     # Frontend UI
├── package.json
├── .env.example
└── .gitignore
```

---

## 🚀 Setup on Your Laptop

### Prerequisites
- Node.js v18+ → https://nodejs.org
- npm (comes with Node)

### Steps

```bash
# 1. Go into the project folder
cd url-shortener

# 2. Install dependencies
npm install

# 3. (Optional) Create .env file for custom port/domain
cp .env.example .env

# 4. Start the server
npm start

# OR for auto-restart on file changes (dev mode):
npm run dev
```

Open your browser at: **http://localhost:3000**

---

## 📡 API Reference

### POST `/api/shorten`
Shorten a URL.

**Request Body:**
```json
{ "url": "https://www.example.com/very/long/path" }
```

**Response:**
```json
{
  "shortCode": "aB3xYz",
  "shortUrl":  "http://localhost:3000/aB3xYz",
  "originalUrl": "https://www.example.com/very/long/path",
  "clicks": 0,
  "createdAt": "2024-06-14 10:30:00"
}
```

---

### GET `/:code`
Redirects to the original URL and increments click count.

---

### GET `/api/urls`
Returns list of all shortened URLs (most recent first, limit 50).

---

### GET `/api/urls/:code`
Returns stats for a single short code.

---

### DELETE `/api/urls/:code`
Deletes a short URL.

---

## 🗄️ Database

SQLite file `urls.db` is auto-created in the project root on first run.

**Schema:**
```sql
CREATE TABLE urls (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  short_code   TEXT    NOT NULL UNIQUE,
  original_url TEXT    NOT NULL,
  clicks       INTEGER NOT NULL DEFAULT 0,
  created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
);
```

---

## 🌐 Deploying (Optional)

Set `BASE_URL` in `.env` to your actual domain:
```
BASE_URL=https://yourdomain.com
```

Then deploy to Railway, Render, or any Node.js host.
