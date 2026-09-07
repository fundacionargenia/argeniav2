(function() {
  "use strict";
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  function init(){
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;

  
  

  /* ------------------------------------ revelados y trazos con IntersectionObserver */
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      e.target.classList.add("is-in");
      io.unobserve(e.target);
    }
  }, { threshold: 0.01, rootMargin: "0px 0px -10% 0px" });
  document.querySelectorAll(".rv, .draw").forEach((el) => io.observe(el));


  /* --------------------------------------------------- pilares: fila activa */
  const pillars = [...document.querySelectorAll(".pillar")];
  const pio = new IntersectionObserver((entries) => {
    for (const e of entries) e.target.classList.toggle("is-active", e.isIntersecting);
  }, { threshold: 0.9, rootMargin: "-32% 0px -32% 0px" });
  pillars.forEach((p) => pio.observe(p));

  /* -------------------------------- marquesina: duplicado para bucle continuo */
  const mq = document.getElementById("mq");
  if (mq && !reduce) mq.innerHTML += mq.innerHTML;

  /* ------------------------------------------------- FAQ (acordeón accesible) */
  document.querySelectorAll(".q").forEach((btn) => {
    btn.addEventListener("click", () => {
      const panel = document.getElementById(btn.getAttribute("aria-controls"));
      const open = btn.getAttribute("aria-expanded") === "true";
      document.querySelectorAll('.q[aria-expanded="true"]').forEach((b) => {
        b.setAttribute("aria-expanded", "false");
        document.getElementById(b.getAttribute("aria-controls")).classList.remove("open");
      });
      if (!open) { btn.setAttribute("aria-expanded", "true"); panel.classList.add("open"); }
    });
  });

  /* -------------------------- programas: paneo horizontal fijado (GSAP opcional) */
  const track = document.getElementById("panTrack");
  const vp = document.getElementById("panVp");
  const bar = document.getElementById("panBar");
  const section = document.getElementById("pan");
  const hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";

  if (hasGsap && !reduce && window.matchMedia("(min-width: 861px)").matches) {
    gsap.registerPlugin(ScrollTrigger);
    const distance = () => Math.max(0, track.scrollWidth - vp.clientWidth);
    gsap.to(track, {
      x: () => -distance(),
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: () => "+=" + distance(),
        pin: true,
        scrub: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => { bar.style.transform = "scaleX(" + (0.18 + self.progress * 4.55) + ")"; }
      }
    });
  } else if (vp) {
    /* respaldo sin librería: scroll horizontal con anclaje */
    const sync = () => {
      const max = vp.scrollWidth - vp.clientWidth;
      bar.style.transform = "scaleX(" + (0.18 + (max ? vp.scrollLeft / max : 0) * 4.55) + ")";
    };
    vp.addEventListener("scroll", sync, { passive: true });
    sync();
  }

  /* =========================================================================
     HERO: destello y átomo en WebGL (three.js)
     Sin librería o sin WebGL, cae al destello estático en SVG.
     ====================================================================== */
  const canvas = document.getElementById("scene");
  if (typeof window.THREE === "undefined") { document.body.classList.add("no-webgl"); return; }

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" });
  } catch (err) {
    document.body.classList.add("no-webgl");
    return;
  }

  const hero = canvas.parentElement;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(48, 1, 0.1, 300);
  camera.position.set(0, 0, 30);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const isNarrow = () => window.matchMedia("(max-width: 860px)").matches;
  const COARSE = window.matchMedia("(pointer: coarse)").matches;

  /* --- texturas generadas en canvas (nada externo) --- */
  function dotTexture() {
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const g = c.getContext("2d").createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.35, "rgba(255,255,255,.55)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    const ctx = c.getContext("2d"); ctx.fillStyle = g; ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }
  /* el destello del logo: núcleo radial + cuatro rayos */
  function flareTexture() {
    const S = 512, c = document.createElement("canvas"); c.width = c.height = S;
    const ctx = c.getContext("2d"), m = S / 2;
    const core = ctx.createRadialGradient(m, m, 0, m, m, S * 0.17);
    core.addColorStop(0, "rgba(255,255,255,1)");
    core.addColorStop(0.4, "rgba(210,255,255,.6)");
    core.addColorStop(1, "rgba(140,240,250,0)");
    ctx.fillStyle = core; ctx.fillRect(0, 0, S, S);
    const ray = (w, h) => {
      const g = ctx.createLinearGradient(m - w, m, m + w, m);
      g.addColorStop(0, "rgba(255,255,255,0)");
      g.addColorStop(0.5, "rgba(255,255,255,.9)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.save(); ctx.translate(m, m); ctx.scale(1, h / w); ctx.translate(-m, -m);
      ctx.fillStyle = g; ctx.beginPath();
      ctx.moveTo(m - w, m); ctx.lineTo(m, m - w * 0.055); ctx.lineTo(m + w, m); ctx.lineTo(m, m + w * 0.055);
      ctx.closePath(); ctx.fill(); ctx.restore();
    };
    ray(m * 0.98, m * 0.98);
    ctx.save(); ctx.translate(m, m); ctx.rotate(Math.PI / 2); ctx.translate(-m, -m);
    ray(m * 0.98, m * 0.98); ctx.restore();
    return new THREE.CanvasTexture(c);
  }

  const texDot = dotTexture();
  const texFlare = flareTexture();

  const PALETTE = {
    dark:  { core: 0xd8fdff, orbit: 0x5ce1e6, dust: 0x7fb6d6, flare: 0x8ff2f6, dustOp: 0.5,  orbitOp: 0.9,  blend: THREE.AdditiveBlending, flareOp: 0.95 },
    light: { core: 0x0a6e79, orbit: 0x0a6e79, dust: 0x8aa4b8, flare: 0x3fbcc6, dustOp: 0.2, orbitOp: 0.7, blend: THREE.NormalBlending,  flareOp: 0.22 }
  };

  const world = new THREE.Group();
  scene.add(world);
  const atom = new THREE.Group();
  world.add(atom);

  /* núcleo */
  const nCount = 320;
  const nPos = new Float32Array(nCount * 3);
  for (let i = 0; i < nCount; i++) {
    const r = Math.cbrt(Math.random()) * 1.5;
    const t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
    nPos[i * 3] = r * Math.sin(p) * Math.cos(t);
    nPos[i * 3 + 1] = r * Math.sin(p) * Math.sin(t);
    nPos[i * 3 + 2] = r * Math.cos(p);
  }
  const nGeo = new THREE.BufferGeometry();
  nGeo.setAttribute("position", new THREE.BufferAttribute(nPos, 3));
  const nMat = new THREE.PointsMaterial({ size: 0.42, map: texDot, transparent: true, depthWrite: false, sizeAttenuation: true });
  const nucleus = new THREE.Points(nGeo, nMat);
  atom.add(nucleus);

  /* destello sobre el núcleo */
  const flareMat = new THREE.SpriteMaterial({ map: texFlare, transparent: true, depthWrite: false });
  const flare = new THREE.Sprite(flareMat);
  flare.scale.set(21, 21, 1);
  atom.add(flare);

  /* órbitas */
  const ORBITS = [
    { a: 10.4, b: 4.2, rot: [0.28, 0.1, 0.0], spd: 0.22 },
    { a: 10.4, b: 4.2, rot: [0.3, 0.1, 1.05], spd: -0.17 },
    { a: 10.4, b: 4.2, rot: [0.3, 0.1, -1.05], spd: 0.13 }
  ];
  const orbitObjs = [];
  ORBITS.forEach((o) => {
    const n = isNarrow() ? 300 : 620;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const t = (i / n) * Math.PI * 2;
      const j = 1 + (Math.random() - 0.5) * 0.035;
      pos[i * 3] = Math.cos(t) * o.a * j;
      pos[i * 3 + 1] = Math.sin(t) * o.b * j;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 0.5;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ size: 0.2, map: texDot, transparent: true, depthWrite: false, sizeAttenuation: true });
    const ring = new THREE.Points(geo, mat);
    const holder = new THREE.Group();
    holder.rotation.set(o.rot[0], o.rot[1], o.rot[2]);
    holder.add(ring);

    /* electrón que recorre la órbita */
    const eMat = new THREE.SpriteMaterial({ map: texDot, transparent: true, depthWrite: false });
    const el = new THREE.Sprite(eMat);
    el.scale.set(1.5, 1.5, 1);
    holder.add(el);

    atom.add(holder);
    orbitObjs.push({ ring, mat, holder, el, eMat, cfg: o, phase: Math.random() * Math.PI * 2 });
  });

  /* polvo estelar de fondo */
  const dCount = 900;
  const dPos = new Float32Array(dCount * 3);
  for (let i = 0; i < dCount; i++) {
    const r = 34 + Math.random() * 46;
    const t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1);
    dPos[i * 3] = r * Math.sin(p) * Math.cos(t);
    dPos[i * 3 + 1] = r * Math.sin(p) * Math.sin(t) * 0.6;
    dPos[i * 3 + 2] = r * Math.cos(p) - 20;
  }
  const dGeo = new THREE.BufferGeometry();
  dGeo.setAttribute("position", new THREE.BufferAttribute(dPos, 3));
  const dMat = new THREE.PointsMaterial({ size: 0.34, map: texDot, transparent: true, depthWrite: false, sizeAttenuation: true });
  const dust = new THREE.Points(dGeo, dMat);
  scene.add(dust);

  function applyPalette() {
    const p = PALETTE[root.dataset.theme === "light" ? "light" : "dark"];
    nMat.color.setHex(p.core); nMat.blending = p.blend; nMat.opacity = 1; nMat.needsUpdate = true;
    flareMat.color.setHex(p.flare); flareMat.blending = p.blend; flareMat.opacity = p.flareOp; flareMat.needsUpdate = true;
    dMat.color.setHex(p.dust); dMat.blending = p.blend; dMat.opacity = p.dustOp; dMat.needsUpdate = true;
    orbitObjs.forEach((o) => {
      o.mat.color.setHex(p.orbit); o.mat.blending = p.blend; o.mat.opacity = p.orbitOp; o.mat.needsUpdate = true;
      o.eMat.color.setHex(p.core); o.eMat.blending = p.blend; o.eMat.opacity = p.orbitOp; o.eMat.needsUpdate = true;
    });
  }
  applyPalette();
  window.addEventListener("argenia:theme", applyPalette);

  function resize() {
    const w = hero.clientWidth, h = hero.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(h, 1);
    camera.updateProjectionMatrix();
    const narrow = isNarrow();
    const visH = 2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360);
    const pxPerUnit = h / visH;
    world.position.x = narrow ? 0 : w > 1240 ? 8.6 : 6.4;
    world.position.y = narrow ? -(h * 0.235) / pxPerUnit : 0.4;
    const s = narrow ? 0.72 : Math.min(1, w / 1240);
    world.scale.setScalar(Math.max(0.62, s));
  }
  resize();
  window.addEventListener("resize", resize, { passive: true });

  /* paralaje suave con el puntero, fuera del ciclo de render de la interfaz */
  const ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!COARSE && !reduce) {
    window.addEventListener("pointermove", (e) => {
      ptr.tx = (e.clientX / window.innerWidth - 0.5) * 2;
      ptr.ty = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
  }

  /* el hero solo renderiza mientras está a la vista */
  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; })
    .observe(hero);

  const clock = new THREE.Clock();
  function frame() {
    requestAnimationFrame(frame);
    if (!visible) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;

    if (!reduce) {
      ptr.x += (ptr.tx - ptr.x) * 0.045;
      ptr.y += (ptr.ty - ptr.y) * 0.045;
      atom.rotation.y = ptr.x * 0.4 + t * 0.05;
      atom.rotation.x = ptr.y * 0.24;
      dust.rotation.y = t * 0.012 + ptr.x * 0.06;
      dust.rotation.x = ptr.y * 0.03;
      nucleus.rotation.y += dt * 0.35;
      flare.scale.setScalar(19.5 + Math.sin(t * 1.15) * 2.1);
      orbitObjs.forEach((o, i) => {
        o.ring.rotation.z += dt * o.cfg.spd;
        const ang = t * (0.55 + i * 0.18) + o.phase;
        o.el.position.set(Math.cos(ang) * o.cfg.a, Math.sin(ang) * o.cfg.b, 0);
        o.el.position.applyAxisAngle(new THREE.Vector3(0, 0, 1), o.ring.rotation.z);
      });
    }
    renderer.render(scene, camera);
  }
  frame();
  }
})();
/* paginación del consejo consultivo */
    document.querySelectorAll(".page-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.getAttribute("data-goto");
        document.querySelectorAll(".c-grid").forEach((p) =>
          p.classList.toggle("active", p.getAttribute("data-page") === target));
        document.querySelectorAll(".page-btn").forEach((b) => b.classList.toggle("active", b === btn));
      });
      });