/* AI Learning Foundation — exercises: practice, quizzes, tests, placement check, error log, tutor-made practice. */
(function () {
  'use strict';
  const App = window.ToEApp;
  const { K, GEN, COURSES, Store, esc, pad2, lessonId, hashCode, $, $$, shuffle, pick, rand32, tex, mdi, md } = App;

  // ---------- helpers ----------
  const typeHelp = {
    num: 'Enter a number or exact value: 3/4, -2.5, sqrt(2)/2, 2pi, 1.5e3.',
    expr: 'Enter an expression: use ^ for powers, sqrt(), pi, e^(x), ln(), sin(). Implicit multiplication works: 3x^2.',
    list: 'Enter every value, separated by commas. Type none if there are no solutions.',
    tuple: 'Enter the values in order, like (2, -1).',
    text: 'Type the answer exactly. Spaces at the ends of lines do not matter; capital letters and punctuation do.',
  };
  const codeBlock = (src) => '<pre class="code"><code data-lang="python">' + App.TX.highlight('python', String(src || '')) + '</code></pre>';
  const textBlock = (t) => (/\n/.test(String(t)) ? '<pre class="answer-text">' + esc(t) + '</pre>' : '<code class="answer-text">' + esc(t) + '</code>');
  App.codeBlock = codeBlock;
  function correctHtml(item) {
    if (item.type === 'mc') return mdi(item.choices[item.answer]);
    if (item.type === 'ms') return (item.answer || []).map((i) => mdi(item.choices[i])).join('; ');
    if (item.type === 'self') return '<em>Compare with the model answer.</em>';
    if (item.type === 'code') return item.model ? '<div class="model-code">' + codeBlock(item.model) + '</div>' : '<em>See the solution.</em>';
    if (item.type === 'text') return textBlock(item.answer);
    const t = K.preview(item.answer, item);
    return t ? tex(t) : esc(item.answer);
  }
  function givenHtml(q) {
    const it = q.item;
    if (it.type === 'mc') return q.given == null || q.given === '' ? '<em>No answer</em>' : mdi(it.choices[q.given]);
    if (it.type === 'ms') return (q.given || []).length ? q.given.map((i) => mdi(it.choices[i])).join('; ') : '<em>No answer</em>';
    if (it.type === 'self') return q.self ? ({ yes: 'Matched the model answer', partly: 'Partly matched', no: 'Did not match yet' }[q.self]) : '<em>Not self-assessed</em>';
    if (it.type === 'code') {
      const r = q.result;
      const sum = !r ? '' : r.result === 'timeout' ? ' (stopped: it ran too long)' : r.result === 'error' ? ' (it raised an error)' : r.total ? ' (' + r.passed + ' of ' + r.total + ' tests passed)' : '';
      return q.given && q.given.trim() !== (it.starter || '').trim() ? '<span>' + esc(sum.replace(/^ \(|\)$/g, '')) + '</span>' + codeBlock(q.given) : '<em>No code written</em>';
    }
    if (!q.given) return '<em>No answer</em>';
    if (it.type === 'text') return textBlock(q.given);
    const t = K.preview(q.given, it);
    return t ? tex(t) : '<code>' + esc(q.given) + '</code>';
  }
  App.correctHtml = correctHtml;

  function itemsFrom(L, pool) { return (L[pool] || []).map((it, i) => ({ item: it, key: L.id + ':' + pool[0] + i, lessonId: L.id })); }
  function genItem(id) {
    if (!GEN.has(id)) return null;
    const seed = rand32();
    try { const it = GEN.make(id, seed); return it ? { item: it, key: id + ':g' + seed, lessonId: id, generated: true } : null; }
    catch (e) { console.warn('generator failed', id, e); return null; }
  }
  const POS_REFS = [
    /\b(first|second|third|fourth|fifth|last|1st|2nd|3rd|4th)\s+(choice|option|answer|statement|distractor|one)s?\b/i,
    /\bthe\s+(second|third|fourth|fifth)\b(?![\s-]+(derivative|term|power|root|order|law|quadrant|row|column|step|case|equation|method|week|part|digit|kind|moment|component|condition|coefficient|line|example|postulate|integral|factor|index|variable|year|time|bianchi))/i,
    /\bthe first (has|is|gives|uses|says|claims|treats|confuses|reverses)\b/i,
    /\b(choice|option)s?\s*\(?([A-E]|[1-5])\)?(?![\w'])/,
  ];
  function citesPosition(it) {
    const txt = [it.solution || ''].concat(it.hints || []).join(' ');
    return POS_REFS.some((re) => re.test(txt));
  }
  function newQ(x, n) {
    const q = { item: x.item, key: x.key, lessonId: x.lessonId, generated: !!x.generated, ai: !!x.ai, n: n, attempts: 0, first: null,
      correct: false, done: false, hintsShown: 0, solShown: false, given: x.item.type === 'ms' ? [] : x.item.type === 'code' ? (x.item.starter || '') : '', self: null };
    // shuffle choices, except where a hint or the solution refers to them by position
    if (q.item.type === 'mc' || q.item.type === 'ms') {
      const ids = q.item.choices.map((_, i) => i);
      q.order = citesPosition(q.item) ? ids : shuffle(ids);
    }
    return q;
  }

  // ---------- session builders ----------
  function makeSession(o) {
    const s = Object.assign({ i: 0, finished: false, startedAt: Date.now(), results: null }, o);
    s.qs = o.items.map(newQ);
    return s;
  }
  function practiceSession(code, w, content) {
    const L = App.lessonAt(content, w);
    const fixed = itemsFrom(L, 'practice');
    let items = fixed;
    if (GEN.has(L.id)) {
      const gens = [genItem(L.id), genItem(L.id), genItem(L.id)].filter(Boolean);
      const keep = shuffle(fixed.map((_, i) => i)).slice(0, Math.max(2, 5 - gens.length)).sort((a, b) => a - b).map((i) => fixed[i]);
      items = [];
      const g = gens.slice();
      keep.forEach((f, k) => { if (g.length && k % 1 === 0) items.push(g.shift()); items.push(f); });
      while (g.length) items.push(g.shift());
      items = items.slice(0, 5);
    }
    return makeSession({ kind: 'practice', mode: 'practice', code, lessonIds: [L.id], title: L.title, back: '#lesson-' + hashCode(code) + '-' + pad2(w), items });
  }
  function quizSession(code, n, content) {
    const c = COURSES.get(code), u = c.units[n - 1];
    const items = [];
    u.weeks.forEach((w) => {
      const L = App.lessonAt(content, w); if (!L) return;
      itemsFrom(L, 'quiz').forEach((x) => items.push(x));
      const p = itemsFrom(L, 'practice'); if (p.length) items.push(pick(p.slice(2)) || pick(p));
    });
    return makeSession({ kind: 'quiz', mode: 'quiz', code, lessonIds: u.weeks.map((w) => lessonId(code, w)), title: 'Unit ' + n + ' quiz', back: '#course-' + hashCode(code), unit: n, items: shuffle(items) });
  }
  function examSession(code, kind, content) {
    const c = COURSES.get(code);
    const items = [];
    let weeks = [], minutes = c.finalMinutes, title;
    if (kind === 'mid') {
      weeks = [1, 2, 3, 4, 5, 6]; minutes = Math.round(c.finalMinutes / 2); title = 'Midterm';
      weeks.forEach((w) => { const L = App.lessonAt(content, w); if (L) itemsFrom(L, 'quiz').forEach((x) => items.push(x)); });
    } else if (kind === 'final') {
      weeks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; title = 'Cumulative final';
      weeks.forEach((w) => { const L = App.lessonAt(content, w); if (L) { const qz = itemsFrom(L, 'quiz'); if (qz.length) items.push(pick(qz)); } });
      if (content.project) (content.project.exam || []).forEach((it, i) => items.push({ item: it, key: code + '-P:e' + i, lessonId: code + '-P' }));
    } else {
      weeks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]; title = 'Course challenge'; minutes = null;
      weeks.forEach((w) => {
        const L = App.lessonAt(content, w); if (!L) return;
        const g = genItem(L.id);
        items.push(g || pick(itemsFrom(L, 'quiz').concat(itemsFrom(L, 'practice').slice(2))));
      });
      if (content.project && content.project.exam && content.project.exam.length) {
        const k = Math.floor(Math.random() * content.project.exam.length);
        items.push({ item: content.project.exam[k], key: code + '-P:e' + k, lessonId: code + '-P' });
      }
    }
    return makeSession({ kind: kind === 'mid' ? 'midterm' : kind, mode: 'exam', code, lessonIds: weeks.map((w) => lessonId(code, w)), title, minutes, back: '#course-' + hashCode(code), items: items.filter(Boolean) });
  }

  // ---------- rendering ----------
  function rulesText(s) {
    if (s.mode === 'practice') return 'Hints, worked solutions and the tutor are available. A question counts toward mastery when you get it right first time without a hint.';
    if (s.mode === 'quiz') return 'No hints or tutor. You will see whether each answer is right before moving on.';
    if (s.kind === 'diagnostic') return 'Work on paper without hints, notes or AI. You will see your results at the end.';
    return 'Closed book: no hints, tutor, notes or AI. Unseen questions; answers are reviewed at the end.' + (s.minutes ? ' Suggested time: ' + s.minutes + ' minutes.' : '');
  }
  function dotsHtml(s) {
    return '<div class="dots" aria-hidden="true">' + s.qs.map((q, k) => {
      let c = '';
      if (s.mode === 'exam') c = q.done ? 'done' : (k === s.i ? 'cur' : '');
      else if (q.done) c = q.first ? 'ok' : (q.hintsShown || q.solShown ? 'help' : 'bad');
      else if (k === s.i) c = 'cur';
      return '<i class="' + c + '"></i>';
    }).join('') + '</div>';
  }
  function timerHtml(s) {
    if (s.mode !== 'exam' || s.kind === 'diagnostic') return '';
    return '<span class="timer" id="timer"></span>';
  }
  function tickTimer(s) {
    clearInterval(App._timer);
    const el = () => $('#timer');
    const upd = () => {
      const e = el(); if (!e) { clearInterval(App._timer); return; }
      const sec = Math.floor((Date.now() - s.startedAt) / 1000);
      if (s.minutes) {
        const left = s.minutes * 60 - sec;
        e.textContent = (left < 0 ? '+' : '') + Math.floor(Math.abs(left) / 60) + ':' + pad2(Math.abs(left) % 60) + (left < 0 ? ' over' : ' left');
        e.classList.toggle('over', left < 0);
      } else e.textContent = Math.floor(sec / 60) + ':' + pad2(sec % 60);
    };
    upd(); App._timer = setInterval(upd, 1000);
  }

  function renderSession(s) {
    if (s.finished) return renderResults(s);
    const q = s.qs[s.i], it = q.item;
    const c = COURSES.get(s.code);
    const L = App.content[s.code] && App.content[s.code].lessons.find((x) => x.id === q.lessonId);
    const support = s.mode === 'practice';
    const meta = '<div class="ex-meta"><span class="tnum">Question ' + (s.i + 1) + ' of ' + s.qs.length + '</span>' +
      (L ? '<span class="chip">Week ' + L.week + ': ' + esc(L.title.replace(/\$[^$]*\$/g, '…')) + '</span>' : (q.lessonId.endsWith('-P') ? '<span class="chip">Cumulative</span>' : '')) +
      (q.generated ? '<span class="chip">Fresh problem</span>' : '') + (q.ai ? '<span class="chip ai-flag">Tutor-made, not verified</span>' : '') + '</div>';
    let area = '';
    if (it.type === 'mc' || it.type === 'ms') {
      const multi = it.type === 'ms';
      area = '<fieldset class="choices" style="border:0;padding:0;margin:0"><legend class="sr-only">Choices</legend>' + (multi ? '<p class="faint" style="font-size:var(--s-xs)">Select every correct choice.</p>' : '') +
        q.order.map((ci, k) => {
          const sel = multi ? q.given.indexOf(ci) >= 0 : q.given === ci;
          let cls = sel ? ' sel' : '';
          if (q.done && s.mode !== 'exam') {
            const right = multi ? it.answer.indexOf(ci) >= 0 : it.answer === ci;
            if (right) cls = ' right'; else if (sel) cls = ' wrong';
          }
          return '<label class="choice' + cls + '"><input type="' + (multi ? 'checkbox' : 'radio') + '" name="ch" id="ch-' + k + '" value="' + ci + '"' + (sel ? ' checked' : '') + (q.done ? ' disabled' : '') + '><span class="choice-letter" aria-hidden="true">' + String.fromCharCode(65 + k) + '</span><span>' + mdi(it.choices[ci]) + '</span></label>';
        }).join('') + '</fieldset>';
    } else if (it.type === 'code') {
      area = codeArea(s, q);
    } else if (it.type === 'text') {
      const multi = /\n/.test(String(it.answer || ''));
      const st = q.done && s.mode !== 'exam' ? (q.correct ? ' ok' : ' bad') : '';
      area = '<label class="sr-only" for="ans">Your answer</label>' + (multi
        ? '<textarea class="ans-input mono' + st + '" id="ans" rows="' + Math.min(10, String(it.answer).split('\n').length + 1) + '" spellcheck="false" autocapitalize="off" autocomplete="off"' + (q.done ? ' disabled' : '') + ' placeholder="Type the answer, one line per line">' + esc(q.given || '') + '</textarea>'
        : '<div class="answer-row"><input class="ans-input mono' + st + '" id="ans" autocomplete="off" autocapitalize="off" spellcheck="false" value="' + esc(q.given || '') + '"' + (q.done ? ' disabled' : '') + ' placeholder="Your answer"></div>') +
        (q.done ? '' : '<p class="faint" style="font-size:var(--s-xs);margin:0">' + esc(typeHelp.text) + '</p>');
    } else if (it.type === 'self') {
      area = '<label class="sr-only" for="ans">Your answer</label><textarea class="ans-input" id="ans" placeholder="Write your answer here, or work on paper and press Show model answer.">' + esc(q.given || '') + '</textarea>';
      if (q.solShown) {
        area += '<div class="solution"><span class="lab">Model answer</span><div>' + md(it.solution) + '</div></div>' +
          '<div class="stack" style="gap:8px"><span class="eyebrow">Check your work against each point</span><ul class="rubric">' + (it.rubric || []).map((r, k) => '<li><label><input type="checkbox" id="rb-' + k + '"><span>' + mdi(r) + '</span></label></li>').join('') + '</ul>' +
          (q.self ? '<div class="feedback info"><span>You marked this: ' + ({ yes: 'matches the model answer', partly: 'partly matches', no: 'not yet' }[q.self]) + '.</span></div>' :
            '<div class="row"><span class="faint" style="font-size:var(--s-xs)">How did your answer compare?</span><button class="btn btn-sm" data-self="yes">Matches the model</button><button class="btn btn-sm" data-self="partly">Partly</button><button class="btn btn-sm" data-self="no">Not yet</button></div>') + '</div>';
      }
    } else {
      area = '<div class="answer-row">' + (it.lead ? '<span class="lead">' + mdi(it.lead) + '</span>' : '') +
        '<label class="sr-only" for="ans">Your answer</label><input class="ans-input' + (q.done && s.mode !== 'exam' ? (q.correct ? ' ok' : ' bad') : '') + '" id="ans" autocomplete="off" autocapitalize="off" spellcheck="false" value="' + esc(q.given || '') + '"' + (q.done ? ' disabled' : '') + ' placeholder="Your answer">' +
        (it.unit ? '<span class="unit">' + mdi(it.unit) + '</span>' : '') + '</div>' +
        '<div class="preview" id="preview" aria-live="polite"></div>' +
        (q.done ? '' : '<div class="row" style="justify-content:space-between"><span class="faint" style="font-size:var(--s-xs)">' + esc(typeHelp[it.type] || '') + '</span><button class="btn btn-sm btn-quiet" id="kp-toggle" aria-expanded="false">Math keys</button></div><div class="keypad" id="keypad" hidden>' + keypadHtml(it) + '</div>');
    }
    let fb = '';
    if (q.feedback) fb = '<div class="feedback ' + q.feedback.cls + '"><span>' + esc(q.feedback.title) + '</span>' + (q.feedback.msg ? '<span class="msg">' + esc(q.feedback.msg) + '</span>' : '') + '</div>';
    const hints = (it.hints || []).slice(0, q.hintsShown).map((hh, k) => '<div class="hint"><b>Hint ' + (k + 1) + '</b><div>' + mdi(hh) + '</div></div>').join('');
    const sol = (q.solShown && it.type !== 'self') || (q.done && s.mode === 'quiz' && q.showSol) ? '<div class="solution"><span class="lab">Solution</span><div>' + md(it.solution) + '</div>' +
      (it.type === 'code' ? '<span class="lab">Model solution</span>' + codeBlock(it.model) + (s.mode === 'practice' ? '<div class="row"><button class="btn btn-sm btn-quiet" id="loadmodel" type="button">Put the model solution in the editor</button></div>' : '')
        : it.type !== 'mc' && it.type !== 'ms' ? '<div class="faint" style="font-family:var(--f-ui);font-size:var(--s-xs)">Answer: ' + correctHtml(it) + '</div>' : '') + '</div>' : '';
    // actions
    const acts = [];
    const last = s.i === s.qs.length - 1;
    if (s.mode === 'practice') {
      if (!q.done) {
        const nh = (it.hints || []).length;
        if (nh && q.hintsShown < nh) acts.push('<button class="btn" id="hint">Use a hint (' + (q.hintsShown + 1) + '/' + nh + ')</button>');
        if (it.type !== 'self') acts.push('<button class="btn btn-quiet" id="showsol">Show solution</button>');
        if (App.Tutor) acts.push('<button class="btn btn-quiet" id="help">Get help</button>');
        acts.push('<span class="spacer"></span>');
        if (it.type === 'self') { if (!q.solShown) acts.push('<button class="btn btn-primary" id="reveal">Show model answer</button>'); }
        else acts.push('<button class="btn btn-primary" id="check"' + (q.checking ? ' disabled' : '') + '>' + (q.checking ? 'Checking…' : q.attempts ? 'Check again' : 'Check') + '</button>');
      } else {
        if (it.type !== 'self' && !q.solShown) acts.push('<button class="btn btn-quiet" id="showsol">Show solution</button>');
        if (App.Tutor) acts.push('<button class="btn btn-quiet" id="help">Ask the tutor</button>');
        acts.push('<span class="spacer"></span><button class="btn btn-primary" id="next">' + (last ? 'See results' : 'Next question') + '</button>');
      }
    } else if (s.mode === 'quiz') {
      if (!q.done) {
        acts.push('<span class="spacer"></span>');
        if (it.type === 'self') { if (!q.solShown) acts.push('<button class="btn btn-primary" id="reveal">Show model answer</button>'); }
        else acts.push('<button class="btn btn-primary" id="check"' + (q.checking ? ' disabled' : '') + '>' + (q.checking ? 'Checking…' : 'Check') + '</button>');
      } else {
        if (it.type !== 'self' && !q.showSol) acts.push('<button class="btn btn-quiet" id="quizsol">Show solution</button>');
        acts.push('<span class="spacer"></span><button class="btn btn-primary" id="next">' + (last ? 'See results' : 'Next question') + '</button>');
      }
    } else {
      acts.push('<button class="btn btn-quiet" id="skip">Skip</button><span class="spacer"></span>');
      if (it.type === 'self' && !q.solShown) acts.push('<button class="btn btn-primary" id="reveal">I have written my answer</button>');
      else if (it.type !== 'self') acts.push('<button class="btn btn-primary" id="submit"' + (q.checking ? ' disabled' : '') + '>' + (q.checking ? 'Checking…' : last ? 'Submit and finish' : 'Submit answer') + '</button>');
    }
    App.mount('<div class="wrap"><div class="ex-wrap"><div class="crumbs" style="padding-top:0"><a href="' + s.back + '">← ' + esc(s.kind === 'diagnostic' ? 'Home' : s.kind === 'retry' ? 'Error log' : s.code + ' ' + c.title) + '</a></div>' +
      '<div class="ex-head"><h1>' + mdi(s.title) + '</h1><span class="spacer"></span>' + timerHtml(s) + '</div><p class="ex-rules">' + esc(rulesText(s)) + (s.notice ? ' ' + esc(s.notice) : '') + '</p>' + dotsHtml(s) +
      '<div class="ex-card">' + meta + '<div class="ex-prompt">' + md(it.prompt) + '</div>' + area + '<div aria-live="polite">' + fb + '</div>' + (hints ? '<div class="hints">' + hints + '</div>' : '') + sol +
      '<div class="ex-actions">' + acts.join('') + '</div></div></div></div>');
    if (s.mode === 'exam' && s.kind !== 'diagnostic') tickTimer(s);
    wire(s, q);
    const inp = $('#ans');
    if (inp && !q.done && inp.tagName === 'INPUT') { inp.focus({ preventScroll: true }); if (it.type !== 'text') updatePreview(inp, it); }
    if (it.type === 'code') wireCode(s, q);
    else if (s.qs.some((x) => x.item.type === 'code')) App.Code.warm();
    if (App.Tutor) App.Tutor.setContext(s.mode === 'practice' ? { kind: 'question', code: s.code, lesson: L, q: q } : { kind: 'locked', code: s.code });
  }

  function keypadHtml(it) {
    const keys = [['x²', '^2'], ['xⁿ', '^'], ['√', 'sqrt('], ['π', 'pi'], ['(', '('], [')', ')'], ['÷', '/'], ['×', '*'], ['e', 'e'], ['ln', 'ln('], ['sin', 'sin('], ['cos', 'cos('], ['tan', 'tan('], ['|x|', 'abs('], [',', ', ']];
    (it.vars || []).forEach((v) => { if (v.length > 1 || !/[a-z]/i.test(v)) keys.push([v, v]); else keys.unshift([v, v]); });
    return keys.map((k) => '<button type="button" data-ins="' + esc(k[1]) + '" aria-label="Insert ' + esc(k[1]) + '">' + esc(k[0]) + '</button>').join('');
  }
  function updatePreview(inp, it) {
    const p = $('#preview'); if (!p) return;
    const v = inp.value;
    if (!v.trim()) { p.innerHTML = ''; return; }
    const t = K.preview(v, it);
    p.innerHTML = t === null ? '<span class="lab">Keep typing; that is not a complete expression yet.</span>' : '<span class="lab">Reads as</span>' + tex(t);
  }

  function currentValue(q) {
    const it = q.item;
    if (it.type === 'mc') { const r = $('input[name="ch"]:checked'); return r ? +r.value : ''; }
    if (it.type === 'ms') return $$('input[name="ch"]:checked').map((x) => +x.value);
    if (it.type === 'code') { const ed = $('#cbq-ed'); return ed ? ed.value : (q.given || ''); }
    const inp = $('#ans'); return inp ? inp.value : '';
  }
  function isEmpty(q, v) { return q.item.type === 'ms' ? !v.length : (v === '' || v == null || String(v).trim() === ''); }

  function wire(s, q) {
    const it = q.item;
    const inp = $('#ans');
    if (inp && inp.tagName === 'INPUT') {
      inp.addEventListener('input', () => { q.given = inp.value; if (it.type !== 'text') updatePreview(inp, it); });
      inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); const b = $('#check') || $('#submit') || $('#next'); if (b) b.click(); } });
    } else if (inp) inp.addEventListener('input', () => { q.given = inp.value; });
    $$('input[name="ch"]').forEach((r) => r.addEventListener('change', () => {
      q.given = currentValue(q);
      $$('.choice').forEach((lab) => lab.classList.toggle('sel', $('input', lab).checked));
    }));
    const kt = $('#kp-toggle');
    if (kt) kt.addEventListener('click', () => { const kp = $('#keypad'); kp.hidden = !kp.hidden; kt.setAttribute('aria-expanded', String(!kp.hidden)); });
    $$('[data-ins]').forEach((b) => b.addEventListener('click', () => {
      const t = b.dataset.ins, el = $('#ans'); if (!el) return;
      const a = el.selectionStart ?? el.value.length, z = el.selectionEnd ?? el.value.length;
      el.value = el.value.slice(0, a) + t + el.value.slice(z);
      el.focus(); el.setSelectionRange(a + t.length, a + t.length);
      q.given = el.value; updatePreview(el, it);
    }));
    const on = (id, fn) => { const b = $('#' + id); if (b) b.addEventListener('click', fn); };
    on('hint', () => { q.hintsShown++; renderSession(s); });
    on('showsol', () => { q.solShown = true; if (!q.done && s.mode === 'practice') { if (q.first === null) q.first = false; q.done = true; q.feedback = q.feedback || { cls: 'info', title: 'Solution shown. Study it, then try the next question.' }; } renderSession(s); });
    on('quizsol', () => { q.showSol = true; renderSession(s); });
    on('help', () => App.Tutor && App.Tutor.openDrawer());
    on('next', () => { if (s.i < s.qs.length - 1) { s.i++; renderSession(s); } else finish(s); });
    on('reveal', () => { q.given = inp ? inp.value : q.given; q.solShown = true; if (s.mode === 'exam') { q.done = false; } renderSession(s); });
    $$('[data-self]').forEach((b) => b.addEventListener('click', () => {
      q.self = b.dataset.self; q.done = true; q.correct = q.self === 'yes';
      if (q.first === null) q.first = q.correct && q.hintsShown === 0;
      if (s.mode === 'exam') { advanceExam(s); return; }
      q.feedback = { cls: q.correct ? 'ok' : 'info', title: q.correct ? 'Good. Self-assessed as matching the model answer.' : 'Noted. Review the model answer and the rubric, then retry this kind of problem later.' };
      renderSession(s);
    }));
    on('loadmodel', () => { q.given = it.model || ''; renderSession(s); });
    on('check', () => {
      if (it.type === 'code') { checkCode(s, q, false); return; }
      const v = currentValue(q);
      if (isEmpty(q, v)) { q.feedback = { cls: 'info', title: 'Enter an answer first.' }; renderSession(s); return; }
      q.given = v;
      const g = K.grade(it, v);
      if (g.invalid) { q.feedback = { cls: 'info', title: g.needExact ? 'Close. Enter the exact value.' : 'The site could not read that answer.', msg: g.message || '' }; renderSession(s); return; }
      q.attempts++;
      if (q.first === null) q.first = g.correct && q.hintsShown === 0;
      if (g.correct) {
        q.correct = true; q.done = true;
        q.feedback = { cls: 'ok', title: q.first ? pick(['Correct.', 'Right.', 'Exactly.', 'Correct. Nicely done.']) : 'Correct. It will not count toward mastery this time, because ' + (q.hintsShown ? 'you used a hint.' : 'the first try was wrong.') };
      } else {
        if (s.mode === 'quiz') { q.done = true; q.feedback = { cls: 'bad', title: 'Not quite.', msg: g.message || 'Open the solution to see the method.' }; }
        else q.feedback = { cls: 'bad', title: 'Not quite. Try again, use a hint, or open the solution.', msg: g.message || '' };
      }
      renderSession(s);
    });
    on('submit', () => {
      if (it.type === 'code') { checkCode(s, q, true); return; }
      const v = currentValue(q);
      if (isEmpty(q, v)) { q.feedback = { cls: 'info', title: 'Enter an answer, or press Skip.' }; renderSession(s); return; }
      const g = K.grade(it, v);
      if (g.invalid) { q.feedback = { cls: 'info', title: g.needExact ? 'Close. Enter the exact value.' : 'The site could not read that answer.', msg: g.message || '' }; renderSession(s); return; }
      q.given = v; q.correct = g.correct; q.first = g.correct; q.done = true; q.feedback = null;
      advanceExam(s);
    });
    on('skip', () => { q.given = currentValue(q); q.correct = false; q.first = false; q.done = true; q.skipped = true; advanceExam(s); });
  }

  // ---------- Python exercises ----------
  function codeArea(s, q) {
    const it = q.item, C = App.Code;
    const showTests = s.mode !== 'exam' && it.tests && it.tests.trim();
    const testsBlock = showTests ? '<details class="cb-tests"><summary>The tests your code must pass</summary>' + codeBlock(it.tests) + '</details>' : '';
    const io = (it.stdin ? '<div class="faint" style="font-size:var(--s-xs)">This program reads these input lines:</div><pre class="answer-text">' + esc(it.stdin) + '</pre>' : '') +
      (it.stdout != null && s.mode !== 'exam' && !(it.prompt || '').includes(it.stdout.trim()) ? '<details class="cb-tests"><summary>The exact output expected</summary><pre class="answer-text">' + esc(it.stdout) + '</pre></details>' : '');
    const res = s.mode === 'exam' ? '' : (q.result ? C.testsHtml(q.result, it) : '');
    return C.boxHtml({ id: 'cbq', code: q.given, reset: it.starter || '', stdin: it.stdin || '', minRows: 6, label: 'Your code', readOnly: q.done && s.mode !== 'practice', lastRun: q.lastRun }) +
      io + testsBlock + (res ? '<div class="cb-results" aria-live="polite">' + res + '</div>' : '') +
      (q.checking ? '<div class="feedback info"><span>Running the tests…</span></div>' : '');
  }
  function wireCode(s, q) {
    App.Code.wireBox('cbq', { reset: q.item.starter || '', stdin: q.item.stdin || null, onChange: (v) => { q.given = v; }, onRun: (res) => { q.lastRun = res; } });
  }
  function gradeCode(res) {
    if (!res) return { correct: false, title: 'The code could not be checked.' };
    if (res.internal) return { correct: false, invalid: true, title: 'The Python runner had a problem. Press Check again.', msg: (res.tb || '').trim() };
    if (res.result === 'pass') return { correct: true };
    if (res.result === 'timeout') return { correct: false, title: 'Your code ran for more than ' + Math.round(window.ToEPy.limits.check / 1000) + ' seconds and was stopped.', msg: 'Look for a loop that never ends, or one that does far more work than it needs to.' };
    if (res.result === 'error' && !(res.tests || []).length) return { correct: false, title: 'Your code raised an error before the tests could run.', msg: 'Read the error below: the last line says what went wrong and the line above it says where.' };
    const t = res.total ? res.passed + ' of ' + res.total + ' tests passed.' : '';
    return { correct: false, title: 'Not yet. ' + (t || 'The output does not match.'), msg: res.stdout_ok === false && res.stdout_msg ? res.stdout_msg : '' };
  }
  async function checkCode(s, q, exam) {
    const it = q.item;
    if (q.checking) return;
    const code = currentValue(q);
    q.given = code;
    if (!code.trim() || code.trim() === (it.starter || '').trim()) {
      if (exam) { q.feedback = { cls: 'info', title: 'Write your code first, or press Skip.' }; renderSession(s); return; }
      q.feedback = { cls: 'info', title: 'Write your code in the editor first.' }; renderSession(s); return;
    }
    q.checking = true; q.feedback = null; renderSession(s);
    let res;
    try { res = await window.ToEPy.check(it, code); }
    catch (e) { res = { result: 'error', internal: true, out: '', tb: 'Python could not start in this browser: ' + (window.ToEPy.reason || (e && e.message) || e) + '\n' }; }
    q.checking = false;
    if (App.sessions[location.hash.slice(1)] !== s) return;   // the learner moved on while the tests ran
    q.result = res;
    q.lastRun = res.out || (res.tb && !(res.tests || []).length) ? { result: 'ok', out: res.out || '', tb: res.tb || '' } : null;
    const g = gradeCode(res);
    if (g.invalid) { q.feedback = { cls: 'info', title: g.title, msg: g.msg || '' }; renderSession(s); return; }
    if (exam) { q.correct = g.correct; q.first = g.correct; q.done = true; q.feedback = null; advanceExam(s); return; }
    q.attempts++;
    if (q.first === null) q.first = g.correct && q.hintsShown === 0;
    if (g.correct) {
      q.correct = true; q.done = true;
      q.feedback = { cls: 'ok', title: q.first ? pick(['All tests passed.', 'Correct: every test passed.', 'Nicely done: all tests pass.']) : 'All tests passed. It will not count toward mastery this time, because ' + (q.hintsShown ? 'you used a hint.' : 'the first check failed.') };
    } else if (s.mode === 'quiz') {
      q.done = true; q.feedback = { cls: 'bad', title: g.title, msg: g.msg || 'Open the solution to see one way to do it.' };
    } else {
      q.feedback = { cls: 'bad', title: g.title + ' Fix it and check again, use a hint, or open the solution.', msg: g.msg || '' };
    }
    renderSession(s);
  }
  function advanceExam(s) { if (s.i < s.qs.length - 1) { s.i++; renderSession(s); } else finish(s); }

  // ---------- finishing: mastery, error log, results ----------
  function logError(s, q) {
    if (q.first) return;
    const E = Store.elog.entries || (Store.elog.entries = []);
    const existing = E.find((e) => e.key === q.key && e.status !== 'repaired');
    const it = q.item;
    const given = it.type === 'mc' ? (q.given === '' || q.given == null ? '' : it.choices[q.given]) : it.type === 'ms' ? (q.given || []).map((i) => it.choices[i]).join('; ') : it.type === 'self' ? (q.self || '') : (q.given || '');
    const entry = existing || { id: 'e' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), first: '', prereq: '', status: 'open' };
    Object.assign(entry, { ts: Date.now(), code: s.code, lessonId: q.lessonId, key: q.key, kind: s.kind, type: it.type, given: String(given).slice(0, it.type === 'code' ? 4000 : 300), retryAfter: Date.now() + 48 * 3600000 });
    if (!existing) E.unshift(entry);
    while (E.length > 300) {
      let idx = -1;
      for (let k = E.length - 1; k >= 0; k--) if (E[k].status === 'repaired') { idx = k; break; }
      E.splice(idx >= 0 ? idx : E.length - 1, 1);
    }
  }
  // the item an error-log entry refers to: course content by key, or the generator re-run from its seed
  function itemForEntry(e) {
    if (!e.key) return null;
    const m = /^(.*):([pqeg])(\d+)$/.exec(e.key);
    if (!m) return null;
    if (m[2] === 'g') { try { return GEN.make(e.lessonId, +m[3]); } catch (err) { return null; } }
    const C = App.content[e.code]; if (!C) return null;
    if (m[2] === 'e') return C.project && C.project.exam ? C.project.exam[+m[3]] : null;
    const L = C.lessons.find((l) => l.id === m[1]); if (!L) return null;
    return (m[2] === 'p' ? L.practice : L.quiz)[+m[3]] || null;
  }
  App.itemForEntry = itemForEntry;
  function finish(s) {
    clearInterval(App._timer);
    s.finished = true;
    const n = s.qs.length, right = s.qs.filter((q) => q.first).length;
    const score = n ? right / n : 0;
    const changes = [];
    const byLesson = {};
    s.qs.forEach((q) => { (byLesson[q.lessonId] = byLesson[q.lessonId] || []).push(q); });
    if (s.kind === 'practice') {
      const id = s.lessonIds[0], lv = App.level(id);
      let nl = lv;
      if (score === 1) nl = Math.max(lv, 3);
      else if (score >= 0.7) nl = Math.max(lv, 2);
      else if (lv === 0) nl = 1;
      else if (lv >= 2 && score < 0.5) nl = lv - 1;
      changes.push(App.setLevel(id, nl, 'practice', score));
    } else if (s.kind === 'quiz' || s.kind === 'midterm' || s.kind === 'final' || s.kind === 'challenge') {
      const test = s.kind !== 'quiz';
      Object.entries(byLesson).forEach(([id, qs]) => {
        if (id.endsWith('-P')) return;
        const lv = App.level(id), ok = qs.every((q) => q.first);
        let nl;
        if (ok) nl = test ? (lv >= 3 ? 4 : Math.max(lv + 1, 2)) : Math.min(3, Math.max(lv + 1, 2));
        else nl = lv >= 2 ? lv - 1 : 1;
        changes.push(App.setLevel(id, nl, s.kind, null));
      });
      if (s.kind === 'quiz') {
        const k = s.code + '-' + s.unit, prev = Store.data.quizzes[k] || { best: 0, n: 0 };
        Store.data.quizzes[k] = { best: Math.max(prev.best, score), n: prev.n + 1, last: Date.now() };
      } else {
        const k = s.code + '-' + (s.kind === 'midterm' ? 'mid' : s.kind);
        (Store.data.tests[k] = Store.data.tests[k] || []).push({ score: Math.round(score * 1000) / 1000, ts: Date.now(), n });
        if (Store.data.tests[k].length > 20) Store.data.tests[k].shift();
      }
    }
    let logged = 0;
    if (s.kind !== 'diagnostic' && s.kind !== 'ai' && s.kind !== 'retry') s.qs.forEach((q) => { if (!q.first) { logError(s, q); logged++; } });
    if (s.kind === 'retry' && s.entry) {
      const q = s.qs[0];
      if (q.first) { s.entry.status = 'repaired'; s.entry.repairedAt = Date.now(); }
      else s.entry.retryAfter = Date.now() + 48 * 3600000;
      logged = 0;
    }
    if (s.kind === 'diagnostic' && s.onFinish) s.onFinish(s);
    if (s.kind !== 'ai') App.markDay();
    s.results = { score, right, n, changes: changes.filter((c) => c.before !== c.after), logged };
    Store.touch('progress');
    if (logged || s.kind === 'retry') Store.touch('errorlog');
    renderResults(s);
  }

  function renderResults(s) {
    const r = s.results;
    const c = COURSES.get(s.code);
    if (s.kind === 'diagnostic' && s.renderResults) return s.renderResults(s);
    const pct = Math.round(r.score * 100);
    const headline = s.kind === 'practice' ? (pct === 100 ? 'Every question right first time.' : pct >= 70 ? 'Solid. A few to tighten up.' : 'Worth another round after reviewing the lesson.')
      : s.kind === 'retry' ? (r.right ? 'Repaired. That error is closed.' : 'Not yet. Try a parallel problem again in two days.')
      : (pct >= 85 ? 'At the 85% mastery mark.' : 'Below the 85% mark. Repair the misses, then retake.');
    const changes = r.changes.length ? '<div class="levelup">' + r.changes.map((ch) => '<span class="row" style="gap:6px">' + App.sq(ch.after) + '<b>Week ' + (+ch.id.split('-')[1]) + '</b> ' + App.LEVELS[ch.before] + ' → ' + App.LEVELS[ch.after] + '</span>').join('') + '</div>' : '';
    let again = '';
    if (s.kind === 'practice') {
      const w = +s.lessonIds[0].split('-')[1];
      again = '<button class="btn btn-primary" id="again">Practice again</button>' + (w < 12 ? '<a class="btn" href="#lesson-' + hashCode(s.code) + '-' + pad2(w + 1) + '">Next lesson</a>' : '<a class="btn" href="#project-' + hashCode(s.code) + '">Course project</a>');
    } else if (s.kind !== 'retry' && s.kind !== 'ai') again = '<button class="btn btn-primary" id="again">Take a new version</button>';
    const review = s.qs.map((q, k) => {
      const mk = q.item.type === 'self' ? (q.self === 'yes' ? 'ok' : q.self ? 'bad' : 'self') : (q.first ? 'ok' : 'bad');
      return '<details class="review-item"' + (!q.first && s.mode === 'exam' ? ' open' : '') + '><summary><span class="mark ' + mk + '">' + (mk === 'ok' ? '✓' : mk === 'bad' ? '✗' : '–') + '</span><span class="tnum">Question ' + (k + 1) + '</span>' +
        (q.first ? '' : q.skipped ? '<span class="chip">Skipped</span>' : (q.hintsShown || q.solShown) && s.mode === 'practice' ? '<span class="chip">Used help</span>' : '') + '</summary><div class="rb">' +
        '<div>' + md(q.item.prompt) + '</div><div class="faint" style="font-family:var(--f-ui);font-size:var(--s-xs)">Your answer: ' + givenHtml(q) + '</div>' +
        '<div class="faint" style="font-family:var(--f-ui);font-size:var(--s-xs)">Correct answer: ' + correctHtml(q.item) + '</div>' +
        '<div class="solution"><span class="lab">' + (q.item.type === 'self' ? 'Model answer' : 'Solution') + '</span><div>' + md(q.item.solution) + '</div></div></div></details>';
    }).join('');
    App.mount('<div class="wrap"><div class="ex-wrap"><div class="crumbs" style="padding-top:0"><a href="' + s.back + '">← ' + esc(s.code ? s.code + ' ' + c.title : 'Back') + '</a></div>' +
      '<div class="ex-card results"><span class="eyebrow">' + esc(s.title.replace(/\$[^$]*\$/g, '…')) + '</span><div class="row" style="align-items:flex-end;gap:16px"><span class="score-big">' + pct + '%</span><span class="muted tnum">' + r.right + ' of ' + r.n + ' right first time</span></div>' +
      '<p style="font-size:var(--s-md);font-weight:700">' + esc(headline) + '</p>' + changes +
      (r.logged ? '<p class="muted">' + r.logged + ' question' + (r.logged > 1 ? 's went' : ' went') + ' into your <a href="#errors">error log</a>. Fill in the first incorrect step and retry a parallel problem in 48 hours.</p>' : '') +
      (s.mode === 'exam' && s.kind !== 'diagnostic' ? '<p class="faint" style="font-size:var(--s-xs)">The study method asks for about 85% on two different cumulative assessments, with sound reasoning, before you treat a course as mastered.</p>' : '') +
      '<div class="row">' + again + '<a class="btn btn-quiet" href="' + s.back + '">Done</a></div></div>' +
      '<h2 style="font-size:var(--s-lg);margin-top:8px">Review</h2><div class="stack">' + review + '</div></div></div>');
    const ag = $('#again');
    if (ag) ag.addEventListener('click', () => { delete App.sessions[location.hash.slice(1)]; App.render(); });
  }
  App.renderSession = renderSession;

  // ---------- routes ----------
  async function withContent(code, fn) {
    App.mount('<div class="wrap"><div class="loading">Loading…</div></div>');
    let content;
    try { content = await App.loadCourse(code); } catch (e) {
      App.mount('<div class="wrap"><div class="empty" style="margin-top:24px">This course\'s practice could not be loaded. Check your connection and reload the page.</div></div>'); return;
    }
    fn(content);
  }
  function runRoute(key, build) {
    let s = App.sessions[key];
    if (!s) { s = build(); if (!s) return; App.sessions[key] = s; }
    renderSession(s);
  }
  App.route(/^practice-([a-z0-9]+)-(\d\d)$/, (m) => {
    const code = App.codeOf(m[1]), w = +m[2]; if (!code || w < 1 || w > 12) return App.go('courses');
    withContent(code, (content) => {
      if (!App.lessonAt(content, w)) { App.go('lesson-' + hashCode(code) + '-' + pad2(w)); return; }
      runRoute(m[0], () => practiceSession(code, w, content));
    });
  }, 'courses');
  App.route(/^quiz-([a-z0-9]+)-([1-6])$/, (m) => {
    const code = App.codeOf(m[1]); if (!code) return App.go('courses');
    withContent(code, (content) => runRoute(m[0], () => quizSession(code, +m[2], content)));
  }, 'courses');
  App.route(/^(midterm|final|challenge)-([a-z0-9]+)$/, (m) => {
    const code = App.codeOf(m[2]); if (!code) return App.go('courses');
    const kind = m[1] === 'midterm' ? 'mid' : m[1];
    withContent(code, (content) => {
      if (App.sessions[m[0]]) return renderSession(App.sessions[m[0]]);
      const c = COURSES.get(code);
      const title = { mid: 'Midterm', final: 'Cumulative final', challenge: 'Course challenge' }[kind];
      const desc = { mid: 'Weeks 1–6. Closed book, about ' + Math.round(c.finalMinutes / 2) + ' minutes. Unseen questions.', final: 'All twelve weeks plus cumulative problems. Closed book, ' + c.finalMinutes + ' minutes, as the syllabus requires.', challenge: 'One question from every week. Pass at 85% to show what you know; take it 1–2 weeks after the final as your second cumulative assessment.' }[kind];
      App.mount('<div class="wrap"><div class="ex-wrap"><div class="crumbs" style="padding-top:0"><a href="#course-' + hashCode(code) + '">← ' + code + ' ' + esc(c.title) + '</a></div><div class="ex-card"><span class="eyebrow">' + code + ' · ' + title + '</span><h1 style="font-size:var(--s-xl)">' + esc(title) + '</h1><p class="muted">' + esc(desc) + '</p>' +
        '<ul class="checklist"><li><span class="tick"></span><span>Scrap paper, a pencil' + (c.level === 'college' || c.level === 'professional' ? ', a calculator for numerical questions' : '') + ' and a quiet ' + (kind === 'challenge' ? 'half hour' : 'block of time') + '.</span></li><li><span class="tick"></span><span>No notes, answer key, documentation or AI. The tutor is switched off.</span></li><li><span class="tick"></span><span>Work every problem fully before you enter the answer. In Python questions you may run your code as often as you like before you submit it.</span></li></ul>' +
        '<div class="row"><button class="btn btn-primary" id="begin">Begin</button><a class="btn btn-quiet" href="#course-' + hashCode(code) + '">Not now</a></div></div></div></div>');
      $('#begin').addEventListener('click', () => runRoute(m[0], () => examSession(code, kind, content)));
    });
  }, 'courses');

  // tutor-made practice
  App.startAiPractice = function (code, w, items) {
    const key = 'ai-' + hashCode(code) + '-' + pad2(w);
    const id = lessonId(code, w);
    App.sessions[key] = makeSession({ kind: 'ai', mode: 'practice', code, lessonIds: [id], title: 'Tutor-made practice', notice: 'These problems were written by the tutor just now and were not checked by the site. If an answer looks wrong, say so to the tutor.', back: '#lesson-' + hashCode(code) + '-' + pad2(w), items: items.map((it, i) => ({ item: it, key: id + ':ai' + Date.now() + i, lessonId: id, ai: true })) });
    App.go(key);
  };
  App.route(/^ai-([a-z0-9]+)-(\d\d)$/, (m) => {
    const s = App.sessions[m[0]];
    if (!s) return App.go('lesson-' + m[1] + '-' + m[2]);
    withContent(s.code, () => renderSession(s));
  }, 'courses');

  // ---------- error log ----------
  let elTab = 'due';
  App.route(/^errors$/, async () => {
    const E = Store.elog.entries || [];
    const need = Array.from(new Set(E.filter((e) => e.type !== 'manual').map((e) => e.code))).filter((c) => !App.content[c]);
    if (need.length) { App.mount('<div class="wrap"><div class="loading">Loading your error log…</div></div>'); await Promise.all(need.map((c) => App.loadCourse(c).catch(() => null))); if (location.hash !== '#errors') return; }
    const now = Date.now();
    const groups = { due: E.filter((e) => e.status !== 'repaired' && e.retryAfter <= now), open: E.filter((e) => e.status !== 'repaired'), repaired: E.filter((e) => e.status === 'repaired'), all: E };
    if (elTab === 'due' && !groups.due.length && groups.open.length) elTab = 'open';
    const list = groups[elTab];
    const courseOpts = App.CAT.courses.map((c) => '<option value="' + c.code + '">' + c.code + ' ' + esc(c.title) + '</option>').join('');
    App.mount('<div class="wrap"><div class="section"><span class="eyebrow">Repair work</span><h1 style="font-size:var(--s-2xl);letter-spacing:-0.02em">Error log</h1>' +
      '<p class="muted" style="max-width:70ch">Every question you miss lands here. For each one, record the first incorrect step and the missing prerequisite, study the corrected solution, and solve a new parallel problem 48 hours later. That delayed retry is what turns a mistake into a skill.</p>' +
      '<div class="tabs" role="group" aria-label="Filter">' + [['due', 'Ready to retry'], ['open', 'Open'], ['repaired', 'Repaired'], ['all', 'All']].map(([k, l]) => '<button aria-pressed="' + (elTab === k) + '" data-tab="' + k + '">' + l + ' <span class="tnum">' + groups[k].length + '</span></button>').join('') + '</div>' +
      '<div class="elog">' + (list.length ? list.slice(0, 120).map(entryHtml).join('') : '<div class="empty">' + (E.length ? 'Nothing in this view.' : 'No errors logged yet. Misses from practice, quizzes and tests will appear here automatically.') + '</div>') + '</div>' +
      '<details class="panel"><summary style="cursor:pointer;font-weight:700">Log an error from your own paper work</summary><form id="manual" class="stack" style="margin-top:12px"><div class="efields">' +
      '<label for="m-course">Course<select id="m-course" class="ans-input" style="min-height:38px;font-family:var(--f-ui)">' + courseOpts + '</select></label>' +
      '<label for="m-prob">Problem (source and number, or the problem itself)<input id="m-prob" required></label>' +
      '<label for="m-first">First incorrect step<input id="m-first"></label><label for="m-pre">Missing prerequisite<input id="m-pre"></label>' +
      '<label for="m-fix">Corrected solution, briefly<input id="m-fix"></label></div><div class="row"><button class="btn btn-primary" type="submit">Add to the log</button></div></form></details></div></div>');
    $$('[data-tab]').forEach((b) => b.addEventListener('click', () => { elTab = b.dataset.tab; App.render(); }));
    $$('[data-efield]').forEach((inp) => {
      let t;
      inp.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { const e = E.find((x) => x.id === inp.dataset.id); if (e) { e[inp.dataset.efield] = inp.value.slice(0, 500); Store.touch('errorlog'); } }, 700); });
    });
    $$('[data-retry]').forEach((b) => b.addEventListener('click', () => startRetry(b.dataset.retry)));
    $$('[data-repaired]').forEach((b) => b.addEventListener('click', () => { const e = E.find((x) => x.id === b.dataset.repaired); if (e) { e.status = 'repaired'; e.repairedAt = Date.now(); Store.touch('errorlog'); App.render(); } }));
    $$('[data-reopen]').forEach((b) => b.addEventListener('click', () => { const e = E.find((x) => x.id === b.dataset.reopen); if (e) { e.status = 'open'; e.retryAfter = Date.now(); Store.touch('errorlog'); App.render(); } }));
    $('#manual').addEventListener('submit', (ev) => {
      ev.preventDefault();
      const code = $('#m-course').value;
      E.unshift({ id: 'e' + Date.now().toString(36), ts: Date.now(), code, lessonId: null, key: null, kind: 'manual', type: 'manual', prompt: $('#m-prob').value.slice(0, 500),
        given: '', solution: $('#m-fix').value.slice(0, 500), first: $('#m-first').value.slice(0, 500), prereq: $('#m-pre').value.slice(0, 500), status: 'open', retryAfter: Date.now() + 48 * 3600000 });
      Store.touch('errorlog'); elTab = 'open'; App.toast('Added to the error log'); App.render();
    });
  }, 'errors');

  function entryHtml(e) {
    const now = Date.now(), due = e.status !== 'repaired' && e.retryAfter <= now;
    const w = e.lessonId && /-\d\d$/.test(e.lessonId) ? +e.lessonId.split('-')[1] : null;
    const manual = e.type === 'manual';
    const it = manual ? null : itemForEntry(e);
    const typed = it && (it.type === 'num' || it.type === 'expr' || it.type === 'list' || it.type === 'tuple');
    const giv = typed && e.given ? K.preview(e.given, it) : null;
    let problem, answerLine = '', solution = '';
    if (manual) { problem = esc(e.prompt || ''); solution = e.solution ? esc(e.solution) : ''; }
    else if (it) {
      problem = md(it.prompt);
      if (it.type === 'code') answerLine = '<details><summary style="cursor:pointer;font-size:var(--s-xs);font-weight:700;color:var(--accent)">Your code</summary>' + (e.given ? codeBlock(e.given) : '<em>blank</em>') + '</details>';
      else answerLine = '<div class="row" style="font-size:var(--s-xs)"><span class="faint">You answered:</span><span>' + (giv ? tex(giv) : e.given ? (it.type === 'mc' || it.type === 'ms' ? mdi(e.given) : it.type === 'text' ? textBlock(e.given) : esc(e.given)) : '<em>blank</em>') + '</span><span class="faint">Correct:</span><span>' + correctHtml(it) + '</span></div>';
      if (it.type === 'code') solution = md(it.solution) + '<span class="lab">Model solution</span>' + codeBlock(it.model);
      else
      solution = md(it.solution);
    } else problem = '<em>This problem is no longer available.</em>';
    return '<div class="eitem' + (due ? ' due' : '') + '"><div class="row"><a class="code-tag" href="#course-' + hashCode(e.code) + '">' + e.code + '</a>' +
      (w ? '<a href="#lesson-' + hashCode(e.code) + '-' + pad2(w) + '" style="font-size:var(--s-xs)">Week ' + w + '</a>' : '') + '<span class="faint" style="font-size:var(--s-xs)">' + App.fmtDate(e.ts) + ' · ' + esc({ practice: 'practice', quiz: 'quiz', midterm: 'midterm', final: 'final', challenge: 'course challenge', retry: 'retry', manual: 'your own work' }[e.kind] || e.kind) + '</span><span class="spacer"></span>' +
      (e.status === 'repaired' ? '<span class="chip" style="background:var(--ok-soft);color:var(--ok)">Repaired ' + App.fmtDate(e.repairedAt || e.ts) + '</span>' : due ? '<span class="chip" style="background:var(--warm-soft);color:var(--warm)">Ready to retry</span>' : '<span class="chip">Retry ' + App.fmtWhen(e.retryAfter) + '</span>') + '</div>' +
      '<div class="eprob">' + problem + '</div>' + answerLine +
      '<div class="efields"><label for="f1-' + e.id + '">First incorrect step<input id="f1-' + e.id + '" data-efield="first" data-id="' + e.id + '" value="' + esc(e.first || '') + '" placeholder="Where did the work first go wrong?"></label>' +
      '<label for="f2-' + e.id + '">Missing prerequisite<input id="f2-' + e.id + '" data-efield="prereq" data-id="' + e.id + '" value="' + esc(e.prereq || '') + '" placeholder="What did you need to know?"></label></div>' +
      (solution ? '<details><summary style="cursor:pointer;font-size:var(--s-xs);font-weight:700;color:var(--accent)">Corrected solution</summary><div class="solution" style="margin-top:8px">' + solution + '</div></details>' : '') +
      '<div class="row">' + (e.status === 'repaired' ? '<button class="btn btn-sm btn-quiet" data-reopen="' + e.id + '">Reopen</button>' :
        (manual || !it ? '<button class="btn btn-sm" data-repaired="' + e.id + '">I solved a parallel problem</button>' :
          '<button class="btn btn-sm' + (due ? ' btn-primary' : '') + '" data-retry="' + e.id + '">' + (due ? 'Retry a parallel problem' : 'Retry early') + '</button>')) + '</div></div>';
  }

  async function startRetry(id) {
    const e = (Store.elog.entries || []).find((x) => x.id === id); if (!e) return;
    let content; try { content = await App.loadCourse(e.code); } catch (err) { App.toast('Could not load that course'); return; }
    let x = null;
    if (e.lessonId && GEN.has(e.lessonId)) x = genItem(e.lessonId);
    if (!x) {
      let pool = [];
      if (e.lessonId && e.lessonId.endsWith('-P')) pool = (content.project.exam || []).map((it, i) => ({ item: it, key: e.code + '-P:e' + i, lessonId: e.lessonId }));
      else { const L = content.lessons.find((l) => l.id === e.lessonId); if (L) pool = itemsFrom(L, 'practice').concat(itemsFrom(L, 'quiz')); }
      const others = pool.filter((p) => p.key !== e.key);
      x = pick(others.length ? others : pool);
    }
    if (!x) { App.toast('No parallel problem is available for this one'); return; }
    const key = 'retry-' + id;
    App.sessions[key] = makeSession({ kind: 'retry', mode: 'practice', code: e.code, lessonIds: [e.lessonId], title: 'Parallel problem', entry: e, back: '#errors', items: [x] });
    App.go(key);
  }
  App.route(/^retry-([a-z0-9]+)$/, (m) => {
    const s = App.sessions[m[0]]; if (!s) return App.go('errors');
    withContent(s.code, () => renderSession(s));
  }, 'errors');

  // ---------- starting point: choose a stage, test out with course challenges ----------
  const STARTS = [
    { key: 'K', who: 'Children starting school, ages about 5 to 11, with a grown-up.', begin: ['K1', 'K4', 'K7'], also: ['K9', 'K10', 'K11'],
      note: 'Start math, reading and science together, 15–30 minutes a day. Add computational thinking (K10) any time, and first Python programs (K11) once reading and arithmetic are comfortable, around grade 4.' },
    { key: 'J', who: 'Grades 6 to 8, or anyone who finished elementary math and reading.', begin: ['J1', 'J4', 'J9'], also: ['J5', 'J6', 'J7', 'J8', 'J10'],
      note: 'Take one math, one English, one programming and one or two science or history courses at a time.' },
    { key: 'H', who: 'Grades 9 to 12, or adults rebuilding high-school foundations.', begin: ['H1', 'H14', 'H10'], also: ['H2', 'H4', 'H5', 'H6', 'H9', 'H15'],
      note: 'Algebra and programming first; precalculus, calculus and statistics follow as the math allows, because machine learning leans on all three.' },
    { key: 'C', who: 'College students and career changers studying AI and machine learning.', begin: ['C1', 'C2', 'C3'], also: ['C4', 'C6', 'C7', 'C8', 'C10'],
      note: 'Start with programming, discrete math and the developer tools, with calculus, linear algebra and probability alongside. The machine learning survey (C10) opens the ML courses; deep learning (C17) opens language, vision and reinforcement learning.' },
    { key: 'P', who: 'Graduates preparing for research in machine learning, and early PhD students.', begin: ['P1', 'P5'], also: ['P2', 'P3', 'P4', 'P6'],
      note: 'Take one or two courses at a time and keep a research notebook. Read papers every week, and leave the apprenticeship and qualifying exams (P6) for last.' },
  ];
  App.route(/^start$/, () => {
    const chips = (arr) => arr.map((c) => App.codeTag(c) + ' <span class="faint">' + esc(COURSES.get(c).title) + '</span>').join('<br>');
    const challenge = (arr) => arr.map((c) => '<a class="btn btn-sm" href="#challenge-' + hashCode(c) + '">Test out of ' + c + '</a>').join(' ');
    App.mount('<div class="wrap"><div class="section"><span class="eyebrow">Starting point</span><h1 class="lesson-title">Where are you now?</h1>' +
      '<p class="lesson-summary">Pick the stage that matches you. If you think you already know a course, take its course challenge: one unseen question from every week, solved without hints. About 85% means you can move on; anything less shows exactly which weeks to study.</p></div>' +
      '<div class="grid" style="margin-top:12px">' + STARTS.map((st) => {
        const g = App.GROUPS.get(st.key);
        return '<div class="panel stack" style="gap:10px"><span class="eyebrow">' + esc(g.name) + '</span><p>' + esc(st.who) + '</p>' +
          '<div class="stack" style="gap:4px"><b>Begin with</b><div style="font-size:var(--s-sm)">' + chips(st.begin) + '</div></div>' +
          (st.also.length ? '<div class="stack" style="gap:4px"><b>Then, or alongside</b><div style="font-size:var(--s-sm)">' + chips(st.also) + '</div></div>' : '') +
          '<p class="faint" style="font-size:var(--s-xs)">' + esc(st.note) + '</p>' +
          '<div class="row"><a class="btn btn-primary btn-sm" href="#course-' + hashCode(st.begin[0]) + '">Open ' + st.begin[0] + '</a>' + challenge(st.begin.slice(0, 2)) + '</div></div>';
      }).join('') + '</div>' +
      '<p class="muted" style="margin-top:18px;max-width:70ch">Not sure? Start one stage lower than you think and test out quickly. Gaps in early math and reading are the most common reason later courses feel hard.</p></div>');
  }, 'start');
})();
