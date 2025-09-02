// /var/www/404turtle.site/api/index.js
const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

// --- Health ---
app.get("/health", (req, res) => res.json({ ok: true }));

// --- STATIC TABLE (Checkpoint 2) ---
// Seed from file if available, else use a couple of demo rows.
const storePath = path.join(__dirname, "static.seed.json");
let staticRows;
try {
  staticRows = JSON.parse(fs.readFileSync(storePath, "utf8"));
} catch {
  staticRows = [
    {
      id: 1,
      type: "static",
      sessionId: "demo1",
      pageUrl: "https://404turtle.site/",
      path: "/",
      referrer: "",
      timestamp: Date.now(),
      userAgent:
        "Mozilla/5.0 (Macintosh) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139 Safari/537.36",
      language: "en-US",
      cookiesEnabled: true,
      jsEnabled: true,
      imagesEnabled: true,
      cssEnabled: true,
      screen: { w: 1440, h: 900 },
      viewport: { w: 1200, h: 800 },
      networkType: "4g",
    },
    {
      id: 2,
      type: "static",
      sessionId: "demo2",
      pageUrl: "https://404turtle.site/another",
      path: "/another",
      referrer: "",
      timestamp: Date.now() - 10000,
      userAgent: "seed-UA-2",
      language: "en-US",
      cookiesEnabled: true,
      jsEnabled: true,
      imagesEnabled: true,
      cssEnabled: true,
      screen: { w: 1920, h: 1080 },
      viewport: { w: 1280, h: 720 },
      networkType: "wifi",
    },
  ];
}
let nextId = staticRows.reduce((m, r) => Math.max(m, Number(r.id) || 0), 0) + 1;

// (Optional) persist to file across restarts — uncomment save() calls below if you want.
function save() {
  try {
    fs.writeFileSync(storePath, JSON.stringify(staticRows, null, 2));
  } catch {}
}

// GET /api/static  -> list all
app.get("/static", (req, res) => res.json(staticRows));

// GET /api/static/:id -> one
app.get("/static/:id", (req, res) => {
  const id = Number(req.params.id);
  const row = staticRows.find((r) => Number(r.id) === id);
  if (!row) return res.sendStatus(404);
  res.json(row);
});

// POST /api/static -> create
app.post("/static", (req, res) => {
  const row = { id: nextId++, ...req.body };
  staticRows.push(row);
  // save();
  res.set("Location", `/api/static/${row.id}`);
  res.status(201).json(row);
});

// PUT /api/static/:id -> update
app.put("/static/:id", (req, res) => {
  const id = Number(req.params.id);
  const i = staticRows.findIndex((r) => Number(r.id) === id);
  if (i < 0) return res.sendStatus(404);
  staticRows[i] = { ...staticRows[i], ...req.body, id };
  // save();
  res.json(staticRows[i]);
});

// DELETE /api/static/:id -> delete
app.delete("/static/:id", (req, res) => {
  const id = Number(req.params.id);
  const before = staticRows.length;
  staticRows = staticRows.filter((r) => Number(r.id) !== id);
  // save();
  if (staticRows.length === before) return res.sendStatus(404);
  res.sendStatus(204);
});

// --- start server ---
const PORT = 4000;
app.listen(PORT, () => console.log(`API listening on :${PORT}`));
