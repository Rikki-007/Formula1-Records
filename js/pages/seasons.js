import { api } from "../api.js";
import { resetTheme } from "../theme.js";
import { loader, errorBox, esc } from "../ui.js";

export async function render(params, app) {
  resetTheme();
  app.innerHTML = `
    <div class="crumb"><a href="#/">Home</a> › Seasons</div>
    <h1 class="section-title">Every Season · 1950 → 2026</h1>
    <div class="controls">
      <input class="input" id="season-search" placeholder="🔍 Jump to a year (e.g. 1988)" inputmode="numeric" />
    </div>
    <div id="seasons-grid">${loader("Loading 76+ seasons…")}</div>`;

  try {
    const seasons = await api.seasons();
    const grid = document.getElementById("seasons-grid");

    const draw = (list) => {
      grid.innerHTML = `<div class="grid cols-4">${list.map((s) => `
        <a class="card" href="#/season/${s.season}">
          <h3 style="font-size:24px">${s.season}</h3>
          <div class="meta">View calendar & winners →</div>
        </a>`).join("")}</div>`;
    };
    draw(seasons);

    const search = document.getElementById("season-search");
    search.oninput = () => {
      const q = search.value.trim();
      draw(q ? seasons.filter((s) => s.season.includes(q)) : seasons);
    };
  } catch (e) {
    document.getElementById("seasons-grid").innerHTML = errorBox(e.message);
  }
}