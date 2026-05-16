/**
 * HEC-RAS / HEC-HMS MCP Server
 *
 * Provides tools to read outputs from hydraulic model files (HEC-RAS, HEC-HMS)
 * for use in bridge and hydrology review skills.
 *
 * Environment variables:
 *   HECRAS_PROJECT_DIR  — Directory containing HEC-RAS project files (.prj, .g01, etc.)
 *   HECHMS_PROJECT_DIR  — Directory containing HEC-HMS project files
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const HECRAS_DIR = process.env.HECRAS_PROJECT_DIR || "";
const HECHMS_DIR = process.env.HECHMS_PROJECT_DIR || "";

const server = new McpServer({ name: "hec-ras", version: "1.0.0" });

function listProjectFiles(dir, extensions) {
  if (!dir || !fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => extensions.some((ext) => f.toLowerCase().endsWith(ext)))
    .map((f) => path.join(dir, f));
}

function parseHecRasPlan(content) {
  const lines = content.split("\n");
  const results = {};
  lines.forEach((line) => {
    const hflMatch = line.match(/Max\s+W\.S\.\s+=\s+([\d.]+)/i);
    if (hflMatch) results.max_ws_elev = parseFloat(hflMatch[1]);
    const qMatch = line.match(/Qmax\s+=\s+([\d.]+)/i);
    if (qMatch) results.peak_discharge_m3s = parseFloat(qMatch[1]);
    const velMatch = line.match(/Max\s+Vel\s+=\s+([\d.]+)/i);
    if (velMatch) results.max_velocity_ms = parseFloat(velMatch[1]);
  });
  return results;
}

server.tool(
  "list_hecras_projects",
  "List available HEC-RAS project files in the configured project directory",
  {},
  async () => {
    const files = listProjectFiles(HECRAS_DIR, [".prj", ".p01", ".p02", ".g01"]);
    if (!HECRAS_DIR) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              note: "HECRAS_PROJECT_DIR not set in .env",
              instruction: "Set HECRAS_PROJECT_DIR to the folder containing .prj files",
            }),
          },
        ],
      };
    }
    return {
      content: [{ type: "text", text: JSON.stringify({ directory: HECRAS_DIR, files }) }],
    };
  }
);

server.tool(
  "get_design_discharge",
  "Read peak discharge (Q) and HFL results from a HEC-RAS output file for a bridge or culvert location",
  {
    bridge_id: z.string().describe("Bridge or cross-section identifier (chainage or name)"),
    plan_file: z.string().optional().describe("HEC-RAS plan output file path; auto-detected if omitted"),
    return_period: z.number().default(100).describe("Return period in years for which to extract results"),
  },
  async ({ bridge_id, plan_file, return_period }) => {
    try {
      const filePath = plan_file || listProjectFiles(HECRAS_DIR, [".p01", ".p02", ".out"])[0];
      if (!filePath || !fs.existsSync(filePath)) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                bridge_id,
                return_period,
                note: "HEC-RAS plan file not found. Set HECRAS_PROJECT_DIR and ensure .p01/.out files are present.",
                fallback: true,
              }),
            },
          ],
        };
      }
      const content = fs.readFileSync(filePath, "utf8");
      const parsed = parseHecRasPlan(content);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              bridge_id,
              return_period_yr: return_period,
              plan_file: filePath,
              ...parsed,
              source: "hec-ras",
              note: "Verify extracted values against full HEC-RAS output report",
            }),
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: err.message, bridge_id }) }],
      };
    }
  }
);

server.tool(
  "get_hfl_results",
  "Get High Flood Level (HFL) at a specific cross-section from HEC-RAS output",
  {
    structure_id: z.string().describe("Structure chainage or name"),
    plan_file: z.string().optional(),
  },
  async ({ structure_id, plan_file }) => {
    try {
      const filePath = plan_file || listProjectFiles(HECRAS_DIR, [".p01", ".p02", ".out"])[0];
      if (!filePath || !fs.existsSync(filePath)) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                structure_id,
                note: "HEC-RAS output not available. Set HECRAS_PROJECT_DIR.",
                fallback: true,
              }),
            },
          ],
        };
      }
      const content = fs.readFileSync(filePath, "utf8");
      const parsed = parseHecRasPlan(content);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ structure_id, hfl_m: parsed.max_ws_elev, ...parsed, source: "hec-ras" }),
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: err.message, structure_id }) }],
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
