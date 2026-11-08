/* Metaphysics Learning Foundation — code editor boxes, the "Try it" buttons on lesson code, and the Python scratchpad page. */
(function () {
  'use strict';
  const App = window.ToEApp;
  const PY = window.ToEPy;
  const { esc, $, $$ } = App;

  // ---------- status line ----------
  function statusHtml() {
    return '<span class="py-status" data-pystatus aria-live="polite"><i class="dot"></i><span class="t">' + esc(PY ? PY.statusText() : 'Python is not available') + '</span></span>';
  }
  function paintStatus() {
    $$('[data-pystatus]').forEach((el) => {
      el.dataset.state = PY ? PY.state : 'failed';
      const t = $('.t', el); if (t) t.textContent = PY ? PY.statusText() : 'Python is not available';
    });
  }
  if (PY) PY.onStatus(paintStatus);
  function warm() { if (PY && PY.state === 'idle') PY.start().catch(() => { /* shown in the status line */ }); }

  // ---------- editor behaviour: indentation that works like a code editor ----------
  const IND = '    ';
  function insertText(ta, text) {
    ta.focus();
    let ok = false;
    try { ok = document.execCommand && document.execCommand('insertText', false, text); } catch (e) { ok = false; }
    if (!ok) {
      const a = ta.selectionStart, z = ta.selectionEnd;
      ta.setRangeText(text, a, z, 'end');
      ta.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }
  function lineStart(v, i) { return v.lastIndexOf('\n', i - 1) + 1; }
  function fit(ta) {
    const n = ta.value.split('\n').length;
    ta.rows = Math.max(+ta.dataset.min || 4, Math.min(+ta.dataset.max || 26, n + 1));
  }
  function wireEditor(ta, onRun) {
    fit(ta);
    ta.addEventListener('input', () => fit(ta));
    ta.addEventListener('keydown', (e) => {
      const v = ta.value, a = ta.selectionStart, z = ta.selectionEnd;
      if ((e.key === 'Enter') && (e.ctrlKey || e.metaKey)) { e.preventDefault(); if (onRun) onRun(); return; }
      if (e.key === 'Escape') { ta.blur(); return; }
      if (e.key === 'Tab' && !e.altKey && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        const ls = lineStart(v, a);
        if (!e.shiftKey && a === z) { const col = a - ls; insertText(ta, ' '.repeat(4 - (col % 4))); return; }
        // indent or dedent every selected line
        const end = z > a && v[z - 1] === '\n' ? z - 1 : z;
        const block = v.slice(ls, end);
        const lines = block.split('\n');
        const changed = e.shiftKey ? lines.map((l) => l.replace(/^ {1,4}/, '')) : lines.map((l) => (l.length ? IND + l : l));
        const out = changed.join('\n');
        ta.setSelectionRange(ls, end);
        insertText(ta, out);
        ta.setSelectionRange(ls, ls + out.length);
        return;
      }
      if (e.key === 'Enter' && !e.shiftKey && a === z) {
        e.preventDefault();
        const ls = lineStart(v, a);
        const line = v.slice(ls, a);
        let ind = (/^[ \t]*/.exec(line) || [''])[0];
        if (/:\s*(#.*)?$/.test(line)) ind += IND;
        insertText(ta, '\n' + ind);
        return;
      }
      if (e.key === 'Backspace' && a === z && a > 0) {
        const ls = lineStart(v, a);
        const before = v.slice(ls, a);
        if (before.length && /^ +$/.test(before)) {
          e.preventDefault();
          const n = before.length % 4 || 4;
          ta.setSelectionRange(a - n, a);
          insertText(ta, '');
        }
      }
    });
  }

  // ---------- output rendering ----------
  function outputHtml(res, opts) {
    opts = opts || {};
    if (!res) return '';
    if (res.result === 'timeout') {
      const secs = Math.round((opts.limit || (PY ? PY.limits.run : 6000)) / 1000);
      return '<div class="out-err">Stopped: your program ran for more than ' + secs + ' seconds. Look for a loop that never ends, or a loop that does far more work than it needs to.</div>';
    }
    let h = '';
    const out = res.out || '';
    if (out) h += '<pre class="out-text">' + esc(out.length > 20000 ? out.slice(0, 20000) + '\n… (output cut off)' : out) + '</pre>';
    if (res.tb) h += '<pre class="out-err">' + esc(res.tb) + '</pre>';
    if (!out && !res.tb && !opts.quietEmpty) h += '<div class="out-none">(Your program printed nothing.' + (opts.noPrint ? ' It has no print() call: add a line such as <code>print(...)</code> at the end to see a result, and run it again.' : '') + ')</div>';
    return h;
  }
  function testsHtml(res, item, opts) {
    opts = opts || {};
    if (!res || res.result === 'timeout') return '';
    let h = '';
    const inputLabel = (t) => { const one = String(t || '').trim().split('\n').join(' / '); return one.length > 60 ? one.slice(0, 60) + '…' : one; };
    if (res.cases && res.cases.length) {
      res.cases.forEach((c) => {
        h += '<div class="test ' + (c.ok ? 'ok' : 'bad') + '"><span class="mk" aria-hidden="true">' + (c.ok ? '✓' : '✗') + '</span><span><b>Input</b> <code>' + esc(inputLabel(c.stdin) || '(none)') + '</code> — ' +
          (c.ok ? 'output matches.' : '') + (!c.ok && c.msg ? '<pre class="msg">' + esc(c.msg) + '</pre>' : '') + '</span></div>';
      });
    } else if (res.stdout_ok === false) h += '<div class="test bad"><span class="mk" aria-hidden="true">✗</span><span><b>Output</b> — ' + esc(res.stdout_msg || 'The output does not match.') + '</span></div>';
    else if (res.stdout_ok === true) h += '<div class="test ok"><span class="mk" aria-hidden="true">✓</span><span><b>Output</b> matches.</span></div>';
    (res.tests || []).forEach((t) => {
      const cls = t.ok ? 'ok' : 'bad';
      h += '<div class="test ' + cls + '"><span class="mk" aria-hidden="true">' + (t.ok ? '✓' : '✗') + '</span><span><code>' + esc(t.src) + '</code>' +
        (t.setup ? ' <span class="faint">(setup)</span>' : '') + (!t.ok && t.msg ? '<pre class="msg">' + esc(t.msg) + '</pre>' : '') + '</span></div>';
    });
    if (!h) return '';
    const nc = (res.cases || []).length, okc = (res.cases || []).filter((c) => c.ok).length;
    const head = res.total ? res.passed + ' of ' + res.total + ' tests passed' + (nc ? '; ' + okc + ' of ' + nc + ' inputs right' : '') : nc ? okc + ' of ' + nc + ' inputs give the right output' : (res.stdout_ok ? 'Output matches' : 'Output check');
    return '<div class="tests" role="group" aria-label="Test results"><div class="tests-h">' + esc(head) + '</div>' + h + '</div>';
  }

  // ---------- a code box: editor, input lines, Run, Reset, output ----------
  let boxSeq = 0;
  function boxHtml(o) {
    const id = o.id || ('cb' + (++boxSeq));
    const code = o.code == null ? '' : String(o.code);
    return '<div class="codebox" id="' + id + '" data-box>' +
      '<div class="cb-bar"><span class="cb-lang">Python</span><span class="spacer"></span>' + statusHtml() + '</div>' +
      '<label class="sr-only" for="' + id + '-ed">' + esc(o.label || 'Code editor') + '</label>' +
      '<textarea class="code-ed" id="' + id + '-ed" spellcheck="false" autocapitalize="off" autocomplete="off" autocorrect="off" wrap="off" data-min="' + (o.minRows || 4) + '"' + (o.readOnly ? ' readonly' : '') + '>' + esc(code) + '</textarea>' +
      (o.stdinBox ? '<details class="cb-in"' + (o.stdin ? ' open' : '') + '><summary>Input lines for <code>input()</code></summary><label class="sr-only" for="' + id + '-in">Input lines, one per line</label><textarea class="code-ed small" id="' + id + '-in" spellcheck="false" data-min="2" data-max="8" wrap="off">' + esc(o.stdin || '') + '</textarea></details>' : '') +
      '<div class="cb-actions"><button type="button" class="btn btn-sm" data-run>▶ Run</button>' +
      (o.reset != null ? '<button type="button" class="btn btn-sm btn-quiet" data-reset>Reset</button>' : '') +
      '<span class="faint cb-tip">Ctrl+Enter runs · Tab indents · Esc leaves the editor</span>' + (o.extraActions || '') + '</div>' +
      '<div class="cb-out" data-out aria-live="polite"' + (o.lastRun ? '' : ' hidden') + '>' + (o.lastRun ? outputHtml(o.lastRun) : '') + '</div></div>';
  }
  function wireBox(id, o) {
    const box = document.getElementById(id); if (!box) return null;
    const ed = $('textarea.code-ed', box), inp = $('#' + id + '-in', box), out = $('[data-out]', box), runBtn = $('[data-run]', box);
    let busy = false;
    async function run() {
      if (busy || !PY) return;
      busy = true; runBtn.disabled = true;
      out.hidden = false; out.innerHTML = '<div class="out-none">' + (PY.state === 'ready' ? 'Running…' : 'Starting Python… the first start takes a few seconds.') + '</div>';
      let res;
      try { res = await PY.run(ed.value, inp ? inp.value : (o.stdin || null)); }
      catch (e) { res = { result: 'error', out: '', tb: 'Python could not start in this browser: ' + (PY.reason || (e && e.message) || e) + '\n' }; }
      busy = false; runBtn.disabled = false;
      out.innerHTML = outputHtml(res, { noPrint: !/\bprint\s*\(/.test(ed.value) });
      if (o.onRun) o.onRun(res);
    }
    wireEditor(ed, run);
    if (inp) wireEditor(inp, run);
    ed.addEventListener('input', () => { if (o.onChange) o.onChange(ed.value); });
    runBtn.addEventListener('click', run);
    const rb = $('[data-reset]', box);
    if (rb) rb.addEventListener('click', () => { ed.value = o.reset || ''; fit(ed); if (o.onChange) o.onChange(ed.value); ed.focus(); });
    paintStatus();
    warm();
    return { box, ed, inp, out, run };
  }

  // ---------- "Try it" on runnable code blocks in lessons ----------
  function enhanceRunnable(root) {
    if (!PY || !PY.available()) return;
    $$('pre.code > code[data-lang="python-run"]', root || document).forEach((codeEl) => {
      const pre = codeEl.parentNode;
      if (pre.dataset.tryit) return;
      pre.dataset.tryit = '1';
      const btn = document.createElement('button');
      btn.type = 'button'; btn.className = 'btn btn-sm try-btn'; btn.textContent = 'Try it';
      btn.setAttribute('aria-label', 'Try this code: edit and run it');
      const wrap = document.createElement('div'); wrap.className = 'tryit';
      pre.parentNode.insertBefore(wrap, pre); wrap.appendChild(pre); wrap.appendChild(btn);
      btn.addEventListener('click', () => {
        const code = codeEl.textContent;
        const holder = document.createElement('div');
        const id = 'try' + (++boxSeq);
        holder.innerHTML = boxHtml({ id, code, reset: code, stdinBox: /\binput\s*\(/.test(code), label: 'Editable copy of the example' });
        wrap.replaceWith(holder.firstChild);
        const b = wireBox(id, { reset: code });
        if (b) { b.ed.focus(); b.run(); }
      });
    });
  }
  App.enhanceCode = enhanceRunnable;

  // ---------- the scratchpad page ----------
  const PAD_KEY = 'mlf-scratchpad-v1';
  const PAD_START = '# Write any Python here and press Run (or Ctrl+Enter).\n# Example: the truth table for "if P then Q".\nfrom itertools import product\n\ndef implies(p, q):\n    return (not p) or q\n\nprint("P     Q     P -> Q")\nfor p, q in product([True, False], repeat=2):\n    print(f"{p!s:5} {q!s:5} {implies(p, q)}")\n';
  App.route(/^python$/, () => {
    let saved = null;
    try { saved = localStorage.getItem(PAD_KEY); } catch (e) { saved = null; }
    App.mount('<div class="wrap"><div class="section"><span class="eyebrow">Scratchpad</span><h1 class="lesson-title">Python in your browser</h1>' +
      '<p class="lesson-summary">Try anything here. Your code runs on this device, with no installation and no network, and is kept in this browser between visits.</p></div>' +
      boxHtml({ id: 'pad', code: saved != null ? saved : PAD_START, reset: PAD_START, stdinBox: true, minRows: 14, label: 'Scratchpad code editor' }) +
      '<div class="prose" style="margin-top:18px"><h2>What runs here</h2><p>This is Brython, which follows Python 3.14 and includes most of the standard library: <code>math</code>, <code>random</code>, <code>collections</code>, <code>itertools</code>, <code>functools</code>, <code>heapq</code>, <code>re</code>, <code>json</code>, <code>dataclasses</code>, <code>datetime</code>, <code>statistics</code>, <code>decimal</code>, <code>csv</code>, <code>unittest</code> and more. Not available: <code>sqlite3</code>, threads, networking, <code>tkinter</code>, <code>turtle</code> and third-party packages such as NumPy and pandas. <code>open()</code> works on in-memory files that disappear when the run ends. Programs are stopped after ' + Math.round(PY.limits.run / 1000) + ' seconds.</p>' +
      '<p>For bigger projects, install Python from <a href="https://www.python.org/downloads/" target="_blank" rel="noopener">python.org</a> and use an editor on your own computer, as the courses explain.</p></div></div>');
    let t;
    wireBox('pad', { reset: PAD_START, onChange: (v) => { clearTimeout(t); t = setTimeout(() => { try { localStorage.setItem(PAD_KEY, v); } catch (e) { /* storage unavailable */ } }, 400); } });
  }, 'python');

  App.Code = { boxHtml, wireBox, wireEditor, outputHtml, testsHtml, statusHtml, paintStatus, warm };
})();
