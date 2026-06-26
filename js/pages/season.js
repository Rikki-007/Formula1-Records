import { api } from "../api.js";
import { resetTheme } from "../theme.js";
import { loader, errorBox, esc, fmtDate } from "../ui.js";

export async function render(params, app) {
  resetTheme();
  const year = params.year;
  app.innerHTML = `
    <div class="crumb"><a href="#/">Home</a> › <a href="#/seasons">Seasons</a> › ${esc(year)}</div>
    <h1 class="section-title">${esc(year)} Season Calendar</h1>
    <div class="controls">
      <a class="btn" href="#/standings/${esc(year)}">View ${esc(year)} standings →</a>
    </div>
    <div id="races">${loader(`Loading ${year} calendar…`)}</div>`;

  try {
    const races = await api.seasonRaces(year);
    const box = document.getElementById("races");
    if (!races.length) { box.innerHTML = `<div class="empty">No races found for ${esc(year)}.</div>`; return; }
    box.innerHTML = `<div class="grid cols-3">${races.map((r) => `
      <a class="card" href="#/race/${r.season}/${r.round}">
        <div class="pill">Round ${r.round}</div>
        <h3 style="margin-top:10px">${esc(r.raceName)}</h3>
        <div class="meta">${esc(r.Circuit.circuitName)}</div>
        <div class="meta">${esc(r.Circuit.Location?.locality || "")}, ${esc(r.Circuit.Location?.country || "")}</div>
        <div class="meta" style="margin-top:6px">📅 ${fmtDate(r.date)}</div>
      </a>`).join("")}</div>`;
  } catch (e) {
    document.getElementById("races").innerHTML = errorBox(e.message);
  }
}