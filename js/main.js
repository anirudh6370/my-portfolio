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
  } else {
    $$('.flow, .bars').forEach(function (el) { el.classList.add('in'); });
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

  /* ---------- Ask my resume ----------
     The search itself lives in resume-search.js and returns the steps it took.
     This part only replays those steps on the graph and streams the answer. */

  var traceEl = $('#trace');
  var answerEl = $('#answer-text');
  var citesEl = $('#cites');
  var nodes = {};
  var edges = {};
  $$('.graph .node').forEach(function (n) { nodes[n.getAttribute('data-node')] = n; });
  $$('.graph [data-edge]').forEach(function (e) { edges[e.getAttribute('data-edge')] = e; });

  var runId = 0;
  var current = null;

  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, reduceMotion ? 0 : ms); });
  }
  function log(step) {
    var li = document.createElement('li');
    if (step.warn) li.className = 'warn';
    var b = document.createElement('b');
    b.textContent = step.node === 'none' ? 'end' : step.node;
    var span = document.createElement('span');
    span.textContent = step.message;
    li.appendChild(b);
    li.appendChild(span);
    traceEl.appendChild(li);
    traceEl.scrollTop = traceEl.scrollHeight;
  }
  function clearEdges() {
    Object.keys(edges).forEach(function (k) { edges[k].classList.remove('lit'); });
  }
  function enter(step) {
    if (current) { nodes[current].classList.remove('active'); nodes[current].classList.add('done'); }
    clearEdges();
    if (step.edge) edges[step.edge].classList.add('lit');
    nodes[step.node].classList.add('active');
    current = step.node;
  }
  function finish() {
    if (current) { nodes[current].classList.remove('active'); nodes[current].classList.add('done'); }
    clearEdges();
    current = null;
  }

  async function stream(text, id) {
    answerEl.textContent = '';
    answerEl.classList.add('streaming');
    var parts = text.split(' ');
    for (var i = 0; i < parts.length; i++) {
      if (id !== runId) return;
      answerEl.textContent += (i ? ' ' : '') + parts[i];
      await wait(22);
    }
    answerEl.classList.remove('streaming');
  }

  async function run(query) {
    var id = ++runId;
    traceEl.textContent = '';
    answerEl.textContent = '';
    answerEl.classList.remove('streaming');
    citesEl.textContent = '';
    current = null;
    Object.keys(nodes).forEach(function (k) { nodes[k].classList.remove('active', 'done'); });
    clearEdges();

    var outcome = window.ResumeSearch.ask(query);
    for (var i = 0; i < outcome.steps.length; i++) {
      enter(outcome.steps[i]);
      log(outcome.steps[i]);
      await wait(400);
      if (id !== runId) return;
    }
    finish();

    if (!outcome.answer) {
      await stream("I don't have evidence for that in the resume, so I won't guess. Try asking about LangGraph, RAG, AWS, fraud detection, his education, or how to get in touch.", id);
      return;
    }
    await stream(outcome.answer, id);
    if (id !== runId) return;
    outcome.sources.forEach(function (chunk, n) {
      var a = document.createElement('a');
      a.href = chunk.href;
      a.textContent = (n ? 'Related: ' : 'Source: ') + chunk.label;
      citesEl.appendChild(a);
    });
  }

  var input = $('#q');
  $('#ask').addEventListener('submit', function (e) {
    e.preventDefault();
    var q = input.value.trim();
    if (q) run(q);
  });
  $$('#chips button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      input.value = btn.textContent;
      run(btn.textContent);
    });
  });

  // One orchestrated moment on load: run the first question.
  var first = $('#chips button').textContent;
  setTimeout(function () { run(first); }, reduceMotion ? 0 : 900);
})();
