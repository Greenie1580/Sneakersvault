import fs from "fs";
import path from "path";
import { Client } from "@notionhq/client";

const notion = new Client({ auth: process.env.NOTION_TOKEN });

const DATABASE_ID = process.env.NOTION_DATABASE_ID; // your Notion database ID (NOT the URL)
const OUT_FILE = process.env.OUT_FILE || "data/sneakers.json";

function pickText(rt = []) {
  return rt.map(t => t.plain_text).join("").trim();
}

function getProp(page, name) {
  return page.properties?.[name];
}

function getTitle(page, propName) {
  const p = getProp(page, propName);
  if (!p) return "";
  if (p.type === "title") return pickText(p.title);
  return "";
}

function getSelect(page, propName) {
  const p = getProp(page, propName);
  if (!p) return "";
  if (p.type === "select") return p.select?.name || "";
  return "";
}

function getRichText(page, propName) {
  const p = getProp(page, propName);
  if (!p) return "";
  if (p.type === "rich_text") return pickText(p.rich_text);
  return "";
}

function getDate(page, propName) {
  const p = getProp(page, propName);
  if (!p) return "";
  if (p.type === "date") return p.date?.start || "";
  return "";
}

function getFiles(page, propName) {
  const p = getProp(page, propName);
  if (!p) return [];
  if (p.type !== "files") return [];
  return (p.files || [])
    .map(f => {
      const url = f.type === "external" ? f.external?.url : f.file?.url;
      return url ? { name: f.name, url } : null;
    })
    .filter(Boolean);
}

async function fetchAllRows() {
  let results = [];
  let cursor = undefined;

  while (true) {
    const resp = await notion.databases.query({
      database_id: DATABASE_ID,
      start_cursor: cursor,
      page_size: 100,
    });

    results = results.concat(resp.results);
    if (!resp.has_more) break;
    cursor = resp.next_cursor;
  }
  return results;
}

async function main() {
  if (!process.env.NOTION_TOKEN) throw new Error("Missing NOTION_TOKEN env var");
  if (!DATABASE_ID) throw new Error("Missing NOTION_DATABASE_ID env var");

  const rows = await fetchAllRows();

  const sneakers = rows.map(page => {
    const model = getTitle(page, "Model") || "";
    const brand = getSelect(page, "Brand") || "";
    const colorway = getRichText(page, "Colorway") || "";
    const releaseDate = getDate(page, "Release Date") || "";
    const photos = getFiles(page, "Photos");

    return {
      id: page.id,
      model,
      brand,
      colorway,
      releaseDate,
      photos,
      notionUrl: page.url,
      lastEdited: page.last_edited_time,
    };
  });

  // Sort by release date (ascending), then model
  sneakers.sort((a, b) => {
    const da = a.releaseDate || "";
    const db = b.releaseDate || "";
    if (da !== db) return da.localeCompare(db);
    return (a.model || "").localeCompare(b.model || "");
  });

  const outPath = path.resolve(OUT_FILE);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify({ updatedAt: new Date().toISOString(), sneakers }, null, 2));
  console.log(`Wrote ${sneakers.length} rows to ${OUT_FILE}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
