const $ = (s, root = document) => root.querySelector(s);
const root = document.documentElement;
const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isGame = () => root.classList.contains('game');

/* ---------- Almacenamiento seguro ---------- */
const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); }
    catch (e) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* ignorar */ }
  },
};

/* ---------- Toast y XP ---------- */
let toastTimer;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2600);
}

let xp = store.get('mz-xp', 0);
function renderXP() { $('#xp').textContent = String(xp).padStart(4, '0'); }
function addXP(n) {
  if (n <= 0) return;
  xp += Math.round(n);
  store.set('mz-xp', xp);
  renderXP();
}
renderXP();

/* ---------- Fondo: retícula del cursor (pro) o estrellas pixeladas (game) ---------- */
(function background() {
  const canvas = $('#bg');
  const ctx = canvas.getContext('2d');
  const pixelColors = ['#b8ff3b', '#3ee6ff', '#ff4fa0', '#e9ebf8', '#e9ebf8', '#e9ebf8'];
  let pts = [], mouse = { x: -1, y: -1 };

  function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    const area = innerWidth * innerHeight;
    pts = Array.from({ length: Math.floor(area / 9000) }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      s: Math.random() < 0.15 ? 3 : 2, v: 0.1 + Math.random() * 0.4,
      c: pixelColors[Math.floor(Math.random() * pixelColors.length)], a: 0.2 + Math.random() * 0.6,
    }));
  }

  function drawGame() {
    for (const p of pts) {
      ctx.globalAlpha = p.a;
      ctx.fillStyle = p.c;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
      if (!reduceMotion) {
        p.y += p.v;
        if (p.y > canvas.height) { p.y = -4; p.x = Math.random() * canvas.width; }
      }
    }
  }

  // Modo pro: retícula que sigue al ratón con sus coordenadas, como en una herramienta de diseño
  let ink = '#ededed', accent = '#ff6a3d';
  window.refreshBackgroundColors = () => {
    const cs = getComputedStyle(root);
    ink = cs.getPropertyValue('--text').trim() || ink;
    accent = cs.getPropertyValue('--accent').trim() || accent;
  };
  window.refreshBackgroundColors();
  function drawPro() {
    if (mouse.x < 0) return;
    const x = Math.round(mouse.x) + 0.5, y = Math.round(mouse.y) + 0.5;
    ctx.globalAlpha = 0.09;
    ctx.strokeStyle = ink;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height);
    ctx.moveTo(0, y); ctx.lineTo(canvas.width, y);
    ctx.stroke();
    ctx.globalAlpha = 0.75;
    ctx.fillStyle = accent;
    ctx.font = '11px "JetBrains Mono", monospace';
    const label = `x ${String(Math.round(mouse.x)).padStart(4, '0')}  y ${String(Math.round(mouse.y)).padStart(4, '0')}`;
    ctx.fillText(label, Math.min(x + 12, canvas.width - 120), Math.max(y - 12, 14));
  }

  function frame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    isGame() ? drawGame() : drawPro();
    if (!reduceMotion) requestAnimationFrame(frame);
  }
  window.redrawBackground = () => { if (reduceMotion) frame(); };

  resize();
  addEventListener('resize', () => { resize(); if (reduceMotion) frame(); });
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    mouse.x = e.clientX; mouse.y = e.clientY;
    if (reduceMotion) frame();
  });
  document.addEventListener('mouseleave', () => { mouse.x = -1; if (reduceMotion) frame(); });
  frame();
})();

/* ---------- Texto que se escribe solo ---------- */
const ROLES = {
  pro: ['Full-Stack Developer', 'Automatización de procesos', 'IA aplicada a RRHH', 'APIs REST y bases de datos'],
  game: ['Full-Stack Developer', 'Automatización de procesos', 'IA aplicada a RRHH', 'Player 1 · Ready'],
};
(function typing() {
  const out = $('#typed');
  let r = 0, i = 0, del = false;
  (function step() {
    const list = ROLES[isGame() ? 'game' : 'pro'];
    const word = list[r % list.length];
    out.textContent = word.slice(0, i);
    if (!del && i >= word.length) { del = true; return setTimeout(step, 1700); }
    if (del && i <= 0) { del = false; r = (r + 1) % list.length; }
    i += del ? -1 : 1;
    setTimeout(step, del ? 30 : 65);
  })();
})();

/* ---------- Menú móvil ---------- */
$('#menuBtn').addEventListener('click', (e) => {
  const open = $('#nav').classList.toggle('open');
  e.currentTarget.setAttribute('aria-expanded', open);
});
$('#nav').addEventListener('click', (e) => {
  if (e.target.tagName === 'A') {
    $('#nav').classList.remove('open');
    $('#menuBtn').setAttribute('aria-expanded', 'false');
  }
});

/* ---------- Competencias (desplegables) ---------- */
$('#bars').innerHTML = SKILL_BARS.map((b) => `
  <details class="skill">
    <summary>
      <div class="bar-label"><span>${b.name}</span><span>${b.value}/100 <span class="chev" aria-hidden="true"></span></span></div>
      <div class="bar-track"><div class="bar-fill" style="color:var(--${b.color})" data-value="${b.value}"></div></div>
    </summary>
    <ul class="inventory">${b.techs.map((t) => `<li>${t}</li>`).join('')}</ul>
  </details>`).join('');

/* ---------- Proyectos ---------- */
const langs = ['Todas', ...new Set(PROJECTS.map((p) => p.lang))];
let currentFilter = 'Todas';
const repoInfo = {};

function stars(n) {
  return '★'.repeat(n) + `<span class="off">${'★'.repeat(5 - n)}</span>`;
}
function links(p, game) {
  const repo = `<a href="https://github.com/${GITHUB_USER}/${p.id}" target="_blank" rel="noopener">${game ? 'Código →' : 'Código ↗'}</a>`;
  const demo = p.demo ? `<a href="${p.demo}" target="_blank" rel="noopener">${game ? 'Jugar demo ▶' : 'Ver demo ↗'}</a>` : '';
  return `<div class="mission-links">${demo}${repo}</div>`;
}
function updated(p, game) {
  const d = repoInfo[p.id];
  if (!d) return '';
  const date = new Date(d).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
  return `<span class="mission-updated">${game ? 'Última partida' : 'Actualizado'}: ${date}</span>`;
}
function missionCard(p) {
  const game = isGame();
  const stack = `<div class="stack">${p.stack.map((s) => `<span>${s}</span>`).join('')}</div>`;
  const right = p.status
    ? `<span class="badge">${game ? p.status.toUpperCase() : p.status}</span>`
    : (game ? `<span class="stars" title="Dificultad">${stars(p.difficulty)}</span>` : '');
  if (p.boss) {
    return `
    <article class="mission boss">
      <div class="boss-col">
        <span class="boss-label">${game ? '⚠ JEFE FINAL · PROYECTO DE FIN DE CICLO' : 'Proyecto destacado · Fin de ciclo DAW'}</span>
        <h3>${p.title}</h3>
        <p>${p.summary}</p>
        <div class="mission-top"><span class="mission-lang">${p.lang}</span>${game ? `<span class="stars" title="Dificultad">${stars(p.difficulty)}</span>` : ''}</div>
        ${stack}
      </div>
      <div class="boss-col">
        <p class="pixel small accent">${game ? 'BOTÍN OBTENIDO' : 'Funcionalidades clave'}</p>
        <ul class="loot">${p.loot.map((l) => `<li>${l}</li>`).join('')}</ul>
        ${links(p, game)}
        ${updated(p, game)}
      </div>
    </article>`;
  }
  return `
    <article class="mission">
      <div class="mission-top"><span class="mission-lang">${p.lang}</span>${right}</div>
      <h3>${p.title}</h3>
      <p>${p.summary}</p>
      ${stack}
      ${links(p, game)}
      ${updated(p, game)}
    </article>`;
}
function renderMissions() {
  $('#filters').innerHTML = langs.map((l) =>
    `<button class="filter" role="tab" aria-selected="${l === currentFilter}" data-lang="${l}">${l}</button>`).join('');
  const list = PROJECTS.filter((p) => currentFilter === 'Todas' || p.lang === currentFilter);
  $('#missions').innerHTML = list.map(missionCard).join('');
}
$('#filters').addEventListener('click', (e) => {
  const b = e.target.closest('.filter');
  if (!b) return;
  currentFilter = b.dataset.lang;
  renderMissions();
});
$('#statMissions').textContent = PROJECTS.length;
renderMissions();

// Datos en vivo desde GitHub (si falla, la web funciona igual)
fetch(`https://api.github.com/users/${GITHUB_USER}/repos?per_page=100`)
  .then((r) => (r.ok ? r.json() : Promise.reject()))
  .then((repos) => {
    repos.forEach((r) => (repoInfo[r.name] = r.pushed_at));
    $('#statRepos').textContent = repos.length;
    renderMissions();
  })
  .catch(() => {});

/* ---------- Contacto ---------- */
(function contact() {
  const cards = [
    `<a class="contact-card" href="mailto:${CONTACT.email}">
      <span class="k">Email</span><span class="v">${CONTACT.email}</span><span class="arrow">↗</span>
      <button class="copy-btn" type="button" data-copy="${CONTACT.email}">Copiar</button>
    </a>`,
  ];
  if (CONTACT.linkedin) {
    cards.push(`<a class="contact-card" href="${CONTACT.linkedin}" target="_blank" rel="noopener">
      <span class="k">LinkedIn</span><span class="v">Manuel Zárate</span><span class="arrow">↗</span></a>`);
  }
  cards.push(`<a class="contact-card" href="${CONTACT.github}" target="_blank" rel="noopener">
    <span class="k">GitHub</span><span class="v">@${GITHUB_USER}</span><span class="arrow">↗</span></a>`);
  $('#contactLinks').innerHTML = cards.join('');
  $('#contactLinks').addEventListener('click', (e) => {
    const b = e.target.closest('.copy-btn');
    if (!b) return;
    e.preventDefault();
    navigator.clipboard?.writeText(b.dataset.copy).then(
      () => toast('Email copiado ✓'),
      () => toast(b.dataset.copy),
    );
  });
})();

/* ---------- Zona Arcade ---------- */
const recordKey = (id) => `mz-record-${id}`;
function recordText(g) {
  const r = store.get(recordKey(g.id), null);
  return r === null ? 'SIN RÉCORD' : `RÉCORD: ${r} ${g.unit}`;
}
function renderCabinets(activeId) {
  $('#cabinets').innerHTML = GAMES.map((g) => `
    <button class="cabinet${g.id === activeId ? ' active' : ''}" data-id="${g.id}" style="--c:${g.color}">
      <span class="cabinet-icon" aria-hidden="true">${g.icon}</span>
      <h3>${g.name}</h3>
      <p>${g.desc}</p>
      <span class="record">${recordText(g)}</span>
    </button>`).join('');
}

let current = null, cleanup = null;
function openGame(id) {
  const g = GAMES.find((x) => x.id === id);
  if (!g) return;
  if (cleanup) cleanup();
  current = g;
  const body = $('#screenBody');
  body.innerHTML = '';
  $('#screenTitle').textContent = `▶ ${g.name.toUpperCase()}`;
  $('#screenHelp').textContent = g.help;
  $('#screen').hidden = false;
  $('#screen').style.borderColor = g.color;
  cleanup = g.mount(body, {
    record(value) {
      const prev = store.get(recordKey(g.id), null);
      const isBest = prev === null || (g.better === 'high' ? value > prev : value < prev);
      if (isBest && (g.better === 'low' || value > 0)) {
        store.set(recordKey(g.id), value);
        renderCabinets(g.id);
        return true;
      }
      return false;
    },
    toast,
    xp(n) { addXP(n); if (n > 0) toast(`+${Math.round(n)} XP`); },
  });
  renderCabinets(g.id);
}
function closeGame() {
  if (cleanup) cleanup();
  cleanup = null;
  current = null;
  $('#screen').hidden = true;
  $('#screenBody').innerHTML = '';
  renderCabinets();
}
$('#cabinets').addEventListener('click', (e) => {
  const c = e.target.closest('.cabinet');
  if (!c) return;
  openGame(c.dataset.id);
  $('#screen').scrollIntoView({ behavior: 'smooth', block: 'start' });
});
$('#screenRestart').addEventListener('click', () => current && openGame(current.id));
$('#screenClose').addEventListener('click', closeGame);
renderCabinets();

/* ---------- Animaciones al hacer scroll ---------- */
const io = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    e.target.querySelectorAll('.bar-fill').forEach((b) => (b.style.width = b.dataset.value + '%'));
    io.unobserve(e.target);
  });
}, { threshold: 0.15 });
function observeReveals() {
  document.querySelectorAll('.section-head, .panel, .cabinets, .continue').forEach((n) => {
    if (n.classList.contains('in')) return;
    n.classList.add('reveal');
    io.observe(n);
  });
}
observeReveals();

/* ---------- CONTINUE? cuenta atrás (modo juego) ---------- */
(function countdown() {
  const out = $('#countdown');
  let n = 9, timer = null;
  const obs = new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !timer && n > 0) {
      timer = setInterval(() => {
        n--;
        out.textContent = n;
        if (n === 0) {
          clearInterval(timer);
          out.textContent = 'GAME OVER';
          out.style.fontSize = 'clamp(28px, 7vw, 56px)';
          const t = $('#continueText');
          t.dataset.game = '…es broma. Escríbeme igualmente 😄';
          t.textContent = t.dataset.game;
        }
      }, 1000);
    }
  }, { threshold: 0.6 });
  obs.observe(out);
})();

/* ---------- Cambio de modo ---------- */
const swappable = document.querySelectorAll('[data-game], [data-game-href]');
swappable.forEach((n) => {
  if (n.dataset.game !== undefined) n.dataset.pro = n.innerHTML;
  if (n.dataset.gameHref) n.dataset.proHref = n.getAttribute('href');
});

function applyMode(game, revealAll = true) {
  root.classList.toggle('game', game);
  swappable.forEach((n) => {
    if (n.dataset.game !== undefined) {
      n.innerHTML = game ? n.dataset.game : n.dataset.pro;
    }
    if (n.dataset.gameHref) n.setAttribute('href', game ? n.dataset.gameHref : n.dataset.proHref);
  });
  $('#modeBtn').setAttribute('aria-pressed', game);
  $('#modeBtn').setAttribute('aria-label', game ? 'Volver al modo profesional' : 'Activar Game Mode');
  document.title = game ? 'Manuel Zárate · Player 1' : 'Manuel Zárate · Full-Stack Developer';
  if (!game) closeGame();
  renderMissions();
  window.refreshBackgroundColors();
  window.redrawBackground();
  if (!revealAll) return;
  // Lo que estaba oculto no ha pasado por el observer: mostrarlo ya
  document.querySelectorAll('.reveal').forEach((n) => {
    n.classList.add('in');
    n.querySelectorAll('.bar-fill').forEach((b) => (b.style.width = b.dataset.value + '%'));
  });
}

function switchMode(game, then) {
  store.set('mz-mode', game ? 'game' : 'pro');
  if (reduceMotion) { applyMode(game); then && then(); return; }
  const warp = $('#warp');
  warp.className = `warp ${game ? 'to-game' : 'to-pro'}`;
  $('#warpText').textContent = game ? 'LOADING GAME MODE…' : 'Iniciando modo profesional';
  void warp.offsetWidth;
  warp.classList.add('on');
  if (game) { beep(523, 90); setTimeout(() => beep(784, 160), 100); }
  setTimeout(() => {
    applyMode(game);
    if (then) then(); else scrollTo({ top: 0, behavior: 'instant' });
  }, 700);
  setTimeout(() => warp.classList.remove('on'), 1050);
  if (game) setTimeout(() => toast('PLAYER 1 ENTRA EN JUEGO'), 1200);
}

$('#modeBtn').addEventListener('click', () => switchMode(!isGame()));
$('#labPlay').addEventListener('click', () =>
  switchMode(true, () => $('#arcade').scrollIntoView({ behavior: 'instant', block: 'start' })));

// Estado inicial (el script del <head> ya puso la clase si tocaba)
applyMode(isGame(), false);

/* ---------- Tema claro / oscuro (modo profesional) ---------- */
function applyTheme(theme) {
  root.setAttribute('data-theme', theme);
  $('#themeBtn').setAttribute('aria-label', theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro');
  window.refreshBackgroundColors();
  window.redrawBackground();
}
$('#themeBtn').addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
  store.set('mz-theme', next);
  applyTheme(next);
});
applyTheme(root.getAttribute('data-theme') || 'dark');

/* ---------- Código Konami ---------- */
(function konami() {
  const code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let pos = 0;
  document.addEventListener('keydown', (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    pos = k === code[pos] ? pos + 1 : (k === code[0] ? 1 : 0);
    if (pos === code.length) {
      pos = 0;
      if (!isGame()) { switchMode(true); return; }
      root.classList.toggle('konami');
      addXP(999);
      toast('🎮 MODO SECRETO · +999 XP');
    }
  });
})();

$('#year').textContent = new Date().getFullYear();
