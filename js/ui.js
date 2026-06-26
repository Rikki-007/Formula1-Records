// ============================================================
// Small DOM/render helpers shared by all views.
// ============================================================

export function h(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

export function loader(text = "Loading data…") {
  return `<div class="loader"><div class="spinner"></div><div>${text}</div></div>`;
}

export function errorBox(msg = "Something went wrong.") {
  return `<div class="error-box"><strong>⚠ Couldn't load data.</strong><br>
    <span class="muted">${esc(msg)}</span><br><br>
    The Jolpica-F1 API may be rate-limiting or temporarily down. Try again in a moment.</div>`;
}

export function empty(text = "Nothing here.") {
  return `<div class="empty">${esc(text)}</div>`;
}

// escape user/data text
export function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// Country name -> emoji flag (best effort, covers common F1 nationalities)
const NATION_FLAG = {
  British: "🇬🇧", English: "🇬🇧", German: "🇩🇪", Dutch: "🇳🇱", Spanish: "🇪🇸",
  Finnish: "🇫🇮", French: "🇫🇷", Italian: "🇮🇹", Mexican: "🇲🇽", Australian: "🇦🇺",
  Brazilian: "🇧🇷", Canadian: "🇨🇦", Monegasque: "🇲🇨", Austrian: "🇦🇹", Thai: "🇹🇭",
  Japanese: "🇯🇵", American: "🇺🇸", "American-Italian": "🇺🇸", Argentine: "🇦🇷",
  Belgian: "🇧🇪", Swiss: "🇨🇭", Swedish: "🇸🇪", Danish: "🇩🇰", "New Zealander": "🇳🇿",
  Polish: "🇵🇱", Russian: "🇷🇺", Indian: "🇮🇳", Chinese: "🇨🇳", Portuguese: "🇵🇹",
  Venezuelan: "🇻🇪", Colombian: "🇨🇴", Indonesian: "🇮🇩", "South African": "🇿🇦",
  Irish: "🇮🇪", Hungarian: "🇭🇺", Czech: "🇨🇿", Liechtensteiner: "🇱🇮", Malaysian: "🇲🇾",
};
export function flag(nat) { return NATION_FLAG[nat] || "🏁"; }

export function fmtDate(d) {
  if (!d) return "";
  try { return new Date(d).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }); }
  catch { return d; }
}

export function scrollTop() { window.scrollTo({ top: 0, behavior: "smooth" }); }