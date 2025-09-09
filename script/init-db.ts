import { ensureDir } from "ensureDir";
import { DB as Sqlite3DB } from "Sqlite3DB";

// Create volume and schemas folders
await ensureDir("volume/schemas");

// Create SQLite DB file in volume folder
const dbPath = "volume/apilens.db";
const db = new Sqlite3DB(dbPath);

db.close();

console.log("Database initialized at", dbPath);
