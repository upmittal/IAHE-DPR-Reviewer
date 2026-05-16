/**
 * IITPAVE / KENPAVE MCP Server
 *
 * Reads output files from pavement design software (IITPAVE, KENPAVE)
 * to verify mechanistic-empirical pavement design results.
 *
 * Environment variables:
 *   IITPAVE_OUTPUT_DIR — Directory containing IITPAVE output files
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const OUTPUT_DIR = process.env.IITPAVE_OUTPUT_DIR || "";

const server = new McpServer({ name: "iitpave", version: "1.0.0" });

function listOutputFiles(dir) {
  if (!dir || !fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => [".out", ".txt", ".csv", ".res"].some((ext) => f.toLowerCase().endsWith(ext)))
    .map((f) => path.join(dir, f));
}

function parseIitpaveOutput(content) {
  const result = {};
  const tensileMatch = content.match(/Tensile\s+strain[^\d]*([\d.E+-]+)/i);
  if (tensileMatch) result.tensile_strain_bottom_BC = parseFloat(tensileMatch[1]);
  const compressiveMatch = content.match(/Compressive\s+strain[^\d]*([\d.E+-]+)/i);
  if (compressiveMatch) result.compressive_strain_top_subgrade = parseFloat(compressiveMatch[1]);
  const lifetimeMatch = content.match(/Design\s+life[^\d]*([\d.]+)\s*msa/i);
  if (lifetimeMatch) result.design_life_msa = parseFloat(lifetimeMatch[1]);
  const cbr = content.match(/CBR[^\d]*([\d.]+)\s*%/i);
  if (cbr) result.subgrade_cbr_pct = parseFloat(cbr[1]);
  return result;
}

server.tool(
  "list_pavement_outputs",
  "List IITPAVE/KENPAVE output files available for review",
  {},
  async () => {
    if (!OUTPUT_DIR) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              note: "IITPAVE_OUTPUT_DIR not set in .env",
              instruction: "Set IITPAVE_OUTPUT_DIR to the folder containing IITPAVE output files",
            }),
          },
        ],
      };
    }
    const files = listOutputFiles(OUTPUT_DIR);
    return {
      content: [{ type: "text", text: JSON.stringify({ directory: OUTPUT_DIR, files }) }],
    };
  }
);

server.tool(
  "read_pavement_design_output",
  "Read IITPAVE/KENPAVE output and extract critical strains and design life for IRC:37 verification",
  {
    output_file: z
      .string()
      .optional()
      .describe("Path to IITPAVE output file; auto-detects first file in IITPAVE_OUTPUT_DIR if omitted"),
    design_traffic_msa: z
      .number()
      .optional()
      .describe("Design traffic in msa from DPR, for comparison with software output"),
  },
  async ({ output_file, design_traffic_msa }) => {
    try {
      const filePath = output_file || listOutputFiles(OUTPUT_DIR)[0];
      if (!filePath || !fs.existsSync(filePath)) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                note: "IITPAVE output not available. Set IITPAVE_OUTPUT_DIR.",
                fallback: true,
              }),
            },
          ],
        };
      }
      const content = fs.readFileSync(filePath, "utf8");
      const parsed = parseIitpaveOutput(content);

      const IRC37_CRITERIA = {
        tensile_strain_limit: 200e-6,
        compressive_strain_limit: 400e-6,
      };

      const compliance = {
        tensile_ok:
          parsed.tensile_strain_bottom_BC !== undefined
            ? parsed.tensile_strain_bottom_BC <= IRC37_CRITERIA.tensile_strain_limit
            : null,
        compressive_ok:
          parsed.compressive_strain_top_subgrade !== undefined
            ? parsed.compressive_strain_top_subgrade <= IRC37_CRITERIA.compressive_strain_limit
            : null,
        design_life_matches_dpr:
          design_traffic_msa && parsed.design_life_msa
            ? Math.abs(parsed.design_life_msa - design_traffic_msa) / design_traffic_msa < 0.05
            : null,
      };

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              output_file: filePath,
              software_results: parsed,
              irc37_criteria: IRC37_CRITERIA,
              compliance,
              source: "iitpave",
              note: "Verify against full IITPAVE output report",
            }),
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: err.message }) }],
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
