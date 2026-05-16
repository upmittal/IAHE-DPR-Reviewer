CREATE TABLE IF NOT EXISTS irc_codes (
  code          TEXT PRIMARY KEY,
  full_title    TEXT NOT NULL,
  edition_year  INTEGER NOT NULL,
  total_pages   INTEGER,
  supersedes    TEXT,
  superseded_by TEXT,
  indexed_at    TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS irc_clauses (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  code         TEXT NOT NULL,
  clause       TEXT NOT NULL,
  title        TEXT NOT NULL,
  edition_year INTEGER NOT NULL,
  page         INTEGER,
  content      TEXT NOT NULL,
  UNIQUE(code, clause, edition_year)
);

CREATE TABLE IF NOT EXISTS irc_tables (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  code          TEXT NOT NULL,
  table_id      TEXT NOT NULL,
  edition_year  INTEGER NOT NULL,
  title         TEXT NOT NULL,
  page          INTEGER,
  headers       TEXT NOT NULL,
  rows          TEXT NOT NULL,
  notes         TEXT,
  cross_reference TEXT,
  UNIQUE(code, table_id, edition_year)
);

CREATE TABLE IF NOT EXISTS irc_figures (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  code         TEXT NOT NULL,
  figure_id    TEXT NOT NULL,
  edition_year INTEGER NOT NULL,
  title        TEXT NOT NULL,
  page         INTEGER,
  image_file   TEXT,
  description  TEXT,
  alt_text     TEXT,
  UNIQUE(code, figure_id, edition_year)
);

CREATE VIRTUAL TABLE IF NOT EXISTS irc_fts USING fts5(
  code,
  clause,
  title,
  content,
  content='irc_clauses',
  content_rowid='id'
);

CREATE TRIGGER IF NOT EXISTS irc_clauses_ai AFTER INSERT ON irc_clauses BEGIN
  INSERT INTO irc_fts(rowid, code, clause, title, content)
    VALUES (new.id, new.code, new.clause, new.title, new.content);
END;

CREATE TRIGGER IF NOT EXISTS irc_clauses_au AFTER UPDATE ON irc_clauses BEGIN
  INSERT INTO irc_fts(irc_fts, rowid, code, clause, title, content)
    VALUES ('delete', old.id, old.code, old.clause, old.title, old.content);
  INSERT INTO irc_fts(rowid, code, clause, title, content)
    VALUES (new.id, new.code, new.clause, new.title, new.content);
END;

CREATE INDEX IF NOT EXISTS idx_clauses_code ON irc_clauses(code);
CREATE INDEX IF NOT EXISTS idx_tables_code  ON irc_tables(code);
CREATE INDEX IF NOT EXISTS idx_figures_code ON irc_figures(code);
