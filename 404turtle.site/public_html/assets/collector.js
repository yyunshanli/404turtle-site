// collector.js

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

// detect helpers
function detectImagesEnabled() {
  return new Promise((resolve) => {
    const img = new Image();
    let done = false;
    img.onload  = () => { if (!done) { done = true; resolve(true); } };
    img.onerror = () => { if (!done) { done = true; resolve(false); } };
    img.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==";
    setTimeout(() => { if (!done) resolve(true); }, 300); // fallback
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

// build static block (sync)
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

// init: wait for DOM so CSS detection works reliably
async function init() {
  // sync info first
  const base = getStaticSync();
  // async detections
  const [imagesEnabled, cssEnabled] = await Promise.all([
    detectImagesEnabled(),
    Promise.resolve(detectCssEnabled())
  ]);

  // single combined POST
  await postJSON("/events", { ...base, imagesEnabled, cssEnabled });

  console.log("collector (static) sessionId:", sessionId);
}

if (document.readyState === "complete" || document.readyState === "interactive") init();
else window.addEventListener("DOMContentLoaded", init);
