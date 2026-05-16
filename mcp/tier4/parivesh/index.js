/**
 * PARIVESH Environmental Clearance MCP Server
 *
 * Provides tools to check environmental clearance status, fetch EC conditions,
 * and verify PARIVESH application data for environmental-social review.
 *
 * Environment variables:
 *   PARIVESH_API_KEY   — PARIVESH API key
 *   PARIVESH_BASE_URL  — Base URL
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fetch from "node-fetch";
import * as dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.PARIVESH_API_KEY;
const BASE_URL = process.env.PARIVESH_BASE_URL || "https://parivesh.nic.in/api/v1";

const server = new McpServer({ name: "parivesh", version: "1.0.0" });

async function pariveshFetch(path, params = {}) {
  if (!API_KEY) return { fallback: true };
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${API_KEY}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`PARIVESH API ${res.status}: ${await res.text()}`);
  return res.json();
}

server.tool(
  "get_ec_status",
  "Get Environmental Clearance (EC) status for a project by PARIVESH application ID or EC number",
  {
    application_id: z.string().optional().describe("PARIVESH application ID"),
    ec_number: z.string().optional().describe("EC reference number"),
    project_name: z.string().optional().describe("Partial project name for search"),
  },
  async ({ application_id, ec_number, project_name }) => {
    try {
      const params = {};
      if (application_id) params.app_id = application_id;
      if (ec_number) params.ec_no = ec_number;
      if (project_name) params.name = project_name;

      const data = await pariveshFetch("/ec/status", params);
      if (data.fallback) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                application_id,
                note: "PARIVESH_API_KEY not configured. Verify EC status manually at parivesh.nic.in",
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
              application_id,
              project_name: data.project_name,
              status: data.status,
              ec_number: data.ec_number,
              category: data.category,
              granted_date: data.granted_date || null,
              valid_until: data.valid_until || null,
              authority: data.authority,
              source: "parivesh",
            }),
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: err.message, note: "[VERIFY at parivesh.nic.in]" }) }],
      };
    }
  }
);

server.tool(
  "get_ec_conditions",
  "Retrieve EC conditions (specific and general) for a granted Environmental Clearance",
  {
    ec_number: z.string().describe("EC reference number"),
  },
  async ({ ec_number }) => {
    try {
      const data = await pariveshFetch(`/ec/${encodeURIComponent(ec_number)}/conditions`);
      if (data.fallback) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ ec_number, note: "PARIVESH connector offline. [VERIFY EC conditions from EC letter]" }),
            },
          ],
        };
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              ec_number,
              general_conditions: data.general_conditions,
              specific_conditions: data.specific_conditions,
              source: "parivesh",
            }),
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: err.message, ec_number, note: "[VERIFY]" }) }],
      };
    }
  }
);

server.tool(
  "get_forest_clearance_status",
  "Check Forest Clearance (FC) status for a project under Forest Conservation Act 1980",
  {
    proposal_number: z.string().describe("FC proposal number from PARIVESH"),
  },
  async ({ proposal_number }) => {
    try {
      const data = await pariveshFetch("/fc/status", { proposal_no: proposal_number });
      if (data.fallback) {
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                proposal_number,
                note: "PARIVESH connector offline. [VERIFY FC status at parivesh.nic.in/newHome]",
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
              proposal_number,
              project_name: data.project_name,
              stage: data.stage,
              forest_area_ha: data.forest_area_ha,
              forest_type: data.forest_type,
              ca_area_ha: data.ca_area_ha,
              npv_inr_lakh: data.npv_inr_lakh,
              stage1_date: data.stage1_date || null,
              stage2_date: data.stage2_date || null,
              source: "parivesh",
            }),
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: err.message, proposal_number, note: "[VERIFY]" }) }],
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
