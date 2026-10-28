// 网站快取：照片存在顾客手机里，下次打开不用重新下载（也省 Supabase 流量）
// 网站档案（html / js）每次先拿最新的，没网络时才用旧的。
const STATIC = "lsb-static-v7";
const IMAGES = "lsb-img-v1";
const MAX_IMAGES = 400;

self.addEventListener("install", e => {
  e.waitUntil(caches.open(STATIC).then(c => c.addAll(["./", "index.html", "admin.html", "shared.js", "seed-data.js", "demo-backend.js", "config.js"])).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== STATIC && k !== IMAGES).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

async function trimImages() {
  const c = await caches.open(IMAGES);
  const keys = await c.keys();
  for (let i = 0; i < keys.length - MAX_IMAGES; i++) await c.delete(keys[i]);
}

async function cacheFirst(req, name) {
  const c = await caches.open(name);
  const hit = await c.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res && (res.ok || res.type === "opaque")) {
    c.put(req, res.clone());
    if (name === IMAGES) trimImages();
  }
  return res;
}

async function networkFirst(req) {
  const c = await caches.open(STATIC);
  try {
    // no-cache：每次都跟 GitHub 确认有没有新版本（没变的话只回一个很小的 304）
    const res = await fetch(req.url, { cache: "no-cache", credentials: "same-origin" });
    if (res && res.ok) c.put(req, res.clone());
    return res;
  } catch (err) {
    const hit = await c.match(req, { ignoreSearch: true });
    if (hit) return hit;
    if (req.mode === "navigate") { const home = await c.match("index.html"); if (home) return home; }
    throw err;
  }
}

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // 资料库、登入：一定要最新，不快取
  if (url.pathname.includes("/rest/v1/") || url.pathname.includes("/auth/v1/")) return;
  if (url.protocol !== "https:" && url.protocol !== "http:") return;

  if (req.destination === "image" || url.pathname.includes("/storage/v1/object/public/")) {
    e.respondWith(cacheFirst(req, IMAGES));
  } else if (url.hostname === "fonts.gstatic.com" || url.hostname === "fonts.googleapis.com" || url.hostname === "cdn.jsdelivr.net") {
    e.respondWith(cacheFirst(req, STATIC));
  } else if (url.origin === self.location.origin) {
    e.respondWith(networkFirst(req));
  }
});
