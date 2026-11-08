// Node side of the content validator: evaluates canonical answers with the site's own checker
// and parses every math segment with KaTeX. Input: JSON file path. Output: JSON list of errors.
const fs = require('fs');
const K = require('/home/claude/law/src/checker.js');
const T = require('/home/claude/law/src/mathtext.js');
const katex = require('/opt/npm-tools/node_modules/katex');

const batch = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const errors = [];
const err = (key, msg) => errors.push({ key, msg });
const warn = (key, msg) => errors.push({ key, msg, warn: true });
const tol = (item) => {
  const t = item.tol != null ? String(item.tol).trim() : '';
  if (!t) return { rel: 1e-6, abs: 1e-9 };
  if (t.endsWith('%')) return { rel: parseFloat(t) / 100, abs: 0 };
  return { rel: 0, abs: parseFloat(t) };
};
const toC = (v) => (Array.isArray(v) ? { re: v[0], im: v[1] } : { re: v, im: 0 });
const close = (a, b, t) => {
  if (!isFinite(a.re) || !isFinite(b.re)) return a.re === b.re;
  const d = Math.hypot(a.re - b.re, a.im - b.im);
  return d <= Math.max(t.abs, t.rel * Math.max(Math.hypot(a.re, a.im), Math.hypot(b.re, b.im)), 1e-11);
};
const fmt = (c) => (Math.abs(c.im) > 1e-12 ? `${c.re}${c.im >= 0 ? '+' : ''}${c.im}i` : `${c.re}`);
function numValue(s, item) {
  const tree = K.parse(s, { vars: [] });
  if (tree.k === 'special') return { special: tree.v };
  const fv = K.freeVars(tree);
  if (fv.size) throw new Error(`answer "${s}" contains unknown symbol "${[...fv][0]}" (declare vars, or use type expr)`);
  return K.evaluate(tree, {});
}

for (const it of batch.items) {
  const key = it.key;
  try {
    if (it.type === 'num' && it.expected !== undefined) {
      const v = numValue(it.answer, it);
      const e = it.expected;
      if (v.special || typeof e === 'string') {
        if ((v.special || null) !== (typeof e === 'string' ? e : null)) err(key, `answer "${it.answer}" vs check ${JSON.stringify(e)}`);
      } else if (!close(v, toC(e), tol(it))) err(key, `answer "${it.answer}" = ${fmt(v)} but check gives ${fmt(toC(e))}`);
      else if (it.tol != null && typeof e === 'number') {
        // a rounded answer should be the check value rounded at the answer's last digit
        const m = /^\s*(-?\d*\.(\d+)|-?\d+)(?:[eE]([+-]?\d+))?\s*$/.exec(String(it.answer));
        if (m) {
          const dec = m[2] ? m[2].length : 0, ex = m[3] ? parseInt(m[3], 10) : 0;
          const half = 0.5 * Math.pow(10, ex - dec);
          if (Math.abs(v.re - e) > half * 1.0001 + 1e-15) warn(key, `answer "${it.answer}" is not the check value ${e} rounded at its last digit`);
        }
      }
    }
    if (it.type === 'expr' && it.expected) {
      const tree = K.parse(it.answer, { vars: it.vars || [] });
      const fv = K.freeVars(tree);
      if (fv.size) { err(key, `answer uses "${[...fv][0]}" which is not in vars (${(it.vars || []).join(', ') || 'none'})`); continue; }
      const { points, values } = it.expected;
      let offset = null, bad = null, valid = 0;
      points.forEach((env, k) => {
        if (bad) return;
        const want = values[k];
        if (want === null) return;
        const got = K.evaluate(tree, env);
        const w = toC(want);
        if (it.const) {
          const d = { re: got.re - w.re, im: got.im - w.im };
          if (offset === null) offset = d;
          else if (!close(d, offset, { rel: 1e-6, abs: 1e-7 })) bad = `answer and check differ by a non-constant amount at ${JSON.stringify(env)}`;
        } else if (!close(got, w, { rel: 1e-6, abs: 1e-9 })) bad = `at ${JSON.stringify(env)} answer = ${fmt(got)} but check = ${fmt(w)}`;
        valid++;
      });
      if (bad) err(key, bad);
      else if (valid < 3) err(key, 'check returned too few finite values; set a domain where the expression is defined');
    }
    if ((it.type === 'list' || it.type === 'tuple') && it.expected !== undefined) {
      const parts = K.splitList(K.stripBrackets(it.answer));
      const vals = parts.map((p) => numValue(p, it));
      const exp = (it.expected || []).map(toC);
      if (vals.length !== exp.length) err(key, `answer has ${vals.length} entries but check gives ${exp.length}: [${exp.map(fmt).join(', ')}]`);
      else if (it.type === 'tuple') {
        vals.forEach((v, k) => { if (!close(v, exp[k], tol(it))) err(key, `entry ${k + 1}: answer ${fmt(v)} vs check ${fmt(exp[k])}`); });
      } else {
        const used = exp.map(() => false);
        vals.forEach((v) => {
          const k = exp.findIndex((e, j) => !used[j] && close(v, e, tol(it)));
          if (k < 0) err(key, `answer value ${fmt(v)} not among check values [${exp.map(fmt).join(', ')}]`);
          else used[k] = true;
        });
      }
    }
    // self-consistency: the site's grader must accept the canonical answer
    if (['num', 'expr', 'list', 'tuple'].includes(it.type)) {
      const g = K.grade(it, it.answer);
      if (!g.correct) err(key, `the site's grader rejects the canonical answer "${it.answer}"${g.message ? ': ' + g.message : ''}`);
      if (K.preview(it.answer, it) === null) err(key, `answer "${it.answer}" cannot be previewed (parse problem)`);
    }
    if (it.type === 'mc') {
      const g = K.grade(it, it.answer);
      if (!g.correct) err(key, 'mc answer index invalid');
    }
  } catch (e) {
    err(key, String(e.message || e));
  }
}

for (const t of batch.tex) {
  const p = T.protect(t.text);
  for (const m of p.maths) {
    if (m.unclosed) { err(t.key, `unclosed $ math near: ${m.tex.slice(0, 50)}`); continue; }
    if (!m.tex.trim()) { err(t.key, 'empty $$ pair (use \\$ for a literal dollar sign)'); continue; }
    try { katex.renderToString(m.tex, { throwOnError: true, displayMode: m.display, strict: 'ignore' }); }
    catch (e) { err(t.key, `TeX error in $${m.tex.slice(0, 70)}$: ${String(e.message).replace(/^KaTeX parse error: /, '').slice(0, 140)}`); }
  }
  const outside = p.text.replace(/\u0001\d+\u0002/g, '');
  const stray = /\\(frac|sqrt|int|sum|alpha|beta|theta|lambda|omega|partial|nabla|cdot|times|pi|infty|hbar|psi|phi|mathbf|vec|hat|left|right)\b/.exec(outside);
  if (stray) err(t.key, `TeX command \\${stray[1]} outside $...$`);
}
process.stdout.write(JSON.stringify(errors));
