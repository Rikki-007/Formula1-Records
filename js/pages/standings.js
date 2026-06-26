import { api } from "../api.js";
import { applyTeamTheme } from "../theme.js";
import { loader, errorBox, esc, flag } from "../ui.js";

export async function render(params, app) {
  const season = params.year || "current";
  app.innerHTML = `
    <div class="crumb"><a href="#/">Home</a> › Standings</div>
    <h1 class="section-title">${season === "current" ? "2026" : esc(season)} Championship</h1>
    <div class="controls">
      <select id="season-select"><option>Loading seasons…</option></select>
      <a class="btn" id="view-races">View race calendar →</a>
    </div>
    <div class="grid cols-2">
      <div id="drivers-col">${loader()}</div>
      <div id="constructors-col">${loader()}</div>
    </div>`;

  // season picker
  api.seasons().then((seasons) => {
    const sel = document.getElementById("season-select");
    if (!sel) return;
    const cur = season === "current" ? seasons[0].season : season;
    sel.innerHTML = seasons.map((s) =>
      `<option value="${s.season}" ${s.season === cur ? "selected" : ""}>${s.season} season</option>`).join("");
    sel.onchange = () => { location.hash = `#/standings/${sel.value}`; };
    const vr = document.getElementById("view-races");
    if (vr) vr.href = `#/season/${cur}`;
  }).catch(() => {});

  try {
    const [drivers, constructors] = await Promise.all([
      api.driverStandings(season),
      api.constructorStandings(season),
    ]);

    if (drivers[0]) applyTeamTheme(drivers[0].Constructors?.[0]?.constructorId);

    document.getElementById("drivers-col").innerHTML = `
      <h2 class="section-title" style="font-size:18px">Drivers</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>Pos</th><th>Driver</th><th>Team</th><th>Wins</th><th>Pts</th></tr></thead>
        <tbody>
          ${drivers.map((s) => `
            <tr onclick="location.hash='#/driver/${s.Driver.driverId}'">
              <td class="pos pos-${s.position}">${s.position}</td>
              <td>${flag(s.Driver.nationality)} ${esc(s.Driver.givenName)} ${esc(s.Driver.familyName)}</td>
              <td class="muted">${esc(s.Constructors?.[0]?.name || "")}</td>
              <td>${s.wins}</td>
              <td><strong>${s.points}</strong></td>
            </tr>`).join("")}
        </tbody>
      </table></div>`;

    document.getElementById("constructors-col").innerHTML = `
      <h2 class="section-title" style="font-size:18px">Constructors</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>Pos</th><th>Team</th><th>Wins</th><th>Pts</th></tr></thead>
        <tbody>
          ${constructors.map((s) => `
            <tr>
              <td class="pos pos-${s.position}">${s.position}</td>
              <td><span class="team-chip" style="--team:var(--accent)">${esc(s.Constructor.name)}</span> ${flag(s.Constructor.nationality)}</td>
              <td>${s.wins}</td>
              <td><strong>${s.points}</strong></td>
            </tr>`).join("")}
        </tbody>
      </table></div>`;
  } catch (e) {
    document.getElementById("drivers-col").innerHTML = errorBox(e.message);
    document.getElementById("constructors-col").innerHTML = "";
  }
}