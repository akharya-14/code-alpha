const initSqlJs = require("sql.js");
const fs = require("fs");
const path = require("path");

const DB_PATH = path.join(__dirname, "urls.db");

let db;
let SQL;

async function getDb() {
  if (db) return db;

  SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Create table + indexes
  db.run(`
    CREATE TABLE IF NOT EXISTS urls (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      short_code   TEXT    NOT NULL UNIQUE,
      original_url TEXT    NOT NULL,
      clicks       INTEGER NOT NULL DEFAULT 0,
      created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_short_code    ON urls(short_code);
    CREATE INDEX IF NOT EXISTS idx_original_url  ON urls(original_url);
  `);

  save();
  return db;
}

// Persist DB to disk after every write
function save() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

module.exports = { getDb, save };
