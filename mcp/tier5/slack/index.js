/**
 * Slack MCP Server
 *
 * Provides tools to post DPR review summaries, flag alerts, and
 * managed agent notifications to Slack channels.
 *
 * Environment variables:
 *   SLACK_BOT_TOKEN        — Slack Bot OAuth token (xoxb-...)
 *   SLACK_DEFAULT_CHANNEL  — Default channel ID or name (e.g. #dpr-reviews)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fetch from "node-fetch";
import * as dotenv from "dotenv";

dotenv.config();

const BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
const DEFAULT_CHANNEL = process.env.SLACK_DEFAULT_CHANNEL || "#dpr-reviews";
const SLACK_API = "https://slack.com/api";

const server = new McpServer({ name: "slack", version: "1.0.0" });

async function slackPost(method, body) {
  if (!BOT_TOKEN) throw new Error("SLACK_BOT_TOKEN not configured");
  const res = await fetch(`${SLACK_API}/${method}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${BOT_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!data.ok) throw new Error(`Slack API error: ${data.error}`);
  return data;
}

server.tool(
  "post_review_summary",
  "Post a DPR review summary to a Slack channel",
  {
    project_name: z.string().describe("Project name"),
    review_date: z.string().describe("Review date (YYYY-MM-DD)"),
    critical_flags: z.number().describe("Number of CRITICAL flags"),
    major_flags: z.number().describe("Number of MAJOR flags"),
    minor_flags: z.number().describe("Number of MINOR flags"),
    cross_volume_flags: z.number().describe("Number of cross-volume inconsistencies"),
    review_file_link: z.string().optional().describe("Link to the full review document"),
    channel: z.string().optional().describe("Slack channel; defaults to SLACK_DEFAULT_CHANNEL"),
  },
  async ({ project_name, review_date, critical_flags, major_flags, minor_flags, cross_volume_flags, review_file_link, channel }) => {
    try {
      const targetChannel = channel || DEFAULT_CHANNEL;
      const severity_icon = critical_flags > 0 ? ":red_circle:" : major_flags > 0 ? ":large_yellow_circle:" : ":large_green_circle:";

      const blocks = [
        {
          type: "header",
          text: { type: "plain_text", text: `DPR Review Complete: ${project_name}` },
        },
        {
          type: "section",
          fields: [
            { type: "mrkdwn", text: `*Review Date:*\n${review_date}` },
            { type: "mrkdwn", text: `*Status:*\n${severity_icon}` },
            { type: "mrkdwn", text: `*CRITICAL:*\n${critical_flags}` },
            { type: "mrkdwn", text: `*MAJOR:*\n${major_flags}` },
            { type: "mrkdwn", text: `*MINOR:*\n${minor_flags}` },
            { type: "mrkdwn", text: `*Cross-Volume:*\n${cross_volume_flags}` },
          ],
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: "_Review draft — for professional verification only. Not a substitute for licensed engineering judgment._",
            },
          ],
        },
      ];

      if (review_file_link) {
        blocks.push({
          type: "actions",
          elements: [{ type: "button", text: { type: "plain_text", text: "View Full Review" }, url: review_file_link }],
        });
      }

      const data = await slackPost("chat.postMessage", { channel: targetChannel, blocks });
      return {
        content: [{ type: "text", text: JSON.stringify({ ok: true, ts: data.ts, channel: data.channel }) }],
      };
    } catch (err) {
      return {
        content: [{ type: "text", text: JSON.stringify({ error: err.message, note: "Check SLACK_BOT_TOKEN in .env" }) }],
      };
    }
  }
);

server.tool(
  "post_agent_alert",
  "Post a managed agent alert (e.g. new IRC edition, cost escalation) to Slack",
  {
    agent_name: z.string().describe("Name of the managed agent (e.g. 'irc-update-monitor')"),
    alert_type: z.string().describe("Type of alert (e.g. 'New IRC Edition', 'Cost Escalation')"),
    message: z.string().describe("Alert message body"),
    severity: z.enum(["info", "warning", "critical"]).default("info"),
    affected_projects: z.array(z.string()).optional().describe("List of affected project names"),
    channel: z.string().optional(),
  },
  async ({ agent_name, alert_type, message, severity, affected_projects, channel }) => {
    try {
      const icons = { info: ":information_source:", warning: ":warning:", critical: ":rotating_light:" };
      const targetChannel = channel || DEFAULT_CHANNEL;

      const blocks = [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `${icons[severity]} *${agent_name}* — ${alert_type}\n${message}`,
          },
        },
      ];

      if (affected_projects?.length) {
        blocks.push({
          type: "context",
          elements: [{ type: "mrkdwn", text: `*Affected projects:* ${affected_projects.join(", ")}` }],
        });
      }

      const data = await slackPost("chat.postMessage", { channel: targetChannel, blocks });
      return {
        content: [{ type: "text", text: JSON.stringify({ ok: true, ts: data.ts, channel: data.channel }) }],
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
