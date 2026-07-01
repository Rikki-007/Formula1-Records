// ============================================================
// Driver headshots — sourced from Wikipedia, keyed off the
// canonical wiki URL the Jolpica-F1/Ergast API already gives us
// per driver (driver.url). No name-guessing needed.
// ============================================================
const memCache = new Map();
const CACHE_PREFIX = "f1photo:";
const TTL = 1000 * 60 * 60 * 24 * 7; // 7 days

// keep concurrent Wikipedia requests modest
const MAX_CONCURRENT = 4;
let active = 0;
const queue = [];

function runNext() {
  if (active >= MAX_CONCURRENT || !queue.length) return;
  active++;
  const { task, resolve } = queue.shift();
  task().then(resolve).finally(() => { active--; runNext(); });
}

function schedule(task) {
  return new Promise((resolve) => {
    queue.push({ task, resolve });
    runNext();
  });
}

function wikiTitleFrom(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    const m = u.pathname.match(/\/wiki\/(.+)$/);
    return m ? decodeURIComponent(m[1]) : null;
  } catch {
    return null;
  }
}

function readCache(key) {
  if (memCache.has(key)) return memCache.get(key);
  try {
    const raw = sessionStorage.getItem(CACHE_PREFIX + key);
    if (raw) {
      const { t, data } = JSON.parse(raw);
      if (Date.now() - t < TTL) { memCache.set(key, data); return data; }
    }
  } catch (_) {}
  return undefined;
}

function writeCache(key, data) {
  memCache.set(key, data);
  try { sessionStorage.setItem(CACHE_PREFIX + key, JSON.stringify({ t: Date.now(), data })); } catch (_) {}
}

async function fetchSummary(title) {
  const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) return null;
  return res.json();
}

// Returns { photo, wide } urls, or null if no usable photo was found.
export async function driverPhoto(driver) {
  const title = wikiTitleFrom(driver?.url);
  if (!title) return null;

  const cached = readCache(title);
  if (cached !== undefined) return cached;

  const result = await schedule(async () => {
    try {
      const summary = await fetchSummary(title);
      const src = summary?.thumbnail?.source || summary?.originalimage?.source || null;
      const data = src ? { photo: src, wide: summary?.originalimage?.source || src } : null;
      writeCache(title, data);
      return data;
    } catch (_) {
      writeCache(title, null);
      return null;
    }
  });

  return result;
}

// Fetch photos for many drivers, invoking onEach(driverId, result) as each resolves —
// lets a page paint placeholders immediately and fill in photos as they arrive.
export function driverPhotosStream(drivers, onEach) {
  drivers.forEach((d) => {
    driverPhoto(d).then((result) => onEach(d.driverId, result));
  });
}

export function initials(driver) {
  const a = driver.givenName?.[0] || "";
  const b = driver.familyName?.[0] || "";
  return (a + b).toUpperCase() || "F1";
}
