/**
 * SharePoint / OneDrive MCP Server
 *
 * Provides tools to access DPR documents stored in Microsoft SharePoint or OneDrive
 * via the Microsoft Graph API.
 *
 * Environment variables:
 *   SHAREPOINT_TENANT_ID      — Azure AD tenant ID
 *   SHAREPOINT_CLIENT_ID      — App registration client ID
 *   SHAREPOINT_CLIENT_SECRET  — App registration client secret
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fetch from "node-fetch";
import * as dotenv from "dotenv";

dotenv.config();

const TENANT_ID = process.env.SHAREPOINT_TENANT_ID;
const CLIENT_ID = process.env.SHAREPOINT_CLIENT_ID;
const CLIENT_SECRET = process.env.SHAREPOINT_CLIENT_SECRET;
const GRAPH_API = "https://graph.microsoft.com/v1.0";

const server = new McpServer({ name: "sharepoint", version: "1.0.0" });

let cachedToken = null;
let tokenExpiry = 0;

async function getToken() {
  if (!TENANT_ID || !CLIENT_ID || !CLIENT_SECRET) {
    throw new Error("SharePoint credentials not configured");
  }
  if (cachedToken && Date.now() < tokenExpiry - 60000) return cachedToken;
  const res = await fetch(`https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      scope: "https://graph.microsoft.com/.default",
      grant_type: "client_credentials",
    }),
  });
  if (!res.ok) throw new Error(`Token failed: ${await res.text()}`);
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + data.expires_in * 1000;
  return cachedToken;
}

async function graphGet(path) {
  const token = await getToken();
  const res = await fetch(`${GRAPH_API}${path}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Graph API ${res.status}: ${await res.text()}`);
  return res.json();
}

server.tool(
  "list_site_files",
  "List files in a SharePoint site document library",
  {
    site_id: z.string().describe("SharePoint site ID"),
    drive_id: z.string().optional().describe("Drive ID (document library); defaults to root drive"),
    folder_path: z.string().default("/").describe("Folder path within the drive"),
  },
  async ({ site_id, drive_id, folder_path }) => {
    try {
      const drivePart = drive_id ? `/drives/${drive_id}` : "/drive";
      const pathPart = folder_path === "/" ? "/root/children" : `/root:${folder_path}:/children`;
      const data = await graphGet(`/sites/${site_id}${drivePart}${pathPart}`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              site_id,
              folder: folder_path,
              files: (data.value || []).map((f) => ({
                id: f.id,
                name: f.name,
                size: f.size,
                lastModified: f.lastModifiedDateTime,
                webUrl: f.webUrl,
                mimeType: f.file?.mimeType,
              })),
              source: "sharepoint",
            }),
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: err.message, note: "Check SharePoint credentials in .env" }) }],
      };
    }
  }
);

server.tool(
  "get_file_content",
  "Get download URL for a SharePoint file (for DPR PDFs and drawings)",
  {
    site_id: z.string(),
    item_id: z.string().describe("SharePoint drive item ID"),
  },
  async ({ site_id, item_id }) => {
    try {
      const data = await graphGet(`/sites/${site_id}/drive/items/${item_id}`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              name: data.name,
              download_url: data["@microsoft.graph.downloadUrl"],
              size: data.size,
              mimeType: data.file?.mimeType,
              source: "sharepoint",
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

server.tool(
  "search_sharepoint",
  "Search a SharePoint site for DPR-related documents",
  {
    site_id: z.string(),
    query: z.string().describe("Search keyword, e.g. 'Geometric Design', 'Bore Log'"),
  },
  async ({ site_id, query }) => {
    try {
      const data = await graphGet(`/sites/${site_id}/drive/root/search(q='${encodeURIComponent(query)}')`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              query,
              results: (data.value || []).map((f) => ({ id: f.id, name: f.name, webUrl: f.webUrl })),
              source: "sharepoint",
            }),
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: err.message, query }) }],
      };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
