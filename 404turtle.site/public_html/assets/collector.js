/* collector.js */
(() => {
  // ====== config ======
  const ENDPOINT = '/api/collect';          // <-- your endpoint
  const FLUSH_INTERVAL_MS = 5000;           // periodic send
  const IDLE_THRESHOLD_MS = 2000;           // idle detection

  // ====== helpers ======
  const now = () => Date.now();
  const page = () => location.pathname + location.search + location.hash;

  const storeKey = 'c135_queue';
  const sidKey   = 'c135_sid';

  const loadQueue = () => {
    try { return JSON.parse(localStorage.getItem(storeKey) || '[]'); }
    catch { return []; }
  };
  const saveQueue = q => localStorage.setItem(storeKey, JSON.stringify(q));
  const enqueue = evt => { const q = loadQueue(); q.push(evt); saveQueue(q); };

  const getSID = () => {
    let sid = sessionStorage.getItem(sidKey);
    if (!sid) {
      sid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
      sessionStorage.setItem(sidKey, sid);
    }
    return sid;
  };

  const ship = async (payload, {beacon = false} = {}) => {
    try {
      if (beacon && navigator.sendBeacon) {
        const ok = navigator.sendBeacon(ENDPOINT, new Blob([JSON.stringify(payload)], {type: 'application/json'}));
        return ok;
      }
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        keepalive: true,
        body: JSON.stringify(payload)
      });
      return res.ok;
    } catch {
      return false;
    }
  };

  const flush = async ({beacon = false} = {}) => {
    const q = loadQueue();
    if (!q.length) return;
    const batch = {sid: getSID(), page: page(), ts: now(), batch: q};
    const ok = await ship(batch, {beacon});
    if (ok) saveQueue([]);
  };

  // ====== STATIC ======
  const detectImagesAllowed = () =>
    new Promise(resolve => {
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      // tiny 1x1 transparent gif
      img.src = 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
      setTimeout(() => resolve(true), 1500); // best-effort fallback
    });

  const detectCSSAllowed = () => {
    try {
      const test = document.createElement('div');
      test.style.position = 'absolute';
      test.style.left = '-9999px';
      test.style.width = '10px';
      document.body.appendChild(test);
      const before = getComputedStyle(test).getPropertyValue('width');
      // inject a rule and see if it applies
      const style = document.createElement('style');
      style.textContent = '#__c135_css_probe{width:20px !important}';
      document.head.appendChild(style);
      test.id = '__c135_css_probe';
      const after = getComputedStyle(test).getPropertyValue('width');
      style.remove(); test.remove();
      return before !== after;
    } catch { return false; }
  };

  const getStatic = async () => ({
    kind: 'static',
    ts: now(),
    ua: navigator.userAgent,
    lang: navigator.language || navigator.userLanguage,
    cookies: navigator.cookieEnabled,
    js: true,
    images: await detectImagesAllowed(),
    css: detectCSSAllowed(),
    screen: {w: screen.width, h: screen.height, aw: screen.availWidth, ah: screen.availHeight, pixelRatio: devicePixelRatio || 1},
    window: {w: innerWidth, h: innerHeight},
    net: (navigator.connection && (navigator.connection.effectiveType || navigator.connection.type)) || 'unknown',
  });

  // ====== PERFORMANCE (Navigation Timing Level 2 preferred) ======
  const getPerf = () => {
    const nav = performance.getEntriesByType('navigation')[0];
    let started, ended, total, raw;
    if (nav) {
      started = Math.round(nav.startTime);
      ended   = Math.round(nav.responseEnd);
      total   = ended - started;
      raw     = nav.toJSON ? nav.toJSON() : nav;
    } else {
      const t = performance.timing; // legacy
      started = t.navigationStart;
      ended   = t.loadEventEnd || t.domComplete || now();
      total   = ended - started;
      raw     = t;
    }
    return { kind: 'performance', ts: now(), started, ended, total, timing: raw };
  };

  // ====== ACTIVITY ======
  let lastActivity = now();
  let idleFrom = null;

  const markActivity = () => { lastActivity = now(); };

  const onError = (msg, src, line, col, err) => {
    enqueue({ kind:'activity', type:'error', ts: now(), msg: String(msg), src, line, col, stack: err?.stack || null });
  };
  window.addEventListener('error', e => onError(e.message, e.filename, e.lineno, e.colno, e.error));
  window.addEventListener('unhandledrejection', e => {
    enqueue({ kind:'activity', type:'promise-rejection', ts: now(), reason: String(e.reason) });
  });

  // mouse + scroll
  ['mousemove','click','mousedown','mouseup','wheel','scroll'].forEach(evt =>
    window.addEventListener(evt, e => {
      markActivity();
      const base = {kind:'activity', type:evt, ts: now()};
      if (evt === 'mousemove') enqueue({...base, x: e.clientX, y: e.clientY});
      else if (evt === 'click' || evt === 'mousedown' || evt === 'mouseup') enqueue({...base, button: e.button, x:e.clientX, y:e.clientY});
      else if (evt === 'scroll' || evt === 'wheel') enqueue({...base, sx: window.scrollX, sy: window.scrollY, deltaY: e.deltaY ?? null});
    }, {passive:true})
  );

  // keyboard
  ['keydown','keyup'].forEach(evt =>
    window.addEventListener(evt, e => {
      markActivity();
      enqueue({kind:'activity', type:evt, ts: now(), key: e.key, code: e.code});
    })
  );

  // idle detector
  setInterval(() => {
    const t = now();
    if (!idleFrom && t - lastActivity >= IDLE_THRESHOLD_MS) {
      idleFrom = t;
      enqueue({kind:'activity', type:'idle-start', ts: idleFrom});
    } else if (idleFrom && t - lastActivity < IDLE_THRESHOLD_MS) {
      const ended = t;
      enqueue({kind:'activity', type:'idle-end', ts: ended, duration: ended - idleFrom});
      idleFrom = null;
    }
  }, 500);

  // page enter/leave
  enqueue({kind:'activity', type:'enter', ts: now(), page: page()});
  window.addEventListener('beforeunload', () => {
    enqueue({kind:'activity', type:'leave', ts: now(), page: page()});
    flush({beacon:true}); // last chance send
  });

  // ====== boot: capture static + performance, then flush periodically ======
  (async () => {
    enqueue({kind:'meta', ts: now(), sid: getSID(), page: page()});
    enqueue(await getStatic());

    // Wait a tick so load/perf has values
    window.addEventListener('load', () => {
      enqueue(getPerf());
      flush(); // send early batch
    });

    // periodic flush
    setInterval(() => flush(), FLUSH_INTERVAL_MS);
    // also try when visibility changes
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush({beacon:true}); });
  })();
})();
