// /var/www/404turtle.site/api/index.js
const express = require("express");
const pool = require("./db.cjs");
const path = require("path");

const app = express();
app.use(express.json());

app.set("etag", false);
app.use((req, res, next) => {
  if (req.path.startsWith("/activity")) {
    console.log("HIT", req.method, req.originalUrl);
  }
  res.set("Cache-Control", "no-store");
  next();
});

app.get("/_routes", (req, res) => {
  const routes = [];
  app._router.stack.forEach((m) => {
    if (m.route && m.route.path) {
      routes.push({ methods: m.route.methods, path: m.route.path });
    }
  });
  res.json(routes);
});

// DB smoke test (checks table exists)
app.get("/_perfcheck", async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT COUNT(*) AS n FROM performance");
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

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

// ---------- /api/performance ----------
app.get("/performance", async (req, res) => {
  const limit = Math.min(Number(req.query.limit || 1000), 5000);
  const offset = Number(req.query.offset || 0);
  const [rows] = await pool.query(
    "SELECT * FROM performance ORDER BY id DESC LIMIT ? OFFSET ?",
    [limit, offset]
  );
  res.json(rows);
});

app.get("/performance/:id", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM performance WHERE id = ?", [
    req.params.id,
  ]);
  if (!rows.length) return res.sendStatus(404);
  res.json(rows[0]);
});

app.post("/performance", async (req, res) => {
  // Accept either a dedicated payload, or a pageview-style wrapper { performance: {...} }
  const b = req.body.performance
    ? { ...req.body, ...req.body.performance }
    : req.body;

  const sessionId = b.sessionId;
  const ts = b.timestamp;
  const navStart = b.navStart ?? b.navigationStart ?? b.start ?? null;
  const loadEnd = b.loadEnd ?? b.end ?? null;
  const totalMs = b.totalMs ?? null;
  const raw = b.raw ? JSON.stringify(b.raw) : null;

  const [r] = await pool.query(
    `INSERT INTO performance
     (session_id, page_url, path, ts, nav_start, load_end, total_ms, raw)
     VALUES (?,?,?,?,?,?,?,?)`,
    [sessionId, b.pageUrl, b.path, ts, navStart, loadEnd, totalMs, raw]
  );
  res.set("Location", `/api/performance/${r.insertId}`);
  res.status(201).json({ id: r.insertId, ...req.body });
});

app.put("/performance/:id", async (req, res) => {
  const b = req.body.performance
    ? { ...req.body, ...req.body.performance }
    : req.body;
  const [r] = await pool.query(
    `UPDATE performance SET
      session_id=?, page_url=?, path=?, ts=?, nav_start=?, load_end=?, total_ms=?, raw=?
     WHERE id=?`,
    [
      b.sessionId,
      b.pageUrl,
      b.path,
      b.timestamp,
      b.navStart ?? b.navigationStart ?? b.start ?? null,
      b.loadEnd ?? b.end ?? null,
      b.totalMs ?? null,
      b.raw ? JSON.stringify(b.raw) : null,
      req.params.id,
    ]
  );
  if (!r.affectedRows) return res.sendStatus(404);
  const [rows] = await pool.query("SELECT * FROM performance WHERE id=?", [
    req.params.id,
  ]);
  res.json(rows[0]);
});

app.delete("/performance/:id", async (req, res) => {
  const [r] = await pool.query("DELETE FROM performance WHERE id=?", [
    req.params.id,
  ]);
  res.sendStatus(r.affectedRows ? 204 : 404);
});

// ---------- /api/activity ----------
app.get("/activity", async (req, res) => {
  // page size & number from ZingGrid
  const limit = Math.min(
    parseInt(
      req.query["page-size"] || req.query.pageSize || req.query.limit || 50,
      10
    ),
    500
  );
  const page = Math.max(parseInt(req.query.page || 1, 10), 1);
  const offset = (page - 1) * limit;

  // filter: hide mousemoves by default
  const noMoves = ["1", "true", "yes", "on"].includes(
    String(req.query.noMoves ?? "0").toLowerCase()
  );
  const type = req.query.type;

  const where = [];
  const params = [];
  if (noMoves) where.push("type <> 'mousemove'");
  if (type) {
    where.push("type = ?");
    params.push(type);
  }
  const whereSQL = where.length ? `WHERE ${where.join(" AND ")}` : "";

  const [[{ c }]] = await pool.query(
    `SELECT COUNT(*) c FROM activity ${whereSQL}`,
    params
  );
  res.set("X-Total-Count", String(c));
  res.set("Access-Control-Expose-Headers", "X-Total-Count");

  const [rows] = await pool.query(
    `SELECT * FROM activity ${whereSQL} ORDER BY id DESC LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );
  res.json(rows);
});

app.get("/activity/:id", async (req, res) => {
  const [rows] = await pool.query("SELECT * FROM activity WHERE id = ?", [
    req.params.id,
  ]);
  if (!rows.length) return res.sendStatus(404);
  res.json(rows[0]);
});

app.post("/activity", async (req, res) => {
  const a = req.body;

  // Robust mapping for various event shapes you already send
  const type = a.type;
  const x = a.x ?? a.clientX ?? a.pageX ?? null;
  const y = a.y ?? a.clientY ?? a.pageY ?? null;
  const button = a.button ?? null;
  const keyCode = a.code ?? a.key ?? null;
  const scrollX = a.scroll_x ?? a.scrollX ?? (type === "scroll" ? a.x : null);
  const scrollY = a.scroll_y ?? a.scrollY ?? (type === "scroll" ? a.y : null);
  const durationMs = a.durationMs ?? a.duration_ms ?? null;
  const err = a.error ? JSON.stringify(a.error) : null;

  const [r] = await pool.query(
    `INSERT INTO activity
     (session_id, page_url, path, ts, type, x, y, button, key_code, scroll_x, scroll_y, duration_ms, error)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      a.sessionId,
      a.pageUrl,
      a.path,
      a.timestamp,
      type,
      x,
      y,
      button,
      keyCode,
      scrollX,
      scrollY,
      durationMs,
      err,
    ]
  );
  res.set("Location", `/api/activity/${r.insertId}`);
  res.status(201).json({ id: r.insertId, ...req.body });
});

app.put("/activity/:id", async (req, res) => {
  const a = req.body;
  const [r] = await pool.query(
    `UPDATE activity SET
      session_id=?, page_url=?, path=?, ts=?, type=?, x=?, y=?, button=?, key_code=?, scroll_x=?, scroll_y=?, duration_ms=?, error=?
     WHERE id=?`,
    [
      a.sessionId,
      a.pageUrl,
      a.path,
      a.timestamp,
      a.type,
      a.x ?? a.clientX ?? a.pageX ?? null,
      a.y ?? a.clientY ?? a.pageY ?? null,
      a.button ?? null,
      a.code ?? a.key ?? null,
      a.scroll_x ?? a.scrollX ?? null,
      a.scroll_y ?? a.scrollY ?? null,
      a.durationMs ?? a.duration_ms ?? null,
      a.error ? JSON.stringify(a.error) : null,
      req.params.id,
    ]
  );
  if (!r.affectedRows) return res.sendStatus(404);
  const [rows] = await pool.query("SELECT * FROM activity WHERE id=?", [
    req.params.id,
  ]);
  res.json(rows[0]);
});

app.delete("/activity/:id", async (req, res) => {
  const [r] = await pool.query("DELETE FROM activity WHERE id=?", [
    req.params.id,
  ]);
  res.sendStatus(r.affectedRows ? 204 : 404);
});

app.use((err, req, res, next) => {
  console.error("API error:", err);
  res.status(500).json({ error: err.code || "ERR", message: err.message });
});

// ---- start
app.listen(4000, () => console.log("API listening on :4000"));
