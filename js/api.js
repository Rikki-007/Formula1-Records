// ============================================================
// Jolpica-F1 (Ergast-compatible) data layer
// Docs: https://github.com/jolpica/jolpica-f1
// Every endpoint returns { MRData: {...} }. We unwrap the useful bits.
// Includes in-memory + sessionStorage caching to stay polite & fast.
// ============================================================
import { API_BASE } from "./config.js";

const memCache = new Map();

function setStatus(state, text) {
  const el = document.getElementById("data-status");
  const txt = document.getElementById("status-text");
  if (!el) return;
  el.classList.remove("live", "error");
  if (state) el.classList.add(state);
  if (text) txt.textContent = text;
}

async function get(path, { ttl = 1000 * 60 * 30 } = {}) {
  const url = `${API_BASE}/${path}${path.includes("?") ? "&" : "?"}format=json`;
  const cacheKey = url;

  // memory cache
  if (memCache.has(cacheKey)) return memCache.get(cacheKey);

  // session cache
  try {
    const raw = sessionStorage.getItem(cacheKey);
    if (raw) {
      const { t, data } = JSON.parse(raw);
      if (Date.now() - t < ttl) { memCache.set(cacheKey, data); return data; }
    }
  } catch (_) {}

  setStatus(null, "Loading…");
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (res.status === 429) { await sleep(800 * (attempt + 1)); continue; } // rate limited
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const data = json.MRData;
      memCache.set(cacheKey, data);
      try { sessionStorage.setItem(cacheKey, JSON.stringify({ t: Date.now(), data })); } catch (_) {}
      setStatus("live", "Live · Jolpica-F1");
      return data;
    } catch (err) {
      lastErr = err;
      await sleep(400 * (attempt + 1));
    }
  }
  setStatus("error", "Data unavailable");
  throw lastErr;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- typed helpers ----------
export const api = {
  // Current season schedule
  async currentSeason() {
    const d = await get("current");
    return d.RaceTable.Races;
  },

  // Most recent completed race + results
  async lastRaceResults() {
    const d = await get("current/last/results");
    return d.RaceTable.Races[0] || null;
  },

  async driverStandings(season = "current") {
    const d = await get(`${season}/driverStandings`);
    return d.StandingsTable.StandingsLists[0]?.DriverStandings || [];
  },

  async constructorStandings(season = "current") {
    const d = await get(`${season}/constructorStandings`);
    return d.StandingsTable.StandingsLists[0]?.ConstructorStandings || [];
  },

  // All seasons (1950 → now)
  async seasons() {
    const d = await get("seasons?limit=100", { ttl: 1000 * 60 * 60 * 24 });
    return d.SeasonTable.Seasons.slice().reverse(); // newest first
  },

  // Races for a given season
  async seasonRaces(season) {
    const d = await get(`${season}`, { ttl: 1000 * 60 * 60 });
    return d.RaceTable.Races;
  },

  // Results of one race
  async raceResults(season, round) {
    const d = await get(`${season}/${round}/results`, { ttl: 1000 * 60 * 60 });
    return d.RaceTable.Races[0] || null;
  },

  async qualifying(season, round) {
    const d = await get(`${season}/${round}/qualifying`, { ttl: 1000 * 60 * 60 });
    return d.RaceTable.Races[0]?.QualifyingResults || [];
  },

  // Drivers for a season (default: all-time list is huge, so paginate)
  async drivers(season, { limit = 30, offset = 0 } = {}) {
    const base = season ? `${season}/drivers` : "drivers";
    const d = await get(`${base}?limit=${limit}&offset=${offset}`, { ttl: 1000 * 60 * 60 * 6 });
    return { drivers: d.DriverTable.Drivers, total: Number(d.total) };
  },

  async driver(driverId) {
    const d = await get(`drivers/${driverId}`, { ttl: 1000 * 60 * 60 * 24 });
    return d.DriverTable.Drivers[0] || null;
  },

  // A driver's career results summary helpers
  async driverWins(driverId) {
    const d = await get(`drivers/${driverId}/results/1?limit=100`, { ttl: 1000 * 60 * 60 * 24 });
    return d.RaceTable.Races;
  },

  async driverSeasons(driverId) {
    const d = await get(`drivers/${driverId}/seasons?limit=100`, { ttl: 1000 * 60 * 60 * 24 });
    return d.SeasonTable.Seasons;
  },

  async driverChampionships(driverId) {
    // standings positions of 1 across seasons
    const d = await get(`drivers/${driverId}/driverStandings/1?limit=100`, { ttl: 1000 * 60 * 60 * 24 });
    return d.StandingsTable.StandingsLists;
  },
};