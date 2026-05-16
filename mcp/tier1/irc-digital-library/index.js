/**
 * IRC Digital Library MCP Server — PDF-backed local knowledge store
 *
 * Data source priority:
 *   1. SQLite (irc-catalog.sqlite) — populated by ingest.js after PDF extraction
 *   2. reference-data/irc-index.json — parametric fallback (embedded)
 *   3. Training knowledge — last resort, tagged [VERIFY]
 *
 * No external API required. Run ingest.js after extracting IRC PDFs to
 * unlock HIGH-confidence responses.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import Database from "better-sqlite3";
import { readFileSync, existsSync } from "fs";
import { resolve, join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "../../..");
const DB_PATH = join(PROJECT_ROOT, "reference-data/irc-pdfs/irc-catalog.sqlite");
const IRC_INDEX_PATH = join(PROJECT_ROOT, "reference-data/irc-index.json");

// Open SQLite (graceful no-op if DB not yet created)
let db = null;
if (existsSync(DB_PATH)) {
  try {
    db = new Database(DB_PATH, { readonly: true });
  } catch {
    db = null;
  }
}

// Load parametric fallback index
let ircIndex = {};
try {
  ircIndex = JSON.parse(readFileSync(IRC_INDEX_PATH, "utf8")).codes || {};
} catch {
  ircIndex = {};
}

const server = new McpServer({
  name: "irc-digital-library",
  version: "2.0.0",
});

function dbClause(code, clause, edition_year) {
  if (!db) return null;
  try {
    const row = db.prepare(`
      SELECT c.*, cd.superseded_by, cd.full_title as code_title
      FROM irc_clauses c
      LEFT JOIN irc_codes cd ON cd.code = c.code
      WHERE c.code = ?
        AND c.clause = ?
        ${edition_year ? "AND c.edition_year = ?" : ""}
      ORDER BY c.edition_year DESC LIMIT 1
    `).get(...(edition_year ? [code, clause, edition_year] : [code, clause]));
    return row || null;
  } catch {
    return null;
  }
}

function dbTable(code, table_id, edition_year) {
  if (!db) return null;
  try {
    const row = db.prepare(`
      SELECT * FROM irc_tables
      WHERE code = ?
        AND (table_id = ? OR table_id = ? OR table_id = ?)
        ${edition_year ? "AND edition_year = ?" : ""}
      ORDER BY edition_year DESC LIMIT 1
    `).get(
      code, table_id, table_id.replace(/^Table\s*/i, ""), `Table ${table_id}`,
      ...(edition_year ? [edition_year] : [])
    );
    return row || null;
  } catch {
    return null;
  }
}

function dbFigure(code, figure_id, edition_year) {
  if (!db) return null;
  try {
    const row = db.prepare(`
      SELECT * FROM irc_figures
      WHERE code = ?
        AND (figure_id = ? OR figure_id = ? OR figure_id = ?)
        ${edition_year ? "AND edition_year = ?" : ""}
      ORDER BY edition_year DESC LIMIT 1
    `).get(
      code, figure_id, figure_id.replace(/^Fig\.\s*/i, ""), `Fig. ${figure_id}`,
      ...(edition_year ? [edition_year] : [])
    );
    return row || null;
  } catch {
    return null;
  }
}

function dbSearch(query, limit = 5) {
  if (!db) return [];
  try {
    // Put irc_clauses first to avoid FTS5 column-name ambiguity in JOIN
    return db.prepare(`
      SELECT c.code, c.clause, c.title, c.edition_year,
             snippet(irc_fts, 3, '', '', '...', 32) AS snippet,
             irc_fts.rank
      FROM irc_clauses AS c
      INNER JOIN irc_fts ON irc_fts.rowid = c.id
      WHERE irc_fts MATCH ?
      ORDER BY irc_fts.rank LIMIT ?
    `).all(query, limit);
  } catch {
    return [];
  }
}

function indexFallback(code) {
  return ircIndex[code] || null;
}

server.tool(
  "lookup_irc_clause",
  "Retrieve the text and requirement values for a specific IRC code clause",
  {
    code: z.string().describe("IRC code identifier, e.g. 'IRC:38', 'IRC:SP:84'"),
    clause: z.string().describe("Clause or section number, e.g. '4.1', 'Table 2'"),
    edition_year: z.number().optional().describe("Edition year; defaults to latest ingested"),
  },
  ({ code, clause, edition_year }) => {
    const row = dbClause(code, clause, edition_year);
    if (row) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            code,
            clause,
            edition: row.edition_year,
            title: row.title,
            text: row.content,
            requirements: [],
            tables: [],
            superseded_by: row.superseded_by || null,
            last_verified: new Date().toISOString().slice(0, 10),
            source: "local-pdf-extract",
            confidence: "HIGH",
            page: row.page || null,
          }),
        }],
      };
    }

    const fallbackCode = indexFallback(code);
    if (fallbackCode) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            code,
            clause,
            edition: fallbackCode.latest_edition || null,
            title: `${code} — parametric reference`,
            text: null,
            requirements: [],
            tables: [],
            key_parameters: fallbackCode.key_parameters || {},
            superseded_by: null,
            source: "embedded-reference",
            confidence: "MEDIUM",
            note: "Parametric reference only — ingest PDF via extract_irc.py for full clause text",
          }),
        }],
      };
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          code,
          clause,
          edition: null,
          title: null,
          text: null,
          source: "training-knowledge",
          confidence: "LOW",
          note: "[VERIFY — local PDF not ingested; verify against current code edition]",
        }),
      }],
    };
  }
);

server.tool(
  "get_irc_parametric_table",
  "Retrieve a parametric lookup table from an IRC code for compliance checks",
  {
    code: z.string().describe("IRC code identifier"),
    table_id: z.string().describe("Table number or identifier, e.g. 'Table 1', 'T-2'"),
    edition_year: z.number().optional(),
  },
  ({ code, table_id, edition_year }) => {
    const row = dbTable(code, table_id, edition_year);
    if (row) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            code,
            table_id: row.table_id,
            edition: row.edition_year,
            title: row.title,
            headers: JSON.parse(row.headers),
            rows: JSON.parse(row.rows),
            notes: row.notes ? JSON.parse(row.notes) : [],
            cross_reference: row.cross_reference ? JSON.parse(row.cross_reference) : [],
            source: "local-pdf-extract",
            confidence: "HIGH",
            page: row.page || null,
          }),
        }],
      };
    }

    const fallbackCode = indexFallback(code);
    if (fallbackCode) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            code,
            table_id,
            edition: fallbackCode.latest_edition || null,
            title: null,
            headers: [],
            rows: [],
            key_parameters: fallbackCode.key_parameters || {},
            source: "embedded-reference",
            confidence: "MEDIUM",
            note: "Parametric reference only — ingest PDF for full table",
          }),
        }],
      };
    }

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          code,
          table_id,
          headers: [],
          rows: [],
          source: "training-knowledge",
          confidence: "LOW",
          note: "[VERIFY — local PDF not ingested]",
        }),
      }],
    };
  }
);

server.tool(
  "list_applicable_codes",
  "Return the list of IRC codes applicable for the given road type, terrain, and configuration",
  {
    road_type: z.enum(["NH", "SH", "MDR", "ODR", "Village Road"]),
    configuration: z.enum(["2-lane", "4-lane divided", "6-lane divided", "Expressway"]),
    terrain: z.enum(["Plain", "Rolling", "Mountainous", "Steep"]),
    domain: z.enum(["geometric", "pavement", "bridge", "hydrology", "traffic", "safety", "geotechnical", "all"]).default("all"),
  },
  ({ road_type, configuration, terrain, domain }) => {
    const codes = getApplicableCodes(road_type, configuration);
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          road_type, configuration, terrain, domain,
          codes: domain === "all" ? codes : { [domain]: codes[domain] || [] },
          source: "embedded-reference",
        }),
      }],
    };
  }
);

server.tool(
  "check_code_edition",
  "Verify if the cited IRC code edition is current or if a newer edition exists",
  {
    code: z.string().describe("IRC code identifier"),
    cited_edition_year: z.number().describe("Edition year cited in the DPR"),
  },
  ({ code, cited_edition_year }) => {
    let currentEdition = null;
    let supersededBy = null;

    if (db) {
      try {
        const row = db.prepare(
          "SELECT edition_year, superseded_by FROM irc_codes WHERE code = ? ORDER BY edition_year DESC LIMIT 1"
        ).get(code);
        if (row) {
          currentEdition = row.edition_year;
          supersededBy = row.superseded_by;
        }
      } catch { /* ignore */ }
    }

    if (!currentEdition) {
      const fallback = indexFallback(code);
      if (fallback) currentEdition = fallback.latest_edition;
    }

    const isCurrent = currentEdition ? cited_edition_year >= currentEdition : null;
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          code,
          cited_edition: cited_edition_year,
          current_edition: currentEdition,
          is_current: isCurrent,
          newer_edition: (!isCurrent && currentEdition) ? `${code}:${currentEdition}` : null,
          superseded_by: supersededBy || null,
          key_changes: [],
          source: currentEdition ? (db ? "local-pdf-extract" : "embedded-reference") : "training-knowledge",
          note: currentEdition ? null : "[VERIFY — edition data not available; check irc.org.in]",
        }),
      }],
    };
  }
);

server.tool(
  "get_cross_section_template",
  "Return standard cross-section dimensions for a given road configuration (used by drawing-reviewer)",
  {
    configuration: z.enum(["2-lane-NH", "4-lane-NH", "6-lane-NH", "Expressway-8lane"]),
    terrain: z.enum(["Plain", "Rolling", "Mountainous", "Steep"]).default("Plain"),
  },
  ({ configuration, terrain }) => {
    const templates = {
      "2-lane-NH": {
        formation_width_m: 12.0,
        carriageway_m: 7.0,
        paved_shoulder_m: 1.5,
        earthen_shoulder_m: 1.0,
        median_m: null,
        side_slope_fill: "2:1",
        row_min_m: 30,
        code_reference: "IRC:SP:73:2015, Table 1",
      },
      "4-lane-NH": {
        formation_width_m: 26.5,
        carriageway_each_m: 7.0,
        paved_shoulder_outer_m: 1.5,
        earthen_shoulder_outer_m: 1.0,
        paved_shoulder_inner_m: 1.0,
        raised_median_m: 5.0,
        side_slope_fill: "2:1",
        row_min_m: 60,
        code_reference: "IRC:SP:84:2014, Table 2",
      },
      "6-lane-NH": {
        formation_width_m: 35.0,
        carriageway_each_m: 10.5,
        paved_shoulder_outer_m: 3.0,
        earthen_shoulder_outer_m: 1.5,
        raised_median_m: 12.0,
        side_slope_fill: "2:1",
        row_min_m: 60,
        code_reference: "IRC:SP:87:2013",
      },
      "Expressway-8lane": {
        formation_width_m: 45.0,
        carriageway_each_m: 15.0,
        paved_shoulder_outer_m: 3.0,
        earthen_shoulder_outer_m: 0.5,
        raised_median_m: 12.0,
        side_slope_fill: "2:1",
        row_min_m: 90,
        code_reference: "IRC:SP:99:2016",
      },
    };
    const template = templates[configuration];
    if (!template) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: "Template not found", configuration }) }],
      };
    }
    return {
      content: [{
        type: "text",
        text: JSON.stringify({ configuration, terrain, ...template, source: "embedded-reference" }),
      }],
    };
  }
);

server.tool(
  "get_irc_figure",
  "Retrieve figure metadata and image path for an IRC code diagram (requires Phase 2 figure extraction)",
  {
    code: z.string().describe("IRC code identifier"),
    figure_id: z.string().describe("Figure identifier, e.g. 'Fig. 3', 'Figure 5'"),
    edition_year: z.number().optional(),
  },
  ({ code, figure_id, edition_year }) => {
    const row = dbFigure(code, figure_id, edition_year);
    if (row) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            code,
            figure_id: row.figure_id,
            edition: row.edition_year,
            title: row.title,
            description: row.description || null,
            alt_text: row.alt_text || null,
            image_file: row.image_file
              ? join(PROJECT_ROOT, "reference-data/irc-pdfs/extracted", code.replace(":", "_"), row.image_file)
              : null,
            source: "local-pdf-extract",
            confidence: "HIGH",
            page: row.page || null,
          }),
        }],
      };
    }
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          code, figure_id,
          source: "not-available",
          note: "Figure not ingested. Run extract_irc.py --figures then ingest.js to enable figure lookup.",
        }),
      }],
    };
  }
);

server.tool(
  "search_irc_text",
  "Full-text search across all ingested IRC clause text (requires at least one code to be ingested)",
  {
    query: z.string().describe("Search terms, e.g. 'minimum vertical clearance HFL bridge'"),
    limit: z.number().optional().default(5).describe("Maximum number of results (default 5)"),
  },
  ({ query, limit }) => {
    const results = dbSearch(query, limit);
    if (results.length === 0) {
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            query,
            results: [],
            total_results: 0,
            note: db
              ? "No matching clauses found. Try different keywords."
              : "No IRC codes ingested yet. Run extract_irc.py then ingest.js first.",
            source: "sqlite-fts5",
          }),
        }],
      };
    }
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          query,
          results: results.map((r) => ({
            code: r.code,
            clause: r.clause,
            title: r.title,
            edition: r.edition_year,
            snippet: r.snippet,
            source: "local-pdf-extract",
          })),
          total_results: results.length,
          source: "sqlite-fts5",
        }),
      }],
    };
  }
);

function getApplicableCodes(road_type, configuration) {
  const base = {
    geometric: ["IRC:38", "IRC:52", "IRC:SP:23"],
    pavement: ["IRC:37", "IRC:58"],
    bridge: ["IRC:5", "IRC:6", "IRC:78", "IRC:112"],
    hydrology: ["IRC:SP:13"],
    traffic: ["IRC:106", "IRC:108"],
    safety: ["IRC:35", "IRC:67", "IRC:119"],
    geotechnical: ["IRC:SP:19", "IS:1498", "IS:2720"],
    environmental: [],
  };
  if (configuration === "4-lane divided") {
    base.geometric.push("IRC:SP:84");
  } else if (configuration === "6-lane divided") {
    base.geometric.push("IRC:SP:87");
  } else if (configuration === "Expressway") {
    base.geometric.push("IRC:SP:99");
  } else if (configuration === "2-lane") {
    base.geometric.push("IRC:SP:73");
  }
  return base;
}

const transport = new StdioServerTransport();
await server.connect(transport);
