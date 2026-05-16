/**
 * Excel / Google Sheets MCP Server
 *
 * Provides tools to parse BOQ tables, traffic count sheets, SoR data,
 * and other tabular DPR data from Excel (.xlsx) or CSV files.
 *
 * Environment variables:
 *   EXCEL_FILE_PATH — Optional default path to an Excel file
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import * as XLSX from "xlsx";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config();

const server = new McpServer({ name: "excel-sheets", version: "1.0.0" });

function readWorkbook(file_path) {
  const resolved = path.resolve(file_path);
  if (!fs.existsSync(resolved)) throw new Error(`File not found: ${resolved}`);
  return XLSX.readFile(resolved);
}

server.tool(
  "list_sheets",
  "List all sheet names in an Excel file",
  { file_path: z.string().describe("Absolute or relative path to the .xlsx / .xls / .csv file") },
  async ({ file_path }) => {
    try {
      const wb = readWorkbook(file_path);
      return {
        content: [
          { type: "text", text: JSON.stringify({ file_path, sheets: wb.SheetNames, count: wb.SheetNames.length }) },
        ],
      };
    } catch (err) {
      return { content: [{ type: "text", text: JSON.stringify({ error: err.message, file_path }) }] };
    }
  }
);

server.tool(
  "parse_sheet",
  "Parse a specific sheet from an Excel file and return as JSON rows",
  {
    file_path: z.string().describe("Path to the Excel file"),
    sheet_name: z.string().describe("Sheet name to parse"),
    header_row: z.number().default(1).describe("Row number (1-indexed) that contains column headers"),
    max_rows: z.number().default(500).describe("Maximum rows to return"),
  },
  async ({ file_path, sheet_name, header_row, max_rows }) => {
    try {
      const wb = readWorkbook(file_path);
      const ws = wb.Sheets[sheet_name];
      if (!ws) throw new Error(`Sheet '${sheet_name}' not found. Available: ${wb.SheetNames.join(", ")}`);
      const data = XLSX.utils.sheet_to_json(ws, { defval: null, range: header_row - 1 });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              file_path,
              sheet: sheet_name,
              row_count: data.length,
              rows: data.slice(0, max_rows),
            }),
          },
        ],
      };
    } catch (err) {
      return { content: [{ type: "text", text: JSON.stringify({ error: err.message }) }] };
    }
  }
);

server.tool(
  "parse_boq",
  "Parse a BOQ Excel sheet and extract item descriptions, quantities, rates, and amounts",
  {
    file_path: z.string().describe("Path to the BOQ Excel file"),
    sheet_name: z.string().default("BOQ").describe("Sheet containing the BOQ"),
    item_col: z.string().default("Item No.").describe("Column header for item number"),
    desc_col: z.string().default("Description").describe("Column header for description"),
    unit_col: z.string().default("Unit").describe("Column header for unit"),
    qty_col: z.string().default("Quantity").describe("Column header for quantity"),
    rate_col: z.string().default("Rate").describe("Column header for rate"),
    amount_col: z.string().default("Amount").describe("Column header for amount"),
  },
  async ({ file_path, sheet_name, item_col, desc_col, unit_col, qty_col, rate_col, amount_col }) => {
    try {
      const wb = readWorkbook(file_path);
      const sheetToUse = wb.SheetNames.find(
        (s) => s.toLowerCase().includes("boq") || s === sheet_name
      ) || wb.SheetNames[0];
      const ws = wb.Sheets[sheetToUse];
      const raw = XLSX.utils.sheet_to_json(ws, { defval: null });

      const items = raw
        .filter((row) => row[item_col] || row[desc_col])
        .map((row) => ({
          item_no: row[item_col],
          description: row[desc_col],
          unit: row[unit_col],
          quantity: parseFloat(row[qty_col]) || null,
          rate_inr: parseFloat(row[rate_col]) || null,
          amount_inr: parseFloat(row[amount_col]) || null,
        }));

      const total = items.reduce((s, r) => s + (r.amount_inr || 0), 0);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              file_path,
              sheet: sheetToUse,
              items_count: items.length,
              total_amount_inr: total,
              items,
            }),
          },
        ],
      };
    } catch (err) {
      return { content: [{ type: "text", text: JSON.stringify({ error: err.message }) }] };
    }
  }
);

server.tool(
  "parse_traffic_count_sheets",
  "Parse classified traffic count data from an Excel file and summarize AADT by vehicle class",
  {
    file_path: z.string().describe("Path to the traffic count Excel file"),
    sheet_name: z.string().optional().describe("Sheet containing count data; auto-detected if omitted"),
    date_col: z.string().default("Date").describe("Column for survey date"),
    direction_col: z.string().optional().describe("Column for direction"),
    vehicle_classes: z
      .array(z.string())
      .default(["2W", "3W", "Car/Jeep", "LCV", "Truck", "MAV", "Bus", "Tractor"])
      .describe("Vehicle class column headers"),
  },
  async ({ file_path, sheet_name, date_col, vehicle_classes }) => {
    try {
      const wb = readWorkbook(file_path);
      const sheetToUse =
        sheet_name ||
        wb.SheetNames.find((s) => s.toLowerCase().includes("count") || s.toLowerCase().includes("traffic")) ||
        wb.SheetNames[0];
      const ws = wb.Sheets[sheetToUse];
      const raw = XLSX.utils.sheet_to_json(ws, { defval: 0 });

      const totals = {};
      vehicle_classes.forEach((vc) => (totals[vc] = 0));
      let survey_days = 0;

      const dates = new Set();
      raw.forEach((row) => {
        if (row[date_col]) dates.add(String(row[date_col]));
        vehicle_classes.forEach((vc) => {
          if (row[vc]) totals[vc] += Number(row[vc]) || 0;
        });
      });

      survey_days = dates.size || 1;
      const aadt = {};
      vehicle_classes.forEach((vc) => (aadt[vc] = Math.round(totals[vc] / survey_days)));

      const total_aadt = Object.values(aadt).reduce((s, v) => s + v, 0);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ file_path, survey_days, aadt_by_class: aadt, total_aadt, source: "excel-sheets" }),
          },
        ],
      };
    } catch (err) {
      return { content: [{ type: "text", text: JSON.stringify({ error: err.message }) }] };
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
