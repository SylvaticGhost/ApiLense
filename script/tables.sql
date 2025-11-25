CREATE TABLE IF NOT EXISTS groups (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT
);
CREATE TABLE IF NOT EXISTS api_schemas (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT,
  file_path TEXT,
  group_id INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP,
  FOREIGN KEY (group_id) REFERENCES groups (id)
);
CREATE TABLE IF NOT EXISTS endpoints (
  schema_id INTEGER,
  name TEXT NOT NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  PRIMARY KEY (schema_id, name, method, path),
  FOREIGN KEY (schema_id) REFERENCES api_schemas (id)
);
INSERT INTO groups (id, name, color)
VALUES (0, 'Default', '#FFFFFF');
CREATE TABLE IF NOT EXISTS schema_last_using (
  schema_id INTEGER,
  last_used_at DATETIME,
  FOREIGN KEY (schema_id) REFERENCES api_schemas (id)
);
