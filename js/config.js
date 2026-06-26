// ============================================================
// Global config + team livery colors (drives the dynamic theme)
// ============================================================

export const API_BASE = "https://api.jolpica.ca/ergast/f1";

// Constructor (team) colors keyed by Ergast/Jolpica constructorId.
// Used for accent theming, table chips, and the 3D car livery.
export const TEAM_COLORS = {
  mercedes:     { primary: "#00d7b6", secondary: "#c0c0c0" },
  red_bull:     { primary: "#3671c6", secondary: "#ffc906" },
  ferrari:      { primary: "#e8002d", secondary: "#fff200" },
  mclaren:      { primary: "#ff8000", secondary: "#47c7fc" },
  aston_martin: { primary: "#229971", secondary: "#cedc00" },
  alpine:       { primary: "#0093cc", secondary: "#fd4bc7" },
  williams:     { primary: "#64c4ff", secondary: "#003b6f" },
  rb:           { primary: "#6692ff", secondary: "#c8102e" },
  alphatauri:   { primary: "#5e8faa", secondary: "#ffffff" },
  toro_rosso:   { primary: "#469bff", secondary: "#003c69" },
  sauber:       { primary: "#52e252", secondary: "#000000" },
  alfa:         { primary: "#c92d4b", secondary: "#ffffff" },
  haas:         { primary: "#b6babd", secondary: "#e8002d" },
  // historic / others
  renault:      { primary: "#fff500", secondary: "#000000" },
  racing_point: { primary: "#f596c8", secondary: "#ffffff" },
  force_india:  { primary: "#f596c8", secondary: "#ff8000" },
  lotus_f1:     { primary: "#ffb800", secondary: "#1a1a1a" },
  lotus:        { primary: "#1a4d2e", secondary: "#ffb800" },
  brawn:        { primary: "#bcf500", secondary: "#1a1a1a" },
  honda:        { primary: "#e8002d", secondary: "#ffffff" },
  toyota:       { primary: "#cc0000", secondary: "#ffffff" },
  bmw_sauber:   { primary: "#0054a6", secondary: "#e8002d" },
  jordan:       { primary: "#ffc906", secondary: "#000000" },
  benetton:     { primary: "#00a651", secondary: "#0072bc" },
  tyrrell:      { primary: "#0033a0", secondary: "#ffffff" },
  brabham:      { primary: "#1a4d8f", secondary: "#ffffff" },
  cooper:       { primary: "#1a4d2e", secondary: "#ffffff" },
};

export const DEFAULT_COLOR = { primary: "#e10600", secondary: "#38bdf8" };

export function teamColor(constructorId) {
  return TEAM_COLORS[constructorId] || DEFAULT_COLOR;
}