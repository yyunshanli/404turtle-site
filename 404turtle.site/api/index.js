// /var/www/404turtle.site/api/index.js
const express = require("express");
const pool = require("./db.cjs");

const app = express();

// ---------- core middleware ----------
app.use(express.json({ limit: "1mb" }));
app.set("etag", false);

// CORS (allow dashboard origins)
const ALLOWED = new Set([
  "https://404turtle.site",
  "https://www.404turtle.site",
]);
app.use((req, res, next) => {
  const origin = req.get("Origin");
  if (origin && ALLOWED.has(origin)) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Vary", "Origin");
    res.set("Access-Control-Allow-Credentials", "true");
    res.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    res.set("Access-Control-Expose-Headers", "Location, X-Total-Count");
    if (req.method === "OPTIONS") return res.sendStatus(204);
  }
  next();
});

// no-store for API + light access log for /activity
app.use((req, res, next) => {
  if (req.path.startsWith("/activity")) {
    console.log("HIT", req.method, req.originalUrl);
  }
  res.set("Cache-Control", "no-store");
  next();
});

// ---------- helpers ----------
app.get("/_routes", (req, res) => {
  const routes = [];
  app._router.stack.forEach((m) => {
    if (m.route && m.route.path) {
      routes.push({ methods: m.route.methods, path: m.route.path });
    }
  });
  res.json(routes);
});

app.get("/_perfcheck", async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT COUNT(*) AS n FROM performance");
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

app.get("/health", (req, res) => res.json({ ok: true }));

// ---------- STATIC ----------
app.get("/static", async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit || 1000), 5000);
    const offset = Number(req.query.offset || 0);
    const [rows] = await pool.query(
      "SELECT * FROM static ORDER BY id DESC LIMIT ? OFFSET ?",
      [limit, offset]
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

app.get("/static/:id", async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM static WHERE id = ?", [
      req.params.id,
    ]);
    if (!rows.length) return res.sendStatus(404);
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

app.post("/static", async (req, res, next) => {
  try {
    // accept either a flat row or { static: {...} }
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
  } catch (e) {
    next(e);
  }
});

app.put("/static/:id", async (req, res, next) => {
  try {
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
  } catch (e) {
    next(e);
  }
});

app.delete("/static/:id", async (req, res, next) => {
  try {
    const [r] = await pool.query("DELETE FROM static WHERE id = ?", [
      req.params.id,
    ]);
    res.sendStatus(r.affectedRows ? 204 : 404);
  } catch (e) {
    next(e);
  }
});

// ---------- PERFORMANCE ----------
app.get("/performance", async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit || 1000), 5000);
    const offset = Number(req.query.offset || 0);
    const [rows] = await pool.query(
      "SELECT * FROM performance ORDER BY id DESC LIMIT ? OFFSET ?",
      [limit, offset]
    );
    res.json(rows);
  } catch (e) {
    next(e);
  }
});

app.get("/performance/:id", async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM performance WHERE id = ?", [
      req.params.id,
    ]);
    if (!rows.length) return res.sendStatus(404);
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

app.post("/performance", async (req, res, next) => {
  try {
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
  } catch (e) {
    next(e);
  }
});

app.put("/performance/:id", async (req, res, next) => {
  try {
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
  } catch (e) {
    next(e);
  }
});

app.delete("/performance/:id", async (req, res, next) => {
  try {
    const [r] = await pool.query("DELETE FROM performance WHERE id=?", [
      req.params.id,
    ]);
    res.sendStatus(r.affectedRows ? 204 : 404);
  } catch (e) {
    next(e);
  }
});

// ---------- Activity helpers (normalize + clamp) ----------
const toInt = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : null;
};

// IMPORTANT: Make sure your DB enum includes 'pageview'.
// ALTER TABLE `activity` MODIFY COLUMN `type` ENUM('enter','leave','mousemove','click','scroll','key','idle','error','pageview') NOT NULL;
const TYPE_OK = new Set([
  "enter",
  "leave",
  "mousemove",
  "scroll",
  "click",
  "key",
  "error",
  "idle",
  "pageview",
]);

function normalizeType(tRaw) {
  const t = String(tRaw || "").toLowerCase();
  if (TYPE_OK.has(t)) return t;
  if (t === "pagehide" || t === "page-hide" || t === "page_hide")
    return "leave";
  if (t === "view" || t === "pv" || t === "page-view" || t === "page_view")
    return "pageview";
  return "enter";
}

// ---------- ACTIVITY ----------
app.get("/activity", async (req, res, next) => {
  try {
    const limit = Math.min(
      parseInt(
        req.query["page-size"] || req.query.pageSize || req.query.limit || 50,
        10
      ),
      500
    );
    const page = Math.max(parseInt(req.query.page || 1, 10), 1);
    const offset = (page - 1) * limit;

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
  } catch (e) {
    next(e);
  }
});

app.get("/activity/:id", async (req, res, next) => {
  try {
    const [rows] = await pool.query("SELECT * FROM activity WHERE id = ?", [
      req.params.id,
    ]);
    if (!rows.length) return res.sendStatus(404);
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

app.post("/activity", async (req, res, next) => {
  try {
    const a = req.body || {};

    const sessionId = String(a.sessionId || "");
    const ts = toInt(a.timestamp) || Date.now();
    const pageUrl = String(a.pageUrl || "").slice(0, 2048);

    let path = String(a.path || "");
    if (!path && pageUrl) {
      try {
        path = new URL(pageUrl).pathname;
      } catch {}
    }
    path = path.slice(0, 512); // match schema: VARCHAR(512)

    const type = normalizeType(a.type);
    const x = toInt(a.x ?? a.clientX ?? a.pageX);
    const y = toInt(a.y ?? a.clientY ?? a.pageY);
    const button = toInt(a.button);
    let keyCode = a.code ?? a.key ?? null;
    keyCode = keyCode == null ? null : String(keyCode).slice(0, 64); // VARCHAR(64)
    const scrollX = toInt(
      a.scroll_x ?? a.scrollX ?? (type === "scroll" ? a.x : null)
    );
    const scrollY = toInt(
      a.scroll_y ?? a.scrollY ?? (type === "scroll" ? a.y : null)
    );
    const durationMs = toInt(a.durationMs ?? a.duration_ms);
    const err = a.error ? JSON.stringify(a.error).slice(0, 4000) : null;

    const [r] = await pool.query(
      `INSERT INTO activity
       (session_id, page_url, path, ts, type, x, y, button, key_code, scroll_x, scroll_y, duration_ms, error)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        sessionId,
        pageUrl,
        path,
        ts,
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
    res.status(201).json({ id: r.insertId });
  } catch (e) {
    next(e);
  }
});

app.put("/activity/:id", async (req, res, next) => {
  try {
    const a = req.body || {};

    const sessionId = String(a.sessionId || "");
    const ts = toInt(a.timestamp) || Date.now();
    const pageUrl = String(a.pageUrl || "").slice(0, 2048);

    let path = String(a.path || "");
    if (!path && pageUrl) {
      try {
        path = new URL(pageUrl).pathname;
      } catch {}
    }
    path = path.slice(0, 512);

    const type = normalizeType(a.type);
    const x = toInt(a.x ?? a.clientX ?? a.pageX);
    const y = toInt(a.y ?? a.clientY ?? a.pageY);
    const button = toInt(a.button);
    let keyCode = a.code ?? a.key ?? null;
    keyCode = keyCode == null ? null : String(keyCode).slice(0, 64);
    const scrollX = toInt(a.scroll_x ?? a.scrollX);
    const scrollY = toInt(a.scroll_y ?? a.scrollY);
    const durationMs = toInt(a.durationMs ?? a.duration_ms);
    const err = a.error ? JSON.stringify(a.error).slice(0, 4000) : null;

    const [r] = await pool.query(
      `UPDATE activity SET
        session_id=?, page_url=?, path=?, ts=?, type=?, x=?, y=?, button=?, key_code=?, scroll_x=?, scroll_y=?, duration_ms=?, error=?
       WHERE id=?`,
      [
        sessionId,
        pageUrl,
        path,
        ts,
        type,
        x,
        y,
        button,
        keyCode,
        scrollX,
        scrollY,
        durationMs,
        err,
        req.params.id,
      ]
    );
    if (!r.affectedRows) return res.sendStatus(404);

    const [rows] = await pool.query("SELECT * FROM activity WHERE id=?", [
      req.params.id,
    ]);
    res.json(rows[0]);
  } catch (e) {
    next(e);
  }
});

app.delete("/activity/:id", async (req, res, next) => {
  try {
    const [r] = await pool.query("DELETE FROM activity WHERE id=?", [
      req.params.id,
    ]);
    res.sendStatus(r.affectedRows ? 204 : 404);
  } catch (e) {
    next(e);
  }
});

// ---------- error handler ----------
app.use((err, req, res, next) => {
  console.error("API error:", err);
  res.status(500).json({ error: err.code || "ERR", message: err.message });
});

// ---------- start ----------
app.listen(4000, () => console.log("API listening on :4000"));
