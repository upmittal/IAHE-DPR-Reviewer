/**
 * Autodesk Docs / AutoCAD Web MCP Server
 *
 * Provides tools to access engineering drawings (DWG/PDF) stored in
 * Autodesk Construction Cloud (ACC) or Autodesk Docs.
 *
 * Environment variables:
 *   AUTODESK_CLIENT_ID      — APS (Autodesk Platform Services) client ID
 *   AUTODESK_CLIENT_SECRET  — APS client secret
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fetch from "node-fetch";
import * as dotenv from "dotenv";

dotenv.config();

const CLIENT_ID = process.env.AUTODESK_CLIENT_ID;
const CLIENT_SECRET = process.env.AUTODESK_CLIENT_SECRET;
const APS_BASE = "https://developer.api.autodesk.com";

const server = new McpServer({ name: "autodesk-docs", version: "1.0.0" });

let cachedToken = null;
let tokenExpiry = 0;

async function getToken() {
  if (!CLIENT_ID || !CLIENT_SECRET) throw new Error("Autodesk credentials not configured");
  if (cachedToken && Date.now() < tokenExpiry - 60000) return cachedToken;
  const res = await fetch(`${APS_BASE}/authentication/v2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      grant_type: "client_credentials",
      scope: "data:read",
    }),
  });
  if (!res.ok) throw new Error(`APS token failed: ${await res.text()}`);
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + data.expires_in * 1000;
  return cachedToken;
}

async function apsGet(path) {
  const token = await getToken();
  const res = await fetch(`${APS_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`APS API ${res.status}: ${await res.text()}`);
  return res.json();
}

server.tool(
  "list_project_folders",
  "List top-level folders in an Autodesk Construction Cloud project",
  {
    hub_id: z.string().describe("ACC hub ID (b.xxxxxxxx format)"),
    project_id: z.string().describe("ACC project ID (b.xxxxxxxx format)"),
  },
  async ({ hub_id, project_id }) => {
    try {
      const data = await apsGet(`/project/v1/hubs/${hub_id}/projects/${project_id}/topFolders`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              project_id,
              folders: (data.data || []).map((f) => ({ id: f.id, name: f.attributes?.name })),
              source: "autodesk-docs",
            }),
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: err.message, note: "Check Autodesk credentials in .env" }) }],
      };
    }
  }
);

server.tool(
  "list_folder_contents",
  "List drawings and documents in an Autodesk Docs folder",
  {
    project_id: z.string(),
    folder_id: z.string().describe("Folder ID (urn:adsk.wipprod:... format)"),
    filter_type: z.enum(["dwg", "pdf", "all"]).default("all"),
  },
  async ({ project_id, folder_id, filter_type }) => {
    try {
      const data = await apsGet(
        `/data/v1/projects/${project_id}/folders/${encodeURIComponent(folder_id)}/contents`
      );
      let items = data.data || [];
      if (filter_type !== "all") {
        items = items.filter((i) =>
          i.attributes?.displayName?.toLowerCase().endsWith(`.${filter_type}`)
        );
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              folder_id,
              items: items.map((i) => ({
                id: i.id,
                name: i.attributes?.displayName,
                type: i.type,
                version: i.attributes?.versionNumber,
              })),
              source: "autodesk-docs",
            }),
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: err.message, folder_id }) }],
      };
    }
  }
);

server.tool(
  "get_drawing_pdf_url",
  "Get the PDF derivative download URL for a DWG drawing sheet for review",
  {
    project_id: z.string(),
    item_id: z.string().describe("Drive item ID of the drawing"),
    sheet_name: z.string().optional().describe("Specific sheet name to fetch from a multi-sheet DWG"),
  },
  async ({ project_id, item_id }) => {
    try {
      const versions = await apsGet(`/data/v1/projects/${project_id}/items/${item_id}/versions`);
      const latest = versions.data?.[0];
      if (!latest) throw new Error("No versions found for item");
      const urn = Buffer.from(latest.id).toString("base64").replace(/=/g, "");
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              item_id,
              urn,
              derivative_endpoint: `${APS_BASE}/modelderivative/v2/designdata/${urn}/manifest`,
              instruction: "Use the Model Derivative API to extract PDF/SVF derivatives for visual review",
              source: "autodesk-docs",
            }),
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: err.message, item_id }) }],
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
