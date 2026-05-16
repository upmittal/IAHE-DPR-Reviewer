/**
 * BIS Standards Portal MCP Server
 *
 * Provides tools to look up IS/BIS standards relevant to highway engineering —
 * geotechnical, material, structural, and seismic codes.
 *
 * Environment variables:
 *   BIS_API_KEY       — API key for BIS Standards Portal
 *   BIS_API_BASE_URL  — Base URL
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fetch from "node-fetch";
import * as dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.BIS_API_KEY;
const BASE_URL = process.env.BIS_API_BASE_URL || "https://bis.gov.in/api/standards/v1";

const server = new McpServer({
  name: "bis-standards",
  version: "1.0.0",
});

const IS_CODES_CATALOG = {
  "IS:1498": { title: "Classification and Identification of Soils for General Engineering Purposes", year: 1970, domain: "geotechnical" },
  "IS:2720": { title: "Methods of Test for Soils (multi-part)", year: 1983, domain: "geotechnical" },
  "IS:1888": { title: "Method of Load Test on Soils", year: 1982, domain: "geotechnical" },
  "IS:1893": { title: "Criteria for Earthquake Resistant Design of Structures", year: 2016, domain: "seismic" },
  "IS:456": { title: "Code of Practice for Plain and Reinforced Concrete", year: 2000, domain: "structural" },
  "IS:2062": { title: "Hot Rolled Medium and High Tensile Structural Steel", year: 2011, domain: "structural" },
  "IS:1786": { title: "High Strength Deformed Steel Bars and Wires for Concrete Reinforcement", year: 2008, domain: "structural" },
  "IS:73": { title: "Paving Bitumen — Specification", year: 2013, domain: "pavement" },
  "IS:8112": { title: "OPC 43 Grade Cement", year: 2013, domain: "material" },
  "IS:12269": { title: "OPC 53 Grade Cement", year: 2013, domain: "material" },
  "IS:2386": { title: "Methods of Test for Aggregates for Concrete", year: 1963, domain: "material" },
  "IS:516": { title: "Method of Tests for Strength of Concrete", year: 2018, domain: "material" },
  "IS:5477": { title: "Methods for Fixing the Capacities of Reservoirs", year: 1969, domain: "hydrology" },
  "IS:15284": { title: "Design and Construction for Ground Improvement — Guidelines", year: 2003, domain: "geotechnical" },
};

async function bisFetch(path, params = {}) {
  if (!API_KEY) {
    return { fallback: true, note: "[VERIFY — connector offline]" };
  }
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${API_KEY}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`BIS API ${res.status}: ${await res.text()}`);
  return res.json();
}

server.tool(
  "lookup_is_clause",
  "Retrieve a clause or table from an IS/BIS standard relevant to highway engineering",
  {
    code: z.string().describe("IS code identifier, e.g. 'IS:1893', 'IS:456'"),
    clause: z.string().describe("Clause or table number, e.g. '6.3', 'Table 2'"),
    part: z.string().optional().describe("Part number for multi-part standards, e.g. 'Part 1'"),
  },
  async ({ code, clause, part }) => {
    const catalog = IS_CODES_CATALOG[code];
    try {
      const data = await bisFetch("/clause", { code, clause, part });
      if (data.fallback) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                code,
                clause,
                catalog_info: catalog || null,
                note: "[VERIFY — connector offline]",
              }),
            },
          ],
        };
      }
      return { content: [{ type: "text", text: JSON.stringify({ ...data, source: "bis-standards" }) }] };
    } catch (err) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ error: err.message, code, clause, catalog_info: catalog, note: "[VERIFY]" }),
          },
        ],
      };
    }
  }
);

server.tool(
  "get_seismic_zone",
  "Get the seismic zone classification for a given location per IS:1893",
  {
    state: z.string().describe("Indian state name"),
    district: z.string().optional().describe("District name for more precise lookup"),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  },
  async ({ state, district, latitude, longitude }) => {
    const seismicZoneMap = {
      "Jammu & Kashmir": "V", "Himachal Pradesh": "IV", "Uttarakhand": "IV",
      "Bihar": "IV", "West Bengal": "III", "Assam": "V", "Manipur": "V",
      "Meghalaya": "V", "Mizoram": "V", "Nagaland": "V", "Tripura": "V",
      "Arunachal Pradesh": "V", "Sikkim": "IV", "Delhi": "IV",
      "Rajasthan": "II", "Gujarat": "III", "Maharashtra": "III",
      "Goa": "III", "Karnataka": "II", "Tamil Nadu": "II",
      "Andhra Pradesh": "II", "Telangana": "II", "Kerala": "III",
      "Odisha": "II", "Madhya Pradesh": "II", "Chhattisgarh": "II",
      "Jharkhand": "II", "Uttar Pradesh": "III", "Punjab": "IV",
      "Haryana": "IV",
    };

    const zone = seismicZoneMap[state] || "Unknown";
    const zoneFactors = { "II": 0.10, "III": 0.16, "IV": 0.24, "V": 0.36 };

    try {
      if (latitude && longitude) {
        const data = await bisFetch("/seismic-zone", { lat: latitude, lon: longitude });
        if (!data.fallback) {
          return { content: [{ type: "text", text: JSON.stringify({ ...data, source: "bis-standards" }) }] };
        }
      }
    } catch (_) {}

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            state,
            district: district || null,
            seismic_zone: zone,
            zone_factor_Z: zoneFactors[zone] || null,
            code: "IS:1893 Part 1:2016",
            note: zone === "Unknown" ? "Zone not found in embedded map — [VERIFY]" : "Embedded zone map — verify with IS:1893 Part 1 Fig. 18",
          }),
        },
      ],
    };
  }
);

server.tool(
  "list_is_codes_by_domain",
  "List all IS codes available for a specific engineering domain",
  {
    domain: z.enum(["geotechnical", "structural", "seismic", "pavement", "material", "hydrology", "all"]),
  },
  async ({ domain }) => {
    const codes =
      domain === "all"
        ? IS_CODES_CATALOG
        : Object.fromEntries(Object.entries(IS_CODES_CATALOG).filter(([, v]) => v.domain === domain));
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ domain, codes, source: "bis-standards (catalog)" }),
        },
      ],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
