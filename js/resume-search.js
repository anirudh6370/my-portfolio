/* Resume search engine for the "Ask my resume" panel.
   Real BM25 keyword retrieval over the passages below, with typo-tolerant term
   matching and a synonym-based rewrite step. There is no LLM: the answer is
   always one of these passages, quoted. */
(function (global) {
  'use strict';

  var CORPUS = [
    { id: 'summary', label: 'Summary', href: '#top',
      text: 'Anirudha is an AI Agent Engineer with 2.5+ years of experience building Generative AI and LLM applications, agentic workflows and RAG pipelines for insurance and enterprise use cases.',
      extra: 'anirudha sutar who about profile background introduction generative genai years experience explainable' },
    { id: 'current-role', label: 'Current role', href: '#work',
      text: 'He currently works as an Associate Software Engineer (AI) at Insuremo Pvt Ltd, a role he has held since April 2025. Before that he was an AI Engineer at AppNAI from April 2024 to March 2025.',
      extra: 'current role position title job company employer insuremo appnai career history timeline present' },
    { id: 'insuremo-mmv', label: 'MMV mapping', href: '#work',
      text: 'At Insuremo he built a LangGraph service that maps vehicle Make-Model-Variant data across insurers using hybrid BM25 and semantic search over OpenSearch, with Redis caching and LangSmith monitoring. It cut manual mapping effort by an estimated 40%.',
      extra: 'insuremo motor insurance vehicle rag retrieval hybrid search vector cache caching token cost latency prompt langgraph built production impact' },
    { id: 'insuremo-fraud', label: 'Fraud detection', href: '#work',
      text: 'He modelled claims, claimants and garages as a Neo4j knowledge graph and used WCC and Leiden community detection to surface collusion networks across 10K+ claim records. LangGraph agents explain each flagged claim in plain language. False-positive manual reviews fell by an estimated 30%.',
      extra: 'insuremo insurance fraud collusion detect detection graph analytics gds neo4j agents explainable claims invoice langgraph built production impact' },
    { id: 'insuremo-policy', label: 'Policy templates', href: '#work',
      text: 'He built an agent-driven document intelligence pipeline that converts static insurance policy documents into dynamic, tag-based templates with Aspose, cutting manual policy-generation effort by an estimated 30%.',
      extra: 'insuremo document parsing template generation tagging aspose extraction policy agents production impact' },
    { id: 'appnai', label: 'AppNAI', href: '#work',
      text: 'As an AI Engineer at AppNAI from April 2024 to March 2025, he built computer vision applications for agriculture using TensorFlow and transfer learning on VGG and Xception, served through FastAPI and a React frontend.',
      extra: 'appnai computer vision agriculture tensorflow scikit-learn react fastapi model training frontend' },
    { id: 'sundesk', label: 'SunDesk Copilot', href: '#projects',
      text: 'SunDesk Copilot is his agentic RAG support assistant: a stateful LangGraph workflow that routes queries, retrieves from Pinecone, grades evidence with the LLM, falls back to Tavily web search, and answers only from graded evidence with citations.',
      extra: 'sundesk copilot project personal corrective rag agentic pinecone tavily groq streamlit fastapi docker langsmith memory sqlite pydantic structured hallucination langgraph built citation github open source' },
    { id: 'alzheimers', label: "Alzheimer's MRI", href: '#projects',
      text: "He built an early Alzheimer's detection model on brain MRI images using VGG16 feature extraction and CNN classification, with Gaussian blurring, skull stripping and data augmentation.",
      extra: 'alzheimer alzheimers brain mri medical healthcare opencv vgg16 cnn project diagnosis detection' },
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
      text: 'On the backend he uses Python, FastAPI, REST APIs, Pydantic, Streamlit, Redis, SQL, MySQL, SQLite and Neo4j with Graph Data Science.',
      extra: 'skills backend data api database programming language' },
    { id: 'skills-cloud', label: 'Cloud skills', href: '#skills',
      text: 'For cloud and DevOps he uses AWS (EC2, S3 and Lambda), Docker, Git, GitHub Actions and CI/CD, and he works with Claude Code.',
      extra: 'skills cloud devops deployment aws docker container pipeline' },
    { id: 'skills-ml', label: 'ML skills', href: '#skills',
      text: 'For machine learning and computer vision he uses PyTorch, TensorFlow, Hugging Face Transformers, Scikit-learn, NLP, OpenCV, CNNs, transfer learning and BERT.',
      extra: 'skills ml machine learning deep computer vision' },
    { id: 'education', label: 'Education', href: '#education',
      text: 'He holds an M.Sc. in Data Science from Silicon University, Bhubaneswar (2022 to 2024) with a CGPA of 9.33 out of 10, plus Great Learning certifications in TensorFlow Python and Python for Data Analysis.',
      extra: 'education msc master degree university cgpa grade certification certifications achievers club' },
    { id: 'contact', label: 'Contact', href: '#contact',
      text: 'You can reach Anirudha at sutaranirudha604@gmail.com, on LinkedIn at linkedin.com/in/anirudha-sutar, or on GitHub at github.com/anirudh6370. He is based in Pune, India.',
      extra: 'contact email linkedin github pune india location' }
  ];

  // Used by the rewrite step when the first retrieval is graded weak.
  var SYNONYMS = {
    study: 'education degree university', studied: 'education degree university', college: 'education university',
    school: 'education university', qualification: 'education degree', qualifications: 'education degree',
    graduate: 'education degree', graduated: 'education degree', academic: 'education degree cgpa',
    marks: 'cgpa education', score: 'cgpa education', gpa: 'cgpa education',
    job: 'current role insuremo', work: 'current role insuremo appnai', works: 'current role insuremo',
    working: 'current role insuremo', worked: 'current role insuremo appnai', now: 'current role insuremo',
    employed: 'current role insuremo', previous: 'appnai role', past: 'appnai role', before: 'appnai role',
    reach: 'contact email', hire: 'contact email', mail: 'contact email', message: 'contact email',
    touch: 'contact email', phone: 'contact email', talk: 'contact email', connect: 'contact linkedin',
    live: 'pune india location', lives: 'pune india location', based: 'pune india location',
    city: 'pune india location', country: 'india location', located: 'pune india location',
    stack: 'skills python langgraph', tech: 'skills python langgraph', tools: 'skills', tool: 'skills',
    technology: 'skills', technologies: 'skills', languages: 'skills python programming',
    frameworks: 'skills langgraph langchain', framework: 'skills langgraph langchain',
    strengths: 'summary agentic rag', strong: 'summary agentic rag', expertise: 'summary agentic rag',
    specialise: 'summary agentic rag', specialize: 'summary agentic rag', speciality: 'summary agentic rag',
    senior: 'years experience', seniority: 'years experience', long: 'years experience',
    db: 'vector database sql', databases: 'vector database sql',
    hallucinations: 'hallucination evidence grading', chatbot: 'sundesk copilot assistant',
    health: 'alzheimer mri', image: 'computer vision opencv', images: 'computer vision opencv',
    cheap: 'cost token caching', fast: 'latency cache', speed: 'latency cache', performance: 'latency cache cost',
    portfolio: 'project sundesk', side: 'project sundesk', achievements: 'impact production',
    achievement: 'impact production', results: 'impact production', impact: 'impact production',
    provider: 'groq ollama llm', providers: 'groq ollama llm', models: 'groq ollama llm',
    deploy: 'deployment docker aws', deployed: 'deployment docker aws', deploying: 'deployment docker aws',
    kg: 'knowledge graph neo4j', llms: 'llm agents', ai: 'agents llm', genai: 'generative llm'
  };

  var STOP = {};
  ('a an and are as at be been but by can could did do does for had has have he her him his how i if in is it ' +
   'its know known me my of on or she so that the their them they this to use used using was were what when where which ' +
   'who whom why will with would you your about any tell show give get got some there than then into also many much ' +
   'kind kinds sort type types thing things please describe explain list mention most really very ' +
   'well good great familiar proficient skilled ever comfortable').split(' ')
    .forEach(function (w) { STOP[w] = true; });

  function stem(w) {
    if (w.length > 4 && /ies$/.test(w)) return w.slice(0, -3) + 'y';
    if (w.length > 3 && /s$/.test(w) && !/ss$/.test(w)) return w.slice(0, -1);
    return w;
  }
  function words(text) {
    var out = [];
    (String(text).toLowerCase().match(/[a-z0-9][a-z0-9+#-]*/g) || []).forEach(function (w) {
      out.push(w);
      if (w.indexOf('-') > -1) w.split('-').forEach(function (p) { if (p) out.push(p); });
    });
    return out;
  }
  function tokenize(text) {
    return words(text).filter(function (w) { return !STOP[w]; }).map(stem);
  }
  function unique(list) {
    return list.filter(function (x, i) { return list.indexOf(x) === i; });
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
  var vocab = Object.keys(df);

  function editDistanceWithin1(a, b) {
    if (Math.abs(a.length - b.length) > 1) return false;
    var i = 0, j = 0, edits = 0;
    while (i < a.length && j < b.length) {
      if (a[i] === b[j]) { i++; j++; continue; }
      if (++edits > 1) return false;
      if (a.length > b.length) i++;
      else if (a.length < b.length) j++;
      else { i++; j++; }
    }
    return edits + (a.length - i) + (b.length - j) <= 1;
  }

  // Map a query term onto the index vocabulary: exact, then shared prefix
  // (detect / detection), then a single typo (langraph / langgraph).
  function resolve(term) {
    if (df[term]) return term;
    if (term.length < 4) return null;
    var best = null;
    vocab.forEach(function (v) {
      if (v.length < 4) return;
      var prefix = (v.indexOf(term) === 0 || term.indexOf(v) === 0) && Math.min(v.length, term.length) >= 5;
      var typo = term.length >= 5 && editDistanceWithin1(term, v);
      if ((prefix || typo) && (!best || df[v] < df[best])) best = v;
    });
    return best;
  }

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
      return { chunk: d.chunk, score: score, hits: hits };
    }).filter(function (r) { return r.score > 0; })
      .sort(function (a, b2) { return b2.score - a.score; });
  }

  function retrieve(rawTerms) {
    var resolved = unique(rawTerms.map(resolve).filter(Boolean));
    return { resolved: resolved, results: bm25(resolved) };
  }

  /* Runs the whole loop synchronously and returns the steps taken, so the UI
     can replay them. Each step: { node, edge, message, warn }. */
  function ask(query) {
    var steps = [];
    var display = unique(words(query).filter(function (w) { return !STOP[w]; }));
    var terms = unique(tokenize(query));

    steps.push({ node: 'route', message: terms.length
      ? 'resume_index · terms: ' + display.join(', ')
      : 'no searchable terms in the query', warn: !terms.length });

    var first = retrieve(terms);
    var results = first.results;
    steps.push({ node: 'retrieve', edge: 'route-retrieve', message: describe(results) });

    // Pass when the best passage supports at least half of the query terms
    // (all of them for one- and two-term queries).
    var hits = results.length ? results[0].hits : 0;
    var needed = terms.length <= 2 ? terms.length : Math.ceil(terms.length / 2);
    var pass = terms.length > 0 && results.length > 0 && hits >= needed;
    steps.push({ node: 'grade', edge: 'retrieve-grade',
      message: hits + '/' + terms.length + ' terms supported · ' + (pass ? 'pass' : 'weak'), warn: !pass });

    if (!pass) {
      var expanded = [];
      words(query).forEach(function (w) {
        var syn = SYNONYMS[w] || SYNONYMS[stem(w)];
        if (syn) expanded = expanded.concat(syn.split(' '));
      });
      expanded = unique(expanded);
      steps.push({ node: 'rewrite', edge: 'grade-rewrite', warn: !expanded.length,
        message: expanded.length ? 'expanded to: ' + expanded.join(', ') : 'no useful rewrite found' });

      var second = retrieve(unique(expanded.map(stem)));
      results = second.results;
      steps.push({ node: 'retrieve', edge: 'rewrite-retrieve', message: describe(results) });

      pass = expanded.length > 0 && results.length > 0;
      steps.push({ node: 'grade', edge: 'retrieve-grade',
        message: (results.length ? results[0].hits : 0) + '/' + expanded.length + ' terms supported · ' + (pass ? 'pass' : 'fail'),
        warn: !pass });
    }

    if (!pass) {
      steps.push({ node: 'none', edge: 'grade-none', message: 'insufficient evidence, not guessing', warn: true });
      return { steps: steps, answer: null, sources: [] };
    }

    var sources = [results[0].chunk];
    if (results[1] && results[1].score >= results[0].score * 0.8) sources.push(results[1].chunk);
    steps.push({ node: 'generate', edge: 'grade-generate', message: 'quoting best passage with citations' });
    return { steps: steps, answer: results[0].chunk.text, sources: sources };
  }

  function describe(results) {
    if (!results.length) return 'bm25 · 0 passages matched';
    return 'bm25 · top ' + Math.min(3, results.length) + ': ' + results.slice(0, 3).map(function (r) {
      return r.chunk.id + ' ' + r.score.toFixed(2);
    }).join(', ');
  }

  var api = { ask: ask };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else global.ResumeSearch = api;
})(typeof window !== 'undefined' ? window : this);
