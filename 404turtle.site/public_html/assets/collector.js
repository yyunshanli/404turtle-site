// ===== collector.js (STATIC + PERFORMANCE • single POST, example-shaped payload) =====

// stable session id
function genId() { return Math.random().toString(36).slice(2) + Date.now(); }
const SID_KEY = "collector_sid";
let sessionId = localStorage.getItem(SID_KEY) || (localStorage.setItem(SID_KEY, genId()), localStorage.getItem(SID_KEY));

// tiny sender
async function postJSON(path, payload) {
  console.log("POST", path, payload);
  try {
    await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true
    });
  } catch {}
}

// detectors
function detectImagesEnabled() {
  return new Promise((resolve) => {
    const img = new Image();
    let done = false;
    img.onload  = () => { if (!done) { done = true; resolve(true); } };
    img.onerror = () => { if (!done) { done = true; resolve(false); } };
    img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
    setTimeout(() => { if (!done) resolve(true); }, 300);
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
  } catch { return null; }
}

// static (sync)
function getStaticSync() {
  return {
    ua: navigator.userAgent || "",
    lang: navigator.language || "",
    cookiesEnabled: navigator.cookieEnabled ?? null,
    jsEnabled: true,
    screen: { w: screen?.width ?? null, h: screen?.height ?? null },
    viewport: { w: window.innerWidth, h: window.innerHeight },
    network: navigator.connection?.effectiveType || null
  };
}

// performance (after load), shaped like your example
function getPerformanceBlock() {
  let performanceBlock = {};
  const nav = performance.getEntriesByType && performance.getEntriesByType("navigation")[0];

  if (nav && nav.toJSON) {
    const j = nav.toJSON();
    const start = j.startTime || 0;
    let end = j.loadEventEnd || j.domComplete || j.responseEnd || j.duration || 0;
    if (!end || end <= start) end = performance.now();
    performanceBlock = { raw: j, start, end, totalMs: Math.max(0, end - start) };
  } else if (performance.timing) {
    const t = performance.timing;
    const start = t.navigationStart || 0;
    let end = t.loadEventEnd || t.domComplete || t.responseEnd || 0;
    if (!end || end <= start) end = Date.now();
    performanceBlock = { raw: t, start, end, totalMs: Math.max(0, end - start) };
  }
  return performanceBlock;
}

// init — send one combined payload after full load
function boot() {
  const onLoad = async () => {
    const staticBase = getStaticSync();
    const [imagesEnabled, cssEnabled] = await Promise.all([
      detectImagesEnabled(),
      Promise.resolve(detectCssEnabled())
    ]);
    const performanceBlock = getPerformanceBlock();

    const payload = {
      type: "pageview",
      ts: Date.now(),
      sessionId,
      url: location.href,
      path: location.pathname,
      referrer: document.referrer || null,
      static: { ...staticBase, imagesEnabled, cssEnabled },
      performance: performanceBlock
    };

    await postJSON("/events", payload);
    console.log("collector (static + perf) sessionId:", sessionId);
  };

  if (document.readyState === "complete") onLoad();
  else window.addEventListener("load", onLoad, { once: true });
}

boot();
