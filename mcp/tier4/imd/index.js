/**
 * Indian Meteorological Department (IMD) MCP Server
 *
 * Provides tools to fetch rainfall data, design storm intensities,
 * and climate zone classification for hydrology review.
 *
 * Environment variables:
 *   IMD_API_KEY       — IMD API key
 *   IMD_API_BASE_URL  — Base URL
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fetch from "node-fetch";
import * as dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.IMD_API_KEY;
const BASE_URL = process.env.IMD_API_BASE_URL || "https://api.imd.gov.in/v1";

const server = new McpServer({ name: "imd-rainfall", version: "1.0.0" });

const CLIMATE_ZONES = {
  "Rajasthan": { zone: "Hot Dry", annual_rainfall_mm: 300, bitumen_grade: "VG-40" },
  "Gujarat": { zone: "Hot Semi-Arid", annual_rainfall_mm: 700, bitumen_grade: "VG-40" },
  "Maharashtra": { zone: "Warm Humid", annual_rainfall_mm: 900, bitumen_grade: "VG-30" },
  "Karnataka": { zone: "Warm Humid", annual_rainfall_mm: 800, bitumen_grade: "VG-30" },
  "Tamil Nadu": { zone: "Warm Humid", annual_rainfall_mm: 950, bitumen_grade: "VG-30" },
  "Kerala": { zone: "Hot Humid", annual_rainfall_mm: 2500, bitumen_grade: "VG-30/CRMB-60" },
  "Punjab": { zone: "Cold Dry", annual_rainfall_mm: 500, bitumen_grade: "VG-30" },
  "Himachal Pradesh": { zone: "Cold", annual_rainfall_mm: 1200, bitumen_grade: "VG-10/VG-20" },
  "Uttarakhand": { zone: "Cold", annual_rainfall_mm: 1500, bitumen_grade: "VG-10/VG-20" },
  "Assam": { zone: "Hot Humid", annual_rainfall_mm: 2000, bitumen_grade: "CRMB-60" },
  "West Bengal": { zone: "Hot Humid", annual_rainfall_mm: 1600, bitumen_grade: "VG-30" },
  "Uttar Pradesh": { zone: "Warm Humid", annual_rainfall_mm: 800, bitumen_grade: "VG-30" },
  "Madhya Pradesh": { zone: "Hot Semi-Arid", annual_rainfall_mm: 1000, bitumen_grade: "VG-40" },
  "Odisha": { zone: "Hot Humid", annual_rainfall_mm: 1500, bitumen_grade: "VG-30" },
};

async function imdFetch(path, params = {}) {
  if (!API_KEY) return { fallback: true };
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${API_KEY}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`IMD API ${res.status}: ${await res.text()}`);
  return res.json();
}

server.tool(
  "get_rainfall_data",
  "Fetch design storm rainfall intensity for a location and return period (for hydrology review)",
  {
    latitude: z.number().describe("Latitude of the project location"),
    longitude: z.number().describe("Longitude of the project location"),
    return_period: z.number().default(25).describe("Return period in years (25, 50, 100)"),
    duration_hours: z.number().default(1).describe("Storm duration in hours for intensity calculation"),
  },
  async ({ latitude, longitude, return_period, duration_hours }) => {
    try {
      const data = await imdFetch("/rainfall/design-storm", {
        lat: latitude,
        lon: longitude,
        return_period,
        duration: duration_hours,
      });
      if (data.fallback) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                latitude,
                longitude,
                return_period,
                note: "IMD_API_KEY not configured. Use Hydro-Meteorological Atlas or regional CWC data. [VERIFY]",
                fallback: true,
              }),
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              latitude,
              longitude,
              return_period_yr: return_period,
              duration_hr: duration_hours,
              rainfall_mm: data.rainfall_mm,
              intensity_mmhr: data.intensity_mmhr,
              station: data.nearest_station,
              source: "imd-rainfall",
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

server.tool(
  "get_climate_zone",
  "Get the climate zone classification for a state/location for bitumen grade selection",
  {
    state: z.string().describe("Indian state name"),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  },
  async ({ state, latitude, longitude }) => {
    try {
      if (latitude && longitude && API_KEY) {
        const data = await imdFetch("/climate-zone", { lat: latitude, lon: longitude });
        if (!data.fallback) {
          return { content: [{ type: "text", text: JSON.stringify({ ...data, source: "imd-rainfall" }) }] };
        }
      }
    } catch (_) {}

    const embedded = CLIMATE_ZONES[state];
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            embedded
              ? { state, ...embedded, source: "imd-rainfall (embedded)", note: "Verify with IMD atlas" }
              : { state, note: "State not found in embedded zone map. [VERIFY with IMD Atlas]" }
          ),
        },
      ],
    };
  }
);

server.tool(
  "get_annual_rainfall",
  "Get annual average rainfall for a state or station for flood estimation context",
  {
    state: z.string().optional(),
    station_name: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  },
  async ({ state, station_name, latitude, longitude }) => {
    try {
      const params = {};
      if (latitude) params.lat = latitude;
      if (longitude) params.lon = longitude;
      if (station_name) params.station = station_name;
      if (state) params.state = state;

      const data = await imdFetch("/rainfall/annual", params);
      if (data.fallback) {
        const embedded = state ? CLIMATE_ZONES[state] : null;
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                state,
                annual_rainfall_mm: embedded?.annual_rainfall_mm || "Unknown",
                note: embedded ? "Embedded estimate — [VERIFY with IMD data]" : "[VERIFY with IMD data]",
              }),
            },
          ],
        };
      }
      return { content: [{ type: "text", text: JSON.stringify({ ...data, source: "imd-rainfall" }) }] };
    } catch (err) {
      return { content: [{ type: "text", text: JSON.stringify({ error: err.message, note: "[VERIFY]" }) }] };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
