// Zona Arcade: cada juego monta su interfaz dentro de `body` y devuelve una función de limpieza.
// api: { record(value) -> true si es récord, toast(msg), xp(n) }

const rand = (n) => Math.floor(Math.random() * n);
const shuffle = (arr) => {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const el = (tag, cls, html) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (html !== undefined) e.innerHTML = html;
  return e;
};

let audioCtx = null;
function beep(freq, ms = 180) {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'square';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.06, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + ms / 1000);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + ms / 1000);
  } catch (e) { /* sin audio, no pasa nada */ }
}

/* ---------------- 1. Secuencia (Simon) ---------------- */
function mountSimon(body, api) {
  const colors = ['#b8ff3b', '#ff4fa0', '#3ee6ff', '#ffd23f'];
  const tones = [330, 392, 494, 587];
  const timers = [];
  let seq = [], idx = 0, accepting = false;

  const hud = el('div', 'game-hud', 'NIVEL <b id="sLvl">0</b>');
  const msg = el('p', 'game-msg', 'Pulsa EMPEZAR y memoriza la secuencia');
  const pad = el('div', 'simon');
  const pads = colors.map((c, i) => {
    const b = el('button');
    b.style.background = c;
    b.style.color = c;
    b.setAttribute('aria-label', `Botón ${i + 1}`);
    b.disabled = true;
    b.addEventListener('click', () => press(i));
    pad.appendChild(b);
    return b;
  });
  const start = el('button', 'btn btn-primary pixel', 'EMPEZAR');
  start.addEventListener('click', begin);
  body.append(hud, pad, msg, start);

  function later(fn, ms) { timers.push(setTimeout(fn, ms)); }
  function flash(i, ms) {
    pads[i].classList.add('lit');
    beep(tones[i], ms);
    later(() => pads[i].classList.remove('lit'), ms);
  }
  function setPads(on) { pads.forEach((p) => (p.disabled = !on)); }

  function begin() {
    seq = [];
    start.hidden = true;
    nextRound();
  }
  function nextRound() {
    seq.push(rand(4));
    hud.querySelector('#sLvl').textContent = seq.length;
    msg.textContent = 'Observa…';
    accepting = false;
    setPads(false);
    const speed = Math.max(260, 620 - seq.length * 25);
    seq.forEach((n, i) => later(() => flash(n, speed * 0.7), 500 + i * speed));
    later(() => {
      accepting = true;
      idx = 0;
      setPads(true);
      msg.textContent = 'Tu turno';
    }, 500 + seq.length * speed);
  }
  function press(i) {
    if (!accepting) return;
    flash(i, 200);
    if (seq[idx] !== i) {
      accepting = false;
      setPads(false);
      beep(110, 500);
      const score = seq.length - 1;
      const best = api.record(score);
      msg.innerHTML = `GAME OVER · Nivel ${score}${best ? '<br>¡NUEVO RÉCORD!' : ''}`;
      api.xp(score * 10);
      start.textContent = 'OTRA VEZ';
      start.hidden = false;
      return;
    }
    idx++;
    if (idx === seq.length) {
      accepting = false;
      setPads(false);
      msg.textContent = '¡Bien!';
      later(nextRound, 800);
    }
  }

  return () => timers.forEach(clearTimeout);
}

/* ---------------- 2. Memoria (parejas) ---------------- */
function mountMemory(body, api) {
  const symbols = ['JS', 'PY', 'SQL', '</>', '{ }', 'git', 'λ', '#!'];
  let first = null, lock = false, moves = 0, found = 0, t0 = 0, tick = null;
  const timers = [];

  const hud = el('div', 'game-hud', 'MOVIMIENTOS <b id="mMoves">0</b> TIEMPO <b id="mTime">0s</b>');
  const grid = el('div', 'memory');
  const msg = el('p', 'game-msg', 'Encuentra las 8 parejas con el mínimo de movimientos');
  body.append(hud, grid, msg);

  shuffle([...symbols, ...symbols]).forEach((s) => {
    const c = el('button', 'card', s);
    c.dataset.sym = s;
    c.setAttribute('aria-label', 'Carta oculta');
    c.addEventListener('click', () => flip(c));
    grid.appendChild(c);
  });

  function flip(c) {
    if (lock || c === first || c.classList.contains('done')) return;
    if (!t0) {
      t0 = Date.now();
      tick = setInterval(() => (hud.querySelector('#mTime').textContent = Math.floor((Date.now() - t0) / 1000) + 's'), 250);
    }
    c.classList.add('flip');
    c.setAttribute('aria-label', c.dataset.sym);
    beep(440, 60);
    if (!first) { first = c; return; }

    moves++;
    hud.querySelector('#mMoves').textContent = moves;
    if (first.dataset.sym === c.dataset.sym) {
      first.classList.add('done');
      c.classList.add('done');
      first = null;
      found++;
      beep(660, 120);
      if (found === symbols.length) {
        clearInterval(tick);
        const secs = Math.floor((Date.now() - t0) / 1000);
        const best = api.record(moves);
        msg.innerHTML = `¡COMPLETADO! ${moves} movimientos en ${secs}s${best ? '<br>¡NUEVO RÉCORD!' : ''}`;
        api.xp(Math.max(20, 200 - moves * 5));
      }
    } else {
      lock = true;
      const a = first;
      first = null;
      timers.push(setTimeout(() => {
        a.classList.remove('flip');
        c.classList.remove('flip');
        a.setAttribute('aria-label', 'Carta oculta');
        c.setAttribute('aria-label', 'Carta oculta');
        lock = false;
      }, 800));
    }
  }

  return () => { clearInterval(tick); timers.forEach(clearTimeout); };
}

/* ---------------- 3. Descifra el código ---------------- */
function mountCode(body, api) {
  const LEN = 4, MAX = 10;
  const secret = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, LEN);
  let guess = [], tries = 0, over = false;

  const hud = el('div', 'game-hud', `INTENTOS <b id="cTries">0</b>/${MAX}`);
  const board = el('div', 'code-board');
  const input = el('div', 'code-input');
  const slots = Array.from({ length: LEN }, () => input.appendChild(el('div', 'code-slot')));
  const keypad = el('div', 'keypad');
  const msg = el('p', 'game-msg',
'4 dígitos distintos<br><span class="peg-hit">●</span> exacto · <span class="peg-near">●</span> existe en otra posición');

  const keys = {};
  for (let d = 0; d <= 9; d++) {
    const k = el('button', 'key', d);
    k.addEventListener('click', () => add(d));
    keys[d] = k;
    keypad.appendChild(k);
  }
  const del = el('button', 'key wide', '⌫ Borrar');
  del.addEventListener('click', back);
  const ok = el('button', 'key wide go', 'Probar ↵');
  ok.addEventListener('click', submit);
  keypad.append(del, ok);
  body.append(hud, board, input, keypad, msg);
  render();

  function render() {
    slots.forEach((s, i) => {
      s.textContent = guess[i] ?? '';
      s.classList.toggle('cur', i === guess.length && !over);
    });
    for (let d = 0; d <= 9; d++) keys[d].disabled = over || guess.includes(d) || guess.length >= LEN;
    del.disabled = over || !guess.length;
    ok.disabled = over || guess.length !== LEN;
  }
  function add(d) {
    if (over || guess.length >= LEN || guess.includes(d)) return;
    guess.push(d);
    beep(500 + d * 30, 50);
    render();
  }
  function back() {
    if (over) return;
    guess.pop();
    render();
  }
  function submit() {
    if (over || guess.length !== LEN) return;
    tries++;
    let hit = 0, near = 0;
    guess.forEach((d, i) => {
      if (secret[i] === d) hit++;
      else if (secret.includes(d)) near++;
    });
    const pegs = '<span class="peg-hit">●</span>'.repeat(hit) +
      '<span class="peg-near">●</span>'.repeat(near) +
      '<span class="peg-miss">○</span>'.repeat(LEN - hit - near);
    const row = el('div', 'code-row', `<span class="muted">${tries}.</span><span class="digits">${guess.join('')}</span><span class="pegs">${pegs}</span>`);
    board.appendChild(row);
    hud.querySelector('#cTries').textContent = tries;
    guess = [];

    if (hit === LEN) {
      over = true;
      beep(880, 300);
      const best = api.record(tries);
      msg.innerHTML = `¡CÓDIGO DESCIFRADO en ${tries} intentos!${best ? '<br>¡NUEVO RÉCORD!' : ''}`;
      api.xp(Math.max(20, 220 - tries * 20));
    } else if (tries >= MAX) {
      over = true;
      beep(110, 500);
      msg.innerHTML = `SIN INTENTOS · El código era ${secret.join('')}`;
    } else {
      beep(hit ? 520 : 260, 100);
    }
    render();
  }

  function onKey(e) {
    if (e.target.matches('input, textarea')) return;
    if (/^[0-9]$/.test(e.key)) add(Number(e.key));
    else if (e.key === 'Backspace') back();
    else if (e.key === 'Enter') { e.preventDefault(); submit(); }
  }
  document.addEventListener('keydown', onKey);
  return () => document.removeEventListener('keydown', onKey);
}

/* ---------------- 4. Cálculo rápido ---------------- */
function mountMath(body, api) {
  const DURATION = 30;
  let score = 0, answer = 0, end = 0, tick = null, playing = false;

  const hud = el('div', 'game-hud', 'ACIERTOS <b id="qScore">0</b> TIEMPO <b id="qTime">30</b>');
  const bar = el('div', 'timebar', '<div></div>');
  const q = el('div', 'math-q', '? + ?');
  const input = el('input', 'math-in');
  input.type = 'text';
  input.inputMode = 'numeric';
  input.autocomplete = 'off';
  input.setAttribute('aria-label', 'Tu respuesta');
  input.disabled = true;
  const msg = el('p', 'game-msg', '30 segundos. Escribe el resultado: se comprueba solo.');
  const start = el('button', 'btn btn-primary pixel', 'EMPEZAR');
  start.addEventListener('click', begin);
  body.append(hud, bar, q, input, msg, start);

  function problem() {
    const lvl = Math.min(score, 20);
    const op = lvl < 4 ? rand(2) : rand(3);
    let a, b;
    if (op === 2) {
      a = 2 + rand(4 + Math.floor(lvl / 2));
      b = 2 + rand(9);
      answer = a * b;
      q.textContent = `${a} × ${b}`;
    } else {
      const max = 10 + lvl * 5;
      a = 1 + rand(max);
      b = 1 + rand(max);
      if (op === 1 && b > a) [a, b] = [b, a];
      answer = op === 0 ? a + b : a - b;
      q.textContent = `${a} ${op === 0 ? '+' : '−'} ${b}`;
    }
    input.value = '';
  }
  function begin() {
    score = 0;
    playing = true;
    hud.querySelector('#qScore').textContent = 0;
    start.hidden = true;
    msg.textContent = '';
    input.disabled = false;
    input.focus();
    problem();
    end = Date.now() + DURATION * 1000;
    tick = setInterval(update, 100);
  }
  function update() {
    const left = Math.max(0, end - Date.now());
    hud.querySelector('#qTime').textContent = Math.ceil(left / 1000);
    bar.firstChild.style.width = (left / (DURATION * 10)) + '%';
    if (!left) finish();
  }
  function finish() {
    clearInterval(tick);
    playing = false;
    input.disabled = true;
    q.textContent = '⏱';
    const best = api.record(score);
    msg.innerHTML = `TIEMPO · ${score} aciertos${best ? '<br>¡NUEVO RÉCORD!' : ''}`;
    api.xp(score * 8);
    start.textContent = 'OTRA VEZ';
    start.hidden = false;
  }
  input.addEventListener('input', () => {
    if (!playing) return;
    const v = input.value.replace(/[^0-9]/g, '');
    input.value = v;
    if (v === String(answer)) {
      score++;
      hud.querySelector('#qScore').textContent = score;
      input.classList.remove('bad');
      input.classList.add('ok');
      beep(660, 60);
      setTimeout(() => input.classList.remove('ok'), 150);
      problem();
    } else if (v.length >= String(answer).length) {
      input.classList.remove('bad');
      void input.offsetWidth;
      input.classList.add('bad');
      beep(150, 120);
      input.value = '';
    }
  });

  return () => clearInterval(tick);
}

/* ---------------- 5. Apaga las luces ---------------- */
function mountLights(body, api) {
  const N = 5;
  let board = [], moves = 0, won = false;

  const hud = el('div', 'game-hud', 'MOVIMIENTOS <b id="lMoves">0</b>');
  const grid = el('div', 'lights');
  const msg = el('p', 'game-msg', 'Cada casilla cambia ella y sus vecinas en cruz. Apágalas todas.');
  body.append(hud, grid, msg);

  const cells = [];
  for (let i = 0; i < N * N; i++) {
    const c = el('button', 'light');
    c.setAttribute('aria-label', `Fila ${Math.floor(i / N) + 1}, columna ${(i % N) + 1}`);
    c.addEventListener('click', () => press(i));
    grid.appendChild(c);
    cells.push(c);
  }

  function toggle(i) {
    const r = Math.floor(i / N), col = i % N;
    [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dr, dc]) => {
      const rr = r + dr, cc = col + dc;
      if (rr >= 0 && rr < N && cc >= 0 && cc < N) board[rr * N + cc] = !board[rr * N + cc];
    });
  }
  function render() {
    cells.forEach((c, i) => {
      c.classList.toggle('on', board[i]);
      c.setAttribute('aria-pressed', board[i]);
    });
    hud.querySelector('#lMoves').textContent = moves;
  }
  function press(i) {
    if (won) return;
    toggle(i);
    moves++;
    beep(board[i] ? 600 : 300, 50);
    render();
    if (board.every((b) => !b)) {
      won = true;
      const best = api.record(moves);
      msg.innerHTML = `¡LUCES FUERA en ${moves} movimientos!${best ? '<br>¡NUEVO RÉCORD!' : ''}`;
      api.xp(Math.max(20, 200 - moves * 4));
    }
  }

  // Generar un tablero resoluble pulsando casillas al azar desde el estado apagado
  board = Array(N * N).fill(false);
  do {
    for (let k = 0; k < 7; k++) toggle(rand(N * N));
  } while (board.filter(Boolean).length < 5);
  render();

  return () => {};
}

const GAMES = [
  {
    id: 'simon', name: 'Secuencia', icon: '🎵', color: '#b8ff3b',
    desc: 'Memoria de trabajo: repite patrones cada vez más largos.',
    help: 'Observa el orden en que se iluminan los botones y repítelo. Cada ronda añade un paso más.',
    better: 'high', unit: 'nivel', mount: mountSimon,
  },
  {
    id: 'memory', name: 'Parejas Dev', icon: '🃏', color: '#ff4fa0',
    desc: 'Memoria visual con símbolos de programador.',
    help: 'Levanta dos cartas por turno. Si coinciden, se quedan. Gana con el menor número de movimientos.',
    better: 'low', unit: 'mov.', mount: mountMemory,
  },
  {
    id: 'code', name: 'Descifra el código', icon: '🔐', color: '#3ee6ff',
    desc: 'Lógica deductiva: adivina 4 dígitos en 10 intentos.',
    help: 'Usa el teclado o los botones. Verde: dígito correcto en su sitio. Amarillo: el dígito existe pero en otra posición.',
    better: 'low', unit: 'intentos', mount: mountCode,
  },
  {
    id: 'math', name: 'Cálculo rápido', icon: '⚡', color: '#ffd23f',
    desc: 'Agilidad mental: cuántas operaciones resuelves en 30 s.',
    help: 'Escribe el resultado; si es correcto pasa solo a la siguiente. La dificultad sube con cada acierto.',
    better: 'high', unit: 'aciertos', mount: mountMath,
  },
  {
    id: 'lights', name: 'Apaga las luces', icon: '💡', color: '#c08bff',
    desc: 'Puzzle clásico de lógica en cuadrícula 5×5.',
    help: 'Al pulsar una casilla cambias su estado y el de sus vecinas arriba, abajo, izquierda y derecha. Apágalas todas.',
    better: 'low', unit: 'mov.', mount: mountLights,
  },
];
