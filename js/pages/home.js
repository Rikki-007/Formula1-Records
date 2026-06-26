import { api } from "../api.js";
import { applyTeamTheme, resetTheme } from "../theme.js";
import { initHero } from "../hero.js";
import { loader, esc, flag, fmtDate } from "../ui.js";

export async function render(params, app) {
  resetTheme();
  app.innerHTML = `
    <section class="hero fade-in">
      <div class="hero-copy">
        <h1>EVERY LAP.<br>EVERY LEGEND.<br>SINCE 1950.</h1>
        <p class="lead">The complete Formula 1 archive — every Grand Prix, every champion,
        every driver in history. Live championship standings, updated after each session.</p>
        <div class="hero-cta">
          <a class="btn btn-primary" href="#/standings">View 2026 Standings →</a>
          <a class="btn" href="#/seasons">Browse 1950–2026</a>
        </div>
      </div>
      <div class="hero-3d-wrap">
        <canvas id="hero-canvas"></canvas>
        <div class="hero-3d-hint">🖱️ drag to rotate · livery follows the championship leader</div>
      </div>
    </section>

    <section style="margin-top:48px">
      <div class="grid cols-2">
        <div id="last-race">${loader("Loading latest race…")}</div>
        <div id="top-standings">${loader("Loading championship…")}</div>
      </div>
    </section>
  `;

  // boot the 3D car
  requestAnimationFrame(() => initHero(document.getElementById("hero-canvas")));

  // latest race
  api.lastRaceResults().then((race) => {
    const box = document.getElementById("last-race");
    if (!box) return;
    if (!race) { box.innerHTML = ""; return; }
    const win = race.Results?.[0];
    box.innerHTML = `
      <h2 class="section-title">Latest Grand Prix</h2>
      <a class="card" href="#/race/${race.season}/${race.round}">
        <div class="pill">Round ${race.round} · ${race.season}</div>
        <h3 style="margin-top:10px;font-size:22px">${esc(race.raceName)}</h3>
        <div class="meta">${esc(race.Circuit.circuitName)} · ${fmtDate(race.date)}</div>
        ${win ? `<div style="margin-top:16px;font-size:15px">
          🏆 <strong>${esc(win.Driver.givenName)} ${esc(win.Driver.familyName)}</strong>
          ${flag(win.Driver.nationality)} — ${esc(win.Constructor.name)}</div>` : ""}
      </a>`;
  }).catch(() => {});

  // championship snapshot + theme to leader
  api.driverStandings().then((standings) => {
    const box = document.getElementById("top-standings");
    if (!box) return;
    if (!standings.length) { box.innerHTML = ""; return; }
    const leader = standings[0];
    applyTeamTheme(leader.Constructors?.[0]?.constructorId);
    box.innerHTML = `
      <h2 class="section-title">Drivers' Championship</h2>
      <div class="card" style="padding:8px">
        <div class="table-wrap" style="border:none">
          <table>
            <tbody>
              ${standings.slice(0, 5).map((s) => `
                <tr onclick="location.hash='#/driver/${s.Driver.driverId}'">
                  <td class="pos pos-${s.position}">${s.position}</td>
                  <td>${flag(s.Driver.nationality)} <strong>${esc(s.Driver.givenName)} ${esc(s.Driver.familyName)}</strong></td>
                  <td class="muted">${esc(s.Constructors?.[0]?.name || "")}</td>
                  <td style="text-align:right"><strong>${s.points}</strong> pts</td>
                </tr>`).join("")}
            </tbody>
          </table>
        </div>
        <a class="btn" style="margin:12px;width:calc(100% - 24px);justify-content:center" href="#/standings">Full standings →</a>
      </div>`;
  }).catch(() => {});
}