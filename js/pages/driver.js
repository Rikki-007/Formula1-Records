import { api } from "../api.js";
import { loader, errorBox, esc, flag } from "../ui.js";

export async function render(params, app) {
  const id = params.id;
  app.innerHTML = `<div class="crumb"><a href="#/">Home</a> › <a href="#/drivers">Drivers</a> › Profile</div>
    <div id="driver">${loader("Loading career data…")}</div>`;

  try {
    const driver = await api.driver(id);
    if (!driver) { document.getElementById("driver").innerHTML = `<div class="empty">Driver not found.</div>`; return; }

    // career stats (parallel)
    const [wins, seasons, titles] = await Promise.all([
      api.driverWins(id).catch(() => []),
      api.driverSeasons(id).catch(() => []),
      api.driverChampionships(id).catch(() => []),
    ]);

    const name = `${driver.givenName} ${driver.familyName}`;
    const span = seasons.length ? `${seasons[0].season}–${seasons[seasons.length - 1].season}` : "—";

    document.getElementById("driver").innerHTML = `
      <h1 class="section-title">${flag(driver.nationality)} ${esc(name)}</h1>
      <div class="stat-row">
        <div class="stat"><div class="k">World Titles</div><div class="v">${titles.length}</div></div>
        <div class="stat"><div class="k">Race Wins</div><div class="v">${wins.length}</div></div>
        <div class="stat"><div class="k">Seasons</div><div class="v">${seasons.length}</div></div>
        <div class="stat"><div class="k">Active</div><div class="v" style="font-size:20px">${span}</div></div>
      </div>

      <div class="grid cols-2">
        <div class="card">
          <h3>Profile</h3>
          <table style="min-width:0;margin-top:8px">
            <tbody>
              <tr><td class="muted">Nationality</td><td>${esc(driver.nationality)}</td></tr>
              ${driver.dateOfBirth ? `<tr><td class="muted">Born</td><td>${esc(driver.dateOfBirth)}</td></tr>` : ""}
              ${driver.permanentNumber ? `<tr><td class="muted">Number</td><td>#${esc(driver.permanentNumber)}</td></tr>` : ""}
              ${driver.code ? `<tr><td class="muted">Code</td><td>${esc(driver.code)}</td></tr>` : ""}
              ${driver.url ? `<tr><td class="muted">Wikipedia</td><td><a href="${esc(driver.url)}" target="_blank" rel="noopener" style="color:var(--accent)">Open ↗</a></td></tr>` : ""}
            </tbody>
          </table>
        </div>

        <div class="card">
          <h3>Championship Seasons</h3>
          ${titles.length ? `<div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:8px">
            ${titles.map((t) => `<span class="pill">🏆 ${t.season}</span>`).join("")}</div>`
          : `<p class="muted" style="margin-top:10px">No World Championships.</p>`}
        </div>
      </div>

      ${wins.length ? `
      <h2 class="section-title" style="font-size:18px;margin-top:34px">Race Wins (${wins.length})</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>Season</th><th>Round</th><th>Grand Prix</th><th>Team</th></tr></thead>
        <tbody>
          ${wins.map((r) => `
            <tr onclick="location.hash='#/race/${r.season}/${r.round}'">
              <td><strong>${r.season}</strong></td>
              <td>${r.round}</td>
              <td>${esc(r.raceName)}</td>
              <td class="muted">${esc(r.Results?.[0]?.Constructor?.name || "")}</td>
            </tr>`).join("")}
        </tbody>
      </table></div>` : ""}
    `;
  } catch (e) {
    document.getElementById("driver").innerHTML = errorBox(e.message);
  }
}