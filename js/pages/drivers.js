import { api } from "../api.js";
import { resetTheme } from "../theme.js";
import { loader, errorBox, esc, flag } from "../ui.js";
import { driverPhotosStream, initials } from "../photos.js";
import { revealCards, fadeInImage } from "../motion.js";

const PAGE = 30;

export async function render(params, app) {
  resetTheme();
  // params.year may be a season or "all"; default to current season
  let season = params.year || "current";
  let offset = 0;

  app.innerHTML = `
    <div class="crumb"><a href="#/">Home</a> › Drivers</div>
    <h1 class="section-title">Drivers</h1>
    <div class="controls">
      <select id="scope">
        <option value="current">2026 grid</option>
        <option value="all">All-time (1950→)</option>
      </select>
      <input class="input" id="filter" placeholder="🔍 Filter names on this page" />
    </div>
    <div id="list">${loader()}</div>
    <div id="pager" class="controls" style="justify-content:center;margin-top:24px"></div>`;

  const scope = document.getElementById("scope");
  scope.value = season === "all" ? "all" : "current";
  scope.onchange = () => { location.hash = scope.value === "all" ? "#/drivers/all" : "#/drivers"; };

  async function load() {
    const list = document.getElementById("list");
    list.innerHTML = loader();
    try {
      const seasonArg = season === "all" ? null : "current";
      const { drivers, total } = await api.drivers(seasonArg, { limit: PAGE, offset });
      drawList(drivers);
      drawPager(total);
    } catch (e) {
      list.innerHTML = errorBox(e.message);
    }
  }

  function drawList(drivers) {
    const list = document.getElementById("list");
    if (!drivers.length) { list.innerHTML = `<div class="empty">No drivers found.</div>`; return; }
    list.innerHTML = `<div class="grid cols-3" id="cards">${drivers.map(cardFor).join("")}</div>`;

    const filter = document.getElementById("filter");
    filter.oninput = () => {
      const q = filter.value.toLowerCase();
      document.querySelectorAll("#cards .card").forEach((c) => {
        c.style.display = c.dataset.name.includes(q) ? "" : "none";
      });
    };

    revealCards(document.querySelectorAll("#cards .card"));

    driverPhotosStream(drivers, (driverId, result) => {
      const avatar = list.querySelector(`.avatar[data-id="${CSS.escape(driverId)}"]`);
      if (!avatar) return;
      if (!result?.photo) { avatar.classList.add("no-photo"); return; }
      const img = new Image();
      img.className = "avatar-img";
      img.alt = "";
      img.loading = "lazy";
      img.src = result.photo;
      img.onload = () => {
        avatar.appendChild(img);
        avatar.classList.add("has-photo");
        fadeInImage(img);
      };
    });
  }

  function cardFor(d) {
    const name = `${d.givenName} ${d.familyName}`;
    return `<a class="card driver-card" href="#/driver/${d.driverId}" data-name="${esc(name.toLowerCase())}">
      <div class="avatar" data-id="${esc(d.driverId)}"><span class="avatar-fallback">${esc(initials(d))}</span></div>
      <div class="driver-card-body">
        <h3>${flag(d.nationality)} ${esc(name)}</h3>
        <div class="meta">${esc(d.nationality)}${d.permanentNumber ? ` · #${d.permanentNumber}` : ""}</div>
        ${d.dateOfBirth ? `<div class="meta">Born ${esc(d.dateOfBirth)}</div>` : ""}
      </div>
    </a>`;
  }

  function drawPager(total) {
    const pager = document.getElementById("pager");
    if (season !== "all" || total <= PAGE) { pager.innerHTML = `<span class="muted">${total} drivers</span>`; return; }
    const page = Math.floor(offset / PAGE) + 1;
    const pages = Math.ceil(total / PAGE);
    pager.innerHTML = `
      <button class="btn" id="prev" ${offset === 0 ? "disabled style='opacity:.4'" : ""}>← Prev</button>
      <span class="muted">Page ${page} / ${pages} · ${total} drivers</span>
      <button class="btn" id="next" ${offset + PAGE >= total ? "disabled style='opacity:.4'" : ""}>Next →</button>`;
    const prev = document.getElementById("prev"), next = document.getElementById("next");
    if (prev) prev.onclick = () => { offset = Math.max(0, offset - PAGE); load(); window.scrollTo({ top: 0 }); };
    if (next) next.onclick = () => { offset += PAGE; load(); window.scrollTo({ top: 0 }); };
  }

  load();
}