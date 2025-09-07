// assets/collector.js

// Config
const Q_KEY = "collector_queue_v1";
const SID_KEY = "collector_sid";
const MAX_QUEUE = 10000;
const RETRY_MS = 4000;

const API_STATIC = "/api/static";
const API_PERF = "/api/performance";
const API_ACTIVITY = "/api/activity";

// Small helpers
function genId() {
  return Math.random().toString(36).slice(2) + Date.now();
}

function throttle(fn, ms) {
  let last = 0;
  return (...args) => {
    const now = Date.now();
    if (now - last >= ms) {
      last = now;
      fn(...args);
    }
  };
}

function base(extra = {}) {
  return {
    sessionId,
    timestamp: Date.now(),
    pageUrl: location.href,
    path: location.pathname,
    referrer: document.referrer || "",
    ...extra,
  };
}

// Queue
let _q = [];
function _loadQ() {
  try {
    _q = JSON.parse(localStorage.getItem(Q_KEY) || "[]");
  } catch {
    _q = [];
  }
}
function _saveQ() {
  try {
    localStorage.setItem(Q_KEY, JSON.stringify(_q));
  } catch {}
}
function _enqueue(env) {
  if (_q.length >= MAX_QUEUE) _q.shift();
  _q.push(env);
  _saveQ();
}
_loadQ();

// Try to send a single queued envelope
async function _trySendOne() {
  if (!_q.length || !navigator.onLine) return;
  const env = _q.shift();
  _saveQ();

  const body = JSON.stringify(env.payload);

  try {
    if (document.visibilityState === "hidden" && navigator.sendBeacon) {
      const ok = navigator.sendBeacon(
        env.__endpoint,
        new Blob([body], { type: "application/json" })
      );
      if (!ok) throw new Error("sendBeacon failed");
      return;
    }
    const resp = await fetch(env.__endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
      credentials: "include",
    });
    if (!resp.ok) throw new Error("HTTP " + resp.status);
  } catch (e) {
    // Put it back to the front and try again later
    _q.unshift(env);
    _saveQ();
    throw e;
  }
}

let _retryTimer = null;
function _scheduleRetry() {
  if (_retryTimer) return;
  _retryTimer = setInterval(async () => {
    if (!_q.length) return;
    try {
      await _trySendOne();
    } catch {
      /* keep trying */
    }
  }, RETRY_MS);
}
_scheduleRetry();

addEventListener("online", () => _trySendOne());
addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") _trySendOne();
});

addEventListener("pagehide", () => {
  if (!_q.length || !navigator.sendBeacon) return;
  for (const env of _q) {
    const body = new Blob([JSON.stringify(env.payload)], {
      type: "application/json",
    });
    navigator.sendBeacon(env.__endpoint, body);
  }
  _q = [];
  _saveQ();
});

// Session id
let sessionId =
  localStorage.getItem(SID_KEY) ||
  (localStorage.setItem(SID_KEY, genId()), localStorage.getItem(SID_KEY));

// Sender
async function postJSON(endpoint, payload) {
  const env = { __endpoint: endpoint, payload };

  if (!navigator.onLine) {
    _enqueue(env);
    return;
  }

  try {
    await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true,
      credentials: "include",
    });
  } catch {
    _enqueue(env);
    _scheduleRetry();
  }
}

// Feature detection
function detectImagesEnabled() {
  return new Promise((resolve) => {
    const img = new Image();
    let done = false;
    img.onload = () => {
      if (!done) {
        done = true;
        resolve(true);
      }
    };
    img.onerror = () => {
      if (!done) {
        done = true;
        resolve(false);
      }
    };
    img.src =
      "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
    setTimeout(() => {
      if (!done) resolve(true);
    }, 300);
  });
}
function detectCssEnabled() {
  try {
    const el = document.createElement("div");
    el.style.position = "absolute";
    el.style.left = "-9999px";
    el.style.width = "10px";
    document.body.appendChild(el);
    const w = parseInt(getComputedStyle(el).width || "0", 10);
    el.remove();
    return w === 10;
  } catch {
    return null;
  }
}

// Performance block
function getPerformanceBlock() {
  try {
    const nav = performance.getEntriesByType?.("navigation")?.[0];
    if (nav?.toJSON) {
      const raw = nav.toJSON();
      const startRel = raw.startTime || 0;
      let endRel =
        raw.loadEventEnd ||
        raw.domComplete ||
        raw.responseEnd ||
        raw.duration ||
        0;
      if (!endRel || endRel <= startRel) endRel = performance.now();
      const start = Math.round(performance.timeOrigin + startRel); // epoch ms
      const end = Math.round(performance.timeOrigin + endRel);
      const totalMs = Math.max(0, Math.round(endRel - startRel));
      return { raw, start, end, totalMs };
    }
  } catch {}
  return {};
}

// Activity events
function sendEvent(type, extra = {}) {
  postJSON(API_ACTIVITY, base({ type, ...extra }));
}

// Idle detection
const IDLE_MS = 2000;
let lastActivity = Date.now();
let idleStart = null;

function markActivity() {
  const now = Date.now();
  if (idleStart && now - idleStart >= IDLE_MS) {
    sendEvent("idle", { endedAt: now, durationMs: now - idleStart });
  }
  idleStart = null;
  lastActivity = now;
}

setInterval(() => {
  if (!idleStart && Date.now() - lastActivity >= IDLE_MS) {
    idleStart = lastActivity + IDLE_MS;
  }
}, 500);

// Error listeners
addEventListener("error", (e) => {
  sendEvent("error", {
    error: {
      message: e.message || "",
      source: e.filename || "",
      lineno: e.lineno || null,
      colno: e.colno || null,
    },
  });
});
addEventListener("unhandledrejection", (e) => {
  sendEvent("error", {
    error: { message: String(e?.reason || "unhandledrejection") },
  });
});

// Mouse / click / scroll
document.addEventListener(
  "mousemove",
  throttle((e) => {
    sendEvent("mousemove", { x: e.clientX, y: e.clientY });
    markActivity();
  }, 100)
);
document.addEventListener(
  "click",
  (e) => {
    sendEvent("click", { button: e.button, x: e.clientX, y: e.clientY });
    markActivity();
  },
  true
);
document.addEventListener(
  "scroll",
  throttle(() => {
    sendEvent("scroll", { x: window.scrollX, y: window.scrollY });
    markActivity();
  }, 200),
  { passive: true }
);

// Keyboard
addEventListener(
  "keydown",
  (e) => {
    sendEvent("key", { phase: "down", key: e.key, code: e.code });
    markActivity();
  },
  { passive: true }
);
addEventListener(
  "keyup",
  (e) => {
    sendEvent("key", { phase: "up", key: e.key, code: e.code });
    markActivity();
  },
  { passive: true }
);

// Visibility change
addEventListener("visibilitychange", () => {
  _trySendOne();
});

// Page enter / leave
sendEvent("enter");

addEventListener("beforeunload", () => {
  const now = Date.now();
  const payloads = [];

  if (idleStart && now - idleStart >= IDLE_MS) {
    payloads.push(
      base({ type: "idle", endedAt: now, durationMs: now - idleStart })
    );
  }
  payloads.push(base({ type: "leave" }));

  if (navigator.sendBeacon) {
    for (const p of payloads) {
      const body = new Blob([JSON.stringify(p)], { type: "application/json" });
      navigator.sendBeacon(API_ACTIVITY, body);
    }
  } else {
    for (const p of payloads) postJSON(API_ACTIVITY, p);
  }
});

// Boot
function boot() {
  const onLoad = async () => {
    try {
      const staticSync = getStaticSync();
      const [imagesEnabled, cssEnabled] = await Promise.all([
        detectImagesEnabled(),
        Promise.resolve(detectCssEnabled()),
      ]);
      const performance = getPerformanceBlock();

      // Performance row
      const perfRow = base({
        type: "performance",
        navStart: performance.start ?? null,
        loadEnd: performance.end ?? null,
        totalMs: performance.totalMs ?? null,
        raw: performance.raw || null,
      });
      await postJSON(API_PERF, perfRow);

      // Static row
      const staticRow = base({
        type: "static",
        userAgent: staticSync.userAgent,
        language: staticSync.language,
        cookiesEnabled: staticSync.cookiesEnabled,
        jsEnabled: true,
        imagesEnabled,
        cssEnabled,
        screen: staticSync.screen,
        viewport: staticSync.viewport,
        networkType: staticSync.networkType,
      });
      await postJSON(API_STATIC, staticRow);

      console.log("collector sessionId:", sessionId);
    } catch (e) {
      console.warn("collector boot error:", e);
    }
  };

  if (document.readyState === "complete") onLoad();
  else addEventListener("load", onLoad, { once: true });
}

function getStaticSync() {
  return {
    userAgent: navigator.userAgent || "",
    language: navigator.language || "",
    cookiesEnabled: navigator.cookieEnabled ?? null,
    jsEnabled: true,
    screen: { w: screen?.width ?? null, h: screen?.height ?? null },
    viewport: { w: window.innerWidth, h: window.innerHeight },
    networkType: navigator.connection?.effectiveType || null,
  };
}

boot();
