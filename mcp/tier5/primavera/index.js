/**
 * Primavera P6 / MS Project MCP Server
 *
 * Provides tools to read project schedule data for milestone tracking
 * in the project-monitoring skill.
 *
 * Environment variables:
 *   PRIMAVERA_DB_URL      — JDBC/API URL for Primavera P6 database
 *   MSPROJECT_FILE_PATH   — Path to an MS Project .mpp or exported .xml file
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const PRIMAVERA_URL = process.env.PRIMAVERA_DB_URL || "";
const MSPROJECT_PATH = process.env.MSPROJECT_FILE_PATH || "";

const server = new McpServer({ name: "primavera", version: "1.0.0" });

function parseMsProjectXml(content) {
  const tasks = [];
  const taskRegex = /<Task>([\s\S]*?)<\/Task>/g;
  let match;
  while ((match = taskRegex.exec(content)) !== null) {
    const task = match[1];
    const getName = (tag) => {
      const m = task.match(new RegExp(`<${tag}>(.*?)</${tag}>`));
      return m ? m[1] : null;
    };
    tasks.push({
      id: getName("UID"),
      name: getName("Name"),
      start: getName("Start"),
      finish: getName("Finish"),
      percent_complete: getName("PercentComplete"),
      milestone: getName("Milestone") === "1",
    });
  }
  return tasks;
}

server.tool(
  "list_milestones",
  "List project milestones and their status from Primavera P6 or MS Project",
  {
    project_id: z.string().optional().describe("Primavera project ID or WBS code"),
    file_path: z.string().optional().describe("MS Project XML file path; uses MSPROJECT_FILE_PATH if omitted"),
  },
  async ({ project_id, file_path }) => {
    const targetFile = file_path || MSPROJECT_PATH;

    if (targetFile && fs.existsSync(path.resolve(targetFile))) {
      try {
        const content = fs.readFileSync(path.resolve(targetFile), "utf8");
        const tasks = parseMsProjectXml(content);
        const milestones = tasks.filter((t) => t.milestone);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                source: "ms-project",
                file: targetFile,
                milestones,
                total: milestones.length,
              }),
            },
          ],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: JSON.stringify({ error: `MS Project parse error: ${err.message}` }) }],
        };
      }
    }

    if (PRIMAVERA_URL) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              note: "Primavera P6 REST API integration pending. Set PRIMAVERA_DB_URL and implement REST endpoint.",
              project_id,
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
            note: "No schedule file or Primavera connection configured. Set MSPROJECT_FILE_PATH in .env for MS Project XML, or PRIMAVERA_DB_URL for Primavera P6.",
          }),
        },
      ],
    };
  }
);

server.tool(
  "get_task_status",
  "Get the completion status of specific project tasks (DPR submission, approvals, construction start)",
  {
    task_names: z.array(z.string()).describe("List of task names to query"),
    file_path: z.string().optional(),
  },
  async ({ task_names, file_path }) => {
    const targetFile = file_path || MSPROJECT_PATH;

    if (targetFile && fs.existsSync(path.resolve(targetFile))) {
      try {
        const content = fs.readFileSync(path.resolve(targetFile), "utf8");
        const allTasks = parseMsProjectXml(content);
        const matched = allTasks.filter((t) =>
          task_names.some((name) => t.name?.toLowerCase().includes(name.toLowerCase()))
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({ tasks: matched, matched_count: matched.length, source: "ms-project" }),
            },
          ],
        };
      } catch (err) {
        return {
          content: [{ type: "text", text: JSON.stringify({ error: err.message }) }],
        };
      }
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ note: "No schedule file configured. Set MSPROJECT_FILE_PATH in .env." }),
        },
      ],
    };
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
