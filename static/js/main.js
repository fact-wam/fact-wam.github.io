/* Demo-video lazy loading + play/pause on visibility, and BibTeX copy. */
(function () {
  'use strict';

  var vids = Array.prototype.slice.call(document.querySelectorAll('video[data-src]'));
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) {
          if (!v.src) v.src = v.dataset.src;
          var p = v.play();
          if (p && p.catch) p.catch(function () {});
        } else if (v.src) {
          v.pause();
        }
      });
    }, { rootMargin: '220px' });
    vids.forEach(function (v) { io.observe(v); });
  } else {
    vids.forEach(function (v) { v.src = v.dataset.src; v.setAttribute('controls', ''); });
  }

  /* side-view carousel: arrows + dots switch slides; the IntersectionObserver
   * above handles play/pause automatically (hidden slides are clipped out of
   * the viewport, the visible one intersects). */
  Array.prototype.forEach.call(document.querySelectorAll('.carousel'), function (root) {
    var track = root.querySelector('.car-track');
    var slides = track.children;
    var n = slides.length;
    var dotsBox = root.querySelector('.car-dots');
    var dots = [];
    var i = 0;
    function go(k) {
      i = ((k % n) + n) % n;
      track.style.transform = 'translateX(-' + (i * 100) + '%)';
      dots.forEach(function (d, di) { d.classList.toggle('active', di === i); });
    }
    for (var k = 0; k < n; k++) {
      (function (k) {
        var d = document.createElement('button');
        d.className = 'car-dot';
        d.type = 'button';
        d.setAttribute('aria-label', 'Go to video ' + (k + 1));
        d.addEventListener('click', function () { go(k); });
        dotsBox.appendChild(d);
        dots.push(d);
      })(k);
    }
    root.querySelector('.car-prev').addEventListener('click', function () { go(i - 1); });
    root.querySelector('.car-next').addEventListener('click', function () { go(i + 1); });
    go(0);
  });

  /* contents sidebar scroll-spy */
  var tocLinks = Array.prototype.slice.call(document.querySelectorAll('.toc a[href^="#"]'));
  if (tocLinks.length && 'IntersectionObserver' in window) {
    var byId = {};
    tocLinks.forEach(function (a) { byId[a.getAttribute('href').slice(1)] = a; });
    var setActive = function (id) {
      tocLinks.forEach(function (a) { a.classList.remove('active'); });
      if (byId[id]) byId[id].classList.add('active');
    };
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) setActive(e.target.id);
      });
    }, { rootMargin: '-35% 0px -55% 0px' });
    Object.keys(byId).forEach(function (id) {
      var sec = document.getElementById(id);
      if (sec) spy.observe(sec);
    });
  }

  var btn = document.querySelector('.copy-btn');
  if (btn) {
    btn.addEventListener('click', function () {
      var pre = document.querySelector('#bibtex pre');
      if (!pre) return;
      var done = function () {
        btn.textContent = 'Copied ✓';
        setTimeout(function () { btn.textContent = 'Copy'; }, 1600);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(pre.textContent).then(done);
      } else {
        var r = document.createRange();
        r.selectNodeContents(pre);
        var sel = window.getSelection();
        sel.removeAllRanges(); sel.addRange(r);
        document.execCommand('copy');
        sel.removeAllRanges();
        done();
      }
    });
  }
})();
