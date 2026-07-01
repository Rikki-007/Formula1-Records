// ============================================================
// App bootstrap + hash router.
// Routes -> page modules (lazy import keeps initial load light).
// ============================================================
import { dispose as disposeHero } from "./hero.js";
import { scrollTop } from "./ui.js";
import { pageOut, pageIn } from "./motion.js";

const app = document.getElementById("app");

// Route table: [regex, loader, paramNames]
const routes = [
  [/^\/?$/,                          () => import("./pages/home.js"),       []],
  [/^\/standings(?:\/(\d{4}))?$/,    () => import("./pages/standings.js"),  ["year"]],
  [/^\/seasons$/,                    () => import("./pages/seasons.js"),    []],
  [/^\/season\/(\d{4})$/,            () => import("./pages/season.js"),     ["year"]],
  [/^\/race\/(\d{4})\/(\d+)$/,       () => import("./pages/race.js"),       ["year", "round"]],
  [/^\/drivers(?:\/(all|\d{4}))?$/,  () => import("./pages/drivers.js"),    ["year"]],
  [/^\/driver\/([\w-]+)$/,           () => import("./pages/driver.js"),     ["id"]],
];

let currentToken = 0;

async function router() {
  const hash = location.hash.replace(/^#/, "") || "/";
  const token = ++currentToken;

  // tear down the 3D scene whenever we leave a page (home rebuilds it)
  disposeHero();
  await pageOut(app);
  if (token !== currentToken) return; // a newer navigation won mid-transition

  for (const [re, loader, names] of routes) {
    const m = hash.match(re);
    if (!m) continue;
    const params = {};
    names.forEach((n, i) => (params[n] = m[i + 1]));
    try {
      const mod = await loader();
      if (token !== currentToken) return; // a newer navigation won
      await mod.render(params, app);
    } catch (err) {
      console.error(err);
      app.innerHTML = `<div class="error-box" style="margin-top:30px">Failed to load this page. ${err.message}</div>`;
    }
    setActiveNav(hash);
    scrollTop();
    pageIn(app);
    return;
  }

  // 404
  app.innerHTML = `<div class="empty" style="padding-top:80px">
    <h1 style="font-size:60px">404</h1>
    <p>That page doesn't exist on the grid.</p>
    <a class="btn btn-primary" href="#/" style="margin-top:18px">Back to start line →</a></div>`;
  setActiveNav("/");
  pageIn(app);
}

function setActiveNav(hash) {
  document.querySelectorAll(".nav-links a[data-nav]").forEach((a) => {
    const target = a.getAttribute("href").replace(/^#/, "");
    const isHome = target === "/" && (hash === "/" || hash === "");
    a.classList.toggle("active", isHome || (target !== "/" && hash.startsWith(target)));
  });
}

function boot() {
  const y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();
  router();
}

window.addEventListener("hashchange", router);
if (document.readyState === "loading") {
  window.addEventListener("DOMContentLoaded", boot);
} else {
  boot(); // module evaluated after DOM was ready
}