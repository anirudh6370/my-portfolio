(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------- Theme toggle (light by default) ---------- */
  var root = document.documentElement;
  $('#theme-toggle').addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    if (next === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');
    try { localStorage.setItem('theme', next); } catch (e) {}
  });

  /* ---------- Scroll progress + nav border ---------- */
  var bar = $('#progress-bar');
  var nav = $('.nav');
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';
      nav.classList.toggle('scrolled', window.scrollY > 8);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Active nav link, and one-time reveals ---------- */
  var links = $$('#nav-links a');
  var sections = links.map(function (a) { return $(a.getAttribute('href')); });
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(function (s) { if (s) spy.observe(s); });

    // Pipeline strips light up, bars grow and metrics count up when scrolled into view.
    var once = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        once.unobserve(entry.target);
        if (entry.target.hasAttribute('data-count')) countUp(entry.target);
        else entry.target.classList.add('in');
      });
    }, { threshold: 0.5 });
    $$('.flow, .bars, [data-count]').forEach(function (el) { once.observe(el); });

    // The small nav photo only appears once the hero portrait has scrolled away.
    new IntersectionObserver(function (entries) {
      nav.classList.toggle('past-hero', !entries[0].isIntersecting);
    }).observe($('.portrait'));
  } else {
    $$('.flow, .bars').forEach(function (el) { el.classList.add('in'); });
    nav.classList.add('past-hero');
  }

  function countUp(el) {
    var target = Number(el.getAttribute('data-count'));
    if (reduceMotion) return;
    var start = performance.now();
    var duration = 900;
    (function frame(now) {
      var t = Math.min(1, (now - start) / duration);
      el.textContent = Math.round(target * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(frame);
    })(start);
  }

  /* ---------- Copy email ---------- */
  var copyBtn = $('#copy-email');
  copyBtn.addEventListener('click', function () {
    var email = $('#email-link').textContent;
    var done = function (label) {
      copyBtn.textContent = label;
      setTimeout(function () { copyBtn.textContent = 'Copy email'; }, 1800);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(email).then(function () { done('Copied'); }, function () { done('Copy failed'); });
    } else {
      done('Copy failed');
    }
  });

  $('#year').textContent = new Date().getFullYear();

  /* ---------- Tech stack marquee ----------
     Each row is repeated four times so that half the track always covers the
     viewport; the CSS animation then slides it by exactly half, left to right. */
  $$('.marquee-track').forEach(function (track) {
    var items = $$('li', track);
    for (var copy = 0; copy < 3; copy++) {
      items.forEach(function (li) {
        var clone = li.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        track.appendChild(clone);
      });
    }
    track.classList.add('ready');
  });
  // A logo that fails to load is dropped; the name still reads on its own.
  $$('.marquee-track img').forEach(function (img) {
    img.addEventListener('error', function () { img.remove(); });
  });
})();
