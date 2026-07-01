import { api } from "../api.js";
import { loader, errorBox, esc, flag } from "../ui.js";
import { driverPhoto, initials } from "../photos.js";
import { popIn, fadeInImage } from "../motion.js";

export async function render(params, app) {
  const id = params.id;
  app.innerHTML = `<div class="crumb"><a href="#/">Home</a> › <a href="#/drivers">Drivers</a> › Profile</div>
    <div id="driver">${loader("Loading career data…")}</div>`;

  try {
    const driver = await api.driver(id);
    if (!driver) { document.getElementById("driver").innerHTML = `<div class="empty">Driver not found.</div>`; return; }

    const [wins, seasons] = await Promise.all([
      api.driverWins(id).catch(() => ({ races: [], total: 0 })),
      api.driverSeasons(id).catch(() => []),
    ]);

    const winRaces = wins.races || [];
    const winCount = wins.total || winRaces.length;
    const name = `${driver.givenName} ${driver.familyName}`;
    const span = seasons.length ? `${seasons[0].season}–${seasons[seasons.length - 1].season}` : "—";

    document.getElementById("driver").innerHTML = `
      <div class="driver-hero">
        <div class="driver-hero-photo" id="driver-photo">
          <span class="avatar-fallback">${esc(initials(driver))}</span>
        </div>
        <h1 class="section-title">${flag(driver.nationality)} ${esc(name)}</h1>
      </div>
      <div class="stat-row">
        <div class="stat"><div class="k">World Titles</div><div class="v" id="titles-stat">…</div></div>
        <div class="stat"><div class="k">Race Wins</div><div class="v">${winCount}</div></div>
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
          <div id="titles-list"><p class="muted" style="margin-top:10px">Checking each season…</p></div>
        </div>
      </div>

      ${winRaces.length ? `
      <h2 class="section-title" style="font-size:18px;margin-top:34px">Race Wins (${winCount})</h2>
      <div class="table-wrap"><table>
        <thead><tr><th>Season</th><th>Round</th><th>Grand Prix</th><th>Team</th></tr></thead>
        <tbody>
          ${winRaces.map((r) => `
            <tr onclick="location.hash='#/race/${r.season}/${r.round}'">
              <td><strong>${r.season}</strong></td>
              <td>${r.round}</td>
              <td>${esc(r.raceName)}</td>
              <td class="muted">${esc(r.Results?.[0]?.Constructor?.name || "")}</td>
            </tr>`).join("")}
        </tbody>
      </table></div>` : ""}
    `;

    popIn(document.getElementById("driver-photo"));

    driverPhoto(driver).then((result) => {
      const box = document.getElementById("driver-photo");
      if (!box) return;
      if (!result?.photo) { box.classList.add("no-photo"); return; }
      const img = new Image();
      img.className = "avatar-img";
      img.alt = "";
      img.src = result.wide || result.photo;
      img.onload = () => {
        box.appendChild(img);
        box.classList.add("has-photo");
        fadeInImage(img);
      };
    });

    const titles = await api.driverChampionships(id, seasons).catch(() => []);
    const statEl = document.getElementById("titles-stat");
    const listEl = document.getElementById("titles-list");
    if (statEl) statEl.textContent = titles.length;
    if (listEl) {
      listEl.innerHTML = titles.length
        ? `<div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:8px">
            ${titles.map((y) => `<span class="pill">🏆 ${y}</span>`).join("")}</div>`
        : `<p class="muted" style="margin-top:10px">No World Championships.</p>`;
    }
  } catch (e) {
    document.getElementById("driver").innerHTML = errorBox(e.message);
  }
}