import { Database } from "@db/sqlite";
import { ensureDir } from "@std/fs";

await ensureDir("volume/schemas");

const dbPath = "volume/apilens.db";
const db = new Database(dbPath);

db.close();

console.log("Database initialized at", dbPath);
