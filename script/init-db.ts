import { Database } from '@db/sqlite';
import { ensureDir } from '@std/fs';

await ensureDir('volume/schemas');

const dbPath = 'volume/apilens.db';
const db = new Database(dbPath);

const decoder = new TextDecoder('utf-8');
const sqlScripts = decoder.decode(Deno.readFileSync('./script/tables.sql'));
db.run(sqlScripts);

db.close();

console.log('Database initialized at', dbPath);
