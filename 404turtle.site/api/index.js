// /var/www/404turtle.site/api/index.js
const express = require("express");
const pool = require("./db");
const path = require("path");

const app = express();
app.use(express.json());

// --- Health ---
app.get("/health", (req, res) => res.json({ ok: true }));

// --- STATIC TABLE (Checkpoint 2) ---
// Seed from file if available, else use a couple of demo rows.
app.get("/static", async (req, res) => {
  const limit = Math.min(Number(req.query.limit || 1000), 5000);
  const offset = Number(req.query.offset || 0);
  const [rows] = await pool.query(
    "SELECT * FROM static ORDER BY id DESC LIMIT ? OFFSET ?",
    [limit, offset]
  );
  res.json(rows);
});

app.get("/static/:id", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM static WHERE id = ?", [
    req.params.id,
  ]);
  if (!rows.length) return res.sendStatus(404);
  res.json(rows[0]);
});

app.post("/static", async (req, res) => {
  // accept either a flat static row or a pageview shape with { static: {...} }
  const s = req.body.static ? { ...req.body, ...req.body.static } : req.body;
  const params = [
    s.sessionId,
    s.pageUrl,
    s.path,
    s.referrer || "",
    s.timestamp,
    s.userAgent,
    s.language,
    s.cookiesEnabled,
    s.jsEnabled,
    s.imagesEnabled,
    s.cssEnabled,
    s.screen?.w,
    s.screen?.h,
    s.viewport?.w,
    s.viewport?.h,
    s.networkType,
  ];
  const [r] = await pool.query(
    `INSERT INTO static
 (session_id, page_url, path, referrer, ts, user_agent, language,
  cookies_enabled, js_enabled, images_enabled, css_enabled,
  screen_w, screen_h, viewport_w, viewport_h, network_type)
 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    params
  );
  res.set("Location", `/api/static/${r.insertId}`);
  res.status(201).json({ id: r.insertId, ...req.body });
});

app.put("/static/:id", async (req, res) => {
  // simple full update; for partial updates you could build SET dynamically
  const s = req.body;
  const [r] = await pool.query(
    `UPDATE static SET
 session_id=?, page_url=?, path=?, referrer=?, ts=?, user_agent=?, language=?,
 cookies_enabled=?, js_enabled=?, images_enabled=?, css_enabled=?,
 screen_w=?, screen_h=?, viewport_w=?, viewport_h=?, network_type=?
 WHERE id=?`,
    [
      s.sessionId,
      s.pageUrl,
      s.path,
      s.referrer || "",
      s.timestamp,
      s.userAgent,
      s.language,
      s.cookiesEnabled,
      s.jsEnabled,
      s.imagesEnabled,
      s.cssEnabled,
      s.screen?.w,
      s.screen?.h,
      s.viewport?.w,
      s.viewport?.h,
      s.networkType,
      req.params.id,
    ]
  );
  if (!r.affectedRows) return res.sendStatus(404);
  const [rows] = await pool.query("SELECT * FROM static WHERE id=?", [
    req.params.id,
  ]);
  res.json(rows[0]);
});

app.delete("/static/:id", async (req, res) => {
  const [r] = await pool.query("DELETE FROM static WHERE id = ?", [
    req.params.id,
  ]);
  res.sendStatus(r.affectedRows ? 204 : 404);
});

// ---- start
app.listen(4000, () => console.log("API listening on :4000"));
