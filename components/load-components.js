async function cargarComponente(url, idDestino) {
  const destino = document.getElementById(idDestino);
  if (!destino) return;

  try {
    const respuesta = await fetch(url);
    if (!respuesta.ok) {
      console.error(`No se pudo cargar ${url}: ${respuesta.status} ${respuesta.statusText}`);
      return;
    }
    const html = await respuesta.text();
    destino.innerHTML = html;
  } catch (error) {
    console.error(`Error al cargar el componente ${url}:`, error);
  }
}

async function iniciar() {
  await cargarComponente('/components/header.html', 'header-placeholder');
  initBurgerMenu();
  initNavScroll();
}

/* ------------------------------------------------------------ menú móvil */
function initBurgerMenu() {
  const burger = document.getElementById("burger");
  const mmenu = document.getElementById("mmenu");

  if (!burger || !mmenu) return;

  const setMenu = (open) => {
    mmenu.hidden = !open;
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
    document.body.style.overflow = open ? "hidden" : "";
  };
  burger.addEventListener("click", () => setMenu(mmenu.hidden));
  mmenu.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !mmenu.hidden) setMenu(false); });
  window.matchMedia("(min-width: 861px)").addEventListener("change", (e) => { if (e.matches) setMenu(false); });
}

/* ------------------------------------------------ nav: borde al hacer scroll */
function initNavScroll() {
  const nav = document.getElementById("nav");
  if (!nav) return;

  const sentinel = document.createElement("div");
  sentinel.style.cssText = "position:absolute;top:0;left:0;width:1px;height:8px;pointer-events:none";
  document.body.prepend(sentinel);
  new IntersectionObserver(([e]) => nav.classList.toggle("is-stuck", !e.isIntersecting))
    .observe(sentinel);
}

document.addEventListener("DOMContentLoaded", iniciar);