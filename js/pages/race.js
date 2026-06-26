import { api } from "../api.js";
import { applyTeamTheme } from "../theme.js";
import { loader, errorBox, esc, flag, fmtDate } from "../ui.js";

export async function render(params, app) {
  const { year, round } = params;
  app.innerHTML = `
    <div class="crumb"><a href="#/">Home</a> › <a href="#/season/${esc(year)}">${esc(year)}</a> › Race</div>
    <div id="race">${loader("Loading race results…")}</div>`;

  try {
    const [race, qualifying] = await Promise.all([
      api.raceResults(year, round),
      api.qualifying(year, round).catch(() => []),
    ]);
    if (!race) { document.getElementById("race").innerHTML = `<div class="empty">No results for this race yet.</div>`; return; }

    const results = race.Results || [];
    const winner = results[0];
    if (winner) applyTeamTheme(winner.Constructor.constructorId);

    document.getElementById("race").innerHTML = `
      <h1 class="section-title">${esc(race.raceName)}</h1>
      <div class="stat-row">
        <div class="stat"><div class="k">Circuit</div><div class="v" style="font-size:18px">${esc(race.Circuit.circuitName)}</div></div>
        <div class="stat"><div class="k">Date</div><div class="v" style="font-size:18px">${fmtDate(race.date)}</div></div>
        <div class="stat"><div class="k">Location</div><div class="v" style="font-size:18px">${esc(race.Circuit.Location?.country || "")}</div></div>
        ${winner ? `<div class="stat"><div class="k">Winner</div><div class="v" style="font-size:18px">${flag(winner.Driver.nationality)} ${esc(winner.Driver.familyName)}</div></div>` : ""}
      </div>

      <h2 class="section-title" style="font-size:18px">Race Result</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>Pos</th><th>Driver</th><th>Team</th><th>Grid</th><th>Laps</th><th>Time / Status</th><th>Pts</th></tr></thead>
        <tbody>
          ${results.map((r) => `
            <tr onclick="location.hash='#/driver/${r.Driver.driverId}'">
              <td class="pos pos-${r.position}">${r.positionText}</td>
              <td>${flag(r.Driver.nationality)} ${esc(r.Driver.givenName)} ${esc(r.Driver.familyName)}</td>
              <td class="muted">${esc(r.Constructor.name)}</td>
              <td>${r.grid}</td>
              <td>${r.laps}</td>
              <td class="muted">${esc(r.Time?.time || r.status)}</td>
              <td><strong>${r.points}</strong></td>
            </tr>`).join("")}
        </tbody>
      </table></div>

      ${qualifying.length ? `
      <h2 class="section-title" style="font-size:18px;margin-top:34px">Qualifying</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>Pos</th><th>Driver</th><th>Team</th><th>Q1</th><th>Q2</th><th>Q3</th></tr></thead>
        <tbody>
          ${qualifying.map((q) => `
            <tr onclick="location.hash='#/driver/${q.Driver.driverId}'">
              <td class="pos pos-${q.position}">${q.position}</td>
              <td>${flag(q.Driver.nationality)} ${esc(q.Driver.familyName)}</td>
              <td class="muted">${esc(q.Constructor.name)}</td>
              <td>${esc(q.Q1 || "—")}</td>
              <td>${esc(q.Q2 || "—")}</td>
              <td>${esc(q.Q3 || "—")}</td>
            </tr>`).join("")}
        </tbody>
      </table></div>` : ""}
    `;
  } catch (e) {
    document.getElementById("race").innerHTML = errorBox(e.message);
  }
}