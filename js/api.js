// ============================================================
// Jolpica-F1 (Ergast-compatible) data layer
// Limits: 4 requests/sec burst, 500/hour. We throttle + cache to stay under.
// ============================================================
import { API_BASE } from "./config.js";

const memCache = new Map();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function setStatus(state, text) {
  const el = document.getElementById("data-status");
  const txt = document.getElementById("status-text");
  if (!el) return;
  el.classList.remove("live", "error");
  if (state) el.classList.add(state);
  if (txt && text) txt.textContent = text;
}

// ---- global throttle: never fire faster than ~3 requests/sec ----
let chain = Promise.resolve();
let lastAt = 0;
const MIN_GAP = 320;

function throttle(task) {
  const run = chain.then(async () => {
    const wait = MIN_GAP - (Date.now() - lastAt);
    if (wait > 0) await sleep(wait);
    lastAt = Date.now();
    return task();
  });
  chain = run.then(() => {}, () => {});
  return run;
}

async function fetchJson(url) {
  let lastErr;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (res.status === 429) {
        const retry = Number(res.headers.get("Retry-After")) || (1.5 * (attempt + 1));
        await sleep(retry * 1000);
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (!json || !json.MRData) throw new Error("Unexpected response shape");
      return json.MRData;
    } catch (err) {
      lastErr = err;
      console.warn(`[F1 API] attempt ${attempt + 1} failed:`, err.message, "→", url);
      await sleep(600 * (attempt + 1));
    }
  }
  throw lastErr || new Error("Request failed");
}

async function get(path, { ttl = 1000 * 60 * 30 } = {}) {
  const [p, query] = path.split("?");
  const url = `${API_BASE}/${p}.json${query ? "?" + query : ""}`;

  if (memCache.has(url)) return memCache.get(url);
  try {
    const raw = sessionStorage.getItem(url);
    if (raw) {
      const { t, data } = JSON.parse(raw);
      if (Date.now() - t < ttl) { memCache.set(url, data); return data; }
    }
  } catch (_) {}

  setStatus(null, "Loading…");
  try {
    const data = await throttle(() => fetchJson(url));
    memCache.set(url, data);
    try { sessionStorage.setItem(url, JSON.stringify({ t: Date.now(), data })); } catch (_) {}
    setStatus("live", "Live · Jolpica-F1");
    return data;
  } catch (err) {
    setStatus("error", "Data unavailable");
    throw err;
  }
}

export const api = {
  async currentSeason() {
    const d = await get("current");
    return d.RaceTable?.Races || [];
  },
  async lastRaceResults() {
    const d = await get("current/last/results");
    return d.RaceTable?.Races?.[0] || null;
  },
  async driverStandings(season = "current") {
    const d = await get(`${season}/driverStandings`);
    return d.StandingsTable?.StandingsLists?.[0]?.DriverStandings || [];
  },
  async constructorStandings(season = "current") {
    const d = await get(`${season}/constructorStandings`);
    return d.StandingsTable?.StandingsLists?.[0]?.ConstructorStandings || [];
  },
  async seasons() {
    const d = await get("seasons?limit=100", { ttl: 1000 * 60 * 60 * 24 });
    return (d.SeasonTable?.Seasons || []).slice().reverse();
  },
  async seasonRaces(season) {
    const d = await get(`${season}`, { ttl: 1000 * 60 * 60 });
    return d.RaceTable?.Races || [];
  },
  async raceResults(season, round) {
    const d = await get(`${season}/${round}/results`, { ttl: 1000 * 60 * 60 });
    return d.RaceTable?.Races?.[0] || null;
  },
  async qualifying(season, round) {
    const d = await get(`${season}/${round}/qualifying`, { ttl: 1000 * 60 * 60 });
    return d.RaceTable?.Races?.[0]?.QualifyingResults || [];
  },
  async drivers(season, { limit = 30, offset = 0 } = {}) {
    const base = season ? `${season}/drivers` : "drivers";
    const d = await get(`${base}?limit=${limit}&offset=${offset}`, { ttl: 1000 * 60 * 60 * 6 });
    return { drivers: d.DriverTable?.Drivers || [], total: Number(d.total) || 0 };
  },
  async driver(driverId) {
    const d = await get(`drivers/${driverId}`, { ttl: 1000 * 60 * 60 * 24 });
    return d.DriverTable?.Drivers?.[0] || null;
  },
  async driverWins(driverId) {
    const d = await get(`drivers/${driverId}/results/1?limit=100`, { ttl: 1000 * 60 * 60 * 24 });
    return { races: d.RaceTable?.Races || [], total: Number(d.total) || 0 };
  },
  async driverSeasons(driverId) {
    const d = await get(`drivers/${driverId}/seasons?limit=100`, { ttl: 1000 * 60 * 60 * 24 });
    return d.SeasonTable?.Seasons || [];
  },
  async driverChampionships(driverId) {
    const d = await get(`drivers/${driverId}/driverStandings/1?limit=100`, { ttl: 1000 * 60 * 60 * 24 });
    return d.StandingsTable?.StandingsLists || [];
  },
};