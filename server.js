const express = require("express");
const cors = require("cors");
const path = require("path");
const { nanoid } = require("nanoid");
const { getDb, save } = require("./db");

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Helper: run a SELECT and return all rows as objects
function queryAll(db, sql, params = []) {
  const stmt = db.prepare(sql);
  const rows = [];
  stmt.bind(params);
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

// Helper: run a SELECT and return first row or null
function queryOne(db, sql, params = []) {
  const rows = queryAll(db, sql, params);
  return rows[0] || null;
}

// ─── POST /api/shorten ───────────────────────────────────────────────────────
app.post("/api/shorten", async (req, res) => {
  const { url } = req.body;

  if (!url || !url.trim())
    return res.status(400).json({ error: "URL is required." });

  try { new URL(url); }
  catch { return res.status(400).json({ error: "Invalid URL. Please include http:// or https://" }); }

  const db = await getDb();

  // Return existing code if URL already shortened
  const existing = queryOne(db, "SELECT * FROM urls WHERE original_url = ?", [url.trim()]);
  if (existing) {
    return res.json({
      shortCode: existing.short_code,
      shortUrl: `${BASE_URL}/${existing.short_code}`,
      originalUrl: existing.original_url,
      clicks: existing.clicks,
      createdAt: existing.created_at,
    });
  }

  // Generate unique 6-char code
  let shortCode;
  do {
    shortCode = nanoid(6);
  } while (queryOne(db, "SELECT id FROM urls WHERE short_code = ?", [shortCode]));

  db.run("INSERT INTO urls (short_code, original_url) VALUES (?, ?)", [shortCode, url.trim()]);
  save();

  const record = queryOne(db, "SELECT * FROM urls WHERE short_code = ?", [shortCode]);

  return res.status(201).json({
    shortCode,
    shortUrl: `${BASE_URL}/${shortCode}`,
    originalUrl: url.trim(),
    clicks: 0,
    createdAt: record.created_at,
  });
});

// ─── GET /api/urls ───────────────────────────────────────────────────────────
app.get("/api/urls", async (req, res) => {
  const db = await getDb();
  const rows = queryAll(db, "SELECT * FROM urls ORDER BY id DESC LIMIT 50");
  res.json(rows.map(r => ({
    shortCode: r.short_code,
    shortUrl: `${BASE_URL}/${r.short_code}`,
    originalUrl: r.original_url,
    clicks: r.clicks,
    createdAt: r.created_at,
  })));
});

// ─── GET /api/urls/:code ─────────────────────────────────────────────────────
app.get("/api/urls/:code", async (req, res) => {
  const db = await getDb();
  const record = queryOne(db, "SELECT * FROM urls WHERE short_code = ?", [req.params.code]);
  if (!record) return res.status(404).json({ error: "Short URL not found." });
  res.json({
    shortCode: record.short_code,
    shortUrl: `${BASE_URL}/${record.short_code}`,
    originalUrl: record.original_url,
    clicks: record.clicks,
    createdAt: record.created_at,
  });
});

// ─── DELETE /api/urls/:code ──────────────────────────────────────────────────
app.delete("/api/urls/:code", async (req, res) => {
  const db = await getDb();
  const before = queryOne(db, "SELECT id FROM urls WHERE short_code = ?", [req.params.code]);
  if (!before) return res.status(404).json({ error: "Short URL not found." });
  db.run("DELETE FROM urls WHERE short_code = ?", [req.params.code]);
  save();
  res.json({ message: "Deleted successfully." });
});

// ─── GET /:code — redirect (must be last) ────────────────────────────────────
app.get("/:code", async (req, res) => {
  const db = await getDb();
  const record = queryOne(db, "SELECT * FROM urls WHERE short_code = ?", [req.params.code]);
  if (!record) return res.status(404).sendFile(path.join(__dirname, "public", "index.html"));

  db.run("UPDATE urls SET clicks = clicks + 1 WHERE short_code = ?", [req.params.code]);
  save();

  return res.redirect(301, record.original_url);
});

app.listen(PORT, () => {
  console.log(`\n🚀 URL Shortener running at ${BASE_URL}`);
  console.log(`   Frontend : ${BASE_URL}`);
  console.log(`   API      : ${BASE_URL}/api/shorten`);
  console.log(`   Press Ctrl+C to stop\n`);
});
