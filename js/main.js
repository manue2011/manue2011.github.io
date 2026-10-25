const $ = (s, root = document) => root.querySelector(s);

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

/* ---------- Fondo de estrellas pixeladas ---------- */
(function stars() {
  const canvas = $('#stars');
  const ctx = canvas.getContext('2d');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const palette = ['#b8ff3b', '#3ee6ff', '#ff4fa0', '#e9ebf8', '#e9ebf8', '#e9ebf8'];
  let pts = [];
  function resize() {
    canvas.width = innerWidth;
    canvas.height = innerHeight;
    const count = Math.floor((innerWidth * innerHeight) / 9000);
    pts = Array.from({ length: count }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      s: Math.random() < 0.15 ? 3 : 2,
      v: 0.1 + Math.random() * 0.4,
      c: palette[Math.floor(Math.random() * palette.length)],
      a: 0.2 + Math.random() * 0.6,
    }));
  }
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of pts) {
      ctx.globalAlpha = p.a;
      ctx.fillStyle = p.c;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s);
      if (!reduce) {
        p.y += p.v;
        if (p.y > canvas.height) { p.y = -4; p.x = Math.random() * canvas.width; }
      }
    }
    if (!reduce) requestAnimationFrame(draw);
  }
  resize();
  addEventListener('resize', () => { resize(); if (reduce) draw(); });
  draw();
})();

/* ---------- Texto que se escribe solo ---------- */
(function typing() {
  const roles = ['Desarrollador Full-Stack', 'Constructor de APIs REST', 'Fan de las bases de datos', 'Domador de bugs', 'Jugador nº 1'];
  const out = $('#typed');
  let r = 0, i = 0, del = false;
  (function step() {
    const word = roles[r];
    out.textContent = word.slice(0, i);
    if (!del && i === word.length) { del = true; return setTimeout(step, 1600); }
    if (del && i === 0) { del = false; r = (r + 1) % roles.length; }
    i += del ? -1 : 1;
    setTimeout(step, del ? 35 : 70);
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

/* ---------- Ficha de personaje ---------- */
$('#bars').innerHTML = SKILL_BARS.map((b) => `
  <li>
    <div class="bar-label"><span>${b.name}</span><span>${b.value}/100</span></div>
    <div class="bar-track"><div class="bar-fill" style="color:var(--${b.color})" data-value="${b.value}"></div></div>
  </li>`).join('');
$('#inventory').innerHTML = INVENTORY.map((s) => `<li>${s}</li>`).join('');

/* ---------- Misiones ---------- */
const langs = ['Todas', ...new Set(PROJECTS.map((p) => p.lang))];
let currentFilter = 'Todas';
const repoInfo = {};

function stars(n) {
  return '★'.repeat(n) + `<span class="off">${'★'.repeat(5 - n)}</span>`;
}
function links(p) {
  const repo = `<a href="https://github.com/${GITHUB_USER}/${p.id}" target="_blank" rel="noopener">Código →</a>`;
  const demo = p.demo ? `<a href="${p.demo}" target="_blank" rel="noopener">Jugar demo ▶</a>` : '';
  return `<div class="mission-links">${demo}${repo}</div>`;
}
function updated(p) {
  const d = repoInfo[p.id];
  if (!d) return '';
  const date = new Date(d).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' });
  return `<span class="mission-updated">Última partida: ${date}</span>`;
}
function missionCard(p) {
  const stack = `<div class="stack">${p.stack.map((s) => `<span>${s}</span>`).join('')}</div>`;
  if (p.boss) {
    return `
    <article class="mission boss">
      <div class="boss-col">
        <span class="boss-label">⚠ JEFE FINAL · PROYECTO DE FIN DE CICLO</span>
        <h3>${p.title}</h3>
        <p>${p.summary}</p>
        <div class="mission-top"><span class="mission-lang">${p.lang}</span><span class="stars" title="Dificultad">${stars(p.difficulty)}</span></div>
        ${stack}
      </div>
      <div class="boss-col">
        <p class="pixel small lime">BOTÍN OBTENIDO</p>
        <ul class="loot">${p.loot.map((l) => `<li>${l}</li>`).join('')}</ul>
        ${links(p)}
        ${updated(p)}
      </div>
    </article>`;
  }
  return `
    <article class="mission">
      <div class="mission-top">
        <span class="mission-lang">${p.lang}</span>
        ${p.status ? `<span class="badge">${p.status.toUpperCase()}</span>` : `<span class="stars" title="Dificultad">${stars(p.difficulty)}</span>`}
      </div>
      <h3>${p.title}</h3>
      <p>${p.summary}</p>
      ${stack}
      ${links(p)}
      ${updated(p)}
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

/* ---------- Zona Arcade ---------- */
const recordKey = (id) => `mz-record-${id}`;
function recordText(g) {
  const r = store.get(recordKey(g.id), null);
  return r === null ? 'SIN RÉCORD' : `RÉCORD: ${r} ${g.unit}`;
}
function renderCabinets(activeId) {
  $('#cabinets').innerHTML = GAMES.map((g) => `
    <button class="cabinet${g.id === activeId ? ' active' : ''}" data-game="${g.id}" style="--c:${g.color}">
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
  openGame(c.dataset.game);
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
document.querySelectorAll('.section-head, .panel, .cabinets, .continue').forEach((n) => {
  n.classList.add('reveal');
  io.observe(n);
});

/* ---------- CONTINUE? cuenta atrás ---------- */
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
          $('#continueText').textContent = '…es broma. Escríbeme igualmente 😄';
        }
      }, 1000);
    }
  }, { threshold: 0.6 });
  obs.observe(out);
})();

/* ---------- Código Konami ---------- */
(function konami() {
  const code = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  let pos = 0;
  document.addEventListener('keydown', (e) => {
    const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    pos = k === code[pos] ? pos + 1 : (k === code[0] ? 1 : 0);
    if (pos === code.length) {
      pos = 0;
      document.body.classList.toggle('konami');
      addXP(999);
      toast('🎮 MODO SECRETO · +999 XP');
    }
  });
})();

$('#year').textContent = new Date().getFullYear();
