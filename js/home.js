// Seer EF landing: theme toggle (default dark, choice remembered when storage is available).
(function () {
  var root = document.documentElement;
  var KEY = 'seer-theme';

  function current() { return root.dataset.theme === 'light' ? 'light' : 'dark'; }

  function sync() {
    var light = current() === 'light';
    document.querySelectorAll('[data-theme-toggle]').forEach(function (b) {
      b.setAttribute('aria-pressed', String(light));
      b.setAttribute('title', light ? 'Light theme on' : 'Light theme off');
    });
  }

  function set(theme) {
    root.dataset.theme = theme;
    try { localStorage.setItem(KEY, theme); } catch (e) { /* storage unavailable: theme still applies for this visit */ }
    sync();
  }

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-theme-toggle]');
    if (!b) return;
    var next = current() === 'light' ? 'dark' : 'light', go = function () { set(next); };
    if (window.Motion) Motion.theme(go, b); else go();
  });

  sync();
})();

/* Hero card stack: two full market cards, one in front and one behind. The card behind is a button; it springs
   forward over the other, which eases back and dims, and the card that arrives replays its sequence: dots usher
   in one by one, the percentage climbs and the bar fills.
   Every load plays the full entrance: the front card plays, then the back card comes out from behind it and plays its own.
   Reduced motion: every change is instant and shows final values. Without this script both cards render at rest with their final values.
   One requestAnimationFrame loop runs the springs, the climbs and the dot pops, and only while something moves. */
(function () {
  var root = document.documentElement;
  var host = document.querySelector('.hero-cards');
  var els = host ? host.querySelectorAll('.hcard') : [];
  if (els.length !== 2) { root.classList.add('hc-ready'); return; }

  var mqR = matchMedia('(prefers-reduced-motion: reduce)');
  var mqFine = matchMedia('(hover: hover) and (pointer: fine)');
  var live = document.getElementById('hc-live');
  var K = 190, C = 24;              /* card moves: stiffness and damping (mass 1), as in the approved prototype */
  var DIM = 0.26;                   /* veil over the card behind */
  var CLIMB = 1500;    /* number climb */
  var HAND = 170;                   /* a swap hands the button and the reading order over after this long */
  var LIFT = -4;                    /* hover lift of the card behind, design px */
  var SWAPPED = 'seer-hero-swapped';
  var G = null, front = 0, pending = 0, emergeT = 0, chipT = 0, raf = 0, last = 0, btn = null, chip = null;

  function reduced() { return mqR.matches; }
  function geometry() {
    var cs = getComputedStyle(host), n = function (k) { return parseFloat(cs.getPropertyValue(k)) || 0; };
    G = { front: { x: n('--hc-fx'), y: n('--hc-fy'), s: 1, d: 0, b: 0 },
          back: { x: n('--hc-bx'), y: n('--hc-by'), s: n('--hc-bs') || 1, d: DIM, b: 1 } };
  }
  function sp(x) { return { x: x, v: 0, t: x }; }

  var cards = Array.prototype.map.call(els, function (el) {
    var pct = el.querySelector('.mpct');
    return { el: el, body: el.querySelector('.hc-body'), veil: el.querySelector('.hc-veil'), pct: pct,
      fill: el.querySelector('.mbar i'), dots: el.querySelectorAll('.hc-dots circle'), v: parseFloat(el.getAttribute('data-v')) || 0, text: pct.textContent,
      q: el.getAttribute('data-q') || '', say: el.getAttribute('data-say') || '',
      p: { x: sp(0), y: sp(0), s: sp(1), d: sp(0), o: sp(1), b: sp(0), l: sp(0) }, climb: null, dp: null, out: {} };
  });
  function other(c) { return c === cards[0] ? cards[1] : cards[0]; }

  /* ---------- springs: semi-implicit Euler in fixed 4ms substeps, so a dropped frame never changes the path ---------- */
  var EPS = { x: 0.01, y: 0.01, s: 0.0002, d: 0.0005, o: 0.0005, b: 0.0005, l: 0.01 };
  function stepCard(c, dt) {
    var moving = false, k, s, n, h, a, i;
    for (k in c.p) {
      s = c.p[k];
      if (s.x === s.t && s.v === 0) continue;
      n = Math.max(1, Math.ceil(dt / 0.004)); h = dt / n;
      for (i = 0; i < n; i++) { a = (s.t - s.x) * K - s.v * C; s.v += a * h; s.x += s.v * h; }
      if (Math.abs(s.t - s.x) < EPS[k] && Math.abs(s.v) < EPS[k] * 10) { s.x = s.t; s.v = 0; } else moving = true;
    }
    /* own layer only while moving, so the springs stay on the compositor and the text is re-rastered crisp at rest */
    if (moving !== c.moving) { c.moving = moving; c.el.classList.toggle('hc-moving', moving); }
    return moving;
  }
  function clamp(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }
  function put(c, key, val, write) { if (c.out[key] !== val) { c.out[key] = val; write(val); } }
  function render(c) {
    var p = c.p, st = c.el.style;
    put(c, 't', p.x.x.toFixed(2) + 'px ' + (p.y.x + p.l.x).toFixed(2) + 'px', function (v) { st.translate = v; });
    put(c, 's', p.s.x.toFixed(4), function (v) { st.scale = v; });
    put(c, 'o', clamp(p.o.x).toFixed(3), function (v) { st.opacity = v === '1.000' ? '' : v; });
    put(c, 'd', clamp(p.d.x).toFixed(3), function (v) { c.veil.style.opacity = v; });
    put(c, 'b', clamp(p.b.x).toFixed(3), function (v) { st.setProperty('--hc-b', v); });
    if (c.emerge) {
      /* the shadow stays off until the card has cleared the front one, so it never leaks out around it */
      var span = G.back.x - G.front.x, pr = span ? (p.x.x - G.front.x) / span : 1;
      put(c, 'h', clamp((pr - 0.5) / 0.4).toFixed(3), function (v) { st.setProperty('--hc-sh', v); });
      if (pr >= 0.995) { c.emerge = false; st.removeProperty('--hc-sh'); delete c.out.h; }
    }
  }
  /* move a card toward a role; from (optional) sets where it starts, jump lands it there at once */
  function target(c, role, o) {
    o = o || {};
    var g = G[role], p = c.p, t = { x: g.x, y: g.y, s: g.s, d: g.d, b: g.b, o: 1 }, k;
    for (k in t) {
      p[k].t = t[k];
      if (o.from && o.from[k] != null) { p[k].x = o.from[k]; p[k].v = 0; }
      if (o.jump) { p[k].x = t[k]; p[k].v = 0; }
    }
    if (o.jump) { p.l.x = p.l.t = 0; p.l.v = 0; }
  }
  function kick() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } }
  function tick(now) {
    raf = 0;
    var dt = Math.min(0.05, Math.max(0, (now - last) / 1000)), busy = false;
    last = now;
    cards.forEach(function (c) {
      if (stepCard(c, dt)) busy = true;
      render(c);
      if (c.climb && climbStep(c, now)) busy = true;
      if (c.dp && dotsStep(c, now)) busy = true;
    });
    if (busy) raf = requestAnimationFrame(tick);
  }

  /* ---------- the climb: 0 to the value with an ease-out, the bar fills at the same pace, lands exactly ---------- */
  function setPct(c, s) { var t = c.pct.firstChild; if (t && t.nodeValue !== s) t.nodeValue = s; }
  function climbStep(c, now) {
    var cl = c.climb, t = (now - cl.t0) / cl.dur;
    if (t < 0) return true;
    if (t >= 1) { setPct(c, c.text); c.fill.style.transform = ''; c.climb = null; return false; }
    var e = 1 - Math.pow(1 - t, 3.2);
    setPct(c, (c.v * e).toFixed(1) + '%');
    c.fill.style.transform = 'scaleX(' + (c.v / 100 * e).toFixed(4) + ')';
    return true;
  }
  function finish(c) {
    c.climb = null; setPct(c, c.text); c.fill.style.transform = '';
    if (c.dp) { c.dp = null; for (var i = 0; i < c.dots.length; i++) setR(c.dots[i], String(R)); }
  }
  /* the dots: each radius pops from 0 over 240ms on cubic-bezier(.2,.9,.3,1.25), 6ms after the one before, in
     document order (column by column, bottom to top). Only the dots in flight are written each frame. */
  var R = 2.3, STEP = 6, POP = 240, EASE = (function (x1, y1, x2, y2) {
    var lut = [], i, t, j = 0, xs = [], ys = [];
    for (i = 0; i <= 200; i++) { t = i / 200; xs.push(3 * x1 * t * (1 - t) * (1 - t) + 3 * x2 * t * t * (1 - t) + t * t * t); ys.push(3 * y1 * t * (1 - t) * (1 - t) + 3 * y2 * t * t * (1 - t) + t * t * t); }
    for (i = 0; i <= 100; i++) { t = i / 100; while (j < 199 && xs[j + 1] < t) j++; lut.push(ys[j] + (ys[j + 1] - ys[j]) * ((t - xs[j]) / ((xs[j + 1] - xs[j]) || 1))); }
    return function (p) { var f = p * 100, k = Math.floor(f); return k >= 100 ? 1 : lut[k] + (lut[k + 1] - lut[k]) * (f - k); };
  })(0.2, 0.9, 0.3, 1.25);
  function setR(dot, v) { if (dot.__r !== v) { dot.__r = v; dot.setAttribute('r', v); } }
  function dotsStep(c, now) {
    var d = c.dp, el = now - d.t0, list = c.dots, n = list.length, i, p;
    if (el < 0) return true;
    var hi = Math.min(n - 1, Math.floor(el / STEP));
    for (i = d.done; i <= hi; i++) {
      p = (el - i * STEP) / POP;
      if (p >= 1) { setR(list[i], String(R)); if (i === d.done) d.done++; }
      else setR(list[i], (R * EASE(p)).toFixed(2));
    }
    if (d.done >= n) { c.dp = null; return false; }
    return true;
  }
  /* play a card's sequence: dots, number and bar */
  function play(c, dotsAt, climbAt, dur, dots) {
    if (reduced()) { finish(c); return; }
    if (dots !== false) {
      for (var i = 0; i < c.dots.length; i++) setR(c.dots[i], '0');
      c.dp = { t0: performance.now() + dotsAt, done: 0 };
    }
    setPct(c, '0.0%');
    c.fill.style.transform = 'scaleX(0)';
    c.climb = { t0: performance.now() + climbAt, dur: dur };
    kick();
  }

  /* ---------- roles: the card behind holds the one button; the card in front is plain content ---------- */
  function makeButton() {
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'hc-hit';
    btn.addEventListener('click', swap);
    btn.addEventListener('pointerenter', function (e) { if (e.pointerType === 'mouse' && mqFine.matches) lift(true); });
    btn.addEventListener('pointerleave', function () { lift(false); });
    var done = false;
    try { done = !!sessionStorage.getItem(SWAPPED); } catch (e) { /* no storage: show the hint */ }
    if (!done) {
      chip = document.createElement('span');
      chip.className = 'hc-next';
      chip.setAttribute('aria-hidden', 'true');
      chip.innerHTML = 'Next market<svg viewBox="0 0 16 16" aria-hidden="true" focusable="false"><use href="#arrow"/></svg>';
      btn.appendChild(chip);
    }
  }
  function roles(withButton) {
    var f = cards[front], b = other(f);
    f.el.classList.add('is-front'); f.el.classList.remove('is-back'); f.el.style.zIndex = '';
    b.el.classList.add('is-back'); b.el.classList.remove('is-front'); b.el.style.zIndex = '';
    f.body.removeAttribute('aria-hidden');
    b.body.setAttribute('aria-hidden', 'true');
    if (!withButton && !btn) return;
    if (!btn) makeButton();
    btn.setAttribute('aria-label', 'Bring forward: ' + b.q);
    if (btn.parentNode !== b.el) {
      var had = document.activeElement === btn;
      b.el.appendChild(btn);
      if (had) btn.focus({ preventScroll: true });
    }
  }
  function lift(on) {
    if (reduced() || pending) on = false;
    var b = cards[front] === cards[0] ? cards[1] : cards[0];
    b.p.l.t = on ? LIFT : 0;
    cards[front].p.l.t = 0;
    kick();
  }
  function retireChip() {
    if (!chip) return;
    try { sessionStorage.setItem(SWAPPED, '1'); } catch (e) { /* no storage: the hint goes for this page view */ }
    var c = chip; chip = null;
    clearTimeout(chipT);
    c.classList.add('hc-bye');
    setTimeout(function () { if (c.parentNode) c.parentNode.removeChild(c); }, reduced() ? 0 : 140);
  }

  /* ---------- swap: the card behind springs forward over the other and replays; interruptible at any point ---------- */
  function swap() {
    if (pending) return;            /* a second tap inside the hand-over lands on the arriving card: ignore it */
    var inc = other(cards[front]), out = cards[front];
    front = cards.indexOf(inc);
    clearTimeout(emergeT);
    retireChip();
    if (live) live.textContent = 'In front: ' + inc.q + ' ' + inc.say;
    if (reduced()) {
      target(inc, 'front', { jump: true }); target(out, 'back', { jump: true });
      finish(inc); finish(out);
      cards.forEach(render);
      roles(true);
      return;
    }
    inc.el.style.zIndex = '3';
    target(inc, 'front'); target(out, 'back');
    inc.p.l.t = 0; out.p.l.t = 0;
    play(inc, HAND + 120, HAND, CLIMB);
    pending = setTimeout(function () { pending = 0; roles(true); }, HAND);
    kick();
  }

  /* ---------- start ---------- */
  function start() {
    geometry();
    var f = cards[front], b = other(f);
    if (reduced()) {
      target(f, 'front', { jump: true }); target(b, 'back', { jump: true });
      cards.forEach(render); roles(true);
      root.classList.add('hc-ready');
      return;
    }
    /* every load plays the full entrance, whether or not the page was seen earlier in the session */
    /* both cards wait unseen, the front one plays, then the back one comes out from behind it */
    var g = G.front;
    target(f, 'front', { from: { x: g.x, y: g.y + 22, s: 0.96, d: 0, o: 0, b: 0 } });
    f.p.x.t = g.x; f.p.y.t = g.y + 22; f.p.s.t = 0.96; f.p.o.t = 0;
    target(b, 'front', { jump: true }); b.p.o.x = b.p.o.t = 0; b.p.s.x = b.p.s.t = 0.94;
    cards.forEach(render);
    roles(false);
    root.classList.add('hc-ready');
    var t0 = Math.max(0, 280 - performance.now());
    emergeT = setTimeout(function () {
      target(f, 'front');
      play(f, 120, 200, CLIMB);
      emergeT = setTimeout(function () {
        target(b, 'back', { from: { x: g.x, y: g.y, s: 0.94, d: 1, o: 1, b: 0 } });
        b.emerge = true; b.el.style.setProperty('--hc-sh', '0'); b.out.h = '0.000';
        play(b, 120, 350, CLIMB);
        roles(true);
        if (chip) { chip.classList.add('hc-off'); chipT = setTimeout(function () { if (chip) chip.classList.remove('hc-off'); }, 700); }
        kick();
      }, 1900);
    }, t0);
  }

  /* the phone and wider stacks use different offsets: on a range change, land on the new ones */
  matchMedia('(max-width: 600px)').addEventListener('change', function () {
    geometry();
    cards.forEach(function (c) { target(c, c === cards[front] ? 'front' : 'back', { jump: true }); render(c); });
  });
  /* switching to reduced motion mid-sequence lands everything at once */
  mqR.addEventListener('change', function () {
    if (!reduced()) return;
    clearTimeout(emergeT); clearTimeout(pending); pending = 0;
    geometry();
    cards.forEach(function (c) { target(c, c === cards[front] ? 'front' : 'back', { jump: true }); finish(c); render(c); });
    roles(true);
  });

  start();
})();
