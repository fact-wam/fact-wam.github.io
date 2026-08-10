/* Bar charts for the FACT results section — plain inline SVG, no libraries.
 * Palette: baselines are a de-emphasis warm gray; FACT variants are an ordered
 * amber ramp (Ours → w/ failure → + scoring), CVD-validated. Every bar carries
 * an ink value label (relief for the pale ramp step). */
(function () {
  'use strict';

  var C = {
    base:  { fill: '#857B69', stroke: '#6B6253' },
    l1:    { fill: '#F7DCA8', stroke: '#C9A45C' },
    l2:    { fill: '#D98A1C', stroke: '#A5680F' },   // hero: Ours w/ failure
    l3:    { fill: '#8F5D08', stroke: '#6B4506' },
    ghost: { fill: '#FFFFFF', stroke: '#9A9182', dash: '4 3' }
  };
  var NS = 'http://www.w3.org/2000/svg';

  function el(tag, attrs, parent) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function txt(node, s) { node.textContent = s; return node; }

  function roundedBar(g, x, y, w, h, r, c) {
    if (h <= 0) return;
    r = Math.min(r, w / 2, h);
    var d = 'M' + x + ',' + (y + h) +
            ' L' + x + ',' + (y + r) +
            ' Q' + x + ',' + y + ' ' + (x + r) + ',' + y +
            ' L' + (x + w - r) + ',' + y +
            ' Q' + (x + w) + ',' + y + ' ' + (x + w) + ',' + (y + r) +
            ' L' + (x + w) + ',' + (y + h) + ' Z';
    var attrs = { d: d, fill: c.fill, stroke: c.stroke, 'stroke-width': 1 };
    if (c.dash) attrs['stroke-dasharray'] = c.dash;
    return el('path', attrs, g);
  }

  /* One panel of grouped bars. Returns nothing; draws into svg. */
  function panel(svg, o) {
    // o: {x0,y0,w,h, yMax, ticks, groups:[{label(s), bars:[{v,c,name,hero}]}],
    //     title, showTicks, gapPx, note:{gi, text}}
    var plotH = o.h, plotW = o.w;
    var sy = function (v) { return o.y0 + plotH - (v / o.yMax) * plotH; };

    o.ticks.forEach(function (t) {
      el('line', { x1: o.x0, y1: sy(t), x2: o.x0 + plotW, y2: sy(t),
                   'class': t === 0 ? 'c-axis' : 'c-grid' }, svg);
      if (o.showTicks !== false)
        txt(el('text', { x: o.x0 - 7, y: sy(t) + 3.5, 'text-anchor': 'end', 'class': 'c-ytick' }, svg), t);
    });
    if (o.title)
      txt(el('text', { x: o.x0 + plotW / 2, y: o.y0 - 8, 'text-anchor': 'middle', 'class': 'c-ptitle' }, svg), o.title);

    var n = o.groups.length;
    var slot = plotW / n;
    var gap = o.gapPx != null ? o.gapPx : 2;

    o.groups.forEach(function (grp, gi) {
      var cx = o.x0 + slot * gi + slot / 2;
      var m = grp.bars.length;
      var bw = Math.min(o.barMax || 34, (slot * 0.72 - gap * (m - 1)) / m);
      var total = bw * m + gap * (m - 1);
      grp.bars.forEach(function (b, bi) {
        var bx = cx - total / 2 + bi * (bw + gap);
        var by = sy(b.v);
        var p = roundedBar(svg, bx, by, bw, o.y0 + plotH - by, 2.5, b.c);
        txt(el('title', {}, p), (b.name || grp.tip || '') + ': ' + b.v);
        txt(el('text', { x: bx + bw / 2, y: by - 4, 'text-anchor': 'middle',
                         'class': 'c-vlab' + (b.hero ? ' c-vlab-hero' : '') }, svg), b.label != null ? b.label : b.v);
      });
      var lines = Array.isArray(grp.label) ? grp.label : [grp.label];
      var ty = o.y0 + plotH + 14;
      var t = el('text', { x: cx, y: ty, 'text-anchor': 'middle', 'class': 'c-xlab' }, svg);
      lines.forEach(function (ln, li) {
        txt(el('tspan', { x: cx, dy: li === 0 ? 0 : 12 }, t), ln);
      });
      if (o.note && o.note.gi === gi) {
        var yTop = sy(Math.max.apply(null, grp.bars.map(function (b) { return b.v; })));
        txt(el('text', { x: cx, y: yTop - 18, 'text-anchor': 'middle', 'class': 'c-note' }, svg), o.note.text);
      }
    });
  }

  function legend(svg, x, y, items) {
    var cursor = x;
    items.forEach(function (it) {
      var attrs = { x: cursor, y: y - 8, width: 10, height: 10, rx: 3,
                    fill: it.c.fill, stroke: it.c.stroke, 'stroke-width': 1 };
      if (it.c.dash) attrs['stroke-dasharray'] = '3 2';
      el('rect', attrs, svg);
      var t = txt(el('text', { x: cursor + 14, y: y + 1, 'class': 'c-legend' }, svg), it.t);
      cursor += 14 + it.t.length * 6.3 + 16;
    });
  }

  function chartTitle(svg, x, y, s) {
    txt(el('text', { x: x, y: y, 'class': 'c-title' }, svg), s);
  }

  /* ---------------- chart 1: RoboTwin ---------------- */
  function robotwin() {
    var svg = document.getElementById('chart-robotwin');
    if (!svg) return;
    svg.setAttribute('viewBox', '0 0 640 330');
    chartTitle(svg, 10, 20, 'RoboTwin — average success rate (%)');
    var G = function (lb, v, c, name, hero) { return { label: lb, tip: name, bars: [{ v: v, c: c, name: name, hero: hero }] }; };
    panel(svg, {
      x0: 40, y0: 48, w: 588, h: 220, yMax: 100, ticks: [0, 25, 50, 75, 100], barMax: 40,
      groups: [
        G('π₀', 62.2, C.base, 'π₀'),
        G('X-VLA', 72.9, C.base, 'X-VLA'),
        G('π₀.₅', 79.8, C.base, 'π₀.₅'),
        G(['Gigaworld-', 'Policy'], 86.0, C.base, 'Gigaworld-Policy'),
        G('Motus', 87.8, C.base, 'Motus'),
        G(['Ours w/o', 'video'], 81.8, C.ghost, 'Ours w/o video co-train'),
        G('Ours', 85.6, C.l1, 'Ours'),
        G(['Ours', 'w/ failure'], 87.5, C.l2, 'Ours w/ failure', true)
      ]
    });
    legend(svg, 40, 310, [
      { c: C.base, t: 'Baselines' }, { c: C.ghost, t: 'Ablation' },
      { c: C.l1, t: 'Ours' }, { c: C.l2, t: 'Ours w/ failure' }
    ]);
  }

  /* ---------------- chart 2: real world, two panels ---------------- */
  function realWorld() {
    var svg = document.getElementById('chart-real');
    if (!svg) return;
    svg.setAttribute('viewBox', '0 0 640 330');
    chartTitle(svg, 10, 20, 'Real-world bimanual tasks — average success rate (%)');
    var mk = function (vals) {
      var names = ['Cosmos', 'π₀', 'π₀.₅', 'Motus', 'Ours', 'w/ fail', '+score'];
      var tips = ['Cosmos', 'π₀', 'π₀.₅', 'Motus', 'Ours', 'Ours w/ failure', 'Ours w/ failure + scoring'];
      var cs = [C.base, C.base, C.base, C.base, C.l1, C.l2, C.l3];
      return vals.map(function (v, i) {
        return { label: names[i], tip: tips[i], bars: [{ v: v, c: cs[i], name: tips[i], hero: i === 5 || i === 6 }] };
      });
    };
    panel(svg, { x0: 40, y0: 56, w: 272, h: 210, yMax: 100, ticks: [0, 25, 50, 75, 100],
                 title: 'Seen (5 tasks)', barMax: 26, groups: mk([25, 48, 88, 64, 82, 89, 92]) });
    panel(svg, { x0: 356, y0: 56, w: 272, h: 210, yMax: 100, ticks: [0, 25, 50, 75, 100],
                 title: 'Unseen (3 tasks)', showTicks: false, barMax: 26, groups: mk([8, 57, 85, 62, 67, 77, 82]) });
    legend(svg, 40, 320, [
      { c: C.base, t: 'Baselines' }, { c: C.l1, t: 'Ours' },
      { c: C.l2, t: 'Ours w/ failure' }, { c: C.l3, t: '+ scoring (N=4)' }
    ]);
  }

  /* ---------------- chart 3: failure-data scaling ---------------- */
  function scaling() {
    var svg = document.getElementById('chart-scaling');
    if (!svg) return;
    svg.setAttribute('viewBox', '0 0 640 330');
    chartTitle(svg, 10, 20, 'Failure-data scaling on RoboTwin — success rate (%)');
    var ramp = [C.l1, C.l2, C.l3];
    var series = ['p = 0%', 'p = 50%', 'p = 100%'];
    var mk = function (lb, vals, hero) {
      return { label: lb, bars: vals.map(function (v, i) {
        return { v: v, c: ramp[i], name: series[i], hero: hero && i === 2 };
      }) };
    };
    panel(svg, {
      x0: 40, y0: 48, w: 588, h: 220, yMax: 100, ticks: [0, 25, 50, 75, 100], barMax: 30,
      groups: [
        mk(['Handover', 'Block'], [14, 38, 46]),
        mk(['Open', 'Microwave'], [62, 80, 90]),
        mk(['Put Bottles', 'Dustbin'], [22, 16, 36]),
        mk('Average', [32.7, 44.7, 57.3], true)
      ]
    });
    legend(svg, 40, 310, [
      { c: C.l1, t: 'p = 0% failure data' },
      { c: C.l2, t: 'p = 50%' },
      { c: C.l3, t: 'p = 100%' }
    ]);
  }

  /* ---------------- chart 4: PSNR ---------------- */
  function psnr() {
    var svg = document.getElementById('chart-psnr');
    if (!svg) return;
    svg.setAttribute('viewBox', '0 0 640 330');
    chartTitle(svg, 10, 20, 'Future-prediction quality — PSNR (dB) ↑');
    var mk = function (lb, a, b, hero) {
      return { label: lb, bars: [
        { v: a, c: C.base, name: 'Success-only training' },
        { v: b, c: C.l2, name: 'Failure-aware co-training', hero: hero }
      ] };
    };
    panel(svg, {
      x0: 40, y0: 48, w: 588, h: 220, yMax: 32, ticks: [0, 10, 20, 30], barMax: 44, gapPx: 3,
      note: { gi: 2, text: '+6.4 dB' },
      groups: [
        mk('All held-out samples', 22.82, 26.00),
        mk('Success-rollout futures', 26.12, 26.08),
        mk(['Failure-rollout futures', '(hallucination test)'], 19.51, 25.92, true)
      ]
    });
    legend(svg, 40, 310, [
      { c: C.base, t: 'Success-only training' },
      { c: C.l2, t: 'Failure-aware co-training' }
    ]);
  }

  robotwin();
  realWorld();
  scaling();
  psnr();
})();
