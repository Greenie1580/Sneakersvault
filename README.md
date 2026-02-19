# Sneakersvault Notion Sync (Safe)

This setup keeps your Notion token **off** the public website.

## What it does
- GitHub Action (server-side) pulls your Notion database every 6 hours
- Writes `data/sneakers.json` into the repo
- Your GitHub Pages site loads `data/sneakers.json` at runtime

## One-time setup (10 minutes)

### 1) Create a Notion integration + share the DB
- Notion → Settings & members → Connections / Integrations → **Develop or manage integrations**
- Create an integration, copy the **Internal Integration Secret**
- In Notion, open your sneaker database → **Share** → invite the integration

### 2) Add GitHub Secrets (repo settings)
Repo → Settings → Secrets and variables → Actions → New repository secret
- `NOTION_TOKEN` = your Notion integration secret
- `NOTION_DATABASE_ID` = `acd384e2-2958-4b7a-b6d1-f283c3b68a27`

### 3) Commit these files
- `index.html` (updated)
- `data/sneakers.json` (template, will be overwritten by sync)
- `scripts/notion-export.mjs`
- `package.json`
- `.github/workflows/notion-sync.yml`

### 4) Run the workflow once
Repo → Actions → **Sync Notion Sneakers** → Run workflow

## Notes
- Notion rows are treated as read-only on the site (Open in Notion button).
- Local adds/edits still work and save to localStorage.
