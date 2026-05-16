/**
 * MoRTH Specifications Database MCP Server
 *
 * Provides tools to look up MoRTH Specifications for Road and Bridge Works
 * (5th Revision) clause requirements, material specifications, and test frequencies.
 *
 * Environment variables:
 *   MORTH_API_KEY       — API key for MoRTH Specs DB
 *   MORTH_API_BASE_URL  — Base URL
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fetch from "node-fetch";
import * as dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.MORTH_API_KEY;
const BASE_URL = process.env.MORTH_API_BASE_URL || "https://morth.nic.in/api/specs/v1";

const server = new McpServer({
  name: "morth-specs-db",
  version: "1.0.0",
});

async function morthFetch(path, params = {}) {
  if (!API_KEY) {
    return { fallback: true, note: "[VERIFY — connector offline]" };
  }
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${API_KEY}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`MoRTH API ${res.status}: ${await res.text()}`);
  return res.json();
}

server.tool(
  "lookup_morth_clause",
  "Retrieve the text and requirements for a MoRTH Specifications clause (5th Revision)",
  {
    section: z
      .string()
      .describe("MoRTH Section number, e.g. '300', '900', '1100'"),
    clause: z
      .string()
      .describe("Clause number within the section, e.g. '301', '900.2.1'"),
  },
  async ({ section, clause }) => {
    try {
      const data = await morthFetch("/clause", { section, clause });
      if (data.fallback) return { content: [{ type: "text", text: JSON.stringify(data) }] };
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              section,
              clause,
              title: data.title,
              text: data.text,
              requirements: data.requirements,
              material_specs: data.material_specs || null,
              test_requirements: data.test_requirements || null,
              edition: "5th Revision",
              source: "morth-specs-db",
            }),
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: err.message, section, clause, note: "[VERIFY]" }) }],
      };
    }
  }
);

server.tool(
  "get_morth_material_spec",
  "Get material specification requirements for a specific construction material",
  {
    material: z
      .string()
      .describe("Material name, e.g. 'GSB', 'WMM', 'DBM', 'BC', 'DLC', 'PCC', 'RCC'"),
    section: z
      .string()
      .optional()
      .describe("MoRTH section to scope the lookup, e.g. '400' for bituminous"),
  },
  async ({ material, section }) => {
    try {
      const data = await morthFetch("/material-spec", { material, section });
      if (data.fallback) return { content: [{ type: "text", text: JSON.stringify(data) }] };
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              material,
              section: data.section,
              clause: data.clause,
              gradation: data.gradation || null,
              physical_requirements: data.physical_requirements || null,
              compaction_spec: data.compaction_spec || null,
              source: "morth-specs-db",
            }),
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: err.message, material, note: "[VERIFY]" }) }],
      };
    }
  }
);

server.tool(
  "get_test_frequency",
  "Get the minimum test frequency for a quality control test per MoRTH Section 900",
  {
    work_item: z
      .string()
      .describe("Work item description, e.g. 'GSB compaction', 'DBM Marshall stability', 'RCC cube strength'"),
  },
  async ({ work_item }) => {
    const testFrequencies = {
      "subgrade compaction": { test: "In-situ density", frequency: "1 per 500 m² per layer", clause: "900.2.1", section: "900" },
      "gsb compaction": { test: "In-situ density", frequency: "1 per 500 m² per layer", clause: "900.3.1", section: "900" },
      "gsb gradation": { test: "Sieve analysis", frequency: "1 per 200 m³", clause: "900.3.1", section: "900" },
      "wmm gradation": { test: "Sieve analysis", frequency: "1 per 100 m³", clause: "900.3.2", section: "900" },
      "wmm compaction": { test: "In-situ density", frequency: "1 per 500 m² per layer", clause: "900.3.2", section: "900" },
      "dbm marshall": { test: "Marshall stability & flow", frequency: "1 per 100 MT", clause: "900.4.2", section: "900" },
      "bc marshall": { test: "Marshall stability & flow", frequency: "1 per 100 MT", clause: "900.4.3", section: "900" },
      "core density": { test: "Field density (core cutter)", frequency: "1 per 500 m² per layer", clause: "900.4.5", section: "900" },
      "bitumen penetration": { test: "Penetration & softening point", frequency: "1 per tanker lot", clause: "900.4.1", section: "900" },
      "rcc cube strength": { test: "28-day compressive strength", frequency: "1 set per 30 m³ or part", clause: "1700.3.1", section: "1700" },
      "concrete slump": { test: "Slump test", frequency: "Every batch at site", clause: "1700.3.1", section: "1700" },
      "proctor test": { test: "Modified Proctor (MDD, OMC)", frequency: "1 per 3000 m³ embankment", clause: "900.2", section: "900" },
      "cbr subgrade": { test: "CBR (soaked)", frequency: "1 per 1500 m per lane", clause: "900.2.2", section: "900" },
    };

    const key = work_item.toLowerCase();
    const match = Object.entries(testFrequencies).find(([k]) => key.includes(k));

    if (match) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              work_item,
              ...match[1],
              edition: "MoRTH 5th Revision",
              source: "morth-specs-db (embedded)",
            }),
          },
        ],
      };
    }

    try {
      const data = await morthFetch("/test-frequency", { work_item });
      if (data.fallback) return { content: [{ type: "text", text: JSON.stringify({ work_item, ...data }) }] };
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ work_item, error: "Not found in embedded data or connector", note: "[VERIFY]" }),
          },
        ],
      };
    }
  }
);

server.tool(
  "get_sor_rates",
  "Get Schedule of Rates for a work item from the specified state and year",
  {
    state: z.string().describe("Indian state name, e.g. 'Rajasthan', 'Maharashtra'"),
    item_description: z.string().describe("Work item description"),
    year: z.number().optional().describe("SoR year; defaults to latest available"),
  },
  async ({ state, item_description, year }) => {
    try {
      const data = await morthFetch("/sor", { state, item: item_description, year });
      if (data.fallback) return { content: [{ type: "text", text: JSON.stringify(data) }] };
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              state,
              item_description,
              sor_year: data.year,
              unit: data.unit,
              rate_inr: data.rate,
              source: "morth-specs-db",
            }),
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: err.message, state, item_description, note: "[VERIFY]" }) }],
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
