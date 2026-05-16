#!/usr/bin/env node
/**
 * IRC Digital Library — Ingest Script
 *
 * Reads canonical extracted/ artefacts and loads them into irc-catalog.sqlite.
 * Run after adding new PDFs via the Python extraction pipeline.
 *
 * Usage:
 *   node ingest.js --all               Ingest all extracted codes
 *   node ingest.js --code IRC_38       Ingest a single code directory
 *   node ingest.js --all --dry-run     Validate format without writing to DB
 */

import Database from "better-sqlite3";
import { readFileSync, readdirSync, existsSync, statSync } from "fs";
import { resolve, join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "../../..");
const EXTRACTED_DIR = join(PROJECT_ROOT, "reference-data/irc-pdfs/extracted");
const DB_PATH = join(PROJECT_ROOT, "reference-data/irc-pdfs/irc-catalog.sqlite");
const SCHEMA_PATH = join(__dirname, "schema.sql");

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { all: false, code: null, dryRun: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--all") opts.all = true;
    if (args[i] === "--dry-run") opts.dryRun = true;
    if (args[i] === "--code" && args[i + 1]) opts.code = args[++i];
  }
  return opts;
}

function openDb(dryRun) {
  if (dryRun) return null;
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  const schema = readFileSync(SCHEMA_PATH, "utf8");
  db.exec(schema);
  return db;
}

function readJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, "utf8"));
  } catch (err) {
    throw new Error(`Failed to parse ${filePath}: ${err.message}`);
  }
}

function readMarkdown(filePath) {
  return readFileSync(filePath, "utf8");
}

function validateIndex(index, codeDir) {
  const required = ["code", "edition_year", "clauses", "tables"];
  for (const field of required) {
    if (index[field] === undefined) {
      throw new Error(`index.json in ${codeDir} is missing required field: ${field}`);
    }
  }
  if (!Array.isArray(index.clauses)) throw new Error("index.clauses must be an array");
  if (!Array.isArray(index.tables)) throw new Error("index.tables must be an array");
}

function ingestCode(db, codeDir, dryRun) {
  const indexPath = join(codeDir, "index.json");
  if (!existsSync(indexPath)) {
    throw new Error(`No index.json found in ${codeDir}`);
  }

  const index = readJson(indexPath);
  validateIndex(index, codeDir);

  const dirName = codeDir.split("/").pop();
  const stats = { clauses: 0, tables: 0, figures: 0, updated: 0, errors: [] };

  if (!dryRun) {
    const upsertCode = db.prepare(`
      INSERT INTO irc_codes (code, full_title, edition_year, total_pages, supersedes, superseded_by, indexed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(code) DO UPDATE SET
        full_title=excluded.full_title,
        edition_year=excluded.edition_year,
        total_pages=excluded.total_pages,
        supersedes=excluded.supersedes,
        superseded_by=excluded.superseded_by,
        indexed_at=excluded.indexed_at
    `);
    upsertCode.run(
      index.code,
      index.full_title || index.code,
      index.edition_year,
      index.total_pages || null,
      index.supersedes ? JSON.stringify(index.supersedes) : null,
      index.superseded_by || null,
      new Date().toISOString()
    );
  }

  const upsertClause = dryRun ? null : db.prepare(`
    INSERT INTO irc_clauses (code, clause, title, edition_year, page, content)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(code, clause, edition_year) DO UPDATE SET
      title=excluded.title, page=excluded.page, content=excluded.content
  `);

  for (const clauseMeta of index.clauses) {
    try {
      const clauseFile = join(codeDir, clauseMeta.file || `clauses/clause_${clauseMeta.id.replace(/\./g, "_")}.md`);
      if (!existsSync(clauseFile)) {
        stats.errors.push(`Missing clause file: ${clauseFile}`);
        continue;
      }
      const raw = readMarkdown(clauseFile);
      // Strip YAML frontmatter (--- ... ---)
      const content = raw.replace(/^---[\s\S]*?---\n?/, "").trim();

      if (!dryRun) {
        const result = upsertClause.run(
          index.code, clauseMeta.id, clauseMeta.title || clauseMeta.id,
          index.edition_year, clauseMeta.page || null, content
        );
        if (result.changes > 0) stats.updated++;
      }
      stats.clauses++;
    } catch (err) {
      stats.errors.push(`Clause ${clauseMeta.id}: ${err.message}`);
    }
  }

  const upsertTable = dryRun ? null : db.prepare(`
    INSERT INTO irc_tables (code, table_id, edition_year, title, page, headers, rows, notes, cross_reference)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(code, table_id, edition_year) DO UPDATE SET
      title=excluded.title, page=excluded.page, headers=excluded.headers,
      rows=excluded.rows, notes=excluded.notes, cross_reference=excluded.cross_reference
  `);

  for (const tableMeta of index.tables) {
    try {
      const tableFile = join(codeDir, tableMeta.file || `tables/${tableMeta.id.replace(/\s+/g, "_").toLowerCase()}.json`);
      if (!existsSync(tableFile)) {
        stats.errors.push(`Missing table file: ${tableFile}`);
        continue;
      }
      const tableData = readJson(tableFile);

      if (!dryRun) {
        upsertTable.run(
          index.code, tableMeta.id || tableData.table_id,
          index.edition_year,
          tableMeta.title || tableData.title || tableMeta.id,
          tableMeta.page || tableData.page || null,
          JSON.stringify(tableData.headers || []),
          JSON.stringify(tableData.rows || []),
          tableData.notes ? JSON.stringify(tableData.notes) : null,
          tableData.cross_reference ? JSON.stringify(tableData.cross_reference) : null
        );
      }
      stats.tables++;
    } catch (err) {
      stats.errors.push(`Table ${tableMeta.id}: ${err.message}`);
    }
  }

  const upsertFigure = dryRun ? null : db.prepare(`
    INSERT INTO irc_figures (code, figure_id, edition_year, title, page, image_file, description, alt_text)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(code, figure_id, edition_year) DO UPDATE SET
      title=excluded.title, page=excluded.page, image_file=excluded.image_file,
      description=excluded.description, alt_text=excluded.alt_text
  `);

  for (const figMeta of (index.figures || [])) {
    try {
      const figFile = join(codeDir, figMeta.file || `figures/${figMeta.id.replace(/\s+/g, "_").toLowerCase()}.json`);
      if (!existsSync(figFile)) continue;
      const figData = readJson(figFile);

      if (!dryRun) {
        upsertFigure.run(
          index.code, figMeta.id, index.edition_year,
          figMeta.title || figData.title || figMeta.id,
          figMeta.page || figData.page || null,
          figData.image_file || null,
          figData.description || null,
          figData.alt_text || null
        );
      }
      stats.figures++;
    } catch (err) {
      stats.errors.push(`Figure ${figMeta.id}: ${err.message}`);
    }
  }

  return { code: index.code, edition: index.edition_year, dirName, ...stats };
}

function discoverCodeDirs() {
  if (!existsSync(EXTRACTED_DIR)) return [];
  return readdirSync(EXTRACTED_DIR)
    .map((name) => join(EXTRACTED_DIR, name))
    .filter((p) => statSync(p).isDirectory() && existsSync(join(p, "index.json")));
}

async function main() {
  const opts = parseArgs();

  if (!opts.all && !opts.code) {
    console.error("Usage: node ingest.js --all | --code IRC_38 [--dry-run]");
    process.exit(1);
  }

  const db = openDb(opts.dryRun);
  if (opts.dryRun) console.log("DRY RUN — no database writes");

  let codeDirs = [];
  if (opts.all) {
    codeDirs = discoverCodeDirs();
    if (codeDirs.length === 0) {
      console.log(`No extracted codes found in ${EXTRACTED_DIR}`);
      process.exit(0);
    }
  } else {
    const dir = join(EXTRACTED_DIR, opts.code);
    if (!existsSync(dir)) {
      console.error(`Directory not found: ${dir}`);
      process.exit(1);
    }
    codeDirs = [dir];
  }

  let totalClauses = 0, totalTables = 0, totalFigures = 0, totalErrors = 0;

  const ingestAll = opts.dryRun ? (fn) => fn() : db.transaction((fn) => fn());

  ingestAll(() => {
    for (const codeDir of codeDirs) {
      try {
        const result = ingestCode(db, codeDir, opts.dryRun);
        const updated = result.updated > 0 ? ` (${result.updated} updated)` : "";
        console.log(
          `${result.code} (${result.edition}) — ${result.clauses} clauses, ` +
          `${result.tables} tables, ${result.figures} figures ingested${updated}`
        );
        if (result.errors.length > 0) {
          result.errors.forEach((e) => console.warn(`  WARN: ${e}`));
        }
        totalClauses += result.clauses;
        totalTables += result.tables;
        totalFigures += result.figures;
        totalErrors += result.errors.length;
      } catch (err) {
        console.error(`ERROR in ${codeDir}: ${err.message}`);
        totalErrors++;
      }
    }
  });

  if (db) db.close();

  console.log(`\nTotal: ${totalClauses} clauses, ${totalTables} tables, ${totalFigures} figures`);
  if (totalErrors > 0) console.warn(`Warnings/errors: ${totalErrors}`);
  if (!opts.dryRun) console.log(`Database: ${DB_PATH}`);
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
