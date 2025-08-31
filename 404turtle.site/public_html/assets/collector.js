// ===== collector.js (STATIC + MINIMAL PERFORMANCE • single POST) =====

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

// static snapshot (sync)
function getStaticSync() {
  return {
    sessionId,
    timestamp: Date.now(),
    pageUrl: location.href,
    path: location.pathname,
    referrer: document.referrer || "",
    userAgent: navigator.userAgent || "",
    language: navigator.language || "",
    cookiesEnabled: navigator.cookieEnabled ?? null,
    jsEnabled: true,
    screen: { w: screen?.width ?? null, h: screen?.height ?? null },
    viewport: { w: window.innerWidth, h: window.innerHeight },
    networkType: navigator.connection?.effectiveType || null
  };
}

// minimal performance block (after load)
function getPerformanceBlock() {
  try {
    const nav = performance.getEntriesByType?.("navigation")?.[0];
    if (nav?.toJSON) {
      const raw = nav.toJSON(); // whole timing object
      const startRel = raw.startTime || 0;
      let endRel = raw.loadEventEnd || raw.domComplete || raw.responseEnd || raw.duration || 0;
      if (!endRel || endRel <= startRel) endRel = performance.now();
      const start = Math.round(performance.timeOrigin + startRel); // ms since epoch
      const end   = Math.round(performance.timeOrigin + endRel);
      const totalMs = Math.max(0, Math.round(endRel - startRel));
      return { raw, start, end, totalMs };
    }
    // legacy
    if (performance.timing) {
      const t = performance.timing;
      const start = t.navigationStart || 0;
      let end = t.loadEventEnd || t.domComplete || t.responseEnd || 0;
      if (!end || end <= start) end = Date.now();
      const totalMs = Math.max(0, end - start);
      const raw = {
        navigationStart: t.navigationStart,
        loadEventEnd: t.loadEventEnd,
        domComplete: t.domComplete,
        responseEnd: t.responseEnd
      };
      return { raw, start, end, totalMs };
    }
  } catch {}
  return {};
}

// init — wait for full load so timings are final
function boot() {
  const onLoad = async () => {
    const base = getStaticSync();
    const [imagesEnabled, cssEnabled] = await Promise.all([
      detectImagesEnabled(),
      Promise.resolve(detectCssEnabled())
    ]);
    const performance = getPerformanceBlock();

    // single combined POST
    await postJSON("/json/events", { ...base, imagesEnabled, cssEnabled, performance });

    console.log("collector sessionId:", sessionId);
  };

  if (document.readyState === "complete") onLoad();
  else window.addEventListener("load", onLoad, { once: true });
}

boot();
