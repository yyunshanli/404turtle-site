//ollector.js (STATIC ONLY → /json/events)

// session id (stable across pageviews)
function genId() { return Math.random().toString(36).slice(2) + Date.now(); }
const SID_KEY = "collector_sid";
let sessionId = localStorage.getItem(SID_KEY) || (localStorage.setItem(SID_KEY, genId()), localStorage.getItem(SID_KEY));

// tiny sender
async function postJSON(path, payload) {
  console.log("Sending payload to", path, payload); // <-- debug log
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      keepalive: true
    });
    return { ok: res.ok, status: res.status };
  } catch (e) {
    return { ok: false, status: 0 };
  }
}

// detectors
function detectImagesEnabled() {
  return new Promise((resolve) => {
    const img = new Image();
    let done = false;
    img.onload = () => { if (!done) { done = true; resolve(true); } };
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

// base static block
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

// init
async function init() {
  // send sync static first
  const base = getStaticSync();
  await postJSON("/json/events", base);

  // add async bits (images/css)
  const imagesEnabled = await detectImagesEnabled();
  const cssEnabled = detectCssEnabled();
  await postJSON("/json/events", { ...getStaticSync(), imagesEnabled, cssEnabled });

  console.log("collector (static only) sessionId:", sessionId);
}

// boot
if (document.readyState === "complete" || document.readyState === "interactive") init();
else window.addEventListener("DOMContentLoaded", init);
