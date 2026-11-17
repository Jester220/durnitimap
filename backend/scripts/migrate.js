// Applies every file in database/migrations once, in filename order.
// Usage (from the backend folder): npm run migrate
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
const mysql = require("mysql2/promise");

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true,
  });
  try {
    await conn.query(
      `CREATE TABLE IF NOT EXISTS schema_migrations (
         name VARCHAR(150) PRIMARY KEY,
         applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
       )`
    );
    const [rows] = await conn.query("SELECT name FROM schema_migrations");
    const done = new Set(rows.map((r) => r.name));
    const dir = path.join(__dirname, "..", "..", "database", "migrations");
    const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
    let applied = 0;
    for (const file of files) {
      if (done.has(file)) continue;
      await conn.query(fs.readFileSync(path.join(dir, file), "utf8"));
      await conn.query("INSERT INTO schema_migrations (name) VALUES (?)", [file]);
      console.log("applied:", file);
      applied++;
    }
    console.log(applied ? `Done. ${applied} migration(s) applied.` : "Database is up to date.");
  } finally {
    await conn.end();
  }
})().catch((err) => {
  console.error("Migration failed:", err.message);
  process.exit(1);
});
