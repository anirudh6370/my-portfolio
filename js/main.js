(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };

  /* ---------- Theme toggle ---------- */
  var root = document.documentElement;
  $('#theme-toggle').addEventListener('click', function () {
    var current = root.getAttribute('data-theme') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    var next = current === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
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

  /* ---------- Active nav link ---------- */
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

    /* Pipeline strips light up, and metrics count up, when scrolled into view */
    var once = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        once.unobserve(entry.target);
        if (entry.target.classList.contains('flow')) entry.target.classList.add('in');
        else countUp(entry.target);
      });
    }, { threshold: 0.6 });
    $$('.flow, [data-count]').forEach(function (el) { once.observe(el); });
  } else {
    $$('.flow').forEach(function (el) { el.classList.add('in'); });
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

  /* ---------- Ask my resume: a miniature corrective RAG loop ----------
     Retrieval is real BM25 over the resume passages below. There is no LLM:
     "generate" quotes the passages that passed grading. */

  var CORPUS = [
    { id: 'summary', label: 'Summary', href: '#top',
      text: 'AI Agent Engineer with 2.5+ years of experience building Generative AI and LLM applications, agentic workflows and RAG pipelines for insurance and enterprise use cases.',
      extra: 'anirudha sutar who about profile background generative genai python fastapi docker aws explainable' },
    { id: 'insuremo-mmv', label: 'MMV mapping', href: '#work',
      text: 'At Insuremo he built a LangGraph service that maps vehicle Make-Model-Variant data across insurers using hybrid BM25 and semantic search over OpenSearch, with Redis caching and LangSmith monitoring. It cut manual mapping effort by an estimated 40%.',
      extra: 'insuremo motor insurance vehicle rag retrieval hybrid search vector cache caching token cost latency prompt langgraph built' },
    { id: 'insuremo-fraud', label: 'Fraud detection', href: '#work',
      text: 'He modelled claims, claimants and garages as a Neo4j knowledge graph and used WCC and Leiden community detection to surface collusion networks across 10K+ claim records. LangGraph agents explain each flagged claim in plain language. False-positive manual reviews fell by an estimated 30%.',
      extra: 'insuremo insurance fraud collusion detect detection graph analytics gds neo4j agents explainable claims invoice langgraph built' },
    { id: 'insuremo-policy', label: 'Policy templates', href: '#work',
      text: 'He built an agent-driven document intelligence pipeline that converts static insurance policy documents into dynamic, tag-based templates with Aspose, cutting manual policy-generation effort by an estimated 30%.',
      extra: 'insuremo document parsing template generation tagging aspose extraction policy agents' },
    { id: 'appnai', label: 'AppNAI', href: '#work',
      text: 'As an AI Engineer at AppNAI from April 2024 to March 2025, he built computer vision applications for agriculture using TensorFlow and transfer learning on VGG and Xception, served through FastAPI and a React frontend.',
      extra: 'appnai computer vision agriculture tensorflow scikit-learn react fastapi model training' },
    { id: 'sundesk', label: 'SunDesk Copilot', href: '#projects',
      text: 'SunDesk Copilot is his agentic RAG support assistant: a stateful LangGraph workflow that routes queries, retrieves from Pinecone, grades evidence with the LLM, falls back to Tavily web search, and answers only from graded evidence with citations.',
      extra: 'sundesk copilot project corrective rag agentic pinecone tavily groq streamlit fastapi docker langsmith memory sqlite pydantic structured hallucination langgraph built citation github' },
    { id: 'alzheimers', label: "Alzheimer's MRI", href: '#projects',
      text: "He built an early Alzheimer's detection model on brain MRI images using VGG16 feature extraction and CNN classification, with Gaussian blurring, skull stripping and data augmentation.",
      extra: 'alzheimer alzheimers brain mri medical opencv vgg16 cnn project diagnosis detection' },
    { id: 'skills-agents', label: 'Agent skills', href: '#skills',
      text: 'For agents and LLMs he works with LangGraph, LangChain, multi-agent orchestration, tool and function calling, MCP, prompt engineering, structured outputs, conversation memory, Groq and Ollama.',
      extra: 'skills agents llm model context protocol agentic workflows' },
    { id: 'skills-rag', label: 'RAG skills', href: '#skills',
      text: 'For retrieval he uses agentic and corrective RAG, hybrid search with BM25 and embeddings, query rewriting, and vector databases including Pinecone, OpenSearch, ChromaDB and FAISS.',
      extra: 'skills rag retrieval vector database sentence-transformers tavily semantic' },
    { id: 'skills-ops', label: 'LLMOps skills', href: '#skills',
      text: 'For LLMOps and quality he uses LangSmith tracing, LLM observability, token and cost optimisation, response caching, evidence grading, hallucination mitigation and audit logging.',
      extra: 'skills llmops quality monitoring evaluation' },
    { id: 'skills-backend', label: 'Backend skills', href: '#skills',
      text: 'On the backend he uses Python, FastAPI, REST APIs, Pydantic, Streamlit, Redis, SQL, MySQL, SQLite and Neo4j with Graph Data Science. For cloud and DevOps: AWS EC2, S3 and Lambda, Docker, Git, GitHub Actions and CI/CD.',
      extra: 'skills backend data cloud devops api database claude code' },
    { id: 'skills-ml', label: 'ML skills', href: '#skills',
      text: 'For machine learning and computer vision he uses PyTorch, TensorFlow, Hugging Face Transformers, Scikit-learn, NLP, OpenCV, CNNs, transfer learning and BERT.',
      extra: 'skills ml machine learning deep computer vision' },
    { id: 'education', label: 'Education', href: '#education',
      text: 'He holds an M.Sc. in Data Science from Silicon University, Bhubaneswar (2022 to 2024) with a CGPA of 9.33 out of 10, plus Great Learning certifications in TensorFlow Python and Python for Data Analysis.',
      extra: 'education msc master degree university cgpa certification certifications achievers club' },
    { id: 'contact', label: 'Contact', href: '#contact',
      text: 'You can reach Anirudha at sutaranirudha604@gmail.com, on LinkedIn at linkedin.com/in/anirudha-sutar, or on GitHub at github.com/anirudh6370. He is based in Pune, India.',
      extra: 'contact email linkedin github pune india location' }
  ];

  // Used by the rewrite node when the first retrieval is graded weak.
  var SYNONYMS = {
    study: 'education degree university', studied: 'education degree university', college: 'education university',
    school: 'education university', qualification: 'education degree', graduate: 'education degree',
    job: 'insuremo appnai engineer', work: 'insuremo appnai engineer', worked: 'insuremo appnai engineer',
    company: 'insuremo appnai', employer: 'insuremo appnai', experience: 'insuremo appnai engineer',
    career: 'insuremo appnai engineer', role: 'engineer insuremo',
    reach: 'contact email', hire: 'contact email', mail: 'contact email', message: 'contact email',
    touch: 'contact email', phone: 'contact email', talk: 'contact email',
    live: 'pune india', based: 'pune india', city: 'pune india', country: 'india', from: 'pune india',
    stack: 'skills python langgraph', tech: 'skills python langgraph', tool: 'skills', technology: 'skills',
    language: 'skills python', framework: 'skills langgraph langchain', good: 'skills',
    database: 'vector database sql', db: 'vector database sql',
    hallucination: 'evidence grading citation', chatbot: 'sundesk copilot assistant',
    health: 'alzheimer mri', medical: 'alzheimer mri', image: 'computer vision opencv',
    cheap: 'cost token caching', fast: 'latency cache', speed: 'latency cache',
    portfolio: 'project sundesk', side: 'project sundesk', opensource: 'github project'
  };

  var STOP = {};
  ('a an and are as at be been built but by can could did do does for had has have he her him his how i if in is it ' +
   'its know known me my of on or she so that the their them they this to use used using was were what when where which ' +
   'who whom why will with would you your about any tell show give get got some there than then into also')
    .split(' ').forEach(function (w) { STOP[w] = true; });
  // "built" is a useful signal in this corpus, so keep it searchable.
  delete STOP.built;

  function stem(w) {
    if (w.length > 4 && /ies$/.test(w)) return w.slice(0, -3) + 'y';
    if (w.length > 3 && /s$/.test(w) && !/ss$/.test(w)) return w.slice(0, -1);
    return w;
  }
  function tokenize(text, keepStop, raw) {
    var words = String(text).toLowerCase().match(/[a-z0-9][a-z0-9+#-]*/g) || [];
    var out = [];
    words.forEach(function (w) {
      w.split('-').concat(w.indexOf('-') > -1 ? [w] : []).forEach(function (part) {
        if (part && (keepStop || !STOP[part])) out.push(raw ? part : stem(part));
      });
    });
    return out;
  }

  var docs = CORPUS.map(function (c) {
    var tokens = tokenize(c.text + ' ' + c.extra + ' ' + c.label);
    var tf = {};
    tokens.forEach(function (t) { tf[t] = (tf[t] || 0) + 1; });
    return { chunk: c, tf: tf, len: tokens.length };
  });
  var avgLen = docs.reduce(function (n, d) { return n + d.len; }, 0) / docs.length;
  var df = {};
  docs.forEach(function (d) { Object.keys(d.tf).forEach(function (t) { df[t] = (df[t] || 0) + 1; }); });

  function bm25(terms) {
    var k1 = 1.5, b = 0.75, N = docs.length;
    return docs.map(function (d) {
      var score = 0, hits = 0;
      terms.forEach(function (t) {
        var f = d.tf[t];
        if (!f) return;
        hits++;
        var idf = Math.log(1 + (N - df[t] + 0.5) / (df[t] + 0.5));
        score += idf * (f * (k1 + 1)) / (f + k1 * (1 - b + b * d.len / avgLen));
      });
      return { doc: d, score: score, hits: hits };
    }).filter(function (r) { return r.score > 0; })
      .sort(function (a, b2) { return b2.score - a.score; });
  }

  function unique(list) {
    return list.filter(function (x, i) { return list.indexOf(x) === i; });
  }

  var traceEl = $('#trace');
  var answerEl = $('#answer-text');
  var citesEl = $('#cites');
  var nodes = {};
  var edges = {};
  $$('.graph .node').forEach(function (n) { nodes[n.getAttribute('data-node')] = n; });
  $$('.graph [data-edge]').forEach(function (e) { edges[e.getAttribute('data-edge')] = e; });

  var runId = 0;
  function wait(ms) {
    return new Promise(function (resolve) { setTimeout(resolve, reduceMotion ? 0 : ms); });
  }
  function log(name, message, warn) {
    var li = document.createElement('li');
    if (warn) li.className = 'warn';
    var b = document.createElement('b');
    b.textContent = name;
    var span = document.createElement('span');
    span.textContent = message;
    li.appendChild(b);
    li.appendChild(span);
    traceEl.appendChild(li);
    traceEl.scrollTop = traceEl.scrollHeight;
  }
  function resetGraph() {
    Object.keys(nodes).forEach(function (k) { nodes[k].classList.remove('active', 'done'); });
    Object.keys(edges).forEach(function (k) { edges[k].classList.remove('lit'); });
  }
  var current = null;
  function enter(name, viaEdge) {
    if (current) { nodes[current].classList.remove('active'); nodes[current].classList.add('done'); }
    Object.keys(edges).forEach(function (k) { edges[k].classList.remove('lit'); });
    if (viaEdge) edges[viaEdge].classList.add('lit');
    nodes[name].classList.add('active');
    current = name;
  }
  function finish() {
    if (current) { nodes[current].classList.remove('active'); nodes[current].classList.add('done'); }
    Object.keys(edges).forEach(function (k) { edges[k].classList.remove('lit'); });
    current = null;
  }
  function describe(results) {
    if (!results.length) return 'bm25 · 0 passages matched';
    return 'bm25 · top ' + Math.min(3, results.length) + ': ' + results.slice(0, 3).map(function (r) {
      return r.doc.chunk.id + ' ' + r.score.toFixed(2);
    }).join(', ');
  }
  // Pass when the best passage supports at least half of the query terms.
  function grade(terms, results) {
    if (!results.length || !terms.length) return { pass: false, hits: 0 };
    return { pass: results[0].hits / terms.length >= 0.5, hits: results[0].hits };
  }

  async function stream(text, id) {
    answerEl.textContent = '';
    answerEl.classList.add('streaming');
    var words = text.split(' ');
    for (var i = 0; i < words.length; i++) {
      if (id !== runId) return;
      answerEl.textContent += (i ? ' ' : '') + words[i];
      await wait(22);
    }
    answerEl.classList.remove('streaming');
  }

  async function run(query) {
    var id = ++runId;
    var step = 420;
    traceEl.textContent = '';
    answerEl.textContent = '';
    answerEl.classList.remove('streaming');
    citesEl.textContent = '';
    current = null;
    resetGraph();

    var terms = unique(tokenize(query));
    enter('route');
    log('route', terms.length ? 'resume_index · terms: ' + unique(tokenize(query, false, true)).join(', ') : 'no searchable terms in the query');
    await wait(step); if (id !== runId) return;

    enter('retrieve', 'route-retrieve');
    var results = bm25(terms);
    log('retrieve', describe(results));
    await wait(step); if (id !== runId) return;

    enter('grade', 'retrieve-grade');
    var verdict = grade(terms, results);
    log('grade', verdict.hits + '/' + terms.length + ' terms supported · ' + (verdict.pass ? 'pass' : 'weak'), !verdict.pass);
    await wait(step); if (id !== runId) return;

    if (!verdict.pass) {
      enter('rewrite', 'grade-rewrite');
      var expanded = [];
      tokenize(query, true).forEach(function (t) {
        if (SYNONYMS[t]) expanded = expanded.concat(tokenize(SYNONYMS[t]));
      });
      expanded = unique(expanded);
      log('rewrite', expanded.length ? 'expanded to: ' + expanded.join(', ') : 'no useful rewrite found', !expanded.length);
      await wait(step); if (id !== runId) return;

      enter('retrieve', 'rewrite-retrieve');
      results = bm25(expanded);
      log('retrieve', describe(results));
      await wait(step); if (id !== runId) return;

      enter('grade', 'retrieve-grade');
      terms = expanded;
      verdict = { pass: results.length > 0 && expanded.length > 0, hits: results.length ? results[0].hits : 0 };
      log('grade', verdict.hits + '/' + terms.length + ' terms supported · ' + (verdict.pass ? 'pass' : 'fail'), !verdict.pass);
      await wait(step); if (id !== runId) return;
    }

    if (!verdict.pass) {
      enter('none', 'grade-none');
      log('end', 'insufficient evidence, not guessing', true);
      await wait(step / 2); if (id !== runId) return;
      finish();
      await stream("I don't have evidence for that in the resume, so I won't guess. Try asking about LangGraph, RAG, fraud detection, his education, or how to get in touch.", id);
      return;
    }

    var picked = [results[0]];
    if (results[1] && results[1].score >= results[0].score * 0.75) picked.push(results[1]);
    enter('generate', 'grade-generate');
    log('generate', 'quoting ' + picked.length + (picked.length > 1 ? ' passages' : ' passage') + ' with citations');
    await wait(step / 2); if (id !== runId) return;
    finish();

    await stream(picked.map(function (r) { return r.doc.chunk.text; }).join(' '), id);
    if (id !== runId) return;
    picked.forEach(function (r) {
      var a = document.createElement('a');
      a.href = r.doc.chunk.href;
      a.textContent = 'Source: ' + r.doc.chunk.label;
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
  setTimeout(function () { input.value = first; run(first); }, reduceMotion ? 0 : 900);
})();
