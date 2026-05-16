/**
 * IRC Digital Library MCP Server
 *
 * Provides tools to look up IRC code clauses, parametric tables,
 * and code edition metadata for compliance review.
 *
 * Environment variables:
 *   IRC_API_KEY        — API key for the IRC Digital Library
 *   IRC_API_BASE_URL   — Base URL (default: https://api.irc.org.in/v1)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fetch from "node-fetch";
import * as dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.IRC_API_KEY;
const BASE_URL = process.env.IRC_API_BASE_URL || "https://api.irc.org.in/v1";

const server = new McpServer({
  name: "irc-digital-library",
  version: "1.0.0",
});

async function ircFetch(path, params = {}) {
  if (!API_KEY) {
    return {
      error: "IRC_API_KEY not configured",
      fallback: true,
      note: "Using training knowledge — tag citations as [VERIFY — connector offline]",
    };
  }
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${API_KEY}`, Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`IRC API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

/**
 * Look up a specific clause from an IRC code.
 * Returns: clause text, requirement values, and edition metadata.
 */
server.tool(
  "lookup_irc_clause",
  "Retrieve the text and requirement values for a specific IRC code clause",
  {
    code: z.string().describe("IRC code identifier, e.g. 'IRC:38', 'IRC:SP:84'"),
    clause: z.string().describe("Clause or section number, e.g. '3.1', 'Table 2'"),
    edition_year: z
      .number()
      .optional()
      .describe("Edition year to use; defaults to project IRC edition year in CLAUDE.md"),
  },
  async ({ code, clause, edition_year }) => {
    try {
      const data = await ircFetch("/clause", { code, clause, edition: edition_year });
      if (data.fallback) return { content: [{ type: "text", text: JSON.stringify(data) }] };
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              code,
              clause,
              edition: data.edition,
              title: data.title,
              text: data.text,
              requirements: data.requirements,
              tables: data.tables,
              superseded_by: data.superseded_by || null,
              last_verified: data.last_verified,
              source: "irc-digital-library",
            }),
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              error: err.message,
              code,
              clause,
              note: "Connector unavailable — use training knowledge and tag as [VERIFY]",
            }),
          },
        ],
      };
    }
  }
);

/**
 * Retrieve a parametric table from an IRC code (e.g. IRC:37 Table 2 — pavement crust catalogue).
 */
server.tool(
  "get_irc_parametric_table",
  "Retrieve a parametric lookup table from an IRC code for compliance checks",
  {
    code: z.string().describe("IRC code identifier"),
    table_id: z.string().describe("Table number or identifier, e.g. 'T-2', 'Table 4.1'"),
    edition_year: z.number().optional(),
  },
  async ({ code, table_id, edition_year }) => {
    try {
      const data = await ircFetch("/table", { code, table_id, edition: edition_year });
      if (data.fallback) return { content: [{ type: "text", text: JSON.stringify(data) }] };
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              code,
              table_id,
              edition: data.edition,
              title: data.title,
              headers: data.headers,
              rows: data.rows,
              notes: data.notes,
              source: "irc-digital-library",
            }),
          },
        ],
      };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: err.message, code, table_id, note: "[VERIFY]" }),
          },
        ],
      };
    }
  }
);

/**
 * List applicable IRC codes for a given road classification and terrain.
 */
server.tool(
  "list_applicable_codes",
  "Return the list of IRC codes applicable for the given road type, terrain, and configuration",
  {
    road_type: z.enum(["NH", "SH", "MDR", "ODR", "Village Road"]),
    configuration: z.enum(["2-lane", "4-lane divided", "6-lane divided", "Expressway"]),
    terrain: z.enum(["Plain", "Rolling", "Mountainous", "Steep"]),
    domain: z
      .enum([
        "geometric",
        "pavement",
        "bridge",
        "hydrology",
        "traffic",
        "safety",
        "geotechnical",
        "all",
      ])
      .default("all"),
  },
  async ({ road_type, configuration, terrain, domain }) => {
    try {
      const data = await ircFetch("/applicable-codes", {
        road_type,
        configuration,
        terrain,
        domain,
      });
      if (data.fallback) return { content: [{ type: "text", text: JSON.stringify(data) }] };
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    } catch (err) {
      const fallback = getApplicableCodesFallback(road_type, configuration);
      return { content: [{ type: "text", text: JSON.stringify({ ...fallback, note: "[VERIFY]" }) }] };
    }
  }
);

/**
 * Check whether a newer edition of an IRC code exists than the one cited.
 */
server.tool(
  "check_code_edition",
  "Verify if the cited IRC code edition is current or if a newer edition exists",
  {
    code: z.string().describe("IRC code identifier"),
    cited_edition_year: z.number().describe("Edition year cited in the DPR"),
  },
  async ({ code, cited_edition_year }) => {
    try {
      const data = await ircFetch("/edition-check", { code, cited_year: cited_edition_year });
      if (data.fallback) return { content: [{ type: "text", text: JSON.stringify(data) }] };
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              code,
              cited_edition: cited_edition_year,
              current_edition: data.current_edition,
              is_current: data.is_current,
              newer_edition: data.newer_edition || null,
              key_changes: data.key_changes || [],
              source: "irc-digital-library",
            }),
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: err.message, note: "[VERIFY]" }) }],
      };
    }
  }
);

/**
 * Retrieve a standard cross-section template for dimensional overlay comparisons.
 */
server.tool(
  "get_cross_section_template",
  "Return standard cross-section dimensions for a given road configuration (used by drawing-reviewer)",
  {
    configuration: z.enum(["2-lane-NH", "4-lane-NH", "6-lane-NH", "Expressway-8lane"]),
    terrain: z.enum(["Plain", "Rolling", "Mountainous", "Steep"]).default("Plain"),
  },
  async ({ configuration, terrain }) => {
    const templates = {
      "2-lane-NH": {
        formation_width_m: 12.0,
        carriageway_m: 7.0,
        paved_shoulder_m: 1.5,
        earthen_shoulder_m: 1.0,
        median_m: null,
        side_slope_fill: "2:1",
        source: "IRC:SP:73:2015",
      },
      "4-lane-NH": {
        formation_width_m: 26.5,
        carriageway_each_m: 7.0,
        paved_shoulder_outer_m: 1.5,
        earthen_shoulder_outer_m: 1.0,
        paved_shoulder_inner_m: 1.0,
        median_m: 5.0,
        side_slope_fill: "2:1",
        source: "IRC:SP:84:2014",
      },
      "6-lane-NH": {
        formation_width_m: 35.0,
        carriageway_each_m: 10.5,
        paved_shoulder_outer_m: 3.0,
        earthen_shoulder_outer_m: 1.5,
        median_m: 12.0,
        side_slope_fill: "2:1",
        source: "IRC:SP:87:2013",
      },
      "Expressway-8lane": {
        formation_width_m: 45.0,
        carriageway_each_m: 15.0,
        paved_shoulder_outer_m: 3.0,
        earthen_shoulder_outer_m: 0.5,
        median_m: 12.0,
        side_slope_fill: "2:1",
        source: "IRC:SP:99:2016",
      },
    };
    const template = templates[configuration];
    if (!template) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: "Template not found", configuration }) }],
      };
    }
    return { content: [{ type: "text", text: JSON.stringify({ configuration, terrain, ...template }) }] };
  }
);

function getApplicableCodesFallback(road_type, configuration) {
  return {
    road_type,
    configuration,
    codes: {
      geometric: ["IRC:38", "IRC:52", "IRC:SP:23", "IRC:SP:84"],
      pavement: ["IRC:37", "IRC:58"],
      bridge: ["IRC:5", "IRC:6", "IRC:78", "IRC:112"],
      safety: ["IRC:35", "IRC:67", "IRC:119"],
      traffic: ["IRC:106", "IRC:108"],
      geotechnical: ["IRC:SP:19", "IS:1498", "IS:2720"],
    },
  };
}

const transport = new StdioServerTransport();
await server.connect(transport);
