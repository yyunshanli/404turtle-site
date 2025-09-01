// ===== collector.js (STATIC + PERFORMANCE + ACTIVITY) =====

// local buffering
const Q_KEY = "collector_queue_v1";
const MAX_QUEUE = 10000;
const RETRY_MS = 4000;

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
function _enqueue(item) {
  // Backpressure: drop oldest
  if (_q.length >= MAX_QUEUE) _q.shift();
  _q.push(item);
  _saveQ();
}
_loadQ();

// Try to send one queued item; if it fails, put it back at the front
async function _trySendOne() {
  if (!_q.length || !navigator.onLine) return;
  const env = _q.shift();
  _saveQ();
  const { __endpoint, payload } = env;
  const body = JSON.stringify(payload);

  try {
    if (document.visibilityState === "hidden" && navigator.sendBeacon) {
      const ok = navigator.sendBeacon(
        __endpoint,
        new Blob([body], { type: "application/json" })
      );
      if (!ok) throw new Error("sendBeacon failed");
      return;
    }
    const resp = await fetch(__endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
    if (!resp.ok) throw new Error("HTTP " + resp.status);
  } catch (e) {
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
      /* ignore; will retry next tick */
    }
  }, RETRY_MS);
}
_scheduleRetry();

// Also retry when we come back online / tab becomes visible
addEventListener("online", () => _trySendOne());
addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") _trySendOne();
});

// Drain as much as we can on pagehide (Safari-friendly)
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

// stable session id
function genId() {
  return Math.random().toString(36).slice(2) + Date.now();
}
const SID_KEY = "collector_sid";
let sessionId =
  localStorage.getItem(SID_KEY) ||
  (localStorage.setItem(SID_KEY, genId()), localStorage.getItem(SID_KEY));

// tiny sender
async function postJSON(path, payload) {
  const env = { __endpoint: path, payload }; // envelope kept only locally
  if (!navigator.onLine) {
    _enqueue(env);
    return;
  }

  try {
    await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload), // <-- send payload only
      keepalive: true,
    });
  } catch {
    _enqueue(env);
    _scheduleRetry();
  }
}

// -------- helpers --------
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

// -------- static snapshot (sync) --------
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

// -------- minimal performance block (after load) --------
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
      const start = Math.round(performance.timeOrigin + startRel); // ms since epoch
      const end = Math.round(performance.timeOrigin + endRel);
      const totalMs = Math.max(0, Math.round(endRel - startRel));
      return { raw, start, end, totalMs };
    }
  } catch {}
  return {};
}

// -------- ACTIVITY --------
function sendEvent(type, extra) {
  postJSON("/json/events", base({ type, ...extra }));
}

// idle ≥ 2s
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

// errors
window.addEventListener("error", (e) => {
  sendEvent("error", {
    error: {
      message: e.message || "",
      source: e.filename || "",
      lineno: e.lineno || null,
      colno: e.colno || null,
    },
  });
});
window.addEventListener("unhandledrejection", (e) => {
  sendEvent("error", {
    error: { message: String(e?.reason || "unhandledrejection") },
  });
});

// mouse + clicks + scroll
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

// keyboard
window.addEventListener(
  "keydown",
  (e) => {
    sendEvent("key", { phase: "down", key: e.key, code: e.code });
    markActivity();
  },
  { passive: true }
);
window.addEventListener(
  "keyup",
  (e) => {
    sendEvent("key", { phase: "up", key: e.key, code: e.code });
    markActivity();
  },
  { passive: true }
);

window.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") {
    _trySendOne();
  } else if (document.visibilityState === "visible") {
    _trySendOne();
  }
});

// entered + leaving page
sendEvent("enter"); // when script runs (user entered)
window.addEventListener("beforeunload", () => {
  const now = Date.now();
  if (idleStart && now - idleStart >= IDLE_MS) {
    postJSON(
      "/json/events",
      base({ type: "idle", endedAt: now, durationMs: now - idleStart })
    );
  }
  postJSON("/json/events", base({ type: "leave" }));
});

// -------- init — wait for full load so timings are final --------
function boot() {
  const onLoad = async () => {
    const staticSync = getStaticSync();
    const [imagesEnabled, cssEnabled] = await Promise.all([
      detectImagesEnabled(),
      Promise.resolve(detectCssEnabled()),
    ]);
    const performance = getPerformanceBlock();

    // one combined POST: static + performance
    await postJSON(
      "/json/events",
      base({
        type: "pageview",
        static: { ...staticSync, imagesEnabled, cssEnabled },
        performance,
      })
    );

    console.log("collector sessionId:", sessionId);
  };

  if (document.readyState === "complete") onLoad();
  else window.addEventListener("load", onLoad, { once: true });
}

boot();
