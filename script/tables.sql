CREATE TABLE IF NOT EXISTS groups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  color TEXT
);
CREATE TABLE IF NOT EXISTS api_schemas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  group_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES groups (id)
);
CREATE TABLE IF NOT EXISTS schema_last_using (
  schema_id INTEGER,
  last_used_at DATETIME,
  FOREIGN KEY (schema_id) REFERENCES api_schemas (id)
);


