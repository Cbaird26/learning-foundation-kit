#!/usr/bin/env node
'use strict';
/* Tests for src/generators.js (spec: toolkit/GENERATORS.md).
   For every generator and 400 seeds:
     1. ToEChecker.grade accepts item.answer; mc items have a valid index and distinct choices
     2. every $...$ segment parses with KaTeX
     3. no NaN / undefined / Infinity / "+ -" / "1x" / "^1" / "[object" in any text
     4. an independent per-generator check (V[key] below) substitutes the answer back into the problem
   Usage: node scripts/test_generators.js [key ...]      (N=100 node ... for a quicker run) */

const ROOT = '/home/claude/toe';
const Checker = require(ROOT + '/src/checker.js');
const MathText = require(ROOT + '/src/mathtext.js');
const katex = require('/opt/npm-tools/node_modules/katex');
const Gen = require(ROOT + '/src/generators.js');

const N = Number(process.env.N || 400);
const ONLY = process.argv.slice(2);
const REQUIRED = [];
for (const c of ['F1', 'F2']) for (let i = 1; i <= 12; i++) REQUIRED.push(c + '-' + String(i).padStart(2, '0'));

const ALLOWED = new Set(['type', 'prompt', 'answer', 'choices', 'vars', 'tol', 'form', 'const', 'domain', 'unit', 'lead', 'hints', 'solution', 'gen', 'seed']);
const TYPES = new Set(['num', 'expr', 'list', 'tuple', 'mc']);

// ---------- toolbox for verifiers ----------
const mathsOf = (text) => MathText.protect(String(text)).maths.map((m) => m.tex);

function texToCalc(t) {
  let s = String(t);
  s = s.replace(/\\left\|/g, 'abs(').replace(/\\right\|/g, ')');
  s = s.replace(/\\left|\\right/g, '');
  s = s.replace(/\\[dt]frac/g, '\\frac');
  s = s.replace(/(\d+)\s*\\frac\{(\d+)\}\{(\d+)\}/g, '($1+$2/$3)');          // mixed number 2\frac{1}{3}
  for (let i = 0; i < 6; i++) {
    s = s.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))');
    s = s.replace(/\\sqrt\[3\]\{([^{}]*)\}/g, 'cbrt($1)');
    s = s.replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)');
    s = s.replace(/\^\{([^{}]*)\}/g, '^($1)');
    s = s.replace(/_\{([^{}]*)\}/g, '_$1');
  }
  s = s.replace(/\\cdot|\\times/g, '*').replace(/\\div/g, '/');
  s = s.replace(/\\pi\b/g, 'pi');
  s = s.replace(/\\(sin|cos|tan|sec|csc|cot|ln|log|arcsin|arccos|arctan)(?![a-zA-Z])/g, '$1');
  s = s.replace(/\\,|\\;|\\!|\\ |~/g, '');
  s = s.replace(/[{}]/g, (m) => (m === '{' ? '(' : ')'));
  return s;
}
const ev = (src, env) => Checker.evaluate(Checker.parse(src), env || {});
function num(src, env) {
  const v = ev(src, env);
  if (v.re === null || Number.isNaN(v.re)) throw new Error('"' + src + '" is undefined');
  if (Math.abs(v.im) > 1e-9) throw new Error('"' + src + '" is not real');
  return v.re;
}
const close = (a, b, tol) => Math.abs(a - b) <= (tol === undefined ? 1e-9 * Math.max(1, Math.abs(a), Math.abs(b)) : tol);
function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }
function splitTop(s) {                                  // split on top-level commas
  const out = []; let depth = 0, cur = '';
  for (const ch of s) {
    if (ch === '(' || ch === '[') depth++;
    if (ch === ')' || ch === ']') depth--;
    if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch;
  }
  if (cur.trim() !== '') out.push(cur.trim());
  return out;
}
const unparen = (s) => { s = s.trim(); return /^\(.*\)$/.test(s) ? s.slice(1, -1) : s; };
const listVals = (ans) => (ans === 'none' ? [] : splitTop(ans).map((x) => num(x)));
const tupleVals = (ans) => splitTop(unparen(ans)).map((x) => num(x));
const T = { mathsOf, texToCalc, ev, num, close, assert, splitTop, unparen, listVals, tupleVals, Checker, gcd: (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a; } };

// ---------- generic checks ----------
function textsOf(item) {
  const t = [['prompt', item.prompt]];
  (item.choices || []).forEach((c, i) => t.push(['choice ' + i, c]));
  (item.hints || []).forEach((h, i) => t.push(['hint ' + i, h]));
  t.push(['solution', item.solution]);
  if (item.lead !== undefined) t.push(['lead', item.lead]);
  if (item.unit !== undefined) t.push(['unit', item.unit]);
  return t;
}

function checkShape(item) {
  assert(item && typeof item === 'object', 'item is not an object');
  for (const k of Object.keys(item)) assert(ALLOWED.has(k), 'unexpected field "' + k + '"');
  assert(TYPES.has(item.type), 'bad type ' + item.type);
  assert(typeof item.prompt === 'string' && item.prompt.length > 10, 'bad prompt');
  assert(typeof item.solution === 'string' && item.solution.length > 20, 'bad solution');
  assert(Array.isArray(item.hints) && item.hints.length >= 2 && item.hints.length <= 3, 'need 2-3 hints');
  item.hints.forEach((h) => assert(typeof h === 'string' && h.length > 8, 'bad hint'));
  assert(typeof item.gen === 'string' && Number.isInteger(item.seed), 'gen/seed missing');
  if (item.tol !== undefined) assert(typeof item.tol === 'string' && /^\d*\.?\d+%?$/.test(item.tol), 'bad tol ' + item.tol);
  if (item.form !== undefined) assert(item.form === 'expanded' || item.form === 'factored', 'bad form');
  if (item.const !== undefined) assert(item.const === true, 'bad const');
  if (item.domain !== undefined) assert(typeof item.domain === 'string' && /^[a-z]: ?-?[\d.]+\.\.-?[\d.]+$/.test(item.domain), 'bad domain ' + item.domain);
  if (item.unit !== undefined) assert(typeof item.unit === 'string', 'bad unit');
  if (item.lead !== undefined) assert(typeof item.lead === 'string', 'bad lead');
  if (item.type === 'mc') {
    assert(Array.isArray(item.choices) && item.choices.length >= 3 && item.choices.length <= 5, 'mc needs 3-5 choices');
    assert(Number.isInteger(item.answer) && item.answer >= 0 && item.answer < item.choices.length, 'mc answer index invalid');
    const norm = item.choices.map((c) => String(c).replace(/\s+/g, ' ').trim().toLowerCase());
    assert(new Set(norm).size === norm.length, 'duplicate mc choices');
    item.choices.forEach((c) => assert(!/(all|none) of the above/i.test(c), 'all/none of the above'));
  } else {
    assert(typeof item.answer === 'string' && item.answer.length > 0, 'answer must be a non-empty string');
    assert(item.choices === undefined, 'choices on a non-mc item');
    if (item.type === 'expr') assert(Array.isArray(item.vars) && item.vars.length > 0, 'expr needs vars');
  }
}

function checkGrade(item) {
  const res = Checker.grade(item, item.answer);
  assert(res && res.correct === true, 'grade(item, item.answer) was ' + JSON.stringify(res));
  if (item.type === 'num' && !/[a-z]/i.test(String(item.answer).replace(/pi|sqrt|e|i/g, ''))) {
    const v = ev(item.answer);
    const tolAbs = item.tol ? (item.tol.endsWith('%') ? Math.abs(v.re) * parseFloat(item.tol) / 100 : parseFloat(item.tol)) : 0;
    if (tolAbs < 0.4 && Math.abs(v.im) < 1e-12 && v.re !== null) {
      const bad = Checker.grade(item, String(v.re + 1));
      assert(!bad.correct, 'grader accepted answer+1');
    }
  }
}

function checkKatex(item) {
  const warns = [];
  const origWarn = console.warn;
  console.warn = (...a) => warns.push(a.join(' '));
  try {
    for (const [where, text] of textsOf(item)) {
      const p = MathText.protect(String(text));
      assert(p.text.indexOf('$') === -1, where + ': unpaired $ in ' + JSON.stringify(text));
      for (const m of p.maths) {
        try { katex.renderToString(m.tex, { throwOnError: true, displayMode: m.display }); }
        catch (e) { throw new Error(where + ': KaTeX failed on "' + m.tex + '": ' + e.message); }
      }
    }
  } finally { console.warn = origWarn; }
  assert(warns.length === 0, 'KaTeX warnings: ' + warns.slice(0, 2).join(' | '));
}

const BAD_ANY = [
  [/NaN/, 'NaN'], [/undefined/, 'undefined'], [/Infinity/, 'Infinity'], [/\[object/, '[object'],
  [/[-+]\s*[-+]/, 'adjacent signs'], [/(?<![0-9.\w])1(?=[a-zA-Z]|\\(?:pi|sqrt|theta|sin|cos|tan|ln|log))/, '1x'],
  [/(?<![0-9.\w])0(?=[a-zA-Z])/, '0x'], [/\\frac\{[^{}]*\}\{-\d+\}/, 'negative denominator'], [/\/-/, 'a/-b'],
];
function checkText(item) {
  const all = textsOf(item).map((x) => x[1]);
  for (const t of all) {
    for (const [re, name] of BAD_ANY) assert(!re.test(t), name + ' in ' + JSON.stringify(t));
    assert(!/\^1/.test(t), '^1 in ' + JSON.stringify(t));
  }
  if (item.type !== 'mc') {
    for (const [re, name] of BAD_ANY) assert(!re.test(item.answer), name + ' in answer ' + item.answer);
    assert(!/\^1(?!\d)/.test(item.answer), '^1 in answer');
    assert(!/\^-/.test(item.answer), 'use ^(-n) in answers: ' + item.answer);
    assert(!/undefined|NaN/.test(JSON.stringify(item)), 'undefined/NaN somewhere in item');
  }
}

function checkSolutionMentionsAnswer(item) {
  if (item.type === 'mc') return;
  const toks = String(item.answer).match(/\d+(\.\d+)?/g) || [];
  for (const t of toks) assert(item.solution.indexOf(t) !== -1, 'solution never mentions "' + t + '" from the answer ' + item.answer);
}

// ---------- independent per-generator verifiers ----------
const V = {};

V['F1-01'] = (item) => {
  const got = num(texToCalc(mathsOf(item.prompt)[0]));
  assert(close(got, Number(item.answer)), 'prompt evaluates to ' + got + ' but answer is ' + item.answer);
  assert(/^-?\d+$/.test(item.answer), 'answer should be an integer');
};

const lowestTerms = (s) => {
  const m = /^(-?\d+)(?:\/(\d+))?$/.exec(s);
  assert(m, 'answer is not an integer or a/b: ' + s);
  if (m[2] !== undefined) assert(Number(m[2]) > 1 && T.gcd(Number(m[1]), Number(m[2])) === 1, 'fraction not in lowest terms: ' + s);
};

V['F1-02'] = (item) => {
  lowestTerms(item.answer);
  const ans = num(item.answer), p = item.prompt;
  const ints = (p.replace(/\$[^$]*\$/g, ' ').match(/\d+/g) || []).map(Number);
  let mm;
  if ((mm = /ratio of (.+?) to (.+?) is \$(\d+):(\d+)\$\. There are (\d+) (.+?)\. How many (.+?) are there\?/.exec(p))) {
    const [, A, B, pp, qq, known, kn, on] = mm;
    assert(kn === A || kn === B, 'known name mismatch');
    assert((on === A || on === B) && on !== kn, 'asked name mismatch');
    const exp = kn === A ? Number(known) / pp * qq : Number(known) / qq * pp;
    assert(close(exp, ans), 'expected ' + exp + ' got ' + ans);
  } else if ((mm = /ratio of (.+?) to (.+?) is \$(\d+):(\d+)\$ and there are (\d+) in all\. How many (.+?) are there\?/.exec(p))) {
    const [, A, B, pp, qq, total, w] = mm;
    assert(w === A || w === B, 'asked name mismatch');
    const exp = Number(total) * (w === A ? Number(pp) : Number(qq)) / (Number(pp) + Number(qq));
    assert(close(exp, ans), 'expected ' + exp + ' got ' + ans);
  } else if (item.meta && item.meta.kind === 'rate') {
    const { a, b, c } = item.meta;
    assert(close(a * c / b, ans), 'rate: expected ' + a * c / b + ' got ' + ans);
    assert(JSON.stringify(ints.slice().sort()) === JSON.stringify([a, b, c].sort()), 'prompt numbers ' + ints + ' do not match ' + [a, b, c]);
  } else {
    assert(!item.meta, 'unrecognised word-problem template: ' + p);
    const got = num(texToCalc(mathsOf(p)[0]));
    assert(close(got, ans), 'prompt evaluates to ' + got + ' but answer is ' + item.answer);
  }
};

V['F1-03'] = (item) => {
  const ms = mathsOf(item.prompt);
  const v = ms[0], parts = ms[1].split('=');
  assert(parts.length === 2, 'expected one equation');
  lowestTerms(item.answer);
  const x = num(item.answer), env = { [v]: x };
  const lhs = num(texToCalc(parts[0]), env), rhs = num(texToCalc(parts[1]), env);
  assert(close(lhs, rhs, 1e-9), 'substituting ' + item.answer + ' gives ' + lhs + ' vs ' + rhs);
  // unique solution: the two sides differ at another point
  const e2 = { [v]: x + 1 };
  assert(!close(num(texToCalc(parts[0]), e2), num(texToCalc(parts[1]), e2), 1e-9), 'not a single-solution linear equation');
};

const REL_RE = /^(.*?)(\\le|\\ge|<|>)(.*)$/;
const holds = (rel, a, b) => (rel === '<' ? a < b - 1e-12 : rel === '>' ? a > b + 1e-12 : rel === '\\le' ? a <= b + 1e-12 : a >= b - 1e-12);

V['F1-04'] = (item) => {
  const m = REL_RE.exec(mathsOf(item.prompt)[0]);
  assert(m, 'no relation in the prompt');
  const ch = item.choices.map((c) => {
    const q = /^(\w) (<|>|\\le|\\ge) (.+)$/.exec(mathsOf(c)[0]);
    assert(q, 'unparseable choice ' + c);
    return { v: q[1], rel: q[2], b: num(texToCalc(q[3])) };
  });
  const vn = ch[0].v;
  const pts = new Set([-1000, 1000]);
  ch.forEach((c) => [c.b, c.b - 0.25, c.b + 0.25, c.b - 3, c.b + 3].forEach((p) => pts.add(p)));
  const truth = (x) => holds(m[2], num(texToCalc(m[1]), { [vn]: x }), num(texToCalc(m[3]), { [vn]: x }));
  const matches = ch.map((c) => [...pts].every((x) => holds(c.rel, x, c.b) === truth(x)));
  assert(matches[item.answer], 'the marked choice does not describe the solution set');
  assert(matches.filter(Boolean).length === 1, 'more than one choice describes the solution set');
  const counts = {};
  ch.forEach((c) => { counts[c.b] = (counts[c.b] || 0) + 1; });
  assert(Object.values(counts).sort().join() === '1,4', 'want four choices sharing a boundary plus one distractor boundary');
  const shared = Object.keys(counts).find((k) => counts[k] === 4);
  assert(new Set(ch.filter((c) => String(c.b) === shared).map((c) => c.rel)).size === 4, 'the four directions must all appear');
  assert(ch.length === 5, 'expected 5 choices');
};

V['F1-05'] = (item) => {
  const kind = item.meta.kind, p = item.prompt, ms = mathsOf(p);
  const stdLine = () => {                                   // Ax + By = C from the prompt
    const eq = ms.find((t) => t.includes('=')).split('=');
    const L = (x, y) => num(texToCalc(eq[0]), { x, y });
    return { A: L(1, 0) - L(0, 0), B: L(0, 1) - L(0, 0), C: num(texToCalc(eq[1])), L };
  };
  const twoPts = () => {
    const m = /\$\((-?\d+), (-?\d+)\)\$ and \$\((-?\d+), (-?\d+)\)\$/.exec(p);
    assert(m, 'two points not found');
    return m.slice(1).map(Number);
  };
  if (kind === 'slope' || kind === 'yint2') {
    const [x1, y1, x2, y2] = twoPts(), m = (y2 - y1) / (x2 - x1);
    const exp = kind === 'slope' ? m : y1 - m * x1;
    assert(close(exp, num(item.answer)), 'expected ' + exp + ' got ' + item.answer);
    lowestTerms(item.answer);
  } else if (kind === 'twoEq') {
    const [x1, y1, x2, y2] = twoPts();
    assert(close(num(item.answer, { x: x1 }), y1) && close(num(item.answer, { x: x2 }), y2), 'line misses a given point');
    assert(item.lead === '$y =$' && item.type === 'expr' && item.vars[0] === 'x', 'lead/vars');
  } else if (kind === 'psEq') {
    const m = /slope \$(.+?)\$ that passes through \$\((-?\d+), (-?\d+)\)\$/.exec(p);
    assert(m, 'slope/point not found');
    const slope = num(texToCalc(m[1])), x1 = Number(m[2]), y1 = Number(m[3]);
    assert(close(num(item.answer, { x: x1 }), y1), 'line misses the point');
    assert(close(num(item.answer, { x: x1 + 1 }) - num(item.answer, { x: x1 }), slope), 'wrong slope');
    assert(Math.abs(num(item.answer, { x: 0 })) > 0, 'zero intercept');
  } else if (kind === 'perp') {
    let m1;
    if (item.meta.std) { const { A, B } = stdLine(); m1 = -A / B; }
    else { const e = texToCalc(ms[0].replace(/^y\s*=/, '')); m1 = num(e, { x: 1 }) - num(e, { x: 0 }); }
    assert(close(m1 * num(item.answer), -1), 'slopes do not multiply to -1: ' + m1 + ' and ' + item.answer);
    lowestTerms(item.answer);
  } else if (kind === 'stdSlope') {
    const { A, B } = stdLine();
    assert(close(-A / B, num(item.answer)), 'expected ' + -A / B + ' got ' + item.answer);
    lowestTerms(item.answer);
  } else if (kind === 'stdY' || kind === 'stdX') {
    const { C, L } = stdLine(), a = num(item.answer);
    const got = kind === 'stdY' ? L(0, a) : L(a, 0);
    assert(close(got, C), 'intercept does not lie on the line: ' + got + ' vs ' + C);
    assert(p.includes(kind === 'stdY' ? '$y$-intercept' : '$x$-intercept'), 'wrong intercept named');
  } else assert(false, 'unknown kind ' + kind);
};

V['F1-06'] = (item) => {
  const [x0, y0] = tupleVals(item.answer);
  assert(Number.isInteger(x0) && Number.isInteger(y0), 'solution should be integers');
  assert(/^\(-?\d+, -?\d+\)$/.test(item.answer), 'answer format ' + item.answer);
  let eqs;
  if (item.meta.kind === 'word') {
    const { e1, e2, nums } = item.meta;
    eqs = [e1, e2].map((e) => ({ A: e[0], B: e[1], C: e[2], g: (x, y) => e[0] * x + e[1] * y - e[2] }));
    const ints = (item.prompt.replace(/\$[^$]*\$/g, ' ').match(/\d+/g) || []).map(Number);
    nums.forEach((n) => assert(ints.includes(n), 'story is missing the number ' + n));
    assert(x0 > 0 && y0 > 0, 'word-problem answers should be positive');
  } else {
    const cases = mathsOf(item.prompt).find((t) => t.includes('\\begin{cases}'));
    assert(cases, 'no cases block');
    const rows = cases.replace('\\begin{cases}', '').replace('\\end{cases}', '').split('\\\\').map((x) => x.trim());
    assert(rows.length === 2, 'expected two equations');
    eqs = rows.map((row) => {
      const [l, rr] = row.split('=');
      const g = (x, y) => num(texToCalc(l), { x, y }) - num(texToCalc(rr), { x, y });
      return { A: g(1, 0) - g(0, 0), B: g(0, 1) - g(0, 0), g };
    });
  }
  eqs.forEach((e, i) => assert(close(e.g(x0, y0), 0, 1e-9), 'equation ' + (i + 1) + ' fails at ' + item.answer));
  assert(eqs[0].A * eqs[1].B - eqs[1].A * eqs[0].B !== 0, 'system is not uniquely solvable');
};

const powerFree = (n, k) => { for (let d = 2; Math.pow(d, k) <= n; d++) if (n % Math.pow(d, k) === 0) return false; return true; };

V['F1-07'] = (item) => {
  const e = texToCalc(mathsOf(item.prompt)[0]);
  if (item.type === 'expr') {
    for (const xv of [1.3, 2.1, 3.7]) {
      const got = num(e, { x: xv }), mine = num(item.answer, { x: xv });
      assert(close(got, mine, 1e-9 * Math.max(1, Math.abs(got))), 'at x=' + xv + ' the prompt is ' + got + ' but the answer is ' + mine);
    }
    if (item.prompt.includes('positive exponents')) assert(!/\^\(?-/.test(item.answer), 'answer has a negative exponent: ' + item.answer);
    return;
  }
  const want = num(e), got = num(item.answer);
  assert(close(want, got, 1e-9 * Math.max(1, Math.abs(want))), 'prompt evaluates to ' + want + ' but answer is ' + item.answer);
  const m = /^(-?\d*)(sqrt|cbrt)\((\d+)\)(?:\/(\d+))?$/.exec(item.answer);
  if (m) {
    const coef = m[1] === '' ? 1 : m[1] === '-' ? -1 : Number(m[1]), n = Number(m[3]), d = m[4] ? Number(m[4]) : 1;
    assert(n > 1 && powerFree(n, m[2] === 'sqrt' ? 2 : 3), 'radicand ' + n + ' is not in simplest form');
    assert(T.gcd(coef, d) === 1, 'coefficient fraction not reduced: ' + item.answer);
    assert(item.prompt.includes('simplest radical form'), 'radical answer without the instruction');
  } else lowestTerms(item.answer);
};

V['F1-08'] = (item) => {
  const e = texToCalc(mathsOf(item.prompt)[0]);
  for (const xv of [-2.3, -0.7, 0.4, 1.9, 3.1]) {
    const a = num(e, { x: xv }), b = num(item.answer, { x: xv });
    assert(close(a, b, 1e-8 * Math.max(1, Math.abs(a))), 'at x=' + xv + ' prompt=' + a + ' answer=' + b);
  }
  assert(!/[()]/.test(item.answer), 'answer still has brackets: ' + item.answer);
  assert(item.form === 'expanded' && item.vars.join() === 'x', 'form/vars');
  const degs = [...item.answer.matchAll(/x(?:\^(\d+))?/g)].map((m) => (m[1] ? Number(m[1]) : 1));
  for (let i = 1; i < degs.length; i++) assert(degs[i] < degs[i - 1], 'terms not in descending order: ' + item.answer);
  assert(!/[xX]\*|\*x/.test(item.answer), 'unexpected * in ' + item.answer);
};

const pmulT = (a, b) => { const o = new Array(a.length + b.length - 1).fill(0); a.forEach((x, i) => b.forEach((y, j) => { o[i + j] += x * y; })); return o; };
// quadratic coefficients [a, b, c] of f(x) given as a function
const quadOf = (f) => { const f0 = f(0), f1 = f(1), f2 = f(2), a = (f2 - 2 * f1 + f0) / 2; return [a, f1 - f0 - a, f0]; };

V['F1-09'] = (item) => {
  const ms = mathsOf(item.prompt);
  if (item.type === 'expr') {
    const f = (x) => num(texToCalc(ms[0]), { x });
    const [A, B, C] = quadOf(f);
    for (const xv of [-2.5, 0.3, 1.7, 4.1]) assert(close(f(xv), num(item.answer, { x: xv }), 1e-8 * Math.max(1, Math.abs(f(xv)))), 'answer differs from the prompt at x=' + xv);
    const lead = /^(\d*)\(/.exec(item.answer);
    assert(lead, 'answer should be a product of brackets: ' + item.answer);
    const k = lead[1] === '' ? 1 : Number(lead[1]);
    const facs = (item.answer.match(/\([^()]*\)/g) || []).map((s) => {
      const m = /^\((-?\d*)x([+-]\d+)\)$/.exec(s);
      assert(m, 'bad factor ' + s);
      const a = m[1] === '' ? 1 : m[1] === '-' ? -1 : Number(m[1]);
      assert(a > 0 && T.gcd(a, Number(m[2])) === 1, 'factor not in lowest terms: ' + s);
      return [Number(m[2]), a];
    });
    assert(facs.length === 2, 'expected two linear factors');
    const prod = pmulT(pmulT(facs[0], facs[1]), [k]);
    assert(prod[0] === C && prod[1] === B && prod[2] === A, 'factors multiply to ' + prod + ' not ' + [C, B, A]);
    assert(k === T.gcd(T.gcd(A, B), C), 'common factor not fully pulled out: ' + item.answer);
    return;
  }
  const [lhs, rhs] = ms[0].split('=');
  const f = (x) => num(texToCalc(lhs), { x }) - num(texToCalc(rhs), { x });
  const [A, B, C] = quadOf(f), D = B * B - 4 * A * C;
  const want = D > 1e-9 ? 2 : Math.abs(D) <= 1e-9 ? 1 : 0;
  if (want === 0) { assert(item.answer === 'none', 'no real roots, so the answer should be none; got ' + item.answer); return; }
  const roots = listVals(item.answer);
  assert(roots.length === want, 'expected ' + want + ' roots, got ' + roots.length + ' in ' + item.answer);
  roots.forEach((x) => assert(Math.abs(f(x)) < 1e-9 * Math.max(1, Math.abs(A) * x * x), 'root ' + x + ' does not solve the equation (f=' + f(x) + ')'));
  if (want === 2) assert(Math.abs(roots[0] - roots[1]) > 1e-9, 'repeated root listed twice');
  for (let i = 1; i < roots.length; i++) assert(roots[i] > roots[i - 1], 'roots not ascending');
  assert(item.prompt.includes('`none`'), 'prompt should mention none');
  if (item.meta.kind === 'frm') assert(Math.sqrt(D) % 1 !== 0, 'discriminant is a perfect square');
  else assert(roots.every((x) => { const d = [1, 2, 3, 4, 5, 6, 7, 8].find((q) => Math.abs(x * q - Math.round(x * q)) < 1e-9); return d !== undefined; }), 'roots should be simple fractions');
};

V['F1-10'] = (item) => {
  const ms = mathsOf(item.prompt);
  const fracTex = ms.find((t) => t.startsWith('\\frac'));
  const m = fracTex && /^\\frac\{(.*)\}\{(.*)\}$/.exec(fracTex);
  assert(m, 'prompt has no single fraction: ' + ms.join(' | '));
  const D = (x) => num(texToCalc(m[2]), { x });
  if (item.type === 'expr') {
    const f = (x) => num(texToCalc(fracTex), { x });
    for (const xv of [0.37, 2.61, -3.17, 7.43, 12.1, 13.5]) {
      const a = f(xv), b = num(item.answer, { x: xv });
      assert(close(a, b, 1e-8 * Math.max(1, Math.abs(a))), 'at x=' + xv + ' the prompt is ' + a + ' but the answer is ' + b);
    }
    const { ansNum, ansDen } = item.meta, ev = (c, x) => c.reduceRight((s, k) => s * x + k, 0);
    for (let r0 = -30; r0 <= 30; r0++) assert(!(Math.abs(ev(ansNum, r0)) < 1e-9 && Math.abs(ev(ansDen, r0)) < 1e-9), 'answer not fully reduced (common root ' + r0 + ')');
    const [lo, hi] = item.domain.match(/-?[\d.]+(?=\.\.|$)/g).map(Number);
    for (let t = lo; t <= hi; t += 0.05) assert(Math.abs(D(t)) > 1e-6, 'domain ' + item.domain + ' contains an excluded value');
    return;
  }
  const [A, B, C] = quadOf(D);
  let want;
  if (Math.abs(A) < 1e-12) want = 1; else { const disc = B * B - 4 * A * C; want = disc > 1e-9 ? 2 : Math.abs(disc) <= 1e-9 ? 1 : 0; }
  if (want === 0) { assert(item.answer === 'none', 'expected none, got ' + item.answer); return; }
  const roots = listVals(item.answer);
  assert(roots.length === want, 'expected ' + want + ' excluded values, got ' + item.answer);
  roots.forEach((x) => assert(Math.abs(D(x)) < 1e-9, 'denominator is not zero at ' + x));
  for (let i = 1; i < roots.length; i++) assert(roots[i] > roots[i - 1], 'not ascending');
  assert(item.prompt.includes('`none`'), 'prompt should mention none');
};

V['F1-11'] = (item) => {
  const ms = mathsOf(item.prompt), defs = {};
  ms.forEach((m) => { const q = /^([fg])\(x\)\s*=\s*(.*)$/.exec(m); if (q) defs[q[1]] = texToCalc(q[2]); });
  assert(defs.f, 'no definition of f in the prompt');
  const F = (name, x) => num(defs[name], { x });
  if (item.type === 'expr') {
    assert(item.lead === '$f^{-1}(x) =$' && item.vars.length === 1 && item.vars[0] === 'x', 'lead/vars');
    const xs = item.domain ? [10, 11, 12.5, 13, 14] : [-7, -3, -1, 2, 5, 10, 14];
    xs.forEach((x) => {
      const y = num(item.answer, { x });
      assert(close(F('f', y), x, 1e-7), 'f(f^-1(' + x + ')) = ' + F('f', y));
    });
  } else {
    const q = ms[ms.length - 1], ans = num(item.answer);
    let m, exp;
    if ((m = /^f\^\{-1\}\((-?\d+)\)$/.exec(q))) {
      assert(Number.isInteger(ans), 'inverse value should be an integer');
      assert(close(F('f', ans), Number(m[1])), 'f(answer) = ' + F('f', ans) + ', not ' + m[1]);
      return;
    } else if ((m = /^([fg])\(([fg])\((-?\d+)\)\)$/.exec(q))) exp = F(m[1], F(m[2], Number(m[3])));
    else if ((m = /^([fg])\((-?\d+)\)$/.exec(q))) exp = F(m[1], Number(m[2]));
    else assert(false, 'unrecognised query ' + q);
    assert(close(exp, ans), 'prompt evaluates to ' + exp + ' but answer is ' + item.answer);
    lowestTerms(item.answer);
  }
};

// evaluate TeX that contains \log_{b} N terms (and plain \ln, \log) with the checker's evaluator
const logCalc = (tex) => texToCalc(String(tex)
  .replace(/\\sqrt\[(\d+)\]\{([^{}]*)\}/g, '(($2)^(1/$1))')
  .replace(/(\d)\s*\\log_\{(\d+)\}/g, '$1*\\log_{$2}')
  .replace(/\\log_\{(\d+)\}\s*\(([^()]*(?:\([^()]*\))?[^()]*)\)/g, '(ln($2)/ln($1))')
  .replace(/\\log_\{(\d+)\}\s*(\d+(?:\.\d+)?)/g, '(ln($2)/ln($1))')
  .replace(/\\ln\s*(\d+)/g, 'ln($1)').replace(/\\log\s*(\d+)/g, 'log($1)'));

V['F1-12'] = (item) => {
  const kind = item.meta.kind, ms = mathsOf(item.prompt), ans = num(item.answer);
  if (kind === 'logval' || kind === 'logfrac' || kind === 'logspec' || kind === 'loglaw') {
    const exp = num(logCalc(ms[0]));
    assert(close(exp, ans, 1e-9), 'prompt evaluates to ' + exp + ' but answer is ' + item.answer);
    if (kind === 'logfrac') { lowestTerms(item.answer); assert(!Number.isInteger(ans), 'fractional answer expected'); }
    else if (kind !== 'logspec' || /^-?\d+$/.test(item.answer)) lowestTerms(item.answer);
  } else if (kind === 'solveexp') {
    const sides = texToCalc(ms[ms.length - 1]).split('=');
    assert(sides.length === 2, 'expected one equation');
    lowestTerms(item.answer);
    const at = (x) => [num(sides[0], { x }), num(sides[1], { x })];
    const [l0, r0] = at(ans);
    assert(close(l0, r0, 1e-9), 'substituting ' + item.answer + ' gives ' + l0 + ' vs ' + r0);
    const [l1, r1] = at(ans + 0.5);
    assert(!close(l1, r1, 1e-9), 'not a single-solution exponential equation');
    assert(ans !== 0 && Math.abs(ans) <= 12, 'solution out of range: ' + ans);
  } else if (kind === 'solvelog') {
    const eqn = ms[ms.length - 1], m = /^\\log_\{(\d+)\}\s*(x|\((.*)\))\s*=\s*(\d+)$/.exec(eqn);
    assert(m, 'cannot parse ' + eqn);
    assert(Number.isInteger(ans) && ans > 0, 'solution should be a positive integer');
    const argv = m[2] === 'x' ? ans : num(texToCalc(m[3]), { x: ans });
    assert(argv > 0, 'argument not positive: ' + argv);
    assert(close(Math.log(argv) / Math.log(Number(m[1])), Number(m[4]), 1e-9), 'log_' + m[1] + '(' + argv + ') is not ' + m[4]);
  } else if (kind === 'evalexp') {
    const d = /^f\(x\)\s*=\s*(.*)$/.exec(ms[0]), q = /^f\((-?\d+)\)$/.exec(ms[1]);
    assert(d && q, 'cannot parse the prompt');
    const exp = num(texToCalc(d[1]), { x: Number(q[1]) });
    assert(close(exp, ans, 1e-9), 'prompt evaluates to ' + exp + ' but answer is ' + item.answer);
    lowestTerms(item.answer);
    assert(/fraction/.test(item.prompt) === !Number.isInteger(ans), 'fraction instruction mismatch');
  } else if (kind === 'growth') {
    const { form, P, r, t, h, dp, money } = item.meta, text = item.prompt;
    const exp = form === 'grow' ? P * Math.pow(1 + r / 100, t) : form === 'decay' ? P * Math.pow(1 - r / 100, t)
      : form === 'half' ? P * Math.pow(0.5, t / h) : P * Math.exp(r * t / 100);
    const half = dp === 0 ? 0.5 : 0.005;
    assert(close(exp, ans, half), 'expected ' + exp + ' got ' + ans);
    assert(item.answer === exp.toFixed(dp), 'answer text ' + item.answer + ' vs ' + exp.toFixed(dp));
    assert(item.tol === (dp === 0 ? '0.5' : '0.005'), 'tol ' + item.tol);
    const want = /nearest (whole number|dollar)/.test(text) ? 0 : /nearest cent|two decimal places/.test(text) ? 2 : -1;
    assert(want === dp, 'rounding instruction does not match dp=' + dp);
    const sc = Math.abs(exp) * Math.pow(10, dp), f = sc - Math.floor(sc);
    assert(Math.abs(f - 0.5) >= 0.05, 'too close to a rounding boundary: ' + exp);
    const has = (n) => new RegExp('(?<![\\d.])' + String(n).replace('.', '\\.') + '(?![\\d])').test(text);
    [P, t].forEach((n) => assert(has(n), 'prompt does not contain ' + n));
    if (form === 'half') assert(has(h), 'prompt does not contain ' + h);
    else if (form === 'cont' && !money) assert(has(Math.round(r) / 100) || has(String(r / 100)), 'prompt does not contain the rate');
    else assert(has(r), 'prompt does not contain ' + r);
    if (form === 'half') assert(item.unit === 'mg', 'unit');
    // the hint numbers agree with the prompt: no stray numbers in the solution besides these
    assert(exp > 0 && exp < 200000, 'size');
  } else assert(false, 'unknown kind ' + kind);
};

// ---------- F2 toolbox ----------
// TeX with trig functions -> calculator syntax: \sin^2 x, \sin 2x, \sin\left(...\right), \sin\frac{a}{b}, \sin 40^\circ, \sin^{-1}, \arcsin
function trigCalc(tex) {
  let s = String(tex).replace(/\\left\(/g, '(').replace(/\\right\)/g, ')').replace(/\\left\|/g, 'abs(').replace(/\\right\|/g, ')');
  s = s.replace(/(\d+(?:\.\d+)?)\s*\^\{?\\circ\}?/g, '($1*pi/180)');
  const re = /\\(sin|cos|tan|sec|csc|cot|arcsin|arccos|arctan)(?![a-zA-Z])/;
  const balanced = (str, i, open, close) => { let depth = 0, j = i; for (; j < str.length; j++) { if (str[j] === open) depth++; else if (str[j] === close) { depth--; if (depth === 0) break; } } return j; };
  for (let guard = 0; guard < 100; guard++) {
    const m = re.exec(s);
    if (!m) break;
    let name = m[1], i = m.index + m[0].length, pow = null;
    const pm = /^\^(?:\{(-?\d+)\}|(-?\d))/.exec(s.slice(i));
    if (pm) { pow = pm[1] !== undefined ? pm[1] : pm[2]; i += pm[0].length; }
    while (s[i] === ' ') i++;
    let arg, end;
    if (s[i] === '(') { end = balanced(s, i, '(', ')') + 1; arg = s.slice(i, end); }
    else if (s.startsWith('\\frac', i)) {
      let j = i + 5;
      for (let g2 = 0; g2 < 2; g2++) { if (s[j] !== '{') break; j = balanced(s, j, '{', '}') + 1; }
      arg = '(' + s.slice(i, j) + ')'; end = j;
    } else {
      const tm = /^(\d+(?:\.\d+)?\\pi|\\pi|\d*\.?\d*[a-zA-Z]|\d+(?:\.\d+)?)/.exec(s.slice(i));
      if (!tm) throw new Error('trigCalc: cannot find the argument in ' + s.slice(m.index));
      arg = '(' + tm[1] + ')'; end = i + tm[1].length;
    }
    if (pow === '-1' && (name === 'sin' || name === 'cos' || name === 'tan')) { name = 'arc' + name; pow = null; }
    const call = name + arg;
    s = s.slice(0, m.index) + (pow === null ? call : '(' + call + ')^(' + pow + ')') + s.slice(end);
  }
  return texToCalc(s);
}
const D2R = Math.PI / 180;
// evaluate TeX that may hold degrees, trig functions, fractions and radicals
const tnum = (tex, env) => num(trigCalc(tex), env);
// a degree-valued answer string / TeX such as "150" -> number
const angleOf = (tex) => { const m = /^\s*(-?\d+(?:\.\d+)?)\s*\^\{?\\circ\}?\s*$/.exec(tex); return m ? Number(m[1]) * D2R : tnum(tex); };

V['F2-01'] = (item) => {
  const kind = item.meta.kind, p = item.prompt, ms = mathsOf(p), ans = item.type === 'num' ? num(item.answer) : NaN;
  const circ = (tex) => /\\circ/.test(tex);
  if (kind === 'd2r') {
    const deg = Number(/(-?\d+)\^\\circ/.exec(ms[0])[1]);
    assert(close(deg * Math.PI / 180, ans, 1e-9), deg + ' degrees is ' + deg * Math.PI / 180 + ' radians, not ' + item.answer);
    assert(/pi/.test(item.answer) || deg === 0, 'answer should be a multiple of pi');
  } else if (kind === 'r2d') {
    const rad = tnum(ms[0]);
    assert(close(rad * 180 / Math.PI, ans, 1e-7), 'expected ' + rad * 180 / Math.PI + ' got ' + item.answer);
    assert(item.unit === '°' && Number.isInteger(ans), 'unit/integer');
  } else if (kind === 'arc' || kind === 'arcr' || kind === 'sector') {
    const rad = /radius (\d+)/.exec(p), len = /arc of length \$([^$]*)\$/.exec(p);
    const angTex = ms.find((m) => /\\pi|\\circ/.test(m) && m !== (len && len[1]));
    const theta = angleOf(angTex);
    if (kind === 'arc') { const R = Number(rad[1]); assert(close(R * theta, ans, 1e-9), 'arc length is ' + R * theta + ' not ' + ans); }
    else if (kind === 'sector') { const R = Number(rad[1]); assert(close(0.5 * R * R * theta, ans, 1e-9), 'sector area is ' + 0.5 * R * R * theta + ' not ' + ans); }
    else { assert(close(tnum(len[1]) / theta, ans, 1e-9), 'radius is ' + tnum(len[1]) / theta + ' not ' + ans); assert(Number.isInteger(ans), 'radius should be an integer'); }
    if (kind !== 'arcr') assert(!circ(angTex) || kind === 'arc', 'degrees only appear in arc problems');
  } else if (kind === 'cotR') {
    const angle = tnum(ms[ms.length - 1]);
    assert(ans >= 0 && ans < 2 * Math.PI - 1e-12, 'answer not in [0, 2pi)');
    const k = (angle - ans) / (2 * Math.PI);
    assert(close(k, Math.round(k), 1e-9) && Math.round(k) !== 0, 'not coterminal: ' + angle + ' vs ' + ans);
  } else if (kind === 'cotD') {
    const angle = Number(/(-?\d+)\^\\circ\$\./.exec(p)[1]);
    assert(ans >= 0 && ans < 360, 'answer not in [0, 360)');
    assert(((angle - ans) % 360) === 0 && angle !== ans, 'not coterminal');
    assert(item.unit === '°', 'unit');
  } else assert(false, 'unknown kind ' + kind);
};

V['F2-02'] = (item) => {
  const kind = item.meta.kind, p = item.prompt, ms = mathsOf(p);
  const undef = (v) => !Number.isFinite(v) || Math.abs(v) > 1e9;
  if (kind === 'val') {
    let val, isU = false;
    try { val = tnum(ms[0]); isU = undef(val); } catch (e) { isU = true; }
    if (isU) { assert(item.answer === 'dne', 'expected dne, got ' + item.answer + ' for ' + ms[0]); assert(/dne/.test(p), 'prompt should mention dne'); }
    else { assert(item.answer !== 'dne', 'answer is dne but the value is ' + val); assert(close(val, num(item.answer), 1e-9), ms[0] + ' = ' + val + ' but answer is ' + item.answer); }
  } else if (kind === 'pt') {
    const th = tnum(ms[0].replace(/^\\theta\s*=\s*/, '')), [x, y] = tupleVals(item.answer);
    assert(close(Math.cos(th), x, 1e-9) && close(Math.sin(th), y, 1e-9), 'point is (' + Math.cos(th) + ', ' + Math.sin(th) + ') but answer is ' + item.answer);
  } else if (kind === 'ref') {
    const a = nmodT(angleOf(ms[0]), 2 * Math.PI);
    const ref = a <= Math.PI / 2 ? a : a <= Math.PI ? Math.PI - a : a <= 1.5 * Math.PI ? a - Math.PI : 2 * Math.PI - a;
    const got = num(item.answer);
    const exp = item.unit === '°' ? ref * 180 / Math.PI : ref;
    assert(close(exp, got, 1e-7), 'reference angle is ' + exp + ' but answer is ' + item.answer);
    assert(ref > 1e-9 && ref < Math.PI / 2 + 1e-9, 'reference angle must be acute');
  } else if (kind === 'pyth') {
    const m = /\$\\(sin|cos|tan)\\theta = (-?)\\frac\{(\d+)\}\{(\d+)\}\$ and \$\\theta\$ is in quadrant (I|II|III|IV)\. Find \$\\(sin|cos|tan)\\theta\$/.exec(p);
    assert(m, 'cannot parse the prompt');
    const g = m[1], v = (m[2] ? -1 : 1) * Number(m[3]) / Number(m[4]), q = ['I', 'II', 'III', 'IV'].indexOf(m[5]) + 1, h = m[6];
    const sxn = q === 1 || q === 4 ? 1 : -1, syn = q <= 2 ? 1 : -1;
    let sin, cos, tan;
    if (g === 'sin') { sin = v; cos = sxn * Math.sqrt(1 - v * v); tan = sin / cos; assert(Math.sign(v) === syn, 'sign of the given sine does not match the quadrant'); }
    else if (g === 'cos') { cos = v; sin = syn * Math.sqrt(1 - v * v); tan = sin / cos; assert(Math.sign(v) === sxn, 'sign of the given cosine does not match the quadrant'); }
    else { tan = v; cos = sxn / Math.sqrt(1 + v * v); sin = tan * cos; assert(Math.sign(v) === sxn * syn, 'sign of the given tangent does not match the quadrant'); }
    assert(g !== h, 'asked for the given function');
    const exp = { sin, cos, tan }[h];
    assert(close(exp, num(item.answer), 1e-9), h + ' is ' + exp + ' but answer is ' + item.answer);
    lowestTerms(item.answer);
  } else assert(false, 'unknown kind ' + kind);
};
const nmodT = (a, m) => ((a % m) + m) % m;

V['F2-03'] = (item) => {
  const kind = item.meta.kind, p = item.prompt, ms = mathsOf(p);
  if (kind === 'maxmin') {
    const m = /maximum value of (-?\d+) and a minimum value of (-?\d+)/.exec(p);
    const [a, k] = tupleVals(item.answer);
    assert(close((Number(m[1]) - Number(m[2])) / 2, a) && close((Number(m[1]) + Number(m[2])) / 2, k), 'amplitude/midline mismatch');
    assert(a > 0, 'amplitude must be positive');
    return;
  }
  if (kind === 'findB') {
    const q = /y = (\d)\\(sin|cos)\(Bx\)\$, with \$B > 0\$, has period \$([^$]*)\$/.exec(p);
    assert(q, 'cannot parse the prompt');
    const P = tnum(q[3]), B = num(item.answer);
    assert(close(2 * Math.PI / B, P, 1e-9), 'period of the answer is ' + 2 * Math.PI / B + ', not ' + P);
    // numeric check that cos(Bx)/sin(Bx) really repeats with period P and not with P/2
    const f = (x) => (q[2] === 'sin' ? Math.sin(B * x) : Math.cos(B * x));
    assert(close(f(0.37 + P), f(0.37), 1e-9) && !close(f(0.37 + P / 2), f(0.37), 1e-6), 'period check failed');
    return;
  }
  const eq = ms.find((t) => /^y\s*=/.test(t));
  const fexpr = trigCalc(eq.replace(/^y\s*=\s*/, ''));
  const ast = Checker.parse(fexpr);
  const f = (x) => { const v = Checker.evaluate(ast, { x }); assert(v.re !== null && Number.isFinite(v.re), 'undefined value at ' + x); return v.re; };
  // sample the wave over a long window, then refine the extremes
  const step = 0.01, n = 12000, ys = [];
  let iHi = 0, iLo = 0;
  for (let i = 0; i <= n; i++) { const y = f(-60 + i * step); ys.push(y); if (y > ys[iHi]) iHi = i; if (y < ys[iLo]) iLo = i; }
  const refine = (i, sg) => { let best = ys[i]; for (let k = -1000; k <= 1000; k++) { const y = f(-60 + i * step + k * 1e-5); if (sg * y > sg * best) best = y; } return best; };
  const hi = refine(iHi, 1), lo = refine(iLo, -1), amp = (hi - lo) / 2, mid = (hi + lo) / 2;
  const got = num(item.answer);
  if (kind === 'amp') assert(close(amp, got, 1e-4), 'amplitude is ' + amp + ' but answer is ' + item.answer);
  else if (kind === 'mid') assert(close(mid, got, 1e-4), 'midline is ' + mid + ' but answer is ' + item.answer);
  else if (kind === 'max') assert(close(hi, got, 1e-4), 'maximum is ' + hi + ' but answer is ' + item.answer);
  else if (kind === 'min') assert(close(lo, got, 1e-4), 'minimum is ' + lo + ' but answer is ' + item.answer);
  else if (kind === 'period') {
    const peaks = [];
    for (let i = 1; i < n; i++) {
      if (ys[i] > ys[i - 1] && ys[i] >= ys[i + 1] && ys[i] > mid + 0.9 * amp) {
        const den = ys[i - 1] - 2 * ys[i] + ys[i + 1];
        peaks.push(-60 + i * step + (den === 0 ? 0 : step * (ys[i - 1] - ys[i + 1]) / (2 * den)));
      }
    }
    assert(peaks.length >= 3, 'could not find peaks');
    const period = peaks[1] - peaks[0];
    assert(close(period, got, 1e-4), 'period is ' + period + ' but answer is ' + item.answer);
    assert(close(peaks[2] - peaks[1], period, 1e-4), 'peaks not evenly spaced');
  } else if (kind === 'shift') {
    // sine: the curve is on its midline at the shift; cosine: it is at an extreme there
    const m = /\\(sin|cos)\\left\((.*)\\right\)/.exec(eq);
    const arg = (x) => tnum(m[2].replace(/\\left|\\right/g, ''), { x });
    const Bv = arg(1) - arg(0), Cv = -arg(0);
    assert(close(Cv / Bv, got, 1e-9), 'C/B is ' + Cv / Bv + ' but answer is ' + item.answer);
    if (m[1] === 'sin') assert(close(f(got), mid, 1e-3), 'sine does not cross its midline at the shift');
    else assert(close(Math.abs(f(got) - mid), amp, 1e-3), 'cosine is not at an extreme at the shift');
    assert(Math.abs(got) > 1e-9, 'zero shift');
  } else assert(false, 'unknown kind ' + kind);
};

V['F2-04'] = (item) => {
  const kind = item.meta.kind, p = item.prompt, ms = mathsOf(p), tex = ms[0];
  if (kind === 'trap') {
    assert(item.answer === 'dne' && /dne/.test(p), 'trap items must be answered dne');
    // the checker works over the complex numbers, so test the real domain directly: the input of arcsin / arccos must lie outside [-1, 1]
    const m = /\\(?:arcsin|arccos)\s*(.*)\\right\)$/.exec(tex);
    assert(m, 'cannot parse ' + tex);
    assert(Math.abs(tnum(m[1])) > 1, 'the input of the inverse function is inside [-1, 1]: ' + tex);
    return;
  }
  const val = tnum(tex);
  assert(close(val, num(item.answer), 1e-9), tex + ' = ' + val + ' but answer is ' + item.answer);
  if (kind === 'val' || kind === 'undo') {
    assert(/radians/.test(p), 'prompt should ask for radians');
    const head = /^\\(arcsin|arccos|arctan|sin\^\{-1\}|cos\^\{-1\}|tan\^\{-1\})/.exec(tex);
    assert(head, 'unexpected shape ' + tex);
    const [lo, hi] = /sin/.test(head[1]) ? [-Math.PI / 2, Math.PI / 2] : /cos/.test(head[1]) ? [0, Math.PI] : [-Math.PI / 2, Math.PI / 2];
    assert(val >= lo - 1e-12 && val <= hi + 1e-12, 'answer ' + val + ' outside the principal range');
    if (/tan/.test(head[1])) assert(Math.abs(val) < Math.PI / 2 - 1e-9, 'arctan range is open');
  } else if (kind === 'comp') lowestTerms(item.answer);
  else assert(false, 'unknown kind ' + kind);
};

V['F2-05'] = (item) => {
  const ms = mathsOf(item.prompt);
  assert(ms.length === 1, 'expected one math segment in the prompt');
  const calc = trigCalc(ms[0]), m = /^x: ?([\d.]+)\.\.([\d.]+)$/.exec(item.domain);
  assert(m && item.vars.length === 1 && item.vars[0] === 'x', 'domain / vars');
  const lo = Number(m[1]), hi = Number(m[2]), ast = Checker.parse(calc);
  for (let i = 0; i < 16; i++) {
    const x = lo + (hi - lo) * (i + 0.5) / 16;
    const a = Checker.evaluate(ast, { x }), b = num(item.answer, { x });
    assert(a.re !== null && Math.abs(a.im) < 1e-12 && Number.isFinite(a.re), 'expression undefined at ' + x);
    assert(close(a.re, b, 1e-9 * Math.max(1, Math.abs(b))), 'at x=' + x + ' the expression is ' + a.re + ' but the answer is ' + b);
  }
  assert(item.answer !== calc.replace(/\s+/g, ''), 'answer repeats the expression');
};

// numerical roots of f on [0, 2pi): sign changes (poles rejected) and tangential zeros
const explicitMul = (s) => s.replace(/\)\s*(?=[a-zA-Z(\d])/g, ')*').replace(/(\d)\s*(?=[a-zA-Z(])/g, '$1*');
function scanRoots(f) {
  const N = 6000, h = 2 * Math.PI / N, xs = [], vs = [], found = [];
  for (let i = -1; i <= N + 1; i++) { xs.push(i * h); vs.push(f(i * h)); }
  const add = (x) => {
    if (x < -1e-7 || x > 2 * Math.PI - 1e-7) return;
    if (!found.some((y) => Math.abs(y - x) < 1e-6)) found.push(Math.max(x, 0));
  };
  for (let i = 0; i < xs.length - 1; i++) {
    const a = vs[i], b = vs[i + 1];
    if (!Number.isFinite(a) || !Number.isFinite(b)) continue;
    if (a === 0) { add(xs[i]); continue; }
    if ((a < 0) !== (b < 0) && b !== 0) {
      let lo = xs[i], hi = xs[i + 1], flo = a;
      for (let k = 0; k < 80; k++) { const mid = (lo + hi) / 2, fm = f(mid); if ((fm < 0) === (flo < 0)) { lo = mid; flo = fm; } else hi = mid; }
      const xr = (lo + hi) / 2;
      if (Math.abs(f(xr)) < 1e-7) add(xr);
    }
  }
  for (let i = 1; i < xs.length - 1; i++) {
    const a = Math.abs(vs[i - 1]), b = Math.abs(vs[i]), c = Math.abs(vs[i + 1]);
    if (b <= a && b <= c && b < 1e-3) {
      let lo = xs[i - 1], hi = xs[i + 1];
      for (let k = 0; k < 100; k++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if (Math.abs(f(m1)) < Math.abs(f(m2))) hi = m2; else lo = m1; }
      const xr = (lo + hi) / 2;
      if (Math.abs(f(xr)) < 1e-9) add(xr);
    }
  }
  return found.sort((p, q) => p - q);
}

V['F2-06'] = (item) => {
  const ms = mathsOf(item.prompt), eq = ms.find((m) => m.includes('='));
  assert(eq && ms.some((m) => /^0 \\le x < 2\\pi$/.test(m)), 'prompt needs an equation and the interval 0 <= x < 2pi');
  const sides = eq.split('=');
  assert(sides.length === 2, 'one equals sign expected in ' + eq);
  const L = Checker.parse(explicitMul(trigCalc(sides[0]))), R = Checker.parse(explicitMul(trigCalc(sides[1])));
  const f = (x) => { const a = Checker.evaluate(L, { x }), b = Checker.evaluate(R, { x }); return a.re === null || b.re === null ? NaN : a.re - b.re; };
  const got = item.answer === 'none' ? [] : listVals(item.answer);
  got.forEach((x, i) => {
    assert(x >= 0 && x < 2 * Math.PI - 1e-9, 'solution ' + x + ' is outside [0, 2pi)');
    assert(i === 0 || x > got[i - 1] + 1e-9, 'solutions are not strictly increasing');
    assert(Math.abs(f(x)) < 1e-9, 'x = ' + x + ' does not satisfy ' + eq + ' (difference ' + f(x) + ')');
  });
  const roots = scanRoots(f);
  assert(roots.length === got.length, 'numerical scan found ' + roots.length + ' roots (' + roots.map((x) => (x / Math.PI).toFixed(4) + 'pi').join(', ') + ') but the answer is ' + item.answer);
  roots.forEach((x, i) => assert(Math.abs(x - got[i]) < 1e-6, 'root ' + x + ' differs from the answer value ' + got[i]));
};

// ---- F2-07 triangles: rebuild each triangle from coordinates and measure the wanted quantity ----
const dpOfTol = (tol) => (tol === '0.005' ? 2 : tol === '0.05' ? 1 : NaN);
const hasNum = (prompt, x) => (prompt.match(/\d+(?:\.\d+)?/g) || []).includes(String(x));
const hyp2 = (a, b) => Math.sqrt(a * a + b * b);
function rayTriangle(th1, th2) {                 // base from V1=(0,0) to V2=(1,0); angles th1 at V1, th2 at V2; returns the apex V0
  const d1 = [Math.cos(th1 * D2R), Math.sin(th1 * D2R)], d2 = [-Math.cos(th2 * D2R), Math.sin(th2 * D2R)];
  const det = d1[0] * -d2[1] - -d2[0] * d1[1];     // solve t*d1 - s*d2 = (1, 0)
  const t = (1 * -d2[1] - -d2[0] * 0) / det;
  return [t * d1[0], t * d1[1]];
}

V['F2-07'] = (item) => {
  const m = item.meta, ans = num(item.answer), dist = (P, Q) => hyp2(P[0] - Q[0], P[1] - Q[1]);
  const angleAt = (P, Q, R) => { const u = [Q[0] - P[0], Q[1] - P[1]], v = [R[0] - P[0], R[1] - P[1]]; return Math.acos((u[0] * v[0] + u[1] * v[1]) / (hyp2(u[0], u[1]) * hyp2(v[0], v[1]))) / D2R; };
  let expected;
  if (m.kind === 'rtside') {
    assert(hasNum(item.prompt, m.theta) && hasNum(item.prompt, m.gv), 'prompt lacks the givens');
    const opposite = { opp: m.theta, adj: 90 - m.theta, hyp: 90 };            // angle opposite each side (law of sines in the right triangle)
    expected = m.gv * Math.sin(opposite[m.w] * D2R) / Math.sin(opposite[m.g] * D2R);
  } else if (m.kind === 'rtang') {
    let { opp, adj, hyp } = m;
    if (opp === null) opp = Math.sqrt(hyp * hyp - adj * adj);
    if (adj === null) adj = Math.sqrt(hyp * hyp - opp * opp);
    if (hyp === null) hyp = hyp2(opp, adj);
    assert(close(hyp2(opp, adj), hyp, 1e-9), 'not a right triangle');
    [m.opp, m.adj, m.hyp].filter((x) => x !== null).forEach((x) => assert(hasNum(item.prompt, x), 'prompt lacks ' + x));
    expected = Math.atan2(opp, adj) / D2R;
  } else if (m.kind === 'exact') {
    const opposite = { opp: m.theta, adj: 90 - m.theta, hyp: 90 };
    expected = m.gv * Math.sin(opposite[m.w] * D2R) / Math.sin(opposite[m.g] * D2R);
    assert(close(ans, expected, 1e-9), 'exact answer ' + ans + ' differs from ' + expected);
    assert(hasNum(item.prompt, m.theta) && hasNum(item.prompt, m.gv), 'prompt lacks the givens');
    return;
  } else if (m.kind === 'sinside') {
    const a = m.angs; assert(a[0] + a[1] + a[2] === 180 && a.every((x) => x > 0), 'angles do not sum to 180');
    const V1 = [0, 0], V2 = [1, 0], V0 = rayTriangle(a[1], a[2]);
    assert(close(angleAt(V0, V1, V2), a[0], 1e-6), 'constructed triangle has the wrong apex angle');
    const side = [dist(V1, V2), dist(V0, V2), dist(V0, V1)];                 // side i is opposite vertex i
    expected = m.gv * side[m.wi] / side[m.gi];
    assert(hasNum(item.prompt, m.gv), 'prompt lacks the given side');
  } else if (m.kind === 'sinang') {
    const I = [0, 0], K = [m.aj, 0];
    const t = m.aj * Math.cos(m.Ai * D2R) + Math.sqrt(m.aj * m.aj * Math.cos(m.Ai * D2R) ** 2 - m.aj * m.aj + m.ai * m.ai);
    const J = [t * Math.cos(m.Ai * D2R), t * Math.sin(m.Ai * D2R)];
    assert(close(dist(J, K), m.ai, 1e-9) && close(dist(I, K), m.aj, 1e-9), 'bad construction');
    expected = angleAt(J, I, K);
    [m.ai, m.aj, m.Ai].forEach((x) => assert(hasNum(item.prompt, x), 'prompt lacks ' + x));
  } else if (m.kind === 'cosside') {
    const I = [0, 0], K = [m.bj, 0], J = [m.ck * Math.cos(m.Ai * D2R), m.ck * Math.sin(m.Ai * D2R)];
    expected = dist(J, K);
    [m.bj, m.ck, m.Ai].forEach((x) => assert(hasNum(item.prompt, x), 'prompt lacks ' + x));
  } else if (m.kind === 'cosang') {
    const s = m.sides, o = [0, 1, 2].filter((i) => i !== m.wi), sw = s[m.wi];
    assert(s[o[0]] + s[o[1]] > sw && s[o[0]] + sw > s[o[1]] && s[o[1]] + sw > s[o[0]], 'triangle inequality');
    const wx = s[o[1]], wy = s[o[0]];                                         // |WX| is the side opposite Y, |WY| the side opposite X
    const px = (wy * wy - sw * sw + wx * wx) / (2 * wx), py = Math.sqrt(wy * wy - px * px);
    expected = Math.atan2(py, px) / D2R;
    s.forEach((x) => assert(hasNum(item.prompt, x), 'prompt lacks ' + x));
  } else assert(false, 'unknown kind ' + m.kind);
  const dp = dpOfTol(item.tol);
  assert(Number.isInteger(dp), 'unexpected tol ' + item.tol);
  assert(expected.toFixed(dp) === item.answer, 'expected ' + expected.toFixed(dp) + ' (' + expected + ') but the answer is ' + item.answer);
  assert(close(ans, expected, Number(item.tol)), 'answer is not within tol of the exact value');
  if (m.kind === 'rtang' || m.kind === 'sinang' || m.kind === 'cosang') assert(item.unit === '°', 'angle answers should carry the degree unit');
};

// ---- F2-08 polar coordinates ----
const firstPoint = (prompt) => {                 // the first \left(a, b\right) in the prompt -> [aTeX, bTeX]
  const seg = mathsOf(prompt).find((m) => m.startsWith('\\left(') && m.endsWith('\\right)'));
  assert(seg, 'no point found in the prompt');
  return splitTop(seg.slice(6, -7));
};

V['F2-08'] = (item) => {
  const m = item.meta, ans = tupleVals(item.answer);
  assert(ans.length === 2, 'answer should be a pair');
  const TWO_PI = 2 * Math.PI;
  if (m.kind === 'r2pS' || m.kind === 'r2pN') {
    const [xT, yT] = firstPoint(item.prompt), x = tnum(xT), y = tnum(yT);
    assert(close(x, m.x, 1e-9) && close(y, m.y, 1e-9), 'prompt point differs from the generator point');
    const R = Math.hypot(x, y);
    let th = Math.atan2(y, x); if (th < 0) th += TWO_PI; if (Math.abs(th) < 1e-12) th = 0;
    assert(ans[0] > 0 && ans[1] >= 0 && ans[1] < TWO_PI, 'r must be positive and theta in [0, 2pi)');
    if (m.kind === 'r2pS') assert(close(ans[0], R, 1e-9) && close(ans[1], th, 1e-9), 'expected (' + R + ', ' + th + ') but the answer is ' + item.answer);
    else {
      const toks = splitTop(unparen(item.answer));
      assert(item.tol === '0.005', 'tol should be 0.005');
      assert(toks[0] === String(Math.round(R)) && close(R, Math.round(R), 1e-9), 'r should be the integer ' + R);
      assert(toks[1] === th.toFixed(2), 'theta should be ' + th.toFixed(2) + ' but the answer says ' + toks[1]);
      assert(Math.abs(Number(toks[1]) - th) <= 0.005, 'theta is not within tol');
    }
    if (m.kind === 'r2pN') assert(Math.abs(ans[0] * Math.cos(ans[1]) - x) <= ans[0] * 0.0051 && Math.abs(ans[0] * Math.sin(ans[1]) - y) <= ans[0] * 0.0051, 'converting back does not give the original point');
    else assert(close(ans[0] * Math.cos(ans[1]), x, 1e-9) && close(ans[0] * Math.sin(ans[1]), y, 1e-9), 'converting back does not give the original point');
  } else if (m.kind === 'p2r') {
    const [rT, aT] = firstPoint(item.prompt), rr = tnum(rT), th = angleOf(aT);
    assert(close(ans[0], rr * Math.cos(th), 1e-9) && close(ans[1], rr * Math.sin(th), 1e-9), 'expected (' + rr * Math.cos(th) + ', ' + rr * Math.sin(th) + ') but the answer is ' + item.answer);
  } else if (m.kind === 'norm') {
    const [rT, aT] = firstPoint(item.prompt), r0 = tnum(rT), t0 = tnum(aT);
    assert(ans[0] > 0 && ans[1] >= 0 && ans[1] < TWO_PI, 'r must be positive and theta in [0, 2pi)');
    assert(close(ans[0] * Math.cos(ans[1]), r0 * Math.cos(t0), 1e-9) && close(ans[0] * Math.sin(ans[1]), r0 * Math.sin(t0), 1e-9), 'answer is a different point');
    assert(close(ans[0], Math.abs(r0), 1e-12), 'r should be |r0|');
  } else assert(false, 'unknown kind ' + m.kind);
};

// ---- F2-09 vectors and components ----
V['F2-09'] = (item) => {
  const m = item.meta, has = (x) => assert(hasNum(item.prompt, Math.abs(x)), 'prompt lacks ' + x);
  if (m.kind === 'comp') {
    has(m.m); has(m.deg);
    const ex = m.m * Math.cos(m.deg * D2R), ey = m.m * Math.sin(m.deg * D2R), toks = splitTop(unparen(item.answer));
    assert(item.tol === '0.005' && toks[0] === ex.toFixed(2) && toks[1] === ey.toFixed(2), 'expected (' + ex.toFixed(2) + ', ' + ey.toFixed(2) + ') but the answer is ' + item.answer);
    assert(!toks.some((x) => /^-0\.0+$/.test(x)), 'negative zero');
  } else if (m.kind === 'compEx') {
    has(m.m);
    const a = tupleVals(item.answer), ex = m.m * Math.cos(m.deg * D2R), ey = m.m * Math.sin(m.deg * D2R);
    assert(close(a[0], ex, 1e-9) && close(a[1], ey, 1e-9), 'expected (' + ex + ', ' + ey + ') but the answer is ' + item.answer);
  } else if (m.kind === 'mag') {
    if (!m.P) { has(m.a); has(m.b); }
    if (m.P) { has(m.P[0]); has(m.P[1]); has(m.Q[0]); has(m.Q[1]); assert(m.Q[0] - m.P[0] === m.a && m.Q[1] - m.P[1] === m.b, 'points do not give the vector'); }
    assert(close(num(item.answer), Math.hypot(m.a, m.b), 1e-9), 'expected ' + Math.hypot(m.a, m.b) + ' but the answer is ' + item.answer);
  } else if (m.kind === 'unit') {
    has(m.a); has(m.b);
    const h = Math.hypot(m.a, m.b), a = tupleVals(item.answer);
    assert(close(a[0], m.a / h, 1e-9) && close(a[1], m.b / h, 1e-9) && close(Math.hypot(a[0], a[1]), 1, 1e-9), 'bad unit vector ' + item.answer);
  } else if (m.kind === 'dir') {
    has(m.a); has(m.b);
    let th = Math.atan2(m.b, m.a) / D2R; if (th < 0) th += 360;
    assert(item.tol === '0.05' && item.answer === th.toFixed(1) && item.unit === '°', 'expected ' + th.toFixed(1) + ' but the answer is ' + item.answer);
  } else if (m.kind === 'sum') {
    [...m.u, ...m.v].filter((x) => Math.abs(x) !== 1).forEach(has);     // i-j notation hides a coefficient of 1
    const a = tupleVals(item.answer);
    assert(a[0] === m.cu * m.u[0] + m.cv * m.v[0] && a[1] === m.cu * m.u[1] + m.cv * m.v[1], 'bad vector sum ' + item.answer);
    const expr = mathsOf(item.prompt).find((x) => /\\mathbf\{[uv]\}/.test(x) && !x.includes('='));
    assert(expr, 'expression missing from the prompt');
    const coef = (name) => { const mm = new RegExp('(-?)\\s*(\\d*)\\\\mathbf\\{' + name + '\\}').exec(expr.replace(/\s+/g, '')); return mm ? (mm[1] ? -1 : 1) * (mm[2] === '' ? 1 : Number(mm[2])) : NaN; };
    assert(coef('u') === m.cu && coef('v') === m.cv, 'prompt expression ' + expr + ' does not match ' + m.cu + 'u + ' + m.cv + 'v');
  } else if (m.kind === 'word') {
    has(m.a); has(m.b);
    assert(close(num(item.answer), Math.hypot(m.a, m.b), 1e-9), 'expected ' + Math.hypot(m.a, m.b) + ' but the answer is ' + item.answer);
  } else assert(false, 'unknown kind ' + m.kind);
};

// ---- F2-10 dot products ----
V['F2-10'] = (item) => {
  const m = item.meta, has = (x) => assert(hasNum(item.prompt, Math.abs(x)), 'prompt lacks ' + x);
  const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0), norm = (a) => Math.sqrt(dot(a, a));
  if (m.kind === 'dot') {
    m.u.concat(m.v).filter((x) => Math.abs(x) !== 1).forEach(has);
    // read the vectors back from the prompt as a second source
    const segs = mathsOf(item.prompt).filter((x) => x.includes('='));
    const parse = (tex) => { const body = tex.split('=')[1].trim(); if (body.startsWith('\\langle')) return body.replace(/\\langle|\\rangle/g, '').split(',').map(Number); const comps = [0, 0, 0]; (body.match(/-?\s*\d*\\mathbf\{[ijk]\}/g) || []).forEach((tm) => { const mm = /(-?)\s*(\d*)\\mathbf\{([ijk])\}/.exec(tm.replace(/\s+/g, '')); comps['ijk'.indexOf(mm[3])] = (mm[1] ? -1 : 1) * (mm[2] === '' ? 1 : Number(mm[2])); }); return comps.slice(0, m.u.length); };
    const pu = parse(segs[0]), pv = parse(segs[1]);
    assert(JSON.stringify(pu) === JSON.stringify(m.u) && JSON.stringify(pv) === JSON.stringify(m.v), 'prompt vectors differ from meta: ' + JSON.stringify([pu, pv]));
    assert(num(item.answer) === dot(m.u, m.v), 'expected ' + dot(m.u, m.v) + ' but the answer is ' + item.answer);
  } else if (m.kind === 'dotmag') {
    has(m.m1); has(m.m2); has(m.deg);
    const ex = m.m1 * m.m2 * Math.cos(m.deg * D2R);
    if (item.tol) assert(item.tol === '0.005' && item.answer === ex.toFixed(2), 'expected ' + ex.toFixed(2) + ' but the answer is ' + item.answer);
    else assert(close(num(item.answer), ex, 1e-9), 'expected ' + ex + ' but the answer is ' + item.answer);
  } else if (m.kind === 'angle') {
    m.u.concat(m.v).forEach(has);
    // angle from the cross-product magnitude (a different route from the cosine formula)
    const cr = (a, b) => { const A = [a[0], a[1], a[2] || 0], B = [b[0], b[1], b[2] || 0]; return Math.hypot(A[1] * B[2] - A[2] * B[1], A[2] * B[0] - A[0] * B[2], A[0] * B[1] - A[1] * B[0]); };
    const th = Math.atan2(cr(m.u, m.v), dot(m.u, m.v)) / D2R;
    assert(item.tol === '0.05' && item.answer === th.toFixed(1) && item.unit === '°', 'expected ' + th.toFixed(1) + ' but the answer is ' + item.answer);
  } else if (m.kind === 'perp') {
    [m.b, m.c, m.d].forEach(has);
    const k = num(item.answer), u = m.first ? [k, m.b] : [m.b, k];
    assert(Math.abs(dot(u, [m.c, m.d])) < 1e-12, 'vectors are not perpendicular for k = ' + k);
  } else if (m.kind === 'proj') {
    m.u.concat(m.v).forEach(has);
    assert(close(num(item.answer), dot(m.u, m.v) / norm(m.v), 1e-9), 'expected ' + dot(m.u, m.v) / norm(m.v) + ' but the answer is ' + item.answer);
  } else if (m.kind === 'vproj') {
    m.u.concat(m.v).forEach(has);
    const sc = dot(m.u, m.v) / norm(m.v), a = tupleVals(item.answer), unit = m.v.map((x) => x / norm(m.v));
    assert(close(a[0], sc * unit[0], 1e-9) && close(a[1], sc * unit[1], 1e-9), 'bad vector projection ' + item.answer);
    assert(Math.abs(dot(a, [m.u[0] - a[0], m.u[1] - a[1]])) < 1e-9, 'u - proj should be perpendicular to proj');
  } else assert(false, 'unknown kind ' + m.kind);
};

// ---- F2-11 complex plane ----
// Numbers are re-read from the prompt TeX and recomputed with plain complex arithmetic; the last line of the worked
// solution is evaluated as a second check on the canonical answer.
const squarefree = (n) => { for (let d = 2; d * d <= n; d++) if (n % (d * d) === 0) return false; return true; };
V['F2-11'] = (item) => {
  const m = item.meta, p = item.prompt, ms = mathsOf(p);
  const cv = (tex) => { const v = ev(texToCalc(tex)); assert(Number.isFinite(v.re) && Number.isFinite(v.im), 'cannot evaluate ' + tex); return [v.re || 0, v.im || 0]; };
  const cmul = (a, b) => [a[0] * b[0] - a[1] * b[1], a[0] * b[1] + a[1] * b[0]];
  const cdiv = (a, b) => { const d = b[0] * b[0] + b[1] * b[1]; return [(a[0] * b[0] + a[1] * b[1]) / d, (a[1] * b[0] - a[0] * b[1]) / d]; };
  const seg = (name) => { const s = ms.find((t) => new RegExp('^' + name + '\\s*=\\s*[^=]').test(t)); assert(s, 'no "' + name + ' =" in the prompt'); return cv(s.replace(/^[a-z]\s*=\s*/, '')); };
  const exprSeg = () => { const s = ms.find((t) => /^(\(|\\left\(|\\left\||\\frac)/.test(t)); assert(s, 'no expression in the prompt'); return s; };
  const ansV = ev(item.answer), A = [ansV.re || 0, ansV.im || 0];
  const same = (e, why) => assert(close(e[0], A[0], 1e-9) && close(e[1], A[1], 1e-9), why + ': expected ' + e.map((x) => +x.toFixed(9)).join(' + ') + 'i but the answer is ' + item.answer);
  const isRat = (x, maxD) => { for (let d = 1; d <= maxD; d++) if (Math.abs(x * d - Math.round(x * d)) < 1e-9) return true; return false; };
  assert(item.type === 'num', 'F2-11 items are num');
  assert(!/\d\.\d{3,}/.test(item.answer), 'answer looks like a long decimal: ' + item.answer);
  if (m.kind === 'mod') {
    const z = seg('z');
    assert(z[0] === m.a && z[1] === m.b, 'prompt differs from the generator values');
    const R = Math.hypot(z[0], z[1]), mm = /^(\d+)?(?:sqrt\((\d+)\))?$/.exec(item.answer);
    assert(close(num(item.answer), R, 1e-9), 'modulus is ' + R + ' but the answer is ' + item.answer);
    assert(mm && (mm[1] || mm[2]), 'answer should look like n, sqrt(k) or n sqrt(k): ' + item.answer);
    if (mm[2]) { assert(squarefree(Number(mm[2])) && Number(mm[2]) > 1, 'radicand is not squarefree'); assert(/simplest radical/.test(p), 'prompt should ask for simplest radical form'); }
    else assert(Number.isInteger(R), 'integer answer expected');
  } else if (m.kind === 'modprod') {
    const R = cv(exprSeg())[0];
    assert(close(num(item.answer), R, 1e-9), 'expected ' + R + ' but the answer is ' + item.answer);
    lowestTerms(item.answer);
  } else if (m.kind === 'arg' || m.kind === 'argApprox') {
    const z = seg('z'), th = Math.atan2(z[1], z[0]);
    assert(z[0] === m.re || m.kind === 'argApprox' || close(z[0], m.re, 1e-9), 'prompt differs from the generator values');
    assert(num(item.answer) > -Math.PI + 1e-9 && num(item.answer) <= Math.PI + 1e-9, 'not a principal argument: ' + item.answer);
    if (m.kind === 'arg') assert(close(num(item.answer), th, 1e-9), 'arg is ' + th + ' but the answer is ' + item.answer);
    else {
      assert(item.tol === '0.005' && item.answer === th.toFixed(2), 'expected ' + th.toFixed(2) + ' but the answer is ' + item.answer);
      assert(Math.abs(Math.abs(th * 100 - Math.trunc(th * 100)) - 0.5) > 0.15, 'too close to a rounding boundary');
    }
  } else if (m.kind === 'mul') {
    let e;
    if (m.sub === 'conj') { const z = seg('z'), w = seg('w'); e = cmul(z, [w[0], -w[1]]); assert(/\\overline\{w\}/.test(p), 'conjugate missing'); }
    else e = cv(exprSeg());
    same(e, 'product'); assert(Number.isInteger(A[0]) && Number.isInteger(A[1]) && A[0] !== 0 && A[1] !== 0, 'want a + bi with non-zero integer parts');
  } else if (m.kind === 'div') {
    const e = cv(exprSeg());
    same(e, 'quotient'); assert(isRat(A[0], 13) && isRat(A[1], 13), 'parts should be fractions with a small denominator');
    const hasFrac = !(Number.isInteger(A[0]) && Number.isInteger(A[1]));
    assert(hasFrac === /fractions for \$a\$ and \$b\$/.test(p), 'fraction note in the prompt does not match the answer');
  } else if (m.kind === 'p2r') {
    const z = seg('z');
    same(z, 'polar form value'); assert(Math.abs(A[0]) > 1e-9 && Math.abs(A[1]) > 1e-9, 'both parts should be non-zero');
    assert(/e\^\{/.test(p) === !!m.euler, 'notation flag does not match the prompt');
  } else if (m.kind === 'pprod') {
    const z = seg('z'), w = seg('w'), div = /\\frac\{z\}\{w\}/.test(p);
    assert(div === !!m.div, 'operation flag does not match the prompt');
    const e = (div ? cdiv(z, w) : cmul(z, w)).map((x) => (Math.abs(x) < 1e-9 ? 0 : x));          // snap rounding noise so atan2 sees the true axis
    if (m.rect) same(e, div ? 'quotient' : 'product');
    else { const th = Math.atan2(e[1], e[0]); assert(close(num(item.answer), th, 1e-9), 'arg is ' + th + ' but the answer is ' + item.answer); assert(num(item.answer) > -Math.PI + 1e-9 && num(item.answer) <= Math.PI + 1e-9, 'not a principal argument'); }
    // the polar data in the prompt: moduli multiply / divide
    const rz = Math.hypot(z[0], z[1]), rw = Math.hypot(w[0], w[1]);
    assert(Number.isInteger(Math.round(rz)) && close(rz, Math.round(rz), 1e-9) && close(rw, Math.round(rw), 1e-9), 'moduli should be whole numbers');
    if (div) assert(close(rz / rw, Math.round(rz / rw), 1e-9), 'quotient modulus should be a whole number');
  } else if (m.kind === 'demoivre') {
    const e = cv(exprSeg());
    same(e, 'power'); assert(new RegExp('\\^\\{' + m.n + '\\}').test(exprSeg()), 'exponent in the prompt differs from meta');
  } else assert(false, 'unknown kind ' + m.kind);
  // second check: the final line of the worked solution says the same thing as the canonical answer
  const lastSeg = mathsOf(item.solution).pop(), rhs = lastSeg.split(/=|\\approx/).pop();
  const fin = cv(rhs);
  assert(close(fin[0], A[0], 1e-9) && close(fin[1], A[1], 1e-9), 'solution ends with "' + lastSeg + '" but the answer is ' + item.answer);
};

// ---- F2-12 oscillation models ----
// The equation is re-read from the prompt TeX: amplitude, sin/cos, and the argument w t + p0 (checked to be linear in t).
// Answers are then recomputed from the numbers in the prompt, and by evaluating the function itself (periodicity, extremes, direction).
const isInt = (x) => Math.abs(x - Math.round(x)) < 1e-9;
const piForm = (s) => {                                    // "-3pi/2": lowest terms, the coefficient 1 is dropped
  if (s === '0') return;
  const mm = /^(-?)(\d*)pi(?:\/(\d+))?$/.exec(s);
  assert(mm, 'not a multiple of pi: ' + s);
  const n = mm[2] === '' ? 1 : Number(mm[2]), d = mm[3] ? Number(mm[3]) : 1;
  assert(n !== 0 && T.gcd(n, d) === 1 && d >= 1, 'multiple of pi not in lowest terms: ' + s);
  assert(mm[3] === undefined || d > 1, 'denominator 1: ' + s);
};
V['F2-12'] = (item) => {
  const m = item.meta, p = item.prompt, ms = mathsOf(p), TWO_PI = 2 * Math.PI, kind = m.kind, sub = m.sub;
  const cv = (tex) => { const v = ev(texToCalc(tex)); assert(Number.isFinite(v.re) && Math.abs(v.im) < 1e-12, 'cannot evaluate ' + tex); return v.re; };
  const eqSeg = ms.find((t) => /^x\(t\)\s*=/.test(t));
  const rhsOf = (re) => { const s = ms.find((t) => re.test(t)); assert(s, 'no segment ' + re + ' in the prompt'); return cv(s.replace(/^[^=]*=\s*/, '')); };
  const parseEq = (tex) => {
    const mm = /^x\(t\)\s*=\s*(-?)\s*([\d.]*)\\(cos|sin)\\left\((.*)\\right\)$/.exec(tex);
    assert(mm, 'cannot parse the equation ' + tex);
    const A = (mm[1] ? -1 : 1) * (mm[2] === '' ? 1 : Number(mm[2])), fn = mm[3] === 'cos' ? Math.cos : Math.sin, arg = mm[4].replace(/\\varphi/g, '(0)');
    const g = (t) => num(texToCalc(arg), { t }), p0 = g(0), w = g(1) - g(0);
    assert(close(g(2.7), p0 + 2.7 * w, 1e-9), 'argument is not linear in t');
    return { A, fn, w, p0, name: mm[3], f: (t) => A * fn(w * t + p0) };
  };
  const unitIs = (u) => assert(item.unit === u, 'unit should be ' + u + ' but is ' + item.unit);
  const rounded = (val) => {
    assert(item.tol === '0.005' && item.answer === val.toFixed(2), 'expected ' + val.toFixed(2) + ' but the answer is ' + item.answer);
    assert(Math.abs(Math.abs(val * 100 - Math.trunc(val * 100)) - 0.5) > 0.15, 'too close to a rounding boundary');
    assert(Math.abs(val) >= 0.3, 'answer too close to zero');
  };
  const isPhase = (x) => x > -Math.PI + 1e-9 && x <= Math.PI + 1e-9;
  const ctxUnit = /\(in cm\)/.test(p) ? 'cm' : /\(in m\)/.test(p) ? 'm' : null;
  assert(!/\d\.\d{3,}/.test(item.answer), 'answer looks like a long decimal: ' + item.answer);
  let expect = null;                                         // the value the worked solution's last line should show
  if (kind === 'amp') {
    const e = parseEq(eqSeg); assert(e.name === 'cos', 'cosine expected');
    assert(ans0(item) > 0 && close(Math.abs(e.A), ans0(item), 1e-12), 'amplitude is ' + Math.abs(e.A) + ' but the answer is ' + item.answer);
    assert(m.neg === (e.A < 0), 'negative-coefficient flag differs from the prompt');
    let mx = 0; const per = TWO_PI / e.w; for (let i = 0; i <= 20000; i++) mx = Math.max(mx, Math.abs(e.f(per * i / 20000)));
    assert(close(mx, ans0(item), 1e-6), 'largest |x| is ' + mx + ' but the answer is ' + item.answer);
    unitIs(ctxUnit); expect = ans0(item);
  } else if (kind === 'omega') {
    unitIs('rad/s');
    if (sub === 'eq') { const e = parseEq(eqSeg); assert(close(e.w, ans0(item), 1e-9), 'omega is ' + e.w + ' but the answer is ' + item.answer); }
    else if (sub === 'T') { const Tv = rhsOf(/^T\s*=/); assert(close(TWO_PI / Tv, ans0(item), 1e-9), 'omega should be 2pi/T = ' + TWO_PI / Tv + ' but the answer is ' + item.answer); }
    else { const f = rhsOf(/^f\s*=/); assert(close(TWO_PI * f, ans0(item), 1e-9), 'omega should be 2pi f = ' + TWO_PI * f + ' but the answer is ' + item.answer); }
    if (/pi/.test(item.answer)) piForm(item.answer); else assert(Number.isInteger(ans0(item)), 'integer expected');
    expect = ans0(item);
  } else if (kind === 'freq') {
    unitIs('Hz');
    if (sub === 'eq') { const e = parseEq(eqSeg); assert(close(e.w / TWO_PI, ans0(item), 1e-9), 'f is ' + e.w / TWO_PI + ' but the answer is ' + item.answer); lowestTerms(item.answer); }
    else if (sub === 'w') { const e = parseEq(eqSeg); assert(isInt(e.w), 'integer omega expected'); rounded(e.w / TWO_PI); }
    else { const Tv = rhsOf(/^T\s*=/); assert(close(1 / Tv, ans0(item), 1e-9), 'f should be 1/T = ' + 1 / Tv + ' but the answer is ' + item.answer); lowestTerms(item.answer); }
    expect = ans0(item);
  } else if (kind === 'period') {
    unitIs('s');
    let Tv;
    if (sub === 'eq' || sub === 'w') {
      const e = parseEq(eqSeg); Tv = TWO_PI / e.w;
      assert(close(Tv, ans0(item), 1e-9), 'T is ' + Tv + ' but the answer is ' + item.answer);
      // the function really repeats after T and not after any proper fraction of T
      for (const t of [0.13, 0.9, 2.31]) assert(close(e.f(t + Tv), e.f(t), 1e-9), 'x(t + T) differs from x(t)');
      for (const k of [2, 3, 4, 5, 6]) assert([0.13, 0.9, 2.31, 0.5].some((t) => Math.abs(e.f(t + Tv / k) - e.f(t)) > 1e-6), 'T/' + k + ' is also a period');
      if (sub === 'w') { assert(isInt(e.w), 'integer omega expected'); piForm(item.answer); } else lowestTerms(item.answer);
    } else { const f = rhsOf(/^f\s*=/); assert(close(1 / f, ans0(item), 1e-9), 'T should be 1/f = ' + 1 / f + ' but the answer is ' + item.answer); lowestTerms(item.answer); }
    expect = ans0(item);
  } else if (kind === 'phase') {
    unitIs('rad');
    const a = ans0(item); assert(isPhase(a), 'phase constant must be in (-pi, pi]: ' + item.answer); piForm(item.answer);
    if (sub === 'read') { const e = parseEq(eqSeg); assert(e.name === 'cos' && close(e.p0, a, 1e-9), 'phase constant is ' + e.p0 + ' but the answer is ' + item.answer); }
    else if (sub === 'sin') {
      const e = parseEq(eqSeg), eqs = ms.filter((t) => /^x\(t\)\s*=/.test(t)); assert(e.name === 'sin' && e.A > 0 && eqs.length === 2, 'sine form expected');
      const c = parseEq(eqs[1]); assert(c.name === 'cos' && close(c.A, e.A) && close(c.w, e.w, 1e-9), 'cosine form differs from the sine form');
      for (const t of [0, 0.37, 1.1, 2.9, 5.2]) assert(close(e.A * Math.sin(e.w * t + e.p0), e.A * Math.cos(e.w * t + a), 1e-9), 'sin and cos forms differ at t = ' + t);
    } else if (sub === 'shift') {
      const e = parseEq(eqSeg), t0 = rhsOf(/^t\s*=\s*[^=]/), isMax = /maximum value/.test(p); assert(isMax === !!m.max && /\\varphi/.test(eqSeg), 'prompt/meta mismatch');
      const f = (t) => e.A * Math.cos(e.w * t + a);
      if (isMax) { assert(close(f(t0), e.A, 1e-9), 'x(t0) is not the maximum'); for (let i = 0; i < 400; i++) assert(f(t0 * i / 400) < e.A - 1e-12, 'a maximum occurs before t0'); }
      else { assert(close(f(t0), -e.A, 1e-9), 'x(t0) is not the minimum'); for (let i = 0; i < 400; i++) assert(f(t0 * i / 400) > -e.A + 1e-12, 'a minimum occurs before t0'); }
      assert(t0 > 0, 't0 must be positive');
    } else if (sub === 'init') {
      const A = Number(/^x\(t\)\s*=\s*(\d+)\\cos/.exec(eqSeg)[1]), x0 = rhsOf(/^x\(0\)\s*=/), dec = /decreasing/.test(p);
      assert(dec === !!m.dec && A === m.A, 'prompt/meta mismatch');
      assert(close(A * Math.cos(a), x0, 1e-9), 'x(0) = ' + A * Math.cos(a) + ' but the prompt says ' + x0);
      const slope = (Math.cos(a + 1e-6) - Math.cos(a - 1e-6)) / 2e-6;   // direction of motion for omega > 0
      assert(dec ? slope < -1e-6 || Math.abs(Math.sin(a)) > 0.99 && slope < 0 : slope > 1e-6, 'direction of motion does not match the sign of phi');
    } else assert(false, 'unknown phase sub-kind ' + sub);
    expect = a;
  } else if (kind === 'value' || kind === 'valueEx') {
    const e = parseEq(eqSeg), qs = ms.find((t) => /^x\([\d.]+\)$/.test(t)); assert(qs && e.name === 'cos', 'x(t0) missing');
    const t0 = Number(/^x\(([\d.]+)\)$/.exec(qs)[1]), val = e.f(t0); assert(t0 === m.t0, 'time differs from meta');
    unitIs(ctxUnit);
    if (kind === 'value') rounded(val); else { assert(close(num(item.answer), val, 1e-9), 'x(' + t0 + ') = ' + val + ' but the answer is ' + item.answer); assert(Math.abs(val) > 1e-9, 'zero value'); }
    expect = kind === 'value' ? Number(item.answer) : val;
  } else if (kind === 'conv') {
    const ints = ms.filter((t) => /^\d+$/.test(t)).map(Number), N = ints[0], S = ints[1];
    assert(ints.length >= 2 && /full oscillations in/.test(p), 'cycle counts missing');
    if (sub === 'f') { unitIs('Hz'); assert(close(N / S, ans0(item), 1e-12), 'f = ' + N / S); lowestTerms(item.answer); }
    else if (sub === 'T') { unitIs('s'); assert(close(S / N, ans0(item), 1e-12), 'T = ' + S / N); lowestTerms(item.answer); }
    else { unitIs('rad/s'); assert(close(TWO_PI * N / S, ans0(item), 1e-9), 'omega = ' + TWO_PI * N / S); piForm(item.answer); }
    expect = ans0(item);
  } else if (kind === 'model') {
    assert(item.type === 'expr' && JSON.stringify(item.vars) === '["t"]' && item.lead === '$x(t) =$', 'expr shape');
    const ast = Checker.parse(item.answer, { vars: ['t'] });
    const f = (t) => { const v = Checker.evaluate(ast, { t }); assert(Number.isFinite(v.re) && Math.abs(v.im) < 1e-12, 'x(t) not real at ' + t); return v.re; };
    const nums = ms.filter((t) => /^\d+(\.\d+)?$/.test(t)).map(Number), A = nums[0], Tp = nums[1];
    assert(A === m.A && close(Tp, m.T, 1e-12), 'prompt numbers differ from meta');
    let mx = 0; for (let i = 0; i <= 8000; i++) { const y = f(2 * Tp * i / 8000); mx = Math.max(mx, Math.abs(y)); }
    assert(close(mx, A, 1e-5), 'largest |x| is ' + mx + ' but the amplitude is ' + A);
    for (const t of [0.11, 0.9, 1.7]) assert(close(f(t + Tp), f(t), 1e-9), 'not periodic with the given period');
    for (const k of [2, 3, 4, 5, 6]) assert([0.11, 0.9, 1.7, 0.4].some((t) => Math.abs(f(t + Tp / k) - f(t)) > 1e-6), 'period is shorter than ' + Tp);
    const start = /maximum displacement/.test(p) ? 'max' : /minimum displacement/.test(p) ? 'min' : /positive direction/.test(p) ? 'up' : /negative direction/.test(p) ? 'down' : null;
    assert(start === m.start, 'start state in the prompt differs from meta');
    const x0 = f(0), dx = f(1e-6) - f(0);
    if (start === 'max') assert(close(x0, A, 1e-9), 'x(0) should be A'); else if (start === 'min') assert(close(x0, -A, 1e-9), 'x(0) should be -A');
    else { assert(Math.abs(x0) < 1e-9, 'x(0) should be 0'); assert(start === 'up' ? dx > 0 : dx < 0, 'wrong direction at t = 0'); }
    const last = mathsOf(item.solution).pop(), rhs = last.replace(/^[^=]*=\s*/, '');
    assert(close(num(texToCalc(rhs), { t: 1.3 }), f(1.3), 1e-9), 'solution ends with "' + last + '" which differs from the answer');
    return;
  } else assert(false, 'unknown kind ' + kind);
  // second check: the last line of the worked solution shows the same value as the canonical answer
  const lastSeg = mathsOf(item.solution).pop(), rhs = lastSeg.split(/=|\\approx/).pop();
  assert(close(cv(rhs), expect, 1e-9), 'solution ends with "' + lastSeg + '" but the answer is ' + item.answer);
};
function ans0(item) { return num(item.answer); }

// @@VERIFIERS-END

// ---------- run ----------
const failures = {}, stats = {};
function note(key, seed, msg, item) { (failures[key] = failures[key] || []).push({ seed, msg, prompt: item && item.prompt }); }

const present = Object.keys(Gen.generators).sort();
const keys = present.filter((k) => !ONLY.length || ONLY.includes(k));
if (!ONLY.length) for (const k of REQUIRED) if (!Gen.has(k)) note(k, 0, 'required generator is missing');

for (const key of keys) {
  const prompts = new Set();
  let made = 0;
  for (let seed = 1; seed <= N; seed++) {
    let item;
    try { item = Gen.make(key, seed); } catch (e) { note(key, seed, 'make threw: ' + (e.stack || e.message).split('\n').slice(0, 3).join(' / ')); continue; }
    made++;
    prompts.add(item.prompt);
    const run = (name, fn) => { try { fn(); } catch (e) { note(key, seed, name + ': ' + e.message, item); } };
    run('shape', () => checkShape(item));
    run('grade', () => checkGrade(item));
    run('katex', () => checkKatex(item));
    run('text', () => checkText(item));
    run('solution', () => checkSolutionMentionsAnswer(item));
    run('determinism', () => assert(JSON.stringify(Gen.make(key, seed)) === JSON.stringify(item), 'same seed gave a different item'));
    if (V[key]) run('verify', () => V[key](item, T)); else if (seed === 1) note(key, 0, 'no verifier written for ' + key);
  }
  stats[key] = { made, distinct: prompts.size };
  if (prompts.size < Math.min(30, N / 4)) note(key, 0, 'only ' + prompts.size + ' distinct prompts in ' + N + ' draws');
}

// ---------- report ----------
let bad = 0, total = 0;
for (const key of Array.from(new Set(keys.concat(Object.keys(failures)))).sort()) {
  const f = failures[key] || [];
  const s = stats[key] || { made: 0, distinct: 0 };
  const failSeeds = new Set(f.filter((x) => x.seed > 0).map((x) => x.seed));
  total += s.made;
  if (f.length) bad++;
  console.log((f.length ? 'FAIL ' : 'ok   ') + key + '  ' + (s.made - failSeeds.size) + '/' + N + ' pass  ' + s.distinct + ' distinct prompts');
  const seen = new Set();
  for (const x of f) {
    const sig = x.msg.slice(0, 60);
    if (seen.has(sig) || seen.size >= 4) continue;
    seen.add(sig);
    console.log('      seed ' + x.seed + ': ' + x.msg + (x.prompt ? '\n         prompt: ' + x.prompt.replace(/\n/g, ' ') : ''));
  }
}
console.log('\n' + keys.length + ' generators, ' + total + ' items, ' + bad + ' generator(s) failing');
process.exit(bad ? 1 : 0);
