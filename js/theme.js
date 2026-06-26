// ============================================================
// Dynamic theming — recolor the whole UI to a team's livery.
// ============================================================
import { teamColor, DEFAULT_COLOR } from "./config.js";

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

let current = DEFAULT_COLOR.primary;

export function applyTeamTheme(constructorId) {
  const c = teamColor(constructorId);
  setAccent(c.primary, c.secondary);
}

export function setAccent(primary, secondary = DEFAULT_COLOR.secondary) {
  if (current === primary) return;
  current = primary;
  const root = document.documentElement.style;
  root.setProperty("--accent", primary);
  root.setProperty("--accent-2", secondary);
  root.setProperty("--accent-rgb", hexToRgb(primary).join(", "));
  // notify the 3D hero so the car repaints
  window.dispatchEvent(new CustomEvent("accentchange", { detail: { primary, secondary } }));
}

export function resetTheme() {
  setAccent(DEFAULT_COLOR.primary, DEFAULT_COLOR.secondary);
}