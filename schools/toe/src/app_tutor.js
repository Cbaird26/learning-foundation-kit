/* ToE Learning Foundation — the tutor: a Claude-powered study helper that knows the current lesson or problem.
   It is switched off during quizzes, tests and the placement check. */
(function () {
  'use strict';
  const App = window.ToEApp;
  const { COURSES, esc, $, $$, md, K } = App;

  const RULES = [
    'You are the tutor inside the ToE Learning Foundation, a self-paced curriculum that runs from algebra to graduate theoretical physics.',
    'Teach like a patient, rigorous human tutor. Ask what the learner tried when that helps. Find the first incorrect step in their work. Give one hint at a time, then let them try. Use small concrete examples. When you explain, end with one short question that checks understanding.',
    'For a practice problem, do not give the final answer or a full solution unless the learner has already revealed the solution or explicitly asks for it after trying. Point them to the next step instead.',
    'Be accurate. If you are unsure of a fact, say so and point to the course reading. Remind the learner, when it matters, that agreement with an AI is not proof: check against the text or a worked solution.',
    'Format: short paragraphs, math in TeX inside $...$ or $$...$$, no tables unless asked. Keep replies under about 180 words unless the learner asks for more.',
  ].join('\n');

  function courseLine(code) { const c = COURSES.get(code); return c ? 'Course: ' + code + ' ' + c.title + ' (' + App.GROUPS.get(c.group).name + '). Purpose: ' + c.purpose : ''; }
  function strip(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n) + '…' : s; }
  function contextText(ctx) {
    if (!ctx) {
      const cur = App.currentCourse();
      return 'The learner is browsing the site, not working on a specific problem.' + (cur ? ' Their current course is ' + cur + ' ' + COURSES.get(cur).title + '.' : ' They have not started a course yet.') +
        '\nCourses: ' + App.CAT.courses.map((c) => c.code + ' ' + c.title).join('; ') + '.';
    }
    const L = ctx.lesson;
    const parts = [courseLine(ctx.code)];
    if (L) {
      parts.push('Lesson: week ' + L.week + ', "' + L.title + '". ' + (L.summary || ''));
      if (L.objectives) parts.push('Objectives: ' + L.objectives.join(' | '));
    }
    if (ctx.kind === 'lesson' && L) parts.push('Lesson text (excerpt):\n' + strip(L.article, 2500));
    if (ctx.kind === 'project' && ctx.project) {
      const P = ctx.project;
      parts.push('The learner is working on the course project "' + P.title + '". ' + P.overview + '\nSteps: ' + P.steps.join(' | ') + '\nDeliverables: ' + P.deliverables.join(' | ') + '\nRubric: ' + P.rubric.join(' | '));
    }
    if (ctx.kind === 'question' && ctx.q) {
      const q = ctx.q, it = q.item;
      parts.push('Current practice problem: ' + it.prompt);
      if (it.type === 'mc' || it.type === 'ms') parts.push('Choices as the learner sees them: ' + (q.order || it.choices.map((_, i) => i)).map((ci, k) => String.fromCharCode(65 + k) + ') ' + it.choices[ci]).join('  '));
      const given = it.type === 'mc' ? (q.given === '' ? '' : it.choices[q.given]) : it.type === 'ms' ? (q.given || []).map((i) => it.choices[i]).join('; ') : q.given;
      parts.push('Learner\'s latest answer: ' + (given ? given : '(none yet)') + '. Checked ' + q.attempts + ' time(s)' + (q.done ? (q.correct ? ', now correct' : '') : '') + '.');
      if (q.hintsShown) parts.push('Hints the learner has already seen: ' + it.hints.slice(0, q.hintsShown).join(' | '));
      const ans = it.type === 'mc' ? it.choices[it.answer] : it.type === 'ms' ? (it.answer || []).map((i) => it.choices[i]).join('; ') : it.answer;
      parts.push('[Tutor reference only] Correct answer: ' + (ans || '(model answer below)') + '. Worked solution: ' + strip(it.solution, 2000));
      parts.push(q.solShown || q.done ? 'The learner has seen the result of this problem, so you may discuss the solution openly.' : 'The learner has NOT seen the solution. Do not reveal the answer; guide them.');
    }
    return parts.filter(Boolean).join('\n');
  }
  function quickFor(ctx) {
    if (!ctx) return ['What should I study next?', 'How do I use this site well?', 'Explain the study method in brief'];
    if (ctx.kind === 'question') return ['Give me a hint', 'Where did my work go wrong?', 'Explain the idea behind this problem', 'Show me a similar worked example'];
    if (ctx.kind === 'lesson') return ['Explain this lesson another way', 'Ask me one question to check I understand', 'How is this used in physics?', '__practice__'];
    if (ctx.kind === 'project') return ['Help me plan the first step', 'What would a strong submission include?', 'Review my plan'];
    return [];
  }
  const ERR = {
    not_granted: 'The tutor needs your permission to use Claude, and it was declined, so it is off for this visit.',
    sampling_disabled: 'Claude is not available for this account, so the tutor is off.',
    not_declared: 'The tutor is not available on this page.',
    capability_disabled: 'The tutor is not available in this view.',
    capability_removed: 'The tutor is not available in this view.',
    rate_limited: 'Too many requests right now. Wait a minute, then try again.',
    session_expired: 'Sign in to Claude again to use the tutor.',
    refused: 'The tutor could not answer that. Try asking it a different way.',
    empty_completion: 'The tutor returned nothing. Try a shorter question.',
    image_rejected: 'That image could not be used. Try a JPEG or PNG photo under 20 MB.',
    images_unavailable: 'Photos cannot be sent from this view.',
    prompt_too_large: 'That was too long to send. Try a shorter message.',
    invalid_json: 'The tutor\'s problems came back in the wrong shape. Try again.',
    upstream_error: 'The connection dropped. Try again.',
  };
  const PERMANENT = new Set(['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed']);

  const Tutor = (App.Tutor = {
    sample: null, ready: false, off: false, imagesOk: false, mediaTypes: [], ctx: null, key: 'general', threads: new Map(), busy: false, ctl: null, file: null, openState: false,
    async init() {
      this.wire();
      this.refresh();
      if (!window.claude || typeof window.claude.use !== 'function') { this.ready = true; this.refresh(); return; }
      try { this.sample = await window.claude.use('sample'); } catch (e) { this.sample = null; }
      if (this.sample) {
        try { const lim = await this.sample.limits(); this.imagesOk = !!(lim && lim.images); this.mediaTypes = (lim && lim.images && lim.images.mediaTypes) || []; } catch (e) { this.imagesOk = false; }
      }
      this.ready = true;
      this.refresh();
    },
    wire() {
      $('#drawer').inert = true;
      $('#tutor-btn').addEventListener('click', () => (this.openState ? this.closeDrawer() : this.openDrawer()));
      $('#t-close').addEventListener('click', () => this.closeDrawer());
      $('#scrim').addEventListener('click', () => this.closeDrawer());
      $('#t-new').addEventListener('click', () => { this.threads.set(this.key, []); this.refresh(); });
      $('#t-form').addEventListener('submit', (e) => { e.preventDefault(); this.send($('#t-in').value); });
      $('#t-in').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.send($('#t-in').value); } });
      $('#t-stop').addEventListener('click', () => this.ctl && this.ctl.abort());
      $('#t-file').addEventListener('change', (e) => { this.file = e.target.files && e.target.files[0] || null; this.refreshAttach(); });
      $('#t-copy').addEventListener('click', () => this.copyPrompt());
      $('#t-file-clear').addEventListener('click', () => { this.file = null; $('#t-file').value = ''; this.refreshAttach(); });
      document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && this.openState) this.closeDrawer(); });
    },
    setContext(ctx) {
      this.ctx = ctx;
      let key = 'general';
      if (ctx && ctx.kind === 'lesson') key = 'lesson:' + ctx.lesson.id;
      else if (ctx && ctx.kind === 'question') key = 'q:' + ctx.q.key;
      else if (ctx && ctx.kind === 'project') key = 'project:' + ctx.code;
      else if (ctx && ctx.kind === 'locked') key = 'locked';
      this.key = key;
      if (!this.threads.has(key)) this.threads.set(key, []);
      this.refresh();
    },
    openDrawer() {
      this.openState = true;
      $('#drawer').classList.add('open'); $('#drawer').setAttribute('aria-hidden', 'false'); $('#drawer').inert = false; $('#scrim').classList.add('on');
      $('#tutor-btn').setAttribute('aria-expanded', 'true');
      this.refresh();
      const inp = $('#t-in'); if (inp && !inp.disabled) setTimeout(() => inp.focus(), 60);
    },
    closeDrawer() {
      this.openState = false;
      $('#drawer').classList.remove('open'); $('#drawer').setAttribute('aria-hidden', 'true'); $('#drawer').inert = true; $('#scrim').classList.remove('on');
      $('#tutor-btn').setAttribute('aria-expanded', 'false');
    },
    available() { return !!this.sample && !this.off; },
    refreshAttach() {
      const lab = $('#t-file-name');
      lab.textContent = this.file ? this.file.name : '';
      $('#t-file-clear').hidden = !this.file;
    },
    refresh() {
      const ctx = this.ctx, locked = ctx && ctx.kind === 'locked';
      const ctxEl = $('#t-ctx');
      if (locked) ctxEl.textContent = 'Off during quizzes, tests and the placement check.';
      else if (ctx && ctx.kind === 'question') ctxEl.innerHTML = 'Helping with this problem' + (ctx.lesson ? ' · ' + esc(ctx.code) + ' week ' + ctx.lesson.week : '') + '. It knows the solution but will guide rather than tell.';
      else if (ctx && ctx.kind === 'lesson') ctxEl.innerHTML = 'Helping with ' + esc(ctx.code) + ' week ' + ctx.lesson.week + ': ' + esc(ctx.lesson.title.replace(/\$[^$]*\$/g, '…')) + '.';
      else if (ctx && ctx.kind === 'project') ctxEl.innerHTML = 'Helping with the ' + esc(ctx.code) + ' project.';
      else ctxEl.textContent = 'General study help.';
      const msgs = $('#t-msgs');
      const turns = this.threads.get(this.key) || [];
      if (locked) {
        msgs.innerHTML = '<div class="notice">The tutor is switched off during quizzes, tests and the placement check. The study method keeps assessments free of AI so that your scores show what you can do on your own. It will be back when you finish.</div>';
      } else if (!this.ready) {
        msgs.innerHTML = '<div class="thinking">Connecting…</div>';
      } else if (!this.available()) {
        msgs.innerHTML = '<div class="notice">' + (this.off ? esc(this.offMsg || 'The tutor is off for this visit.') : 'The tutor runs on Claude, which is not available in this view.') + ' You can still get help: copy a prompt that includes this ' + (ctx && ctx.kind === 'question' ? 'problem' : 'lesson') + ' and paste it into a chat with Claude.</div>';
      } else if (!turns.length) {
        msgs.innerHTML = '<div class="msg-a"><p>' + (ctx && ctx.kind === 'question' ? 'Stuck? Tell me what you tried, or type your working, and I will find the first step that went wrong. You can also send a photo of your paper work.' : ctx && ctx.kind === 'lesson' ? 'Ask me anything about this lesson: a different explanation, an extra example, or a quick check of your understanding.' : 'Ask about the curriculum, the study method, or any topic you are working on.') + '</p></div>';
      } else {
        msgs.innerHTML = turns.map((t) => t.role === 'user' ? '<div class="msg-u">' + esc(t.content) + (t.img ? '\n[photo: ' + esc(t.img) + ']' : '') + '</div>' : '<div class="msg-a">' + md(t.content) + '</div>').join('');
        msgs.scrollTop = msgs.scrollHeight;
      }
      const quick = $('#t-quick');
      quick.innerHTML = (!locked && this.available() && !this.busy) ? quickFor(ctx).map((q) => q === '__practice__' ? '<button class="btn btn-sm" data-q="__practice__">Make me 3 new practice problems</button>' : '<button class="btn btn-sm" data-q="' + esc(q) + '">' + esc(q) + '</button>').join('') : '';
      $$('[data-q]', quick).forEach((b) => b.addEventListener('click', () => b.dataset.q === '__practice__' ? this.makePractice() : this.send(b.dataset.q)));
      const usable = !locked && this.available();
      $('#t-in').disabled = !usable || this.busy;
      $('#t-send').disabled = !usable || this.busy;
      $('#t-send').hidden = this.busy;
      $('#t-stop').hidden = !this.busy;
      $('#t-attach').hidden = !(usable && this.imagesOk);
      if (this.imagesOk) $('#t-file').setAttribute('accept', this.mediaTypes.join(','));
      $('#t-copy').hidden = locked || this.available() || !this.ready;
      $('#t-new').hidden = !usable || !turns.length;
      this.refreshAttach();
    },
    async send(text) {
      text = String(text || '').trim();
      if (!text || this.busy || !this.available()) return;
      if (this.ctx && this.ctx.kind === 'locked') return;
      const key = this.key;
      const turns = this.threads.get(key) || [];
      const file = this.file;
      turns.push({ role: 'user', content: text, img: file ? file.name : null });
      this.threads.set(key, turns);
      $('#t-in').value = '';
      this.file = null; $('#t-file').value = '';
      this.busy = true;
      this.refresh();
      const msgs = $('#t-msgs');
      const bubble = document.createElement('div'); bubble.className = 'msg-a'; bubble.innerHTML = '<span class="thinking">Thinking…</span>';
      msgs.appendChild(bubble); msgs.scrollTop = msgs.scrollHeight;
      const head = { role: 'user', content: RULES + '\n\n' + contextText(this.ctx) + '\n\n(The conversation with the learner follows.)' };
      const recent = turns.slice(-14).map((t) => ({ role: t.role, content: t.content + (t.img ? '\n[I attached a photo of my handwritten work for this. Read it carefully and identify the first incorrect step, if any.]' : '') }));
      const input = [head].concat(recent);
      this.ctl = new AbortController();
      const opts = { cache: false, signal: this.ctl.signal, onText: ({ text }) => { if (this.key === key) { bubble.innerHTML = md(text); msgs.scrollTop = msgs.scrollHeight; } } };
      if (file) opts.images = [file];
      try {
        const res = await this.sample(input, opts);
        turns.push({ role: 'assistant', content: res.text + (res.truncated ? '\n\n*(Reply cut short. Ask for the rest.)*' : '') });
      } catch (e) {
        const code = e && e.code;
        if (e && e.text) turns.push({ role: 'assistant', content: e.text + '\n\n*(Interrupted.)*' });
        if (code && code !== 'cancelled') {
          if (PERMANENT.has(code)) { this.off = true; this.offMsg = ERR[code]; }
          if (code === 'images_unavailable') this.imagesOk = false;
          App.toast(ERR[code] || ERR.upstream_error);
        }
        if (!e || !e.text) { if (turns[turns.length - 1].role === 'user' && code !== 'cancelled') { /* keep the user's message so they can retry */ } }
      } finally {
        this.busy = false; this.ctl = null;
        this.refresh();
      }
    },
    async makePractice() {
      const ctx = this.ctx; if (!ctx || ctx.kind !== 'lesson' || !this.available() || this.busy) return;
      const L = ctx.lesson, c = COURSES.get(ctx.code);
      this.busy = true; this.refresh();
      const msgs = $('#t-msgs');
      const bubble = document.createElement('div'); bubble.className = 'msg-a'; bubble.innerHTML = '<span class="thinking">Writing three new problems for week ' + L.week + '…</span>';
      msgs.appendChild(bubble);
      const examples = (L.practice || []).slice(0, 3).map((p) => '- ' + p.prompt).join('\n');
      const prompt = 'Write 3 new practice problems for a self-study lesson.\nCourse: ' + ctx.code + ' ' + c.title + '. Lesson: week ' + L.week + ', "' + L.title + '". Objectives: ' + (L.objectives || []).join('; ') +
        '\nExisting problems, for level and style (do not repeat them):\n' + examples +
        '\n\nReply with only a JSON array of 3 objects, each {"type": "num" | "mc" | "expr", "prompt": string, "answer": string or number, "choices": [strings] (mc only, exactly 4, no "all/none of the above"), "vars": [strings] (expr only), "hints": [2 short progressive hints], "solution": string}. ' +
        'Use markdown with TeX in $...$ for prompts, hints and solutions. For num answers use calculator syntax such as 3/4, -2, sqrt(2)/2, 2pi, 1.5e3 (exact values; no units, no words). For expr answers use calculator syntax in the listed vars, such as 3x^2 + 2x or e^(-t). For mc, "answer" is the 0-based index of the correct choice. ' +
        'Solve each problem twice independently before writing its answer; prefer problems whose answers are clean.';
      this.ctl = new AbortController();
      try {
        const arr = await this.sample.json(prompt, { signal: this.ctl.signal, cache: false });
        const items = (Array.isArray(arr) ? arr : []).map(normalize).filter(Boolean);
        if (!items.length) throw { code: 'invalid_json' };
        this.busy = false; this.ctl = null;
        this.closeDrawer();
        App.startAiPractice(ctx.code, L.week, items);
        return;
      } catch (e) {
        if (e && e.code && e.code !== 'cancelled') { if (PERMANENT.has(e.code)) { this.off = true; this.offMsg = ERR[e.code]; } App.toast(ERR[e.code] || ERR.upstream_error); }
      }
      this.busy = false; this.ctl = null; this.refresh();
    },
    async copyPrompt() {
      const text = RULES + '\n\n' + contextText(this.ctx) + '\n\nMy question: ';
      try { await navigator.clipboard.writeText(text); App.toast('Copied. Paste it into a chat with Claude and add your question.'); }
      catch (e) {
        const ta = $('#t-in'); ta.disabled = false; ta.value = text; ta.focus(); ta.select();
        App.toast('Select the text in the box and copy it.');
      }
    },
  });

  function normalize(x) {
    if (!x || typeof x !== 'object') return null;
    const type = x.type;
    if (['num', 'mc', 'expr'].indexOf(type) < 0) return null;
    const it = { type, prompt: String(x.prompt || ''), hints: (Array.isArray(x.hints) ? x.hints : []).slice(0, 3).map(String), solution: String(x.solution || '') };
    if (!it.prompt || !it.solution) return null;
    if (type === 'mc') {
      if (!Array.isArray(x.choices) || x.choices.length < 3 || x.choices.length > 5) return null;
      it.choices = x.choices.map(String);
      it.answer = Number(x.answer);
      if (!(it.answer >= 0 && it.answer < it.choices.length) || new Set(it.choices).size !== it.choices.length) return null;
      return it;
    }
    it.answer = String(x.answer == null ? '' : x.answer);
    if (type === 'expr') it.vars = (Array.isArray(x.vars) ? x.vars : []).map(String);
    try { if (!K.grade(it, it.answer).correct) return null; } catch (e) { return null; }
    return it;
  }
})();
