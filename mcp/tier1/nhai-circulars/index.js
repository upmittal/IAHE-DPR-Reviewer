/**
 * NHAI Circular Repository MCP Server
 *
 * Provides tools to search and retrieve NHAI circulars, office memoranda,
 * and policy guidelines by topic and date.
 *
 * Environment variables:
 *   NHAI_API_KEY       — API key for NHAI Circular Repository
 *   NHAI_API_BASE_URL  — Base URL
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fetch from "node-fetch";
import * as dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.NHAI_API_KEY;
const BASE_URL = process.env.NHAI_API_BASE_URL || "https://nhai.gov.in/api/circulars/v1";

const server = new McpServer({
  name: "nhai-circulars",
  version: "1.0.0",
});

async function nhaiF(path, params = {}) {
  if (!API_KEY) return { fallback: true, note: "[VERIFY — connector offline]" };
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${API_KEY}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`NHAI API ${res.status}: ${await res.text()}`);
  return res.json();
}

server.tool(
  "search_circulars",
  "Search NHAI circulars by topic keyword and date range",
  {
    topic: z.string().describe("Search keyword, e.g. 'pavement design', 'crash barrier', 'toll plaza'"),
    date_after: z.string().optional().describe("ISO date YYYY-MM-DD — only return circulars after this date"),
    date_before: z.string().optional().describe("ISO date YYYY-MM-DD — cutoff date from CLAUDE.md nhai_circular_cutoff"),
    limit: z.number().default(10).describe("Maximum results to return"),
  },
  async ({ topic, date_after, date_before, limit }) => {
    try {
      const data = await nhaiF("/search", { q: topic, after: date_after, before: date_before, limit });
      if (data.fallback) return { content: [{ type: "text", text: JSON.stringify(data) }] };
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ topic, results: data.results, total: data.total, source: "nhai-circulars" }),
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: err.message, topic, note: "[VERIFY]" }) }],
      };
    }
  }
);

server.tool(
  "get_circular",
  "Retrieve the full content of a specific NHAI circular by ID or reference number",
  {
    circular_id: z.string().describe("NHAI circular ID or reference number"),
  },
  async ({ circular_id }) => {
    try {
      const data = await nhaiF(`/circular/${circular_id}`);
      if (data.fallback) return { content: [{ type: "text", text: JSON.stringify(data) }] };
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              id: data.id,
              reference: data.reference,
              date: data.date,
              subject: data.subject,
              summary: data.summary,
              key_provisions: data.key_provisions,
              applicable_codes: data.applicable_codes,
              supersedes: data.supersedes || null,
              source: "nhai-circulars",
            }),
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: err.message, circular_id, note: "[VERIFY]" }) }],
      };
    }
  }
);

server.tool(
  "list_recent_circulars",
  "List the most recent NHAI circulars within the past N months",
  {
    months: z.number().default(12).describe("Number of months to look back"),
    domain: z
      .string()
      .optional()
      .describe("Engineering domain filter, e.g. 'pavement', 'bridge', 'environment', 'safety'"),
  },
  async ({ months, domain }) => {
    try {
      const data = await nhaiF("/recent", { months, domain });
      if (data.fallback) return { content: [{ type: "text", text: JSON.stringify(data) }] };
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ months, domain: domain || "all", circulars: data.circulars, source: "nhai-circulars" }),
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: err.message, months, note: "[VERIFY]" }) }],
      };
    }
  }
);

server.tool(
  "check_circular_applicability",
  "Check whether specific NHAI circulars apply to the project given its cutoff date and classification",
  {
    circular_ids: z.array(z.string()).describe("Array of circular IDs to check"),
    cutoff_date: z.string().describe("Project NHAI circular cutoff date from CLAUDE.md (YYYY-MM-DD)"),
    road_type: z.string().optional(),
    execution_mode: z.string().optional().describe("EPC | HAM | BOT | Item Rate"),
  },
  async ({ circular_ids, cutoff_date, road_type, execution_mode }) => {
    try {
      const data = await nhaiF("/applicability-check", {
        ids: circular_ids.join(","),
        cutoff: cutoff_date,
        road_type,
        execution_mode,
      });
      if (data.fallback) return { content: [{ type: "text", text: JSON.stringify(data) }] };
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ results: data.results, source: "nhai-circulars" }),
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

const transport = new StdioServerTransport();
await server.connect(transport);
