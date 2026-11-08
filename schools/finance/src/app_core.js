/* Finance Learning Foundation — core: utilities, storage, mastery, router and the reading views. */
(function () {
  'use strict';
  const CAT = window.TOE_CATALOG;
  const K = window.ToEChecker;
  const TX = window.ToEText;
  const GEN = window.ToEGen || { has: () => false, make: () => null };
  const COURSES = new Map(CAT.courses.map((c) => [c.code, c]));
  const BY_LOWER = new Map(CAT.courses.map((c) => [c.code.toLowerCase(), c.code]));
  const GROUPS = new Map(CAT.groups.map((g) => [g.key, g]));
  const App = (window.ToEApp = { CAT, K, TX, GEN, COURSES, GROUPS, sessions: {}, content: {} });

  // ---------- small utilities ----------
  const esc = TX.esc;
  const pad2 = (n) => String(n).padStart(2, '0');
  const lessonId = (code, week) => code + '-' + pad2(week);
  const hashCode = (code) => code.toLowerCase();
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const clone = (o) => JSON.parse(JSON.stringify(o));
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); };
  const rand32 = () => (Math.random() * 4294967296) >>> 0;
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const fmtDate = (ts) => new Date(ts).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  const fmtWhen = (ts) => {
    const d = Math.round((ts - Date.now()) / 3600000);
    if (d <= 0) return 'now';
    if (d < 24) return 'in ' + d + ' h';
    return fmtDate(ts);
  };
  Object.assign(App, { esc, pad2, lessonId, hashCode, $, $$, clone, today, rand32, shuffle, pick, fmtDate, fmtWhen });

  // ---------- math + markdown ----------
  // let long inline lists such as t = 0, 0.25, 0.5, ... wrap after their commas on narrow screens
  function breakable(t) {
    let depth = 0, out = '';
    for (let i = 0; i < t.length; i++) {
      const c = t[i];
      if (c === '\\') {
        if (t.startsWith('\\left', i) && !/[a-zA-Z]/.test(t[i + 5] || '')) depth++;
        else if (t.startsWith('\\right', i) && !/[a-zA-Z]/.test(t[i + 6] || '')) depth--;
        out += c + (t[i + 1] || ''); i++; continue;
      }
      if (c === '{') depth++;
      else if (c === '}') depth--;
      out += c;
      if (c === ',' && depth === 0) out += '\\allowbreak ';
    }
    return out;
  }
  function tex(t, display) {
    if (window.katex) {
      try { return window.katex.renderToString(display ? t : breakable(t), { displayMode: !!display, throwOnError: false, strict: 'ignore', output: 'htmlAndMathml' }); }
      catch (e) { /* fall through */ }
    }
    return '<span class="tex-fallback">' + esc(t) + '</span>';
  }
  const md = (s, opts) => TX.renderMarkdown(s || '', tex, opts);
  const mdi = (s) => TX.renderInline(s || '', tex);
  // short texts that may hold a code block (example problems and steps) get block rendering
  const mdx = (s) => (/```/.test(s || '') ? md(s) : mdi(s));
  Object.assign(App, { tex, md, mdi, mdx });

  // ---------- storage ----------
  const LS_P = 'flf-progress-v1', LS_E = 'flf-errorlog-v1';
  const blank = () => ({ v: 1, updatedAt: 0, skills: {}, quizzes: {}, tests: {}, projects: {}, diagnostic: null, days: [], recent: null, explained: {} });
  const Store = (App.Store = {
    data: blank(), elog: { updatedAt: 0, entries: [] }, mode: 'local', db: null, uid: null,
    dirty: new Set(), writing: false, timer: null, readOnlyRemote: false,
    loadLocal() {
      try { const p = localStorage.getItem(LS_P); if (p) this.data = Object.assign(blank(), JSON.parse(p)); } catch (e) { /* storage unavailable */ }
      try { const e = localStorage.getItem(LS_E); if (e) this.elog = JSON.parse(e); } catch (e) { /* storage unavailable */ }
    },
    saveLocal() {
      try { localStorage.setItem(LS_P, JSON.stringify(this.data)); localStorage.setItem(LS_E, JSON.stringify(this.elog)); } catch (e) { /* storage unavailable */ }
    },
    async init() {
      this.loadLocal();
      setSaveState(this.mode === 'local' ? 'Progress saves in this browser' : '');
      if (!window.claude || typeof window.claude.use !== 'function') return;
      try {
        const [user, db] = await Promise.all([window.claude.use('user'), window.claude.use('db')]);
        if (!user || !db) return;
        const uid = await user.id();
        if (!uid) return;
        this.db = db; this.uid = uid;
        const pRef = db.doc('data/users/' + uid + '/progress'), eRef = db.doc('data/users/' + uid + '/errorlog');
        const [p, e] = await Promise.all([pRef.get(), eRef.get()]);
        this.mode = 'db';
        let pushP = false, pushE = false;
        if (p.exists) {
          const r = p.data();
          if ((r.updatedAt || 0) >= (this.data.updatedAt || 0)) this.data = Object.assign(blank(), clone(r));
          else pushP = true;
        } else if (this.data.updatedAt) pushP = true;
        if (e.exists) {
          const r = e.data();
          if ((r.updatedAt || 0) >= (this.elog.updatedAt || 0)) this.elog = clone(r);
          else pushE = true;
        } else if (this.elog.updatedAt) pushE = true;
        this.saveLocal();
        setSaveState('Progress saves to your account');
        if (pushP) this.dirty.add('progress');
        if (pushE) this.dirty.add('errorlog');
        if (this.dirty.size) this.flush();
        App.rerender && App.rerender();
      } catch (err) {
        this.mode = 'local';
        setSaveState('Progress saves in this browser');
      }
    },
    touch(which) {
      const now = Date.now();
      if (which === 'errorlog') this.elog.updatedAt = now; else this.data.updatedAt = now;
      this.saveLocal();
      if (this.mode !== 'db' || this.readOnlyRemote) return;
      this.dirty.add(which || 'progress');
      clearTimeout(this.timer);
      this.timer = setTimeout(() => this.flush(), 1500);
    },
    async flush() {
      if (this.writing || !this.db) return;
      this.writing = true;
      try {
        while (this.dirty.size) {
          const which = this.dirty.values().next().value;
          this.dirty.delete(which);
          const ref = this.db.doc('data/users/' + this.uid + '/' + which);
          const body = clone(which === 'errorlog' ? this.elog : this.data);
          try {
            setSaveState('Saving…');
            await ref.set(body);
            setSaveState('Saved to your account');
          } catch (e) {
            const code = e && e.code;
            if (code === 'unavailable') { await new Promise((r) => setTimeout(r, 800 + Math.random() * 800)); this.dirty.add(which); continue; }
            if (code === 'quota_exceeded') { setSaveState('Account storage is full; saving in this browser'); }
            else { setSaveState('Saving in this browser only'); }
            this.readOnlyRemote = true;
            break;
          }
        }
      } finally { this.writing = false; }
    },
  });
  function setSaveState(t) { const el = $('#save-state'); if (el) el.textContent = t || ''; }

  // ---------- mastery ----------
  const LEVELS = ['Not started', 'Attempted', 'Familiar', 'Proficient', 'Mastered'];
  const POINTS = [0, 0, 50, 80, 100];
  const level = (id) => ((Store.data.skills[id] || {}).level || 0);
  function setLevel(id, lv, source, score) {
    const s = Store.data.skills[id] || (Store.data.skills[id] = { level: 0, n: 0 });
    const before = s.level || 0;
    s.level = Math.max(0, Math.min(4, lv));
    s.n = (s.n || 0) + 1;
    s.last = Date.now();
    s.src = source;
    if (score != null) s.best = Math.max(s.best || 0, score);
    return { id, before, after: s.level };
  }
  function lessonsOf(code) { const out = []; for (let w = 1; w <= 12; w++) out.push(lessonId(code, w)); return out; }
  function courseCounts(code) {
    const c = [0, 0, 0, 0, 0];
    lessonsOf(code).forEach((id) => c[level(id)]++);
    return c;
  }
  function coursePct(code) {
    const ids = lessonsOf(code);
    return Math.round(ids.reduce((s, id) => s + POINTS[level(id)], 0) / (ids.length * 100) * 100);
  }
  function courseStarted(code) { return lessonsOf(code).some((id) => level(id) > 0) || !!Store.data.tests[code + '-final']; }
  function totalPoints() { return Object.keys(Store.data.skills).reduce((s, id) => s + POINTS[level(id)], 0); }
  function markDay() { const d = today(); const days = Store.data.days || (Store.data.days = []); if (days[days.length - 1] !== d) { days.push(d); if (days.length > 90) days.splice(0, days.length - 90); } }
  const sq = (lv, big) => '<span class="sq l' + lv + (big ? ' lg' : '') + '" title="' + LEVELS[lv] + '" aria-label="' + LEVELS[lv] + '"></span>';
  const lvChip = (lv) => '<span class="lv">' + sq(lv) + LEVELS[lv] + '</span>';
  function mbar(code) {
    const c = courseCounts(code), n = 12;
    return '<div class="mbar" role="img" aria-label="' + coursePct(code) + '% mastered">' + [4, 3, 2, 1].map((l) => c[l] ? '<i class="b' + l + '" style="width:' + (c[l] / n * 100).toFixed(2) + '%"></i>' : '').join('') + '</div>';
  }
  const legend = () => '<div class="legend">' + [4, 3, 2, 1, 0].map((l) => '<span>' + sq(l) + LEVELS[l] + '</span>').join('') + '</div>';
  Object.assign(App, { LEVELS, POINTS, level, setLevel, lessonsOf, courseCounts, coursePct, courseStarted, totalPoints, markDay, sq, lvChip, mbar, legend });

  // ---------- content loading ----------
  async function loadCourse(code) {
    if (App.content[code]) return App.content[code];
    if (window.TOE_READY && !window.TOE_READY[code]) throw new Error('not published');
    let data;
    const embedded = document.getElementById('course-' + code);
    if (embedded) data = JSON.parse(embedded.textContent);
    else {
      const res = await fetch('data/' + code + '.json');
      if (!res.ok) throw new Error('missing');
      data = await res.json();
    }
    App.content[code] = data;
    return data;
  }
  App.loadCourse = loadCourse;
  function lessonAt(content, w) { return content && content.lessons ? content.lessons.find((l) => l.week === w) || null : null; }
  const READY = window.TOE_READY || {};
  function ready(code) { const r = READY[code] || { weeks: [], project: false }; return { weeks: new Set(r.weeks), project: !!r.project, n: r.weeks.length, full: r.weeks.length === 12 && !!r.project }; }
  Object.assign(App, { lessonAt, ready });

  // ---------- router ----------
  const main = () => $('#main');
  const routes = [];
  App.route = (re, fn, nav) => routes.push({ re, fn, nav });
  function current() { return (location.hash || '').replace(/^#/, ''); }
  App.go = (h) => { if (current() === h) render(); else location.hash = h; };
  function codeOf(s) { return BY_LOWER.get(String(s).toLowerCase()) || null; }
  App.codeOf = codeOf;
  async function render() {
    const h = current();
    for (const r of routes) {
      const m = r.re.exec(h);
      if (m) {
        $$('.nav a').forEach((a) => a.removeAttribute('aria-current'));
        const navEl = $('.nav a[data-nav="' + (r.nav || '') + '"]');
        if (navEl) navEl.setAttribute('aria-current', 'page');
        App.Tutor && App.Tutor.setContext(null);
        try { await r.fn(m); } catch (e) { console.error(e); main().innerHTML = '<div class="wrap"><div class="empty">Something went wrong showing this page. <a href="#home">Back to home</a></div></div>'; }
        return;
      }
    }
    location.hash = 'home';
  }
  App.render = render;
  App.rerender = () => { const h = current(); if (!/^(practice|quiz|midterm|final|challenge|start|retry|ai)/.test(h)) render(); };
  App.mount = (html) => { main().innerHTML = html; window.scrollTo(0, 0); };
  App.toast = (t) => {
    let el = $('#toast');
    if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = t; el.hidden = false;
    clearTimeout(el._t); el._t = setTimeout(() => { el.hidden = true; }, 2600);
  };

  // ---------- shared bits ----------
  const codeTag = (code, soft) => '<a class="code-tag' + (soft ? ' soft' : '') + '" href="#course-' + hashCode(code) + '" title="' + esc(COURSES.get(code).title) + '">' + esc(code) + '</a>';
  App.codeTag = codeTag;
  function nextLessonFor(code) {
    const r = ready(code);
    for (let w = 1; w <= 12; w++) if (r.weeks.has(w) && level(lessonId(code, w)) < 3) return w;
    return null;
  }
  App.nextLessonFor = nextLessonFor;
  function currentCourse() {
    let best = null, bestTs = 0;
    Object.entries(Store.data.skills).forEach(([id, s]) => { if ((s.last || 0) > bestTs) { bestTs = s.last; best = id.split('-')[0]; } });
    if (best && COURSES.has(best)) return best;
    if (Store.data.diagnostic && Store.data.diagnostic.course) return Store.data.diagnostic.course;
    return null;
  }
  App.currentCourse = currentCourse;
  function unitOfWeek(w) { return Math.ceil(w / 2); }
  App.unitOfWeek = unitOfWeek;

  // ---------- views: home ----------
  const ladder = () => '<div class="ladder" aria-label="The five stages">' + CAT.groups.map((g, i) =>
    (i ? '<span>→</span>' : '') + '<b>' + esc(g.name) + '</b>').join('') + '</div>';

  App.route(/^(home)?$/, () => {
    const cur = currentCourse();
    const diag = Store.data.diagnostic;
    const elDue = (Store.elog.entries || []).filter((e) => e.status !== 'repaired' && e.retryAfter <= Date.now()).length;
    const elOpen = (Store.elog.entries || []).filter((e) => e.status !== 'repaired').length;
    const allIds = Object.keys(Store.data.skills);
    const prof = allIds.filter((id) => level(id) >= 3).length;
    const mast = allIds.filter((id) => level(id) === 4).length;
    // last 7 days
    const days = new Set(Store.data.days || []);
    const week = []; for (let k = 6; k >= 0; k--) { const d = new Date(Date.now() - k * 86400000); week.push(d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate())); }
    const studied = week.filter((d) => days.has(d)).length;
    let start;
    if (cur) {
      const c = COURSES.get(cur), w = nextLessonFor(cur);
      if (w) {
        const topic = c.units[unitOfWeek(w) - 1].topics[(w - 1) % 2];
        start = '<div class="panel feature start-card"><span class="eyebrow">Continue</span><div class="big">' + codeTag(cur) + ' ' + esc(c.title) + '</div>' +
          '<p class="muted">Next up: week ' + w + ', ' + esc(topic) + '. ' + (level(lessonId(cur, w)) ? 'You have started this skill; practice until it reaches Proficient.' : 'Read the lesson, then practice.') + '</p>' +
          mbar(cur) + '<div class="row"><a class="btn btn-primary" href="#lesson-' + hashCode(cur) + '-' + pad2(w) + '">Open the lesson</a><a class="btn" href="#practice-' + hashCode(cur) + '-' + pad2(w) + '">Practice</a><a class="btn btn-quiet" href="#course-' + hashCode(cur) + '">Course page</a></div></div>';
      } else {
        start = '<div class="panel feature start-card"><span class="eyebrow">Course skills complete</span><div class="big">' + codeTag(cur) + ' ' + esc(c.title) + '</div><p class="muted">Every skill is Proficient or better. Finish the project, the final and the second cumulative assessment, then move on.</p><div class="row"><a class="btn btn-primary" href="#course-' + hashCode(cur) + '">See what is left</a></div></div>';
      }
    } else {
      start = '<div class="panel feature start-card"><span class="eyebrow">Start here</span><div class="big">Find your starting point</div>' +
        '<p class="muted">Choose the stage you are at now. Each course has a course challenge, one question from every week: score about 85% and you can move past it.</p>' +
        '<div class="row"><a class="btn btn-primary" href="#start">Choose a starting point</a><a class="btn" href="#course-k1">Or begin with K1</a></div></div>';
    }
    const started = CAT.courses.filter((c) => courseStarted(c.code));
    const yours = started.length ? '<section class="section"><h2>Your courses</h2><div class="grid">' + started.map(courseCard).join('') + '</div></section>' : '';
    App.mount(
      '<div class="masthead"><div class="wrap"><span class="eyebrow">Finance Learning Foundation</span>' +
      '<h1>From kindergarten to the CFA Program and an investment career, one mastered skill at a time.</h1>' +
      '<p class="lede">Sixty-three courses that take you from counting coins through a complete college finance degree to CFA Program Levels I, II and III and the work of an investment analyst. Every lesson has worked examples and practice that checks your answers, Python exercises run right in the page, and your skills level up as you prove them.</p>' + ladder() + '</div></div>' +
      '<div class="wrap"><div class="home-top">' + start +
      '<div class="panel stack"><span class="eyebrow">Your record</span><div class="stats">' +
      '<div class="stat"><div class="n">' + totalPoints().toLocaleString() + '</div><div class="t">mastery points</div></div>' +
      '<div class="stat"><div class="n">' + prof + '</div><div class="t">skills Proficient or Mastered' + (mast ? ' (' + mast + ' Mastered)' : '') + '</div></div>' +
      '<div class="stat"><div class="n">' + studied + '<span class="faint" style="font-size:0.5em">/7</span></div><div class="t">study days this week</div><div class="days">' + week.map((d) => '<i class="' + (days.has(d) ? 'on' : '') + '" title="' + d + '"></i>').join('') + '</div></div>' +
      '<div class="stat"><div class="n">' + elOpen + '</div><div class="t">errors to repair' + (elDue ? ' · <a href="#errors">' + elDue + ' ready to retry</a>' : '') + '</div></div>' +
      '</div>' + (diag ? '<p class="faint" style="font-size:var(--s-xs)">Placement check taken ' + fmtDate(diag.ts) + '. <a href="#start">Retake it</a></p>' : '') + '</div></div>' +
      yours +
      '<section class="section"><h2>How a week works</h2><div class="grid">' +
      '<div class="panel stack"><span class="eyebrow">1 · Learn</span><p>Read one lesson and its worked examples. Study the matching part of the course reading.</p></div>' +
      '<div class="panel stack"><span class="eyebrow">2 · Practice</span><p>Work it out on paper or in the code editor, then check. Hints and the tutor help, but a question only counts if you get it right first time without them.</p></div>' +
      '<div class="panel stack"><span class="eyebrow">3 · Repair</span><p>Every miss goes into your error log. Retry a parallel problem 48 hours later until the gap is closed.</p></div>' +
      '<div class="panel stack"><span class="eyebrow">4 · Prove it</span><p>Quizzes, a midterm, a timed final and a second cumulative test, all without AI. Mastery means about 85% twice.</p></div>' +
      '</div><p class="muted"><a href="#method">The full study method</a> · <a href="#path">How the stages lead to an investment career</a></p></section>' +
      '<section class="section"><h2>All stages</h2><div class="grid">' + CAT.groups.map((g) => {
        const cs = CAT.courses.filter((c) => c.group === g.key);
        return '<a class="ccard" href="#courses"><span class="eyebrow">' + cs.length + ' courses</span><span class="t">' + esc(g.name) + '</span><span class="w">' + esc(g.blurb) + '</span><span class="row" style="gap:4px">' + cs.map((c) => '<span class="code-tag">' + c.code + '</span>').join('') + '</span></a>';
      }).join('') + '</div></section></div>'
    );
  }, 'home');

  function readyChip(code) {
    const r = ready(code);
    if (r.full) return '';
    return '<span class="chip"' + (r.n ? '' : ' style="background:transparent;border:1px dashed var(--rule)"') + '>' + (r.n ? r.n + ' of 12 lessons ready' : 'Syllabus only') + '</span>';
  }
  App.readyChip = readyChip;
  function courseCard(c) {
    const pct = coursePct(c.code);
    return '<a class="ccard' + (courseStarted(c.code) ? ' started' : '') + '" href="#course-' + hashCode(c.code) + '">' +
      '<span class="row" style="justify-content:space-between"><span class="code-tag">' + c.code + '</span><span class="row" style="gap:6px">' + (c.elective ? '<span class="chip">Elective</span>' : '') + readyChip(c.code) + '</span></span>' +
      '<span class="t">' + esc(c.title) + '</span><span class="w">' + esc(c.why) + '</span>' + mbar(c.code) +
      '<span class="meta"><span class="tnum">' + pct + '% mastered</span><span>' + (c.req.length ? 'After ' + c.req.join(', ') : 'No prerequisites') + '</span></span></a>';
  }
  App.courseCard = courseCard;

  // ---------- views: courses ----------
  App.route(/^courses$/, () => {
    App.mount('<div class="wrap"><div class="section"><span class="eyebrow">The curriculum</span><h1 style="font-size:var(--s-2xl);letter-spacing:-0.02em">' + CAT.courses.length + ' courses, five stages</h1>' +
      '<p class="muted" style="max-width:70ch">Course codes are study labels: K elementary school, J middle school, H high school, C college finance degree, P CFA Program and investment career. Follow the prerequisites on each course page; courses in different subjects run side by side, so math, reading, science, economics and programming move forward together. The whole path is a many-year journey; take it one course at a time.</p>' + legend() + '</div>' +
      CAT.groups.map((g) => '<section class="track"><div class="track-head"><h2>' + esc(g.name) + '</h2><p>' + esc(g.blurb) + '</p></div><div class="grid">' +
        CAT.courses.filter((c) => c.group === g.key).map(courseCard).join('') + '</div></section>').join('') + '</div>');
  }, 'courses');

  // ---------- views: course ----------
  App.route(/^course-([a-z0-9]+)$/, async (m) => {
    const code = codeOf(m[1]); if (!code) return App.go('courses');
    const c = COURSES.get(code);
    let content = null;
    try { content = await loadCourse(code); } catch (e) { content = null; }
    const counts = courseCounts(code), pct = coursePct(code);
    const t = Store.data.tests;
    const best = (k) => Math.max(0, ...((t[code + '-' + k] || []).map((x) => x.score)));
    const proj = Store.data.projects[code] || {};
    const finalAt = (t[code + '-final'] || []).filter((x) => x.score >= 0.85).map((x) => x.ts);
    const secondOk = (t[code + '-challenge'] || []).some((x) => x.score >= 0.85 && finalAt.some((f) => x.ts - f >= 6 * 86400000));
    const checks = [
      ['Every skill at Proficient or better', counts[3] + counts[4] === 12],
      ['Project finished', proj.status === 'done'],
      ['Week 7 midterm taken', (t[code + '-mid'] || []).length > 0],
      ['Week 14 cumulative final at 85% or better', best('final') >= 0.85],
      ['A second cumulative assessment (course challenge) at 85% or better, 1–2 weeks after the final', secondOk],
      ['Explained one major result aloud without notes', !!Store.data.explained[code]],
    ];
    const done = checks.every((x) => x[1]);
    const prof = CAT.profiles[c.profile];
    const allReady = !!(content && content.project) && [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].every((w) => lessonAt(content, w));
    const unitHtml = c.units.map((u) => {
      const isLast = u.n === 7;
      let rows = '';
      if (!isLast) {
        rows = u.weeks.map((w, i) => {
          const id = lessonId(code, w), lv = level(id);
          const L = lessonAt(content, w);
          if (!L) return '<div class="lrow"><span class="wk">Wk ' + w + '</span><div style="min-width:0"><span class="ti" style="color:var(--ink-2)">' + esc(u.topics[i]) + '</span>' +
            '<div class="sub">This lesson is still being written. Study the topic in the primary reading meanwhile.</div></div><div class="acts"><span class="chip">Coming soon</span></div></div>';
          return '<div class="lrow"><span class="wk">Wk ' + w + '</span><div style="min-width:0"><a class="ti" href="#lesson-' + hashCode(code) + '-' + pad2(w) + '">' + mdi(L.title) + '</a>' +
            '<div class="sub">' + mdi(L.summary) + '</div></div>' +
            '<div class="acts">' + lvChip(lv) + '<a class="btn btn-sm" href="#practice-' + hashCode(code) + '-' + pad2(w) + '">Practice</a></div></div>';
        }).join('');
        const qb = Store.data.quizzes[code + '-' + u.n];
        const unitReady = u.weeks.every((w) => lessonAt(content, w));
        rows += '<div class="lrow"><span class="wk">Quiz</span><div><span class="ti">Unit ' + u.n + ' quiz</span><div class="sub">' + (unitReady ? 'Six unseen questions on weeks ' + u.weeks.join(' and ') + '. No hints or tutor.' + (qb ? ' Best: ' + Math.round(qb.best * 100) + '%.' : '') : 'Opens when both lessons in this unit are published.') + '</div></div><div class="acts">' + (unitReady ? '<a class="btn btn-sm" href="#quiz-' + hashCode(code) + '-' + u.n + '">Take quiz</a>' : '') + '</div></div>';
        if (u.n === 3) {
          const mt = t[code + '-mid'] || [];
          const midReady = [1, 2, 3, 4, 5, 6].every((w) => lessonAt(content, w));
          rows += '<div class="lrow"><span class="wk">Wk 7</span><div><span class="ti">Midterm</span><div class="sub">' + (midReady ? 'Weeks 1–6, closed book, about ' + Math.round(c.finalMinutes / 2) + ' minutes.' + (mt.length ? ' Best: ' + Math.round(best('mid') * 100) + '%.' : '') : 'Opens when weeks 1–6 are published.') + '</div></div><div class="acts">' + (midReady ? '<a class="btn btn-sm" href="#midterm-' + hashCode(code) + '">Start midterm</a>' : '') + '</div></div>';
        }
      } else {
        const ft = t[code + '-final'] || [];
        rows = '<div class="lrow"><span class="wk">Wk 13</span><div><a class="ti" href="#project-' + hashCode(code) + '">' + esc(content && content.project ? content.project.title : 'Course project (brief coming soon)') + '</a><div class="sub">' + esc(c.project) + '</div></div><div class="acts"><span class="chip">' + ({ done: 'Done', doing: 'In progress' }[proj.status] || 'Not started') + '</span><a class="btn btn-sm" href="#project-' + hashCode(code) + '">Open</a></div></div>' +
          '<div class="lrow"><span class="wk">Wk 14</span><div><span class="ti">Cumulative final</span><div class="sub">' + (allReady ? 'All twelve weeks, closed book, ' + c.finalMinutes + ' minutes.' + (ft.length ? ' Best: ' + Math.round(best('final') * 100) + '%.' : '') : 'Opens when all twelve lessons and the project are published.') + '</div></div><div class="acts">' + (allReady ? '<a class="btn btn-sm" href="#final-' + hashCode(code) + '">Start final</a>' : '') + '</div></div>';
      }
      return '<section class="unit" id="unit-' + u.n + '"><div class="unit-h"><h2>Unit ' + u.n + (isLast ? ': Project and final' : ': ' + esc(u.name)) + '</h2><span class="weeks">Weeks ' + u.weeks.join('–') + '</span><span class="spacer"></span>' +
        (!isLast ? '<span class="squares">' + u.weeks.map((w) => sq(level(lessonId(code, w)))).join('') + '</span>' : '') + '</div>' + rows +
        '<div class="task"><b>Unit task</b><span>' + esc(u.deliverable) + '</span></div></section>';
    }).join('');
    App.mount(
      '<div class="masthead course-head"><div class="wrap"><div style="min-width:0"><div class="crumbs" style="padding-top:0"><a href="#courses">Courses</a><span>/</span><span>' + esc(GROUPS.get(c.group).name) + '</span></div>' +
      '<h1 style="margin-top:8px"><span class="code-tag">' + code + '</span> ' + esc(c.title) + '</h1><p class="purpose">' + esc(c.purpose) + '</p>' +
      '<dl class="kv"><dt>Why it matters</dt><dd>' + esc(c.why) + '</dd>' +
      '<dt>Builds on</dt><dd><div class="row">' + (c.req.length ? c.req.map((x) => codeTag(x)).join('') : '<span>' + esc(c.prereqText) + '</span>') + (c.soft.length ? '<span class="faint">helpful:</span>' + c.soft.map((x) => codeTag(x, true)).join('') : '') + '</div>' + (c.req.length ? '<div class="faint" style="margin-top:4px">' + esc(c.prereqText) + '</div>' : '') + '</dd>' +
      (c.leadsTo.length ? '<dt>Leads to</dt><dd><div class="row">' + c.leadsTo.map((x) => codeTag(x)).join('') + '</div></dd>' : '') +
      '<dt>Primary reading</dt><dd><a href="' + esc(c.reading.url) + '" target="_blank" rel="noopener">' + esc(c.reading.title) + '</a>' + (c.readingNote ? '<div class="faint">' + esc(c.readingNote) + '</div>' : '') +
      (c.supplement ? '<div class="faint">' + esc(c.supplement.text) + ' ' + c.supplement.links.map((l) => '<a href="' + esc(l[1]) + '" target="_blank" rel="noopener">' + esc(l[0]) + '</a>').join(' · ') + '</div>' : '') + '</dd>' +
      '<dt>Pace</dt><dd>14 instructional weeks at ' + c.hours + ' hours a week. At 4–6 hours a week, expect roughly twice as long.</dd>' +
      (c.ready ? '<dt>Ready to move on</dt><dd>' + esc(c.ready) + '</dd>' : '') + '</dl></div>' +
      '<div class="panel feature mastery-card"><span class="eyebrow">Course mastery</span><div class="row" style="align-items:baseline"><span class="pct">' + pct + '%</span><span class="faint tnum">' + (counts[3] + counts[4]) + ' of 12 skills Proficient+</span></div>' + mbar(code) +
      '<div class="squares">' + lessonsOf(code).map((id) => sq(level(id), true)).join('') + '</div>' + legend() +
      '<div class="row">' + (nextLessonFor(code) ? '<a class="btn btn-primary" href="#lesson-' + hashCode(code) + '-' + pad2(nextLessonFor(code)) + '">' + (courseStarted(code) ? 'Continue' : 'Start the course') + '</a>' : allReady ? '<a class="btn btn-primary" href="#final-' + hashCode(code) + '">Take the final</a>' : '') +
      (allReady ? '<a class="btn" href="#challenge-' + hashCode(code) + '">Course challenge</a>' : '') + '</div><p class="faint" style="font-size:var(--s-xs)">' + (allReady ? 'The course challenge samples every week. Pass it to show what you already know.' : (App.ready(code).n ? App.ready(code).n + ' of 12 lessons are published so far. The rest are being written; the course challenge, midterm and final open once their weeks are ready.' : 'The lessons for this course are being written. The full syllabus, readings and unit tasks are here now.')) + '</p></div></div></div>' +
      '<div class="wrap"><div class="course-body"><nav class="unit-index" aria-label="Units">' + c.units.map((u) => '<a href="#course-' + hashCode(code) + '" data-unit="' + u.n + '">' +
        (u.n < 7 ? '<span class="squares">' + u.weeks.map((w) => sq(level(lessonId(code, w)))).join('') + '</span>' : '<span class="sq"></span>') + 'Unit ' + u.n + '</a>').join('') +
      '<a href="#course-' + hashCode(code) + '" data-unit="done">Completion</a></nav><div class="units">' + unitHtml +
      '<section class="unit" id="unit-done"><div class="unit-h"><h2>Completion</h2><span class="spacer"></span>' + (done ? '<span class="chip" style="background:var(--ok-soft);color:var(--ok)">Course complete</span>' : '') + '</div><div style="padding:16px 18px" class="stack">' +
      '<ul class="checklist">' + checks.map((x, i) => '<li><span class="tick' + (x[1] ? ' on' : '') + '">' + (x[1] ? '✓' : '') + '</span><span>' + esc(x[0]) + (i === 5 ? ' <button class="btn btn-sm btn-quiet" id="explained">' + (x[1] ? 'Undo' : 'I did this') + '</button>' : '') + '</span></li>').join('') + '</ul>' +
      '<div class="stack" style="gap:6px"><span class="eyebrow">Assessment profile: ' + esc(prof.name) + '</span><div class="weights">' + prof.weights.map((w) => '<span style="flex:' + w[1] + '">' + esc(w[0]) + ' ' + w[1] + '%</span>').join('') + '</div><p class="faint" style="font-size:var(--s-xs)">' + esc(prof.evidence) + ' Self-study scores are private progress indicators, not credit.</p></div>' +
      '</div></section></div></div></div>'
    );
    $$('.unit-index a').forEach((a) => a.addEventListener('click', (ev) => { ev.preventDefault(); const el = $('#unit-' + a.dataset.unit); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }));
    const ex = $('#explained');
    if (ex) ex.addEventListener('click', () => { Store.data.explained[code] = !Store.data.explained[code]; Store.touch('progress'); render(); });
  }, 'courses');

  // ---------- views: lesson ----------
  App.route(/^lesson-([a-z0-9]+)-(\d\d)$/, async (m) => {
    const code = codeOf(m[1]); if (!code) return App.go('courses');
    const w = +m[2]; if (w < 1 || w > 12) return App.go('course-' + hashCode(code));
    const c = COURSES.get(code), u = c.units[unitOfWeek(w) - 1];
    App.mount('<div class="wrap"><div class="loading">Loading the lesson…</div></div>');
    let content;
    try { content = await loadCourse(code); } catch (e) { content = null; }
    const L = lessonAt(content, w);
    const id = lessonId(code, w), lv = level(id);
    const crumbs = '<div class="crumbs"><a href="#courses">Courses</a><span>/</span><a href="#course-' + hashCode(code) + '">' + code + ' ' + esc(c.title) + '</a><span>/</span><span>Unit ' + u.n + '</span><span>/</span><span>Week ' + w + '</span></div>';
    if (!L) {
      App.mount('<div class="wrap">' + crumbs + '<div class="lesson-layout"><div><h1 class="lesson-title">' + esc(u.topics[(w - 1) % 2]) + '</h1><div class="empty" style="margin-top:20px">This lesson is still being written. Meanwhile, study this week\'s topic in <a href="' + esc(c.reading.url) + '" target="_blank" rel="noopener">' + esc(c.reading.title) + '</a>, and ask the tutor to explain it.</div></div></div></div>');
      return;
    }
    const examples = (L.examples || []).map((ex, k) => '<div class="example" data-ex="' + k + '"><div class="example-h"><span class="eyebrow">Worked example</span><b>' + mdi(ex.title) + '</b></div><div class="example-body">' +
      '<div>' + mdx(ex.problem) + '</div><ol class="steps">' + ex.steps.map((s, j) => '<li' + (j > 0 ? ' hidden' : '') + '><div>' + mdx(s) + '</div></li>').join('') + '</ol>' +
      (ex.steps.length > 1 ? '<div class="row"><button class="btn btn-sm" data-next="' + k + '">Show next step</button><button class="btn btn-sm btn-quiet" data-all="' + k + '">Show all steps</button></div>' : '') + '</div></div>').join('');
    const prevW = w > 1 ? w - 1 : null, nextW = w < 12 ? w + 1 : null;
    App.mount('<div class="wrap">' + crumbs + '<div class="lesson-layout"><article style="min-width:0">' +
      '<span class="eyebrow">Week ' + w + ' · ' + esc(c.title) + '</span><h1 class="lesson-title">' + mdi(L.title) + '</h1><p class="lesson-summary">' + mdi(L.summary) + '</p>' +
      (L.objectives && L.objectives.length ? '<ul class="objectives"><span class="eyebrow" style="margin-left:-18px">You will be able to</span>' + L.objectives.map((o) => '<li>' + mdi(o) + '</li>').join('') + '</ul>' : '') +
      '<div class="prose">' + md(L.article) + '</div>' +
      (examples ? '<div class="h-block"><h2>Worked examples</h2>' + examples + '</div>' : '') +
      (L.mistakes && L.mistakes.length ? '<div class="h-block"><div class="mistakes"><span class="eyebrow" style="color:var(--warm)">Common mistakes</span><ul>' + L.mistakes.map((x) => '<li>' + mdi(x) + '</li>').join('') + '</ul></div></div>' : '') +
      '<div class="h-block"><div class="callout"><div class="stack" style="gap:6px"><span class="eyebrow">Read</span><div><a href="' + esc(c.reading.url) + '" target="_blank" rel="noopener">' + esc(c.reading.title) + '</a>' + (L.reading ? ': ' + mdi(L.reading) : '') + '</div></div></div></div>' +
      '<div class="lesson-nav">' + (prevW ? '<a class="btn btn-quiet" href="#lesson-' + hashCode(code) + '-' + pad2(prevW) + '">← Week ' + prevW + '</a>' : '<span></span>') +
      '<a class="btn btn-primary" href="#practice-' + hashCode(code) + '-' + pad2(w) + '">Practice this skill</a>' +
      (nextW ? '<a class="btn btn-quiet" href="#lesson-' + hashCode(code) + '-' + pad2(nextW) + '">Week ' + nextW + ' →</a>' : '<a class="btn btn-quiet" href="#project-' + hashCode(code) + '">Project →</a>') + '</div></article>' +
      '<aside class="lesson-side"><div class="side-card"><span class="eyebrow">This skill</span>' + lvChip(lv) +
      '<p class="faint" style="font-size:var(--s-xs)">' + (lv < 3 ? 'Get every practice question right first time, without hints, to reach Proficient. Tests can take it to Mastered.' : lv < 4 ? 'Proficient. Answer it correctly on a midterm, final or course challenge to reach Mastered.' : 'Mastered. Keep it fresh with the course challenge.') + '</p>' +
      '<a class="btn btn-primary" href="#practice-' + hashCode(code) + '-' + pad2(w) + '">Practice' + (GEN.has(id) ? ' (fresh problems every time)' : '') + '</a>' +
      '<button class="btn" data-tutor="lesson">Ask the tutor about this lesson</button></div>' +
      '<div class="side-card"><span class="eyebrow">Unit ' + u.n + '</span>' + u.weeks.map((x) => '<a href="#lesson-' + hashCode(code) + '-' + pad2(x) + '" class="row" style="text-decoration:none;color:' + (x === w ? 'var(--ink)' : 'var(--ink-2)') + ';font-weight:' + (x === w ? 700 : 400) + '">' + sq(level(lessonId(code, x))) + ' Week ' + x + ': ' + esc(lessonAt(content, x) ? lessonAt(content, x).title : COURSES.get(code).units[unitOfWeek(x) - 1].topics[(x - 1) % 2]) + '</a>').join('') +
      '<div class="faint" style="font-size:var(--s-xs)"><b>Unit task:</b> ' + esc(u.deliverable) + '</div><a class="btn btn-sm" href="#quiz-' + hashCode(code) + '-' + u.n + '">Unit ' + u.n + ' quiz</a></div></aside></div></div>');
    $$('[data-next]').forEach((b) => b.addEventListener('click', () => {
      const box = $('.example[data-ex="' + b.dataset.next + '"]');
      const hidden = $$('.steps li[hidden]', box);
      if (hidden.length) hidden[0].hidden = false;
      if (hidden.length <= 1) { b.disabled = true; const all = $('[data-all="' + b.dataset.next + '"]', box); if (all) all.hidden = true; }
    }));
    $$('[data-all]').forEach((b) => b.addEventListener('click', () => {
      const box = $('.example[data-ex="' + b.dataset.all + '"]');
      $$('.steps li', box).forEach((li) => { li.hidden = false; });
      b.hidden = true; const nx = $('[data-next="' + b.dataset.all + '"]', box); if (nx) nx.disabled = true;
    }));
    App.Tutor && App.Tutor.setContext({ kind: 'lesson', code, week: w, lesson: L });
    $$('[data-tutor="lesson"]').forEach((b) => b.addEventListener('click', () => App.Tutor.openDrawer()));
    if (App.enhanceCode) App.enhanceCode();
  }, 'courses');

  // ---------- views: project ----------
  App.route(/^project-([a-z0-9]+)$/, async (m) => {
    const code = codeOf(m[1]); if (!code) return App.go('courses');
    const c = COURSES.get(code);
    let content; try { content = await loadCourse(code); } catch (e) { content = null; }
    const P = content && content.project;
    const st = Store.data.projects[code] || (Store.data.projects[code] = { status: 'not', rubric: [], notes: '' });
    const statusBtn = (k, label) => '<button aria-pressed="' + (st.status === k) + '" data-st="' + k + '">' + label + '</button>';
    App.mount('<div class="wrap"><div class="crumbs"><a href="#courses">Courses</a><span>/</span><a href="#course-' + hashCode(code) + '">' + code + ' ' + esc(c.title) + '</a><span>/</span><span>Weeks 13–14</span></div>' +
      '<div class="lesson-layout"><article style="min-width:0"><span class="eyebrow">Course project</span><h1 class="lesson-title">' + esc(P ? P.title : 'Course project') + '</h1>' +
      '<p class="lesson-summary">' + (P ? mdi(P.overview) : esc(c.project)) + '</p>' +
      (P ? '<div class="prose">' +
        (P.goals.length ? '<h3>Goals</h3><ul>' + P.goals.map((g) => '<li>' + mdi(g) + '</li>').join('') + '</ul>' : '') +
        '<h3>Plan</h3><ol>' + P.steps.map((s) => '<li>' + mdi(s) + '</li>').join('') + '</ol>' +
        (P.materials && P.materials.length ? '<h3>Materials</h3>' + P.materials.map((m) => '<div class="panel" style="margin:10px 0;padding:12px 16px">' + md(m) + '</div>').join('') : '') +
        '<h3>What to hand in</h3><ul>' + P.deliverables.map((s) => '<li>' + mdi(s) + '</li>').join('') + '</ul>' +
        (P.safety ? '<blockquote><strong>Safety.</strong> ' + mdi(P.safety) + '</blockquote>' : '') +
        '<h3>Rubric</h3><p class="muted" style="font-family:var(--f-ui);font-size:var(--s-sm)">Tick each criterion your finished work meets.</p></div>' +
        '<ul class="rubric" style="margin-top:10px;max-width:68ch">' + P.rubric.map((r, i) => '<li><label><input type="checkbox" id="rub-' + i + '" data-rub="' + i + '"' + (st.rubric && st.rubric[i] ? ' checked' : '') + '><span>' + mdi(r) + '</span></label></li>').join('') + '</ul>' +
        (P.tutor && P.tutor.length ? '<div class="h-block"><div class="callout"><div class="stack" style="gap:6px"><span class="eyebrow">Questions worth asking the tutor</span><ul style="margin:0;padding-left:1.2em">' + P.tutor.map((q) => '<li>' + mdi(q) + '</li>').join('') + '</ul></div></div></div>' : '') +
        '<div class="h-block"><h2>Week 13 review guide</h2><div class="prose" style="margin-top:0">' + md(P.review) + '</div></div>'
        : '<div class="empty" style="margin-top:16px">' + esc(c.project) + '</div>') +
      '<div class="lesson-nav"><a class="btn btn-quiet" href="#lesson-' + hashCode(code) + '-12">← Week 12</a><a class="btn btn-primary" href="#final-' + hashCode(code) + '">Take the cumulative final</a></div></article>' +
      '<aside class="lesson-side"><div class="side-card"><span class="eyebrow">Project status</span><div class="tabs" role="group" aria-label="Project status">' + statusBtn('not', 'Not started') + statusBtn('doing', 'In progress') + statusBtn('done', 'Done') + '</div>' +
      '<label class="stack" style="gap:6px;font-size:var(--s-xs);font-weight:700;color:var(--ink-3)" for="proj-notes">Notes for yourself<textarea id="proj-notes" class="ans-input" style="min-height:140px;font-size:var(--s-sm)" placeholder="Where your files live, what is left, questions for a reviewer">' + esc(st.notes || '') + '</textarea></label>' +
      '<button class="btn" data-tutor="project">Ask the tutor about the project</button></div>' +
      '<div class="side-card"><span class="eyebrow">Assessment profile</span><p class="faint" style="font-size:var(--s-xs)">' + esc(CAT.profiles[c.profile].name) + ': ' + esc(CAT.profiles[c.profile].evidence) + '</p></div></aside></div></div>');
    $$('[data-st]').forEach((b) => b.addEventListener('click', () => { st.status = b.dataset.st; Store.touch('progress'); $$('[data-st]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); }));
    $$('[data-rub]').forEach((cb) => cb.addEventListener('change', () => { st.rubric = st.rubric || []; st.rubric[+cb.dataset.rub] = cb.checked; Store.touch('progress'); }));
    const notes = $('#proj-notes'); let nt;
    notes.addEventListener('input', () => { clearTimeout(nt); nt = setTimeout(() => { st.notes = notes.value.slice(0, 4000); Store.touch('progress'); }, 900); });
    App.Tutor && App.Tutor.setContext({ kind: 'project', code, project: P });
    $$('[data-tutor="project"]').forEach((b) => b.addEventListener('click', () => App.Tutor.openDrawer()));
  }, 'courses');

  // ---------- boot ----------
  window.addEventListener('hashchange', render);
  App.boot = async function () {
    App.Tutor && App.Tutor.init();
    render();
    await Store.init();
  };
})();
