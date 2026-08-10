/* Beat-sequenced build-up of the FACT method figure.
 * Frames are cumulative renders of the authors' pptx (see tools/build_method_frames.py);
 * crossfading opaque frames makes only the newly-added elements appear.
 * Beat order and pacing mirror slide 10 of the promo video (T10 delays × 0.55).
 * Overlays (marching-dash conditioning arrows, G glow, pop badges) are drawn from
 * METHOD_META geometry in slide-percent coordinates. */
(function () {
  'use strict';

  var META = window.METHOD_META;
  var stage = document.querySelector('.method-stage');
  if (!stage || !META) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var DIR = 'static/images/method/';
  var VB_W = 100, VB_H = 100 / META.aspect;           // svg units: x == slide %, y scaled
  var ky = VB_H / 100;                                 // slide-% -> svg units (y)

  // [beat name, start ms, effect]
  var SCHED = [
    ['base',   150, 'fade'], ['P', 1100, 'fade'], ['A', 1815, 'fade'],
    ['G',     2695, 'fade'], ['V', 3465, 'fade'], ['I', 4015, 'fade'],
    ['cond',  5390, 'wipe'], ['wall', 6800, 'pop'],
    ['s1',    7800, 'fade'], ['s2', 8130, 'fade'],
    ['pb',    9000, 'fade'], ['suc', 9330, 'fade'],
    ['failA', 11000, 'fade'], ['mask', 11750, 'pop'], ['failR', 12300, 'fade']
  ];
  var CAPTIONS = {
    base: 'One shared <b>causal diffusion transformer</b> for action, value, and future video.',
    P:    'Token sequence: prefix <b>P</b> · noisy action <b>A</b> · clean action <b>G</b> · value <b>V</b> · future video <b>I</b>.',
    cond: 'Value and future video condition on the <b>clean action G</b> — the noisy <b>A</b> never sees it.',
    s1:   'Inference: <b>Stage 1 acts</b>, then <b>Stage 2 imagines</b> the consequences.',
    pb:   'Failure rollouts <b>mask the imitation loss</b> — failures teach consequences, not behavior.'
  };

  var caption = document.querySelector('.m-caption');
  var replayBtn = document.querySelector('.m-replay');
  var baseImg = stage.querySelector('.m-base');
  var under, over, overlay, fxHost = [];
  var frames = META.frames.map(function (f) { return DIR + f; });
  var beatIndex = {};
  META.beats.forEach(function (b, i) { beatIndex[b] = i; });

  var token = 0, playedOnce = false, ready = false, failed = false;

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function preload() {
    return Promise.all(frames.map(function (src) {
      return new Promise(function (resolve, reject) {
        var im = new Image();
        im.onload = resolve; im.onerror = reject; im.src = src;
      });
    }));
  }

  function buildLayers() {
    under = document.createElement('img');
    over = document.createElement('img');
    under.className = 'm-under'; over.className = 'm-over';
    under.alt = ''; over.alt = '';
    under.style.opacity = '0'; over.style.opacity = '0';
    stage.appendChild(under); stage.appendChild(over);

    overlay = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    overlay.setAttribute('class', 'm-overlay');
    overlay.setAttribute('viewBox', '0 0 ' + VB_W + ' ' + VB_H.toFixed(4));
    META.overlays.cond.forEach(function (a) {
      var ln = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      ln.setAttribute('class', 'dash-line');
      ln.setAttribute('x1', a.x1 + 0.15);
      ln.setAttribute('y1', (a.y1 * ky).toFixed(3));
      ln.setAttribute('x2', a.x2 - 1.05);                 // stop short of the arrowhead
      ln.setAttribute('y2', (a.y2 * ky).toFixed(3));
      overlay.appendChild(ln);
    });
    stage.appendChild(overlay);
    baseImg.style.display = 'none';
  }

  function clearFx() {
    fxHost.forEach(function (n) { n.remove(); });
    fxHost = [];
  }

  function spawnFx(cls, rect, frameSrc) {
    var d = document.createElement('div');
    d.className = 'fx ' + cls;
    d.style.left = rect.x + '%';
    d.style.top = rect.y + '%';
    d.style.width = rect.w + '%';
    d.style.height = rect.h + '%';
    if (frameSrc) {
      d.style.backgroundImage = 'url("' + frameSrc + '")';
      d.style.backgroundSize = (10000 / rect.w) + '% ' + (10000 / rect.h) + '%';
      var px = rect.w >= 100 ? 0 : rect.x / (100 - rect.w) * 100;
      var py = rect.h >= 100 ? 0 : rect.y / (100 - rect.h) * 100;
      d.style.backgroundPosition = px + '% ' + py + '%';
    }
    stage.appendChild(d);
    fxHost.push(d);
    return d;
  }

  function setCaption(html) {
    if (!caption || !html) return;
    caption.style.opacity = '0';
    setTimeout(function () { caption.innerHTML = html; caption.style.opacity = '1'; }, 180);
  }

  function settle(src) {
    under.src = src;
    over.style.transition = 'none';
    over.style.opacity = '0';
    over.style.clipPath = '';
    void over.offsetWidth;
    over.style.transition = '';
  }

  async function play() {
    var my = ++token;
    clearFx();
    overlay.classList.remove('live');
    if (caption) caption.innerHTML = '&nbsp;';
    if (replayBtn) replayBtn.hidden = true;
    under.src = '';
    under.style.opacity = '1';
    over.style.transition = 'none'; over.style.opacity = '0'; over.style.clipPath = '';
    void over.offsetWidth; over.style.transition = '';

    var t0 = performance.now();
    for (var k = 0; k < SCHED.length; k++) {
      var name = SCHED[k][0], at = SCHED[k][1], eff = SCHED[k][2];
      var wait = at - (performance.now() - t0);
      if (wait > 0) await sleep(wait);
      if (my !== token) return;

      var src = frames[k];
      if (CAPTIONS[name]) setCaption(CAPTIONS[name]);

      if (eff === 'wipe') {
        over.classList.add('wipe');
        over.style.transition = 'none';
        over.style.clipPath = 'inset(0 100% 0 0)';
        over.style.opacity = '1';
        over.src = src;
        void over.offsetWidth;
        over.style.transition = '';
        over.style.clipPath = 'inset(0 0 0 0)';
        await sleep(540);
        if (my !== token) return;
        over.classList.remove('wipe');
        settle(src);
        // living arrows + one-shot glow on the G tokens
        overlay.classList.add('live');
        spawnFx('glow', META.overlays.gGlow, null);
      } else if (eff === 'pop') {
        var region = name === 'wall' ? META.overlays.wall : META.overlays.mask;
        settle(src);                      // swap instantly beneath…
        spawnFx('pop', region, src);      // …while the badge pops on top
        await sleep(440);
        if (my !== token) return;
      } else {
        over.src = src;
        void over.offsetWidth;
        over.style.opacity = '1';
        await sleep(k === 0 ? 600 : 420);
        if (my !== token) return;
        settle(src);
      }
    }
    playedOnce = true;
    if (replayBtn) replayBtn.hidden = false;
  }

  function fallbackStatic() {
    failed = true;
    if (under) under.remove();
    if (over) over.remove();
    if (overlay) overlay.remove();
    baseImg.style.display = '';
  }

  var prepared = null;
  function prepare() {
    if (!prepared) {
      prepared = preload().then(function () { buildLayers(); ready = true; })
                          .catch(function () { fallbackStatic(); });
    }
    return prepared;
  }

  // debug hook: ?anim=static renders the finished state + overlays immediately
  // (used by the headless-screenshot check of overlay geometry)
  var dbg = (location.search.match(/[?&]anim=(static|overlay)/) || [])[1];
  if (dbg) {
    prepare().then(function () {
      if (failed) return;
      under.src = dbg === 'overlay' ? frames[beatIndex.cond - 1] : frames[frames.length - 1];
      under.style.opacity = '1';
      overlay.classList.add('live');
      if (dbg === 'static') {
        spawnFx('pop', META.overlays.wall, frames[beatIndex.wall]);
        spawnFx('pop', META.overlays.mask, frames[beatIndex.mask]);
      }
      playedOnce = true;
      if (replayBtn) replayBtn.hidden = false;
    });
    return;
  }

  var preIO = new IntersectionObserver(function (entries) {
    if (entries.some(function (e) { return e.isIntersecting; })) {
      preIO.disconnect();
      prepare();
    }
  }, { rootMargin: '600px' });
  preIO.observe(stage);

  var playIO = new IntersectionObserver(function (entries) {
    if (entries.some(function (e) { return e.isIntersecting; })) {
      playIO.disconnect();
      prepare().then(function () { if (!failed && !playedOnce) play(); });
    }
  }, { threshold: 0.35 });
  playIO.observe(stage);

  if (replayBtn) replayBtn.addEventListener('click', function () {
    if (ready && !failed) play();
  });
})();
