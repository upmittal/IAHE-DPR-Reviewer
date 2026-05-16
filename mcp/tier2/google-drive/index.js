/**
 * Google Drive MCP Server
 *
 * Provides tools to list, search, and download DPR documents stored in Google Drive.
 *
 * Environment variables:
 *   GOOGLE_CLIENT_ID       — OAuth 2.0 client ID
 *   GOOGLE_CLIENT_SECRET   — OAuth 2.0 client secret
 *   GOOGLE_REFRESH_TOKEN   — OAuth 2.0 refresh token
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fetch from "node-fetch";
import * as dotenv from "dotenv";

dotenv.config();

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const DRIVE_API = "https://www.googleapis.com/drive/v3";
const TOKEN_URL = "https://oauth2.googleapis.com/token";

const server = new McpServer({ name: "google-drive", version: "1.0.0" });

let cachedToken = null;
let tokenExpiry = 0;

async function getAccessToken() {
  if (!CLIENT_ID || !CLIENT_SECRET || !REFRESH_TOKEN) {
    throw new Error("Google Drive credentials not configured");
  }
  if (cachedToken && Date.now() < tokenExpiry - 60000) return cachedToken;
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET,
      refresh_token: REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${await res.text()}`);
  const data = await res.json();
  cachedToken = data.access_token;
  tokenExpiry = Date.now() + data.expires_in * 1000;
  return cachedToken;
}

async function driveGet(path, params = {}) {
  const token = await getAccessToken();
  const url = new URL(`${DRIVE_API}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`Drive API ${res.status}: ${await res.text()}`);
  return res.json();
}

server.tool(
  "list_folder",
  "List files in a Google Drive folder, filtered by type",
  {
    folder_id: z.string().describe("Google Drive folder ID"),
    file_type: z
      .string()
      .optional()
      .describe("Filter by MIME type: 'pdf', 'docx', 'xlsx', or 'all'"),
    name_contains: z.string().optional().describe("Filter by filename substring"),
  },
  async ({ folder_id, file_type, name_contains }) => {
    try {
      const mimeMap = {
        pdf: "application/pdf",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      };
      let q = `'${folder_id}' in parents and trashed=false`;
      if (file_type && mimeMap[file_type]) q += ` and mimeType='${mimeMap[file_type]}'`;
      if (name_contains) q += ` and name contains '${name_contains}'`;

      const data = await driveGet("/files", {
        q,
        fields: "files(id,name,mimeType,size,modifiedTime,webViewLink)",
        pageSize: "50",
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ folder_id, files: data.files, count: data.files.length, source: "google-drive" }),
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: err.message, note: "Ensure Google Drive credentials are configured in .env" }) }],
      };
    }
  }
);

server.tool(
  "get_file_metadata",
  "Get metadata for a specific Google Drive file by ID",
  {
    file_id: z.string().describe("Google Drive file ID"),
  },
  async ({ file_id }) => {
    try {
      const data = await driveGet(`/files/${file_id}`, {
        fields: "id,name,mimeType,size,modifiedTime,description,webViewLink,parents",
      });
      return {
        content: [{ type: "text", text: JSON.stringify({ ...data, source: "google-drive" }) }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: err.message, file_id }) }],
      };
    }
  }
);

server.tool(
  "get_download_url",
  "Get a direct download URL for a Google Drive file (for PDF drawings or DPR documents)",
  {
    file_id: z.string().describe("Google Drive file ID"),
  },
  async ({ file_id }) => {
    try {
      const token = await getAccessToken();
      const download_url = `${DRIVE_API}/files/${file_id}?alt=media`;
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              file_id,
              download_url,
              auth_header: `Bearer ${token}`,
              note: "Use this URL with the auth header to download the file for drawing review",
              source: "google-drive",
            }),
          },
        ],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: err.message, file_id }) }],
      };
    }
  }
);

server.tool(
  "search_drive",
  "Search Google Drive for DPR-related documents by keyword",
  {
    query: z.string().describe("Search query, e.g. 'Geometric Design Report', 'Bore Log'"),
    folder_id: z.string().optional().describe("Restrict search to a specific folder"),
  },
  async ({ query, folder_id }) => {
    try {
      let q = `fullText contains '${query}' and trashed=false`;
      if (folder_id) q += ` and '${folder_id}' in parents`;
      const data = await driveGet("/files", {
        q,
        fields: "files(id,name,mimeType,modifiedTime,webViewLink)",
        pageSize: "20",
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ query, results: data.files, count: data.files.length, source: "google-drive" }),
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
