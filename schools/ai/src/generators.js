(function (root) {
  'use strict';

  /* ToE Learning Foundation: randomized practice generators.
     Every answer is computed in code, so generated problems are always correct.
     ToEGen.make('F1-03', seed) returns an item in the shape graded by ToEChecker.grade.
     A generator may attach non-enumerable test metadata as `$m`; make() hides it as `item.meta`. */

  const G = {};                                   // key -> generator(r) -> item
  const RETRY = { retry: true };
  function again() { throw RETRY; }               // reject this draw; make() redraws

  // ---------- seeded random numbers ----------
  function mulberry32(a) {
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function makeR(seed) {
    const rand = mulberry32(Math.imul((seed >>> 0) ^ 0x5bd1e995, 0x9E3779B1));
    rand(); rand();
    const r = {
      rand: rand,
      int: function (a, b) { return a + Math.floor(rand() * (b - a + 1)); },
      pick: function (arr) { return arr[Math.floor(rand() * arr.length)]; },
      nonzero: function (a, b) { let v = 0; while (v === 0) v = r.int(a, b); return v; },
      sign: function () { return rand() < 0.5 ? -1 : 1; },
      shuffle: function (arr) {
        const o = arr.slice();
        for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); const t = o[i]; o[i] = o[j]; o[j] = t; }
        return o;
      },
    };
    return r;
  }

  function make(key, seed) {
    const gen = G[key];
    if (!gen) throw new Error('No generator for ' + key);
    if (seed === undefined || seed === null) seed = Math.floor(Math.random() * 4294967296);
    const r = makeR(seed);
    let item = null;
    for (let tries = 0; tries < 500 && !item; tries++) {
      try { item = gen(r); } catch (e) { if (e !== RETRY) throw e; }
    }
    if (!item) throw new Error('Generator ' + key + ' kept rejecting its draws');
    const meta = item.$m;
    delete item.$m;
    item.gen = key;
    item.seed = seed;
    if (meta !== undefined) Object.defineProperty(item, 'meta', { value: meta, enumerable: false });
    return item;
  }

  // ---------- number helpers ----------
  const gcd = function (a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { const t = a % b; a = b; b = t; } return a; };
  const lcm = function (a, b) { return Math.abs(a * b) / gcd(a, b); };
  const sgnOf = function (n) { return n < 0 ? -1 : n > 0 ? 1 : 0; };

  // fractions are [n, d] with d > 0, lowest terms
  function fr(n, d) {
    if (d === undefined) d = 1;
    if (d < 0) { n = -n; d = -d; }
    const g = gcd(n, d) || 1;
    return [n / g + 0, d / g];
  }
  const fadd = function (a, b) { return fr(a[0] * b[1] + b[0] * a[1], a[1] * b[1]); };
  const fsub = function (a, b) { return fr(a[0] * b[1] - b[0] * a[1], a[1] * b[1]); };
  const fmul = function (a, b) { return fr(a[0] * b[0], a[1] * b[1]); };
  const fdiv = function (a, b) { return fr(a[0] * b[1], a[1] * b[0]); };
  const fval = function (a) { return a[0] / a[1]; };
  const fcalc = function (a) { return a[1] === 1 ? String(a[0]) : a[0] + '/' + a[1]; };
  function fracTex(n, d) { return (n < 0 ? '-' : '') + '\\frac{' + Math.abs(n) + '}{' + d + '}'; }
  const ftex = function (a) { return a[1] === 1 ? String(a[0]) : fracTex(a[0], a[1]); };

  // ---------- text helpers ----------
  const pn = function (n) { return n < 0 ? '(' + n + ')' : String(n); };               // parenthesise negatives
  const sgn = function (n) { return (n < 0 ? ' - ' : ' + ') + Math.abs(n); };          // " + 3" / " - 3"
  const par = function (t) { return String(t).charAt(0) === '-' ? '(' + t + ')' : String(t); };   // parenthesise a negative term
  const sup = function (e) { const s = String(e); return s.length === 1 ? s : '{' + s + '}'; };
  const absTex = function (x) { return '\\left|' + x + '\\right|'; };
  const disp = function (parts) {                                                      // worked chain in display math
    const ps = parts.map(String).filter(function (x, i, a) { return i === 0 || x !== a[i - 1]; });
    const flat = ps.join(' = ');
    if (flat.length <= 70 || ps.length < 3) return '$$' + flat + '$$';
    return '$$\\begin{aligned}' + ps[0] + ' &= ' + ps.slice(1).join(' \\\\ &= ') + '\\end{aligned}$$';       // long chains: one step per line
  };
  const cap = function (s) { return s.charAt(0).toUpperCase() + s.slice(1); };

  /* terms([[coef, texBody, calcBody], ...]) -> { tex, calc }. coef is an integer or a fraction [n, d];
     body '' means a constant. Zero terms vanish, +-1 coefficients drop the 1, signs are joined properly. */
  function terms(list) {
    let tex = '', calc = '';
    list.forEach(function (t) {
      const f = Array.isArray(t[0]) ? fr(t[0][0], t[0][1]) : [t[0], 1];
      if (f[0] === 0) return;
      const bt = t[1] || '', bc = t[2] === undefined ? bt : t[2];
      const neg = f[0] < 0, n = Math.abs(f[0]), d = f[1];
      let st, sc;
      if (bt === '') {
        st = d === 1 ? String(n) : '\\frac{' + n + '}{' + d + '}';
        sc = d === 1 ? String(n) : n + '/' + d;
      } else if (d === 1) {
        st = (n === 1 ? '' : String(n)) + bt;
        sc = (n === 1 ? '' : String(n)) + bc;
      } else {
        st = '\\frac{' + n + '}{' + d + '}' + bt;
        sc = (n === 1 ? '' : String(n)) + bc + '/' + d;
      }
      if (tex === '') { tex = (neg ? '-' : '') + st; calc = (neg ? '-' : '') + sc; }
      else { tex += (neg ? ' - ' : ' + ') + st; calc += (neg ? '-' : '+') + sc; }
    });
    return { tex: tex || '0', calc: calc || '0' };
  }
  const lin = function (a, b, v) { return terms([[a, v || 'x'], [b, '']]); };           // a v + b
  // poly(c, v): c[i] is the coefficient of v^i; rendered highest power first
  function poly(c, v) {
    v = v || 'x';
    const list = [];
    for (let i = c.length - 1; i >= 0; i--) {
      list.push([c[i], i === 0 ? '' : i === 1 ? v : v + '^' + sup(i), i === 0 ? '' : i === 1 ? v : v + '^' + i]);
    }
    return terms(list);
  }
  const pmul = function (a, b) {
    const o = new Array(a.length + b.length - 1).fill(0);
    a.forEach(function (x, i) { b.forEach(function (y, j) { o[i + j] += x * y; }); });
    return o;
  };
  const padd = function (a, b) { const o = []; for (let i = 0; i < Math.max(a.length, b.length); i++) o.push((a[i] || 0) + (b[i] || 0)); return o; };
  const pscale = function (a, k) { return a.map(function (x) { return x * k; }); };
  const peval = function (c, x) { return c.reduceRight(function (s, k) { return s * x + k; }, 0); };

  // notes inside aligned equations are plain text, or [text, math, text, ...] with math at the odd positions
  const nt = function (parts) { return parts.map(function (x, i) { return i % 2 === 0 ? '\\text{' + x + '}' : ' ' + x + ' '; }).join(''); };
  // worked solution as aligned equations: rows are [lhs, rhs, note?, relation?]
  const align = function (rows) {
    return '$$\\begin{aligned}' + rows.map(function (x) {
      const note = x[2] === undefined ? '' : ' && ' + (Array.isArray(x[2]) ? nt(x[2]) : '\\text{' + x[2] + '}');
      return x[0] + ' &' + (x[3] || '=') + ' ' + x[1] + note;
    }).join(' \\\\ ') + '\\end{aligned}$$';
  };
  const elimN = function (c, body) { return [c > 0 ? 'subtract ' : 'add ', terms([[Math.abs(c), body]]).tex, ' on both sides']; };
  // phrase for cancelling a term c*body on one side: "subtract $3x$" / "add $2x$"
  const elim = function (c, body) { return c > 0 ? 'subtract $' + terms([[c, body]]).tex + '$' : 'add $' + terms([[-c, body]]).tex + '$'; };
  // @@HELPERS-END

  // ===================================================================
  // F1  Algebra and functions
  // ===================================================================

  // F1-01 signed numbers
  G['F1-01'] = function (r) {
    const kind = r.pick(['md', 'md', 'paren', 'div', 'pow', 'pow', 'abs', 'abs', 'nest']);
    let tex, chain, val, hints, lesson;
    if (kind === 'md') {
      const A = r.nonzero(-9, 9), B = r.nonzero(-7, 7), C = r.nonzero(-7, 7);
      if (Math.abs(B) < 2 || Math.abs(C) < 2 || (B > 0 && C > 0)) again();
      const op = r.pick(['+', '-']), prod = B * C;
      val = op === '+' ? A + prod : A - prod;
      if (val === 0) again();
      tex = `${A} ${op} ${pn(B)} \\cdot ${pn(C)}`;
      chain = [tex, `${A} ${op} ${pn(prod)}`, val];
      lesson = 'Multiplication comes before addition and subtraction.';
      hints = [
        `Order of operations: do the multiplication $${pn(B)} \\cdot ${pn(C)}$ before the ${op === '+' ? 'addition' : 'subtraction'}.`,
        `A product of two numbers with ${prod < 0 ? 'different signs is negative' : 'the same sign is positive'}, so $${pn(B)} \\cdot ${pn(C)} = ${prod}$.`,
        `Now work out $${A} ${op} ${pn(prod)}$.` + (op === '-' && prod < 0 ? ' Subtracting a negative number is the same as adding its opposite.' : ''),
      ];
    } else if (kind === 'paren') {
      const C = r.nonzero(-6, 6), A = r.nonzero(-9, 9), B = r.nonzero(-9, 9);
      const op = r.pick(['+', '-']), op2 = r.pick(['+', '-']), D = r.int(1, 12);
      const inner = op === '+' ? A + B : A - B;
      if (Math.abs(C) < 2 || Math.abs(inner) < 2) again();
      const prod = C * inner;
      val = op2 === '+' ? prod + D : prod - D;
      if (val === 0) again();
      tex = `${C} \\cdot (${A} ${op} ${pn(B)}) ${op2} ${D}`;
      chain = [tex, `${C} \\cdot ${pn(inner)} ${op2} ${D}`, `${prod} ${op2} ${D}`, val];
      lesson = 'Work inside the brackets first, then multiply, then add or subtract.';
      hints = [
        `Brackets first: work out $${A} ${op} ${pn(B)}$.`,
        `The bracket equals $${inner}$, so the expression becomes $${C} \\cdot ${pn(inner)} ${op2} ${D}$.`,
        `Multiply before you ${op2 === '+' ? 'add' : 'subtract'}: find $${C} \\cdot ${pn(inner)}$, then ${op2 === '+' ? 'add' : 'subtract'} $${D}$.`,
      ];
    } else if (kind === 'div') {
      const E = r.nonzero(-6, 6), k = r.nonzero(-7, 7), A = r.nonzero(-12, 12), op = r.pick(['+', '-']);
      if (Math.abs(E) < 2 || Math.abs(k) < 2) again();
      const D = E * k;
      if (D > 0 && E > 0) again();
      val = op === '+' ? A + k : A - k;
      if (val === 0) again();
      tex = `${A} ${op} ${pn(D)} \\div ${pn(E)}`;
      chain = [tex, `${A} ${op} ${pn(k)}`, val];
      lesson = 'Division comes before addition and subtraction.';
      hints = [
        `Do the division $${pn(D)} \\div ${pn(E)}$ before the ${op === '+' ? 'addition' : 'subtraction'}.`,
        `A quotient of two numbers with ${k < 0 ? 'different signs is negative' : 'the same sign is positive'}, so $${pn(D)} \\div ${pn(E)} = ${k}$.`,
        `Now work out $${A} ${op} ${pn(k)}$.` + (op === '-' && k < 0 ? ' Subtracting a negative number is the same as adding its opposite.' : ''),
      ];
    } else if (kind === 'pow') {
      const b1 = r.int(2, 5), b2 = r.int(2, 5), e1 = r.int(2, 4), e2 = r.int(2, 4);
      const k1 = r.pick(['neg', 'par']), k2 = r.pick(['par', 'pos']), op = r.pick(['+', '-']);
      if (Math.pow(b1, e1) > 81 || Math.pow(b2, e2) > 81) again();
      const term = function (kd, b, e) {
        if (kd === 'neg') return { tex: `-${b}^${sup(e)}`, v: -Math.pow(b, e) };
        if (kd === 'par') return { tex: `(-${b})^${sup(e)}`, v: Math.pow(-b, e) };
        return { tex: `${b}^${sup(e)}`, v: Math.pow(b, e) };
      };
      const t1 = term(k1, b1, e1), t2 = term(k2, b2, e2);
      val = op === '+' ? t1.v + t2.v : t1.v - t2.v;
      if (val === 0 || t1.tex === t2.tex) again();
      tex = `${t1.tex} ${op} ${t2.tex}`;
      chain = [tex, `${t1.v} ${op} ${pn(t2.v)}`, val];
      lesson = 'Evaluate the powers first. An exponent applies only to what it touches: in $-3^2$ it applies to the 3 alone, so $-3^2 = -(3^2) = -9$, while $(-3)^2 = 9$.';
      hints = [
        `Powers come first. Decide what each exponent touches: $-${b1}^${sup(e1)}$ means $-(${b1}^${sup(e1)})$, but $(-${b1})^${sup(e1)}$ includes the sign.`,
        `Evaluate the first power: $${t1.tex} = ${t1.v}$.`,
        `Evaluate the second power $${t2.tex}$, then ${op === '+' ? 'add' : 'subtract'} the two results.`,
      ];
    } else if (kind === 'abs') {
      const sub = r.int(1, 3);
      if (sub === 1) {
        const A = r.nonzero(-15, 15), B = r.nonzero(-15, 15), op = r.pick(['+', '-']);
        if (A > 0 && B > 0) again();
        val = op === '+' ? Math.abs(A) + Math.abs(B) : Math.abs(A) - Math.abs(B);
        if (val === 0) again();
        tex = `${absTex(A)} ${op} ${absTex(B)}`;
        chain = [tex, `${Math.abs(A)} ${op} ${Math.abs(B)}`, val];
        hints = [
          'The absolute value of a number is its distance from 0, so it is never negative.',
          `$${absTex(A)} = ${Math.abs(A)}$ and $${absTex(B)} = ${Math.abs(B)}$.`,
          `Now ${op === '+' ? 'add' : 'subtract'}: $${Math.abs(A)} ${op} ${Math.abs(B)}$.`,
        ];
      } else if (sub === 2) {
        const A = r.nonzero(-10, 10), B = r.nonzero(-10, 10), C = r.nonzero(-6, 6);
        if (A === B || Math.abs(C) < 2 || Math.abs(A - B) < 2) again();
        const d = A - B;
        val = Math.abs(d) * C;
        tex = `${absTex(`${A} - ${pn(B)}`)} \\cdot ${pn(C)}`;
        chain = [tex, `${absTex(d)} \\cdot ${pn(C)}`, `${Math.abs(d)} \\cdot ${pn(C)}`, val];
        hints = [
          'Work inside the absolute value bars first, then take the absolute value.',
          `$${A} - ${pn(B)} = ${d}$, and $${absTex(d)} = ${Math.abs(d)}$.`,
          `Finally multiply: $${Math.abs(d)} \\cdot ${pn(C)}$.`,
        ];
      } else {
        const A = r.nonzero(-12, 12), B = r.nonzero(-6, 6), C = r.nonzero(-9, 9);
        if (Math.abs(B) < 2 || Math.abs(C) < 2 || (A > 0 && C > 0)) again();
        val = -Math.abs(A) + B * Math.abs(C);
        if (val === 0) again();
        tex = `-${absTex(A)} + ${pn(B)} \\cdot ${absTex(C)}`;
        chain = [tex, `-${Math.abs(A)} + ${pn(B)} \\cdot ${Math.abs(C)}`, `${-Math.abs(A)} + ${pn(B * Math.abs(C))}`, val];
        hints = [
          'Absolute values first: each pair of bars turns its number into a non-negative one. The minus sign in front of the first bars is not part of the absolute value.',
          `$${absTex(A)} = ${Math.abs(A)}$ and $${absTex(C)} = ${Math.abs(C)}$, so the expression is $-${Math.abs(A)} + ${pn(B)} \\cdot ${Math.abs(C)}$.`,
          `Multiply $${pn(B)} \\cdot ${Math.abs(C)}$ before adding it to $${-Math.abs(A)}$.`,
        ];
      }
      lesson = 'The absolute value of a number is its distance from 0, so it is never negative. Work inside the bars first.';
    } else {
      const A = r.nonzero(-5, 5), B = r.nonzero(-6, 6), C = r.nonzero(-6, 6), E = r.nonzero(-5, 5), k = r.nonzero(-6, 6);
      const op2 = r.pick(['+', '-']);
      if (Math.abs(A) < 2 || Math.abs(E) < 2 || Math.abs(k) < 2 || B === C) again();
      const D = E * k, inner = B - C, sq = inner * inner, prod = A * sq;
      val = op2 === '+' ? prod + k : prod - k;
      if (val === 0 || Math.abs(inner) > 8) again();
      tex = `${A} \\cdot (${B} - ${pn(C)})^2 ${op2} ${pn(D)} \\div ${pn(E)}`;
      chain = [tex, `${A} \\cdot ${pn(inner)}^2 ${op2} ${pn(D)} \\div ${pn(E)}`, `${A} \\cdot ${sq} ${op2} ${pn(D)} \\div ${pn(E)}`,
        `${prod} ${op2} ${pn(k)}`, val];
      lesson = 'Use the order of operations: brackets, then exponents, then multiplication and division from left to right, then addition and subtraction.';
      hints = [
        `Brackets first: $${B} - ${pn(C)} = ${inner}$. Then the exponent applies to the whole bracket value.`,
        `$${pn(inner)}^2 = ${sq}$, so the expression is $${A} \\cdot ${sq} ${op2} ${pn(D)} \\div ${pn(E)}$.`,
        `Do both the multiplication $${A} \\cdot ${sq}$ and the division $${pn(D)} \\div ${pn(E)}$ before the final ${op2 === '+' ? 'addition' : 'subtraction'}.`,
      ];
    }
    return {
      type: 'num',
      prompt: `${r.pick(['Evaluate', 'Simplify'])}: $${tex}$.`,
      answer: String(val),
      hints: hints,
      solution: `${lesson}\n\n${disp(chain)}\n\nThe value is $${val}$.`,
    };
  };

  // F1-02 fractions and ratios
  const FRAC_NOTE = 'Give your answer as a fraction in lowest terms (an improper fraction is fine) or an integer.';

  // TeX steps for f1 (op) f2 with fractions; returns { res, steps }
  function fracSteps(op, f1, f2) {
    const sym = { '+': '+', '-': '-', '*': '\\cdot', '/': '\\div' }[op];
    const wrap = function (f) { return f[0] < 0 ? '(' + ftex(f) + ')' : ftex(f); };
    const steps = [ftex(f1) + ' ' + sym + ' ' + wrap(f2)];
    let res;
    if (op === '+' || op === '-') {
      const L = lcm(f1[1], f2[1]);
      const x = f1[0] * (L / f1[1]), y = f2[0] * (L / f2[1]);
      const s = op === '+' ? x + y : x - y;
      res = fr(s, L);
      steps.push(fracTex(x, L) + ' ' + sym + ' ' + (y < 0 ? '(' + fracTex(y, L) + ')' : fracTex(y, L)), fracTex(s, L));
      if (res[0] !== s || res[1] !== L) steps.push(ftex(res));
    } else {
      const g = op === '/' ? fr(f2[1], f2[0]) : f2;
      if (op === '/') steps.push(ftex(f1) + ' \\cdot ' + wrap(g));
      const n = f1[0] * g[0], d = f1[1] * g[1];
      res = fr(n, d);
      steps.push((n < 0 ? '-' : '') + '\\frac{' + Math.abs(f1[0]) + ' \\cdot ' + Math.abs(g[0]) + '}{' + f1[1] + ' \\cdot ' + g[1] + '}', fracTex(n, d));
      if (res[0] !== n || res[1] !== d) steps.push(ftex(res));
    }
    return { res: res, steps: steps };
  }
  // hints for combining two fractions with the given operation (f1, f2 already improper/proper fractions)
  function fracHints(op, f1, f2) {
    if (op === '+' || op === '-') {
      const word = op === '+' ? 'add' : 'subtract', L = lcm(f1[1], f2[1]);
      const x = f1[0] * (L / f1[1]), y = f2[0] * (L / f2[1]);
      const parts = [];
      if (f1[1] !== L) parts.push('$' + ftex(f1) + ' = ' + fracTex(x, L) + '$');
      if (f2[1] !== L) parts.push('$' + ftex(f2) + ' = ' + fracTex(y, L) + '$');
      return [
        f1[1] === f2[1] ? 'The denominators are already equal, so only the numerators change.'
          : 'To ' + word + ' fractions you need a common denominator. The least common multiple of $' + f1[1] + '$ and $' + f2[1] + '$ is $' + L + '$.',
        parts.length ? 'Rewrite with denominator $' + L + '$: ' + parts.join(' and ') + '.' : 'Both fractions already have denominator $' + L + '$.',
        'Now ' + word + ' the numerators, keep the denominator $' + L + '$, and reduce the result to lowest terms.',
      ];
    }
    if (op === '*') {
      return [
        'To multiply fractions, multiply the numerators together and the denominators together. Cancelling common factors first keeps the numbers small.',
        'The product is $\\frac{' + Math.abs(f1[0]) + ' \\cdot ' + Math.abs(f2[0]) + '}{' + f1[1] + ' \\cdot ' + f2[1] + '}$' + (f1[0] * f2[0] < 0 ? ', and it is negative because exactly one factor is negative.' : '.'),
        'Multiply out the top and the bottom, then divide both by their greatest common divisor.',
      ];
    }
    const g = fr(f2[1], f2[0]);
    return [
      'Dividing by a fraction is the same as multiplying by its reciprocal.',
      'The reciprocal of $' + ftex(f2) + '$ is $' + ftex(g) + '$, so the problem becomes $' + ftex(f1) + ' \\cdot ' + (g[0] < 0 ? '(' + ftex(g) + ')' : ftex(g)) + '$.',
      'Multiply the numerators and the denominators, then reduce to lowest terms.',
    ];
  }

  G['F1-02'] = function (r) {
    const kind = r.pick(['add', 'sub', 'mul', 'div', 'mix', 'mix', 'prop', 'part', 'rate', 'rate']);
    const pf = function (maxD) { const d = r.int(2, maxD); return fr(r.int(1, d - 1), d); };       // proper fraction
    const OPS = { add: '+', sub: '-', mul: '*', div: '/' };
    const SYM = { '+': '+', '-': '-', '*': '\\cdot', '/': '\\div' };
    if (OPS[kind] || kind === 'mix') {
      let op = OPS[kind], f1, f2, ptex, pre = '';
      if (kind === 'mix') {
        op = r.pick(['+', '-', '*', '/']);
        const w1 = r.int(1, 4), w2 = r.int(1, 3), p1 = pf(6), p2 = pf(6);
        let m1 = [w1 * p1[1] + p1[0], p1[1]], m2 = [w2 * p2[1] + p2[0], p2[1]];
        let a = [w1, p1], b = [w2, p2];
        if (op === '-' && fval(m1) < fval(m2)) { const t = m1; m1 = m2; m2 = t; const u = a; a = b; b = u; }
        if (fval(m1) === fval(m2) || (op !== '-' && op !== '+' && m1[1] * m2[1] > 40)) again();
        if ((op === '+' || op === '-') && lcm(m1[1], m2[1]) > 24) again();
        f1 = m1; f2 = m2;
        const mix = function (x) { return x[0] + '\\frac{' + x[1][0] + '}{' + x[1][1] + '}'; };
        ptex = mix(a) + ' ' + SYM[op] + ' ' + mix(b);
        const conv = function (x, m) { return mix(x) + ' = \\frac{' + x[0] + ' \\cdot ' + x[1][1] + ' + ' + x[1][0] + '}{' + x[1][1] + '} = ' + ftex(m); };
        pre = 'First convert each mixed number to an improper fraction.\n\n$$' + conv(a, m1) + '$$\n\n$$' + conv(b, m2) + '$$\n\nNow compute with the improper fractions.\n\n';
        var mixHints = ['Convert each mixed number to an improper fraction: $' + conv(a, m1).split(' = ').slice(0, 2).join(' = ') + '$.',
          'The problem becomes $' + ftex(f1) + ' ' + SYM[op] + ' ' + ftex(f2) + '$.'];
      } else {
        f1 = pf(kind === 'add' || kind === 'sub' ? 12 : 9); f2 = pf(kind === 'add' || kind === 'sub' ? 12 : 9);
        if ((op === '+' || op === '-') && (lcm(f1[1], f2[1]) > 36 || (f1[1] === f2[1] && r.rand() < 0.7))) again();
        if (op === '*' || op === '/') { if (r.rand() < 0.3) f1 = fr(-f1[0], f1[1]); if (f1[1] * f2[1] > 60) again(); }
        ptex = ftex(f1) + ' ' + SYM[op] + ' ' + (f2[0] < 0 ? '(' + ftex(f2) + ')' : ftex(f2));
      }
      const st = fracSteps(op, f1, f2);
      if (st.res[0] === 0) again();
      if (op === '-' && st.res[0] < 0 && kind !== 'mix' && r.rand() < 0.6) again();
      const hs = fracHints(op, f1, f2);
      const hints = kind === 'mix' ? [mixHints[0], mixHints[1], hs[0] === 'The denominators are already equal, so only the numerators change.' ? hs[2] : hs[0]] : hs;
      return {
        type: 'num',
        prompt: 'Compute $' + ptex + '$. ' + FRAC_NOTE,
        answer: fcalc(st.res),
        hints: hints,
        solution: pre + disp(st.steps) + '\n\nThe result in lowest terms is $' + ftex(st.res) + '$.',
      };
    }
    // ---- word problems ----
    if (kind === 'prop') {
      const ctx = r.pick([['boys', 'girls', 'In a school club'], ['cats', 'dogs', 'At an animal shelter'], ['red beads', 'blue beads', 'In a jar'],
        ['sedans', 'trucks', 'In a parking lot'], ['apples', 'pears', 'At a fruit stand'], ['fiction books', 'non-fiction books', 'On a library shelf']]);
      const p = r.int(1, 9), q = r.int(1, 9), k = r.int(2, 9);
      if (p === q || gcd(p, q) !== 1) again();
      const askB = r.rand() < 0.5;
      const kn = askB ? p : q, ot = askB ? q : p, known = kn * k, ans = ot * k;
      const kName = askB ? ctx[0] : ctx[1], oName = askB ? ctx[1] : ctx[0];
      return {
        type: 'num',
        prompt: `${ctx[2]}, the ratio of ${ctx[0]} to ${ctx[1]} is $${p}:${q}$. There are ${known} ${kName}. How many ${oName} are there?`,
        answer: String(ans),
        hints: [
          `In the ratio $${p}:${q}$ the first number counts the ${ctx[0]} and the second counts the ${ctx[1]}.`,
          `Write a proportion with matching quantities in matching places: $\\frac{${kn}}{${ot}} = \\frac{${known}}{x}$.`,
          `Find the scale factor: how many times does $${kn}$ go into $${known}$? The number of ${oName} is $${ot}$ times that factor.`,
        ],
        solution: `The ratio $${p}:${q}$ compares ${ctx[0]} to ${ctx[1]}. With ${known} ${kName}, set up a proportion:\n\n${disp([`\\frac{${kn}}{${ot}}`, `\\frac{${known}}{x}`])}\n\nThe scale factor is $${known} \\div ${kn} = ${k}$, so $x = ${ot} \\cdot ${k} = ${ans}$.\n\nThere are $${ans}$ ${oName}.`,
        $m: { kind: kind, p: p, q: q, k: k, askB: askB, ans: [ans, 1] },
      };
    }
    if (kind === 'part') {
      const ctx = r.pick([['boys', 'girls', 'A class has only boys and girls'], ['red marbles', 'blue marbles', 'A bag holds only red and blue marbles'],
        ['cats', 'dogs', 'A shelter houses only cats and dogs'], ['adults', 'children', 'A museum tour group is made up of adults and children']]);
      const p = r.int(1, 7), q = r.int(1, 7), k = r.int(2, 9);
      if (p === q || gcd(p, q) !== 1) again();
      const total = (p + q) * k, askA = r.rand() < 0.5, part = askA ? p : q, name = askA ? ctx[0] : ctx[1];
      const ans = part * k;
      return {
        type: 'num',
        prompt: `${ctx[2]}. The ratio of ${ctx[0]} to ${ctx[1]} is $${p}:${q}$ and there are ${total} in all. How many ${name} are there?`,
        answer: String(ans),
        hints: [
          `The ratio $${p}:${q}$ splits the total into $${p} + ${q} = ${p + q}$ equal parts.`,
          `Each part is worth $${total} \\div ${p + q}$.`,
          `The ${name} make up $${part}$ of those equal parts, so multiply the value of one part by $${part}$.`,
        ],
        solution: `The ratio $${p}:${q}$ means the total is $${p} + ${q} = ${p + q}$ equal parts.\n\nOne part is $${total} \\div ${p + q} = ${k}$.\n\nThe ${name} are $${part}$ parts, so there are $${part} \\cdot ${k} = ${ans}$ ${name}.`,
        $m: { kind: kind, p: p, q: q, k: k, askA: askA, ans: [ans, 1] },
      };
    }
    // rate / proportion with a possibly fractional answer
    const a = r.int(2, 15), b = r.int(2, 9), c = r.int(2, 12);
    if (b === c || a === b) again();
    const ans = fr(a * c, b);
    const ctxs = [
      `A cyclist rides ${a} km in ${b} hours at a steady speed. How many km does the cyclist ride in ${c} hours?`,
      `A tap delivers ${a} litres of water in ${b} minutes. How many litres does it deliver in ${c} minutes?`,
      `A recipe for ${b} servings uses ${a} cups of flour. How many cups of flour are needed for ${c} servings?`,
      `On a map, ${b} cm represents ${a} km. How many km does ${c} cm represent?`,
    ];
    const per = fr(a, b);
    return {
      type: 'num',
      prompt: r.pick(ctxs) + (ans[1] === 1 ? '' : ' Give an exact answer (a fraction is fine).'),
      answer: fcalc(ans),
      hints: [
        `Find the amount for a single unit: divide $${a}$ by $${b}$.`,
        `The amount for one unit is $\\frac{${a}}{${b}}${per[1] !== b ? ' = ' + ftex(per) : ''}$.`,
        `Now scale up: multiply the rate by $${c}$.`,
      ],
      solution: `Set up a proportion with the unknown amount $x$:\n\n${disp([`\\frac{${a}}{${b}}`, `\\frac{x}{${c}}`])}\n\nSolve for $x$:\n\n${disp([`x`, `\\frac{${a} \\cdot ${c}}{${b}}`, fracTex(a * c, b)].concat(ans[0] !== a * c || ans[1] !== b ? [ftex(ans)] : []))}\n\nThe answer is $${ftex(ans)}$.`,
      $m: { kind: kind, a: a, b: b, c: c, ans: ans },
    };
  };

  // F1-03 linear equations
  G['F1-03'] = function (r) {
    const v = r.pick(['x', 'x', 'x', 'y', 't', 'n', 'm']);
    const kind = r.pick(['two', 'both', 'both', 'bracket', 'bracket2', 'frac1', 'frac2', 'frac3', 'frac4']);
    const T = function (c, b) { return terms([[c, v], [b, '']]).tex; };           // c v + b
    const par = function (s) { return s.charAt(0) === '-' ? '(' + s + ')' : s; };
    // last rows: coefficient `coef` times v equals `rhs`; skip the division when coef is 1
    const fin = function (coef, rhs, note, sol) {
      return coef === 1 ? [[v, ftex(sol), note]] : [[terms([[coef, v]]).tex, rhs, note], [v, ftex(sol), ['divide both sides by ', coef]]];
    };
    let L, R, sol, hints, rows;
    if (kind === 'two') {
      const a = r.nonzero(-9, 9), b = r.nonzero(-12, 12), c = r.int(-20, 20);
      if (Math.abs(a) < 2 || c === b) again();
      sol = fr(c - b, a);
      L = T(a, b); R = String(c);
      hints = [
        `Undo the ${b > 0 ? 'addition' : 'subtraction'} first: ${elim(b, '')} on both sides.`,
        `That leaves $${T(a, 0)} = ${c - b}$.`,
        `Divide both sides by $${a}$.`,
      ];
      rows = [[L, R]].concat(fin(a, c - b, elimN(b, ''), sol));
    } else if (kind === 'both') {
      const a = r.nonzero(-9, 9), c = r.nonzero(-9, 9), b = r.nonzero(-15, 15), d = r.nonzero(-15, 15);
      if (a === c || b === d) again();
      sol = fr(d - b, a - c);
      L = T(a, b); R = T(c, d);
      hints = [
        `Collect the $${v}$-terms on one side: ${elim(c, v)} on both sides.`,
        `The equation becomes $${T(a - c, b)} = ${d}$.`,
        `Now ${elim(b, '')} on both sides` + (a - c === 1 ? '.' : ` and divide by $${a - c}$.`),
      ];
      rows = [[L, R], [T(a - c, b), d, elimN(c, v)]].concat(fin(a - c, d - b, elimN(b, ''), sol));
    } else if (kind === 'bracket') {
      const p = r.nonzero(-6, 6), q = r.nonzero(-4, 4), rr = r.nonzero(-9, 9), s = r.int(-9, 9), t = r.int(-6, 6), u = r.int(-20, 20);
      if (Math.abs(p) < 2 || p * q === t) again();
      sol = fr(u - p * rr - s, p * q - t);
      L = p + '(' + T(q, rr) + ')' + (s ? sgn(s) : ''); R = T(t, u);
      const dist = terms([[p * q, v], [p * rr, ''], [s, '']]).tex;
      hints = [
        `Distribute $${p}$ over the bracket: $${p} \\cdot ${par(terms([[q, v]]).tex)} = ${terms([[p * q, v]]).tex}$ and $${p} \\cdot ${pn(rr)} = ${p * rr}$.`,
        `Combine like terms on the left. The equation becomes $${T(p * q, p * rr + s)} = ${R}$.`,
        `Collect the $${v}$-terms on one side and the numbers on the other, then divide by the coefficient of $${v}$.`,
      ];
      rows = [[L, R], [dist, R, 'distribute'], [T(p * q, p * rr + s), R, 'combine like terms'], [T(p * q - t, 0), u - p * rr - s, 'collect terms']];
      rows.push([v, ftex(sol), ['divide both sides by ', p * q - t]]);
    } else if (kind === 'bracket2') {
      const p = r.nonzero(-7, 7), q = r.nonzero(-7, 7), a1 = r.int(1, 3), a2 = r.int(1, 3), rr = r.nonzero(-8, 8), s = r.nonzero(-8, 8);
      if (Math.abs(p) < 2 || Math.abs(q) < 2 || p * a1 === q * a2) again();
      sol = fr(q * s - p * rr, p * a1 - q * a2);
      L = p + '(' + T(a1, rr) + ')'; R = q + '(' + T(a2, s) + ')';
      hints = [
        `Distribute on both sides: $${p} \\cdot ${terms([[a1, v]]).tex}$ and $${p} \\cdot ${pn(rr)}$ on the left, $${q} \\cdot ${terms([[a2, v]]).tex}$ and $${q} \\cdot ${pn(s)}$ on the right.`,
        `The equation becomes $${T(p * a1, p * rr)} = ${T(q * a2, q * s)}$.`,
        `Move the $${v}$-terms to one side and the numbers to the other, then divide by the coefficient of $${v}$.`,
      ];
      rows = [[L, R], [T(p * a1, p * rr), T(q * a2, q * s), 'distribute']].concat(fin(p * a1 - q * a2, q * s - p * rr, 'collect terms', sol));
    } else if (kind === 'frac1') {
      const pp = r.int(1, 4), a = r.int(2, 6), k = r.nonzero(-4, 4), b = r.nonzero(-9, 9);
      if (pp > 1 && gcd(pp, a) !== 1) again();
      const c = pp * k + b;
      if (c === 0 || c === b) again();
      sol = fr(a * k, 1);
      const nm = (pp === 1 ? '' : pp) + v;
      L = `\\frac{${nm}}{${a}}` + sgn(b); R = String(c);
      hints = [
        `Isolate the fraction: ${elim(b, '')} on both sides.`,
        `That leaves $\\frac{${nm}}{${a}} = ${c - b}$.`,
        `Multiply both sides by $${a}$` + (pp > 1 ? `, then divide both sides by $${pp}$.` : '.'),
      ];
      rows = [[L, R], [`\\frac{${nm}}{${a}}`, c - b, elimN(b, '')]];
      if (pp === 1) rows.push([v, ftex(sol), ['multiply both sides by ', a]]);
      else rows.push([nm, a * (c - b), ['multiply both sides by ', a]], [v, ftex(sol), ['divide both sides by ', pp]]);
    } else if (kind === 'frac2') {
      const pp = r.int(1, 3), b = r.int(2, 6), c = r.nonzero(-6, 6), a = r.nonzero(-9, 9);
      sol = fr(b * c - a, pp);
      const nm = T(pp, a);
      L = `\\frac{${nm}}{${b}}`; R = String(c);
      hints = [
        `Multiply both sides by $${b}$ to clear the fraction.`,
        `That gives $${nm} = ${b * c}$.`,
        pp > 1 ? `${cap(elim(a, ''))} on both sides, then divide by $${pp}$.` : `${cap(elim(a, ''))} on both sides.`,
      ];
      rows = [[L, R], [nm, b * c, ['multiply both sides by ', b]]];
      if (pp === 1) rows.push([v, ftex(sol), elimN(a, '')]);
      else rows.push([terms([[pp, v]]).tex, b * c - a, elimN(a, '')], [v, ftex(sol), ['divide both sides by ', pp]]);
    } else if (kind === 'frac3') {
      const a = r.int(2, 6), b = r.int(2, 6), k = r.nonzero(-3, 3), op = r.pick(['+', '-']);
      if (a === b) again();
      const Lc = lcm(a, b), x0 = k * Lc, c = op === '+' ? x0 / a + x0 / b : x0 / a - x0 / b;
      if (c === 0) again();
      sol = fr(x0, 1);
      const ca = Lc / a, cb = Lc / b, tot = op === '+' ? ca + cb : ca - cb;
      L = `\\frac{${v}}{${a}} ${op} \\frac{${v}}{${b}}`; R = String(c);
      hints = [
        `Clear the fractions by multiplying every term by the common denominator, the least common multiple of $${a}$ and $${b}$, which is $${Lc}$.`,
        `$${Lc} \\cdot \\frac{${v}}{${a}} = ${terms([[ca, v]]).tex}$ and $${Lc} \\cdot \\frac{${v}}{${b}} = ${terms([[cb, v]]).tex}$, and the right side becomes $${Lc} \\cdot ${pn(c)} = ${Lc * c}$.`,
        `Combine the $${v}$-terms on the left, then divide by their coefficient.`,
      ];
      rows = [[L, R], [terms([[ca, v]]).tex + ' ' + op + ' ' + terms([[cb, v]]).tex, Lc * c, ['multiply both sides by ', Lc]]].concat(fin(tot, Lc * c, 'combine like terms', sol));
    } else {
      const m = r.int(2, 6), n = r.int(2, 6), pp = r.nonzero(-4, 4), rr = r.nonzero(-4, 4), q = r.nonzero(-8, 8), s = r.nonzero(-8, 8);
      if (m === n || n * pp === m * rr) again();
      sol = fr(m * s - n * q, n * pp - m * rr);
      L = `\\frac{${T(pp, q)}}{${m}}`; R = `\\frac{${T(rr, s)}}{${n}}`;
      hints = [
        `Cross-multiply: multiply the numerator on the left by $${n}$ and the numerator on the right by $${m}$.`,
        `The equation becomes $${n}(${T(pp, q)}) = ${m}(${T(rr, s)})$.`,
        `Distribute, collect the $${v}$-terms on one side, then divide by the coefficient of $${v}$.`,
      ];
      rows = [[L, R], [`${n}(${T(pp, q)})`, `${m}(${T(rr, s)})`, 'cross-multiply'], [T(n * pp, n * q), T(m * rr, m * s), 'distribute']]
        .concat(fin(n * pp - m * rr, m * s - n * q, 'collect terms', sol));
    }
    if (sol[0] === 0 || (sol[1] !== 1 && r.rand() < 0.6)) again();
    return {
      type: 'num',
      prompt: `Solve for $${v}$: $${L} = ${R}$.` + (sol[1] === 1 ? '' : ' Give the answer as a fraction.'),
      answer: fcalc(sol),
      hints: hints,
      solution: `Isolate $${v}$ by doing the same thing to both sides.\n\n${align(rows)}\n\nSo $${v} = ${ftex(sol)}$.`,
    };
  };

  // F1-04 linear inequalities (multiple choice: four directions at the right boundary, one wrong boundary)
  const REL = ['<', '>', '\\le', '\\ge'];
  const FLIP = { '<': '>', '>': '<', '\\le': '\\ge', '\\ge': '\\le' };
  G['F1-04'] = function (r) {
    const v = r.pick(['x', 'x', 'x', 'y', 't', 'n']);
    const T = function (c, b) { return terms([[c, v], [b, '']]).tex; };
    const rel = r.pick(REL), kind = r.pick(['one', 'one', 'both', 'bracket', 'frac']);
    let L, R, bound, wrongs, hints, rows, neg;           // neg: the last step divides/multiplies by a negative number
    const flipNote = function (what, n) { return neg ? [what + ' both sides by ', n, ' and reverse the inequality sign'] : [what + ' both sides by ', n]; };
    if (kind === 'one') {
      const a = r.nonzero(-9, 9), b = r.nonzero(-15, 15), c = r.int(-20, 20);
      if (Math.abs(a) < 2 || c === b) again();
      neg = a < 0; bound = fr(c - b, a); wrongs = [fr(c + b, a), fr(b - c, a), fr(c - b, -a)];
      L = T(a, b); R = String(c);
      hints = [
        `Get the $${v}$-term alone on one side: ${elim(b, '')} on both sides.`,
        `This gives $${T(a, 0)} ${rel} ${c - b}$.`,
        `Divide both sides by $${a}$. ` + (neg ? 'Dividing by a negative number reverses the direction of the inequality sign.' : 'Dividing by a positive number keeps the direction of the inequality sign.'),
      ];
      rows = [[L, R, undefined, rel], [T(a, 0), c - b, elimN(b, ''), rel], [v, ftex(bound), flipNote('divide', a), neg ? FLIP[rel] : rel]];
    } else if (kind === 'both') {
      const a = r.nonzero(-9, 9), c = r.nonzero(-9, 9), b = r.nonzero(-15, 15), d = r.nonzero(-15, 15);
      const k = a - c;
      if (k === 0 || b === d) again();
      neg = k < 0; bound = fr(d - b, k); wrongs = [fr(b - d, k), fr(d + b, k), fr(d - b, -k)];
      L = T(a, b); R = T(c, d);
      hints = [
        `Collect the $${v}$-terms on one side: ${elim(c, v)} on both sides.`,
        `This gives $${T(k, b)} ${rel} ${d}$.`,
        `${cap(elim(b, ''))} on both sides, then divide by $${k}$. ` + (neg ? 'Dividing by a negative number reverses the direction of the inequality sign.' : 'Dividing by a positive number keeps the direction of the inequality sign.'),
      ];
      rows = [[L, R, undefined, rel], [T(k, b), d, elimN(c, v), rel], [T(k, 0), d - b, elimN(b, ''), rel]];
      if (k === 1) rows.pop();
      rows.push(k === 1 ? [v, ftex(bound), elimN(b, ''), rel] : [v, ftex(bound), flipNote('divide', k), neg ? FLIP[rel] : rel]);
    } else if (kind === 'bracket') {
      const p = r.nonzero(-5, 5), q = r.int(1, 3), rr = r.nonzero(-9, 9), s = r.int(-20, 20);
      if (Math.abs(p) < 2 || s === p * rr) again();
      neg = p < 0; bound = fr(s - p * rr, p * q); wrongs = [fr(s + p * rr, p * q), fr(p * rr - s, p * q), fr(s - p * rr, -p * q)];
      L = p + '(' + T(q, rr) + ')'; R = String(s);
      hints = [
        `Distribute $${p}$ over the bracket: $${p} \\cdot ${terms([[q, v]]).tex} = ${terms([[p * q, v]]).tex}$ and $${p} \\cdot ${pn(rr)} = ${p * rr}$.`,
        `The inequality becomes $${T(p * q, p * rr)} ${rel} ${s}$.`,
        `${cap(elim(p * rr, ''))} on both sides, then divide by $${p * q}$. ` + (neg ? 'Dividing by a negative number reverses the direction of the inequality sign.' : 'Dividing by a positive number keeps the direction of the inequality sign.'),
      ];
      rows = [[L, R, undefined, rel], [T(p * q, p * rr), R, 'distribute', rel], [terms([[p * q, v]]).tex, s - p * rr, elimN(p * rr, ''), rel],
        [v, ftex(bound), flipNote('divide', p * q), neg ? FLIP[rel] : rel]];
    } else {
      const a = r.int(2, 6), b = r.nonzero(-9, 9), c = r.int(-9, 9);
      neg = r.rand() < 0.6;
      if (c === b) again();
      const m = neg ? -a : a;
      bound = fr(m * (c - b), 1); wrongs = [fr(-m * (c - b), 1), fr(m * (c + b), 1), fr(a * (c - b), 1)];
      const fracTerm = (neg ? '-' : '') + `\\frac{${v}}{${a}}`;
      L = fracTerm + sgn(b); R = String(c);
      hints = [
        `Isolate the fraction: ${elim(b, '')} on both sides.`,
        `This gives $${fracTerm} ${rel} ${c - b}$.`,
        `Multiply both sides by $${m}$ to leave $${v}$ alone. ` + (neg ? 'Multiplying by a negative number reverses the direction of the inequality sign.' : 'Multiplying by a positive number keeps the direction of the inequality sign.'),
      ];
      rows = [[L, R, undefined, rel], [fracTerm, c - b, elimN(b, ''), rel], [v, ftex(bound), flipNote('multiply', m), neg ? FLIP[rel] : rel]];
    }
    if (bound[1] !== 1 && r.rand() < 0.7) again();                  // mostly whole-number boundaries
    const relF = neg ? FLIP[rel] : rel;
    const wrong = wrongs.find(function (w) { return w[0] !== bound[0] || w[1] !== bound[1]; }) || [bound[0] + 1, bound[1]];
    const mk = function (op, b) { return `$${v} ${op} ${ftex(b)}$`; };
    const opts = r.shuffle(REL.map(function (op) { return { text: mk(op, bound), ok: op === relF }; }).concat([{ text: mk(relF, wrong), ok: false }]));
    return {
      type: 'mc',
      prompt: `Solve the inequality $${L} ${rel} ${R}$. Which statement describes all of its solutions?`,
      choices: opts.map(function (o) { return o.text; }),
      answer: opts.findIndex(function (o) { return o.ok; }),
      hints: hints,
      solution: `Solve it like an equation, but reverse the inequality sign whenever you multiply or divide both sides by a negative number.\n\n${align(rows)}\n\n` +
        (neg ? 'The last step used a negative number, so the sign reversed. ' : 'The last step used a positive number, so the sign stayed the same. ') +
        `The solutions are all $${v}$ with $${v} ${relF} ${ftex(bound)}$.`,
    };
  };

  // F1-05 graphs and slope
  G['F1-05'] = function (r) {
    const kind = r.pick(['slope', 'slope', 'yint2', 'stdSlope', 'stdY', 'stdX', 'psEq', 'psEq', 'twoEq', 'perp']);
    const pnF = function (f) { return f[0] < 0 ? '(' + ftex(f) + ')' : ftex(f); };
    const pt = function (x, y) { return `(${x}, ${y})`; };
    const pickLine = function () {                       // slope p/q, integer intercept
      const q = r.pick([1, 1, 1, 2, 3, 4]), p = r.nonzero(-6, 6);
      if (gcd(p, q) !== 1) again();
      return { m: fr(p, q), b: r.nonzero(-9, 9), q: q };
    };
    const pickX = function (q) { const x = q * r.int(-Math.floor(8 / q), Math.floor(8 / q)); if (x === 0) again(); return x; };
    const yAt = function (L, x) { return L.m[0] * x / L.m[1] + L.b; };
    const slopeSteps = function (x1, y1, x2, y2) {         // TeX chain for m from two points
      const dy = y2 - y1, dx = x2 - x1, m = fr(dy, dx), top = dx < 0 ? -dy : dy;
      const steps = ['m', '\\frac{y_2 - y_1}{x_2 - x_1}', `\\frac{${y2} - ${pn(y1)}}{${x2} - ${pn(x1)}}`];
      if (Math.abs(dx) === 1) steps.push(String(m[0]));
      else { steps.push(fracTex(top, Math.abs(dx))); if (m[0] !== top || m[1] !== Math.abs(dx)) steps.push(ftex(m)); }
      return steps;
    };
    if (kind === 'slope') {
      const x1 = r.int(-8, 8), y1 = r.int(-8, 8), x2 = r.int(-8, 8), y2 = r.int(-8, 8);
      if (x1 === x2 || y1 === y2 || Math.abs(x2 - x1) > 10 || Math.abs(y2 - y1) > 10) again();
      const m = fr(y2 - y1, x2 - x1);
      return {
        type: 'num',
        prompt: `Find the slope of the line through $${pt(x1, y1)}$ and $${pt(x2, y2)}$.`,
        answer: fcalc(m),
        hints: [
          'Slope is rise over run: $m = \\frac{y_2 - y_1}{x_2 - x_1}$.',
          `Here the rise is $${y2} - ${pn(y1)} = ${y2 - y1}$ and the run is $${x2} - ${pn(x1)} = ${x2 - x1}$.`,
          'Divide the rise by the run and reduce the fraction to lowest terms.',
        ],
        solution: `Use the slope formula with $(x_1, y_1) = ${pt(x1, y1)}$ and $(x_2, y_2) = ${pt(x2, y2)}$.\n\n${disp(slopeSteps(x1, y1, x2, y2))}\n\nThe slope is $${ftex(m)}$.`,
        $m: { kind: kind },
      };
    }
    if (kind === 'yint2' || kind === 'twoEq') {
      const L = pickLine(), x1 = pickX(L.q), x2 = pickX(L.q);
      if (x1 === x2) again();
      const y1 = yAt(L, x1), y2 = yAt(L, x2), eq = terms([[L.m, 'x'], [L.b, '']]);
      const common = [
        'Start by finding the slope from the two points: $m = \\frac{y_2 - y_1}{x_2 - x_1}$.',
        `Substituting the points gives $${slopeSteps(x1, y1, x2, y2).slice(2).join(' = ')}$, so $m = ${ftex(L.m)}$.`,
      ];
      const find = `Use the slope and the point $${pt(x1, y1)}$ in $y = mx + b$: $${y1} = ${pnF(L.m)} \\cdot ${pn(x1)} + b$, so $b = ${y1} - ${pnF(L.m)} \\cdot ${pn(x1)} = ${L.b}$.`;
      if (kind === 'yint2') {
        return {
          type: 'num',
          prompt: `A line passes through $${pt(x1, y1)}$ and $${pt(x2, y2)}$. Find its $y$-intercept, the value of $y$ where the line crosses the $y$-axis.`,
          answer: String(L.b),
          hints: [common[0], common[1], `Now put the slope and one of the points into $y = mx + b$ and solve for $b$; the $y$-intercept is $b$.`],
          solution: `${common[0]}\n\n${common[1]}\n\n${find}\n\nThe $y$-intercept is $${L.b}$.`,
          $m: { kind: kind },
        };
      }
      return {
        type: 'expr', vars: ['x'], lead: '$y =$',
        prompt: `Find the equation of the line through $${pt(x1, y1)}$ and $${pt(x2, y2)}$ in slope-intercept form $y = mx + b$.`,
        answer: eq.calc,
        hints: [common[0], common[1], 'Put the slope and one of the points into $y = mx + b$ and solve for $b$, then write the equation.'],
        solution: `${common[0]}\n\n${common[1]}\n\n${find}\n\nThe equation is $y = ${eq.tex}$.`,
        $m: { kind: kind },
      };
    }
    if (kind === 'psEq') {
      const L = pickLine(), x1 = pickX(L.q), y1 = yAt(L, x1), eq = terms([[L.m, 'x'], [L.b, '']]);
      return {
        type: 'expr', vars: ['x'], lead: '$y =$',
        prompt: `Find the equation of the line with slope $${ftex(L.m)}$ that passes through $${pt(x1, y1)}$, in slope-intercept form $y = mx + b$.`,
        answer: eq.calc,
        hints: [
          `The slope is $m = ${ftex(L.m)}$, so the equation has the form $y = ${terms([[L.m, 'x']]).tex} + b$.`,
          `Substitute the point $${pt(x1, y1)}$ for $x$ and $y$: $${y1} = ${pnF(L.m)} \\cdot ${pn(x1)} + b$.`,
          `Solve that equation for $b$, then write $y = mx + b$.`,
        ],
        solution: `Start with $y = mx + b$ and $m = ${ftex(L.m)}$. Substitute $x = ${x1}$, $y = ${y1}$:\n\n${disp([String(y1), `${pnF(L.m)} \\cdot ${pn(x1)} + b`, `${L.m[0] * x1 / L.m[1]} + b`])}\n\nSo $b = ${y1} - ${pn(L.m[0] * x1 / L.m[1])} = ${L.b}$ and the equation is $y = ${eq.tex}$.`,
        $m: { kind: kind },
      };
    }
    if (kind === 'perp') {
      const std = r.rand() < 0.5;
      if (!std) {
        const L = pickLine();
        if (Math.abs(L.m[0]) === 1 && L.m[1] === 1) again();
        const ans = fr(-L.m[1], L.m[0]);
        return {
          type: 'num',
          prompt: `A line has the equation $y = ${terms([[L.m, 'x'], [L.b, '']]).tex}$. What is the slope of any line perpendicular to it?`,
          answer: fcalc(ans),
          hints: [
            'Perpendicular lines have slopes that are negative reciprocals of each other: $m_1 \\cdot m_2 = -1$.',
            `The given line has slope $m_1 = ${ftex(L.m)}$: it is the coefficient of $x$, and the constant term does not matter.`,
            'Flip the fraction (take the reciprocal) and change its sign.',
          ],
          solution: `The slope of $y = ${terms([[L.m, 'x'], [L.b, '']]).tex}$ is $m_1 = ${ftex(L.m)}$. For a perpendicular line, $m_1 \\cdot m_2 = -1$:\n\n${disp(['m_2', `-\\frac{1}{m_1}`, `-\\frac{1}{${pnF(L.m)}}`, ftex(ans)])}\n\nThe perpendicular slope is $${ftex(ans)}$.`,
          $m: { kind: kind, std: false },
        };
      }
      const A = r.nonzero(-8, 8), B = r.nonzero(-8, 8), C = r.nonzero(-12, 12);
      if (Math.abs(A) < 2 || gcd(A, B) !== 1) again();
      const m1 = fr(-A, B), ans = fr(B, A), eqs = terms([[A, 'x'], [B, 'y']]).tex;
      return {
        type: 'num',
        prompt: `A line has the equation $${eqs} = ${C}$. What is the slope of any line perpendicular to it?`,
        answer: fcalc(ans),
        hints: [
          'Solve for $y$ to read off the slope of the given line: $y = mx + b$.',
          `$${terms([[B, 'y']]).tex} = ${terms([[-A, 'x'], [C, '']]).tex}$, so dividing by $${B}$ gives the slope $m_1 = ${ftex(m1)}$.`,
          'Perpendicular lines have slopes that are negative reciprocals: flip the fraction and change its sign.',
        ],
        solution: `Solve for $y$:\n\n${disp([terms([[B, 'y']]).tex, terms([[-A, 'x'], [C, '']]).tex])}\n\nso the slope is $m_1 = ${ftex(m1)}$. A perpendicular line has $m_2 = -\\frac{1}{m_1} = ${ftex(ans)}$.`,
        $m: { kind: kind, std: true },
      };
    }
    // standard form Ax + By = C
    const A = r.nonzero(-9, 9), B = r.nonzero(-9, 9), k = r.nonzero(-6, 6);
    const eqs = terms([[A, 'x'], [B, 'y']]).tex;
    if (kind === 'stdSlope') {
      const C = B * k, m = fr(-A, B);
      return {
        type: 'num',
        prompt: `Find the slope of the line $${eqs} = ${C}$.`,
        answer: fcalc(m),
        hints: [
          'Solve the equation for $y$ to put it in the form $y = mx + b$; the slope is the coefficient of $x$.',
          `Move the $x$-term: $${terms([[B, 'y']]).tex} = ${terms([[-A, 'x'], [C, '']]).tex}$.`,
          `Divide every term by $${B}$.`,
        ],
        solution: `Solve for $y$:\n\n${disp([`${eqs}`, String(C)])}\n\n${disp([terms([[B, 'y']]).tex, terms([[-A, 'x'], [C, '']]).tex])}\n\n${disp(['y', terms([[fr(-A, B), 'x'], [k, '']]).tex])}\n\nThe slope is the coefficient of $x$: $${ftex(m)}$.`,
        $m: { kind: kind },
      };
    }
    const yint = kind === 'stdY', C = (yint ? B : A) * k, ans = String(k);
    const zero = yint ? 'x' : 'y', other = yint ? 'y' : 'x', coef = yint ? B : A;
    return {
      type: 'num',
      prompt: `Find the $${other}$-intercept of the line $${eqs} = ${C}$.`,
      answer: ans,
      hints: [
        `The line crosses the $${other}$-axis where $${zero} = 0$.`,
        `Substitute $${zero} = 0$: $${terms([[coef, other]]).tex} = ${C}$.`,
        `Divide both sides by $${coef}$.`,
      ],
      solution: `The $${other}$-intercept is where $${zero} = 0$. Substitute:\n\n${disp([terms([[coef, other]]).tex, String(C)])}\n\nDivide both sides by $${coef}$: $${other} = ${C} \\div ${pn(coef)} = ${k}$.\n\nThe $${other}$-intercept is $${k}$.`,
      $m: { kind: kind },
    };
  };

  // F1-06 systems of equations
  const eqT = function (a, b, c, v1, v2) { return terms([[a, v1], [b, v2]]).tex + ' = ' + c; };
  const casesT = function (rows) { return '\\begin{cases} ' + rows.join(' \\\\ ') + ' \\end{cases}'; };
  // Elimination write-up for  a v1 + b v2 = c  (two equations e1, e2 = [a, b, c]); eliminates whichever variable needs smaller multipliers
  function elimWork(vars, e1, e2, sol) {
    const plan = [1, 0].map(function (idx) {
      const c1 = e1[idx], c2 = e2[idx], Lc = lcm(Math.abs(c1), Math.abs(c2));
      let m1 = Lc / c1, m2 = -Lc / c2;
      if (m1 < 0) { m1 = -m1; m2 = -m2; }
      return { idx: idx, Lc: Lc, m1: m1, m2: m2, cost: Math.abs(m1) + Math.abs(m2) };
    });
    const pl = plan[0].cost <= plan[1].cost ? plan[0] : plan[1];
    const ei = pl.idx, ki = 1 - ei, ve = vars[ei], vk = vars[ki], m1 = pl.m1, m2 = pl.m2;
    const sc = e1.map(function (x) { return x * m1; }), sd = e2.map(function (x) { return x * m2; });
    const A = sc[ki] + sd[ki], C = sc[2] + sd[2];
    const sumEq = terms([[A, vk]]).tex + ' = ' + C;
    const scaled = [eqT(sc[0], sc[1], sc[2], vars[0], vars[1]), eqT(sd[0], sd[1], sd[2], vars[0], vars[1])];
    const simple = m1 === 1 && Math.abs(m2) === 1, opposite = simple && m2 === 1;
    const how = simple ? (opposite ? 'add the equations' : 'subtract the second equation from the first')
      : (m1 !== 1 ? 'multiply the first equation by $' + m1 + '$' : '') + (m1 !== 1 && m2 !== 1 ? ' and the second by $' + m2 + '$' : m2 !== 1 ? 'multiply the second equation by $' + m2 + '$' : '');
    const hints = simple ? [
      `The $${ve}$-coefficients are $${e1[ei]}$ and $${e2[ei]}$: ${opposite ? 'opposites, so adding the equations eliminates' : 'equal, so subtracting the equations eliminates'} $${ve}$.`,
      `${cap(how)} to get $${sumEq}$.`,
      `Solve for $${vk}$, then substitute that value into either original equation to find $${ve}$.`,
    ] : [
      `To eliminate $${ve}$, make its coefficients opposites. The least common multiple of $${Math.abs(e1[ei])}$ and $${Math.abs(e2[ei])}$ is $${pl.Lc}$.`,
      `${cap(how)}: $${casesT(scaled)}$.`,
      `Add the new equations to eliminate $${ve}$, solve for $${vk}$, then substitute back to find $${ve}$.`,
    ];
    // solve for the kept variable
    const val = sol[ki], rows1 = [[terms([[A, vk]]).tex, C, 'add the equations']];
    if (A === 1) rows1[0] = [vk, val, 'add the equations']; else rows1.push([vk, val, ['divide both sides by ', A]]);
    // substitute into the first equation
    const coefK = e1[ki], coefE = e1[ei], moved = coefK * val;
    const kt = coefK === 1 ? String(val) : coefK === -1 ? '-' + pn(val) : coefK + ' \\cdot ' + pn(val);
    const kt2 = Math.abs(coefK) === 1 ? pn(val) : Math.abs(coefK) + ' \\cdot ' + pn(val);
    const substTex = ki === 0 ? kt + (coefE < 0 ? ' - ' : ' + ') + (Math.abs(coefE) === 1 ? '' : Math.abs(coefE)) + ve
      : terms([[coefE, ve]]).tex + (coefK < 0 ? ' - ' : ' + ') + kt2;
    const rows2 = [[substTex, e1[2]], [terms([[coefE, ve]]).tex, e1[2] - moved, elimN(moved, '')]];
    if (coefE === 1) rows2.pop(), rows2.push([ve, sol[ei], elimN(moved, '')]); else rows2.push([ve, sol[ei], ['divide both sides by ', coefE]]);
    const text = `Eliminate $${ve}$.\n\n` +
      (simple ? `The $${ve}$-coefficients are ${opposite ? 'opposites' : 'equal'}, so ${how}.\n\n`
        : `${cap(how)} so that the $${ve}$-coefficients become opposites.\n\n$$${casesT(scaled)}$$\n\nNow add the two equations.\n\n`) +
      `${align(rows1)}\n\nSubstitute $${vk} = ${val}$ into the first equation:\n\n${align(rows2)}\n\nThe solution is $(${sol[0]}, ${sol[1]})$.`;
    return { hints: hints, text: text };
  }

  G['F1-06'] = function (r) {
    const kind = r.pick(['sub', 'elim', 'elim', 'mult', 'mult', 'word', 'word']);
    if (kind === 'word') {
      const w = r.pick(['tickets', 'numbers', 'prices']);
      let story, vars, e1, e2, sol, nums;
      if (w === 'tickets') {
        const ctx = r.pick([['adult tickets', 'student tickets', 'a school play'], ['regular tickets', 'child tickets', 'a science museum'], ['large coffees', 'small coffees', 'a cafe']]);
        const p1 = r.int(5, 12), p2 = r.int(2, 8), a = r.int(8, 40), s = r.int(8, 40);
        if (p1 <= p2 + 1) again();
        vars = ['a', 's']; sol = [a, s];
        e1 = [1, 1, a + s]; e2 = [p1, p2, p1 * a + p2 * s]; nums = [p1, p2, a + s, p1 * a + p2 * s];
        story = `At ${ctx[2]}, ${ctx[0]} cost ${p1} dollars each and ${ctx[1]} cost ${p2} dollars each. In total ${a + s} were sold for ${p1 * a + p2 * s} dollars. Let $a$ be the number of ${ctx[0]} and $s$ the number of ${ctx[1]}. Find $(a, s)$.`;
      } else if (w === 'numbers') {
        const x0 = r.int(3, 20), y0 = r.int(1, x0 - 1);
        if (x0 - y0 < 2) again();
        vars = ['x', 'y']; sol = [x0, y0]; e1 = [1, 1, x0 + y0]; e2 = [1, -1, x0 - y0]; nums = [x0 + y0, x0 - y0];
        story = `Two numbers have a sum of ${x0 + y0} and a difference of ${x0 - y0} (the larger minus the smaller). Let $x$ be the larger number and $y$ the smaller. Find $(x, y)$.`;
      } else {
        const ctx = r.pick([[['notebook', 'notebooks'], ['pen', 'pens']], [['sandwich', 'sandwiches'], ['drink', 'drinks']], [['apple', 'apples'], ['orange', 'oranges']]]);
        const n0 = r.int(1, 9), p0 = r.int(1, 9), a1 = r.int(1, 5), b1 = r.int(1, 5), a2 = r.int(1, 5), b2 = r.int(1, 5);
        if (a1 * b2 === a2 * b1 || n0 === p0) again();
        vars = ['n', 'p']; sol = [n0, p0]; e1 = [a1, b1, a1 * n0 + b1 * p0]; e2 = [a2, b2, a2 * n0 + b2 * p0];
        nums = [e1[2], e2[2]];
        const pl = function (k, nm) { return k + ' ' + (k === 1 ? nm[0] : nm[1]); };
        story = `${cap(pl(a1, ctx[0]))} and ${pl(b1, ctx[1])} cost ${e1[2]} dollars in total. ${cap(pl(a2, ctx[0]))} and ${pl(b2, ctx[1])} cost ${e2[2]} dollars in total. Let $n$ be the price of one ${ctx[0][0]} and $p$ the price of one ${ctx[1][0]}, in dollars. Find $(n, p)$.`;
      }
      const work = elimWork(vars, e1, e2, sol);
      const sys = casesT([eqT(e1[0], e1[1], e1[2], vars[0], vars[1]), eqT(e2[0], e2[1], e2[2], vars[0], vars[1])]);
      return {
        type: 'tuple',
        prompt: story,
        answer: `(${sol[0]}, ${sol[1]})`,
        hints: [`Translate the story into two equations in $${vars[0]}$ and $${vars[1]}$: $${sys}$.`, work.hints[0], work.hints[1]],
        solution: `The story gives the system\n\n$$${sys}$$\n\n${work.text}`,
        $m: { kind: 'word', e1: e1, e2: e2, nums: nums },
      };
    }
    const x0 = r.nonzero(-6, 6), y0 = r.nonzero(-6, 6);
    let hints, solution, rowsTex;
    if (kind === 'sub') {
      const m = r.nonzero(-4, 4), a = r.nonzero(-5, 5), b = r.nonzero(-5, 5), k = y0 - m * x0, c = a * x0 + b * y0;
      if (k === 0 || Math.abs(k) > 12 || a + b * m === 0) again();
      const rhs1 = terms([[m, 'x'], [k, '']]).tex, bs = Math.abs(b) === 1 ? '' : Math.abs(b);
      const subst = terms([[a, 'x']]).tex + (b < 0 ? ' - ' : ' + ') + bs + '(' + rhs1 + ')';
      rowsTex = [`y = ${rhs1}`, eqT(a, b, c, 'x', 'y')];
      hints = [
        `The first equation already gives $y$ in terms of $x$. Substitute $y = ${rhs1}$ into the second equation.`,
        `The second equation becomes $${subst} = ${c}$.`,
        'Solve that equation for $x$, then use the first equation to find $y$.',
      ];
      const coef = a + b * m;
      const rows = [[subst, c, 'substitute'], [terms([[coef, 'x'], [b * k, '']]).tex, c, 'distribute and combine'], [terms([[coef, 'x']]).tex, c - b * k, elimN(b * k, '')]];
      if (coef === 1) rows.pop(), rows.push(['x', c - b * k, elimN(b * k, '')]);
      else rows.push(['x', x0, ['divide both sides by ', coef]]);
      solution = `The first equation gives $y$ in terms of $x$, so substitute it into the second equation.\n\n${align(rows)}\n\n` +
        `Now find $y$ from the first equation: $y = ${m === 1 ? pn(x0) : m === -1 ? '-' + pn(x0) : m + ' \\cdot ' + pn(x0)}${sgn(k)} = ${y0}$.\n\nThe solution is $(${x0}, ${y0})$.`;
    } else {
      let a1, b1, a2, b2;
      if (kind === 'elim') {
        b1 = r.nonzero(-6, 6); b2 = r.pick([b1, -b1]); a1 = r.nonzero(-6, 6); a2 = r.nonzero(-6, 6);
      } else {
        b1 = r.nonzero(-6, 6); b2 = r.nonzero(-6, 6); a1 = r.nonzero(-6, 6); a2 = r.nonzero(-6, 6);
        if (Math.abs(b1) === Math.abs(b2) || lcm(Math.abs(b1), Math.abs(b2)) > 12) again();
      }
      if (a1 * b2 === a2 * b1) again();
      const e1 = [a1, b1, a1 * x0 + b1 * y0], e2 = [a2, b2, a2 * x0 + b2 * y0];
      rowsTex = [eqT(a1, b1, e1[2], 'x', 'y'), eqT(a2, b2, e2[2], 'x', 'y')];
      const work = elimWork(['x', 'y'], e1, e2, [x0, y0]);
      hints = work.hints; solution = work.text;
    }
    return {
      type: 'tuple',
      prompt: `Solve the system of equations. Give the solution as an ordered pair $(x, y)$.\n\n$$${casesT(rowsTex)}$$`,
      answer: `(${x0}, ${y0})`,
      hints: hints,
      solution: solution,
      $m: { kind: kind },
    };
  };

  // F1-07 exponents and radicals (part 1: exponent laws, numeric powers, rational exponents)
  const xp = function (e) { return e === 1 ? 'x' : 'x^' + sup(e); };                          // x^e in TeX
  const xpc = function (e) { return e === 1 ? 'x' : 'x^' + (e < 0 ? '(' + e + ')' : e); };    // x^e in calculator syntax
  const mono = function (c, e) { return terms([[c, e === 0 ? '' : xp(e), e === 0 ? '' : xpc(e)]]); };   // c x^e

  function f107Exp(r) {
    const kind = r.pick(['prod', 'prod', 'quot', 'quot', 'pow', 'pow', 'mix', 'neg', 'neg']);
    let tex, ans, hints, steps, law;
    if (kind === 'prod') {
      const a = r.int(2, 8), b = r.int(2, 8);
      law = 'To multiply powers with the same base, add the exponents: $x^m \\cdot x^n = x^{m+n}$.';
      if (r.rand() < 0.5) {
        tex = `${xp(a)} \\cdot ${xp(b)}`; ans = xpc(a + b);
        steps = [tex, `x^{${a} + ${b}}`, xp(a + b)];
        hints = [law, `Here the exponents are $${a}$ and $${b}$, so add them.`];
      } else {
        const c1 = r.nonzero(-6, 6), c2 = r.nonzero(-6, 6);
        if (Math.abs(c1) < 2 || Math.abs(c2) < 2) again();
        tex = `(${mono(c1, a).tex})(${mono(c2, b).tex})`; ans = mono(c1 * c2, a + b).calc;
        steps = [tex, `(${c1} \\cdot ${pn(c2)}) \\, x^{${a} + ${b}}`, mono(c1 * c2, a + b).tex];
        law = 'Multiply the coefficients, and add the exponents of $x$: $x^m \\cdot x^n = x^{m+n}$.';
        hints = [law, `The coefficients multiply as $${c1} \\cdot ${pn(c2)}$ and the exponents add as $${a} + ${b}$.`];
      }
    } else if (kind === 'quot') {
      const a = r.int(3, 10), b = r.int(1, a - 1);
      law = 'To divide powers with the same base, subtract the exponents: $\\frac{x^m}{x^n} = x^{m-n}$.';
      if (r.rand() < 0.5) {
        tex = `\\frac{${xp(a)}}{${xp(b)}}`; ans = xpc(a - b);
        steps = [tex, `x^{${a} - ${b}}`, xp(a - b)];
        hints = [law, `Here the exponents are $${a}$ and $${b}$; subtract the bottom one from the top one.`];
      } else {
        const c2 = r.int(2, 5), k = r.nonzero(-5, 5), c1 = c2 * k;
        if (Math.abs(k) < 2) again();
        tex = `\\frac{${mono(c1, a).tex}}{${mono(c2, b).tex}}`; ans = mono(k, a - b).calc;
        steps = [tex, `(${c1} \\div ${c2}) \\, x^{${a} - ${b}}`, mono(k, a - b).tex];
        law = 'Divide the coefficients, and subtract the exponents of $x$: $\\frac{x^m}{x^n} = x^{m-n}$.';
        hints = [law, `The coefficients divide as $${c1} \\div ${pn(c2)}$ and the exponents subtract as $${a} - ${b}$.`];
      }
    } else if (kind === 'pow') {
      const a = r.int(2, 5), b = r.int(2, 4);
      law = 'To raise a power to a power, multiply the exponents: $(x^m)^n = x^{mn}$.';
      if (r.rand() < 0.5) {
        tex = `(${xp(a)})^${b}`; ans = xpc(a * b);
        steps = [tex, `x^{${a} \\cdot ${b}}`, xp(a * b)];
        hints = [law, `Here $m = ${a}$ and $n = ${b}$.`];
      } else {
        const c = r.nonzero(-3, 3), bb = r.int(2, 3);
        if (Math.abs(c) < 2) again();
        tex = `(${mono(c, a).tex})^${bb}`; ans = mono(Math.pow(c, bb), a * bb).calc;
        steps = [tex, `(${c})^{${bb}} \\, x^{${a} \\cdot ${bb}}`, mono(Math.pow(c, bb), a * bb).tex];
        law = 'Raise the coefficient to the power, and multiply the exponents: $(cx^m)^n = c^n x^{mn}$.';
        hints = [law, `The coefficient becomes $(${c})^{${bb}}$ and the exponent becomes $${a} \\cdot ${bb}$.`];
      }
    } else if (kind === 'mix') {
      const a = r.int(2, 4), b = r.int(2, 4), c = r.int(1, 5), d = r.int(1, 5);
      if (a * b - c - d < 1) again();
      tex = `\\frac{(${xp(a)})^${b}}{${xp(c)} \\cdot ${xp(d)}}`; ans = xpc(a * b - c - d);
      steps = [tex, `\\frac{x^{${a * b}}}{x^{${c + d}}}`, `x^{${a * b} - ${c + d}}`, xp(a * b - c - d)];
      law = 'Simplify the top and the bottom separately, then divide.';
      hints = [law, `On top, $(x^{${a}})^{${b}}$ multiplies the exponents. On the bottom, $x^{${c}} \\cdot x^{${d}}$ adds them.`, `Then subtract: top exponent minus bottom exponent.`];
    } else {
      const v = r.int(1, 4), n = r.int(2, 6), c = r.int(2, 6);
      if (v === 1) { tex = `x^{-${n}}`; ans = `1/x^${n}`; steps = [tex, `\\frac{1}{x^{${n}}}`]; hints = ['A negative exponent means a reciprocal: $x^{-n} = \\frac{1}{x^n}$.', `Here $n = ${n}$.`]; }
      else if (v === 2) { const a = r.int(1, 4), b = a + r.int(1, 5); tex = `\\frac{${xp(a)}}{${xp(b)}}`; ans = `1/x^${b - a}`; steps = [tex, `x^{${a} - ${b}}`, `x^{${a - b}}`, b - a === 1 ? '\\frac{1}{x}' : `\\frac{1}{x^{${b - a}}}`]; if (b - a === 1) ans = '1/x'; hints = ['Subtract the exponents, $\\frac{x^m}{x^n} = x^{m-n}$, then rewrite any negative exponent as a reciprocal.', `Here $${a} - ${b} = ${a - b}$.`]; }
      else if (v === 3) { tex = `${c}x^{-${n}}`; ans = `${c}/x^${n}`; steps = [tex, `${c} \\cdot \\frac{1}{x^{${n}}}`, `\\frac{${c}}{x^{${n}}}`]; hints = ['Only the $x$ is raised to the negative power; the coefficient stays where it is. $x^{-n} = \\frac{1}{x^n}$.', `Rewrite $x^{-${n}}$ as a reciprocal.`]; }
      else { tex = `\\frac{${c}}{x^{-${n}}}`; ans = `${c}x^${n}`; steps = [tex, `${c} \\cdot x^{${n}}`, `${c}x^{${n}}`]; hints = ['Dividing by $x^{-n}$ is the same as multiplying by $x^{n}$.', `Move $x^{-${n}}$ from the bottom to the top by changing the sign of its exponent.`]; }
      law = 'A negative exponent means a reciprocal. Move the factor across the fraction bar and change the sign of the exponent.';
    }
    return {
      type: 'expr', vars: ['x'], domain: 'x: 1..4',
      prompt: `Simplify $${tex}$.` + (kind === 'neg' ? ' Write the result with positive exponents only.' : ''),
      answer: ans,
      hints: hints,
      solution: `${law}\n\n${disp(steps)}`,
    };
  }

  function f107Num(r) {
    const kind = r.pick(['prod', 'quot', 'pow', 'neg', 'neg2', 'mix']);
    const b = r.int(2, 5), a = r.int(2, 6), c = r.int(2, 5);
    const pw = function (e) { return e === 1 ? String(b) : `${b}^${sup(e)}`; };
    let tex, val, steps, hints;
    if (kind === 'prod') {
      if (Math.pow(b, a + c) > 20000) again();
      tex = `${b}^${sup(a)} \\cdot ${b}^${sup(c)}`; val = fr(Math.pow(b, a + c), 1);
      steps = [tex, `${b}^{${a} + ${c}}`, pw(a + c), val[0]];
      hints = ['When you multiply powers with the same base, add the exponents.', `The exponents are $${a}$ and $${c}$, so the result is $${b}$ to the power $${a} + ${c}$.`];
    } else if (kind === 'quot') {
      if (a <= c) again();
      tex = `\\frac{${b}^${sup(a)}}{${b}^${sup(c)}}`; val = fr(Math.pow(b, a - c), 1);
      steps = [tex, `${b}^{${a} - ${c}}`, pw(a - c), val[0]];
      hints = ['When you divide powers with the same base, subtract the exponents.', `Subtract the bottom exponent from the top: $${a} - ${c}$.`];
    } else if (kind === 'pow') {
      const a2 = r.int(2, 3), c2 = r.int(2, 3);
      if (Math.pow(b, a2 * c2) > 20000) again();
      tex = `(${b}^${a2})^${c2}`; val = fr(Math.pow(b, a2 * c2), 1);
      steps = [tex, `${b}^{${a2} \\cdot ${c2}}`, `${b}^${sup(a2 * c2)}`, val[0]];
      hints = ['When you raise a power to a power, multiply the exponents.', `Multiply $${a2} \\cdot ${c2}$ to get the new exponent.`];
    } else if (kind === 'neg') {
      const n = r.int(2, 4);
      tex = `${b}^{-${n}}`; val = fr(1, Math.pow(b, n));
      steps = [tex, `\\frac{1}{${b}^${sup(n)}}`, `\\frac{1}{${Math.pow(b, n)}}`];
      hints = ['A negative exponent means a reciprocal: $b^{-n} = \\frac{1}{b^n}$.', `Evaluate $${b}^${sup(n)}$ and put it in the denominator.`];
    } else if (kind === 'neg2') {
      const p = r.int(2, 4), q = r.int(2, 5), n = r.int(2, 3);
      if (gcd(p, q) !== 1 || p === q) again();
      tex = `\\left(\\frac{${p}}{${q}}\\right)^{-${n}}`; val = fr(Math.pow(q, n), Math.pow(p, n));
      steps = [tex, `\\left(\\frac{${q}}{${p}}\\right)^{${n}}`, fracTex(Math.pow(q, n), Math.pow(p, n))];
      hints = ['A negative exponent on a fraction flips the fraction: $\\left(\\frac{p}{q}\\right)^{-n} = \\left(\\frac{q}{p}\\right)^{n}$.', `Flip $\\frac{${p}}{${q}}$ and use the exponent $${n}$.`];
    } else {
      if (a <= c || Math.pow(b, a) > 20000) again();
      tex = `${b}^${sup(a)} \\cdot ${b}^{-${c}}`; val = fr(Math.pow(b, a - c), 1);
      steps = [tex, `${b}^{${a} + (-${c})}`, pw(a - c), val[0]];
      hints = ['Add the exponents when multiplying powers with the same base, even if one of them is negative.', `The exponents are $${a}$ and $-${c}$.`];
    }
    return {
      type: 'num',
      prompt: `Evaluate $${tex}$. Give an exact value.`,
      answer: fcalc(val),
      hints: hints,
      solution: `${disp(steps)}\n\nThe value is $${ftex(val)}$.`,
    };
  }

  function f107Rat(r) {
    const k = r.int(2, 5), p = r.nonzero(-4, 4);
    if (gcd(Math.abs(p), k) !== 1) again();
    const frac = r.rand() < 0.25 && k <= 3;
    let n1 = r.int(2, 6), n2 = 1;
    if (frac) { n1 = r.int(1, 4); n2 = r.int(2, 4); if (gcd(n1, n2) !== 1) again(); }
    const top = Math.pow(n1, k), bot = Math.pow(n2, k);
    if (top > 1000 || bot > 1000) again();
    const base = frac ? `\\left(\\frac{${top}}{${bot}}\\right)` : String(top);
    const root = k === 2 ? '\\sqrt' : `\\sqrt[${k}]`;
    const rootOf = frac ? `${root}{\\frac{${top}}{${bot}}}` : `${root}{${top}}`;
    const inner = frac ? `\\frac{${n1}}{${n2}}` : String(n1);
    const num = p > 0 ? Math.pow(n1, p) : Math.pow(n2, -p), den = p > 0 ? Math.pow(n2, p) : Math.pow(n1, -p);
    const res = fr(num, den);
    const expo = `${p < 0 ? '-' : ''}\\frac{${Math.abs(p)}}{${k}}`;
    return {
      type: 'num',
      prompt: `Evaluate $${base}^{${expo}}$. Give an exact value.`,
      answer: fcalc(res),
      hints: [
        `A rational exponent means a root and a power: $a^{m/n} = \\left(${k === 2 ? '\\sqrt{a}' : '\\sqrt[n]{a}'}\\right)^m$, with $n = ${k}$ here.`,
        `Find the ${k === 2 ? 'square' : k === 3 ? 'cube' : k + 'th'} root first: $${rootOf} = ${inner}$.` + (p < 0 ? ' The negative sign in the exponent means you take a reciprocal at the end.' : ''),
        `Now raise $${inner}$ to the power $${Math.abs(p)}$${p < 0 ? ' and take the reciprocal' : ''}.`,
      ],
      solution: `Write the exponent as a root and a power:\n\n${disp([`${base}^{${expo}}`, `\\left(${rootOf}\\right)^{${p}}`, `${frac ? '\\left(' + inner + '\\right)' : inner}^{${p}}`, ftex(res)])}\n\nThe value is $${ftex(res)}$.`,
    };
  }

  // F1-07 part 2: radicals
  const rootSplit = function (n, idx) {                     // n = s^idx * t with s as large as possible
    let s = 1;
    for (let d = 2; Math.pow(d, idx) <= n; d++) { while (n % Math.pow(d, idx) === 0) { n /= Math.pow(d, idx); s *= d; } }
    return { s: s, t: n };
  };
  const radical = function (t, idx) { return idx === 2 ? '\\sqrt{' + t + '}' : '\\sqrt[' + idx + ']{' + t + '}'; };
  const radT = function (c, t, idx) { return t === 1 ? String(c) : (c === 1 ? '' : c === -1 ? '-' : String(c)) + radical(t, idx || 2); };
  const radC = function (c, t, idx) { return t === 1 ? String(c) : (c === 1 ? '' : c === -1 ? '-' : String(c)) + (idx === 3 ? 'cbrt(' : 'sqrt(') + t + ')'; };

  function f107Rad(r) {
    const kind = r.pick(['simp', 'simp', 'simp3', 'sum', 'prod', 'ratl', 'quot']);
    const SQF = [2, 3, 5, 6, 7, 10, 11, 13];
    const note = ' Write your answer in simplest radical form.';
    if (kind === 'simp' || kind === 'simp3') {
      const idx = kind === 'simp' ? 2 : 3;
      const t = r.pick(idx === 2 ? SQF : [2, 3, 4, 5, 6, 7]), s = r.int(2, idx === 2 ? 9 : 4), n = Math.pow(s, idx) * t;
      const sp = rootSplit(n, idx);
      if (sp.s !== s || sp.t !== t || n > 500) again();
      const pw = Math.pow(s, idx), nameP = idx === 2 ? 'square' : 'cube';
      return {
        type: 'num',
        prompt: `Simplify $${radical(n, idx)}$.` + note,
        answer: radC(s, t, idx),
        hints: [
          `Look for the largest perfect ${nameP} that divides $${n}$ (${idx === 2 ? '4, 9, 16, 25, 36, 49, 64, 81, ...' : '8, 27, 64, 125, ...'}).`,
          `$${n} = ${pw} \\cdot ${t}$, and $${pw}$ is a perfect ${nameP}.`,
          `Use $${radical('ab', idx)} = ${radical('a', idx)} \\cdot ${radical('b', idx)}$ and take the ${idx === 2 ? 'square' : 'cube'} root of the perfect ${nameP}.`,
        ],
        solution: `Pull out the largest perfect ${nameP} factor.\n\n${disp([radical(n, idx), radical(pw + ' \\cdot ' + t, idx), radical(pw, idx) + ' \\cdot ' + radical(t, idx), radT(s, t, idx)])}\n\nSo $${radical(n, idx)} = ${radT(s, t, idx)}$.`,
      };
    }
    if (kind === 'sum') {
      const t = r.pick([2, 3, 5, 6, 7]), k1 = r.int(1, 4), k2 = r.int(1, 4), s1 = r.int(1, 5), s2 = r.int(1, 5), op = r.pick(['+', '-']);
      if (s1 === 1 && s2 === 1) again();
      if (s1 === s2) again();
      const R = k1 * s1 + (op === '+' ? 1 : -1) * k2 * s2;
      if (R === 0) again();
      const n1 = s1 * s1 * t, n2 = s2 * s2 * t;
      const term = function (k, n) { return (k === 1 ? '' : k) + radical(n, 2); };
      const simp = function (k, n, s) {
        return disp(s === 1 ? [term(k, n)] : k === 1 ? [radical(n, 2), radT(s, t)] : [term(k, n), `${k} \\cdot ${s}${radical(t, 2)}`, radT(k * s, t)]);
      };
      const parts = [];
      if (s1 > 1) parts.push(`$${radical(n1, 2)} = ${s1}${radical(t, 2)}$`);
      if (s2 > 1) parts.push(`$${radical(n2, 2)} = ${s2}${radical(t, 2)}$`);
      return {
        type: 'num',
        prompt: `Simplify $${term(k1, n1)} ${op} ${term(k2, n2)}$.` + note,
        answer: radC(R, t),
        hints: [
          'Simplify each radical first, so that both terms contain the same radical.',
          `For example, ${parts.join(' and ')}.`,
          'Then combine like radicals by adding or subtracting their coefficients.',
        ],
        solution: `Simplify each radical so the terms have the same radical part.\n\n${simp(k1, n1, s1)}\n\n${simp(k2, n2, s2)}\n\nCombine like radicals:\n\n${disp([`${radT(k1 * s1, t)} ${op} ${radT(k2 * s2, t)}`, radT(R, t)])}`,
      };
    }
    if (kind === 'prod') {
      const a = r.int(2, 20), b = r.int(2, 20), sp = rootSplit(a * b, 2);
      if (sp.t === 1 || sp.s === 1 || a === b) again();
      return {
        type: 'num',
        prompt: `Simplify $${radical(a, 2)} \\cdot ${radical(b, 2)}$.` + note,
        answer: radC(sp.s, sp.t),
        hints: [
          `Combine the radicals: $\\sqrt{a} \\cdot \\sqrt{b} = \\sqrt{ab}$.`,
          `Multiply under the radical: $${a} \\cdot ${b} = ${a * b}$.`,
          'Now simplify the radical by pulling out the largest perfect square factor.',
        ],
        solution: `${disp([`${radical(a, 2)} \\cdot ${radical(b, 2)}`, radical(a * b, 2), radical(sp.s * sp.s + ' \\cdot ' + sp.t, 2), radT(sp.s, sp.t)])}\n\nSo the product is $${radT(sp.s, sp.t)}$.`,
      };
    }
    if (kind === 'ratl') {
      const t = r.pick([2, 3, 5, 6, 7]), c = r.int(1, 12), g = gcd(c, t), n = c / g, d = t / g;
      const fin = d === 1 ? radT(n, t) : `\\frac{${n === 1 ? '' : n}${radical(t, 2)}}{${d}}`;
      const unreduced = `\\frac{${c === 1 ? '' : c}${radical(t, 2)}}{${t}}`;
      return {
        type: 'num',
        prompt: `Rationalize the denominator of $\\frac{${c}}{${radical(t, 2)}}$.` + note,
        answer: d === 1 ? radC(n, t) : `${n === 1 ? '' : n}sqrt(${t})/${d}`,
        hints: [
          `Multiply the top and bottom by $${radical(t, 2)}$. This does not change the value of the fraction.`,
          `Since $${radical(t, 2)} \\cdot ${radical(t, 2)} = ${t}$, the new denominator is a whole number.`,
          'Reduce the fraction if the numerator and denominator share a common factor.',
        ],
        solution: `Multiply the numerator and denominator by $${radical(t, 2)}$.\n\n${disp([`\\frac{${c}}{${radical(t, 2)}}`, `\\frac{${c}}{${radical(t, 2)}} \\cdot \\frac{${radical(t, 2)}}{${radical(t, 2)}}`, unreduced].concat(unreduced !== fin ? [fin] : []))}\n\nThe result is $${fin}$.`,
      };
    }
    // quotient of radicals that simplifies to a rational number
    const t = r.pick([2, 3, 5, 6, 7]), u = r.int(1, 6), w = r.int(1, 6);
    if (gcd(u, w) !== 1 || u === w || t * u * u > 250 || t * w * w > 250) again();
    const a = t * u * u, b = t * w * w, val = fr(u, w);
    return {
      type: 'num',
      prompt: `Simplify $\\frac{${radical(a, 2)}}{${radical(b, 2)}}$.`,
      answer: fcalc(val),
      hints: [
        'Combine into one radical: $\\frac{\\sqrt{a}}{\\sqrt{b}} = \\sqrt{\\frac{a}{b}}$.',
        `Reduce the fraction $\\frac{${a}}{${b}}$ under the radical to lowest terms.`,
        'Then take the square root of the numerator and of the denominator.',
      ],
      solution: `${disp([`\\frac{${radical(a, 2)}}{${radical(b, 2)}}`, `\\sqrt{\\frac{${a}}{${b}}}`, `\\sqrt{\\frac{${u * u}}{${w * w}}}`, ftex(val)])}\n\nThe value is $${ftex(val)}$.`,
    };
  }

  G['F1-07'] = function (r) {
    const which = r.pick(['exp', 'exp', 'exp', 'num', 'rat', 'rat', 'rad', 'rad', 'rad', 'rad']);
    return which === 'exp' ? f107Exp(r) : which === 'num' ? f107Num(r) : which === 'rat' ? f107Rat(r) : f107Rad(r);
  };

  // F1-08 polynomial operations
  // ptl(c): the term list of the polynomial with ascending coefficients c, highest power first, zeros dropped
  const ptl = function (c) {
    const list = [];
    for (let i = c.length - 1; i >= 0; i--) if (c[i] !== 0) list.push([c[i], i === 0 ? '' : xp(i), i === 0 ? '' : xpc(i), i]);
    return list;
  };
  const nzTerms = function (c) { return c.filter(function (x) { return x !== 0; }).length; };

  G['F1-08'] = function (r) {
    const kind = r.pick(['foil', 'foil2', 'foil2', 'square', 'diffsq', 'tri', 'mono', 'add', 'sub', 'sub']);
    const T = function (c) { return poly(c).tex; };
    const wrap = function (c) { return '(' + T(c) + ')'; };
    const unit = function (c, d) { return mono(c, d).tex; };                          // c x^d
    let P, Q, op = '*', tex;
    if (kind === 'foil') {
      const a = r.nonzero(-9, 9), b = r.nonzero(-9, 9);
      if (a === -b) again();
      P = [a, 1]; Q = [b, 1];
    } else if (kind === 'foil2') {
      const p = r.nonzero(-4, 4), q = r.nonzero(-4, 4), a = r.nonzero(-8, 8), b = r.nonzero(-8, 8);
      if (Math.abs(p * q) < 2 || p < 0 && q < 0) again();
      P = [a, p]; Q = [b, q];
    } else if (kind === 'square') {
      const p = r.int(1, 4), a = r.nonzero(-8, 8);
      P = [a, p]; Q = [a, p];
    } else if (kind === 'diffsq') {
      const p = r.int(1, 5), a = r.int(1, 9);
      P = [a, p]; Q = [-a, p];
      if (r.rand() < 0.5) { const t = P; P = Q; Q = t; }
    } else if (kind === 'tri') {
      const a = r.nonzero(-4, 4), b = r.nonzero(-6, 6), c = r.nonzero(-3, 3), d = r.nonzero(-5, 5), e = r.nonzero(-6, 6);
      P = [b, a]; Q = [e, d, c];
    } else if (kind === 'mono') {
      const m = r.nonzero(-6, 6), k = r.int(1, 3), c = r.nonzero(-4, 4), d = r.nonzero(-6, 6), e = r.nonzero(-6, 6);
      if (Math.abs(m) < 2) again();
      P = new Array(k).fill(0).concat([m]); Q = r.rand() < 0.5 ? [e, d, c] : [e, d];
    } else {
      P = [r.int(-9, 9), r.int(-9, 9), r.nonzero(-6, 6)]; Q = [r.int(-9, 9), r.int(-9, 9), r.nonzero(-6, 6)];
      if (r.rand() < 0.3) { P.push(r.nonzero(-4, 4)); Q.push(r.int(-4, 4)); }
      op = kind === 'add' ? '+' : '-';
      if (nzTerms(P) < 3 || nzTerms(Q) < 3) again();
    }
    let res, chain, hints, prompt;
    if (op === '*') {
      res = pmul(P, Q);
      if (nzTerms(res) < 3 && kind !== 'diffsq') again();
      const sq = kind === 'square';
      tex = sq ? `(${T(P)})^2` : kind === 'mono' ? `${unit(P[P.length - 1], P.length - 1)}(${T(Q)})` : `${wrap(P)}${wrap(Q)}`;
      const raw = [];
      ptl(P).forEach(function (a) { ptl(Q).forEach(function (b) { raw.push([a[0] * b[0], a[3] + b[3]]); }); });
      const rawTex = terms(raw.map(function (x) { return [x[0], x[1] === 0 ? '' : xp(x[1]), x[1] === 0 ? '' : xpc(x[1])]; })).tex;
      const partial = ptl(P).map(function (a, i) {
        const c = a[0], d = a[3], sg = c < 0 ? ' - ' : ' + ', mag = (Math.abs(c) === 1 && d > 0 ? '' : Math.abs(c)) + (d === 0 ? '' : xp(d));
        return (i === 0 ? (c < 0 ? '-' : '') : sg) + mag + '(' + T(Q) + ')';
      }).join('');
      chain = kind === 'mono' ? [tex, rawTex, T(res)] : [tex, sq ? `${wrap(P)}${wrap(P)}` : null, partial, rawTex, T(res)].filter(Boolean);
      if (kind === 'mono') {
        hints = ['Distribute the monomial: multiply it by every term inside the brackets.',
          `For each term, multiply the coefficients and add the exponents of $x$. For example, the first product is $${unit(P[P.length - 1], P.length - 1)} \\cdot ${par(unit(ptl(Q)[0][0], ptl(Q)[0][3]))}$.`,
          'Write all the products, then check that no bracket remains.'];
      } else {
        hints = [sq ? 'Squaring means multiplying the bracket by itself. Multiply every term of the first bracket by every term of the second.' : 'Multiply every term of the first bracket by every term of the second bracket (distribute).',
          `Distribute the first bracket over the second: $${partial}$.`,
          'Multiply out each piece, then combine like terms (the terms with the same power of $x$).'];
      }
      prompt = `Expand and simplify $${tex}$. Write your answer in expanded form.`;
    } else {
      res = op === '+' ? padd(P, Q) : padd(P, pscale(Q, -1));
      if (nzTerms(res) < 2) again();
      tex = `${wrap(P)} ${op} ${wrap(Q)}`;
      const dropped = terms(ptl(P).concat(ptl(Q).map(function (t) { return [op === '+' ? t[0] : -t[0], t[1], t[2]]; }))).tex;
      chain = [tex, dropped, T(res)];
      hints = op === '+'
        ? ['For addition the brackets can simply be removed.', `Write the sum without brackets: $${dropped}$.`, 'Group the like terms (the terms with the same power of $x$) and add their coefficients.']
        : ['Subtracting a polynomial changes the sign of every term inside the second bracket.', `So $${wrap(P)} - ${wrap(Q)}$ becomes $${dropped}$.`, 'Now group the like terms (the terms with the same power of $x$) and combine them.'];
      prompt = `Simplify $${tex}$. Write your answer in standard form, with the highest power of $x$ first.`;
    }
    return {
      type: 'expr', vars: ['x'], form: 'expanded',
      prompt: prompt,
      answer: poly(res).calc,
      hints: hints,
      solution: `${op === '*' ? 'Multiply out the brackets, then combine like terms.' : op === '+' ? 'Remove the brackets and combine like terms.' : 'Distribute the minus sign over the second bracket, then combine like terms.'}\n\n${disp(chain)}\n\nThe result is $${T(res)}$.`,
      $m: { kind: kind },
    };
  };

  // F1-09 factoring and quadratics (part 1: factoring)
  const linF = function (a, p) { return lin(a, p, 'x'); };                          // ax + p as { tex, calc }
  const quadTex = function (A, B, C) { return poly([C, B, A]).tex; };

  function f109Factor(r) {
    const kind = r.pick(['f1', 'f1', 'f2', 'f2', 'gcf', 'dsq']);
    let A, B, C, ans, hints, solution;
    if (kind === 'f1') {
      const p = r.nonzero(-9, 9), q = r.nonzero(-9, 9);
      if (p + q === 0) again();
      if (p === q && r.rand() < 0.6) again();
      A = 1; B = p + q; C = p * q;
      ans = `(${linF(1, p).calc})(${linF(1, q).calc})`;
      hints = [
        `Look for two numbers whose product is the constant term $${C}$ and whose sum is the coefficient of $x$, which is $${B}$.`,
        `List the factor pairs of $${C}$ (remember that one or both can be negative) and check which pair adds up to $${B}$.`,
        'If those numbers are $p$ and $q$, the trinomial factors as $(x + p)(x + q)$.',
      ];
      const lo = Math.min(p, q), hi = Math.max(p, q);
      solution = `We need two numbers with product $${C}$ and sum $${B}$. The numbers $${lo}$ and $${hi}$ work, since $${lo} \\cdot ${pn(hi)} = ${C}$ and $${lo} + ${pn(hi)} = ${B}$.\n\n${disp([quadTex(A, B, C), `(${linF(1, p).tex})(${linF(1, q).tex})`])}`;
    } else if (kind === 'f2') {
      const a = r.int(1, 4), b = r.int(1, 4), p = r.nonzero(-8, 8), q = r.nonzero(-8, 8);
      A = a * b; B = a * q + b * p; C = p * q;
      if (A < 2 || B === 0 || gcd(a, Math.abs(p)) !== 1 || gcd(b, Math.abs(q)) !== 1 || gcd(gcd(A, Math.abs(B)), Math.abs(C)) !== 1) again();
      ans = `(${linF(a, p).calc})(${linF(b, q).calc})`;
      const m = a * q, n = b * p;
      hints = [
        `Use the "ac method": multiply the leading coefficient and the constant term, $${A} \\cdot ${pn(C)} = ${A * C}$.`,
        `Find two numbers whose product is $${A * C}$ and whose sum is the middle coefficient $${B}$.`,
        'Split the middle term into two terms using those numbers, then factor by grouping.',
      ];
      const grouped = `${linF(a, 0).tex === 'x' ? 'x' : linF(a, 0).tex}(${linF(b, q).tex})${p < 0 ? ' - ' : ' + '}${Math.abs(p) === 1 ? '' : Math.abs(p)}(${linF(b, q).tex})`;
      solution = `Multiply $a \\cdot c = ${A} \\cdot ${pn(C)} = ${A * C}$. We need two numbers with product $${A * C}$ and sum $${B}$: they are $${m}$ and $${n}$.\n\nSplit the middle term and factor by grouping:\n\n${disp([quadTex(A, B, C), terms([[A, 'x^2'], [m, 'x'], [n, 'x'], [C, '']]).tex, grouped, `(${linF(a, p).tex})(${linF(b, q).tex})`])}`;
    } else if (kind === 'gcf') {
      const k = r.int(2, 5), p = r.nonzero(-8, 8), q = r.nonzero(-8, 8);
      if (p + q === 0 && r.rand() < 0.5) again();
      A = k; B = k * (p + q); C = k * p * q;
      ans = `${k}(${linF(1, p).calc})(${linF(1, q).calc})`;
      hints = [
        `First look for a common factor of all three terms: $${A}$, $${B}$ and $${C}$ share a factor you can pull out.`,
        `The greatest common factor is $${k}$. Write $${quadTex(A, B, C)} = ${k}(${quadTex(1, B / k, C / k)})$.`,
        'Now factor the trinomial inside the brackets: find two numbers with the right product and sum.',
      ];
      solution = `All three coefficients are multiples of $${k}$, so factor out $${k}$ first:\n\n$$${quadTex(A, B, C)} = ${k}(${quadTex(1, B / k, C / k)})$$\n\nInside the brackets we need two numbers with product $${p * q}$ and sum $${p + q}$: $${Math.min(p, q)}$ and $${Math.max(p, q)}$.\n\n$$${k}(${quadTex(1, B / k, C / k)}) = ${k}(${linF(1, p).tex})(${linF(1, q).tex})$$`;
    } else {
      const pcoef = r.int(1, 5), m = r.int(1, 9);
      if (gcd(pcoef, m) !== 1) again();
      A = pcoef * pcoef; B = 0; C = -m * m;
      ans = `(${linF(pcoef, -m).calc})(${linF(pcoef, m).calc})`;
      hints = [
        'Both terms are perfect squares and they are subtracted: this is a difference of squares, $a^2 - b^2 = (a - b)(a + b)$.',
        `Here $${A === 1 ? '' : A}x^2 = (${pcoef === 1 ? '' : pcoef}x)^2$ and $${m * m} = ${m}^2$, so $a = ${pcoef === 1 ? '' : pcoef}x$ and $b = ${m}$.`,
        'Substitute $a$ and $b$ into $(a - b)(a + b)$.',
      ];
      solution = `This is a difference of squares: $a^2 - b^2 = (a - b)(a + b)$ with $a = ${pcoef === 1 ? '' : pcoef}x$ and $b = ${m}$.\n\n${disp([quadTex(A, 0, C), `(${pcoef === 1 ? '' : pcoef}x)^2 - ${m}^2`, `(${linF(pcoef, -m).tex})(${linF(pcoef, m).tex})`])}`;
    }
    return {
      type: 'expr', vars: ['x'], form: 'factored',
      prompt: kind === 'gcf' ? `Factor completely: $${quadTex(A, B, C)}$.` : `Factor: $${quadTex(A, B, C)}$.`,
      answer: ans, hints: hints, solution: solution,
      $m: { kind: kind },
    };
  }

  // F1-09 part 2: solving quadratics
  const SOLVE_NOTE = ' Enter all real solutions separated by commas, or `none` if there are no real solutions.';
  const sortedFr = function (list) { return list.slice().sort(function (a, b) { return fval(a) - fval(b); }).filter(function (x, i, arr) { return i === 0 || fval(x) !== fval(arr[i - 1]); }); };
  const orWord = function (list) { return list.map(function (x) { return '$x = ' + x + '$'; }).join(' or '); };                // in running text
  const orTex = function (list) { return list.map(function (x) { return 'x = ' + x; }).join(' \\quad\\text{or}\\quad '); };       // inside display math

  function f109Solve(r) {
    const kind = r.pick(['s1', 's1', 's2', 's3', 'frm', 'frm', 'frm']);
    if (kind === 's1' || kind === 's2') {
      let A, B, C, f1, f2, roots, factored;
      if (kind === 's1') {
        const r1 = r.nonzero(-8, 8), r2 = r.nonzero(-8, 8);
        if (r1 === r2 && r.rand() < 0.7) again();
        A = 1; B = -(r1 + r2); C = r1 * r2;
        f1 = linF(1, -r1); f2 = linF(1, -r2); roots = sortedFr([fr(r1), fr(r2)]);
      } else {
        const a = r.int(1, 4), b = r.int(1, 4), p = r.nonzero(-8, 8), q = r.nonzero(-8, 8);
        A = a * b; B = a * q + b * p; C = p * q;
        if (A < 2 || B === 0 || gcd(a, Math.abs(p)) !== 1 || gcd(b, Math.abs(q)) !== 1 || gcd(gcd(A, Math.abs(B)), Math.abs(C)) !== 1) again();
        f1 = linF(a, p); f2 = linF(b, q); roots = sortedFr([fr(-p, a), fr(-q, b)]);
      }
      const form = r.int(0, 2);
      let lhs, rhs;
      if (form === 0 || B === 0 && form === 1) { lhs = quadTex(A, B, C); rhs = '0'; }
      else if (form === 1) { lhs = terms([[A, 'x^2'], [B, 'x']]).tex; rhs = String(-C); }
      else { lhs = terms([[A, 'x^2']]).tex; rhs = terms([[-B, 'x'], [-C, '']]).tex; }
      const std = quadTex(A, B, C), moved = !(lhs === std);
      const eqn = `${lhs} = ${rhs}`;
      const zeroSteps = roots.length === 1 ? [`${f1.tex} = 0`, `x = ${ftex(roots[0])}`] : [`${f1.tex} = 0 \\quad\\text{or}\\quad ${f2.tex} = 0`, orTex(roots.map(ftex))];
      return {
        type: 'list',
        prompt: `Solve $${eqn}$.` + SOLVE_NOTE,
        answer: roots.map(fcalc).join(', '),
        hints: [
          moved ? 'First move every term to one side so that the equation reads $\\ldots = 0$.' : 'Factor the quadratic expression on the left side.',
          kind === 's1' ? `Find two numbers with product $${C}$ and sum $${B}$ and write $${std} = 0$ in factored form.`
            : `Use the "ac method": the product $${A} \\cdot ${pn(C)} = ${A * C}$ and the middle coefficient $${B}$ tell you how to split the middle term before factoring by grouping.`,
          'Use the zero product property: set each factor equal to $0$ and solve each little equation.',
        ],
        solution: (moved ? `Move everything to one side:\n\n$$${std} = 0$$\n\n` : '') + `Factor the left side:\n\n$$(${f1.tex})(${f2.tex}) = 0$$\n\nA product is zero only when one of its factors is zero:\n\n$$${zeroSteps[0]}$$\n\n$$${zeroSteps[1]}$$`,
        $m: { kind: kind },
      };
    }
    if (kind === 's3') {
      const v = r.int(0, 3);
      let eqn, roots, hints, sol;
      if (v === 0) {
        const m = r.int(2, 12);
        eqn = r.rand() < 0.5 ? `x^2 = ${m * m}` : `x^2 - ${m * m} = 0`;
        roots = [fr(-m), fr(m)];
        hints = ['Isolate $x^2$, then take the square root of both sides.', 'A positive number has two square roots: the positive one and the negative one.'];
        sol = `Isolate $x^2$: $x^2 = ${m * m}$. Take the square root of both sides, keeping both signs:\n\n$$x = \\pm\\sqrt{${m * m}} = \\pm ${m}$$`;
      } else if (v === 1) {
        const k = r.int(2, 6), m = r.int(2, 9);
        eqn = `${k}x^2 = ${k * m * m}`;
        roots = [fr(-m), fr(m)];
        hints = [`Divide both sides by $${k}$ to isolate $x^2$.`, 'Then take the square root of both sides: remember both the positive and the negative root.'];
        sol = `Divide both sides by $${k}$: $x^2 = ${m * m}$. Then take square roots, keeping both signs:\n\n$$x = \\pm\\sqrt{${m * m}} = \\pm ${m}$$`;
      } else if (v === 2) {
        const p = r.nonzero(-6, 6), m = r.int(1, 8);
        eqn = `(${linF(1, p).tex})^2 = ${m * m}`;
        roots = sortedFr([fr(-p - m), fr(-p + m)]);
        hints = ['The squared bracket is already isolated, so take the square root of both sides (both signs).', `That gives $${linF(1, p).tex} = \\pm ${m}$. Now solve for $x$.`];
        sol = `Take the square root of both sides, keeping both signs:\n\n$$${linF(1, p).tex} = \\pm ${m}$$\n\nNow ${p > 0 ? 'subtract' : 'add'} $${Math.abs(p)}$ on both sides: $x = ${-p} \\pm ${m}$.`;
      } else {
        const m = r.int(1, 12);
        eqn = r.rand() < 0.5 ? `x^2 = -${m}` : `x^2 + ${m} = 0`;
        roots = [];
        hints = ['Isolate $x^2$.', 'Can the square of a real number ever be negative?'];
        sol = `Isolate $x^2$: $x^2 = -${m}$. The square of a real number is never negative, so there are no real solutions.`;
      }
      return {
        type: 'list',
        prompt: `Solve $${eqn}$.` + SOLVE_NOTE,
        answer: roots.length ? roots.map(fcalc).join(', ') : 'none',
        hints: hints,
        solution: roots.length ? `${sol}\n\nSo ${orWord(roots.map(ftex))}.` : sol,
        $m: { kind: kind },
      };
    }
    // quadratic formula
    const a = r.int(1, 3), b = r.nonzero(-9, 9), c = r.nonzero(-9, 9), D = b * b - 4 * a * c;
    const neg = D < 0, sp = rootSplit(Math.abs(D), 2);
    if (D === 0 || (!neg && sp.t === 1)) again();
    if (neg && r.rand() < 0.6) again();
    const eqn = `${quadTex(a, b, c)} = 0`;
    const hints = [
      `The quadratic formula is $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$. Here $a = ${a}$, $b = ${b}$ and $c = ${c}$.`,
      `Compute the discriminant first: $b^2 - 4ac = ${pn(b)}^2 - 4 \\cdot ${a} \\cdot ${pn(c)}$.`,
      'Simplify the radical, then reduce the fractions. If the discriminant is negative there are no real solutions.',
    ];
    const discr = `b^2 - 4ac = ${pn(b)}^2 - 4 \\cdot ${a} \\cdot ${pn(c)} = ${b * b}${sgn(-4 * a * c)} = ${D}`;
    if (neg) {
      return {
        type: 'list',
        prompt: `Use the quadratic formula to solve $${eqn}$.` + SOLVE_NOTE,
        answer: 'none', hints: hints,
        solution: `With $a = ${a}$, $b = ${b}$, $c = ${c}$ the discriminant is\n\n$$${discr}$$\n\nIt is negative, so $\\sqrt{${D}}$ is not a real number and the equation has no real solutions.`,
        $m: { kind: kind },
      };
    }
    const s = sp.s, t = sp.t, g = gcd(gcd(Math.abs(b), s), 2 * a), nb = -b / g, ss = s / g, den = 2 * a / g;
    const sq = (ss === 1 ? '' : ss) + 'sqrt(' + t + ')';
    const wrapN = function (sign) { return den === 1 ? `${nb}${sign}${sq}` : `(${nb}${sign}${sq})/${den}`; };
    const rootTex = den === 1 ? `${nb} \\pm ${ss === 1 ? '' : ss}\\sqrt{${t}}` : `\\frac{${nb} \\pm ${ss === 1 ? '' : ss}\\sqrt{${t}}}{${den}}`;
    const stepTex = `\\frac{${-b} \\pm \\sqrt{${D}}}{${2 * a}}`;
    const steps = [`x`, stepTex];
    if (s > 1) steps.push(`\\frac{${-b} \\pm ${s}\\sqrt{${t}}}{${2 * a}}`);
    if (g > 1 || den === 1) steps.push(rootTex);
    return {
      type: 'list',
      prompt: `Use the quadratic formula to solve $${eqn}$. Give exact solutions.` + SOLVE_NOTE,
      answer: wrapN('-') + ', ' + wrapN('+'),
      hints: hints,
      solution: `With $a = ${a}$, $b = ${b}$, $c = ${c}$ the discriminant is\n\n$$${discr}$$\n\n${s > 1 ? `Simplify the radical: $\\sqrt{${D}} = ${s}\\sqrt{${t}}$.\n\n` : ''}${disp(steps)}\n\nThe two solutions are $x = ${rootTex.replace('\\pm', '+')}$ and $x = ${rootTex.replace('\\pm', '-')}$.`,
      $m: { kind: kind, D: D },
    };
  }

  G['F1-09'] = function (r) { return r.rand() < 0.4 ? f109Factor(r) : f109Solve(r); };

  // F1-10 rational expressions
  const fracXT = function (n, d) { return `\\frac{${n}}{${d}}`; };
  const excludedNote = function (vals) { return vals.map(function (v) { return `x \\neq ${ftex(v)}`; }).join(' \\text{ and } '); };

  G['F1-10'] = function (r) {
    const kind = r.pick(['rs1', 'rs1', 'rs2', 'rs3', 'rs4', 'excl', 'excl', 'excl']);
    if (kind !== 'excl') {
      const c = r.nonzero(-8, 8), a = r.nonzero(-8, 8), d = r.nonzero(-8, 8);
      let N, Dn, ans, ansNum, ansDen, factN, factD, hints, excl;
      if (kind === 'rs1') {
        if (a === c || d === c || a === d || a + c === 0 || c + d === 0) again();
        N = pmul([c, 1], [a, 1]); Dn = pmul([c, 1], [d, 1]);
        ansNum = [a, 1]; ansDen = [d, 1];
        ans = `(${linF(1, a).calc})/(${linF(1, d).calc})`;
        factN = `(${linF(1, c).tex})(${linF(1, a).tex})`; factD = `(${linF(1, c).tex})(${linF(1, d).tex})`;
        excl = [fr(-c), fr(-d)];
        hints = ['Factor the numerator and the denominator completely. A rational expression can only be simplified by cancelling common factors, not common terms.',
          `Factor the denominator: it is $(${linF(1, c).tex})(${linF(1, d).tex})$. Now factor the numerator $${quadTex(1, a + c, a * c)}$ (find two numbers with product $${a * c}$ and sum $${a + c}$).`,
          'Cancel the factor that appears in both the numerator and the denominator.'];
      } else if (kind === 'rs2') {
        if (a === c || a + c === 0) again();
        N = pmul([c, 1], [a, 1]); Dn = [c, 1];
        ansNum = [a, 1]; ansDen = [1];
        ans = linF(1, a).calc;
        factN = `(${linF(1, c).tex})(${linF(1, a).tex})`; factD = linF(1, c).tex;
        excl = [fr(-c)];
        hints = ['Factor the numerator completely.',
          `Find two numbers with product $${a * c}$ and sum $${a + c}$ to factor $${quadTex(1, a + c, a * c)}$.`,
          `Cancel the factor $${linF(1, c).tex}$ that appears in both the numerator and the denominator.`];
      } else if (kind === 'rs3') {
        const k = r.int(2, 5);
        if (a === c || d === c || a === d || c + d === 0) again();
        N = pscale(pmul([c, 1], [a, 1]), k); Dn = pmul([c, 1], [d, 1]);
        ansNum = [k * a, k]; ansDen = [d, 1];
        ans = `${k}(${linF(1, a).calc})/(${linF(1, d).calc})`;
        factN = `${k}(${linF(1, c).tex})(${linF(1, a).tex})`; factD = `(${linF(1, c).tex})(${linF(1, d).tex})`;
        excl = [fr(-c), fr(-d)];
        hints = [`Look for a common factor in the numerator first: every term of $${poly(N).tex}$ is a multiple of $${k}$. Then factor both the numerator and the denominator completely.`,
          `Factor the denominator: it is $(${linF(1, c).tex})(${linF(1, d).tex})$. After pulling out $${k}$, factor the quadratic in the numerator.`,
          'Cancel the factor that appears in both the numerator and the denominator.'];
      } else {
        const m = r.int(2, 9);
        if (d === m || d === -m) again();
        N = [-m * m, 0, 1]; Dn = pmul([m, 1], [d, 1]);
        ansNum = [-m, 1]; ansDen = [d, 1];
        ans = `(${linF(1, -m).calc})/(${linF(1, d).calc})`;
        factN = `(${linF(1, -m).tex})(${linF(1, m).tex})`; factD = `(${linF(1, m).tex})(${linF(1, d).tex})`;
        excl = [fr(-m), fr(-d)];
        hints = [`The numerator $x^2 - ${m * m}$ is a difference of squares: $a^2 - b^2 = (a - b)(a + b)$.`,
          `So $x^2 - ${m * m} = (${linF(1, -m).tex})(${linF(1, m).tex})$. Factor the denominator too: $${poly(Dn).tex} = (${linF(1, m).tex})(${linF(1, d).tex})$.`,
          'Cancel the factor that appears in both the numerator and the denominator.'];
      }
      const exclSorted = sortedFr(excl);
      const lhsT = fracXT(poly(N).tex, poly(Dn).tex);
      const ansT = ansDen.length === 1 ? poly(ansNum).tex : fracXT(kind === 'rs3' ? `${ansNum[1]}(${linF(1, a).tex})` : poly(ansNum).tex, poly(ansDen).tex);
      const mid = fracXT(factN, factD);
      return {
        type: 'expr', vars: ['x'], domain: 'x: 10..14',
        prompt: `Simplify $${lhsT}$. Write the result as a single simplified expression.`,
        answer: ans, hints: hints,
        solution: `Factor the numerator and the denominator, then cancel the common factor.\n\n${disp([lhsT, mid, ansT])}\n\nThis is valid for all $x$ except the values that make the original denominator $0$, namely $${excludedNote(exclSorted)}$.`,
        $m: { kind: kind, ansNum: ansNum, ansDen: ansDen },
      };
    }
    // excluded values
    const v = r.int(0, 5);
    let den, roots, hints, sol, numr;
    numr = r.pick(['1', '5', 'x + 3', 'x - 2', '2x', 'x^2 + 1', '3x - 1']);
    if (v === 0 || v === 1) {                                           // quadratic with integer roots, shown expanded
      const p = r.nonzero(-8, 8), q = r.nonzero(-8, 8);
      if (v === 0 && (p === q || p + q === 0)) again();
      if (v === 1) { den = `(${linF(1, p).tex})(${linF(1, q).tex})`; } else den = quadTex(1, p + q, p * q);
      roots = sortedFr([fr(-p), fr(-q)]);
      hints = ['A fraction is not defined when its denominator is $0$. Set the denominator equal to $0$.', v === 1 ? 'The denominator is already factored, so set each factor equal to $0$.' : `Factor $${den}$: find two numbers with product $${p * q}$ and sum $${p + q}$.`, 'Solve each factor equal to zero. The numerator does not matter.'];
      sol = `The expression is not defined when the denominator is $0$.\n\n$$${v === 1 ? den : `${den} = (${linF(1, p).tex})(${linF(1, q).tex})`} = 0$$\n\n${orWord(roots.map(ftex))}.`;
    } else if (v === 2) {                                                // linear denominator
      const a = r.int(1, 5), b = r.nonzero(-9, 9);
      if (a === 1 && r.rand() < 0.5) again();
      den = linF(a, b).tex; roots = [fr(-b, a)];
      hints = ['A fraction is not defined when its denominator is $0$.', `Solve $${den} = 0$.`, 'The numerator does not matter.'];
      sol = `The expression is not defined when the denominator is $0$.\n\n${align([[den, '0'], [terms([[a, 'x']]).tex, -b, elimN(b, '')]].concat(a === 1 ? [] : [['x', ftex(fr(-b, a)), ['divide both sides by ', a]]]))}\n\n${a === 1 ? `So $x = ${-b}$.` : `So $x = ${ftex(roots[0])}$.`}`;
    } else if (v === 3) {                                                // x times something
      const q = r.nonzero(-8, 8);
      den = `x(${linF(1, q).tex})`; roots = sortedFr([fr(0), fr(-q)]);
      hints = ['A fraction is not defined when its denominator is $0$.', 'The denominator is a product, so it is $0$ when one of its factors is $0$.', 'Set each factor equal to $0$ and solve.'];
      sol = `The denominator is a product, so it is $0$ when one of its factors is $0$:\n\n$$x = 0 \\quad\\text{or}\\quad ${linF(1, q).tex} = 0$$\n\n${orWord(roots.map(ftex))}.`;
    } else if (v === 4) {                                                // difference of squares in the denominator
      const m = r.int(2, 9);
      den = `x^2 - ${m * m}`; roots = [fr(-m), fr(m)];
      hints = ['A fraction is not defined when its denominator is $0$. Set $x^2 - ' + m * m + ' = 0$.', 'Either factor as a difference of squares or isolate $x^2$.', 'Remember that $x^2 = N$ has two solutions, $\\pm\\sqrt{N}$.'];
      sol = `The denominator is $0$ when\n\n$$x^2 - ${m * m} = 0 \\;\\Longrightarrow\\; (x - ${m})(x + ${m}) = 0$$\n\n${orWord(roots.map(ftex))}.`;
    } else {                                                             // no real excluded values
      const k = r.int(1, 12);
      den = r.rand() < 0.5 ? `x^2 + ${k}` : `x^2 + ${2 * r.int(1, 3)}x + ${r.int(5, 12)}`;
      const mm = /x\^2 \+ (\d+)x \+ (\d+)/.exec(den);
      if (mm && Number(mm[1]) * Number(mm[1]) - 4 * Number(mm[2]) >= 0) again();
      roots = [];
      hints = ['A fraction is not defined when its denominator is $0$. Try to solve denominator $= 0$.', mm ? 'Check the discriminant $b^2 - 4ac$ of the denominator.' : 'Isolate $x^2$.', 'Can a square of a real number equal a negative number?'];
      sol = `The expression is not defined only when the denominator is $0$.\n\n` + (mm ? `The denominator $${den}$ has discriminant $${mm[1]}^2 - 4 \\cdot ${mm[2]} = ${Number(mm[1]) * Number(mm[1]) - 4 * Number(mm[2])}$, which is negative, so it is never $0$.` : `$${den} = 0$ would need $x^2 = -${k}$, which has no real solution.`) + '\n\nSo there are no excluded values.';
    }
    return {
      type: 'list',
      prompt: `For which real values of $x$ is $${fracXT(numr, den)}$ not defined? Enter all such values separated by commas, or \`none\`.`,
      answer: roots.length ? roots.map(fcalc).join(', ') : 'none',
      hints: hints,
      solution: sol,
      $m: { kind: kind },
    };
  };

  // F1-11 functions and inverses
  // substitute x0 into the polynomial with ascending coefficients c, keeping every product visible: 2 \cdot (-3)^2 - 5 \cdot (-3) + 1
  function subPoly(c, x0) {
    let out = '';
    for (let d = c.length - 1; d >= 0; d--) {
      if (c[d] === 0) continue;
      const neg = c[d] < 0, m = Math.abs(c[d]);
      const piece = d === 0 ? String(m) : (m === 1 ? '' : m + ' \\cdot ') + pn(x0) + (d > 1 ? '^' + sup(d) : '');
      out += out === '' ? (neg ? '-' : '') + piece : (neg ? ' - ' : ' + ') + piece;
    }
    return out;
  }
  // function families on integers; each gives tex, sub(x0), steps(x0) (every form from the substitution to the value), val(x0)
  function makeFn(r, kind) {
    let fn;
    if (kind === 'lin') {
      const a = r.nonzero(-5, 5), b = r.nonzero(-9, 9);
      if (Math.abs(a) < 2) again();
      fn = { tex: lin(a, b, 'x').tex, sub: function (x0) { return subPoly([b, a], x0); }, val: function (x0) { return a * x0 + b; },
        steps: function (x0) { return [subPoly([b, a], x0), terms([[a * x0, ''], [b, '']]).tex, a * x0 + b]; } };
    } else if (kind === 'quad') {
      const a = r.nonzero(-3, 3), b = r.int(-6, 6), c = r.nonzero(-9, 9);
      fn = { tex: poly([c, b, a]).tex, sub: function (x0) { return subPoly([c, b, a], x0); }, val: function (x0) { return a * x0 * x0 + b * x0 + c; },
        steps: function (x0) { return [subPoly([c, b, a], x0), terms([[a * x0 * x0, ''], [b * x0, ''], [c, '']]).tex, a * x0 * x0 + b * x0 + c]; } };
    } else {
      const a = r.nonzero(-4, 4), b = r.nonzero(-9, 9), c = r.int(-6, 6);          // absolute value family: |ax + b| + c
      const tail = c ? sgn(c) : '';
      fn = { tex: absTex(lin(a, b, 'x').tex) + tail, sub: function (x0) { return absTex(subPoly([b, a], x0)) + tail; }, val: function (x0) { return Math.abs(a * x0 + b) + c; },
        steps: function (x0) {
          const inner = a * x0 + b;
          return [absTex(subPoly([b, a], x0)) + tail, absTex(terms([[a * x0, ''], [b, '']]).tex) + tail, absTex(inner) + tail, Math.abs(inner) + tail, Math.abs(inner) + c];
        } };
    }
    return fn;
  }

  G['F1-11'] = function (r) {
    const kind = r.pick(['eval', 'eval', 'sqrt', 'rat', 'comp', 'comp', 'invlin', 'invlin', 'invrat', 'invval']);
    if (kind === 'eval') {
      const fam = r.pick(['lin', 'quad', 'quad', 'abs']), f = makeFn(r, fam), x0 = r.nonzero(-4, 4);
      const v = f.val(x0);
      return {
        type: 'num',
        prompt: `Let $f(x) = ${f.tex}$. Find $f(${x0})$.`,
        answer: String(v),
        hints: [`To find $f(${x0})$, replace every $x$ in the formula with $${x0}$.`, `Write $f(${x0}) = ${f.sub(x0)}$${x0 < 0 ? ', using brackets around the negative number' : ''}.`, 'Follow the order of operations: powers, then multiplication, then addition and subtraction.'],
        solution: `Replace $x$ with $${x0}$ and simplify.\n\n${disp([`f(${x0})`].concat(f.steps(x0)))}\n\nSo $f(${x0}) = ${v}$.`,
        $m: { kind: kind },
      };
    }
    if (kind === 'sqrt') {
      const a = r.int(1, 4), x0 = r.int(1, 6), s = r.int(2, 7), b = s * s - a * x0, k = r.int(1, 3);
      if (b === 0 || Math.abs(b) > 20) again();
      const inner = lin(a, b, 'x').tex, v = k * s;
      return {
        type: 'num',
        prompt: `Let $f(x) = ${k === 1 ? '' : k}\\sqrt{${inner}}$. Find $f(${x0})$.`,
        answer: String(v),
        hints: [`Replace $x$ with $${x0}$ inside the square root.`, `Compute $${a === 1 ? '' : a + ' \\cdot '}${x0}${sgn(b)}$ first, then take the square root.`, k === 1 ? 'The number under the root is a perfect square.' : `The number under the root is a perfect square. Finally multiply the root by $${k}$.`],
        solution: `Replace $x$ with $${x0}$ and simplify.\n\n${disp([`f(${x0})`, `${k === 1 ? '' : k}\\sqrt{${a === 1 ? '' : a + ' \\cdot '}${x0}${sgn(b)}}`, `${k === 1 ? '' : k}\\sqrt{${s * s}}`, k === 1 ? s : `${k} \\cdot ${s}`, v])}\n\nSo $f(${x0}) = ${v}$.`,
        $m: { kind: kind },
      };
    }
    if (kind === 'rat') {
      const a = r.nonzero(-4, 4), b = r.nonzero(-6, 6), c = r.nonzero(-3, 3), d = r.nonzero(-6, 6), x0 = r.int(-4, 4);
      const den = c * x0 + d, nm = a * x0 + b;
      if (den === 0 || nm === 0 || a * d === b * c) again();
      const res = fr(nm, den);
      if (res[1] > 12 || Math.abs(res[0]) > 40) again();
      const num2 = terms([[a, 'x'], [b, '']]).tex, den2 = terms([[c, 'x'], [d, '']]).tex;
      return {
        type: 'num',
        prompt: `Let $f(x) = \\frac{${num2}}{${den2}}$. Find $f(${x0})$. Give an exact value.`,
        answer: fcalc(res),
        hints: [`Replace every $x$ with $${x0}$, in the numerator and in the denominator.`, `Numerator: $${subPoly([b, a], x0)}$. Denominator: $${subPoly([d, c], x0)}$.`, 'Evaluate both, then write the fraction in lowest terms.'],
        solution: `Replace $x$ with $${x0}$ in both the numerator and the denominator.\n\n${disp([`f(${x0})`, `\\frac{${subPoly([b, a], x0)}}{${subPoly([d, c], x0)}}`,
          `\\frac{${terms([[a * x0, ''], [b, '']]).tex}}{${terms([[c * x0, ''], [d, '']]).tex}}`, den < 0 ? `\\frac{${-nm}}{${-den}}` : `\\frac{${nm}}{${den}}`, ftex(res)])}\n\nSo $f(${x0}) = ${ftex(res)}$.`,
        $m: { kind: kind },
      };
    }
    if (kind === 'comp') {
      const fa = r.pick(['lin', 'quad', 'abs']), ga = r.pick(['lin', 'quad', 'abs']);
      if (fa === 'quad' && ga === 'quad') again();
      const f = makeFn(r, fa), g = makeFn(r, ga), x0 = r.nonzero(-3, 3), fg = r.rand() < 0.6;
      const inner = fg ? g : f, outer = fg ? f : g, iN = fg ? 'g' : 'f', oN = fg ? 'f' : 'g';
      const m = inner.val(x0), out = outer.val(m);
      if (Math.abs(out) > 400 || m === 0) again();
      return {
        type: 'num',
        prompt: `Let $f(x) = ${f.tex}$ and $g(x) = ${g.tex}$. Find $${oN}(${iN}(${x0}))$.`,
        answer: String(out),
        hints: [`Work from the inside out: first find $${iN}(${x0})$.`, `$${iN}(${x0}) = ${inner.sub(x0)} = ${m}$.`, `Now substitute that result into $${oN}$: find $${oN}(${m})$.`],
        solution: `Work from the inside out.\n\nFirst, $${iN}(${x0})$:\n\n${disp([`${iN}(${x0})`].concat(inner.steps(x0)))}\n\nThen $${oN}(${iN}(${x0})) = ${oN}(${m})$:\n\n${disp([`${oN}(${m})`].concat(outer.steps(m)))}\n\nSo $${oN}(${iN}(${x0})) = ${out}$.`,
        $m: { kind: kind },
      };
    }
    if (kind === 'invval') {
      const a = r.nonzero(-5, 5), b = r.nonzero(-9, 9), y0 = r.nonzero(-6, 6), t = a * y0 + b;
      if (Math.abs(a) < 2 || t === 0) again();
      return {
        type: 'num',
        prompt: `Let $f(x) = ${lin(a, b, 'x').tex}$. Find $f^{-1}(${t})$.`,
        answer: String(y0),
        hints: [`$f^{-1}(${t})$ is the input $x$ for which $f(x) = ${t}$.`, `So solve the equation $${lin(a, b, 'x').tex} = ${t}$.`, `${cap(elim(b, ''))} on both sides, then divide by $${a}$.`],
        solution: `$f^{-1}(${t})$ is the number $x$ with $f(x) = ${t}$. Solve:\n\n${align([[lin(a, b, 'x').tex, t], [terms([[a, 'x']]).tex, t - b, elimN(b, '')], ['x', y0, ['divide both sides by ', a]]])}\n\nSo $f^{-1}(${t}) = ${y0}$.`,
        $m: { kind: kind },
      };
    }
    // symbolic inverses: expr with lead f^{-1}(x) =
    const LEAD = '$f^{-1}(x) =$';
    if (kind === 'invlin') {
      const frac = r.rand() < 0.3, b = r.nonzero(-9, 9);
      let a, ans, fx, swapped, solved;
      if (!frac) {
        a = r.nonzero(-6, 6); if (Math.abs(a) < 2) again();
        fx = lin(a, b, 'x').tex; ans = `(${linF(1, -b).calc})/${pn(a)}`;
        swapped = [['x', lin(a, b, 'y').tex], [terms([[a, 'y']]).tex, `${terms([[1, 'x'], [-b, '']]).tex}`, elimN(b, '')], ['y', `${a < 0 ? '-' : ''}\\frac{${terms([[1, 'x'], [-b, '']]).tex}}{${Math.abs(a)}}`, ['divide both sides by ', a]]];
      } else {
        const p = r.nonzero(-5, 5), q = r.int(2, 4);
        if (gcd(Math.abs(p), q) !== 1) again();
        a = fr(p, q); fx = terms([[a, 'x'], [b, '']]).tex;
        const sg = p < 0 ? -1 : 1;
        ans = `${sg * q === 1 ? '' : sg * q === -1 ? '-' : sg * q}(${linF(1, -b).calc})/${Math.abs(p)}`;
        swapped = [['x', terms([[a, 'y'], [b, '']]).tex], [terms([[a, 'y']]).tex, terms([[1, 'x'], [-b, '']]).tex, elimN(b, '')],
          ['y', `${sg < 0 ? '-' : ''}\\frac{${q}(${terms([[1, 'x'], [-b, '']]).tex})}{${Math.abs(p)}}`, ['multiply both sides by ', ftex(fr(q, p))]]];
      }
      void solved;
      return {
        type: 'expr', vars: ['x'], lead: LEAD,
        prompt: `Find the inverse function of $f(x) = ${fx}$.`,
        answer: ans,
        hints: ['To find an inverse: write $y = f(x)$, swap the roles of $x$ and $y$, then solve for $y$.', `After swapping you get $x = ${terms([[a, 'y'], [b, '']]).tex}$.`, `Solve this equation for $y$: ${elim(b, '')} on both sides, then undo the multiplication.`],
        solution: `Write $y = f(x)$, swap $x$ and $y$, and solve for $y$.\n\n${align([['y', fx]].concat(swapped))}\n\nSo $f^{-1}(x) = ${swapped[swapped.length - 1][1]}$.`,
        $m: { kind: kind },
      };
    }
    // invrat: f(x) = (ax + b) / (cx + d)
    const a = r.int(1, 4), b = r.nonzero(-6, 6), c = r.nonzero(-3, 3), d = r.nonzero(-6, 6);
    if (a * d === b * c || gcd(gcd(Math.abs(a), Math.abs(b)), gcd(Math.abs(c), Math.abs(d))) !== 1) again();
    const nmT = terms([[a, 'x'], [b, '']]).tex, dnT = terms([[c, 'x'], [d, '']]).tex;
    const nmY = terms([[a, 'y'], [b, '']]).tex, dnY = terms([[c, 'y'], [d, '']]).tex;
    const invN = terms([[d, 'x'], [-b, '']]), invD = terms([[-c, 'x'], [a, '']]);
    return {
      type: 'expr', vars: ['x'], lead: LEAD, domain: 'x: 10..14',
      prompt: `Find the inverse function of $f(x) = \\frac{${nmT}}{${dnT}}$.`,
      answer: `(${invN.calc})/(${invD.calc})`,
      hints: ['Write $y = f(x)$, swap $x$ and $y$, then solve for $y$.', `After swapping: $x = \\frac{${nmY}}{${dnY}}$. Multiply both sides by the denominator to clear the fraction.`, 'Expand, move every term containing $y$ to one side and everything else to the other side, factor out $y$, and divide.'],
      solution: `Write $y = f(x)$, swap $x$ and $y$, and solve for $y$.\n\n${align([['x', `\\frac{${nmY}}{${dnY}}`], [`x(${dnY})`, nmY, 'multiply both sides by the denominator'], [terms([[c, 'xy'], [d, 'x']]).tex, nmY, 'expand'],
        [terms([[d, 'x'], [-b, '']]).tex, terms([[a, 'y'], [-c, 'xy']]).tex, 'collect terms'], [invN.tex, `y(${invD.tex})`, ['factor out ', 'y']], ['y', `\\frac{${invN.tex}}{${invD.tex}}`, ['divide both sides by ', `(${invD.tex})`]]])}\n\nSo $f^{-1}(x) = \\frac{${invN.tex}}{${invD.tex}}$.`,
      $m: { kind: kind },
    };
  };

  // F1-12 exponentials and logarithms
  const ipow = function (b, e) { let o = 1; for (let i = 0; i < e; i++) o *= b; return o; };
  const isPowOf = function (n, b) { while (n > 1 && n % b === 0) n /= b; return n === 1; };
  const lg = function (b, arg) { return '\\log_{' + b + '} ' + arg; };                         // \log_{2} 32
  const dec = function (x) { return String(Math.round(x * 1e6) / 1e6); };                       // 0.05, 1.05
  const roundStr = function (v, dp) {                                                           // rounded answer text; rejects draws within 0.1 of a rounding boundary
    if (!isFinite(v)) again();
    const sc = Math.abs(v) * Math.pow(10, dp), f = sc - Math.floor(sc);
    if (Math.abs(f - 0.5) < 0.1) again();
    return v.toFixed(dp);
  };
  const halfUlp = function (dp) { return dp === 0 ? '0.5' : '0.' + '0'.repeat(dp) + '5'; };   // tolerance = half a unit in the last place
  const FRAC_ASK = ' Give your answer as a fraction.';

  // evaluating a logarithm: integer results, negative results, rational results and the natural / common logarithm
  function f112Log(r) {
    const kind = r.pick(['pos', 'pos', 'neg', 'frac', 'frac', 'nat']);
    if (kind === 'pos' || kind === 'neg') {
      const b = r.pick([2, 2, 3, 3, 4, 5, 6, 7, 10]);
      const k = r.int(2, b === 2 ? 7 : b === 3 ? 5 : b <= 5 ? 4 : 3), N = ipow(b, k), neg = kind === 'neg';
      const decimal = neg && b === 10 && r.rand() < 0.5;
      const argT = !neg ? String(N) : decimal ? dec(1 / N) : `\\frac{1}{${N}}`;
      const ans = neg ? -k : k, q = `$${lg(b, argT)}$`;
      const expand = `${b}^{${k}} = ${new Array(k).fill(b).join(' \\cdot ')} = ${N}`;
      const hints = neg ? [
        `${q} asks: "$${b}$ to what power equals ${decimal ? '$' + argT + '$' : '$\\frac{1}{' + N + '}$'}?"`,
        decimal ? `Write $${argT}$ as the fraction $\\frac{1}{${N}}$. A negative exponent means a reciprocal: $${b}^{-n} = \\frac{1}{${b}^{n}}$.` : `A negative exponent means a reciprocal: $${b}^{-n} = \\frac{1}{${b}^{n}}$.`,
        `Find the power of $${b}$ that equals the denominator $${N}$ (multiply $${b}$ by itself and count), then make that exponent negative.`,
      ] : [
        `${q} asks: "$${b}$ to what power equals $${N}$?"`,
        `In other words, find the exponent $x$ with $${b}^{x} = ${N}$.`,
        `Multiply $${b}$ by itself repeatedly ($${b}$, then $${b} \\cdot ${b} = ${b * b}$, and so on) until you reach $${N}$, and count how many $${b}$'s you used.`,
      ];
      const solution = neg
        ? `${q} is the exponent $x$ for which $${b}^{x} = ${argT}$.\n\nFirst, $${expand}$. A reciprocal is a negative power, so\n\n${disp([lg(b, argT)].concat(decimal ? [lg(b, `\\frac{1}{${N}}`)] : [], [lg(b, `${b}^{-${k}}`), ans]))}\n\nSo $${lg(b, argT)} = ${ans}$.`
        : `${q} is the exponent $x$ for which $${b}^{x} = ${N}$.\n\nMultiply $${b}$ by itself:\n\n$$${expand}$$\n\nSo $${b}^{${k}} = ${N}$, which means\n\n$$${lg(b, N)} = ${k}$$`;
      return { type: 'num', prompt: `Evaluate ${q}.`, answer: String(ans), hints: hints, solution: solution, $m: { kind: 'logval' } };
    }
    if (kind === 'frac') {
      const c = r.pick([2, 2, 3, 5]), p = r.pick(c === 2 ? [2, 3, 4, 5] : c === 3 ? [2, 3] : [2]), qq = r.int(1, 2 * p + 1);
      const b = ipow(c, p), N = ipow(c, qq);
      if (gcd(qq, p) !== 1 || N > 300 || N === b) again();
      const res = fr(qq, p), q = `$${lg(b, N)}$`;
      return {
        type: 'num',
        prompt: `Evaluate ${q}.` + FRAC_ASK,
        answer: fcalc(res),
        hints: [
          `Let $x = ${lg(b, N)}$. By the definition of a logarithm, $${b}^{x} = ${N}$.`,
          `Both $${b}$ and $${N}$ are powers of $${c}$: $${b} = ${c}^{${p}}$ and $${N} = ${c}^{${qq}}$.`,
          `Substitute to get $(${c}^{${p}})^{x} = ${c}^{${qq}}$. Simplify the left side with the power rule, then set the exponents equal.`,
        ],
        solution: `Let $x = ${lg(b, N)}$. By the definition of a logarithm, $${b}^{x} = ${N}$. Write both sides as powers of $${c}$ and compare the exponents.\n\n${align([[`(${c}^{${p}})^{x}`, `${c}^{${qq}}`, ['write ', String(b), ' and ', String(N), ' as powers of ', String(c)]],
          [`${c}^{${p}x}`, `${c}^{${qq}}`, 'power of a power: multiply the exponents'], [`${p}x`, qq, 'the bases are equal, so the exponents are equal'], ['x', ftex(res), ['divide both sides by ', p]]])}\n\nSo $${lg(b, N)} = ${ftex(res)}$.`,
        $m: { kind: 'logfrac' },
      };
    }
    // natural and common logarithms
    const v = r.pick(['lnpow', 'lnpow', 'logpow', 'lnroot', 'inv', 'inv']);
    if (v === 'lnpow') {
      const k = r.pick([-5, -4, -3, -2, 2, 3, 4, 5, 6, 7]), tex = `\\ln\\left(e^{${k}}\\right)`;
      return {
        type: 'num', prompt: `Evaluate $${tex}$.`, answer: String(k),
        hints: ['The natural logarithm is the logarithm with base $e$: $\\ln y = \\log_{e} y$ is the power you put on $e$ to get $y$.', `Here $y = e^{${k}}$, so ask: which power of $e$ gives $e^{${k}}$?`],
        solution: `The natural logarithm is $\\ln y = \\log_{e} y$, the exponent that $e$ must be raised to in order to get $y$. Since $\\ln$ and $e^{x}$ undo each other,\n\n$$${tex} = ${k}$$`,
        $m: { kind: 'logspec' },
      };
    }
    if (v === 'logpow') {
      const k = r.pick([-4, -3, -2, 2, 3, 4, 5, 6]), arg = k > 0 ? String(ipow(10, k)) : dec(Math.pow(10, k)), tex = `\\log\\left(${arg}\\right)`;
      const alt = k > 0 ? `10^{${k}}` : `\\frac{1}{${ipow(10, -k)}} = 10^{${k}}`;
      return {
        type: 'num', prompt: `Evaluate $${tex}$.`, answer: String(k),
        hints: ['When no base is written, $\\log$ means base $10$: $\\log y = \\log_{10} y$ is the power of $10$ that gives $y$.', `So you need $10^{x} = ${arg}$. Write $${arg}$ as a power of $10$.`],
        solution: `With no base written, $\\log$ means $\\log_{10}$. Write the number as a power of $10$:\n\n$$${arg} = ${alt}$$\n\nSo\n\n$$${tex} = \\log_{10} 10^{${k}} = ${k}$$`,
        $m: { kind: 'logspec' },
      };
    }
    if (v === 'lnroot') {
      const n = r.pick([2, 3, 4, 5]), tex = `\\ln\\left(${radical('e', n)}\\right)`, res = fr(1, n);
      return {
        type: 'num', prompt: `Evaluate $${tex}$.` + FRAC_ASK, answer: fcalc(res),
        hints: ['The natural logarithm $\\ln y$ is the power you put on $e$ to get $y$.', `Write the root as a power: $${radical('e', n)} = e^{1/${n}}$.`],
        solution: `A root is a fractional power, so $${radical('e', n)} = e^{1/${n}}$. Then\n\n$$${tex} = \\ln\\left(e^{1/${n}}\\right) = \\frac{1}{${n}}$$`,
        $m: { kind: 'logspec' },
      };
    }
    const bb = r.pick([2, 3, 5, 'e', 10]), N = r.int(2, 30);
    const tex = bb === 'e' ? `e^{\\ln ${N}}` : bb === 10 ? `10^{\\log ${N}}` : `${bb}^{\\log_{${bb}} ${N}}`;
    const lgT = bb === 'e' ? `\\ln ${N}` : bb === 10 ? `\\log ${N}` : lg(bb, N);
    return {
      type: 'num', prompt: `Evaluate $${tex}$.`, answer: String(N),
      hints: [`$${lgT}$ is the exponent you must put on $${bb}$ to get $${N}$.`, `The expression raises $${bb}$ to exactly that exponent. What do you get?`],
      solution: `The logarithm $${lgT}$ is, by definition, the exponent that $${bb}$ must be raised to in order to get $${N}$. So raising $${bb}$ to that power gives back $${N}$:\n\n$$${tex} = ${N}$$`,
      $m: { kind: 'logspec' },
    };
  }

  // logarithm laws: product, quotient and power rules combine to a single log of a power of the base
  let LAWS = null;
  function lawTable() {
    if (LAWS) return LAWS;
    LAWS = [];
    [2, 3, 5, 6, 10, 12, 15].forEach(function (b) {
      [1, 2, 3].forEach(function (c1) { [1, 2, 3].forEach(function (c2) {
        for (let m = 2; m <= 20; m++) for (let n = 2; n <= 20; n++) {
          if (m === n || isPowOf(m, b) || isPowOf(n, b)) continue;
          const A = ipow(m, c1), B = ipow(n, c2);
          [['+', A * B], ['-', A % B === 0 ? A / B : -1]].forEach(function (o) {
            if (o[1] < 2 || o[1] > 50000 || (c1 + c2 > 2 && (A > 400 || B > 400))) return;
            for (let k = 1; k <= 4; k++) if (ipow(b, k) === o[1]) LAWS.push({ b: b, op: o[0], c1: c1, m: m, c2: c2, n: n, k: k });
          });
        }
      }); });
    });
    return LAWS;
  }
  function f112Law(r) {
    const T = lawTable(), simple = r.rand() < 0.55;
    const pool = T.filter(function (e) { return (e.c1 === 1 && e.c2 === 1) === simple; });
    const e = r.pick(pool), b = e.b, plus = e.op === '+';
    const co = function (c) { return c === 1 ? '' : String(c); };
    const orig = `${co(e.c1)}${lg(b, e.m)} ${plus ? '+' : '-'} ${co(e.c2)}${lg(b, e.n)}`;
    const M1 = ipow(e.m, e.c1), M2 = ipow(e.n, e.c2), R = ipow(b, e.k);
    const withPow = `${lg(b, e.c1 > 1 ? `(${e.m}^{${e.c1}})` : e.m)} ${plus ? '+' : '-'} ${lg(b, e.c2 > 1 ? `(${e.n}^{${e.c2}})` : e.n)}`;
    const evald = `${lg(b, M1)} ${plus ? '+' : '-'} ${lg(b, M2)}`;
    const combined = plus ? lg(b, `(${M1} \\cdot ${M2})`) : lg(b, `\\left(\\frac{${M1}}{${M2}}\\right)`);
    const chain = [orig];
    if (!simple) chain.push(withPow, evald);
    chain.push(combined, lg(b, R), e.k);
    const rule = plus ? 'product rule $\\log_b M + \\log_b N = \\log_b (MN)$' : 'quotient rule $\\log_b M - \\log_b N = \\log_b \\frac{M}{N}$';
    const hints = simple ? [
      `Use the ${rule} to combine the two logarithms into one.`,
      `The combined logarithm is ${plus ? `$${lg(b, `(${e.m} \\cdot ${e.n})`)} = ${lg(b, R)}$` : `$${lg(b, `\\left(\\frac{${e.m}}{${e.n}}\\right)`)} = ${lg(b, R)}$`}.`,
      `Now ask: $${b}$ to what power equals $${R}$?`,
    ] : [
      'First use the power rule $c\\log_b M = \\log_b M^{c}$ to move each coefficient into the argument.',
      `That gives $${withPow}$, which is $${evald}$. Now use the ${rule}.`,
      `Combine into a single logarithm, $${combined}$, simplify the argument, and ask: $${b}$ to what power gives that number?`,
    ];
    return {
      type: 'num',
      prompt: `Evaluate $${orig}$.`,
      answer: String(e.k),
      hints: hints,
      solution: `${simple ? '' : 'Use the power rule to move the coefficients into the arguments, then '}${simple ? 'Use' : 'use'} the ${rule} to combine the logarithms.\n\n${disp(chain)}\n\nThe last step holds because $${b}^{${e.k}} = ${R}$.`,
      $m: { kind: 'loglaw' },
    };
  }

  // solving exponential and logarithmic equations, and evaluating a * b^x
  function f112Solve(r) {
    const kind = r.pick(['exp', 'exp', 'exp', 'expinv', 'log', 'log', 'evalexp', 'evalexp']);
    if (kind === 'exp' || kind === 'expinv') {
      const inv = kind === 'expinv', c0 = r.pick([2, 2, 3, 3, 5, 10]);
      const s = r.pick(c0 >= 5 ? [1, 1, 2] : [1, 1, 2, 3]), B = ipow(c0, s);
      const p = r.pick([1, 1, 2, 3]), q = r.pick([0, 0, -3, -2, -1, 1, 2, 3]);
      const t = r.pick([-4, -3, -2, -1, 1, 2, 3, 4, 5, 6]);
      if ((c0 === 10 && Math.abs(t) > 4) || (c0 === 5 && t > 3) || (c0 === 3 && t > 5)) again();
      if (s === 1 && p === 1 && q === 0 && !inv && r.rand() < 0.5) again();
      const mult = inv ? -s : s;                                                       // mult * (p x + q) = t
      const sol = fr(t - mult * q, mult * p);
      if (sol[0] === 0 || Math.abs(fval(sol)) > 12) again();
      const Ntex = t > 0 ? String(ipow(c0, t)) : c0 === 10 ? dec(Math.pow(10, t)) : `\\frac{1}{${ipow(c0, -t)}}`;
      const ex = terms([[p, 'x'], [q, '']]).tex, lhs = inv ? `\\left(\\frac{1}{${B}}\\right)^{${ex}}` : `${B}^{${ex}}`;
      const A = mult * p, C = mult * q;
      const mE = mult === 1 ? ex : q === 0 ? terms([[A, 'x']]).tex : (mult === -1 ? '-' : String(mult)) + '(' + ex + ')';
      const easy = !inv && s === 1;
      const rows = [[lhs, Ntex]];
      rows.push([inv ? `(${c0}^{-${s}})^{${ex}}` : s === 1 ? `${c0}^{${ex}}` : `(${c0}^{${s}})^{${ex}}`, `${c0}^{${t}}`,
        easy ? ['write the right side as a power of ', String(c0)] : ['write both sides as powers of ', String(c0)]]);
      if (mult !== 1) rows.push([`${c0}^{${mE}}`, `${c0}^{${t}}`, 'power of a power: multiply the exponents']);
      rows.push([mE, t, 'the bases are equal, so the exponents are equal']);
      if (mult !== 1 && q !== 0) rows.push([terms([[A, 'x'], [C, '']]).tex, t, 'distribute']);
      if (C !== 0) rows.push([terms([[A, 'x']]).tex, t - C, elimN(C, '')]);
      if (A !== 1) rows.push(['x', ftex(sol), ['divide both sides by ', A]]);
      const hints = easy ? [
        `Write the right side as a power of $${c0}$: $${Ntex} = ${c0}^{${t}}$.`,
        `Now both sides are powers of $${c0}$: $${c0}^{${ex}} = ${c0}^{${t}}$. When two powers with the same base are equal, their exponents are equal.`,
      ].concat(ex === 'x' ? [] : [`Set the exponents equal, $${ex} = ${t}$, and solve this equation for $x$.`]) : [
        `Write both sides as powers of $${c0}$: ${inv ? `$\\frac{1}{${B}} = ${c0}^{-${s}}$` : `$${B} = ${c0}^{${s}}$`} and $${Ntex} = ${c0}^{${t}}$.`,
        `Then $(${c0}^{${inv ? '-' : ''}${s}})^{${ex}} = ${c0}^{${t}}$. Use the power rule $(a^m)^n = a^{mn}$ to write the left side as a single power of $${c0}$.`,
        `Since the bases are equal, set the exponents equal: $${mE} = ${t}$. Solve this equation for $x$.`,
      ];
      return {
        type: 'num',
        prompt: `Solve for $x$: $${lhs} = ${Ntex}$.` + (sol[1] === 1 ? '' : ' Give the answer as a fraction.'),
        answer: fcalc(sol),
        hints: hints,
        solution: `Write both sides as powers of the same base, then set the exponents equal.\n\n${align(rows)}\n\nSo $x = ${ftex(sol)}$.`,
        $m: { kind: 'solveexp' },
      };
    }
    if (kind === 'log') {
      const b = r.pick([2, 3, 4, 5, 10]), k = r.int(2, b === 2 ? 6 : b === 3 ? 4 : 3), arg = ipow(b, k);
      const plain = r.rand() < 0.25;
      let p = 1, q = 0, x0 = arg;
      if (!plain) {
        p = r.pick([1, 2, 2, 3, 4, 5]); x0 = r.int(2, 14); q = arg - p * x0;
        if (Math.abs(q) > 25 || (p === 1 && q === 0)) again();
      }
      const ex = terms([[p, 'x'], [q, '']]).tex, argT = plain ? 'x' : `(${ex})`;
      const rows = [[lg(b, argT), k], [plain ? 'x' : ex, `${b}^{${k}}`, 'rewrite in exponential form'], [plain ? 'x' : ex, arg, ['evaluate ', `${b}^{${k}}`]]];
      if (q !== 0) rows.push([terms([[p, 'x']]).tex, arg - q, elimN(q, '')]);
      if (!plain && p !== 1) rows.push(['x', x0, ['divide both sides by ', p]]);
      if (!plain && p === 1) rows[rows.length - 1][0] = 'x';
      const check = plain ? `` : `\n\nCheck: for $x = ${x0}$ the argument is $${p === 1 ? '' : p + ' \\cdot '}${x0}${q ? sgn(q) : ''} = ${arg}$, which is positive, and $${lg(b, arg)} = ${k}$.`;
      return {
        type: 'num',
        prompt: `Solve for $x$: $${lg(b, argT)} = ${k}$.`,
        answer: String(x0),
        hints: plain ? [
          `A logarithmic equation can be rewritten in exponential form: $\\log_{b} A = k$ means $A = b^{k}$.`,
          `Here $b = ${b}$ and $k = ${k}$, so $x = ${b}^{${k}}$. Evaluate the power.`,
        ] : [
          'Rewrite the logarithmic equation in exponential form: $\\log_{b} A = k$ means $A = b^{k}$.',
          `Here $b = ${b}$, $A = ${ex}$ and $k = ${k}$, so $${ex} = ${b}^{${k}} = ${arg}$.`,
          `Solve the linear equation $${ex} = ${arg}$ for $x$.`,
        ],
        solution: `Rewrite in exponential form: $\\log_{b} A = k$ is equivalent to $A = b^{k}$.\n\n${align(rows)}${check}\n\nSo $x = ${x0}$.`,
        $m: { kind: 'solvelog' },
      };
    }
    // evaluate f(x) = a * b^x
    const bs = r.pick([[2, 1], [3, 1], [4, 1], [5, 1], [1, 2], [1, 3], [2, 3]]), a = r.pick([2, 3, 4, 5, 6, 8, 9, 12, 16, 18, 27, -2, -3, -4, -5, -8]);
    const x0 = r.pick([-3, -2, -1, 2, 3, 4]), nB = bs[0], dB = bs[1];
    const pw = x0 >= 0 ? [ipow(nB, x0), ipow(dB, x0)] : [ipow(dB, -x0), ipow(nB, -x0)];           // b^x0 as [n, d]
    const res = fmul([a, 1], pw);
    if (res[1] > 120 || Math.abs(res[0]) > 3000 || (res[1] === 1 && Math.abs(res[0]) > 800)) again();
    const bT = dB === 1 ? String(nB) : `\\left(\\frac{${nB}}{${dB}}\\right)`, aT = String(a);
    const steps = [`f(${x0})`, `${aT} \\cdot ${bT}^{${x0}}`];
    if (x0 < 0) steps.push(dB === 1 ? `${aT} \\cdot \\frac{1}{${nB}^{${-x0}}}` : `${aT} \\cdot \\left(\\frac{${dB}}{${nB}}\\right)^{${-x0}}`);
    steps.push(`${aT} \\cdot ${ftex(pw)}`, ftex(res));
    return {
      type: 'num',
      prompt: `Let $f(x) = ${aT} \\cdot ${bT}^{x}$. Find $f(${x0})$.` + (res[1] === 1 ? '' : ' Give the answer as a fraction.'),
      answer: fcalc(res),
      hints: [
        `Replace $x$ with $${x0}$: $f(${x0}) = ${aT} \\cdot ${bT}^{${x0}}$.`,
        x0 < 0 ? `A negative exponent means a reciprocal: $b^{-n} = \\left(\\frac{1}{b}\\right)^{n}$. Evaluate the power $${bT}^{${x0}}$ first.` : `Evaluate the power $${bT}^{${x0}}$ first, before multiplying by $${aT}$.`,
        `Then multiply the result by $${aT}$ and simplify.`,
      ],
      solution: `Replace $x$ with $${x0}$ and evaluate the power first, then multiply.\n\n${disp(steps)}\n\nSo $f(${x0}) = ${ftex(res)}$.`,
      $m: { kind: 'evalexp' },
    };
  }

  // applied exponential models with rounding
  function f112App(r) {
    const kind = r.pick(['grow', 'grow', 'decay', 'half', 'cont', 'cont']);
    if (kind === 'grow' || kind === 'decay') {
      const grow = kind === 'grow';
      const ctx = grow ? r.pick([
        { dp: 0, P: [200, 250, 400, 500, 800, 1200, 2000, 5000, 12000], rt: [2, 3, 4, 5, 6, 8, 10, 12], u: 'year', text: (P, rt, t) => `A town has ${P} residents, and its population grows by ${rt}% each year. How many residents will the town have after ${t} years? Round to the nearest whole number.` },
        { dp: 0, P: [100, 150, 300, 500, 1000, 3000], rt: [5, 8, 10, 12, 15, 20], u: 'hour', text: (P, rt, t) => `A bacteria culture starts with ${P} cells, and the number of cells grows by ${rt}% every hour. How many cells are there after ${t} hours? Round to the nearest whole number.` },
        { dp: 2, P: [500, 800, 1000, 1500, 2000, 5000], rt: [2, 3, 4, 5, 6, 8], u: 'year', text: (P, rt, t) => `You deposit ${P} dollars in an account that pays ${rt}% interest, compounded once per year. How many dollars are in the account after ${t} years? Round to the nearest cent.` },
      ]) : r.pick([
        { dp: 0, P: [12000, 15000, 18000, 20000, 24000, 30000], rt: [8, 10, 12, 15, 18, 20], u: 'year', text: (P, rt, t) => `A new car is worth ${P} dollars and loses ${rt}% of its value each year. What is it worth after ${t} years? Round to the nearest dollar.` },
        { dp: 2, P: [40, 50, 80, 100, 250], rt: [10, 15, 20, 25, 30], u: 'hour', text: (P, rt, t) => `The concentration of a medicine in the blood is ${P} mg/L and falls by ${rt}% every hour. What is the concentration after ${t} hours? Round to two decimal places.` },
        { dp: 0, P: [800, 1000, 2500, 5000, 10000], rt: [5, 8, 10, 12], u: 'year', text: (P, rt, t) => `The population of a fish species in a lake is ${P} and is declining by ${rt}% each year. How many fish remain after ${t} years? Round to the nearest whole number.` },
      ]);
      const P = r.pick(ctx.P), rt = r.pick(ctx.rt), t = r.int(3, 12), f = Math.round((1 + (grow ? 1 : -1) * rt / 100) * 1e6) / 1e6;
      const v = P * Math.pow(f, t);
      if (v < (ctx.dp ? 5 : 20) || v > 200000) again();
      const ans = roundStr(v, ctx.dp), per = ctx.u, fT = dec(f);
      return {
        type: 'num', tol: halfUlp(ctx.dp),
        prompt: ctx.text(P, rt, t),
        answer: ans,
        hints: [
          `Each ${per} the amount is multiplied by the ${grow ? 'growth' : 'decay'} factor $1 ${grow ? '+' : '-'} ${dec(rt / 100)} = ${fT}$.`,
          `After $${t}$ ${per}s the amount has been multiplied by $${fT}$ a total of $${t}$ times, so it is $${P} \\cdot (${fT})^{${t}}$.`,
          `Evaluate $(${fT})^{${t}}$ with a calculator, multiply by $${P}$, and round as the question asks.`,
        ],
        solution: `Each ${per} the amount is multiplied by the ${grow ? 'growth' : 'decay'} factor $1 ${grow ? '+' : '-'} ${dec(rt / 100)} = ${fT}$. After $${t}$ ${per}s it has been multiplied by this factor $${t}$ times:\n\n$$A = ${P} \\cdot (${fT})^{${t}} \\approx ${ans}$$\n\nRounded as requested, the answer is $${ans}$.`,
        $m: { kind: 'growth', form: kind, P: P, r: rt, t: t, dp: ctx.dp },
      };
    }
    if (kind === 'half') {
      const ctx = r.pick([
        { A0: [20, 40, 50, 80, 100, 120, 200, 400], h: [2, 4, 6, 8, 10, 12], u: 'days', text: (A0, h, t) => `A ${A0} mg sample of a radioactive isotope has a half-life of ${h} days. How many mg of the isotope remain after ${t} days? Round to two decimal places.` },
        { A0: [100, 150, 200, 250, 400, 500], h: [2, 4, 6, 8], u: 'hours', text: (A0, h, t) => `A patient takes a ${A0} mg dose of a drug whose half-life in the body is ${h} hours. How many mg of the drug remain after ${t} hours? Round to two decimal places.` },
      ]);
      const A0 = r.pick(ctx.A0), h = r.pick(ctx.h), q = r.pick([0.5, 1.5, 2.5, 3.5, 4.5]), t = h * q;
      const v = A0 * Math.pow(0.5, q);
      if (v < 1 || t < 2) again();
      const ans = roundStr(v, 2);
      return {
        type: 'num', tol: halfUlp(2), unit: 'mg',
        prompt: ctx.text(A0, h, t),
        answer: ans,
        hints: [
          `Every $${h}$ ${ctx.u} the amount is cut in half, which means it is multiplied by $\\frac{1}{2}$.`,
          `In $${t}$ ${ctx.u} there are $${t} \\div ${h} = ${q}$ half-lives.`,
          `So the amount left is $${A0}\\left(\\frac{1}{2}\\right)^{${q}}$. Evaluate it with a calculator and round to two decimal places.`,
        ],
        solution: `Every $${h}$ ${ctx.u} the amount is multiplied by $\\frac{1}{2}$. The time $${t}$ ${ctx.u} is $\\frac{${t}}{${h}} = ${q}$ half-lives, so\n\n$$A = ${A0}\\left(\\frac{1}{2}\\right)^{${t}/${h}} = ${A0}\\left(\\frac{1}{2}\\right)^{${q}} \\approx ${ans}$$\n\nRounded as requested, about $${ans}$ mg remain.`,
        $m: { kind: 'growth', form: 'half', P: A0, h: h, t: t, dp: 2 },
      };
    }
    // continuous growth
    const money = r.rand() < 0.5, P = r.pick(money ? [500, 1000, 1500, 2000, 5000, 8000] : [1000, 2000, 5000, 12000, 20000]);
    const rt = r.pick(money ? [2, 3, 4, 5, 6, 7, 8] : [1, 2, 3, 4, 5]), t = r.int(2, 12), rate = dec(rt / 100), ex = dec(rt * t / 100);
    const v = P * Math.exp(rt * t / 100), dp = money ? 2 : 0;
    if (v > 200000) again();
    const ans = roundStr(v, dp);
    return {
      type: 'num', tol: halfUlp(dp),
      prompt: money
        ? `An investment of ${P} dollars earns ${rt}% interest compounded continuously, so after $t$ years it is worth $A = Pe^{rt}$, where $P$ is the initial amount and $r$ is the annual rate written as a decimal. Find its value after ${t} years. Round to the nearest cent.`
        : `A population of ${P} animals grows according to $N(t) = ${P}e^{${rate}t}$, where $t$ is the time in years. How many animals are there after ${t} years? Round to the nearest whole number.`,
      answer: ans,
      hints: money ? [
        `Write the rate as a decimal: $r = ${rt}\\% = ${rate}$.`,
        `Substitute $P = ${P}$, $r = ${rate}$ and $t = ${t}$: $A = ${P}e^{${rate} \\cdot ${t}}$.`,
        `Compute the exponent $${rate} \\cdot ${t} = ${ex}$, evaluate $e^{${ex}}$ on a calculator, multiply by $${P}$, and round to the nearest cent.`,
      ] : [
        `Substitute $t = ${t}$ into the formula: $N(${t}) = ${P}e^{${rate} \\cdot ${t}}$.`,
        `Compute the exponent first: $${rate} \\cdot ${t} = ${ex}$.`,
        `Evaluate $e^{${ex}}$ on a calculator, multiply by $${P}$, and round to a whole number.`,
      ],
      solution: money
        ? `Write the rate as a decimal, $r = ${rt}\\% = ${rate}$, and substitute into $A = Pe^{rt}$:\n\n$$A = ${P}e^{${rate} \\cdot ${t}} = ${P}e^{${ex}} \\approx ${ans}$$\n\nRounded to the nearest cent, the value is $${ans}$ dollars.`
        : `Substitute $t = ${t}$ into the formula:\n\n$$N(${t}) = ${P}e^{${rate} \\cdot ${t}} = ${P}e^{${ex}} \\approx ${ans}$$\n\nRounded to a whole number, there are about $${ans}$ animals.`,
      $m: { kind: 'growth', form: 'cont', P: P, r: rt, t: t, dp: dp, money: money },
    };
  }

  G['F1-12'] = function (r) {
    const u = r.rand();
    return u < 0.25 ? f112Log(r) : u < 0.4 ? f112Law(r) : u < 0.7 ? f112Solve(r) : f112App(r);
  };

  // @@F1-GENERATORS-END

  // ===================================================================
  // F2  Trigonometry and vectors
  // ===================================================================

  // ---- shared helpers for F2 ----
  // multiples of pi:  f = [n, d] means (n/d) * pi
  const piT = function (f) {
    const n = f[0], d = f[1];
    if (n === 0) return '0';
    const s = n < 0 ? '-' : '', a = Math.abs(n);
    if (d === 1) return s + (a === 1 ? '' : a) + '\\pi';
    return s + '\\frac{' + (a === 1 ? '' : a) + '\\pi}{' + d + '}';
  };
  const piC = function (f) {
    const n = f[0], d = f[1];
    if (n === 0) return '0';
    const s = n < 0 ? '-' : '', a = Math.abs(n);
    return s + (a === 1 ? '' : a) + 'pi' + (d === 1 ? '' : '/' + d);
  };
  const degT = function (n) { return n + '^\\circ'; };
  const radOf = function (deg) { return fr(deg, 180); };                                      // degrees -> fraction of pi
  const nmod = function (a, m) { return ((a % m) + m) % m; };

  // exact numbers (n/d) sqrt(k)  ->  [n, d, k]
  const sx = function (n, d, k) {
    if (n === 0) return [0, 1, 1];
    const g = gcd(Math.abs(n), d);
    return [n / g, d / g, k];
  };
  const sxVal = function (e) { return e[0] / e[1] * Math.sqrt(e[2]); };
  const sxTex = function (e) {
    const n = e[0], d = e[1], k = e[2];
    if (n === 0) return '0';
    const s = n < 0 ? '-' : '', a = Math.abs(n);
    if (k === 1) return s + (d === 1 ? String(a) : '\\frac{' + a + '}{' + d + '}');
    const rad = '\\sqrt{' + k + '}';
    if (d === 1) return s + (a === 1 ? '' : a) + rad;
    return s + '\\frac{' + (a === 1 ? '' : a) + rad + '}{' + d + '}';
  };
  const sxCalc = function (e) {
    const n = e[0], d = e[1], k = e[2];
    if (n === 0) return '0';
    const s = n < 0 ? '-' : '', a = Math.abs(n);
    if (k === 1) return s + a + (d === 1 ? '' : '/' + d);
    return s + (a === 1 ? '' : a) + 'sqrt(' + k + ')' + (d === 1 ? '' : '/' + d);
  };
  const sxMul = function (e, c) { return sx(e[0] * c[0], e[1] * c[1], e[2]); };            // times a rational c = [n, d]
  const sxEq = function (a, b) { return a !== null && b !== null && a[0] === b[0] && a[1] === b[1] && (a[0] === 0 || a[2] === b[2]); };

  // exact sin / cos / tan at multiples of 30 and 45 degrees; null when undefined
  const TRIG_REF = {
    sin: { 0: [0, 1, 1], 30: [1, 2, 1], 45: [1, 2, 2], 60: [1, 2, 3], 90: [1, 1, 1] },
    cos: { 0: [1, 1, 1], 30: [1, 2, 3], 45: [1, 2, 2], 60: [1, 2, 1], 90: [0, 1, 1] },
    tan: { 0: [0, 1, 1], 30: [1, 3, 3], 45: [1, 1, 1], 60: [1, 1, 3], 90: null },
  };
  const TRIG_SIGN = { sin: [0, 1, 1, -1, -1], cos: [0, 1, -1, -1, 1], tan: [0, 1, -1, 1, -1] };       // by quadrant
  const quadOf = function (deg) { const t = nmod(deg, 360); return t <= 90 ? 1 : t <= 180 ? 2 : t <= 270 ? 3 : 4; };
  const refOf = function (deg) { const t = nmod(deg, 360), q = quadOf(t); return q === 1 ? t : q === 2 ? 180 - t : q === 3 ? t - 180 : 360 - t; };
  function exTrig(fn, deg) {
    const t = nmod(deg, 360), base = TRIG_REF[fn][refOf(t)];
    if (!base) return null;
    return sx(base[0] * TRIG_SIGN[fn][quadOf(t)], base[1], base[2]);
  }
  function exRecip(e) {                                              // 1 / ((n/d) sqrt k) = d sqrt(k) / (n k)
    if (e === null || e[0] === 0) return null;
    return sx(e[0] < 0 ? -e[1] : e[1], Math.abs(e[0]) * e[2], e[2]);
  }
  function exFn(fn, deg) {
    if (fn === 'sin' || fn === 'cos' || fn === 'tan') return exTrig(fn, deg);
    if (fn === 'sec') return exRecip(exTrig('cos', deg));
    if (fn === 'csc') return exRecip(exTrig('sin', deg));
    const t = exTrig('tan', deg);
    return t === null ? [0, 1, 1] : t[0] === 0 ? null : exRecip(t);
  }
  const exAns = function (e) { return e === null ? 'dne' : sxCalc(e); };
  const SPECIAL_DEGS = [0, 30, 45, 60, 90, 120, 135, 150, 180, 210, 225, 240, 270, 300, 315, 330];
  const QUAD_NAME = ['', 'I', 'II', 'III', 'IV'];
  const DNE_NOTE = ' If it is not defined, enter `dne`.';

  // F2-01 angles and radians
  G['F2-01'] = function (r) {
    const kind = r.pick(['d2r', 'd2r', 'r2d', 'r2d', 'arc', 'arc', 'arcr', 'sector', 'cotR', 'cotD']);
    if (kind === 'd2r') {
      const deg = 15 * r.nonzero(-24, 40), f = radOf(deg);
      return {
        type: 'num',
        prompt: `Convert $${degT(deg)}$ to radians. Give an exact answer in terms of $\\pi$.`,
        answer: piC(f),
        hints: [
          'A half-turn is $180^\\circ = \\pi$ radians, so to convert degrees to radians, multiply by $\\frac{\\pi}{180}$.',
          `Write $${deg} \\cdot \\frac{\\pi}{180} = \\frac{${deg}\\pi}{180}$.`,
          `Reduce the fraction by dividing the numerator and the denominator by $${gcd(Math.abs(deg), 180)}$.`,
        ],
        solution: `Since $180^\\circ = \\pi$ radians, multiply the angle by $\\frac{\\pi}{180}$ and reduce.\n\n${disp([degT(deg), `${deg} \\cdot \\frac{\\pi}{180}`, `\\frac{${deg}\\pi}{180}`, piT(f)])}\n\nSo $${degT(deg)} = ${piT(f)}$ radians.`,
        $m: { kind: kind },
      };
    }
    if (kind === 'r2d') {
      const deg = 15 * r.nonzero(-24, 40), f = radOf(deg), n = f[0], d = f[1];
      const num180 = Math.abs(n) === 1 ? '180^\\circ' : Math.abs(n) + ' \\cdot 180^\\circ';
      const mid = (n < 0 ? '-' : '') + (d === 1 ? num180 : `\\frac{${num180}}{${d}}`);
      return {
        type: 'num', unit: '°',
        prompt: `Convert $${piT(f)}$ radians to degrees.`,
        answer: String(deg),
        hints: ['A half-turn is $\\pi$ radians $= 180^\\circ$, so to convert radians to degrees, multiply by $\\frac{180^\\circ}{\\pi}$.', `The $\\pi$'s cancel: $${piT(f)} \\cdot \\frac{180^\\circ}{\\pi} = ${mid}$.`]
          .concat(d === 1 ? [] : [`Divide $180$ by $${d}$ first, then multiply by $${Math.abs(n)}$${n < 0 ? ' and keep the negative sign' : ''}.`]),
        solution: `Multiply the angle by $\\frac{180^\\circ}{\\pi}$; the $\\pi$'s cancel.\n\n${disp([piT(f), `${piT(f)} \\cdot \\frac{180^\\circ}{\\pi}`, mid, degT(deg)])}\n\nSo $${piT(f)}$ radians $= ${degT(deg)}$.`,
        $m: { kind: kind },
      };
    }
    if (kind === 'arc' || kind === 'arcr' || kind === 'sector') {
      const unit = r.pick(['cm', 'm', 'in', 'ft']), rad = r.int(2, 12);
      const deg = r.pick([30, 45, 60, 90, 120, 135, 150, 180, 210, 240, 270, 300, 315]), f = radOf(deg);
      const inDeg = kind === 'arc' && r.rand() < 0.4;
      const angTex = inDeg ? degT(deg) : piT(f);
      if (kind === 'sector') {
        const c = fr(rad * rad * f[0], 2 * f[1]);
        if (c[1] > 6) again();
        return {
          type: 'num',
          prompt: `A sector of a circle has radius ${rad} ${unit} and a central angle of $${piT(f)}$ radians. Find the area of the sector in square ${unit === 'cm' ? 'centimetres' : unit === 'm' ? 'metres' : unit === 'in' ? 'inches' : 'feet'}. Give an exact answer.`,
          answer: piC(c),
          hints: ['The area of a sector with central angle $\\theta$ in radians is $A = \\frac{1}{2}r^{2}\\theta$.', `Here $r = ${rad}$ and $\\theta = ${piT(f)}$, so $A = \\frac{1}{2} \\cdot ${rad}^{2} \\cdot ${piT(f)}$.`, `Square the radius, multiply by $${piT(f)}$, then take half.`],
          solution: `The area of a sector is $A = \\frac{1}{2}r^{2}\\theta$ when $\\theta$ is in radians.\n\n${disp(['A', `\\frac{1}{2} \\cdot ${rad}^{2} \\cdot ${piT(f)}`, `\\frac{1}{2} \\cdot ${rad * rad} \\cdot ${piT(f)}`, piT(c)])}\n\nThe area is $${piT(c)}$ square ${unit}.`,
          $m: { kind: kind },
        };
      }
      const s = fr(rad * f[0], f[1]);
      if (s[1] > 6) again();
      if (kind === 'arcr') {
        return {
          type: 'num', unit: unit,
          prompt: `An arc of length $${piT(s)}$ ${unit} is cut off by a central angle of $${piT(f)}$ radians. Find the radius of the circle.`,
          answer: String(rad),
          hints: ['The arc length is $s = r\\theta$ when $\\theta$ is in radians, so $r = \\frac{s}{\\theta}$.', `Here $s = ${piT(s)}$ and $\\theta = ${piT(f)}$.`, `Divide: $r = ${piT(s)} \\div ${piT(f)}$. The $\\pi$'s cancel.`],
          solution: `The arc length is $s = r\\theta$, so $r = \\frac{s}{\\theta}$.\n\n${disp(['r', '\\frac{s}{\\theta}', `${piT(s)} \\div ${piT(f)}`, rad])}\n\nThe radius is ${rad} ${unit}.`,
          $m: { kind: kind },
        };
      }
      return {
        type: 'num', unit: unit,
        prompt: `A circle has radius ${rad} ${unit}. Find the length of the arc cut off by a central angle of $${angTex}$${inDeg ? '' : ' radians'}. Give an exact answer.`,
        answer: piC(s),
        hints: ['The arc length is $s = r\\theta$ when the angle $\\theta$ is measured in radians.']
          .concat(inDeg ? [`Convert the angle to radians first: $${deg} \\cdot \\frac{\\pi}{180} = ${piT(f)}$.`] : [`Here $r = ${rad}$ and $\\theta = ${piT(f)}$.`], [`Multiply: $s = ${rad} \\cdot ${piT(f)}$, and simplify.`]),
        solution: `The arc length is $s = r\\theta$ when $\\theta$ is in radians.\n\n${inDeg ? `First convert the angle: $${deg}^\\circ = ${deg} \\cdot \\frac{\\pi}{180} = ${piT(f)}$ radians.\n\n` : ''}${disp(['s', 'r\\theta', `${rad} \\cdot ${piT(f)}`, piT(s)])}\n\nThe arc length is $${piT(s)}$ ${unit}.`,
        $m: { kind: kind },
      };
    }
    if (kind === 'cotR') {
      const base = 15 * r.int(1, 23), k = r.nonzero(-3, 3), f0 = radOf(base), d = f0[1];
      const ang = fr(base + 360 * k, 180), op = k > 0 ? '-' : '+', kk = Math.abs(k);
      return {
        type: 'num',
        prompt: `Find the angle in $[0, 2\\pi)$ that is coterminal with $${piT(ang)}$. Give an exact answer in radians.`,
        answer: piC(f0),
        hints: ['Coterminal angles differ by whole multiples of $2\\pi$.', `Here you need to ${k > 0 ? 'subtract' : 'add'} $2\\pi$ ${kk === 1 ? 'once' : kk + ' times'} to land in $[0, 2\\pi)$.`, `Write $2\\pi = \\frac{${2 * d}\\pi}{${d}}$ so that you can combine the fractions.`],
        solution: `Adding or subtracting $2\\pi$ does not change the direction of an angle. ${k > 0 ? 'Subtract' : 'Add'} $2\\pi$ ${kk === 1 ? 'once' : kk + ' times'} to bring the angle into $[0, 2\\pi)$.\n\n${disp([piT(ang), `${piT(ang)} ${op} ${kk === 1 ? '' : kk + ' \\cdot '}2\\pi`, piT(f0)])}`,
        $m: { kind: kind },
      };
    }
    // cotD
    const base = 5 * r.int(2, 70), k = r.nonzero(-4, 4), ang = base + 360 * k, op = k > 0 ? '-' : '+', kk = Math.abs(k);
    return {
      type: 'num', unit: '°',
      prompt: `Find the angle in $[0^\\circ, 360^\\circ)$ that is coterminal with $${degT(ang)}$.`,
      answer: String(base),
      hints: ['Angles that differ by a whole number of full turns ($360^\\circ$) are coterminal.', `Here you need to ${k > 0 ? 'subtract' : 'add'} $360^\\circ$ ${kk === 1 ? 'once' : kk + ' times'} to land in $[0^\\circ, 360^\\circ)$.`, `Compute $${ang} ${op} ${kk === 1 ? '' : kk + ' \\cdot '}360$.`],
      solution: `Adding or subtracting $360^\\circ$ does not change the direction of an angle. ${k > 0 ? 'Subtract' : 'Add'} $360^\\circ$ ${kk === 1 ? 'once' : kk + ' times'}.\n\n${disp([degT(ang), `${ang}^\\circ ${op} ${kk === 1 ? '' : kk + ' \\cdot '}360^\\circ`, degT(base)])}`,
      $m: { kind: kind },
    };
  };

  // F2-02 the unit circle
  const FN_TEX = { sin: '\\sin', cos: '\\cos', tan: '\\tan', sec: '\\sec', csc: '\\csc', cot: '\\cot' };
  const FN_BASE = { sin: 'sin', csc: 'sin', cos: 'cos', sec: 'cos', tan: 'tan', cot: 'tan' };
  const SIGN_WORD = function (fn, q) { return TRIG_SIGN[fn][q] > 0 ? 'positive' : 'negative'; };
  const angArg = function (deg, inDeg) {                              // the argument of a trig function, with brackets only when needed
    if (inDeg) return deg < 0 ? `\\left(${degT(deg)}\\right)` : ' ' + degT(deg);
    const f = radOf(deg);
    return f[1] > 1 || f[0] < 0 ? `\\left(${piT(f)}\\right)` : ' ' + piT(f);
  };
  const angTexOf = function (deg, inDeg) { return inDeg ? degT(deg) : piT(radOf(deg)); };
  const turnsWord = function (k, inDeg) { return (Math.abs(k) === 1 ? 'one full turn' : Math.abs(k) + ' full turns') + ` (a full turn is ${inDeg ? '$360^\\circ$' : '$2\\pi$'})`; };
  const COTERM = function (angTex, baseTex, k, inDeg) { return `The angle $${angTex}$ is coterminal with $${baseTex}$ because it differs from it by ${turnsWord(k, inDeg)}`; };
  const PYTH = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29], [9, 40, 41]];

  G['F2-02'] = function (r) {
    const kind = r.pick(['val', 'val', 'val', 'val', 'val', 'pt', 'ref', 'pyth', 'pyth']);
    if (kind === 'val' || kind === 'pt') {
      const fn = kind === 'pt' ? null : r.pick(['sin', 'cos', 'tan', 'sin', 'cos', 'tan', 'sec', 'csc', 'cot']);
      const base = r.pick(SPECIAL_DEGS), k = r.pick([0, 0, 0, 1, -1, 2, -2]), deg = base + 360 * k, inDeg = r.rand() < 0.35;
      if (base === 0 && k === 0) again();
      const axis = base % 90 === 0, q = quadOf(base), ref = refOf(base);
      const angTex = angTexOf(deg, inDeg), baseTex = angTexOf(base, inDeg), refTex = angTexOf(ref, inDeg);
      const cx = exTrig('cos', deg), sy = exTrig('sin', deg);
      const redS = k === 0 ? '' : `${COTERM(angTex, baseTex, k, inDeg)}, so it has the same trigonometric values.\n\n`;
      if (kind === 'pt') {
        const solRef = axis
          ? `The angle $${baseTex}$ lies along an axis, so the terminal side meets the unit circle at one of $(\\pm 1, 0)$ or $(0, \\pm 1)$. Here the point is $(x, y) = \\left(${sxTex(cx)}, ${sxTex(sy)}\\right)$.`
          : `The angle $${baseTex}$ lies in quadrant ${QUAD_NAME[q]} with reference angle $${refTex}$. At the reference angle, $\\cos ${refTex} = ${sxTex(exTrig('cos', ref))}$ and $\\sin ${refTex} = ${sxTex(exTrig('sin', ref))}$. In quadrant ${QUAD_NAME[q]}, $x = \\cos\\theta$ is ${SIGN_WORD('cos', q)} and $y = \\sin\\theta$ is ${SIGN_WORD('sin', q)}, so $(x, y) = \\left(${sxTex(cx)}, ${sxTex(sy)}\\right)$.`;
        return {
          type: 'tuple',
          prompt: `The terminal side of the angle $\\theta = ${angTex}$ meets the unit circle at the point $(x, y)$. Find $(x, y)$.`,
          answer: `(${sxCalc(cx)}, ${sxCalc(sy)})`,
          hints: [
            'On the unit circle, the point at angle $\\theta$ is $(x, y) = (\\cos\\theta, \\sin\\theta)$.',
            axis ? `${k === 0 ? '' : `Reduce the angle first: it is coterminal with $${baseTex}$. `}The angle $${baseTex}$ points along an axis. Which of $(1, 0)$, $(0, 1)$, $(-1, 0)$, $(0, -1)$ is it?`
              : `${k === 0 ? '' : `Reduce the angle first: it is coterminal with $${baseTex}$. `}This lies in quadrant ${QUAD_NAME[q]} with reference angle $${refTex}$. Find $\\cos ${refTex}$ and $\\sin ${refTex}$.`,
            axis ? 'Read off the coordinates of that point.' : `In quadrant ${QUAD_NAME[q]}, $x$ is ${SIGN_WORD('cos', q)} and $y$ is ${SIGN_WORD('sin', q)}. Attach those signs to the reference-angle values.`,
          ],
          solution: `The point on the unit circle at angle $\\theta$ is $(\\cos\\theta, \\sin\\theta)$.\n\n${redS}${solRef}`,
          $m: { kind: 'pt' },
        };
      }
      const e = exFn(fn, deg), ans = exAns(e), arg = angArg(deg, inDeg), bf = FN_BASE[fn];
      const recip = fn === 'sec' || fn === 'csc' || fn === 'cot' ? true : false;
      const q1 = `${FN_TEX[fn]}${arg}`;
      const rule = { tan: '\\tan\\theta = \\frac{\\sin\\theta}{\\cos\\theta}', sec: '\\sec\\theta = \\frac{1}{\\cos\\theta}', csc: '\\csc\\theta = \\frac{1}{\\sin\\theta}', cot: '\\cot\\theta = \\frac{\\cos\\theta}{\\sin\\theta}' }[fn];
      const prompt = `Find the exact value of $${q1}$.` + (fn === 'sin' || fn === 'cos' ? '' : DNE_NOTE);
      let solBody, hints;
      if (axis) {
        const px = sxTex(cx), py = sxTex(sy);
        const xs = cx[0] < 0 ? `(${px})` : px, ys = sy[0] < 0 ? `(${py})` : py;
        const calcLine = { sin: `\\sin\\theta = y = ${py}`, cos: `\\cos\\theta = x = ${px}`,
          tan: `\\tan\\theta = y \\div x = ${ys} \\div ${xs}`, sec: `\\sec\\theta = 1 \\div x = 1 \\div ${xs}`, csc: `\\csc\\theta = 1 \\div y = 1 \\div ${ys}`, cot: `\\cot\\theta = x \\div y = ${xs} \\div ${ys}` }[fn];
        solBody = `${redS}The angle $${baseTex}$ lies along an axis, so the point on the unit circle is $(x, y) = (\\cos\\theta, \\sin\\theta) = \\left(${px}, ${py}\\right)$.\n\n` +
          (fn === 'sin' || fn === 'cos' ? `So $${q1} = ${sxTex(e)}$.` : `Using $${rule}$:\n\n$$${calcLine}${e === null ? '' : ' = ' + sxTex(e)}$$\n\n` + (e === null ? `Division by $0$ is not defined, so the value does not exist: enter \`dne\`.` : `So $${q1} = ${sxTex(e)}$.`));
        hints = [
          `${k === 0 ? '' : `Reduce the angle first: it is coterminal with $${baseTex}$. `}The angle $${baseTex}$ points along an axis. Which of $(1, 0)$, $(0, 1)$, $(-1, 0)$, $(0, -1)$ is it?`,
          'On the unit circle, $\\cos\\theta$ is the $x$-coordinate and $\\sin\\theta$ is the $y$-coordinate.',
          fn === 'sin' || fn === 'cos' ? 'Read the requested coordinate from that point.' : `Use $${rule}$ with those coordinates. If that means dividing by $0$, the value does not exist.`,
        ];
      } else {
        const refV = exTrig(bf, ref), sgnV = exTrig(bf, deg);
        const baseLine = `${FN_TEX[bf]}${angArg(ref, inDeg)} = ${sxTex(refV)}`;
        solBody = `${redS}The angle $${baseTex}$ lies in quadrant ${QUAD_NAME[q]}, and its reference angle is $${refTex}$.\n\n` +
          `At the reference angle, $${baseLine}$. In quadrant ${QUAD_NAME[q]}, ${bf === 'sin' ? 'sine' : bf === 'cos' ? 'cosine' : 'tangent'} is ${SIGN_WORD(bf, q)}, so $${FN_TEX[bf]}\\theta = ${sxTex(sgnV)}$.\n\n` +
          (recip ? `Then $${rule}$ gives\n\n$$${FN_TEX[fn]}\\theta = ${fn === 'cot' ? `\\frac{1}{\\tan\\theta}` : `\\frac{1}{${FN_TEX[bf]}\\theta}`} = ${sgnV[0] < 0 && sgnV[1] === 1 && sgnV[2] === 1 ? `1 \\div (${sxTex(sgnV)})` : `\\frac{1}{${sxTex(sgnV)}}`} = ${sxTex(e)}$$\n\n` : '') +
          `So $${q1} = ${sxTex(e)}$.`;
        hints = [
          `${k === 0 ? '' : `Reduce the angle first: it is coterminal with $${baseTex}$. `}The angle $${baseTex}$ lies in quadrant ${QUAD_NAME[q]}, and its reference angle is $${refTex}$.`,
          `Find ${bf === 'sin' ? 'sine' : bf === 'cos' ? 'cosine' : 'tangent'} of the reference angle: $${FN_TEX[bf]}${angArg(ref, inDeg)}$ (use the special triangles).`,
          `In quadrant ${QUAD_NAME[q]}, ${bf === 'sin' ? 'sine' : bf === 'cos' ? 'cosine' : 'tangent'} is ${SIGN_WORD(bf, q)}.` + (recip ? ` Then use $${rule}$.` : ''),
        ];
      }
      return { type: 'num', prompt: prompt, answer: ans, hints: hints, solution: solBody, $m: { kind: 'val', fn: fn } };
    }
    if (kind === 'ref') {
      const base = r.pick([105, 120, 135, 150, 165, 195, 210, 225, 240, 255, 285, 300, 315, 330, 345]);
      const k = r.pick([0, 0, 1, -1, 2]), deg = base + 360 * k, inDeg = r.rand() < 0.4, q = quadOf(base), ref = refOf(base);
      const angTex = angTexOf(deg, inDeg), baseTex = angTexOf(base, inDeg), refTex = angTexOf(ref, inDeg);
      const full = inDeg ? '180^\\circ' : '\\pi', whole = inDeg ? '360^\\circ' : '2\\pi';
      const formula = q === 2 ? `${full} - \\theta` : q === 3 ? `\\theta - ${full}` : `${whole} - \\theta`;
      const filled = q === 2 ? `${full} - ${baseTex}` : q === 3 ? `${baseTex} - ${full}` : `${whole} - ${baseTex}`;
      const redS = k === 0 ? '' : `${COTERM(angTex, baseTex, k, inDeg)}, and coterminal angles have the same reference angle.\n\n`;
      const item = {
        type: 'num',
        prompt: `Find the reference angle for $${angTex}$.` + (inDeg ? '' : ' Give an exact answer in radians.'),
        answer: inDeg ? String(ref) : piC(radOf(ref)),
        hints: [
          `The reference angle is the acute angle between the terminal side and the $x$-axis. ${k === 0 ? '' : 'First find the coterminal angle in the interval from 0 to a full turn. '}`.trim(),
          `${k === 0 ? `The angle $${baseTex}$` : `The coterminal angle is $${baseTex}$, which`} lies in quadrant ${QUAD_NAME[q]}.`,
          `In quadrant ${QUAD_NAME[q]}, the reference angle is $${formula}$. Substitute $\\theta = ${baseTex}$.`,
        ],
        solution: `${redS}The angle $${baseTex}$ lies in quadrant ${QUAD_NAME[q]}, where the reference angle is $${formula}$.\n\n${disp([filled, refTex])}`,
        $m: { kind: 'ref' },
      };
      if (inDeg) item.unit = '°';
      return item;
    }
    // pyth: find another trig ratio from one ratio and the quadrant
    const tri = r.pick(PYTH), swap = r.rand() < 0.5, ym = swap ? tri[1] : tri[0], xm = swap ? tri[0] : tri[1], hyp = tri[2];
    const q = r.int(1, 4), sy = q <= 2 ? 1 : -1, sxn = q === 1 || q === 4 ? 1 : -1;
    const val = { sin: fr(sy * ym, hyp), cos: fr(sxn * xm, hyp), tan: fr(sy * sxn * ym, xm) };
    const g = r.pick(['sin', 'cos', 'tan']), h = r.pick(['sin', 'cos', 'tan'].filter(function (x) { return x !== g; }));
    const givenTex = ftex(val[g]);
    const side = { sin: ['opposite', 'hypotenuse'], cos: ['adjacent', 'hypotenuse'], tan: ['opposite', 'adjacent'] };
    const sides = { opposite: ym, adjacent: xm, hypotenuse: hyp };
    const gs = side[g], ratioGiven = `\\frac{${sides[gs[0]]}}{${sides[gs[1]]}}`;
    const missing = ['opposite', 'adjacent', 'hypotenuse'].find(function (x) { return gs.indexOf(x) === -1; });
    const hs = side[h];
    const knownSq = missing === 'hypotenuse' ? `${sides[gs[0]]}^{2} + ${sides[gs[1]]}^{2}` : `${hyp}^{2} - ${sides[gs[0] === 'hypotenuse' ? gs[1] : gs[0]]}^{2}`;
    return {
      type: 'num',
      prompt: `Suppose $${FN_TEX[g]}\\theta = ${givenTex}$ and $\\theta$ is in quadrant ${QUAD_NAME[q]}. Find $${FN_TEX[h]}\\theta$ as a fraction.`,
      answer: fcalc(val[h]),
      hints: [
        `Sketch a right triangle for the reference angle. Since $${FN_TEX[g]}\\theta$ has size $${ftex(fr(Math.abs(val[g][0]), val[g][1]))}$ and ${g === 'sin' ? 'sine is opposite over hypotenuse' : g === 'cos' ? 'cosine is adjacent over hypotenuse' : 'tangent is opposite over adjacent'}, two sides are $${sides[gs[0]]}$ and $${sides[gs[1]]}$ (or multiples of them).`,
        `Find the third side with the Pythagorean theorem: the ${missing}${missing === 'hypotenuse' ? '' : ' side'} is $\\sqrt{${knownSq}} = ${sides[missing]}$.`,
        `Write $${FN_TEX[h]}\\theta$ as ${hs[0]} over ${hs[1]} (using $${sides[hs[0]]}$ and $${sides[hs[1]]}$), then choose the sign: in quadrant ${QUAD_NAME[q]}, $x$ is ${sxn > 0 ? 'positive' : 'negative'} and $y$ is ${sy > 0 ? 'positive' : 'negative'}.`,
      ],
      solution: `Draw a right triangle for the reference angle. Because $${FN_TEX[g]}\\theta = ${ftex(fr(Math.abs(val[g][0]), val[g][1]))}$ in size, take ${gs[0]} $= ${sides[gs[0]]}$ and ${gs[1]} $= ${sides[gs[1]]}$ (so the ratio is $${ratioGiven}$).\n\n` +
        `The ${missing}${missing === 'hypotenuse' ? '' : ' side'} is $\\sqrt{${knownSq}} = ${sides[missing]}$.\n\nThe sides are therefore opposite $= ${ym}$, adjacent $= ${xm}$, hypotenuse $= ${hyp}$. In quadrant ${QUAD_NAME[q]}, $x$ is ${sxn > 0 ? 'positive' : 'negative'} and $y$ is ${sy > 0 ? 'positive' : 'negative'}, so\n\n` +
        `$$\\sin\\theta = ${ftex(val.sin)}, \\quad \\cos\\theta = ${ftex(val.cos)}, \\quad \\tan\\theta = ${ftex(val.tan)}$$\n\nSo $${FN_TEX[h]}\\theta = ${ftex(val[h])}$.`,
      $m: { kind: 'pyth' },
    };
  };

  // F2-03 trigonometric graphs: y = A sin(Bx - C) + D
  const bTermTex = function (B) {                                   // B = [n, d]: the x term of the argument
    if (B[1] === 1) return B[0] === 1 ? 'x' : B[0] + 'x';
    return '\\frac{' + (B[0] === 1 ? '' : B[0]) + 'x}{' + B[1] + '}';
  };
  const bTex = function (B) { return B[1] === 1 ? String(B[0]) : '\\frac{' + B[0] + '}{' + B[1] + '}'; };
  const argTexOf = function (B, C) {                                // Bx - C with C a multiple of pi
    return bTermTex(B) + (C[0] < 0 ? ' + ' : ' - ') + piT([Math.abs(C[0]), C[1]]);
  };
  const waveTex = function (fn, A, B, C, D) {
    const aT = A === 1 ? '' : A === -1 ? '-' : String(A);
    return `y = ${aT}\\${fn}\\left(${argTexOf(B, C)}\\right)${D ? sgn(D) : ''}`;
  };

  G['F2-03'] = function (r) {
    const kind = r.pick(['amp', 'period', 'period', 'shift', 'shift', 'mid', 'max', 'min', 'findB', 'maxmin']);
    const fn = r.pick(['sin', 'cos']);
    if (kind === 'maxmin') {
      const a = r.int(1, 6), k = r.int(-4, 4);
      if (a + k === k - a) again();
      const hi = k + a, lo = k - a;
      return {
        type: 'tuple',
        prompt: `A sinusoidal function has a maximum value of ${hi} and a minimum value of ${lo}. Find its amplitude $a$ and the $y$-value $k$ of its midline. Give your answer as $(a, k)$.`,
        answer: `(${a}, ${k})`,
        hints: ['The amplitude is half the distance between the maximum and minimum: $a = \\frac{\\text{max} - \\text{min}}{2}$.', 'The midline lies exactly halfway between the maximum and the minimum: $k = \\frac{\\text{max} + \\text{min}}{2}$.', `Substitute max $= ${hi}$ and min $= ${lo}$ into both formulas.`],
        solution: `The midline is halfway between the extremes, and the amplitude is half the distance between them.\n\n${disp(['a', `\\frac{${hi} - ${pn(lo)}}{2}`, `\\frac{${hi - lo}}{2}`, a])}\n\n${disp(['k', `\\frac{${hi} + ${pn(lo)}}{2}`, `\\frac{${hi + lo}}{2}`, k])}\n\nSo the amplitude is $${a}$ and the midline is $y = ${k}$.`,
        $m: { kind: kind },
      };
    }
    const A = r.pick([-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]), D = r.pick([-4, -3, -2, -1, 0, 1, 2, 3, 4]);
    const B = r.pick([[2, 1], [3, 1], [4, 1], [1, 2], [2, 3], [3, 2], [1, 3]]), hv = r.pick([[1, 4], [1, 3], [1, 2], [1, 1], [2, 3], [3, 4], [1, 6], [3, 2], [5, 6]]);
    const sg = r.rand() < 0.5 ? -1 : 1, h = fr(sg * hv[0], hv[1]);
    const C = fr(B[0] * h[0], B[1] * h[1]);                           // C = B h  (multiple of pi)
    if (C[1] > 6 || Math.abs(C[0]) > 8) again();
    if (Math.abs(A) === 1 && r.rand() < 0.6) again();
    const eq = waveTex(fn, A, B, C, D), absA = Math.abs(A), argT = argTexOf(B, C);
    const per = fr(2 * B[1], B[0]);
    const base = `The function is $${eq}$.`;
    const form = `$y = A\\${fn}(Bx - C) + D$`;
    const comp = `Comparing with ${form}: $A = ${A}$, $B = ${bTex(B)}$, $C = ${piT(C)}$, $D = ${D}$.`;
    if (kind === 'amp') {
      return {
        type: 'num', prompt: `Find the amplitude of the function $${eq}$.`, answer: String(absA),
        hints: [`For ${form}, the amplitude is $|A|$.`, `Here $A = ${A}$.`, 'The amplitude is a distance, so it is never negative: take the absolute value of $A$.'],
        solution: `For ${form}, the amplitude is $|A|$.\n\n${comp}\n\nSo the amplitude is $|${A}| = ${absA}$.`,
        $m: { kind: kind },
      };
    }
    if (kind === 'period') {
      return {
        type: 'num', prompt: `Find the period of the function $${eq}$. Give an exact answer.`, answer: piC(per),
        hints: [`For ${form}, the period is $\\frac{2\\pi}{|B|}$.`, `Here $B = ${bTex(B)}$ (the number multiplying $x$ in the argument).`, `Compute $\\frac{2\\pi}{${bTex(B)}} = 2\\pi \\div ${B[1] === 1 ? B[0] : bTex(B)}$ and simplify.`],
        solution: `For ${form}, the period is $\\frac{2\\pi}{|B|}$.\n\n${comp}\n\n${disp(['\\text{period}', `\\frac{2\\pi}{${bTex(B)}}`, `2\\pi \\div ${B[1] === 1 ? B[0] : bTex(B)}`, piT(per)])}`,
        $m: { kind: kind },
      };
    }
    if (kind === 'shift') {
      return {
        type: 'num',
        prompt: `Find the phase shift of the function $${eq}$. Give an exact answer, positive for a shift to the right and negative for a shift to the left.`,
        answer: piC(h),
        hints: [`Write the argument as $B(x - h)$. The phase shift is $h = \\frac{C}{B}$ when the argument is written as $Bx - C$.`, `The argument is $${argT}$, so $B = ${bTex(B)}$ and $C = ${piT(C)}$.`, `Compute $\\frac{C}{B} = ${piT(C)} \\div ${B[1] === 1 ? B[0] : bTex(B)}$.`],
        solution: `Write the argument in the form $Bx - C$. The phase shift is $\\frac{C}{B}$: a positive value means the graph is shifted to the right.\n\n${comp}\n\n${disp(['\\text{phase shift}', '\\frac{C}{B}', `${piT(C)} \\div ${B[1] === 1 ? B[0] : bTex(B)}`, piT(h)])}\n\nThe graph is shifted ${h[0] > 0 ? 'right' : 'left'} by $${piT([Math.abs(h[0]), h[1]])}$.`,
        $m: { kind: kind },
      };
    }
    if (kind === 'mid') {
      if (D === 0) again();
      return {
        type: 'num', prompt: `The graph of $${eq}$ oscillates about a horizontal midline $y = k$. Find $k$.`, answer: String(D),
        hints: [`The vertical shift moves the whole wave up or down, so the midline is $y = D$ in ${form}.`, 'Look at the constant that is added or subtracted after the trigonometric function.'],
        solution: `In ${form}, the wave oscillates about the horizontal line $y = D$.\n\n${comp}\n\nSo the midline is $y = ${D}$, and $k = ${D}$.`,
        $m: { kind: kind },
      };
    }
    if (kind === 'max' || kind === 'min') {
      const mx = kind === 'max', val = D + (mx ? absA : -absA);
      return {
        type: 'num', prompt: `Find the ${mx ? 'maximum' : 'minimum'} value of the function $${eq}$.`, answer: String(val),
        hints: [`For ${form}, the ${mx ? 'maximum' : 'minimum'} value is $D ${mx ? '+' : '-'} |A|$.`, `Here $|A| = ${absA}$ and $D = ${D}$.`, `Compute $${D} ${mx ? '+' : '-'} ${absA}$.`],
        solution: `The wave goes $|A|$ above and below its midline $y = D$, so the ${mx ? 'maximum' : 'minimum'} is $D ${mx ? '+' : '-'} |A|$.\n\n${comp}\n\n${disp([`D ${mx ? '+' : '-'} |A|`, `${D} ${mx ? '+' : '-'} ${absA}`, val])}`,
        $m: { kind: kind },
      };
    }
    // findB: the period is given
    const Bq = r.pick([[2, 1], [3, 1], [4, 1], [5, 1], [1, 2], [2, 3], [3, 2], [1, 4], [3, 4]]);
    const P = fr(2 * Bq[1], Bq[0]), a2 = r.pick([2, 3, 4, 5]), fn2 = r.pick(['sin', 'cos']);
    return {
      type: 'num',
      prompt: `The function $y = ${a2}\\${fn2}(Bx)$, with $B > 0$, has period $${piT(P)}$. Find $B$.` + (Bq[1] === 1 ? '' : ' Give the answer as a fraction.'),
      answer: fcalc(Bq),
      hints: ['The period of $y = A\\' + fn2 + '(Bx)$ is $\\frac{2\\pi}{B}$.', `So $\\frac{2\\pi}{B} = ${piT(P)}$.`, 'Solve this equation for $B$: multiply both sides by $B$, then divide by the period.'],
      solution: `The period of $y = A\\${fn2}(Bx)$ is $\\frac{2\\pi}{B}$. Set it equal to the given period and solve for $B$.\n\n${align([['\\frac{2\\pi}{B}', piT(P)], ['2\\pi', `B \\cdot ${piT(P)}`, ['multiply both sides by ', 'B']], ['B', `2\\pi \\div ${piT(P)}`, 'divide both sides by the period'], ['B', ftex(Bq)]])}`,
      $m: { kind: kind },
    };
  };

  // F2-04 inverse trigonometric functions
  const INV_DEGS = { arcsin: [-90, -60, -45, -30, 0, 30, 45, 60, 90], arccos: [0, 30, 45, 60, 90, 120, 135, 150, 180], arctan: [-60, -45, -30, 0, 30, 45, 60] };
  const INV_FN = { arcsin: 'sin', arccos: 'cos', arctan: 'tan' };
  const INV_TEX = { arcsin: ['\\arcsin', '\\sin^{-1}'], arccos: ['\\arccos', '\\cos^{-1}'], arctan: ['\\arctan', '\\tan^{-1}'] };
  const RANGE_TEX = { arcsin: '\\left[-\\frac{\\pi}{2}, \\frac{\\pi}{2}\\right]', arccos: '[0, \\pi]', arctan: '\\left(-\\frac{\\pi}{2}, \\frac{\\pi}{2}\\right)' };
  const RANGE_NAME = { arcsin: 'sine', arccos: 'cosine', arctan: 'tangent' };
  const invArg = function (e) {                                       // argument of an inverse trig function; brackets for negatives and bare radicals
    const t = sxTex(e);
    return e[0] < 0 || (e[1] === 1 && e[2] > 1) ? `\\left(${t}\\right)` : ' ' + t;
  };

  G['F2-04'] = function (r) {
    const kind = r.pick(['val', 'val', 'val', 'val', 'comp', 'comp', 'undo', 'undo']);
    if (kind === 'val') {
      const fn = r.pick(['arcsin', 'arccos', 'arctan']), deg = r.pick(INV_DEGS[fn]), ft = INV_FN[fn];
      if (deg === 0 && r.rand() < 0.7) again();
      const v = exTrig(ft, deg), name = INV_TEX[fn][r.rand() < 0.25 ? 1 : 0];
      const refDeg = fn === 'arccos' ? (deg <= 90 ? deg : 180 - deg) : Math.abs(deg), refTex = piT(radOf(refDeg)), absV = exTrig(ft, refDeg);
      const ang = piT(radOf(deg));
      const need = `We need the angle $\\theta$ in $${RANGE_TEX[fn]}$ with $\\${ft}\\theta = ${sxTex(v)}$.`;
      let how;
      if (fn === 'arccos' && deg > 90 && deg < 180) how = `The cosine is negative, so the angle is in quadrant II. The reference angle satisfies $\\cos ${refTex} = ${sxTex(absV)}$, so $\\theta = \\pi - ${refTex} = ${ang}$.`;
      else if (fn === 'arccos') how = `On the unit circle, the angle in $[0, \\pi]$ with cosine $${sxTex(v)}$ is $\\theta = ${ang}$.`;
      else if (deg === 0) how = `Since $\\${ft} 0 = 0$, the angle is $\\theta = 0$.`;
      else if (Math.abs(deg) === 90) how = `On the unit circle, sine is $${deg > 0 ? '1' : '-1'}$ at $\\theta = ${ang}$.`;
      else if (deg > 0) how = `The special-triangle value $\\${ft} ${refTex} = ${sxTex(absV)}$ gives $\\theta = ${ang}$.`;
      else how = `The special-triangle value $\\${ft} ${refTex} = ${sxTex(absV)}$, and ${ft === 'sin' ? 'sine' : 'tangent'} is an odd function ($\\${ft}(-x) = -\\${ft} x$), so $\\theta = -${refTex}$.`;
      return {
        type: 'num',
        prompt: `Find the exact value of $${name}${invArg(v)}$. Give your answer in radians.`,
        answer: piC(radOf(deg)),
        hints: [
          `$${INV_TEX[fn][0]} x$ (also written $${INV_TEX[fn][1]} x$) is the angle in $${RANGE_TEX[fn]}$ whose ${RANGE_NAME[fn]} is $x$.`,
          fn === 'arccos' && deg > 90 && deg < 180 ? `First find the reference angle: which acute angle has cosine $${sxTex(absV)}$?` : deg === 0 || Math.abs(deg) === 90 || (fn === 'arccos' && (deg === 180)) ? `Think of the unit circle: which angle in $${RANGE_TEX[fn]}$ has ${RANGE_NAME[fn]} equal to $${sxTex(v)}$?` : `First find the acute angle whose ${RANGE_NAME[fn]} is $${sxTex(absV)}$ (use the special triangles).`,
          fn === 'arccos' ? (deg > 90 && deg < 180 ? 'The cosine is negative, so the angle in $[0, \\pi]$ must be in quadrant II: subtract the reference angle from $\\pi$.' : deg === 180 ? 'Which point of the unit circle has $x$-coordinate $-1$?' : deg === 90 ? 'Which point of the unit circle has $x$-coordinate $0$ and $y \\ge 0$?' : 'The cosine is positive, so the answer is an acute angle in $[0, \\frac{\\pi}{2}]$.') : (deg < 0 ? `The input is negative and ${RANGE_NAME[fn]} is odd, so the answer is the negative of the acute angle.` : `The input is ${deg === 0 ? 'zero' : 'positive'}, so the answer lies in $[0, \\frac{\\pi}{2}]$.`),
        ],
        solution: `${need}\n\n${how}\n\nSo $${name}${invArg(v)} = ${ang}$.`.replace('= 0$.', '= 0$.'),
        $m: { kind: 'val' },
      };
    }
    if (kind === 'comp') {
      const tri = r.pick(PYTH), swap = r.rand() < 0.5, pl = swap ? tri[1] : tri[0], ql = swap ? tri[0] : tri[1], c = tri[2];
      const g = r.pick(['arcsin', 'arccos', 'arctan']), s = r.rand() < 0.5 ? -1 : 1;
      const outer = r.pick(g === 'arcsin' ? ['cos', 'tan'] : g === 'arccos' ? ['sin', 'tan'] : ['sin', 'cos']);
      let v, opp, adj, sinV, cosV, tanV;
      if (g === 'arcsin') { v = fr(s * pl, c); opp = pl; adj = ql; sinV = v; cosV = fr(ql, c); tanV = fr(s * pl, ql); }
      else if (g === 'arccos') { v = fr(s * pl, c); adj = pl; opp = ql; cosV = v; sinV = fr(ql, c); tanV = fr(s * ql, pl); }
      else { v = fr(s * pl, ql); opp = pl; adj = ql; tanV = v; cosV = fr(ql, c); sinV = fr(s * pl, c); }
      const res = { sin: sinV, cos: cosV, tan: tanV }[outer];
      const argT = v[0] < 0 ? `\\left(${ftex(v)}\\right)` : ftex(v);
      const expr = `\\${outer}\\left(${INV_TEX[g][0]}${v[0] < 0 ? argT : ' ' + argT}\\right)`;
      const posSide = g === 'arcsin' || g === 'arctan' ? 'cosine' : 'sine';
      const sameTrig = { sin: 'opposite over hypotenuse', cos: 'adjacent over hypotenuse', tan: 'opposite over adjacent' }[outer];
      return {
        type: 'num',
        prompt: `Find the exact value of $${expr}$ as a fraction.`,
        answer: fcalc(res),
        hints: [
          `Let $\\theta = ${INV_TEX[g][0]}${v[0] < 0 ? argT : ' ' + argT}$. Then $\\${INV_FN[g]}\\theta = ${ftex(v)}$, and $\\theta$ lies in $${RANGE_TEX[g]}$.`,
          `Draw a right triangle for the reference angle with ${g === 'arccos' ? `adjacent $${adj}$` : g === 'arcsin' ? `opposite $${opp}$` : `opposite $${opp}$ and adjacent $${adj}$`}${g === 'arctan' ? '' : ` and hypotenuse $${c}$`}. The missing side comes from the Pythagorean theorem; it is ${g === 'arcsin' ? `adjacent $\\sqrt{${c}^{2} - ${opp}^{2}} = ${adj}$` : g === 'arccos' ? `opposite $\\sqrt{${c}^{2} - ${adj}^{2}} = ${opp}$` : `the hypotenuse $\\sqrt{${opp}^{2} + ${adj}^{2}} = ${c}$`}.`,
          `Write $\\${outer}\\theta$ as ${sameTrig}, then fix the sign: for $\\theta$ in $${RANGE_TEX[g]}$ the ${posSide} is not negative${outer === 'tan' ? ', so the sign of the tangent comes from the sign of the other function' : ''}.`,
        ],
        solution: `Let $\\theta = ${INV_TEX[g][0]}${v[0] < 0 ? argT : ' ' + argT}$. Then $\\${INV_FN[g]}\\theta = ${ftex(v)}$ with $\\theta$ in $${RANGE_TEX[g]}$.\n\n` +
          `A reference right triangle has opposite $= ${opp}$, adjacent $= ${adj}$ and hypotenuse $= ${c}$ (the third side comes from the Pythagorean theorem). On $${RANGE_TEX[g]}$ the ${posSide} is not negative, and the signs of the other ratios follow from the sign of $${ftex(v)}$:\n\n` +
          `$$\\sin\\theta = ${ftex(sinV)}, \\quad \\cos\\theta = ${ftex(cosV)}, \\quad \\tan\\theta = ${ftex(tanV)}$$\n\nTherefore $${expr} = ${ftex(res)}$.`,
        $m: { kind: 'comp' },
      };
    }
    // undo: arcsin(sin t) etc. for angles outside the principal range, plus the domain trap
    const g = r.pick(['arcsin', 'arccos', 'arctan']), ft = INV_FN[g];
    if (r.rand() < 0.12 && g !== 'arctan') {
      const bad = r.pick([[2, 1], [3, 1], [3, 2], [5, 4], [5, 3], [-2, 1], [-3, 2], [-5, 3]]);
      const argT = bad[0] < 0 ? `\\left(${ftex(bad)}\\right)` : ftex(bad);
      return {
        type: 'num',
        prompt: `Evaluate $\\${ft}\\left(${INV_TEX[g][0]} ${argT}\\right)$.` + DNE_NOTE,
        answer: 'dne',
        hints: [`The inverse ${RANGE_NAME[g]} function is only defined for inputs between $-1$ and $1$.`, `Is $${ftex(bad)}$ between $-1$ and $1$?`],
        solution: `The function $${INV_TEX[g][0]} x$ is only defined for $-1 \\le x \\le 1$, because ${RANGE_NAME[g]} never takes values outside that interval. Since $${ftex(bad)}$ is outside $[-1, 1]$, $${INV_TEX[g][0]} ${argT}$ does not exist, and neither does the whole expression. Enter \`dne\`.`,
        $m: { kind: 'trap' },
      };
    }
    let deg;
    for (let tries = 0; tries < 50; tries++) {
      deg = r.pick(SPECIAL_DEGS.concat(SPECIAL_DEGS.map(function (d) { return d - 360; })));
      const out = g === 'arccos' ? (deg < 0 || deg > 180) : (deg < -90 || deg > 90);
      if (out && !(g === 'arctan' && Math.abs(deg) % 180 === 90)) break;
      deg = null;
    }
    if (deg === null) again();
    const w = exTrig(ft, deg);
    const principal = INV_DEGS[g].find(function (d) { return sxEq(exTrig(ft, d), w); });
    const ang = piT(radOf(deg)), res = piT(radOf(principal));
    const inner = `\\${ft}${angArg(deg, false)}`;
    return {
      type: 'num',
      prompt: `Find the exact value of $${INV_TEX[g][0]}\\left(${inner}\\right)$. Give your answer in radians.`,
      answer: piC(radOf(principal)),
      hints: [
        'Work from the inside out: evaluate the inner trigonometric function first.',
        `Find $${inner} = ${sxTex(w)}$ (reference angle and quadrant), so the expression is $${INV_TEX[g][0]}${invArg(w)}$.`,
        `Now find the angle in $${RANGE_TEX[g]}$ whose ${RANGE_NAME[g]} is $${sxTex(w)}$. Note that $${INV_TEX[g][0]}$ only returns angles from that interval.`,
      ],
      solution: `Work from the inside out. First, $${inner} = ${sxTex(w)}$.\n\nSo the expression equals $${INV_TEX[g][0]}${invArg(w)}$, which is the angle in $${RANGE_TEX[g]}$ whose ${RANGE_NAME[g]} is $${sxTex(w)}$. That angle is $${res}$.\n\nThe answer is not $${ang}$: $${INV_TEX[g][0]}$ only returns angles in $${RANGE_TEX[g]}$, and $${ang}$ lies outside that interval.`,
      $m: { kind: 'undo' },
    };
  };

  // F2-05 trigonometric identities: [expression, answer TeX, answer calculator syntax, idea, intermediate steps, domain]
  const PYTH_ID = 'Use the Pythagorean identity $\\sin^{2} x + \\cos^{2} x = 1$.';
  const TAN_ID = 'Use the identity $1 + \\tan^{2} x = \\sec^{2} x$.';
  const COT_ID = 'Use the identity $1 + \\cot^{2} x = \\csc^{2} x$.';
  const QUO_ID = 'Write every function in terms of sine and cosine: $\\tan x = \\frac{\\sin x}{\\cos x}$, $\\cot x = \\frac{\\cos x}{\\sin x}$, $\\sec x = \\frac{1}{\\cos x}$, $\\csc x = \\frac{1}{\\sin x}$.';
  const IDENTITIES = [
    ['1 - \\cos^{2} x', '\\sin^{2} x', 'sin(x)^2', PYTH_ID, []],
    ['1 - \\sin^{2} x', '\\cos^{2} x', 'cos(x)^2', PYTH_ID, []],
    ['\\sec^{2} x - 1', '\\tan^{2} x', 'tan(x)^2', TAN_ID, []],
    ['1 + \\tan^{2} x', '\\sec^{2} x', 'sec(x)^2', TAN_ID, []],
    ['\\csc^{2} x - 1', '\\cot^{2} x', 'cot(x)^2', COT_ID, []],
    ['1 + \\cot^{2} x', '\\csc^{2} x', 'csc(x)^2', COT_ID, []],
    ['\\frac{1}{1 + \\tan^{2} x}', '\\cos^{2} x', 'cos(x)^2', 'Use $1 + \\tan^{2} x = \\sec^{2} x$ and $\\sec x = \\frac{1}{\\cos x}$.', ['\\frac{1}{\\sec^{2} x}']],
    ['\\frac{1}{1 + \\cot^{2} x}', '\\sin^{2} x', 'sin(x)^2', 'Use $1 + \\cot^{2} x = \\csc^{2} x$ and $\\csc x = \\frac{1}{\\sin x}$.', ['\\frac{1}{\\csc^{2} x}']],
    ['\\frac{1 - \\cos^{2} x}{\\sin x}', '\\sin x', 'sin(x)', 'Replace $1 - \\cos^{2} x$ using $\\sin^{2} x + \\cos^{2} x = 1$.', ['\\frac{\\sin^{2} x}{\\sin x}']],
    ['\\frac{\\cos^{2} x - 1}{\\sin x}', '-\\sin x', '-sin(x)', 'Use $\\cos^{2} x - 1 = -\\sin^{2} x$, which comes from $\\sin^{2} x + \\cos^{2} x = 1$.', ['\\frac{-\\sin^{2} x}{\\sin x}']],
    ['(1 - \\sin x)(1 + \\sin x)', '\\cos^{2} x', 'cos(x)^2', 'Multiply out (a difference of squares), then use $\\sin^{2} x + \\cos^{2} x = 1$.', ['1 - \\sin^{2} x']],
    ['(\\sec x - 1)(\\sec x + 1)', '\\tan^{2} x', 'tan(x)^2', 'Multiply out (a difference of squares), then use $1 + \\tan^{2} x = \\sec^{2} x$.', ['\\sec^{2} x - 1']],
    ['(\\csc x - 1)(\\csc x + 1)', '\\cot^{2} x', 'cot(x)^2', 'Multiply out (a difference of squares), then use $1 + \\cot^{2} x = \\csc^{2} x$.', ['\\csc^{2} x - 1']],
    ['\\frac{\\sin^{2} x}{1 + \\cos x}', '1 - \\cos x', '1-cos(x)', 'Write $\\sin^{2} x = 1 - \\cos^{2} x$ and factor it as a difference of squares.', ['\\frac{1 - \\cos^{2} x}{1 + \\cos x}', '\\frac{(1 - \\cos x)(1 + \\cos x)}{1 + \\cos x}']],
    ['\\frac{\\cos^{2} x}{1 - \\sin x}', '1 + \\sin x', '1+sin(x)', 'Write $\\cos^{2} x = 1 - \\sin^{2} x$ and factor it as a difference of squares.', ['\\frac{1 - \\sin^{2} x}{1 - \\sin x}', '\\frac{(1 - \\sin x)(1 + \\sin x)}{1 - \\sin x}']],
    ['\\sin^{2} x + \\cos^{2} x + \\tan^{2} x', '\\sec^{2} x', 'sec(x)^2', 'Combine the first two terms using the Pythagorean identity, then use $1 + \\tan^{2} x = \\sec^{2} x$.', ['1 + \\tan^{2} x']],
    ['\\frac{\\sin x}{\\tan x}', '\\cos x', 'cos(x)', 'Write $\\tan x = \\frac{\\sin x}{\\cos x}$.', ['\\sin x \\cdot \\frac{\\cos x}{\\sin x}']],
    ['\\sin x \\cot x', '\\cos x', 'cos(x)', 'Write $\\cot x = \\frac{\\cos x}{\\sin x}$.', ['\\sin x \\cdot \\frac{\\cos x}{\\sin x}']],
    ['\\tan x \\cos x', '\\sin x', 'sin(x)', 'Write $\\tan x = \\frac{\\sin x}{\\cos x}$.', ['\\frac{\\sin x}{\\cos x} \\cdot \\cos x']],
    ['\\frac{\\cos x}{\\cot x}', '\\sin x', 'sin(x)', 'Write $\\cot x = \\frac{\\cos x}{\\sin x}$.', ['\\cos x \\cdot \\frac{\\sin x}{\\cos x}']],
    ['\\frac{\\sec x}{\\csc x}', '\\tan x', 'tan(x)', 'Write $\\sec x = \\frac{1}{\\cos x}$ and $\\csc x = \\frac{1}{\\sin x}$.', ['\\frac{\\frac{1}{\\cos x}}{\\frac{1}{\\sin x}}', '\\frac{\\sin x}{\\cos x}']],
    ['\\cos x \\csc x', '\\cot x', 'cot(x)', 'Write $\\csc x = \\frac{1}{\\sin x}$.', ['\\cos x \\cdot \\frac{1}{\\sin x}', '\\frac{\\cos x}{\\sin x}']],
    ['\\sin x \\sec x', '\\tan x', 'tan(x)', 'Write $\\sec x = \\frac{1}{\\cos x}$.', ['\\sin x \\cdot \\frac{1}{\\cos x}', '\\frac{\\sin x}{\\cos x}']],
    ['\\cos x\\,(\\tan x + \\cot x)', '\\csc x', 'csc(x)', QUO_ID, ['\\cos x \\left(\\frac{\\sin x}{\\cos x} + \\frac{\\cos x}{\\sin x}\\right)', '\\sin x + \\frac{\\cos^{2} x}{\\sin x}', '\\frac{\\sin^{2} x + \\cos^{2} x}{\\sin x}', '\\frac{1}{\\sin x}']],
    ['\\sin x\\,(\\csc x - \\sin x)', '\\cos^{2} x', 'cos(x)^2', 'Distribute, using $\\sin x \\csc x = 1$, then use the Pythagorean identity.', ['1 - \\sin^{2} x']],
    ['\\sin x + \\cos x \\cot x', '\\csc x', 'csc(x)', 'Write $\\cot x = \\frac{\\cos x}{\\sin x}$ and combine over a common denominator.', ['\\sin x + \\frac{\\cos^{2} x}{\\sin x}', '\\frac{\\sin^{2} x + \\cos^{2} x}{\\sin x}', '\\frac{1}{\\sin x}']],
    ['\\frac{\\sec x}{\\sin x} - \\frac{\\sin x}{\\cos x}', '\\cot x', 'cot(x)', 'Write $\\sec x = \\frac{1}{\\cos x}$, combine over the common denominator $\\sin x\\cos x$, and use the Pythagorean identity.', ['\\frac{1}{\\sin x \\cos x} - \\frac{\\sin x}{\\cos x}', '\\frac{1 - \\sin^{2} x}{\\sin x \\cos x}', '\\frac{\\cos^{2} x}{\\sin x \\cos x}', '\\frac{\\cos x}{\\sin x}']],
    ['\\tan x + \\frac{\\cos x}{1 + \\sin x}', '\\sec x', 'sec(x)', 'Write $\\tan x = \\frac{\\sin x}{\\cos x}$ and combine the fractions over the common denominator $\\cos x(1 + \\sin x)$.', ['\\frac{\\sin x}{\\cos x} + \\frac{\\cos x}{1 + \\sin x}', '\\frac{\\sin x(1 + \\sin x) + \\cos^{2} x}{\\cos x(1 + \\sin x)}', '\\frac{\\sin x + \\sin^{2} x + \\cos^{2} x}{\\cos x(1 + \\sin x)}', '\\frac{1 + \\sin x}{\\cos x(1 + \\sin x)}', '\\frac{1}{\\cos x}']],
    ['\\frac{1}{1 - \\sin x} + \\frac{1}{1 + \\sin x}', '2\\sec^{2} x', '2sec(x)^2', 'Combine the fractions over the common denominator $(1 - \\sin x)(1 + \\sin x)$.', ['\\frac{(1 + \\sin x) + (1 - \\sin x)}{(1 - \\sin x)(1 + \\sin x)}', '\\frac{2}{1 - \\sin^{2} x}', '\\frac{2}{\\cos^{2} x}']],
    ['\\frac{1}{1 - \\cos x} + \\frac{1}{1 + \\cos x}', '2\\csc^{2} x', '2csc(x)^2', 'Combine the fractions over the common denominator $(1 - \\cos x)(1 + \\cos x)$.', ['\\frac{(1 + \\cos x) + (1 - \\cos x)}{(1 - \\cos x)(1 + \\cos x)}', '\\frac{2}{1 - \\cos^{2} x}', '\\frac{2}{\\sin^{2} x}']],
    ['\\frac{\\cos x}{1 + \\sin x} + \\frac{1 + \\sin x}{\\cos x}', '2\\sec x', '2sec(x)', 'Combine the fractions over the common denominator $(1 + \\sin x)\\cos x$.', ['\\frac{\\cos^{2} x + (1 + \\sin x)^{2}}{(1 + \\sin x)\\cos x}', '\\frac{\\cos^{2} x + 1 + 2\\sin x + \\sin^{2} x}{(1 + \\sin x)\\cos x}', '\\frac{2 + 2\\sin x}{(1 + \\sin x)\\cos x}', '\\frac{2(1 + \\sin x)}{(1 + \\sin x)\\cos x}']],
    ['2\\sin x \\cos x', '\\sin 2x', 'sin(2x)', 'Use the double-angle identity $\\sin 2x = 2\\sin x\\cos x$.', []],
    ['\\cos^{2} x - \\sin^{2} x', '\\cos 2x', 'cos(2x)', 'Use the double-angle identity $\\cos 2x = \\cos^{2} x - \\sin^{2} x$.', []],
    ['1 - 2\\sin^{2} x', '\\cos 2x', 'cos(2x)', 'Use the double-angle identity $\\cos 2x = 1 - 2\\sin^{2} x$.', []],
    ['2\\cos^{2} x - 1', '\\cos 2x', 'cos(2x)', 'Use the double-angle identity $\\cos 2x = 2\\cos^{2} x - 1$.', []],
    ['\\frac{2\\tan x}{1 - \\tan^{2} x}', '\\tan 2x', 'tan(2x)', 'Use the double-angle identity $\\tan 2x = \\frac{2\\tan x}{1 - \\tan^{2} x}$.', [], 'x: 0.05..0.7'],
    ['\\frac{\\sin 2x}{\\sin x}', '2\\cos x', '2cos(x)', 'Use $\\sin 2x = 2\\sin x\\cos x$.', ['\\frac{2\\sin x\\cos x}{\\sin x}']],
    ['\\frac{\\sin 2x}{2\\cos x}', '\\sin x', 'sin(x)', 'Use $\\sin 2x = 2\\sin x\\cos x$.', ['\\frac{2\\sin x\\cos x}{2\\cos x}']],
    ['\\frac{\\sin 2x}{1 + \\cos 2x}', '\\tan x', 'tan(x)', 'Use $\\sin 2x = 2\\sin x\\cos x$ and $1 + \\cos 2x = 2\\cos^{2} x$.', ['\\frac{2\\sin x\\cos x}{2\\cos^{2} x}', '\\frac{\\sin x}{\\cos x}']],
    ['\\frac{1 - \\cos 2x}{\\sin 2x}', '\\tan x', 'tan(x)', 'Use $1 - \\cos 2x = 2\\sin^{2} x$ and $\\sin 2x = 2\\sin x\\cos x$.', ['\\frac{2\\sin^{2} x}{2\\sin x\\cos x}', '\\frac{\\sin x}{\\cos x}']],
    ['\\frac{1 + \\cos 2x}{2}', '\\cos^{2} x', 'cos(x)^2', 'Use $\\cos 2x = 2\\cos^{2} x - 1$.', ['\\frac{2\\cos^{2} x}{2}']],
    ['\\frac{1 - \\cos 2x}{2}', '\\sin^{2} x', 'sin(x)^2', 'Use $\\cos 2x = 1 - 2\\sin^{2} x$.', ['\\frac{2\\sin^{2} x}{2}']],
    ['\\sin x \\cos 2x + \\cos x \\sin 2x', '\\sin 3x', 'sin(3x)', 'Use the sum formula $\\sin(a + b) = \\sin a\\cos b + \\cos a\\sin b$ with $a = x$ and $b = 2x$.', []],
    ['\\cos 3x \\cos x + \\sin 3x \\sin x', '\\cos 2x', 'cos(2x)', 'Use the difference formula $\\cos(a - b) = \\cos a\\cos b + \\sin a\\sin b$ with $a = 3x$ and $b = x$.', []],
    ['\\sin 5x \\cos 2x - \\cos 5x \\sin 2x', '\\sin 3x', 'sin(3x)', 'Use the difference formula $\\sin(a - b) = \\sin a\\cos b - \\cos a\\sin b$ with $a = 5x$ and $b = 2x$.', []],
    ['\\cos 4x \\cos x - \\sin 4x \\sin x', '\\cos 5x', 'cos(5x)', 'Use the sum formula $\\cos(a + b) = \\cos a\\cos b - \\sin a\\sin b$ with $a = 4x$ and $b = x$.', []],
    ['\\frac{\\tan 2x + \\tan x}{1 - \\tan 2x \\tan x}', '\\tan 3x', 'tan(3x)', 'Use the sum formula $\\tan(a + b) = \\frac{\\tan a + \\tan b}{1 - \\tan a\\tan b}$ with $a = 2x$ and $b = x$.', [], 'x: 0.02..0.25'],
    ['\\frac{\\tan 5x - \\tan 2x}{1 + \\tan 5x \\tan 2x}', '\\tan 3x', 'tan(3x)', 'Use the difference formula $\\tan(a - b) = \\frac{\\tan a - \\tan b}{1 + \\tan a\\tan b}$ with $a = 5x$ and $b = 2x$.', [], 'x: 0.02..0.2'],
    ['\\sin\\left(\\frac{\\pi}{2} - x\\right)', '\\cos x', 'cos(x)', 'Use the difference formula $\\sin(a - b) = \\sin a\\cos b - \\cos a\\sin b$ with $a = \\frac{\\pi}{2}$ and $b = x$.', ['\\sin\\frac{\\pi}{2}\\cos x - \\cos\\frac{\\pi}{2}\\sin x', '1 \\cdot \\cos x - 0 \\cdot \\sin x']],
    ['\\cos\\left(\\frac{\\pi}{2} - x\\right)', '\\sin x', 'sin(x)', 'Use the difference formula $\\cos(a - b) = \\cos a\\cos b + \\sin a\\sin b$ with $a = \\frac{\\pi}{2}$ and $b = x$.', ['\\cos\\frac{\\pi}{2}\\cos x + \\sin\\frac{\\pi}{2}\\sin x', '0 \\cdot \\cos x + 1 \\cdot \\sin x']],
    ['\\tan\\left(\\frac{\\pi}{2} - x\\right)', '\\cot x', 'cot(x)', 'Write tangent as sine over cosine and use the cofunction identities for sine and cosine.', ['\\frac{\\sin\\left(\\frac{\\pi}{2} - x\\right)}{\\cos\\left(\\frac{\\pi}{2} - x\\right)}', '\\frac{\\cos x}{\\sin x}']],
    ['\\sin(\\pi - x)', '\\sin x', 'sin(x)', 'Use the difference formula $\\sin(a - b) = \\sin a\\cos b - \\cos a\\sin b$ with $a = \\pi$ and $b = x$.', ['\\sin\\pi\\cos x - \\cos\\pi\\sin x', '0 \\cdot \\cos x - (-1)\\sin x']],
    ['\\cos(\\pi - x)', '-\\cos x', '-cos(x)', 'Use the difference formula $\\cos(a - b) = \\cos a\\cos b + \\sin a\\sin b$ with $a = \\pi$ and $b = x$.', ['\\cos\\pi\\cos x + \\sin\\pi\\sin x', '(-1)\\cos x + 0 \\cdot \\sin x']],
    ['\\sin(x + \\pi)', '-\\sin x', '-sin(x)', 'Use the sum formula $\\sin(a + b) = \\sin a\\cos b + \\cos a\\sin b$ with $a = x$ and $b = \\pi$.', ['\\sin x\\cos\\pi + \\cos x\\sin\\pi', '\\sin x \\cdot (-1) + \\cos x \\cdot 0']],
    ['\\cos(x + \\pi)', '-\\cos x', '-cos(x)', 'Use the sum formula $\\cos(a + b) = \\cos a\\cos b - \\sin a\\sin b$ with $a = x$ and $b = \\pi$.', ['\\cos x\\cos\\pi - \\sin x\\sin\\pi', '\\cos x \\cdot (-1) - \\sin x \\cdot 0']],
    ['\\tan(x + \\pi)', '\\tan x', 'tan(x)', 'Write tangent as sine over cosine and shift both by $\\pi$.', ['\\frac{\\sin(x + \\pi)}{\\cos(x + \\pi)}', '\\frac{-\\sin x}{-\\cos x}']],
    ['\\sin\\left(x + \\frac{\\pi}{2}\\right)', '\\cos x', 'cos(x)', 'Use the sum formula $\\sin(a + b) = \\sin a\\cos b + \\cos a\\sin b$ with $a = x$ and $b = \\frac{\\pi}{2}$.', ['\\sin x\\cos\\frac{\\pi}{2} + \\cos x\\sin\\frac{\\pi}{2}', '\\sin x \\cdot 0 + \\cos x \\cdot 1']],
    ['\\cos\\left(x + \\frac{\\pi}{2}\\right)', '-\\sin x', '-sin(x)', 'Use the sum formula $\\cos(a + b) = \\cos a\\cos b - \\sin a\\sin b$ with $a = x$ and $b = \\frac{\\pi}{2}$.', ['\\cos x\\cos\\frac{\\pi}{2} - \\sin x\\sin\\frac{\\pi}{2}', '\\cos x \\cdot 0 - \\sin x \\cdot 1']],
    ['\\frac{\\sin(-x)}{\\cos(-x)}', '-\\tan x', '-tan(x)', 'Sine is odd and cosine is even: $\\sin(-x) = -\\sin x$ and $\\cos(-x) = \\cos x$.', ['\\frac{-\\sin x}{\\cos x}']],
    ['\\sin(2\\pi - x)', '-\\sin x', '-sin(x)', 'Use the difference formula $\\sin(a - b) = \\sin a\\cos b - \\cos a\\sin b$ with $a = 2\\pi$ and $b = x$.', ['\\sin 2\\pi\\cos x - \\cos 2\\pi\\sin x', '0 \\cdot \\cos x - 1 \\cdot \\sin x']],
    ['\\cos(2\\pi - x)', '\\cos x', 'cos(x)', 'Use the difference formula $\\cos(a - b) = \\cos a\\cos b + \\sin a\\sin b$ with $a = 2\\pi$ and $b = x$.', ['\\cos 2\\pi\\cos x + \\sin 2\\pi\\sin x', '1 \\cdot \\cos x + 0 \\cdot \\sin x']],
  ];

  G['F2-05'] = function (r) {
    const t = r.pick(IDENTITIES), chain = [t[0]].concat(t[4], [t[1]]);
    const hints = [t[3]];
    if (chain.length === 2) hints.push('Find the pattern of the identity inside the expression and replace it.');
    else {
      hints.push(`Rewrite the expression: $${chain[0]} = ${chain[1]}$.`);
      if (chain.length >= 4) hints.push(`Keep simplifying: $${chain[1]} = ${chain[2]}$, and continue until a single expression remains.`);
    }
    const item = {
      type: 'expr', vars: ['x'], domain: t[5] || 'x: 0.2..1.2',
      prompt: `Simplify $${t[0]}$ as far as possible.`,
      answer: t[2],
      hints: hints,
      solution: `${t[3]}\n\n${disp(chain)}`,
      $m: { kind: 'identity' },
    };
    return item;
  };

  // F2-06 trigonometric equations: all solutions in [0, 2pi)
  const FMT6 = ' Enter the solutions in increasing order as a comma-separated list (for example `pi/5, 3pi/2`), or `none` if there are none.';
  const FNAME6 = { sin: 'sine', cos: 'cosine', tan: 'tangent' };
  const VALS6 = {
    sin: [[0, 1, 1], [1, 2, 1], [-1, 2, 1], [1, 2, 2], [-1, 2, 2], [1, 2, 3], [-1, 2, 3], [1, 1, 1], [-1, 1, 1]],
    tan: [[0, 1, 1], [1, 3, 3], [-1, 3, 3], [1, 1, 1], [-1, 1, 1], [1, 1, 3], [-1, 1, 3]],
  };
  VALS6.cos = VALS6.sin;
  const QUADS6 = { sin: [[1, 2], [3, 4]], cos: [[1, 4], [2, 3]], tan: [[1, 3], [2, 4]] };       // quadrants where the function is [positive, negative]
  const quadAng6 = function (q, t) { return q === 1 ? t : q === 2 ? '\\pi - ' + t : q === 3 ? '\\pi + ' + t : '2\\pi - ' + t; };
  const quadDeg6 = function (q, ref) { return q === 1 ? ref : q === 2 ? 180 - ref : q === 3 ? 180 + ref : 360 - ref; };
  const angs6 = function (fn, e) { return SPECIAL_DEGS.filter(function (d) { return sxEq(exTrig(fn, d), e); }); };
  const isAxis6 = function (fn, e) { return e[0] === 0 || (fn !== 'tan' && e[1] === 1 && e[2] === 1); };
  const ref6 = function (fn, e) { const a = [Math.abs(e[0]), e[1], e[2]]; return [30, 45, 60].filter(function (d) { return sxEq(TRIG_REF[fn][d], a); })[0]; };
  const sols6 = function (degs) { return uniq6(degs.map(radOf)); };                  // degrees -> sorted distinct fractions of pi
  const ans6 = function (fracs) { return fracs.length ? fracs.map(piC).join(', ') : 'none'; };
  const eq6 = function (fn, e, v) { return FN_TEX[fn] + ' ' + v + ' = ' + sxTex(e); };
  const fin6 = function (fracs) {
    if (!fracs.length) return 'There are no solutions in $[0, 2\\pi)$, so the answer is `none`.';
    if (fracs.length === 1) return 'The only solution in $[0, 2\\pi)$ is $x = ' + piT(fracs[0]) + '$.';
    return 'The solutions in $[0, 2\\pi)$ are $x = ' + fracs.map(piT).join(', ') + '$.';
  };
  const AX6 = {
    sin: { '0': '$y = 0$ at the points $(1, 0)$ and $(-1, 0)$', '1': '$y = 1$ only at the top point $(0, 1)$', '-1': '$y = -1$ only at the bottom point $(0, -1)$' },
    cos: { '0': '$x = 0$ at the points $(0, 1)$ and $(0, -1)$', '1': '$x = 1$ only at the right-hand point $(1, 0)$', '-1': '$x = -1$ only at the left-hand point $(-1, 0)$' },
  };
  // how to read off the solutions of fn(v) = e on one turn of the circle (a sentence that starts in lower case)
  function explain6(fn, e, v) {
    const th = function (d) { return piT(radOf(d)); };
    if (isAxis6(fn, e)) {
      const end = ', so ' + angs6(fn, e).map(function (d) { return '$' + v + ' = ' + th(d) + '$'; }).join(' and ') + '.';
      if (fn === 'tan') return '$\\tan ' + v + ' = \\frac{\\sin ' + v + '}{\\cos ' + v + '}$ is $0$ exactly when $\\sin ' + v + ' = 0$ (and $\\cos ' + v + ' \\ne 0$), which happens at the points $(1, 0)$ and $(-1, 0)$ of the unit circle' + end;
      return 'on the unit circle, $\\' + fn + ' ' + v + '$ is the $' + (fn === 'sin' ? 'y' : 'x') + '$-coordinate of the point at angle $' + v + '$, and ' + AX6[fn][e[0]] + end;
    }
    const ref = ref6(fn, e), rt = th(ref), pos = e[0] > 0, qs = QUADS6[fn][pos ? 0 : 1], ab = sxTex([Math.abs(e[0]), e[1], e[2]]);
    const sols = qs.map(function (q) { return '$' + v + ' = ' + (q === 1 ? rt : quadAng6(q, rt) + ' = ' + th(quadDeg6(q, ref))) + '$'; });
    return 'the reference angle is $' + rt + '$, because $' + FN_TEX[fn] + rt + ' = ' + ab + '$. ' + cap(FNAME6[fn]) + ' is ' + (pos ? 'positive' : 'negative') +
      ' in quadrants ' + QUAD_NAME[qs[0]] + ' and ' + QUAD_NAME[qs[1]] + ', so ' + sols.join(' and ') + '.';
  }
  function hints6(fn, e, v) {
    if (isAxis6(fn, e)) {
      if (fn === 'tan') return [
        'Write $\\tan ' + v + ' = \\frac{\\sin ' + v + '}{\\cos ' + v + '}$. A fraction equals $0$ exactly when its numerator is $0$ (and its denominator is not).',
        'Find the angles in $[0, 2\\pi)$ where $\\sin ' + v + ' = 0$, and check that $\\cos ' + v + ' \\ne 0$ there.'];
      const c = fn === 'sin' ? 'y' : 'x';
      return [
        'On the unit circle, $\\' + fn + ' ' + v + '$ is the $' + c + '$-coordinate of the point at angle $' + v + '$. Which point or points of the circle have $' + c + ' = ' + e[0] + '$?',
        'Convert each point you found into an angle in $[0, 2\\pi)$, measured counterclockwise from the positive $x$-axis.'];
    }
    const ref = ref6(fn, e), rt = piT(radOf(ref)), pos = e[0] > 0, qs = QUADS6[fn][pos ? 0 : 1], ab = sxTex([Math.abs(e[0]), e[1], e[2]]);
    return [
      (pos ? 'Which angle between $0$ and $\\frac{\\pi}{2}$ has ' + FNAME6[fn] + ' equal to $' + ab + '$? That is the reference angle.' : 'Ignore the minus sign for a moment: which angle between $0$ and $\\frac{\\pi}{2}$ has ' + FNAME6[fn] + ' equal to $' + ab + '$? That is the reference angle.'),
      'The reference angle is $' + rt + '$, because $' + FN_TEX[fn] + rt + ' = ' + ab + '$. ' + cap(FNAME6[fn]) + ' is ' + (pos ? 'positive' : 'negative') + ' in quadrants ' + QUAD_NAME[qs[0]] + ' and ' + QUAD_NAME[qs[1]] + ', so there is one solution in each.',
      'In quadrant ' + QUAD_NAME[qs[0]] + ' the angle is $' + quadAng6(qs[0], 'r') + '$ and in quadrant ' + QUAD_NAME[qs[1]] + ' it is $' + quadAng6(qs[1], 'r') + '$, where $r = ' + rt + '$ is the reference angle.'];
  }
  const item6 = function (eqTex, sols, hints, solution, kind, extra) {
    return {
      type: 'list',
      prompt: 'Solve $' + eqTex + '$ for $0 \\le x < 2\\pi$.' + FMT6,
      answer: ans6(sols), hints: hints, solution: solution,
      $m: Object.assign({ kind: kind }, extra || {}),
    };
  };
  const K6 = {}, W6 = [];
  const reg6 = function (name, w, fn) { K6[name] = fn; for (let i = 0; i < w; i++) W6.push(name); };
  G['F2-06'] = function (r) { return K6[r.pick(W6)](r); };
  const cf6 = function (c) {                                         // coefficient [n, 1, k] in front of a trig function
    const s = c[0] < 0 ? '-' : '', a = Math.abs(c[0]);
    return c[2] === 1 ? s + (a === 1 ? '' : a) : s + (a === 1 ? '' : a) + '\\sqrt{' + c[2] + '}';
  };

  reg6('basic', 3, function (r) {
    const fn = r.pick(['sin', 'cos', 'tan']), wantAxis = r.rand() < 0.2;
    const e = r.pick(VALS6[fn].filter(function (x) { return isAxis6(fn, x) === wantAxis; }));
    const sols = sols6(angs6(fn, e));
    return item6(eq6(fn, e, 'x'), sols, hints6(fn, e, 'x'), 'We need the angles in $[0, 2\\pi)$ where $' + eq6(fn, e, 'x') + '$. Using the unit circle, ' + explain6(fn, e, 'x') + '\n\n' + fin6(sols), 'basic');
  });

  reg6('lin', 4, function (r) {
    const fn = r.pick(['sin', 'sin', 'cos', 'cos', 'tan']);
    const e = r.pick(VALS6[fn].filter(function (x) { return x[0] !== 0; }));
    const F = FN_TEX[fn] + ' x', base = eq6(fn, e, 'x'), sols = sols6(angs6(fn, e));
    let eqTex, rows, h1;
    if (e[2] === 1 && r.rand() < 0.5) {                                 // p fn x + q = w with an integer right side
      const p = e[1] === 1 ? r.int(2, 5) : 2 * r.int(1, 3), q = r.nonzero(-6, 6), w = p * e[0] / e[1] + q;
      const lhs = terms([[p, F], [q, '']]).tex;
      eqTex = lhs + ' = ' + w;
      rows = [[lhs, w], [terms([[p, F]]).tex, w - q, elimN(q, '')], [F, sxTex(e), ['divide both sides by ', p]]];
      h1 = 'Isolate $' + F + '$: ' + elim(q, '') + ' on both sides, then divide both sides by $' + p + '$.';
    } else {
      const d = e[1], c = [e[0], 1, e[2]], cA = sxTex([Math.abs(c[0]), 1, c[2]]), dF = terms([[d, F]]).tex;
      if (d > 1 && r.rand() < 0.4) {                                    // d fn x = c
        eqTex = dF + ' = ' + sxTex(c);
        rows = [[dF, sxTex(c)], [F, sxTex(e), ['divide both sides by ', d]]];
        h1 = 'Divide both sides by $' + d + '$ to isolate $' + F + '$.';
      } else {                                                          // d fn x -+ |c| = 0
        const lhs = dF + (c[0] > 0 ? ' - ' : ' + ') + cA;
        eqTex = lhs + ' = 0';
        rows = [[lhs, 0], [dF, sxTex(c), [c[0] > 0 ? 'add ' : 'subtract ', cA, ' on both sides']]];
        if (d > 1) rows.push([F, sxTex(e), ['divide both sides by ', d]]);
        h1 = 'Isolate $' + F + '$: ' + (c[0] > 0 ? 'add' : 'subtract') + ' $' + cA + '$ on both sides' + (d > 1 ? ', then divide both sides by $' + d + '$' : '') + '.';
      }
    }
    const H = hints6(fn, e, 'x').slice(isAxis6(fn, e) ? 0 : 1);
    return item6(eqTex, sols, [h1, 'Isolating gives $' + base + '$. ' + H[0], H[1]],
      'First isolate $' + F + '$.\n\n' + align(rows) + '\n\nNow solve $' + base + '$ on $[0, 2\\pi)$: ' + explain6(fn, e, 'x') + '\n\n' + fin6(sols), 'lin');
  });

  reg6('sq', 3, function (r) {
    const fn = r.pick(['sin', 'cos', 'tan']);
    const e = r.pick(VALS6[fn].filter(function (x) { return x[0] > 0; })), eN = [-e[0], e[1], e[2]];
    const f2 = fr(e[0] * e[0] * e[2], e[1] * e[1]), m = f2[1], t = f2[0], F2 = FN_TEX[fn] + '^{2} x', F = FN_TEX[fn] + ' x';
    const mF2 = terms([[m, F2]]).tex, sols = sols6(angs6(fn, e).concat(angs6(fn, eN)));
    const form = r.pick(m > 1 ? ['iso', 'scaled', 'scaled', 'zero', 'zero'] : ['iso', 'zero', 'zero']);
    const rows = [];
    if (form === 'iso') rows.push([F2, ftex(f2)]);
    else if (form === 'scaled') rows.push([mF2, t], [F2, ftex(f2), ['divide both sides by ', m]]);
    else {
      rows.push([mF2 + ' - ' + t, 0], [mF2, t, ['add ', t, ' on both sides']]);
      if (m > 1) rows.push([F2, ftex(f2), ['divide both sides by ', m]]);
    }
    const eqTex = form === 'zero' ? mF2 + ' - ' + t + ' = 0' : form === 'scaled' ? mF2 + ' = ' + t : F2 + ' = ' + ftex(f2);
    rows.push([F, '\\pm ' + sxTex(e), 'take the square root of both sides, keeping both signs']);
    const steps = [];
    if (form === 'zero') steps.push('add $' + t + '$ to both sides');
    if (form !== 'iso' && m > 1) steps.push('divide both sides by $' + m + '$');
    const tail = 'Solve $' + eq6(fn, e, 'x') + '$ and $' + eq6(fn, eN, 'x') + '$ separately on $[0, 2\\pi)$ (reference angle, then quadrants), and list all the solutions together.';
    const hints = form === 'iso'
      ? ['Take the square root of both sides. Remember that a square root can be positive or negative.', 'That gives $' + F + ' = \\pm ' + sxTex(e) + '$, which is two equations: $' + eq6(fn, e, 'x') + '$ and $' + eq6(fn, eN, 'x') + '$.', tail]
      : ['Isolate $' + F2 + '$: ' + steps.join(', then ') + '.', 'That gives $' + F2 + ' = ' + ftex(f2) + '$. Now take the square root of both sides, keeping both signs: $' + F + ' = \\pm ' + sxTex(e) + '$.', tail];
    return item6(eqTex, sols, hints,
      'Isolate the squared function, then take square roots.\n\n' + align(rows) + '\n\nSo we need both $' + eq6(fn, e, 'x') + '$ and $' + eq6(fn, eN, 'x') + '$.\n\n' +
      'For $' + eq6(fn, e, 'x') + '$: ' + explain6(fn, e, 'x') + '\n\nFor $' + eq6(fn, eN, 'x') + '$: ' + explain6(fn, eN, 'x') + '\n\n' + fin6(sols), 'sq');
  });

  reg6('ratio', 2, function (r) {
    const e = r.pick(VALS6.tan.filter(function (x) { return x[0] !== 0; }));
    const A = e[1] === 3 ? [1, 1, 3] : [1, 1, 1], B = e[1] === 3 ? [e[0], 1, 1] : [e[0], 1, e[2]];
    const sinT = cf6(A) + '\\sin x', cosT = cf6(B) + '\\cos x', cosAbs = cf6([Math.abs(B[0]), 1, B[2]]) + '\\cos x';
    const zero = r.rand() < 0.5, sols = sols6(angs6('tan', e)), base = eq6('tan', e, 'x');
    const lhs = sinT + (B[0] < 0 ? ' + ' : ' - ') + cosAbs;
    const rows = zero ? [[lhs, 0], [sinT, cosT, [B[0] < 0 ? 'subtract ' : 'add ', cosAbs, ' on both sides']]] : [[sinT, cosT]];
    rows.push([cf6(A) + '\\tan x', sxTex(B), ['divide both sides by ', '\\cos x']]);
    if (A[2] === 3) rows.push(['\\tan x', sxTex(e), ['divide both sides by ', '\\sqrt{3}']]);
    const H = hints6('tan', e, 'x').slice(1);
    return item6(zero ? lhs + ' = 0' : sinT + ' = ' + cosT, sols,
      ['Divide both sides by $\\cos x$ so that $\\frac{\\sin x}{\\cos x} = \\tan x$ appears.', 'Dividing by $\\cos x$ leads to $' + base + '$. ' + H[0], H[1]],
      (zero ? 'Move the cosine term to the right side, then divide ' : 'Divide ') + 'both sides by $\\cos x$ to get a tangent. (This is allowed: if $\\cos x$ were $0$, the equation would force $\\sin x = 0$ as well, but $\\sin^{2} x + \\cos^{2} x = 1$ means they are never both $0$.)\n\n' +
      align(rows) + '\n\nNow solve $' + base + '$ on $[0, 2\\pi)$: ' + explain6('tan', e, 'x') + '\n\n' + fin6(sols), 'ratio');
  });

  reg6('none', 1, function (r) {
    const fn = r.pick(['sin', 'cos']), mag = r.pick([[3, 2], [4, 3], [5, 4], [5, 3], [2, 1], [3, 1], [7, 4], [7, 5]]), neg = r.rand() < 0.5;
    const n = mag[0], d = mag[1], F = FN_TEX[fn] + ' x', val = (neg ? '-' : '') + (d === 1 ? n : '\\frac{' + n + '}{' + d + '}');
    let eqTex, rows, h1;
    if (d === 1 || r.rand() < 0.4) {
      eqTex = F + ' = ' + val; rows = [];
      h1 = 'Think about the unit circle: ' + (fn === 'sin' ? 'sine is the $y$-coordinate' : 'cosine is the $x$-coordinate') + ' of a point on the circle. How large and how small can it be?';
    } else {
      const dF = terms([[d, F]]).tex;
      if (r.rand() < 0.5) { eqTex = dF + ' = ' + (neg ? '-' : '') + n; rows = [[dF, (neg ? '-' : '') + n], [F, val, ['divide both sides by ', d]]]; h1 = 'Divide both sides by $' + d + '$ to isolate $' + F + '$.'; }
      else {
        const lhs = dF + (neg ? ' + ' : ' - ') + n;
        eqTex = lhs + ' = 0';
        rows = [[lhs, 0], [dF, (neg ? '-' : '') + n, [neg ? 'subtract ' : 'add ', n, ' on both sides']], [F, val, ['divide both sides by ', d]]];
        h1 = 'Isolate $' + F + '$: ' + (neg ? 'subtract' : 'add') + ' $' + n + '$ on both sides, then divide both sides by $' + d + '$.';
      }
    }
    return item6(eqTex, [], [h1, 'The ' + (fn === 'sin' ? '$y$' : '$x$') + '-coordinate of a point on the unit circle always lies between $-1$ and $1$, so ' + FNAME6[fn] + ' does too.', 'Compare $' + val + '$ with the interval $[-1, 1]$.'],
      (rows.length ? 'First isolate $' + F + '$.\n\n' + align(rows) + '\n\n' : '') +
      cap(FNAME6[fn]) + ' is the ' + (fn === 'sin' ? '$y$' : '$x$') + '-coordinate of a point on the unit circle, so $-1 \\le ' + F + ' \\le 1$ for every angle $x$. Since $' + val + '$ is ' + (neg ? 'less than $-1$' : 'greater than $1$') + ', no angle works.\n\n' + fin6([]), 'none');
  });

  // F2-06 (continued): quadratics in sin / cos, Pythagorean substitution, factoring, multiple angles and phase shifts
  const uniq6 = function (fracs) {
    const out = [];
    fracs.slice().sort(function (a, b) { return a[0] * b[1] - b[0] * a[1]; }).forEach(function (f) {
      if (!out.length || out[out.length - 1][0] !== f[0] || out[out.length - 1][1] !== f[1]) out.push(f);
    });
    return out;
  };
  const RV6 = [[0, 1], [1, 2], [-1, 2], [1, 1], [-1, 1]];                         // rational values that special angles reach
  const EXTRA6 = [[2, 1], [-2, 1], [3, 2], [-3, 2]];                              // values that no sine or cosine can take
  const rootAngs6 = function (fn, v) { return Math.abs(v[0]) > v[1] ? [] : angs6(fn, [v[0], v[1], 1]); };
  const fac6 = function (F, v) { return terms([[v[1], F], [-v[0], '']]).tex; };    // d F - n, from the root n/d
  const facE6 = function (fn, e) {                                                // factor for  fn x = e
    const F = FN_TEX[fn] + ' x';
    return e[0] === 0 ? F : terms([[e[1], F]]).tex + (e[0] > 0 ? ' - ' : ' + ') + sxTex([Math.abs(e[0]), 1, e[2]]);
  };
  const wrap6 = function (f) { return /[+-]/.test(f.slice(1)) ? '(' + f + ')' : f; };
  const join6 = function (x, y) { return y === '0' ? x : y.charAt(0) === '-' ? x + ' - ' + y.slice(1) : x + ' + ' + y; };
  const noRoot6 = function (fn, v, eqT) { return '$' + eqT + '$ has no solutions: ' + FNAME6[fn] + ' is never ' + (v[0] > 0 ? 'greater than $1$' : 'less than $-1$') + '.'; };

  reg6('quad', 3, function (r) {
    const fn = r.pick(['sin', 'sin', 'cos', 'cos', 'tan']), extra = fn !== 'tan' && r.rand() < 0.25;
    const pool = fn === 'tan' ? [[0, 1], [1, 1], [-1, 1]] : RV6;
    let v1 = r.pick(pool), v2 = extra ? r.pick(EXTRA6) : r.pick(pool);
    if (v1[1] === v2[1] && Math.abs(v1[0]) === Math.abs(v2[0])) again();
    if (v2[0] === 0) { const tmp = v1; v1 = v2; v2 = tmp; }                  // a zero root first: F(...) reads better than (...)F
    const F = FN_TEX[fn] + ' x', F2 = FN_TEX[fn] + '^{2} x';
    const a = v1[1] * v2[1], b = -(v1[1] * v2[0] + v2[1] * v1[0]), c = v1[0] * v2[0];
    const f1 = fac6(F, v1), f2 = fac6(F, v2), poly = terms([[a, F2], [b, F], [c, '']]).tex, zero = v1[0] === 0 || v2[0] === 0;
    const roots = [v1, v2], vals = roots.map(function (v) { return FN_TEX[fn] + ' x = ' + ftex(v); });
    const sols = sols6(rootAngs6(fn, v1).concat(rootAngs6(fn, v2)));
    const paras = roots.map(function (v, i) {
      return Math.abs(v[0]) > v[1] ? noRoot6(fn, v, vals[i]) : 'For $' + vals[i] + '$: ' + explain6(fn, [v[0], v[1], 1], 'x');
    });
    const hints = [
      zero ? 'Every term contains $' + F + '$, so factor it out. Do not divide by $' + F + '$: that would lose the solutions where $' + F + ' = 0$.'
        : 'Treat $' + F + '$ as a single unknown $u$: the equation is the quadratic $' + terms([[a, 'u^{2}'], [b, 'u'], [c, '']]).tex + ' = 0$. Factor it.',
      'The equation factors as $' + wrap6(f1) + wrap6(f2) + ' = 0$, so one of the two factors must be $0$.',
      'Solve each factor for $' + F + '$ and find the angles in $[0, 2\\pi)$ for each value' + (extra ? ' (remember that ' + FNAME6[fn] + ' is always between $-1$ and $1$)' : '') + '.'];
    return item6(poly + ' = 0', sols, hints,
      'Treat $' + F + '$ as a single unknown and factor the quadratic' + (zero ? ' (every term has a factor of $' + F + '$, which we factor out rather than divide by)' : '') + '.\n\n' +
      disp([poly, wrap6(f1) + wrap6(f2), '0']) + '\n\nA product is zero when one of its factors is zero, so $' + f1 + ' = 0$ or $' + f2 + ' = 0$; that is, $' + vals[0] + '$ or $' + vals[1] + '$.\n\n' +
      paras.join('\n\n') + '\n\n' + fin6(sols), 'quad', { extra: extra });
  });

  reg6('pyth', 2, function (r) {
    const sq = r.pick(['sin', 'cos']), g = sq === 'sin' ? 'cos' : 'sin', extra = r.rand() < 0.2;
    const v1 = r.pick(RV6), v2 = extra ? r.pick(EXTRA6) : r.pick(RV6);
    if (v1[1] === v2[1] && Math.abs(v1[0]) === Math.abs(v2[0])) again();
    const a = v1[1] * v2[1], b = v1[1] * v2[0] + v2[1] * v1[0], c = -v1[0] * v2[0] - a;
    const S2 = FN_TEX[sq] + '^{2} x', G2 = FN_TEX[g] + '^{2} x', G = FN_TEX[g] + ' x';
    const eqLhs = terms([[a, S2], [b, G], [c, '']]).tex, aT = a === 1 ? '' : String(a);
    const sub = join6(aT + '(1 - ' + G2 + ')', terms([[b, G], [c, '']]).tex), red = terms([[-a, G2], [b, G], [a + c, '']]).tex, mono = terms([[a, G2], [-b, G], [-(a + c), '']]).tex;
    const f1 = fac6(G, v1), f2 = fac6(G, v2), roots = [v1, v2], vals = roots.map(function (v) { return FN_TEX[g] + ' x = ' + ftex(v); });
    const sols = sols6(rootAngs6(g, v1).concat(rootAngs6(g, v2)));
    const paras = roots.map(function (v, i) {
      return Math.abs(v[0]) > v[1] ? noRoot6(g, v, vals[i]) : 'For $' + vals[i] + '$: ' + explain6(g, [v[0], v[1], 1], 'x');
    });
    const hints = [
      'Only one trigonometric function should appear. Replace $' + S2 + '$ by $1 - ' + G2 + '$, which comes from $\\sin^{2} x + \\cos^{2} x = 1$.',
      'After simplifying (and multiplying by $-1$) you get the quadratic $' + mono + ' = 0$ in $' + G + '$. Factor it.',
      'Set each factor equal to $0$, solve for $' + G + '$, then find the angles in $[0, 2\\pi)$ for each value' + (extra ? ' (remember that ' + FNAME6[g] + ' is always between $-1$ and $1$)' : '') + '.'];
    return item6(eqLhs + ' = 0', sols, hints,
      'The equation has both sine and cosine. Use $\\sin^{2} x + \\cos^{2} x = 1$ to write $' + S2 + ' = 1 - ' + G2 + '$, so only ' + FNAME6[g] + ' remains.\n\n' +
      align([[eqLhs, 0], [sub, 0, 'replace the squared ' + FNAME6[sq]], [red, 0, 'distribute and combine like terms'], [mono, 0, ['multiply both sides by ', -1]], [wrap6(f1) + wrap6(f2), 0, 'factor']]) +
      '\n\nA product is zero when one of its factors is zero, so $' + f1 + ' = 0$ or $' + f2 + ' = 0$; that is, $' + vals[0] + '$ or $' + vals[1] + '$.\n\n' + paras.join('\n\n') + '\n\n' + fin6(sols), 'pyth', { extra: extra });
  });

  reg6('prod', 2, function (r) {
    const sw = r.rand() < 0.5, fns = sw ? ['cos', 'sin'] : ['sin', 'cos'];
    const e1 = r.pick(VALS6.sin), e2 = r.pick(VALS6.sin);
    if (isAxis6('sin', e1) && isAxis6('sin', e2)) again();
    const f1 = facE6(fns[0], e1), f2 = facE6(fns[1], e2), eqs = [eq6(fns[0], e1, 'x'), eq6(fns[1], e2, 'x')];
    const all = angs6(fns[0], e1).concat(angs6(fns[1], e2)), sols = sols6(all), dup = all.length - sols.length;
    const hints = [
      'A product is zero when one of its factors is zero, so set each factor equal to $0$ separately.',
      'That gives $' + f1 + ' = 0$ and $' + f2 + ' = 0$. Solve each for the trigonometric function: $' + eqs[0] + '$ and $' + eqs[1] + '$.',
      'Find the angles in $[0, 2\\pi)$ for each equation (reference angle, then quadrants) and combine all the solutions in increasing order.'];
    return item6(wrap6(f1) + wrap6(f2) + ' = 0', sols, hints,
      'A product is zero when one of its factors is zero, so $' + f1 + ' = 0$ or $' + f2 + ' = 0$. Solving each for the trigonometric function gives $' + eqs[0] + '$ or $' + eqs[1] + '$.\n\n' +
      'For $' + eqs[0] + '$: ' + explain6(fns[0], e1, 'x') + '\n\nFor $' + eqs[1] + '$: ' + explain6(fns[1], e2, 'x') + '\n\n' +
      (dup ? 'Some angles solve both equations; we list each only once.\n\n' : '') + fin6(sols), 'prod');
  });

  reg6('cfac', 2, function (r) {
    const cfn = r.pick(['sin', 'cos']), ofn = cfn === 'sin' ? 'cos' : 'sin';
    const e = r.pick([[1, 2, 1], [-1, 2, 1], [1, 2, 2], [-1, 2, 2], [1, 2, 3], [-1, 2, 3]]), d = e[1], c = [e[0], 1, e[2]];
    const C = FN_TEX[cfn] + ' x', cAbs = cf6([Math.abs(c[0]), 1, c[2]]) + C, prod = d + '\\sin x\\cos x', rhs = cf6(c) + C;
    const fo = facE6(ofn, e), moved = prod + (c[0] > 0 ? ' - ' : ' + ') + cAbs, eqs = [FN_TEX[cfn] + ' x = 0', eq6(ofn, e, 'x')];
    const all = angs6(cfn, [0, 1, 1]).concat(angs6(ofn, e)), sols = sols6(all);
    const hints = [
      'Do not divide both sides by $' + C + '$: you could lose the solutions where $' + C + ' = 0$. Move everything to one side and factor out $' + C + '$.',
      'Factoring gives $' + C + '(' + fo + ') = 0$, so $' + C + ' = 0$ or $' + fo + ' = 0$.',
      'Solve $' + eqs[0] + '$ and $' + eqs[1] + '$ on $[0, 2\\pi)$, then combine all the solutions in increasing order.'];
    return item6(prod + ' = ' + rhs, sols, hints,
      'Do not divide by $' + C + '$ (that would lose the solutions where $' + C + ' = 0$). Instead, move everything to one side and factor.\n\n' +
      align([[prod, rhs], [moved, 0, [c[0] > 0 ? 'subtract ' : 'add ', cAbs, ' on both sides']], [C + '(' + fo + ')', 0, ['factor out ', C]]]) +
      '\n\nSo $' + eqs[0] + '$ or $' + fo + ' = 0$, that is, $' + eqs[1] + '$.\n\n' +
      'For $' + eqs[0] + '$: ' + explain6(cfn, [0, 1, 1], 'x') + '\n\nFor $' + eqs[1] + '$: ' + explain6(ofn, e, 'x') + '\n\n' + fin6(sols), 'cfac');
  });

  // u = B x + C with B > 0 a fraction and C a fraction of pi: every pair [u, x] with fn(u) = e and x in [0, 2pi), in units of pi
  const cmpF6 = function (a, b) { return a[0] * b[1] - b[0] * a[1]; };
  function argSols6(fn, e, B, C) {
    const lo = C, hi = fadd(fmul([2, 1], B), C), out = [];
    angs6(fn, e).forEach(function (d) {
      for (let k = -4; k <= 8; k++) {
        const u = fadd(radOf(d), [2 * k, 1]);
        if (cmpF6(u, lo) >= 0 && cmpF6(u, hi) < 0) out.push([u, fdiv(fsub(u, C), B)]);
      }
    });
    out.sort(function (p, q) { return cmpF6(p[0], q[0]); });
    return { pairs: out, lo: lo, hi: hi };
  }
  const mixed6 = function (parts) { return parts.map(function (x, i) { return i % 2 === 0 ? x : '$' + x + '$'; }).join(''); };
  const argKind6 = function (r, which) {
    const fn = r.pick(which === 'half' ? ['sin', 'cos', 'cos', 'tan'] : ['sin', 'cos', 'tan']), e = r.pick(VALS6[fn]);
    let B, C, uTex, fnTex, convParts;
    if (which === 'multi') { B = [2, 1]; C = [0, 1]; uTex = '2x'; fnTex = FN_TEX[fn] + ' 2x'; convParts = ['divide each ', 'u', ' by ', '2']; }
    else if (which === 'half') { B = [1, 2]; C = [0, 1]; uTex = '\\frac{x}{2}'; fnTex = FN_TEX[fn] + '\\frac{x}{2}'; convParts = ['multiply each ', 'u', ' by ', '2']; }
    else {
      const ph = r.pick([[1, 6], [1, 4], [1, 3]]), minus = r.rand() < 0.5, pt = piT(ph);
      B = [1, 1]; C = minus ? [-ph[0], ph[1]] : ph;
      uTex = 'x ' + (minus ? '-' : '+') + ' ' + pt; fnTex = FN_TEX[fn] + '\\left(' + uTex + '\\right)';
      convParts = minus ? ['add ', pt, ' to each ', 'u'] : ['subtract ', pt, ' from each ', 'u'];
    }
    const res = argSols6(fn, e, B, C), sols = uniq6(res.pairs.map(function (p) { return p[1]; }));
    const uList = res.pairs.map(function (p) { return piT(p[0]); }), xList = res.pairs.map(function (p) { return piT(p[1]); });
    const range = '[' + piT(res.lo) + ', ' + piT(res.hi) + ')', base = eq6(fn, e, 'u'), conv = mixed6(convParts);
    const turns = which === 'multi' ? ', which is two full turns of the circle' : which === 'half' ? ', which is only half a turn of the circle' : '';
    const hints = [
      'Let $u = ' + uTex + '$. If $0 \\le x < 2\\pi$, then $u$ lies in $' + range + '$' + turns + '.',
      'Solve $' + base + '$ for $u$ in that range. Find the solutions in one turn first, then add or subtract $2\\pi$ to find any others that fit.',
      'Finally ' + conv + ' to get $x$.'];
    const nconv = convParts.map(function (x, i) { return i % 2 === 0 ? x : x; });
    const solution = 'Let $u = ' + uTex + '$. As $x$ runs through $[0, 2\\pi)$, $u$ runs through $' + range + '$' + turns + '. So we solve $' + base + '$ for $u$ in that range.\n\n' +
      'Within one turn: ' + explain6(fn, e, 'u') + '\n\n' +
      (uList.length
        ? 'Adding or subtracting full turns ($2\\pi$) and keeping the values that lie in $' + range + '$ gives\n\n' + align([['u', uList.join(', ')], ['x', xList.join(', '), nconv]]) + '\n\n'
        : 'None of these values, even after adding or subtracting full turns ($2\\pi$), lies in $' + range + '$, so there are no solutions.\n\n') +
      fin6(sols);
    return item6(fnTex + ' = ' + sxTex(e), sols, hints, solution, which);
  };
  reg6('multi', 4, function (r) { return argKind6(r, 'multi'); });
  reg6('half', 2, function (r) { return argKind6(r, 'half'); });
  reg6('phase', 3, function (r) { return argKind6(r, 'phase'); });

  // F2-07 triangles: right-triangle trigonometry, law of sines, law of cosines
  const trig7 = {
    sin: function (d) { return Math.sin(d * Math.PI / 180); },
    cos: function (d) { return Math.cos(d * Math.PI / 180); },
    tan: function (d) { return Math.tan(d * Math.PI / 180); },
  };
  const inv7 = {
    sin: function (v) { return Math.asin(v) * 180 / Math.PI; },
    cos: function (v) { return Math.acos(v) * 180 / Math.PI; },
    tan: function (v) { return Math.atan(v) * 180 / Math.PI; },
  };
  const f4 = function (v) { return v.toFixed(4); };
  const rs7 = function (v, dp) {                                         // like roundStr, but keeps further away from rounding boundaries
    if (!isFinite(v)) again();
    const sc = Math.abs(v) * Math.pow(10, dp), f = sc - Math.floor(sc);
    if (Math.abs(f - 0.5) < 0.2) again();
    return v.toFixed(dp);
  };
  const deg7 = function (d) { return d + '^\\circ'; };
  const aan7 = function (n) { return /^(8|11(\.|$)|18(\.|$))/.test(String(n)) ? 'an' : 'a'; };
  const RND7 = { 1: ' Round your answer to the nearest tenth.', 2: ' Round your answer to two decimal places.' };
  const K7 = {}, W7 = [];
  const reg7 = function (name, w, fn) { K7[name] = fn; for (let i = 0; i < w; i++) W7.push(name); };
  G['F2-07'] = function (r) { return K7[r.pick(W7)](r); };
  const ROLE7 = { opp: 'opposite side', adj: 'adjacent side', hyp: 'hypotenuse' };
  const FNDEF7 = {
    sin: '$\\sin\\theta = \\frac{\\text{opposite}}{\\text{hypotenuse}}$',
    cos: '$\\cos\\theta = \\frac{\\text{adjacent}}{\\text{hypotenuse}}$',
    tan: '$\\tan\\theta = \\frac{\\text{opposite}}{\\text{adjacent}}$',
  };
  const FNNAME7 = { sin: 'sine', cos: 'cosine', tan: 'tangent' };
  // the six ways to use sin, cos or tan to go from a known side to a wanted side; up: the unknown is on top of the ratio
  const RT7 = {
    'hyp>opp': { fn: 'sin', up: true }, 'hyp>adj': { fn: 'cos', up: true }, 'adj>opp': { fn: 'tan', up: true },
    'opp>adj': { fn: 'tan', up: false }, 'adj>hyp': { fn: 'cos', up: false }, 'opp>hyp': { fn: 'sin', up: false },
  };
  const RECIP7 = { sin: 'csc', cos: 'sec', tan: 'cot' };
  const vtx7 = function (r) {                                           // names for a right triangle: angle at V, other acute vertex W, right angle at R
    const S = r.pick([['A', 'B', 'C'], ['P', 'Q', 'R'], ['K', 'L', 'M']]), flip = r.rand() < 0.5;
    const V = flip ? S[1] : S[0], W = flip ? S[0] : S[1], R = S[2];
    return { V: V, W: W, R: R, opp: W + R, adj: V + R, hyp: V + W, tri: S.join('') };
  };
  const CTX7 = [
    { g: 'hyp', w: 'opp', unit: 'm', th: [55, 80], gv: [4, 12], half: true, text: function (g, t) { return cap(aan7(g)) + ' ' + g + ' m ladder leans against a vertical wall and makes an angle of $' + deg7(t) + '$ with the level ground. How high up the wall does the ladder reach?'; },
      roles: { hyp: 'the ladder', opp: 'the height reached on the wall', adj: 'the distance from the foot of the ladder to the wall' } },
    { g: 'hyp', w: 'adj', unit: 'm', th: [55, 80], gv: [4, 12], half: true, text: function (g, t) { return cap(aan7(g)) + ' ' + g + ' m ladder leans against a vertical wall and makes an angle of $' + deg7(t) + '$ with the level ground. How far is the foot of the ladder from the wall?'; },
      roles: { hyp: 'the ladder', opp: 'the height reached on the wall', adj: 'the distance from the foot of the ladder to the wall' } },
    { g: 'adj', w: 'opp', unit: 'm', th: [25, 65], gv: [12, 60], half: false, text: function (g, t) { return 'Standing ' + g + ' m from the base of a tower on level ground, you measure the angle of elevation to the top of the tower as $' + deg7(t) + '$. How tall is the tower?'; },
      roles: { hyp: 'the line of sight', opp: 'the height of the tower', adj: 'the distance from you to the base of the tower' } },
    { g: 'opp', w: 'adj', unit: 'ft', th: [20, 60], gv: [30, 120], half: false, text: function (g, t) { return 'A radio tower is ' + g + ' ft tall. From a point on level ground, the angle of elevation to the top of the tower is $' + deg7(t) + '$. How far is the point from the base of the tower?'; },
      roles: { hyp: 'the line of sight', opp: 'the height of the tower', adj: 'the distance from the point to the base of the tower' } },
    { g: 'hyp', w: 'opp', unit: 'ft', th: [5, 20], gv: [8, 30], half: true, text: function (g, t) { return 'A wheelchair ramp is ' + g + ' ft long and makes an angle of $' + deg7(t) + '$ with the ground. How high above the ground does the top of the ramp rise?'; },
      roles: { hyp: 'the ramp', opp: 'the rise of the ramp', adj: 'the horizontal distance covered by the ramp' } },
    { g: 'opp', w: 'hyp', unit: 'ft', th: [40, 70], gv: [15, 60], half: false, text: function (g, t) { return 'A guy wire runs from the top of ' + aan7(g) + ' ' + g + ' ft pole to the ground and makes an angle of $' + deg7(t) + '$ with the ground. How long is the wire?'; },
      roles: { hyp: 'the wire', opp: 'the pole', adj: 'the distance along the ground from the pole to the wire' } },
    { g: 'adj', w: 'opp', unit: 'm', th: [20, 60], gv: [6, 30], half: true, text: function (g, t) { return 'When the Sun is at an angle of elevation of $' + deg7(t) + '$, a tree casts a shadow ' + g + ' m long on level ground. How tall is the tree?'; },
      roles: { hyp: 'the ray of sunlight', opp: 'the height of the tree', adj: 'the shadow' } },
  ];

  reg7('rtside', 5, function (r) {
    let th, g, w, gv, unit, core, roles;
    if (r.rand() < 0.45) {
      const c = r.pick(CTX7);
      th = r.int(c.th[0], c.th[1]); gv = c.half ? r.int(2 * c.gv[0], 2 * c.gv[1]) / 2 : r.int(c.gv[0], c.gv[1]);
      g = c.g; w = c.w; unit = c.unit; roles = c.roles; core = c.text(gv, th);
    } else {
      const combo = r.pick(Object.keys(RT7)), nm = vtx7(r);
      th = r.int(15, 75); g = combo.slice(0, 3); w = combo.slice(4);
      gv = r.rand() < 0.3 ? r.int(7, 59) / 2 : r.int(4, 30); unit = r.pick(['cm', 'm', 'ft', 'in']);
      roles = { hyp: '$' + nm.hyp + '$', opp: '$' + nm.opp + '$', adj: '$' + nm.adj + '$' };
      core = 'In right triangle $' + nm.tri + '$, the right angle is at $' + nm.R + '$. Suppose $\\angle ' + nm.V + ' = ' + deg7(th) + '$ and $' + nm[g] + ' = ' + gv + '$ ' + unit + '. Find the length of $' + nm[w] + '$.';
    }
    if (th % 15 === 0) again();
    const T = RT7[g + '>' + w], fn = T.fn, tv = trig7[fn](th), val = T.up ? gv * tv : gv / tv, ans = rs7(val, 2);
    const F = '\\' + fn + ' ' + deg7(th), eq = F + ' = ' + (T.up ? '\\frac{x}{' + gv + '}' : '\\frac{' + gv + '}{x}');
    const sol = T.up ? gv + F : '\\frac{' + gv + '}{' + F + '}';
    const how = T.up ? ['multiply both sides by ', gv] : ['multiply both sides by ', 'x', ' and divide both sides by ', F];
    const label = 'Relative to the $' + deg7(th) + '$ angle, ' + roles[g] + ' is the ' + ROLE7[g] + ' and ' + roles[w] + ' is the ' + ROLE7[w] + '.';
    const rows = [[F, T.up ? '\\frac{x}{' + gv + '}' : '\\frac{' + gv + '}{x}', 'definition of ' + FNNAME7[fn]], ['x', sol, how],
      ['x', T.up ? gv + ' \\times ' + f4(tv) : '\\frac{' + gv + '}{' + f4(tv) + '}', 'use a calculator in degree mode', '\\approx'], ['x', ans, undefined, '\\approx']];
    return {
      type: 'num', unit: unit, tol: halfUlp(2),
      prompt: core + RND7[2],
      answer: ans,
      hints: [
        'Sketch the right triangle. ' + label,
        'You know the ' + ROLE7[g] + ' and want the ' + ROLE7[w] + ', so use ' + FNNAME7[fn] + ': ' + FNDEF7[fn] + '. With $x$ for the unknown length, $' + eq + '$.',
        'Solve for $x$: ' + (T.up ? 'multiply both sides by $' + gv + '$' : 'multiply both sides by $x$, then divide both sides by $' + F + '$') + '. Use a calculator in degree mode and round only at the end.',
      ],
      solution: 'Let $x$ be the length we want. ' + label + '\n\nThe ratio that connects these two sides is the ' + FNNAME7[fn] + ': ' + FNDEF7[fn] + '.\n\n' + align(rows) + '\n\nSo the length is about $' + ans + '$ ' + unit + '.',
      $m: { kind: 'rtside', theta: th, g: g, w: w, gv: gv },
    };
  });

  const CTXA7 = [
    { g: 'hyp', w: 'opp', ra: [5, 16], rb: [3, 15], ratio: [0.45, 0.95], text: function (a, b) { return cap(aan7(a)) + ' ' + a + ' m ladder reaches ' + b + ' m up a vertical wall. What angle does the ladder make with the level ground?'; }, roles: { hyp: 'the ladder', opp: 'the height reached on the wall' } },
    { g: 'hyp', w: 'adj', ra: [6, 20], rb: [2, 14], ratio: [0.2, 0.7], text: function (a, b) { return 'The foot of ' + aan7(a) + ' ' + a + ' ft ladder is ' + b + ' ft from the base of a vertical wall. What angle does the ladder make with the level ground?'; }, roles: { hyp: 'the ladder', adj: 'the distance from the foot of the ladder to the wall' } },
    { g: 'hyp', w: 'opp', ra: [8, 30], rb: [1, 12], ratio: [0.08, 0.4], text: function (a, b) { return 'A ramp ' + a + ' ft long rises ' + b + ' ft above the ground. What angle does the ramp make with the ground?'; }, roles: { hyp: 'the ramp', opp: 'the rise of the ramp' } },
    { g: 'opp', w: 'adj', ra: [10, 60], rb: [10, 60], ratio: [0.4, 2.2], text: function (a, b) { return 'A tower is ' + a + ' m tall. From a point on level ground ' + b + ' m from its base, what is the angle of elevation to the top of the tower?'; }, roles: { opp: 'the height of the tower', adj: 'the distance from the point to the base' } },
    { g: 'opp', w: 'adj', ra: [5, 40], rb: [40, 200], ratio: [0.05, 0.45], text: function (a, b) { return 'A road climbs ' + a + ' m over a horizontal distance of ' + b + ' m. What angle does the road make with the horizontal?'; }, roles: { opp: 'the climb', adj: 'the horizontal distance' } },
  ];
  reg7('rtang', 4, function (r) {
    let o, a, h, given, core, roles, angName;
    if (r.rand() < 0.5) {
      const c = r.pick(CTXA7), x1 = r.int(c.ra[0], c.ra[1]), x2 = r.int(c.rb[0], c.rb[1]), q = c.g === 'hyp' ? x2 / x1 : x1 / x2;
      if (q < c.ratio[0] || q > c.ratio[1]) again();
      given = [c.g, c.w];
      if (c.g === 'hyp') { h = x1; if (c.w === 'opp') o = x2; else a = x2; } else { o = x1; a = x2; }
      core = c.text(x1, x2); roles = c.roles; angName = '\\theta';
    } else {
      const nm = vtx7(r), kind = r.pick([['opp', 'adj'], ['hyp', 'opp'], ['hyp', 'adj']]);
      given = kind;
      if (kind[0] === 'hyp') {
        h = r.int(6, 25); const leg = r.int(2, h - 1), q = leg / h;
        if (q < 0.2 || q > 0.92) again();
        if (kind[1] === 'opp') o = leg; else a = leg;
      } else { o = r.int(3, 20); a = r.int(3, 20); if (o === a) again(); }
      const vals0 = { opp: o, adj: a, hyp: h };
      roles = { hyp: '$' + nm.hyp + '$', opp: '$' + nm.opp + '$', adj: '$' + nm.adj + '$' };
      core = 'In right triangle $' + nm.tri + '$, the right angle is at $' + nm.R + '$, $' + nm[given[0]] + ' = ' + vals0[given[0]] + '$ and $' + nm[given[1]] + ' = ' + vals0[given[1]] + '$. Find $\\angle ' + nm.V + '$.';
      angName = nm.V;
    }
    const vals = { opp: o, adj: a, hyp: h }, g0 = given[0], g1 = given[1];
    const fn = g0 === 'opp' || g1 === 'opp' ? (g0 === 'hyp' || g1 === 'hyp' ? 'sin' : 'tan') : 'cos';
    const num = fn === 'cos' ? vals.adj : vals.opp, den = fn === 'sin' ? vals.hyp : fn === 'cos' ? vals.hyp : vals.adj;
    const value = inv7[fn](num / den), ans = rs7(value, 1), ratioTex = '\\frac{' + num + '}{' + den + '}';
    const lab = 'Relative to the angle you want, ' + roles[g0] + ' is the ' + ROLE7[g0] + ' and ' + roles[g1] + ' is the ' + ROLE7[g1] + '.';
    const th = angName === '\\theta' ? '\\theta' : angName;
    const rows = [['\\' + fn + ' ' + th, ratioTex, (fn === 'tan' ? 'opposite over adjacent' : fn === 'sin' ? 'opposite over hypotenuse' : 'adjacent over hypotenuse')],
      [th, '\\' + fn + '^{-1}\\left(' + ratioTex + '\\right)', 'use the inverse function'], [th, deg7(ans), 'calculator in degree mode', '\\approx']];
    return {
      type: 'num', unit: '°', tol: halfUlp(1),
      prompt: core + ' Give the angle in degrees.' + RND7[1],
      answer: ans,
      hints: [
        'Sketch the right triangle. ' + lab,
        'Two known sides, ' + (fn === 'tan' ? 'opposite and adjacent' : fn === 'sin' ? 'opposite and hypotenuse' : 'adjacent and hypotenuse') + ', point to ' + FNNAME7[fn] + ': ' + FNDEF7[fn] + '. So $\\' + fn + ' ' + th + ' = ' + ratioTex + '$.',
        'To get the angle from its ' + FNNAME7[fn] + ', use the inverse function $\\' + fn + '^{-1}$ on a calculator in degree mode.',
      ],
      solution: lab + '\n\nThese two sides are connected by the ' + FNNAME7[fn] + ': ' + FNDEF7[fn] + '.\n\n' + align(rows) + '\n\nSo the angle is about $' + ans + '^\\circ$.',
      $m: { kind: 'rtang', opp: o === undefined ? null : o, adj: a === undefined ? null : a, hyp: h === undefined ? null : h },
    };
  });

  reg7('exact', 3, function (r) {
    const th = r.pick([30, 45, 60]), combo = r.pick(Object.keys(RT7)), g = combo.slice(0, 3), w = combo.slice(4), T = RT7[combo], L = r.int(2, 12);
    const nm = vtx7(r), fnName = T.fn, v = exFn(fnName, th), res = sxMul(T.up ? v : exRecip(v), [L, 1]);
    const F = '\\' + fnName + ' ' + deg7(th), label = 'Relative to the $' + deg7(th) + '$ angle, $' + nm[g] + '$ is the ' + ROLE7[g] + ' and $' + nm[w] + '$ is the ' + ROLE7[w] + '.';
    const eq = F + ' = ' + (T.up ? '\\frac{x}{' + L + '}' : '\\frac{' + L + '}{x}');
    const rows = [[F, T.up ? '\\frac{x}{' + L + '}' : '\\frac{' + L + '}{x}', 'definition of ' + FNNAME7[fnName]], [sxTex(v), T.up ? '\\frac{x}{' + L + '}' : '\\frac{' + L + '}{x}', 'exact value from a special triangle']];
    if (T.up) rows.push(['x', L + ' \\cdot ' + par(sxTex(v)), ['multiply both sides by ', L]]);
    else rows.push(['x', L + ' \\cdot ' + sxTex(exRecip(v)), v[2] === 1 ? 'multiply by the reciprocal' : 'multiply by the reciprocal, rationalizing the denominator']);
    rows.push(['x', sxTex(res)]);
    return {
      type: 'num',
      prompt: 'In right triangle $' + nm.tri + '$, the right angle is at $' + nm.R + '$. Suppose $\\angle ' + nm.V + ' = ' + deg7(th) + '$ and $' + nm[g] + ' = ' + L + '$. Find the exact length of $' + nm[w] + '$.',
      answer: sxCalc(res),
      hints: [
        'Sketch the triangle. ' + label,
        'Use ' + FNNAME7[fnName] + ' (' + FNDEF7[fnName] + ') and the exact value $' + F + ' = ' + sxTex(v) + '$ from the special triangle. With $x$ for the unknown length, $' + eq + '$.',
        T.up ? 'Multiply both sides by $' + L + '$ and simplify.' : 'Solve for $x$ (multiply by $x$, then divide by the exact value) and simplify, rationalizing the denominator if there is a radical in it.',
      ],
      solution: label + '\n\nUse the ' + FNNAME7[fnName] + ': ' + FNDEF7[fnName] + '. Since $' + deg7(th) + '$ is a special angle, its exact value is known.\n\n' + align(rows) + '\n\nSo the length is $' + sxTex(res) + '$.',
      $m: { kind: 'exact', theta: th, g: g, w: w, gv: L },
    };
  });

  // F2-07 (continued): law of sines and law of cosines
  const TRI7 = [['A', 'B', 'C', 'a', 'b', 'c'], ['P', 'Q', 'R', 'p', 'q', 'r'], ['K', 'L', 'M', 'k', 'l', 'm']];     // vertices, then the side opposite each
  const f6 = function (v) { return v.toFixed(6); };
  const OPP7 = function (T) { return ' (Side $' + T[3] + '$ is opposite $\\angle ' + T[0] + '$, side $' + T[4] + '$ is opposite $\\angle ' + T[1] + '$, and side $' + T[5] + '$ is opposite $\\angle ' + T[2] + '$.)'; };
  const lenU7 = function (r) { return r.rand() < 0.5 ? r.pick(['cm', 'm', 'ft', 'in']) : null; };
  const withU7 = function (u) { return u ? ' ' + u : ''; };

  reg7('sinside', 4, function (r) {
    const T = r.pick(TRI7), idx = r.shuffle([0, 1, 2]), i = Math.min(idx[0], idx[1]), j = Math.max(idx[0], idx[1]), k = 3 - i - j;
    const angs = [0, 0, 0];
    angs[i] = r.int(25, 85); angs[j] = r.int(25, 85); angs[k] = 180 - angs[i] - angs[j];
    if (angs[k] < 20 || angs[k] > 110) again();
    const gi = r.pick([i, j, k, k]), wi = r.pick([0, 1, 2].filter(function (x) { return x !== gi; }));
    if (angs[gi] === angs[wi]) again();
    const gv = r.int(5, 30), unit = lenU7(r), val = gv * trig7.sin(angs[wi]) / trig7.sin(angs[gi]), ans = rs7(val, 2);
    const needThird = gi === k || wi === k, g = T[3 + gi], w = T[3 + wi], GA = T[gi], WA = T[wi];
    const sg = '\\sin ' + deg7(angs[gi]), sw = '\\sin ' + deg7(angs[wi]);
    const thirdLine = 'The angles of a triangle add up to $180^\\circ$, so $\\angle ' + T[k] + ' = 180^\\circ - ' + deg7(angs[i]) + ' - ' + deg7(angs[j]) + ' = ' + deg7(angs[k]) + '$.';
    const rows = [['\\frac{' + g + '}{\\sin ' + GA + '}', '\\frac{' + w + '}{\\sin ' + WA + '}', 'law of sines'],
      ['\\frac{' + gv + '}{' + sg + '}', '\\frac{' + w + '}{' + sw + '}', 'substitute'],
      [w, '\\frac{' + gv + sw + '}{' + sg + '}', ['multiply both sides by ', sw]],
      [w, '\\frac{' + gv + ' \\times ' + f4(trig7.sin(angs[wi])) + '}{' + f4(trig7.sin(angs[gi])) + '}', 'calculator in degree mode', '\\approx'],
      [w, ans, undefined, '\\approx']];
    const hints = [
      needThird ? thirdLine : 'Match each side with the angle opposite it: side $' + g + '$ is opposite $\\angle ' + GA + ' = ' + deg7(angs[gi]) + '$ and side $' + w + '$ is opposite $\\angle ' + WA + ' = ' + deg7(angs[wi]) + '$.',
      'Use the law of sines, $\\frac{' + g + '}{\\sin ' + GA + '} = \\frac{' + w + '}{\\sin ' + WA + '}$. Here, $\\frac{' + gv + '}{' + sg + '} = \\frac{' + w + '}{' + sw + '}$.',
      'Multiply both sides by $' + sw + '$ to get $' + w + '$ alone, then use a calculator in degree mode. Round only at the end.'];
    const item = {
      type: 'num', tol: halfUlp(2),
      prompt: 'In triangle $' + T.slice(0, 3).join('') + '$, $\\angle ' + T[i] + ' = ' + deg7(angs[i]) + '$ and $\\angle ' + T[j] + ' = ' + deg7(angs[j]) + '$, and $' + g + ' = ' + gv + '$' + withU7(unit) + '. Find $' + w + '$.' + OPP7(T) + RND7[2],
      answer: ans, hints: hints,
      solution: (needThird ? thirdLine + '\n\n' : '') + 'Side $' + g + '$ is opposite $\\angle ' + GA + ' = ' + deg7(angs[gi]) + '$ and side $' + w + '$ is opposite $\\angle ' + WA + ' = ' + deg7(angs[wi]) + '$, so the law of sines applies.\n\n' + align(rows) + '\n\nSo $' + w + ' \\approx ' + ans + '$' + withU7(unit) + '.',
      $m: { kind: 'sinside', angs: angs, gi: gi, wi: wi, gv: gv },
    };
    if (unit) item.unit = unit;
    return item;
  });

  reg7('sinang', 3, function (r) {
    const T = r.pick(TRI7), idx = r.shuffle([0, 1, 2]), i = idx[0], j = idx[1];
    const ai = r.int(8, 30), aj = r.int(4, ai - 1), Ai = r.int(30, 130);
    const q = aj * trig7.sin(Ai) / ai;
    if (q < 0.25 || q > 0.95) again();
    const value = inv7.sin(q), ans = rs7(value, 1), si = T[3 + i], sj = T[3 + j], AI = T[i], BJ = T[j];
    const rows = [['\\frac{\\sin ' + BJ + '}{' + sj + '}', '\\frac{\\sin ' + AI + '}{' + si + '}', 'law of sines'],
      ['\\frac{\\sin ' + BJ + '}{' + aj + '}', '\\frac{\\sin ' + deg7(Ai) + '}{' + ai + '}', 'substitute'],
      ['\\sin ' + BJ, '\\frac{' + aj + '\\sin ' + deg7(Ai) + '}{' + ai + '}', ['multiply both sides by ', aj]],
      ['\\sin ' + BJ, f4(q), 'calculator in degree mode', '\\approx'],
      [BJ, '\\sin^{-1}(' + f4(q) + ')', 'inverse sine'],
      [BJ, deg7(ans), undefined, '\\approx']];
    return {
      type: 'num', unit: '°', tol: halfUlp(1),
      prompt: 'In triangle $' + T.slice(0, 3).join('') + '$, $' + si + ' = ' + ai + '$, $' + sj + ' = ' + aj + '$ and $\\angle ' + AI + ' = ' + deg7(Ai) + '$. Find $\\angle ' + BJ + '$ in degrees.' + OPP7(T) + RND7[1],
      answer: ans,
      hints: [
        'Side $' + si + '$ is opposite $\\angle ' + AI + '$ and side $' + sj + '$ is opposite $\\angle ' + BJ + '$. You know a full pair ($' + si + '$ and $\\angle ' + AI + '$) and one more side, so use the law of sines.',
        'Write $\\frac{\\sin ' + AI + '}{' + si + '} = \\frac{\\sin ' + BJ + '}{' + sj + '}$ and substitute: $\\frac{\\sin ' + deg7(Ai) + '}{' + ai + '} = \\frac{\\sin ' + BJ + '}{' + aj + '}$. Solve for $\\sin ' + BJ + '$.',
        'Take the inverse sine of that value (calculator in degree mode). Since $' + sj + ' < ' + si + '$, angle $' + BJ + '$ is smaller than angle $' + AI + '$, so the acute angle is the one you want.'],
      solution: 'Side $' + si + '$ is opposite $\\angle ' + AI + '$ and side $' + sj + '$ is opposite $\\angle ' + BJ + '$, so the law of sines applies.\n\n' + align(rows) +
        '\n\nThe side opposite $\\angle ' + BJ + '$ is shorter than the side opposite $\\angle ' + AI + '$ ($' + sj + ' = ' + aj + '$ and $' + si + ' = ' + ai + '$), so $\\angle ' + BJ + '$ is the smaller angle. That means it is the acute angle given by the inverse sine, and there is no second possible triangle. So $\\angle ' + BJ + ' \\approx ' + ans + '^\\circ$.',
      $m: { kind: 'sinang', ai: ai, aj: aj, Ai: Ai },
    };
  });

  reg7('cosside', 4, function (r) {
    const T = r.pick(TRI7), i = r.int(0, 2), others = [0, 1, 2].filter(function (x) { return x !== i; });
    const Ai = r.int(20, 150), bj = r.int(3, 20), ck = r.int(3, 20);
    if (Ai === 90) again();
    const a2 = bj * bj + ck * ck - 2 * bj * ck * trig7.cos(Ai), val = Math.sqrt(a2), ans = rs7(val, 2), unit = lenU7(r);
    const si = T[3 + i], sj = T[3 + others[0]], sk = T[3 + others[1]], AI = T[i], cv = trig7.cos(Ai);
    const sum = bj * bj + ck * ck, prod2 = 2 * bj * ck;
    const rows = [[si + '^{2}', sj + '^{2} + ' + sk + '^{2} - 2' + sj + sk + '\\cos ' + AI, 'law of cosines'],
      [si + '^{2}', bj + '^{2} + ' + ck + '^{2} - 2(' + bj + ')(' + ck + ')\\cos ' + deg7(Ai), 'substitute'],
      [si + '^{2}', sum + ' - ' + prod2 + '\\cos ' + deg7(Ai), 'simplify'],
      [si + '^{2}', sum + ' - ' + prod2 + '(' + f6(cv) + ')', 'calculator in degree mode', '\\approx'],
      [si + '^{2}', f4(a2), undefined, '\\approx'],
      [si, '\\sqrt{' + f4(a2) + '}', 'take the square root'],
      [si, ans, undefined, '\\approx']];
    const item = {
      type: 'num', tol: halfUlp(2),
      prompt: 'In triangle $' + T.slice(0, 3).join('') + '$, $' + sj + ' = ' + bj + '$, $' + sk + ' = ' + ck + '$ and $\\angle ' + AI + ' = ' + deg7(Ai) + '$' + (unit ? ' (lengths in ' + unit + ')' : '') + '. Find $' + si + '$.' + OPP7(T) + RND7[2],
      answer: ans,
      hints: [
        'The known angle $\\angle ' + AI + '$ is between the known sides $' + sj + '$ and $' + sk + '$, and the side we want, $' + si + '$, is opposite it. Two sides and the angle between them: use the law of cosines.',
        'The law of cosines says $' + si + '^{2} = ' + sj + '^{2} + ' + sk + '^{2} - 2' + sj + sk + '\\cos ' + AI + '$. Here, $' + si + '^{2} = ' + bj + '^{2} + ' + ck + '^{2} - 2(' + bj + ')(' + ck + ')\\cos ' + deg7(Ai) + '$.',
        'Evaluate the right-hand side with a calculator in degree mode to get $' + si + '^{2}$, then take the square root. Round only at the end.'],
      solution: 'The known angle $\\angle ' + AI + '$ is between the known sides $' + sj + '$ and $' + sk + '$, so use the law of cosines to find the side opposite it.\n\n' + align(rows) + '\n\nSo $' + si + ' \\approx ' + ans + '$' + withU7(unit) + '.',
      $m: { kind: 'cosside', Ai: Ai, bj: bj, ck: ck },
    };
    if (unit) item.unit = unit;
    return item;
  });

  reg7('cosang', 4, function (r) {
    const T = r.pick(TRI7), wi = r.int(0, 2), s = [r.int(4, 20), r.int(4, 20), r.int(4, 20)];
    const u = [0, 1, 2].filter(function (x) { return x !== wi; }), su = s[u[0]], sv = s[u[1]], sw = s[wi];
    if (sw >= su + sv - 1 || sw <= Math.abs(su - sv) + 1) again();
    const num = su * su + sv * sv - sw * sw, den = 2 * su * sv, c = num / den;
    if (Math.abs(c) > 0.92 || Math.abs(c) < 0.03) again();
    const value = inv7.cos(c), ans = rs7(value, 1), W = T[wi], lw = T[3 + wi], lu = T[3 + u[0]], lv = T[3 + u[1]], red = fr(num, den);
    const rows = [[lw + '^{2}', lu + '^{2} + ' + lv + '^{2} - 2' + lu + lv + '\\cos ' + W, 'law of cosines'],
      ['\\cos ' + W, '\\frac{' + lu + '^{2} + ' + lv + '^{2} - ' + lw + '^{2}}{2' + lu + lv + '}', 'solve for the cosine'],
      ['\\cos ' + W, '\\frac{' + su + '^{2} + ' + sv + '^{2} - ' + sw + '^{2}}{2(' + su + ')(' + sv + ')}', 'substitute'],
      ['\\cos ' + W, '\\frac{' + num + '}{' + den + '}', 'simplify']];
    if (red[1] !== den) rows.push(['\\cos ' + W, ftex(red), 'reduce']);
    rows.push([W, '\\cos^{-1}\\left(' + ftex(red) + '\\right)', 'inverse cosine'], [W, deg7(ans), 'calculator in degree mode', '\\approx']);
    return {
      type: 'num', unit: '°', tol: halfUlp(1),
      prompt: 'In triangle $' + T.slice(0, 3).join('') + '$, $' + T[3] + ' = ' + s[0] + '$, $' + T[4] + ' = ' + s[1] + '$ and $' + T[5] + ' = ' + s[2] + '$. Find $\\angle ' + W + '$ in degrees.' + OPP7(T) + RND7[1],
      answer: ans,
      hints: [
        'All three sides are known and you want the angle $\\angle ' + W + '$ opposite side $' + lw + '$. Three sides: use the law of cosines.',
        'Start from $' + lw + '^{2} = ' + lu + '^{2} + ' + lv + '^{2} - 2' + lu + lv + '\\cos ' + W + '$ and solve for the cosine: $\\cos ' + W + ' = \\frac{' + lu + '^{2} + ' + lv + '^{2} - ' + lw + '^{2}}{2' + lu + lv + '}$.',
        'Substitute $' + lu + ' = ' + su + '$, $' + lv + ' = ' + sv + '$ and $' + lw + ' = ' + sw + '$ to get a number, then take $\\cos^{-1}$ with the calculator in degree mode.'],
      solution: 'The angle $\\angle ' + W + '$ is opposite side $' + lw + '$, and all three sides are known, so use the law of cosines.\n\n' + align(rows) + '\n\nSo $\\angle ' + W + ' \\approx ' + ans + '^\\circ$.',
      $m: { kind: 'cosang', sides: s, wi: wi },
    };
  });

  // F2-08 polar coordinates
  const K8 = {}, W8 = [];
  const reg8 = function (name, w, fn) { K8[name] = fn; for (let i = 0; i < w; i++) W8.push(name); };
  G['F2-08'] = function (r) { return K8[r.pick(W8)](r); };
  const ptTex = function (a, b) { return '\\left(' + a + ', ' + b + '\\right)'; };
  const POL8 = ' Give the polar coordinates $(r, \\theta)$ with $r > 0$ and $0 \\le \\theta < 2\\pi$.';
  const sqT8 = function (e) { return (e[2] > 1 || e[0] < 0) ? '(' + sxTex(e) + ')^{2}' : sxTex(e) + '^{2}'; };       // square of an exact coordinate
  const AXNAME8 = { 0: 'positive $x$-axis', 90: 'positive $y$-axis', 180: 'negative $x$-axis', 270: 'negative $y$-axis' };

  reg8('r2pS', 5, function (r) {
    const fam = r.pick(['d45', 'd45', 'd3060', 'd3060', 'axis']);
    let x, y, deg, rv;
    if (fam === 'd45') {
      const c = r.int(1, 6); deg = r.pick([45, 135, 225, 315]);
      x = [(deg === 45 || deg === 315 ? 1 : -1) * c, 1, 1]; y = [(deg === 45 || deg === 135 ? 1 : -1) * c, 1, 1]; rv = [c, 1, 2];
    } else if (fam === 'd3060') {
      const k = r.int(1, 5); deg = r.pick([30, 60, 120, 150, 210, 240, 300, 330]); rv = [2 * k, 1, 1];
      x = sxMul(exTrig('cos', deg), [2 * k, 1]); y = sxMul(exTrig('sin', deg), [2 * k, 1]);
    } else {
      const c = r.int(1, 9); deg = r.pick([0, 90, 180, 270]); rv = [c, 1, 1];
      x = sxMul(exTrig('cos', deg), [c, 1]); y = sxMul(exTrig('sin', deg), [c, 1]);
    }
    const th = radOf(deg), rad1 = x[0] * x[0] * x[2] + y[0] * y[0] * y[2];
    const rChain = [ '\\sqrt{x^{2} + y^{2}}', '\\sqrt{' + sqT8(x) + ' + ' + sqT8(y) + '}', '\\sqrt{' + (x[0] * x[0] * x[2]) + ' + ' + (y[0] * y[0] * y[2]) + '}', '\\sqrt{' + rad1 + '}', sxTex(rv) ];
    const rText = 'Find $r$ with $r = \\sqrt{x^{2} + y^{2}}$.\n\n' + disp(['r'].concat(rChain.slice(1)));
    let angText, h2, h3;
    if (fam === 'axis') {
      angText = 'The point lies on the ' + AXNAME8[deg] + ', so $\\theta = ' + piT(th) + '$.';
      h2 = 'Plot the point: it lies on an axis, so you can read the angle directly.';
      h3 = 'Angles are measured counterclockwise from the positive $x$-axis: $0$ for the positive $x$-axis, then a quarter turn each time you move to the next axis.';
    } else {
      const q = quadOf(deg), ref = refOf(deg), rt = piT(radOf(ref)), tn = exTrig('tan', deg), sg = QUAD_NAME[q];
      angText = 'The point is in quadrant ' + sg + ' ($x$ is ' + (x[0] > 0 ? 'positive' : 'negative') + ' and $y$ is ' + (y[0] > 0 ? 'positive' : 'negative') + '). Since $\\tan\\theta = \\frac{y}{x} = ' + sxTex(tn) + '$, the reference angle is $' + rt + '$ (because $\\tan ' + rt + ' = ' + sxTex(exTrig('tan', ref)) + '$). In quadrant ' + sg + ', $\\theta = ' + (q === 1 ? rt : quadAng6(q, rt) + ' = ' + piT(th)) + '$.';
      h2 = 'Plot the point to see its quadrant, then use $\\tan\\theta = \\frac{y}{x}$ to find the reference angle (the acute angle with the $x$-axis).';
      h3 = 'The point is in quadrant ' + sg + ', so ' + (q === 1 ? '$\\theta$ equals the reference angle $\\alpha$.' : '$\\theta = ' + quadAng6(q, '\\alpha') + '$, where $\\alpha$ is the reference angle.');
    }
    return {
      type: 'tuple',
      prompt: 'Convert the rectangular coordinates $' + ptTex(sxTex(x), sxTex(y)) + '$ to polar coordinates.' + POL8 + ' Give exact values.',
      answer: '(' + sxCalc(rv) + ', ' + piC(th) + ')',
      hints: ['Use $r = \\sqrt{x^{2} + y^{2}}$ with $x = ' + sxTex(x) + '$ and $y = ' + sxTex(y) + '$.', h2, h3],
      solution: rText + '\n\n' + angText + '\n\nSo the polar coordinates are $' + ptTex(sxTex(rv), piT(th)) + '$.',
      $m: { kind: 'r2pS', x: sxVal(x), y: sxVal(y) },
    };
  });

  reg8('r2pN', 3, function (r) {
    const tri = r.pick([[3, 4, 5], [4, 3, 5], [5, 12, 13], [12, 5, 13], [8, 15, 17], [15, 8, 17], [6, 8, 10], [8, 6, 10], [9, 12, 15], [12, 9, 15], [7, 24, 25], [20, 21, 29]]);
    const xs = r.pick([1, -1]), ys = r.pick([1, -1]), x = xs * tri[0], y = ys * tri[1], c = tri[2];
    const q = x > 0 ? (y > 0 ? 1 : 4) : (y > 0 ? 2 : 3), alpha = Math.atan(tri[1] / tri[0]);
    let th = Math.atan2(y, x); if (th < 0) th += 2 * Math.PI;
    const ans = rs7(th, 2), sg = QUAD_NAME[q], form = q === 1 ? 'a' : q === 2 ? '\\pi - a' : q === 3 ? '\\pi + a' : '2\\pi - a';
    const aT = f4(alpha), thTex = q === 1 ? aT : q === 2 ? '\\pi - ' + aT : q === 3 ? '\\pi + ' + aT : '2\\pi - ' + aT;
    return {
      type: 'tuple', tol: '0.005',
      prompt: 'Convert the rectangular coordinates $' + ptTex(x, y) + '$ to polar coordinates.' + POL8 + ' Use radians and round $\\theta$ to two decimal places.',
      answer: '(' + c + ', ' + ans + ')',
      hints: [
        'Use $r = \\sqrt{x^{2} + y^{2}}$ with $x = ' + x + '$ and $y = ' + y + '$.',
        'For the angle, find the reference angle $a = \\tan^{-1}\\left|\\frac{y}{x}\\right| = \\tan^{-1}\\left(\\frac{' + tri[1] + '}{' + tri[0] + '}\\right)$ with the calculator in radian mode. The point is in quadrant ' + sg + '.',
        'In quadrant ' + sg + ', $\\theta = ' + form + '$. Round only at the end.'],
      solution: 'Find $r$ with $r = \\sqrt{x^{2} + y^{2}}$.\n\n' + disp(['r', '\\sqrt{' + pn(x) + '^{2} + ' + pn(y) + '^{2}}', '\\sqrt{' + (x * x) + ' + ' + (y * y) + '}', '\\sqrt{' + (c * c) + '}', c]) +
        '\n\nThe point is in quadrant ' + sg + ' ($x$ is ' + (x > 0 ? 'positive' : 'negative') + ' and $y$ is ' + (y > 0 ? 'positive' : 'negative') + '). The reference angle is\n\n$$a = \\tan^{-1}\\left|\\frac{y}{x}\\right| = \\tan^{-1}\\left(\\frac{' + tri[1] + '}{' + tri[0] + '}\\right) \\approx ' + aT + '$$\n\n' +
        (q === 1 ? 'In quadrant I, $\\theta = a$.' : 'In quadrant ' + sg + ', $\\theta = ' + form + ' = ' + thTex + ' \\approx ' + f4(th) + '$.') + '\n\nSo the polar coordinates are about $' + ptTex(c, ans) + '$.',
      $m: { kind: 'r2pN', x: x, y: y },
    };
  });

  reg8('p2r', 5, function (r) {
    const axisOK = r.rand() < 0.15, pool = SPECIAL_DEGS.filter(function (d) { return (d % 90 === 0) === axisOK; });
    let deg = r.pick(pool); if (r.rand() < 0.12) deg -= 360;
    const rv = r.rand() < 0.2 ? -r.int(1, 8) : r.int(1, 10), inDeg = r.rand() < 0.25;
    const cs = exTrig('cos', deg), sn = exTrig('sin', deg), x = sxMul(cs, [rv, 1]), y = sxMul(sn, [rv, 1]);
    const th = radOf(deg), angTex = inDeg ? degT(deg) : piT(th);
    const FA = function (fn) { return '\\' + fn + (angTex.charAt(0) === '-' ? '\\left(' + angTex + '\\right)' : ' ' + angTex); };
    const bigPar = function (t) { return t.charAt(0) === '-' ? '\\left(' + t + '\\right)' : t; };
    const rc = rv === 1 ? '' : rv === -1 ? '-' : String(rv);
    const line = function (v, fn, e, res) {
      const rows = [[v, rc + FA(fn)]], mid = e[0] === 0 ? '0' : rv === 1 ? sxTex(e) : (rv === -1 ? '-' : rv + ' \\cdot ') + bigPar(sxTex(e));
      if (mid !== sxTex(res) && rv !== 1) rows.push(['', mid]);
      rows.push(['', sxTex(res)]);
      return align(rows);
    };
    return {
      type: 'tuple',
      prompt: 'Convert the polar coordinates $' + ptTex(rv, angTex) + '$ to rectangular coordinates $(x, y)$. Give exact values.',
      answer: '(' + sxCalc(x) + ', ' + sxCalc(y) + ')',
      hints: [
        'Use $x = r\\cos\\theta$ and $y = r\\sin\\theta$ with $r = ' + rv + '$ and $\\theta = ' + angTex + '$.',
        'Use the unit circle to find $' + FA('cos') + '$ and $' + FA('sin') + '$: find the reference angle, then decide the signs from the quadrant' + (deg % 90 === 0 ? ' (this angle lies on an axis).' : '.'),
        'Multiply each of those values by $' + rv + '$' + (rv < 0 ? ' (a negative $r$ just flips both signs).' : '.')],
      solution: 'The rectangular coordinates are $x = r\\cos\\theta$ and $y = r\\sin\\theta$. From the unit circle, $' + FA('cos') + ' = ' + sxTex(cs) + '$ and $' + FA('sin') + ' = ' + sxTex(sn) + '$.\n\n' +
        line('x', 'cos', cs, x) + '\n\n' + line('y', 'sin', sn, y) + '\n\nSo $(x, y) = ' + ptTex(sxTex(x), sxTex(y)) + '$.',
      $m: { kind: 'p2r' },
    };
  });

  reg8('norm', 3, function (r) {
    const r0 = r.nonzero(-9, 9), d = r.pick([2, 3, 4, 6]), n = r.int(-2 * d, 4 * d);
    const t0 = fr(n, d);
    if (n === 0) again();
    const inRange = t0[0] >= 0 && t0[0] < 2 * t0[1];
    if (r0 > 0 && inRange) again();
    const t1 = r0 < 0 ? fadd(t0, [1, 1]) : t0, k = Math.floor(t1[0] / (2 * t1[1])), t2 = fsub(t1, [2 * k, 1]);
    if (!(t2[0] >= 0 && t2[0] < 2 * t2[1])) again();
    const steps = [];
    if (r0 < 0) steps.push('A negative $r$ means the point lies in the direction opposite to the angle, $|r|$ units from the origin. So use $r = ' + (-r0) + '$ and add a half turn to the angle: $' + piT(t0) + ' + \\pi = ' + piT(t1) + '$.');
    if (k !== 0) steps.push('The angle $' + piT(t1) + '$ is not in $[0, 2\\pi)$, so ' + (k > 0 ? 'subtract' : 'add') + ' full turns: $' + piT(t1) + (k > 0 ? ' - ' : ' + ') + (2 * Math.abs(k)) + '\\pi = ' + piT(t2) + '$.');
    const hints = [
      r0 < 0 ? 'A negative $r$ means going the opposite way. Replace $r$ by $' + (-r0) + '$ and change the angle by half a turn ($\\pi$).' : 'The radius is already positive, so only the angle needs fixing. Add or subtract full turns ($2\\pi$) until it lies in $[0, 2\\pi)$.',
      r0 < 0 ? 'Add $\\pi$ to $' + piT(t0) + '$, which gives $' + piT(t1) + '$.' : 'Adding or subtracting $2\\pi$ does not change the point. How many times do you need to do it?',
      k !== 0 ? 'The angle must end up in $[0, 2\\pi)$: ' + (k > 0 ? 'subtract' : 'add') + ' $2\\pi$ as many times as needed.' : 'Check that the new angle lies in $[0, 2\\pi)$.'];
    return {
      type: 'tuple',
      prompt: 'The polar coordinates $' + ptTex(r0, piT(t0)) + '$ name the same point as a pair $(r, \\theta)$ with $r > 0$ and $0 \\le \\theta < 2\\pi$. Find that pair.',
      answer: '(' + Math.abs(r0) + ', ' + piC(t2) + ')',
      hints: hints,
      solution: steps.join('\n\n') + '\n\nSo the point is $' + ptTex(Math.abs(r0), piT(t2)) + '$.',
      $m: { kind: 'norm' },
    };
  });

  // F2-09 vectors and components
  const K9 = {}, W9 = [];
  const reg9 = function (name, w, fn) { K9[name] = fn; for (let i = 0; i < w; i++) W9.push(name); };
  G['F2-09'] = function (r) { return K9[r.pick(W9)](r); };
  const vecT = function (a, b) { return '\\langle ' + a + ', ' + b + ' \\rangle'; };
  const ENTER9 = ' Enter your answer as an ordered pair `(x, y)`.';
  const PYTH9 = [[3, 4, 5], [5, 12, 13], [8, 15, 17], [7, 24, 25], [20, 21, 29]];
  const CTX9 = [
    { th: [15, 75], m: [20, 90], text: function (m, t) { return 'A force of ' + m + ' N acts on an object at an angle of $' + deg7(t) + '$ above the horizontal. Find the horizontal and vertical components of the force, in newtons.'; } },
    { th: [20, 70], m: [10, 30], text: function (m, t) { return 'A soccer ball is kicked with a speed of ' + m + ' m/s at an angle of $' + deg7(t) + '$ above the ground. Find the horizontal and vertical components of its initial velocity, in m/s.'; } },
    { th: [15, 60], m: [15, 80], text: function (m, t) { return 'A child pulls a sled with a rope that makes an angle of $' + deg7(t) + '$ with the horizontal. The tension in the rope is ' + m + ' N. Find the horizontal and vertical components of this force, in newtons.'; } },
    { th: [8, 35], m: [150, 400], text: function (m, t) { return 'A plane climbs at ' + m + ' mph along a straight path at $' + deg7(t) + '$ above the horizontal. Find the horizontal and vertical components of its velocity, in mph.'; } },
  ];

  reg9('comp', 5, function (r) {
    let m, t, core, tail, ctx = false;
    if (r.rand() < 0.5) {
      const c = r.pick(CTX9); ctx = true;
      t = r.int(c.th[0], c.th[1]); m = r.int(c.m[0], c.m[1]); core = c.text(m, t); tail = ' Enter your answer as `(horizontal, vertical)`.';
    } else {
      t = r.int(5, 355); m = r.rand() < 0.3 ? r.int(11, 79) / 2 : r.int(4, 40);
      core = 'A vector $\\mathbf{v}$ has magnitude $\\lVert \\mathbf{v} \\rVert = ' + m + '$ and direction angle $' + deg7(t) + '$, measured counterclockwise from the positive $x$-axis. Find the components $\\langle v_x, v_y \\rangle$ of $\\mathbf{v}$.';
      tail = ENTER9;
    }
    if (t % 15 === 0) again();
    const cv = trig7.cos(t), sv = trig7.sin(t), vx = m * cv, vy = m * sv;
    if (Math.abs(vx) < 0.5 || Math.abs(vy) < 0.5) again();
    const ax = rs7(vx, 2), ay = rs7(vy, 2), nm = ctx ? ['x', 'y'] : ['v_x', 'v_y'];
    const row = function (v, fn, tv, val, ans) {
      return [[nm[v], m + '\\' + fn + ' ' + deg7(t), ctx ? (v === 0 ? 'horizontal: adjacent side' : 'vertical: opposite side') : 'magnitude times ' + (fn === 'cos' ? 'cosine' : 'sine')],
        [nm[v], m + ' \\times ' + (tv < 0 ? '(' + f4(tv) + ')' : f4(tv)), 'calculator in degree mode', '\\approx'], [nm[v], ans, undefined, '\\approx']];
    };
    return {
      type: 'tuple', tol: halfUlp(2),
      prompt: core + ' Round each component to two decimal places.' + tail,
      answer: '(' + ax + ', ' + ay + ')',
      hints: [
        'Draw the vector as the hypotenuse of a right triangle whose legs are its horizontal and vertical components. The horizontal component is the side adjacent to the angle and the vertical component is the opposite side.',
        'So the horizontal component is $' + m + '\\cos ' + deg7(t) + '$ and the vertical component is $' + m + '\\sin ' + deg7(t) + '$.',
        'Evaluate both with a calculator in degree mode and round only at the end.' + (ctx ? '' : ' (The calculator takes care of the signs.)')],
      solution: 'A vector of magnitude $' + m + '$ at angle $' + deg7(t) + '$ has horizontal component $' + m + '\\cos ' + deg7(t) + '$ and vertical component $' + m + '\\sin ' + deg7(t) + '$.\n\n' +
        align(row(0, 'cos', cv, vx, ax)) + '\n\n' + align(row(1, 'sin', sv, vy, ay)) + '\n\nSo the components are $' + vecT(ax, ay) + '$.',
      $m: { kind: 'comp', m: m, deg: t },
    };
  });

  reg9('compEx', 3, function (r) {
    const axisOK = r.rand() < 0.1, deg = r.pick(SPECIAL_DEGS.filter(function (d) { return (d % 90 === 0) === axisOK; })), m = r.int(2, 12), inRad = r.rand() < 0.4;
    const cs = exTrig('cos', deg), sn = exTrig('sin', deg), x = sxMul(cs, [m, 1]), y = sxMul(sn, [m, 1]);
    const ang = inRad ? piT(radOf(deg)) : degT(deg);
    const line = function (v, fn, e, res) {
      const rows = [[v, m + '\\' + fn + ' ' + ang]], mid = e[0] === 0 ? '0' : m + ' \\cdot ' + (sxTex(e).charAt(0) === '-' ? '\\left(' + sxTex(e) + '\\right)' : sxTex(e));
      if (mid !== sxTex(res)) rows.push(['', mid]);
      rows.push(['', sxTex(res)]);
      return align(rows);
    };
    return {
      type: 'tuple',
      prompt: 'A vector $\\mathbf{v}$ has magnitude $\\lVert \\mathbf{v} \\rVert = ' + m + '$ and direction angle $' + ang + '$, measured counterclockwise from the positive $x$-axis. Find the components $\\langle v_x, v_y \\rangle$ of $\\mathbf{v}$. Give exact values.' + ENTER9,
      answer: '(' + sxCalc(x) + ', ' + sxCalc(y) + ')',
      hints: [
        'The components of a vector with magnitude $m$ and direction angle $\\theta$ are $v_x = m\\cos\\theta$ and $v_y = m\\sin\\theta$.',
        'Here $m = ' + m + '$ and $\\theta = ' + ang + '$. Use the unit circle for the exact values of $\\cos ' + ang + '$ and $\\sin ' + ang + '$' + (deg % 90 === 0 ? ' (the angle lies on an axis).' : ' (reference angle, then signs by quadrant).'),
        'Multiply each exact value by $' + m + '$ and simplify.'],
      solution: 'The components are $v_x = m\\cos\\theta$ and $v_y = m\\sin\\theta$. From the unit circle, $\\cos ' + ang + ' = ' + sxTex(cs) + '$ and $\\sin ' + ang + ' = ' + sxTex(sn) + '$.\n\n' + line('v_x', 'cos', cs, x) + '\n\n' + line('v_y', 'sin', sn, y) + '\n\nSo $\\mathbf{v} = ' + vecT(sxTex(x), sxTex(y)) + '$.',
      $m: { kind: 'compEx', m: m, deg: deg },
    };
  });

  reg9('mag', 4, function (r) {
    const useTriple = r.rand() < 0.5, fromPts = r.rand() < 0.4;
    let a, b;
    if (useTriple) { const t = r.pick(PYTH9), k = t[2] > 20 ? 1 : r.int(1, 2); a = r.sign() * t[0] * k; b = r.sign() * t[1] * k; if (r.rand() < 0.5) { const tmp = a; a = b; b = tmp; } }
    else { a = r.nonzero(-9, 9); b = r.nonzero(-9, 9); if (Math.abs(a) === Math.abs(b) && r.rand() < 0.7) again(); }
    const rad = a * a + b * b, sp = rootSplit(rad, 2), exact = sp.t === 1 ? String(sp.s) : radT(sp.s, sp.t);
    let core, P, Q;
    if (fromPts) {
      P = [r.int(-6, 6), r.int(-6, 6)]; Q = [P[0] + a, P[1] + b];
      core = 'Find the magnitude of the vector from $P(' + P[0] + ', ' + P[1] + ')$ to $Q(' + Q[0] + ', ' + Q[1] + ')$.';
    } else core = 'Find the magnitude of the vector $\\mathbf{v} = ' + vecT(a, b) + '$.';
    const comps = fromPts ? 'The vector has components $' + vecT(Q[0] + ' - ' + par(P[0]), Q[1] + ' - ' + par(P[1])) + ' = ' + vecT(a, b) + '$.\n\n' : '';
    const chain = ['\\lVert \\mathbf{v} \\rVert', '\\sqrt{' + pn(a) + '^{2} + ' + pn(b) + '^{2}}', '\\sqrt{' + (a * a) + ' + ' + (b * b) + '}', '\\sqrt{' + rad + '}'].concat(sp.s > 1 || sp.t === 1 ? [exact] : []);
    return {
      type: 'num',
      prompt: core + (sp.t === 1 ? '' : ' Give an exact answer in simplest radical form.'),
      answer: sp.t === 1 ? String(sp.s) : radC(sp.s, sp.t),
      hints: [
        fromPts ? 'First find the components of the vector: subtract the coordinates of $P$ from those of $Q$.' : 'The magnitude of $\\langle a, b \\rangle$ is $\\sqrt{a^{2} + b^{2}}$ (the Pythagorean theorem).',
        fromPts ? 'The components are $' + vecT(a, b) + '$. The magnitude of $\\langle a, b \\rangle$ is $\\sqrt{a^{2} + b^{2}}$.' : 'Here $a = ' + a + '$ and $b = ' + b + '$, so the magnitude is $\\sqrt{' + pn(a) + '^{2} + ' + pn(b) + '^{2}}$.',
        sp.t === 1 ? 'Add the squares under the root, then take the square root.' : 'Add the squares under the root and simplify the radical by pulling out the largest perfect square.'],
      solution: comps + 'The magnitude of $\\langle a, b \\rangle$ is $\\sqrt{a^{2} + b^{2}}$.\n\n' + disp(chain) + '\n\nSo the magnitude is $' + exact + '$.',
      $m: { kind: 'mag', a: a, b: b, P: P || null, Q: Q || null },
    };
  });

  reg9('unit', 2, function (r) {
    const t = r.pick(PYTH9), k = t[2] > 20 ? 1 : r.int(1, 2); let a = r.sign() * t[0] * k, b = r.sign() * t[1] * k;
    if (r.rand() < 0.5) { const tmp = a; a = b; b = tmp; }
    const h = t[2] * k, fa = fr(a, h), fb = fr(b, h);
    return {
      type: 'tuple',
      prompt: 'Find the unit vector in the same direction as $\\mathbf{v} = ' + vecT(a, b) + '$.' + ENTER9,
      answer: '(' + fcalc(fa) + ', ' + fcalc(fb) + ')',
      hints: [
        'A unit vector in the direction of $\\mathbf{v}$ is $\\frac{\\mathbf{v}}{\\lVert \\mathbf{v} \\rVert}$. First find the magnitude $\\lVert \\mathbf{v} \\rVert = \\sqrt{a^{2} + b^{2}}$.',
        'Here $\\lVert \\mathbf{v} \\rVert = \\sqrt{' + pn(a) + '^{2} + ' + pn(b) + '^{2}} = \\sqrt{' + (a * a + b * b) + '} = ' + h + '$.',
        'Divide each component of $\\mathbf{v}$ by ' + h + ' and reduce the fractions.'],
      solution: 'First find the magnitude.\n\n' + disp(['\\lVert \\mathbf{v} \\rVert', '\\sqrt{' + pn(a) + '^{2} + ' + pn(b) + '^{2}}', '\\sqrt{' + (a * a + b * b) + '}', h]) + '\n\nDivide each component by the magnitude.\n\n' + disp(['\\frac{\\mathbf{v}}{\\lVert \\mathbf{v} \\rVert}', '\\left\\langle \\frac{' + a + '}{' + h + '}, \\frac{' + b + '}{' + h + '} \\right\\rangle', '\\left\\langle ' + ftex(fa) + ', ' + ftex(fb) + ' \\right\\rangle']) + '\n\nSo the unit vector is $\\left\\langle ' + ftex(fa) + ', ' + ftex(fb) + ' \\right\\rangle$.',
      $m: { kind: 'unit', a: a, b: b },
    };
  });

  reg9('dir', 3, function (r) {
    const a = r.nonzero(-12, 12), b = r.nonzero(-12, 12);
    if (Math.abs(a) === Math.abs(b)) again();
    const alpha = Math.atan(Math.abs(b) / Math.abs(a)) * 180 / Math.PI, q = a > 0 ? (b > 0 ? 1 : 4) : (b > 0 ? 2 : 3);
    const theta = q === 1 ? alpha : q === 2 ? 180 - alpha : q === 3 ? 180 + alpha : 360 - alpha, ans = rs7(theta, 1);
    const form = q === 1 ? 'a' : q === 2 ? '180^\\circ - a' : q === 3 ? '180^\\circ + a' : '360^\\circ - a', sg = QUAD_NAME[q];
    const aT = alpha.toFixed(4), thTex = q === 1 ? aT + '^\\circ' : q === 2 ? '180^\\circ - ' + aT + '^\\circ' : q === 3 ? '180^\\circ + ' + aT + '^\\circ' : '360^\\circ - ' + aT + '^\\circ';
    return {
      type: 'num', unit: '°', tol: halfUlp(1),
      prompt: 'Find the direction angle $\\theta$ of the vector $\\mathbf{v} = ' + vecT(a, b) + '$, measured counterclockwise from the positive $x$-axis, with $0^\\circ \\le \\theta < 360^\\circ$. Round to the nearest tenth of a degree.',
      answer: ans,
      hints: [
        'Sketch the vector to see which quadrant it points into: the $x$-component is ' + (a > 0 ? 'positive' : 'negative') + ' and the $y$-component is ' + (b > 0 ? 'positive' : 'negative') + '.',
        'Find the reference angle $a = \\tan^{-1}\\left|\\frac{b}{a}\\right| = \\tan^{-1}\\left(\\frac{' + Math.abs(b) + '}{' + Math.abs(a) + '}\\right)$ with the calculator in degree mode.',
        'The vector is in quadrant ' + sg + ', so $\\theta = ' + form + '$.'],
      solution: 'The vector $' + vecT(a, b) + '$ has a ' + (a > 0 ? 'positive' : 'negative') + ' $x$-component and a ' + (b > 0 ? 'positive' : 'negative') + ' $y$-component, so it points into quadrant ' + sg + '.\n\nThe reference angle is\n\n$$a = \\tan^{-1}\\left|\\frac{b}{a}\\right| = \\tan^{-1}\\left(\\frac{' + Math.abs(b) + '}{' + Math.abs(a) + '}\\right) \\approx ' + aT + '^\\circ$$\n\n' +
        (q === 1 ? 'In quadrant I, $\\theta = a \\approx ' + ans + '^\\circ$.' : 'In quadrant ' + sg + ', $\\theta = ' + form + ' = ' + thTex + ' \\approx ' + ans + '^\\circ$.'),
      $m: { kind: 'dir', a: a, b: b },
    };
  });

  const OPS9 = [[1, 1], [1, -1], [2, 1], [1, 2], [2, -1], [3, -2], [2, 3], [-1, 2], [3, 1], [-2, 1], [4, -1], [2, -3], [-3, 2]];
  reg9('sum', 5, function (r) {
    const u = [r.nonzero(-6, 6), r.nonzero(-6, 6)], v = [r.nonzero(-6, 6), r.nonzero(-6, 6)], op = r.pick(OPS9), cu = op[0], cv = op[1], ij = r.rand() < 0.4;
    if (u[0] === v[0] && u[1] === v[1]) again();
    const A = [cu * u[0], cu * u[1]], B = [cv * v[0], cv * v[1]], res = [A[0] + B[0], A[1] + B[1]];
    const vt = function (c) { return ij ? terms([[c[0], '\\mathbf{i}'], [c[1], '\\mathbf{j}']]).tex : vecT(c[0], c[1]); };
    const expr = terms([[cu, '\\mathbf{u}'], [cv, '\\mathbf{v}']]).tex, lines = [];
    if (Math.abs(cu) !== 1 || cu < 0) lines.push('$' + (cu === -1 ? '-\\mathbf{u}' : cu + '\\mathbf{u}') + ' = ' + vecT(A[0], A[1]) + '$');
    if (Math.abs(cv) !== 1 || cv < 0) lines.push('$' + (cv === -1 ? '-\\mathbf{v}' : cv + '\\mathbf{v}') + ' = ' + vecT(B[0], B[1]) + '$');
    const sumLine = vecT(A[0] + ' + ' + par(B[0]), A[1] + ' + ' + par(B[1]));
    return {
      type: 'tuple',
      prompt: 'Let $\\mathbf{u} = ' + vt(u) + '$ and $\\mathbf{v} = ' + vt(v) + '$. Find $' + expr + '$ and write the result in component form.' + ENTER9,
      answer: '(' + res[0] + ', ' + res[1] + ')',
      hints: [
        'Add and multiply vectors component by component: for a number $c$, $c\\langle a, b \\rangle = \\langle ca, cb \\rangle$, and $\\langle a, b \\rangle + \\langle c, d \\rangle = \\langle a + c, b + d \\rangle$.',
        lines.length ? 'First do the scalar multiples: ' + lines.join(' and ') + '.' : 'Write each vector in component form $\\langle x, y \\rangle$' + (ij ? ' (the coefficient of $\\mathbf{i}$ is $x$ and the coefficient of $\\mathbf{j}$ is $y$)' : '') + ', then add the matching components.',
        'Add the $x$-components together, and add the $y$-components together.'],
      solution: (ij ? 'In component form, $\\mathbf{u} = ' + vecT(u[0], u[1]) + '$ and $\\mathbf{v} = ' + vecT(v[0], v[1]) + '$.\n\n' : '') + (lines.length ? 'Do the scalar multiples first: ' + lines.join(' and ') + '.\n\n' : '') +
        'Then add the matching components.\n\n' + disp([expr, sumLine, vecT(res[0], res[1])]) + '\n\nSo $' + expr + ' = ' + vecT(res[0], res[1]) + '$.',
      $m: { kind: 'sum', u: u, v: v, cu: cu, cv: cv },
    };
  });

  reg9('word', 3, function (r) {
    const t = r.pick(PYTH9), k = t[2] > 20 ? r.int(1, 4) : r.int(1, 10), p = t[0] * k, q = t[1] * k, h = t[2] * k, sw = r.rand() < 0.5;
    const a = sw ? q : p, b = sw ? p : q, ctx = r.pick([
      { u: 'mph', text: 'A plane flies due east at an airspeed of ' + a + ' mph while a wind blows due north at ' + b + ' mph. What is the plane\'s speed relative to the ground, in mph?', na: 'the plane\'s velocity (east)', nb: 'the wind\'s velocity (north)' },
      { u: 'm/s', text: 'A boat heads due east across a river at ' + a + ' m/s while the current flows due north at ' + b + ' m/s. What is the speed of the boat relative to the ground, in m/s?', na: 'the boat\'s velocity (east)', nb: 'the current\'s velocity (north)' },
      { u: 'N', text: 'Two forces act on an object at a right angle to each other: one of ' + a + ' N and one of ' + b + ' N. What is the magnitude of the resultant force, in newtons?', na: 'the first force', nb: 'the second force' },
      { u: 'km', text: 'A hiker walks ' + a + ' km due east and then ' + b + ' km due north. How far is the hiker from the starting point, in kilometres?', na: 'the eastward walk', nb: 'the northward walk' },
    ]);
    return {
      type: 'num',
      prompt: ctx.text,
      answer: String(h),
      hints: [
        'Draw the two vectors at right angles, tail to head. ' + cap(ctx.na) + ' and ' + ctx.nb + ' are the two legs of a right triangle, and the resultant is the hypotenuse.',
        'The magnitude of the resultant is $\\sqrt{' + a + '^{2} + ' + b + '^{2}}$.',
        'Compute the squares, add them, and take the square root.'],
      solution: 'The two vectors are perpendicular, so they form the legs of a right triangle and the resultant is its hypotenuse. By the Pythagorean theorem:\n\n' + disp(['\\sqrt{' + a + '^{2} + ' + b + '^{2}}', '\\sqrt{' + (a * a) + ' + ' + (b * b) + '}', '\\sqrt{' + (h * h) + '}', h]) + '\n\nSo the answer is ' + h + ' ' + ctx.u + '.',
      $m: { kind: 'word', a: a, b: b },
    };
  });

  // F2-10 dot products
  const K10 = {}, W10 = [];
  const reg10 = function (name, w, fn) { K10[name] = fn; for (let i = 0; i < w; i++) W10.push(name); };
  G['F2-10'] = function (r) { return K10[r.pick(W10)](r); };
  const ENTER10 = ' Enter your answer as an ordered pair `(x, y)`.';
  const vecN = function (c) { return '\\langle ' + c.join(', ') + ' \\rangle'; };
  const ijk10 = function (c) { return terms(c.map(function (x, i) { return [x, ['\\mathbf{i}', '\\mathbf{j}', '\\mathbf{k}'][i]]; })).tex; };
  const dotOf = function (a, b) { return a.reduce(function (s, x, i) { return s + x * b[i]; }, 0); };
  const prodsTex = function (a, b) { return a.map(function (x, i) { return pn(x) + ' \\cdot ' + pn(b[i]); }).join(' + '); };
  const sumTex = function (p) { return p.map(function (x, i) { return i === 0 ? String(x) : pn(x); }).join(' + '); };
  const sqSum = function (a) { return a.map(function (x) { return pn(x) + '^{2}'; }).join(' + '); };
  const magT = function (a) { const n = a.reduce(function (s, x) { return s + x * x; }, 0), sp = rootSplit(n, 2); return { n: n, tex: sp.t === 1 ? String(sp.s) : '\\sqrt{' + n + '}' }; };
  const PYV10 = [[3, 4], [5, 12], [8, 15], [4, 3], [12, 5], [15, 8], [1, 2, 2], [2, 3, 6], [2, 6, 9], [1, 4, 8], [4, 4, 7], [2, 1, 2], [6, 2, 3], [9, 6, 2]];
  const signed10 = function (r, base) { let v = base.map(function (x) { return r.sign() * x; }); if (base.length === 3 && r.rand() < 0.5) v = [v[1], v[2], v[0]]; return v; };

  reg10('dot', 4, function (r) {
    const n = r.rand() < 0.4 ? 3 : 2, ij = r.rand() < 0.4, u = [], v = [];
    for (let i = 0; i < n; i++) { u.push(r.nonzero(-6, 6)); v.push(r.nonzero(-6, 6)); }
    const p = u.map(function (x, i) { return x * v[i]; }), d = dotOf(u, v), form = ij ? ijk10 : vecN;
    return {
      type: 'num',
      prompt: 'Find the dot product $\\mathbf{u} \\cdot \\mathbf{v}$ for $\\mathbf{u} = ' + form(u) + '$ and $\\mathbf{v} = ' + form(v) + '$.',
      answer: String(d),
      hints: [
        'The dot product multiplies matching components and then adds the results: $\\langle a, b' + (n === 3 ? ', c' : '') + ' \\rangle \\cdot \\langle d, e' + (n === 3 ? ', f' : '') + ' \\rangle = ad + be' + (n === 3 ? ' + cf' : '') + '$.',
        'Here the products are ' + u.map(function (x, i) { return '$' + pn(x) + ' \\cdot ' + pn(v[i]) + '$'; }).join(', ') + '.',
        'Add the ' + n + ' products. Watch the signs of the negative numbers.'],
      solution: (ij ? 'In component form, $\\mathbf{u} = ' + vecN(u) + '$ and $\\mathbf{v} = ' + vecN(v) + '$.\n\n' : '') + 'Multiply the matching components and add.\n\n' + disp(['\\mathbf{u} \\cdot \\mathbf{v}', prodsTex(u, v), sumTex(p), d]) + '\n\nSo $\\mathbf{u} \\cdot \\mathbf{v} = ' + d + '$.',
      $m: { kind: 'dot', u: u, v: v },
    };
  });

  reg10('dotmag', 2, function (r) {
    const m1 = r.int(2, 12), m2 = r.int(2, 12), exact = r.rand() < 0.7;
    if (m1 === m2 && r.rand() < 0.5) again();
    const deg = exact ? r.pick([30, 45, 60, 90, 120, 135, 150]) : r.int(10, 170);
    if (!exact && deg % 15 === 0) again();
    const c = trig7.cos(deg), prod = m1 * m2;
    let item;
    const core = 'The vectors $\\mathbf{u}$ and $\\mathbf{v}$ have magnitudes $\\lVert \\mathbf{u} \\rVert = ' + m1 + '$ and $\\lVert \\mathbf{v} \\rVert = ' + m2 + '$, and the angle between them is $' + deg7(deg) + '$. Find $\\mathbf{u} \\cdot \\mathbf{v}$.';
    const hints = ['Use $\\mathbf{u} \\cdot \\mathbf{v} = \\lVert \\mathbf{u} \\rVert \\, \\lVert \\mathbf{v} \\rVert \\cos\\theta$, where $\\theta$ is the angle between the vectors.', 'Here $\\lVert \\mathbf{u} \\rVert \\, \\lVert \\mathbf{v} \\rVert = ' + m1 + ' \\cdot ' + m2 + ' = ' + prod + '$ and $\\theta = ' + deg7(deg) + '$.'];
    if (exact) {
      const e = sxMul(exTrig('cos', deg), [prod, 1]), cv = exTrig('cos', deg);
      item = {
        type: 'num', prompt: core + ' Give an exact answer.', answer: sxCalc(e),
        hints: hints.concat(['Find the exact value of $\\cos ' + deg7(deg) + '$ from the unit circle, then multiply by $' + prod + '$.']),
        solution: 'Use $\\mathbf{u} \\cdot \\mathbf{v} = \\lVert \\mathbf{u} \\rVert \\, \\lVert \\mathbf{v} \\rVert \\cos\\theta$.\n\n' + disp(['\\mathbf{u} \\cdot \\mathbf{v}', m1 + ' \\cdot ' + m2 + ' \\cdot \\cos ' + deg7(deg), prod + ' \\cdot ' + (cv[0] < 0 ? '\\left(' + sxTex(cv) + '\\right)' : sxTex(cv)), sxTex(e)]) + '\n\nSo $\\mathbf{u} \\cdot \\mathbf{v} = ' + sxTex(e) + '$.',
        $m: { kind: 'dotmag', m1: m1, m2: m2, deg: deg },
      };
    } else {
      const val = prod * c, ans = rs7(val, 2);
      if (Math.abs(val) < 0.5) again();
      item = {
        type: 'num', tol: halfUlp(2), prompt: core + RND7[2], answer: ans,
        hints: hints.concat(['Evaluate $\\cos ' + deg7(deg) + '$ with a calculator in degree mode and multiply by $' + prod + '$. Round only at the end.']),
        solution: 'Use $\\mathbf{u} \\cdot \\mathbf{v} = \\lVert \\mathbf{u} \\rVert \\, \\lVert \\mathbf{v} \\rVert \\cos\\theta$.\n\n' + align([['\\mathbf{u} \\cdot \\mathbf{v}', m1 + ' \\cdot ' + m2 + ' \\cdot \\cos ' + deg7(deg)], ['', prod + ' \\cdot ' + (c < 0 ? '(' + f4(c) + ')' : f4(c)), 'calculator in degree mode', '\\approx'], ['', ans, undefined, '\\approx']]) + '\n\nSo $\\mathbf{u} \\cdot \\mathbf{v} \\approx ' + ans + '$.',
        $m: { kind: 'dotmag', m1: m1, m2: m2, deg: deg },
      };
    }
    return item;
  });

  reg10('angle', 4, function (r) {
    const n = r.rand() < 0.35 ? 3 : 2, u = [], v = [];
    for (let i = 0; i < n; i++) { u.push(r.nonzero(-6, 6)); v.push(r.nonzero(-6, 6)); }
    const d = dotOf(u, v), mu = u.reduce(function (s, x) { return s + x * x; }, 0), mv = v.reduce(function (s, x) { return s + x * x; }, 0);
    if (d === 0) again();
    const c = d / Math.sqrt(mu * mv);
    if (Math.abs(c) > 0.97) again();
    const theta = Math.acos(c) * 180 / Math.PI, ans = rs7(theta, 1), p = u.map(function (x, i) { return x * v[i]; });
    const rows = [['\\cos\\theta', '\\frac{\\mathbf{u} \\cdot \\mathbf{v}}{\\lVert \\mathbf{u} \\rVert \\, \\lVert \\mathbf{v} \\rVert}', 'angle between two vectors'],
      ['', '\\frac{' + d + '}{\\sqrt{' + mu + '} \\, \\sqrt{' + mv + '}}', 'substitute'], ['', f4(c), 'calculator', '\\approx'],
      ['\\theta', '\\cos^{-1}(' + f4(c) + ')', 'inverse cosine'], ['', deg7(ans), 'calculator in degree mode', '\\approx']];
    return {
      type: 'num', unit: '°', tol: halfUlp(1),
      prompt: 'Find the angle $\\theta$ between the vectors $\\mathbf{u} = ' + vecN(u) + '$ and $\\mathbf{v} = ' + vecN(v) + '$, in degrees.' + RND7[1],
      answer: ans,
      hints: [
        'The angle between two vectors satisfies $\\cos\\theta = \\frac{\\mathbf{u} \\cdot \\mathbf{v}}{\\lVert \\mathbf{u} \\rVert \\, \\lVert \\mathbf{v} \\rVert}$. You need the dot product and both magnitudes.',
        'The dot product is $\\mathbf{u} \\cdot \\mathbf{v} = ' + sumTex(p) + ' = ' + d + '$, and the magnitudes are $\\lVert \\mathbf{u} \\rVert = \\sqrt{' + mu + '}$ and $\\lVert \\mathbf{v} \\rVert = \\sqrt{' + mv + '}$.',
        'So $\\cos\\theta = \\frac{' + d + '}{\\sqrt{' + mu + '} \\, \\sqrt{' + mv + '}}$. Evaluate it and take $\\cos^{-1}$ with the calculator in degree mode.'],
      solution: 'First compute the dot product and the two magnitudes.\n\n' + disp(['\\mathbf{u} \\cdot \\mathbf{v}', prodsTex(u, v), sumTex(p), d]) + '\n\n$$\\lVert \\mathbf{u} \\rVert = \\sqrt{' + sqSum(u) + '} = \\sqrt{' + mu + '}, \\qquad \\lVert \\mathbf{v} \\rVert = \\sqrt{' + sqSum(v) + '} = \\sqrt{' + mv + '}$$\n\nNow use the angle formula.\n\n' + align(rows) + '\n\nSo the angle is about $' + ans + '^\\circ$.',
      $m: { kind: 'angle', u: u, v: v },
    };
  });

  reg10('perp', 2, function (r) {
    const c = r.pick([1, 2, 3, 4, 5]), d = r.nonzero(-6, 6), b = r.nonzero(-6, 6), first = r.rand() < 0.5;
    const k = first ? fr(-b * d, c) : fr(-b * c, d), kT = ftex(k);
    const u = first ? ['k', String(b)] : [String(b), 'k'], v = [c, d];                       // u = <k, b> or <b, k>, v = <c, d>
    const kc = first ? c : d, rest = first ? b * d : b * c, eqL = terms([[kc, 'k'], [rest, '']]).tex;
    const kt = function (x) { return x === 1 ? 'k' : 'k \\cdot ' + pn(x); };
    const dotL = first ? kt(c) + ' + ' + pn(b) + ' \\cdot ' + pn(d) : pn(b) + ' \\cdot ' + pn(c) + ' + ' + kt(d);
    const fin = [[eqL, 0], [terms([[kc, 'k']]).tex, -rest, elimN(rest, '')]];
    if (kc !== 1) fin.push(['k', kT, ['divide both sides by ', kc]]); else fin[1][1] = kT, fin[1][0] = 'k';
    return {
      type: 'num',
      prompt: 'Find the value of $k$ for which the vectors $\\mathbf{u} = ' + vecN(u) + '$ and $\\mathbf{v} = ' + vecN(v) + '$ are perpendicular.' + (k[1] === 1 ? '' : ' Give your answer as a fraction.'),
      answer: fcalc(k),
      hints: [
        'Two vectors are perpendicular exactly when their dot product is $0$.',
        'Write the dot product: $\\mathbf{u} \\cdot \\mathbf{v} = ' + eqL + '$. Set it equal to $0$.',
        'Solve the linear equation $' + eqL + ' = 0$ for $k$.'],
      solution: 'Two vectors are perpendicular exactly when their dot product is $0$.\n\n' + align([['\\mathbf{u} \\cdot \\mathbf{v}', dotL], ['', eqL], ['', 0, 'perpendicular vectors have dot product zero']]) + '\n\nSolve for $k$:\n\n' + align(fin) + '\n\nSo $k = ' + kT + '$.',
      $m: { kind: 'perp', first: first, b: b, c: c, d: d },
    };
  });

  reg10('proj', 4, function (r) {
    const v = signed10(r, r.pick(PYV10)), n = v.length, u = [];
    for (let i = 0; i < n; i++) u.push(r.nonzero(-6, 6));
    const d = dotOf(u, v), h = Math.round(Math.sqrt(v.reduce(function (s, x) { return s + x * x; }, 0)));
    if (d === 0) again();
    const res = fr(d, h), p = u.map(function (x, i) { return x * v[i]; });
    return {
      type: 'num',
      prompt: 'Find the scalar projection of $\\mathbf{u} = ' + vecN(u) + '$ onto $\\mathbf{v} = ' + vecN(v) + '$, that is, $\\text{comp}_{\\mathbf{v}}\\,\\mathbf{u}$.' + (res[1] === 1 ? '' : ' Give your answer as a fraction.'),
      answer: fcalc(res),
      hints: [
        'The scalar projection of $\\mathbf{u}$ onto $\\mathbf{v}$ is $\\frac{\\mathbf{u} \\cdot \\mathbf{v}}{\\lVert \\mathbf{v} \\rVert}$. Note that the magnitude in the denominator is the one of the vector you project onto.',
        'The dot product is $\\mathbf{u} \\cdot \\mathbf{v} = ' + sumTex(p) + ' = ' + d + '$ and $\\lVert \\mathbf{v} \\rVert = \\sqrt{' + sqSum(v) + '}$.',
        'Evaluate $\\lVert \\mathbf{v} \\rVert$ (it is a whole number) and divide.'],
      solution: 'The scalar projection of $\\mathbf{u}$ onto $\\mathbf{v}$ is $\\frac{\\mathbf{u} \\cdot \\mathbf{v}}{\\lVert \\mathbf{v} \\rVert}$.\n\n' + disp(['\\mathbf{u} \\cdot \\mathbf{v}', prodsTex(u, v), sumTex(p), d]) + '\n\n' + disp(['\\lVert \\mathbf{v} \\rVert', '\\sqrt{' + sqSum(v) + '}', '\\sqrt{' + (h * h) + '}', h]) + '\n\n' + disp(['\\text{comp}_{\\mathbf{v}}\\,\\mathbf{u}', '\\frac{' + d + '}{' + h + '}', ftex(res)]) + '\n\nSo the scalar projection is $' + ftex(res) + '$.',
      $m: { kind: 'proj', u: u, v: v },
    };
  });

  reg10('vproj', 2, function (r) {
    const v = [r.nonzero(-4, 4), r.nonzero(-4, 4)], u = [r.nonzero(-6, 6), r.nonzero(-6, 6)];
    const d = dotOf(u, v), vv = dotOf(v, v);
    if (d === 0) again();
    const sc = fr(d, vv), res = v.map(function (x) { return fmul(sc, [x, 1]); }), p = u.map(function (x, i) { return x * v[i]; });
    return {
      type: 'tuple',
      prompt: 'Find the vector projection of $\\mathbf{u} = ' + vecN(u) + '$ onto $\\mathbf{v} = ' + vecN(v) + '$, written in components.' + ENTER10,
      answer: '(' + fcalc(res[0]) + ', ' + fcalc(res[1]) + ')',
      hints: [
        'The vector projection of $\\mathbf{u}$ onto $\\mathbf{v}$ is $\\frac{\\mathbf{u} \\cdot \\mathbf{v}}{\\mathbf{v} \\cdot \\mathbf{v}}\\,\\mathbf{v}$.',
        'Compute $\\mathbf{u} \\cdot \\mathbf{v} = ' + sumTex(p) + ' = ' + d + '$ and $\\mathbf{v} \\cdot \\mathbf{v} = ' + sumTex(v.map(function (x) { return x * x; })) + ' = ' + vv + '$.',
        'Form the fraction $\\frac{' + d + '}{' + vv + '}$, reduce it, and multiply each component of $\\mathbf{v}$ by it.'],
      solution: 'The vector projection of $\\mathbf{u}$ onto $\\mathbf{v}$ is $\\frac{\\mathbf{u} \\cdot \\mathbf{v}}{\\mathbf{v} \\cdot \\mathbf{v}}\\,\\mathbf{v}$.\n\n$$\\mathbf{u} \\cdot \\mathbf{v} = ' + sumTex(p) + ' = ' + d + ', \\qquad \\mathbf{v} \\cdot \\mathbf{v} = ' + sumTex(v.map(function (x) { return x * x; })) + ' = ' + vv + '$$\n\n' +
        disp(['\\frac{\\mathbf{u} \\cdot \\mathbf{v}}{\\mathbf{v} \\cdot \\mathbf{v}}\\,\\mathbf{v}', '\\frac{' + d + '}{' + vv + '}' + vecN(v), '\\left\\langle ' + ftex(res[0]) + ', ' + ftex(res[1]) + ' \\right\\rangle']) + '\n\nSo the vector projection is $\\left\\langle ' + ftex(res[0]) + ', ' + ftex(res[1]) + ' \\right\\rangle$.',
      $m: { kind: 'vproj', u: u, v: v },
    };
  });

  // F2-11 complex plane: modulus, argument, products and quotients, polar form
  const K11 = {}, W11 = [];
  const reg11 = function (name, w, fn) { K11[name] = fn; for (let i = 0; i < w; i++) W11.push(name); };
  G['F2-11'] = function (r) { return K11[r.pick(W11)](r); };

  const cx11 = function (a, b) { return terms([[a, ''], [b, 'i']]); };                  // a + bi with integer or fraction parts -> { tex, calc }
  const sxTimes11 = function (a, b) {                                                    // exact product of two (n/d)sqrt(k) numbers
    if (a[0] === 0 || b[0] === 0) return [0, 1, 1];
    const sp = rootSplit(a[2] * b[2], 2);
    return sx(a[0] * b[0] * sp.s, a[1] * b[1], sp.t);
  };
  const sxAbs11 = function (e) { return [Math.abs(e[0]), e[1], e[2]]; };
  const cxS11 = function (re, im) {                                                      // a + bi with exact (n/d)sqrt(k) parts -> { tex, calc }
    let tex = '', calc = '';
    if (re[0] !== 0) { tex = sxTex(re); calc = sxCalc(re); }
    if (im[0] !== 0) {
      const neg = im[0] < 0, a = sxAbs11(im), unit = a[0] === 1 && a[1] === 1 && a[2] === 1;
      let ct = unit ? '' : sxTex(a);
      const cc = unit ? '' : (a[1] === 1 ? sxCalc(a) : '(' + sxCalc(a) + ')');
      if (!unit && a[1] === 1 && a[2] > 1) ct += '\\,';
      tex += (tex === '' ? (neg ? '-' : '') : (neg ? ' - ' : ' + ')) + ct + 'i';
      calc += (calc === '' ? (neg ? '-' : '') : (neg ? '-' : '+')) + cc + 'i';
    }
    return { tex: tex || '0', calc: calc || '0' };
  };
  const prin11 = function (deg) { const t = nmod(deg + 180, 360) - 180; return t === -180 ? 180 : t; };       // principal argument in degrees, (-180, 180]
  const prinNum11 = function (q, a) { return q === 1 ? a : q === 2 ? '\\pi - ' + a : q === 3 ? a + ' - \\pi' : '-' + a; };   // principal argument from the reference angle
  const eExp11 = function (deg) {                                                        // exponent of e^{i theta}: 2i\pi/3
    const f = radOf(deg), n = f[0], d = f[1], a = Math.abs(n);
    return (n < 0 ? '-' : '') + (a === 1 ? '' : a) + 'i\\pi' + (d === 1 ? '' : '/' + d);
  };
  const cisTex11 = function (rTex, f) {                                                  // r(cos t + i sin t) for t = f * pi, f = [n, d]
    const t = piT(f), a = f[0] < 0 ? '\\left(' + t + '\\right)' : t;
    return rTex + '\\left(\\cos ' + a + ' + i\\sin ' + a + '\\right)';
  };
  const TRI11 = [[3, 4], [5, 12], [8, 15], [7, 24], [6, 8], [9, 12], [20, 21], [12, 16], [15, 20], [10, 24]];
  const ARGNOTE11 = ' Give an exact answer in radians.';
  const PRINDEF11 = ', that is, the angle $\\theta$ with $-\\pi < \\theta \\le \\pi$.';

  reg11('mod', 4, function (r) {
    let a, b;
    if (r.rand() < 0.45) {
      const t = r.pick(TRI11);
      a = r.sign() * t[0]; b = r.sign() * t[1];
      if (r.rand() < 0.5) { const s = a; a = b; b = s; }
    } else { a = r.nonzero(-6, 6); b = r.nonzero(-6, 6); }
    const N = a * a + b * b, sp = rootSplit(N, 2), perfect = sp.t === 1;
    const ans = perfect ? String(sp.s) : radC(sp.s, sp.t), ansT = perfect ? String(sp.s) : radT(sp.s, sp.t, 2);
    const zT = cx11(a, b).tex;
    const chain = ['\\left|z\\right|', '\\sqrt{' + pn(a) + '^{2} + ' + pn(b) + '^{2}}', '\\sqrt{' + (a * a) + ' + ' + (b * b) + '}', '\\sqrt{' + N + '}'];
    if (!perfect && sp.s > 1) chain.push('\\sqrt{' + (sp.s * sp.s) + ' \\cdot ' + sp.t + '}');
    chain.push(ansT);
    return {
      type: 'num',
      prompt: 'Find the modulus $\\left|z\\right|$ of $z = ' + zT + '$.' + (perfect ? '' : ' Give an exact answer in simplest radical form.'),
      answer: ans,
      hints: [
        'The modulus of $z = a + bi$ is its distance from the origin in the complex plane, that is, from the origin to the point $(a, b)$: $\\left|z\\right| = \\sqrt{a^{2} + b^{2}}$.',
        'Here $a = ' + a + '$ and $b = ' + b + '$, so $\\left|z\\right| = \\sqrt{' + pn(a) + '^{2} + ' + pn(b) + '^{2}}$.',
        perfect ? 'Square both numbers and add them. The sum is a perfect square, so the modulus is a whole number.'
          : 'Square both numbers and add them. Then check whether the number under the root has a perfect-square factor that can be pulled out of the root.'],
      solution: 'The modulus is the distance from the origin to the point $(' + a + ', ' + b + ')$, so it is given by the Pythagorean theorem.\n\n' + disp(chain) + '\n\nSo $\\left|' + zT + '\\right| = ' + ansT + '$.',
      $m: { kind: 'mod', a: a, b: b },
    };
  });

  reg11('modprod', 1, function (r) {
    const i1 = r.int(0, 3), i2 = r.int(0, 3);
    if (i1 === i2) again();
    const t1 = TRI11[i1], t2 = TRI11[i2], h1 = Math.round(Math.hypot(t1[0], t1[1])), h2 = Math.round(Math.hypot(t2[0], t2[1]));
    const quot = r.rand() < 0.4;
    if (quot && h1 % h2 === 0) again();
    const mk = function (t) { let a = r.sign() * t[0], b = r.sign() * t[1]; if (r.rand() < 0.5) { const s = a; a = b; b = s; } return [a, b]; };
    const z = mk(t1), w = mk(t2), zT = cx11(z[0], z[1]).tex, wT = cx11(w[0], w[1]).tex;
    const res = quot ? fr(h1, h2) : [h1 * h2, 1];
    const expr = quot ? '\\left|\\frac{' + zT + '}{' + wT + '}\\right|' : '\\left|(' + zT + ')(' + wT + ')\\right|';
    const one = function (t, h, a, b, tx) { return '\\left|' + tx + '\\right| = \\sqrt{' + pn(a) + '^{2} + ' + pn(b) + '^{2}} = \\sqrt{' + h * h + '} = ' + h; };
    return {
      type: 'num',
      prompt: 'Find $' + expr + '$.',
      answer: fcalc(res),
      hints: [
        'The modulus of ' + (quot ? 'a quotient is the quotient of the moduli' : 'a product is the product of the moduli') + ': $' + (quot ? '\\left|\\frac{z}{w}\\right| = \\frac{\\left|z\\right|}{\\left|w\\right|}' : '\\left|zw\\right| = \\left|z\\right|\\,\\left|w\\right|') + '$. You do not need to ' + (quot ? 'divide' : 'multiply') + ' the complex numbers first.',
        'Find the two moduli separately: $\\left|' + zT + '\\right| = \\sqrt{' + pn(z[0]) + '^{2} + ' + pn(z[1]) + '^{2}}$ and $\\left|' + wT + '\\right| = \\sqrt{' + pn(w[0]) + '^{2} + ' + pn(w[1]) + '^{2}}$.',
        'Both moduli are whole numbers. ' + (quot ? 'Divide them and reduce the fraction.' : 'Multiply them.')],
      solution: (quot ? 'The modulus of a quotient is the quotient of the moduli, $\\left|\\frac{z}{w}\\right| = \\frac{\\left|z\\right|}{\\left|w\\right|}$.' : 'The modulus of a product is the product of the moduli, $\\left|zw\\right| = \\left|z\\right|\\,\\left|w\\right|$.') +
        '\n\nFind each modulus:\n\n$$' + one(t1, h1, z[0], z[1], zT) + ', \\qquad ' + one(t2, h2, w[0], w[1], wT) + '$$\n\n' +
        disp([expr, quot ? '\\frac{' + h1 + '}{' + h2 + '}' : h1 + ' \\cdot ' + h2, ftex(res)]) + '\n\nSo the value is $' + ftex(res) + '$.',
      $m: { kind: 'modprod', quot: quot },
    };
  });

  const AXN11 = { 180: 'negative real axis', 90: 'positive imaginary axis', '-90': 'negative imaginary axis' };
  reg11('arg', 4, function (r) {
    const fam = r.pick(['d45', 'd45', 'd3060', 'd3060', 'axis']);
    let re, im, deg;
    if (fam === 'd45') {
      const c = r.int(1, 5); deg = r.pick([45, 135, -135, -45]);
      re = [(Math.abs(deg) < 90 ? 1 : -1) * c, 1, 1]; im = [(deg > 0 ? 1 : -1) * c, 1, 1];
    } else if (fam === 'd3060') {
      const k = r.int(1, 4); deg = r.pick([30, 60, 120, 150, -150, -120, -60, -30]);
      re = sxMul(exTrig('cos', deg), [2 * k, 1]); im = sxMul(exTrig('sin', deg), [2 * k, 1]);
    } else {
      const c = r.int(2, 9); deg = r.pick([180, 90, -90]);
      re = deg === 180 ? [-c, 1, 1] : [0, 1, 1]; im = deg === 90 ? [c, 1, 1] : deg === -90 ? [-c, 1, 1] : [0, 1, 1];
    }
    const th = radOf(deg), zT = cxS11(re, im).tex;
    let hints, sol;
    if (fam === 'axis') {
      hints = [
        'Plot $z$ in the complex plane (real part on the horizontal axis, imaginary part on the vertical axis). It lies on an axis.',
        'The argument is the angle measured counterclockwise from the positive real axis to the ray through $z$. A quarter turn is $\\frac{\\pi}{2}$ and a half turn is $\\pi$; a clockwise turn counts as negative.',
        'The principal argument must lie in $(-\\pi, \\pi]$: use $\\pi$ (not $-\\pi$) for a half turn, and write three quarters of a turn counterclockwise as a negative quarter turn.'];
      sol = 'The number $z = ' + zT + '$ lies on the ' + AXN11[deg] + ' of the complex plane. The angle from the positive real axis to that ray, kept in $(-\\pi, \\pi]$, is ' + (deg === 180 ? 'a half turn, $\\pi$' : deg === 90 ? 'a quarter turn counterclockwise, $\\frac{\\pi}{2}$' : 'a quarter turn clockwise, $-\\frac{\\pi}{2}$ (not $\\frac{3\\pi}{2}$, which is outside the interval)') + '.';
    } else {
      const q = quadOf(deg), ref = refOf(deg), al = piT(radOf(ref)), tn = exTrig('tan', ref), aRe = sxAbs11(re), aIm = sxAbs11(im);
      const signs = 'the real part $' + sxTex(re) + '$ is ' + (re[0] > 0 ? 'positive' : 'negative') + ' and the imaginary part $' + sxTex(im) + '$ is ' + (im[0] > 0 ? 'positive' : 'negative');
      hints = [
        'Plot $z$ as the point $(a, b)$ with $a = ' + sxTex(re) + '$ and $b = ' + sxTex(im) + '$. Which quadrant is it in?',
        'The reference angle $\\alpha$ is the acute angle with $\\tan\\alpha = \\frac{\\left|b\\right|}{\\left|a\\right|} = \\frac{' + sxTex(aIm) + '}{' + sxTex(aRe) + '}$. Simplify this ratio and recognise the angle from the unit circle.',
        'The principal argument lies in $(-\\pi, \\pi]$: it is $\\alpha$ in quadrant I, $\\pi - \\alpha$ in quadrant II, $\\alpha - \\pi$ in quadrant III and $-\\alpha$ in quadrant IV. Use the formula for your quadrant.'];
      sol = 'Plot $z$ as the point $(' + sxTex(re) + ', ' + sxTex(im) + ')$: ' + signs + ', so it lies in quadrant ' + QUAD_NAME[q] + '.\n\nThe reference angle $\\alpha$ satisfies\n\n' +
        disp(['\\tan\\alpha', '\\frac{\\left|b\\right|}{\\left|a\\right|}', '\\frac{' + sxTex(aIm) + '}{' + sxTex(aRe) + '}', sxTex(tn)]) + '\n\nso $\\alpha = ' + al + '$. In quadrant ' + QUAD_NAME[q] + ' the principal argument is\n\n' +
        disp(['\\theta', prinNum11(q, '\\alpha'), prinNum11(q, al), piT(th)]);
    }
    return {
      type: 'num',
      prompt: 'Find the principal argument $\\arg z$ of $z = ' + zT + '$' + PRINDEF11 + ARGNOTE11,
      answer: piC(th),
      hints: hints,
      solution: sol + '\n\nSo $\\arg z = ' + piT(th) + '$.',
      $m: { kind: 'arg', re: sxVal(re), im: sxVal(im) },
    };
  });

  reg11('argApprox', 2, function (r) {
    const a = r.nonzero(-9, 9), b = r.nonzero(-9, 9);
    if (Math.abs(a) === Math.abs(b)) again();
    const q = a > 0 ? (b > 0 ? 1 : 4) : (b > 0 ? 2 : 3);
    const alpha = Math.atan(Math.abs(b) / Math.abs(a)), ans = rs7(Math.atan2(b, a), 2);
    const a4 = f4(alpha), A4 = Number(a4), P4 = Number(f4(Math.PI));
    const th4 = (q === 1 ? A4 : q === 2 ? P4 - A4 : q === 3 ? A4 - P4 : -A4).toFixed(4);
    const zT = cx11(a, b).tex;
    const rows = [['\\alpha', '\\tan^{-1}\\left(\\frac{' + Math.abs(b) + '}{' + Math.abs(a) + '}\\right)', 'reference angle'], ['', a4, 'calculator in radian mode', '\\approx']];
    if (q !== 1) {
      rows.push(['\\theta', prinNum11(q, '\\alpha'), 'quadrant ' + QUAD_NAME[q]]);
      rows.push(['', prinNum11(q, a4), undefined, '\\approx'], ['', th4, ['use ', '\\pi \\approx 3.1416'], '\\approx']);
    }
    rows.push(['\\theta', ans, 'rounded to two decimal places', '\\approx']);
    return {
      type: 'num', tol: halfUlp(2),
      prompt: 'Find the principal argument $\\arg z$ of $z = ' + zT + '$ in radians' + PRINDEF11 + RND7[2],
      answer: ans,
      hints: [
        'Plot $z$ as the point $(' + a + ', ' + b + ')$. It lies in quadrant ' + QUAD_NAME[q] + '. Find the reference angle $\\alpha = \\tan^{-1}\\left(\\frac{\\left|b\\right|}{\\left|a\\right|}\\right)$, the acute angle between the ray and the real axis.',
        'Use a calculator in radian mode: $\\alpha = \\tan^{-1}\\left(\\frac{' + Math.abs(b) + '}{' + Math.abs(a) + '}\\right)$.',
        'In quadrant ' + QUAD_NAME[q] + ' the principal argument is $' + prinNum11(q, '\\alpha') + '$ (the formulas are $\\alpha$, $\\pi - \\alpha$, $\\alpha - \\pi$ and $-\\alpha$ for quadrants I to IV). Round only at the end.'],
      solution: 'Plot $z$ as the point $(' + a + ', ' + b + ')$, which is in quadrant ' + QUAD_NAME[q] + '. Find the reference angle first, then adjust for the quadrant so that the result lies in $(-\\pi, \\pi]$.\n\n' + align(rows) + '\n\nSo $\\arg z \\approx ' + ans + '$.',
      $m: { kind: 'argApprox', a: a, b: b },
    };
  });

  // (a + bi)(c + di) worked out term by term
  const mulSteps11 = function (a, b, c, d) {
    const re = a * c - b * d, im = a * d + b * c;
    return {
      re: re, im: im,
      expand: terms([[a * c, ''], [a * d, 'i'], [b * c, 'i'], [b * d, 'i^{2}']]).tex,
      replace: terms([[a * c, ''], [a * d, 'i'], [b * c, 'i'], [-b * d, '']]).tex,
      fin: cx11(re, im).tex,
    };
  };
  const iTerm11 = function (b) { return terms([[b, 'i']]).tex; };                         // bi, i, -i

  reg11('mul', 3, function (r) {
    const sub = r.pick(['plain', 'plain', 'sq', 'conj']);
    let a = r.nonzero(-5, 5), b = r.nonzero(-5, 5), c, d, expr, head, hints, intro, st, pre;
    const aT = cx11(a, b).tex;
    if (sub === 'sq') {
      if (Math.abs(a) === Math.abs(b)) again();
      const re = a * a - b * b, im = 2 * a * b, bI = iTerm11(b);
      st = {
        re: re, im: im, fin: cx11(re, im).tex,
        expand: terms([[a * a, ''], [2 * a * b, 'i'], [b * b, 'i^{2}']]).tex,
        replace: terms([[a * a, ''], [2 * a * b, 'i'], [-b * b, '']]).tex,
      };
      expr = '\\left(' + aT + '\\right)^{2}';
      pre = [expr];
      head = 'Compute $' + expr + '$ and write the result in the form $a + bi$.';
      intro = 'Squaring means multiplying the bracket by itself, so expand with $(x + y)^{2} = x^{2} + 2xy + y^{2}$, taking $x = ' + a + '$ and $y = ' + bI + '$, then replace $i^{2}$ by $-1$.';
      hints = [
        'Squaring means multiplying the bracket by itself. Use $(x + y)^{2} = x^{2} + 2xy + y^{2}$ with $x = ' + a + '$ and $y = ' + bI + '$, keeping $i$ as a symbol.',
        'The middle term is $2xy = 2 \\cdot ' + pn(a) + ' \\cdot (' + bI + ')$ and the last term is $y^{2} = (' + bI + ')^{2} = ' + terms([[b * b, 'i^{2}']]).tex + '$. Remember that $i^{2} = -1$.',
        'Add the three terms: collect the real numbers together and the multiples of $i$ together.'];
    } else {
      c = r.nonzero(-5, 5); d = r.nonzero(-5, 5);
      const dd = sub === 'conj' ? -d : d;                                  // the second factor really multiplied
      st = mulSteps11(a, b, c, dd);
      if (a === c && b === dd) again();
      const wT = cx11(c, d).tex, wf = cx11(c, dd).tex, bI = iTerm11(b), dI = iTerm11(dd);
      const prods = [pn(a) + ' \\cdot ' + pn(c), pn(a) + ' \\cdot (' + dI + ')', '(' + bI + ') \\cdot ' + pn(c), '(' + bI + ') \\cdot (' + dI + ')'];
      if (sub === 'conj') {
        expr = 'z\\overline{w}';
        pre = [expr, '(' + aT + ')(' + wf + ')'];
        head = 'Compute $z\\overline{w}$ for $z = ' + aT + '$ and $w = ' + wT + '$, and write the result in the form $a + bi$.';
        intro = 'The conjugate of $w = ' + wT + '$ is $\\overline{w} = ' + wf + '$ (only the sign of the imaginary part changes), so $z\\overline{w} = (' + aT + ')(' + wf + ')$. Multiply term by term (FOIL), then replace $i^{2}$ by $-1$.';
        hints = [
          'The complex conjugate of $c + di$ is $c - di$: only the sign of the imaginary part changes. Here $\\overline{w} = ' + wf + '$.',
          'Multiply $z\\overline{w} = (' + aT + ')(' + wf + ')$ term by term (FOIL), keeping $i$ as a symbol. The four products are $' + prods.join('$, $') + '$.',
          'The last product contains $i \\cdot i = i^{2} = -1$: here $(' + bI + ') \\cdot (' + dI + ') = ' + terms([[b * dd, 'i^{2}']]).tex + ' = ' + (-b * dd) + '$. Then collect the real numbers and the multiples of $i$.'];
      } else {
        expr = '(' + aT + ')(' + wT + ')';
        pre = [expr];
        head = 'Multiply and write the result in the form $a + bi$: $' + expr + '$.';
        intro = 'Multiply term by term (FOIL), then replace $i^{2}$ by $-1$.';
        hints = [
          'Multiply each term of the first bracket by each term of the second (FOIL), keeping $i$ as a symbol. The four products are $' + prods.join('$, $') + '$.',
          'The last product contains $i \\cdot i = i^{2} = -1$: here $(' + bI + ') \\cdot (' + dI + ') = ' + terms([[b * d, 'i^{2}']]).tex + ' = ' + (-b * d) + '$.',
          'Add the four results: collect the real numbers together and the multiples of $i$ together.'];
      }
    }
    if (st.re === 0 || st.im === 0) again();
    return {
      type: 'num',
      prompt: head,
      answer: cx11(st.re, st.im).calc,
      hints: hints,
      solution: intro + '\n\n' + disp(pre.concat([st.expand, st.replace, st.fin])) + '\n\nSo the result is $' + st.fin + '$.',
      $m: { kind: 'mul', sub: sub, a: a, b: b, c: c, d: d },
    };
  });

  reg11('div', 3, function (r) {
    const c = r.nonzero(-4, 4), d = r.nonzero(-4, 4), N = c * c + d * d;
    let a, b;
    if (r.rand() < 0.4) {
      const e = r.int(-3, 3), f = r.nonzero(-3, 3);
      a = e * c - f * d; b = e * d + f * c;                                  // z = (e + fi)(c + di), so the quotient is a Gaussian integer
    } else {
      if (N > 13) again();
      a = r.nonzero(-6, 6); b = r.nonzero(-6, 6);
    }
    const nr = a * c + b * d, ni = b * c - a * d;
    const re = fr(nr, N), im = fr(ni, N), res = terms([[re, ''], [im, 'i']]);
    const zT = cx11(a, b).tex, wT = cx11(c, d).tex, wb = cx11(c, -d).tex, hasFrac = re[1] > 1 || im[1] > 1;
    const expr = '\\frac{' + zT + '}{' + wT + '}';
    const numChain = [ '(' + zT + ')(' + wb + ')', terms([[a * c, ''], [-a * d, 'i'], [b * c, 'i'], [-b * d, 'i^{2}']]).tex, terms([[a * c, ''], [-a * d, 'i'], [b * c, 'i'], [b * d, '']]).tex, cx11(nr, ni).tex ];
    return {
      type: 'num',
      prompt: 'Write $' + expr + '$ in the form $a + bi$.' + (hasFrac ? ' Use fractions for $a$ and $b$ where needed.' : ''),
      answer: res.calc,
      hints: [
        'To divide complex numbers, multiply the numerator and the denominator by the conjugate of the denominator. The conjugate of $' + wT + '$ is $' + wb + '$.',
        'The new denominator is $(' + wT + ')(' + wb + ') = ' + pn(c) + '^{2} + ' + pn(d) + '^{2}$, a real number (a complex number times its conjugate is $c^{2} + d^{2}$). Work it out.',
        'Expand the new numerator $(' + zT + ')(' + wb + ')$ with FOIL, using $i^{2} = -1$. Then divide the real part and the imaginary part by the denominator and simplify the fractions.'],
      solution: 'Multiply the numerator and the denominator by the conjugate of the denominator, $' + wb + '$. This makes the denominator a real number.\n\n$$' + expr + ' = \\frac{(' + zT + ')(' + wb + ')}{(' + wT + ')(' + wb + ')}$$\n\n' +
        'Numerator:\n\n' + disp(numChain) + '\n\nDenominator:\n\n' + disp(['(' + wT + ')(' + wb + ')', pn(c) + '^{2} + ' + pn(d) + '^{2}', (c * c) + ' + ' + (d * d), N]) +
        '\n\nNow divide each part by ' + N + ':\n\n' + disp([expr, '\\frac{' + cx11(nr, ni).tex + '}{' + N + '}', res.tex]) + '\n\nSo the quotient is $' + res.tex + '$.',
      $m: { kind: 'div', a: a, b: b, c: c, d: d },
    };
  });

  const timesCx11 = function (rT, c) {                                                    // r * (a + bi); no brackets around a single term
    const t = c.tex;
    if (/ [+-] /.test(t)) return rT + '\\left(' + t + '\\right)';
    if (t === 'i') return rT + (/\}$/.test(rT) ? '\\,' : '') + 'i';
    return rT + ' \\cdot ' + (t.charAt(0) === '-' ? '\\left(' + t + '\\right)' : t);
  };
  const parL11 = function (t) { return String(t).charAt(0) === '-' ? '\\left(' + t + '\\right)' : String(t); };
  const trigArg11 = function (f) { const t = piT(f); return f[0] < 0 ? '\\left(' + t + '\\right)' : t; };       // argument of cos / sin, bracketed when negative

  reg11('p2r', 3, function (r) {
    const fam = r.pick(['f60', 'f60', 'f45a', 'f45b']);
    let rv, deg0;
    if (fam === 'f60') { rv = [r.int(2, 6), 1, 1]; deg0 = r.pick([30, 60, 120, 150, 210, 240, 300, 330]); }
    else if (fam === 'f45a') { rv = [r.int(1, 5), 1, 2]; deg0 = r.pick([45, 135, 225, 315]); }
    else { rv = [2 * r.int(1, 4), 1, 1]; deg0 = r.pick([45, 135, 225, 315]); }
    const deg = deg0 > 180 && r.rand() < 0.4 ? deg0 - 360 : deg0, f = radOf(deg), euler = r.rand() < 0.35;
    const co = exTrig('cos', deg), si = exTrig('sin', deg), re = sxTimes11(rv, co), im = sxTimes11(rv, si), rT = sxTex(rv);
    const zT = euler ? rT + 'e^{' + eExp11(deg) + '}' : cisTex11(rT, f), q = quadOf(deg), al = piT(radOf(refOf(deg))), out = cxS11(re, im);
    return {
      type: 'num',
      prompt: 'Write $z = ' + zT + '$ in the form $a + bi$. Give exact values.',
      answer: out.calc,
      hints: [
        (euler ? 'Euler\'s formula says $re^{i\\theta} = r\\left(\\cos\\theta + i\\sin\\theta\\right)$. ' : '') + 'In polar form the real part is $a = r\\cos\\theta$ and the imaginary part is $b = r\\sin\\theta$. Here $r = ' + rT + '$ and $\\theta = ' + piT(f) + '$.',
        'Find the exact values of $\\cos\\theta$ and $\\sin\\theta$ from the unit circle. The reference angle is $' + al + '$, and in quadrant ' + QUAD_NAME[q] + ' cosine is ' + (co[0] > 0 ? 'positive' : 'negative') + ' and sine is ' + (si[0] > 0 ? 'positive' : 'negative') + '.',
        'Multiply both values by $r = ' + rT + '$ to get $a$ and $b$, then write $z = a + bi$.'],
      solution: (euler ? 'The number $z = ' + rT + 'e^{' + eExp11(deg) + '}$ has $r = ' + rT + '$ and $\\theta = ' + piT(f) + '$. By Euler\'s formula, $re^{i\\theta} = r\\left(\\cos\\theta + i\\sin\\theta\\right)$, so ' : 'Here $r = ' + rT + '$ and $\\theta = ' + piT(f) + '$, so ') + '$z = r\\cos\\theta + \\left(r\\sin\\theta\\right)i$.\n\n' +
        'From the unit circle, $\\cos ' + trigArg11(f) + ' = ' + sxTex(co) + '$ and $\\sin ' + trigArg11(f) + ' = ' + sxTex(si) + '$.\n\n' +
        disp(['z', timesCx11(rT, cxS11(co, si)), out.tex]) + '\n\nSo $z = ' + out.tex + '$.',
      $m: { kind: 'p2r', euler: euler },
    };
  });

  reg11('pprod', 3, function (r) {
    const div = r.rand() < 0.35, fam = r.pick([30, 45]);
    const pool = fam === 30 ? [30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330] : [45, 90, 135, 180, 225, 270, 315];
    const d1 = r.pick(pool), d2 = r.pick(pool);
    if (d1 % 90 === 0 && d2 % 90 === 0) again();
    let r1, r2, M;
    if (div) { r2 = r.int(2, 3); M = r.int(2, 4); r1 = M * r2; } else { r1 = r.int(2, 4); r2 = r.int(2, 3); M = r1 * r2; }
    const th = div ? d1 - d2 : d1 + d2, f1 = radOf(d1), f2 = radOf(d2), fs = fr(th, 180), op = div ? '-' : '+';
    const rect = r.rand() < 0.6, prin = prin11(th), thN = (th >= 360 || th < -180) ? nmod(th, 360) : th;
    const expr = div ? '\\frac{z}{w}' : 'zw';
    const co = exTrig('cos', th), si = exTrig('sin', th), re = sxMul(co, [M, 1]), im = sxMul(si, [M, 1]), out = cxS11(re, im);
    const mrule = div ? 'divide the moduli and subtract the arguments: $\\frac{z}{w} = \\frac{r_{1}}{r_{2}}\\left(\\cos(\\theta_{1} - \\theta_{2}) + i\\sin(\\theta_{1} - \\theta_{2})\\right)$' : 'multiply the moduli and add the arguments: $zw = r_{1}r_{2}\\left(\\cos(\\theta_{1} + \\theta_{2}) + i\\sin(\\theta_{1} + \\theta_{2})\\right)$';
    const modCalc = div ? '\\frac{r_{1}}{r_{2}} = \\frac{' + r1 + '}{' + r2 + '} = ' + M : 'r_{1}r_{2} = ' + r1 + ' \\cdot ' + r2 + ' = ' + M;
    const angCalc = '\\theta_{1} ' + op + ' \\theta_{2} = ' + piT(f1) + ' ' + op + ' ' + piT(f2) + ' = ' + piT(fs);
    const hints = [
      'To ' + (div ? 'divide' : 'multiply') + ' complex numbers in polar form, ' + mrule + '.',
      'Here $' + modCalc + '$ and $' + angCalc + '$.'];
    let tail, ask;
    if (rect) {
      hints.push('So $' + expr + ' = ' + cisTex11(String(M), fs) + '$. Find the exact cosine and sine of this angle from the unit circle (add or subtract a multiple of $2\\pi$ first if that makes it easier), then multiply by $' + M + '$.');
      ask = 'Find $' + expr + '$ in the form $a + bi$. Give exact values.';
      tail = (thN !== th ? 'The angle $' + piT(fs) + '$ is coterminal with $' + piT(radOf(thN)) + '$, which is easier to use. ' : '') + 'From the unit circle, $\\cos ' + trigArg11(radOf(thN)) + ' = ' + sxTex(co) + '$ and $\\sin ' + trigArg11(radOf(thN)) + ' = ' + sxTex(si) + '$.\n\n' +
        disp([expr, cisTex11(String(M), fs), timesCx11(String(M), cxS11(co, si)), out.tex]) + '\n\nSo $' + expr + ' = ' + out.tex + '$.';
    } else {
      const k = (th - prin) / 360;
      hints.push('The principal argument must lie in $(-\\pi, \\pi]$. Check whether the angle ' + piT(fs) + ' is already in that interval; if not, add or subtract multiples of $2\\pi$ until it is.');
      ask = 'Find the principal argument of $' + expr + '$' + PRINDEF11 + ARGNOTE11;
      tail = k === 0 ? 'The angle $' + piT(fs) + '$ already lies in $(-\\pi, \\pi]$, so no adjustment is needed.' :
        'The angle $' + piT(fs) + '$ is not in $(-\\pi, \\pi]$, so ' + (k > 0 ? 'subtract' : 'add') + ' ' + (Math.abs(k) === 1 ? '$2\\pi$' : '$' + 2 * Math.abs(k) + '\\pi$') + ':\n\n' +
        disp([piT(fs), piT(fs) + (k > 0 ? ' - ' : ' + ') + (Math.abs(k) === 1 ? '' : 2 * Math.abs(k)) + (Math.abs(k) === 1 ? '2' : '') + '\\pi', piT(radOf(prin))]);
      tail += '\n\nSo the principal argument is $' + piT(radOf(prin)) + '$.';
    }
    return {
      type: 'num',
      prompt: 'Let $z = ' + cisTex11(String(r1), f1) + '$ and $w = ' + cisTex11(String(r2), f2) + '$. ' + ask,
      answer: rect ? out.calc : piC(radOf(prin)),
      hints: hints,
      solution: 'In polar form, ' + mrule + '.\n\n$$' + modCalc + ', \\qquad ' + angCalc + '$$\n\n' + tail,
      $m: { kind: 'pprod', div: div, rect: rect },
    };
  });

  reg11('demoivre', 2, function (r) {
    const fam = r.pick(['d45', 'd3060']);
    let deg, rv, re, im, n;
    if (fam === 'd45') {
      deg = r.pick([45, 135, -135, -45]); rv = [1, 1, 2]; n = r.int(3, 8);
      re = [Math.abs(deg) < 90 ? 1 : -1, 1, 1]; im = [deg > 0 ? 1 : -1, 1, 1];
    } else {
      deg = r.pick([30, 60, 120, 150, -150, -120, -60, -30]); rv = [2, 1, 1]; n = r.int(3, 6);
      re = sxMul(exTrig('cos', deg), [2, 1]); im = sxMul(exTrig('sin', deg), [2, 1]);
    }
    let rn = [1, 1, 1];
    for (let i = 0; i < n; i++) rn = sxTimes11(rn, rv);
    const dn = n * deg, dnP = (dn >= 360 || dn < -180) ? nmod(dn, 360) : dn, f = radOf(deg), fn = fr(dn, 180), co = exTrig('cos', dn), si = exTrig('sin', dn);
    const res = cxS11(sxTimes11(rn, co), sxTimes11(rn, si)), zT = cxS11(re, im).tex, rT = sxTex(rv), rnT = sxTex(rn);
    const S = Math.round(sxVal(re) * sxVal(re) + sxVal(im) * sxVal(im)), powT = rv[2] > 1 ? '\\left(' + rT + '\\right)^{' + n + '}' : rT + '^{' + n + '}';
    const chain = [ 'z^{' + n + '}', cisTex11(rnT, fn) ];
    if (dnP !== dn) chain.push(cisTex11(rnT, radOf(dnP)));
    chain.push(timesCx11(rnT, cxS11(co, si)), res.tex);
    return {
      type: 'num',
      prompt: 'Use De Moivre\'s theorem to compute $\\left(' + zT + '\\right)^{' + n + '}$. Give your answer in the form $a + bi$ with exact values.',
      answer: res.calc,
      hints: [
        'First write $z = ' + zT + '$ in polar form: find $r = \\left|z\\right|$ and $\\theta = \\arg z$.',
        'De Moivre\'s theorem says $z^{n} = r^{n}\\left(\\cos n\\theta + i\\sin n\\theta\\right)$. Here $r = ' + rT + '$, $\\theta = ' + piT(f) + '$ and $n = ' + n + '$, so work out $r^{' + n + '}$ and $' + n + '\\theta$.',
        'Find the exact cosine and sine of the new angle $' + n + '\\theta$ (subtract multiples of $2\\pi$ first if you like), multiply both by $r^{' + n + '}$, and write the result as $a + bi$.'],
      solution: 'Write $z$ in polar form first.\n\n' + disp(['\\left|z\\right|', '\\sqrt{' + sqT8(re) + ' + ' + sqT8(im) + '}', '\\sqrt{' + S + '}', rT]) +
        '\n\nThe angle satisfies $\\cos\\theta = \\frac{a}{r} = ' + sxTex(exTrig('cos', deg)) + '$ and $\\sin\\theta = \\frac{b}{r} = ' + sxTex(exTrig('sin', deg)) + '$, so $\\theta = ' + piT(f) + '$.\n\n' +
        'By De Moivre\'s theorem, $z^{' + n + '} = r^{' + n + '}\\left(\\cos ' + n + '\\theta + i\\sin ' + n + '\\theta\\right)$ with\n\n$$r^{' + n + '} = ' + powT + ' = ' + rnT + ', \\qquad ' + n + '\\theta = ' + n + ' \\cdot ' + parL11(piT(f)) + ' = ' + piT(fn) + '$$\n\n' +
        (dnP !== dn ? 'The angle $' + piT(fn) + '$ is coterminal with $' + piT(radOf(dnP)) + '$, which is easier to use.\n\n' : '') + disp(chain) + '\n\nSo $\\left(' + zT + '\\right)^{' + n + '} = ' + res.tex + '$.',
      $m: { kind: 'demoivre', n: n },
    };
  });

  // F2-12 oscillation models: x(t) = A cos(wt + phi), t in seconds
  const K12 = {}, W12 = [];
  const reg12 = function (name, w, fn) { K12[name] = fn; for (let i = 0; i < w; i++) W12.push(name); };
  G['F2-12'] = function (r) { return K12[r.pick(W12)](r); };

  // angular frequency: { pi: false, f: [n, 1] } is n rad/s; { pi: true, f: [n, d] } is (n/d) pi rad/s
  const OMP12 = [[1, 2], [1, 1], [3, 2], [2, 1], [3, 1], [4, 1], [5, 1], [6, 1], [1, 3], [2, 3], [1, 4], [5, 2], [8, 1], [10, 1]];
  const OMI12 = [2, 3, 4, 5, 6, 8, 10, 12];
  const PHD12 = [30, 45, 60, 90, 120, 135, 150, -30, -45, -60, -90, -120, -135, -150];          // phase constants in degrees
  const pickOm12 = function (r, mode) {                                                        // mode 'pi', 'int' or undefined
    const pi = mode === 'pi' ? true : mode === 'int' ? false : r.rand() < 0.6;
    return pi ? { pi: true, f: r.pick(OMP12) } : { pi: false, f: [r.pick(OMI12), 1] };
  };
  const omVal12 = function (om) { return om.f[0] / om.f[1] * (om.pi ? Math.PI : 1); };
  const omTex12 = function (om) { return om.pi ? piT(om.f) : String(om.f[0]); };
  const omCalc12 = function (om) { return om.pi ? piC(om.f) : String(om.f[0]); };
  const hzOf12 = function (om) { return omVal12(om) / (2 * Math.PI); };
  const wtTex12 = function (om) {                                                              // the term omega t inside the cosine
    if (!om.pi) return om.f[0] + 't';
    const t = piT(om.f);
    return /\\pi$/.test(t) ? t + ' t' : t + 't';
  };
  const phPart12 = function (ph) {                                                             // " + \frac{\pi}{3}", " - 0.6" or "" for a zero phase
    if (Array.isArray(ph)) return ph[0] === 0 ? '' : (ph[0] < 0 ? ' - ' : ' + ') + piT([Math.abs(ph[0]), ph[1]]);
    return (ph.dec < 0 ? ' - ' : ' + ') + String(Math.abs(ph.dec));
  };
  const phVal12 = function (ph) { return Array.isArray(ph) ? ph[0] / ph[1] * Math.PI : ph.dec; };
  const argTex12 = function (om, ph) { return wtTex12(om) + phPart12(ph); };
  const eqTex12 = function (A, om, ph, fn) {
    const a = Math.abs(A);
    return 'x(t) = ' + (A < 0 ? '-' : '') + (a === 1 ? '' : String(a)) + '\\' + (fn || 'cos') + '\\left(' + argTex12(om, ph) + '\\right)';
  };
  const terminates12 = function (d) { while (d % 2 === 0) d /= 2; while (d % 5 === 0) d /= 5; return d === 1; };
  const numT12 = function (f) {                                                                // a fraction, with its decimal form when that terminates
    if (f[1] === 1 || !terminates12(f[1])) return ftex(f);
    return ftex(f) + ' = ' + String(Math.round(f[0] / f[1] * 1e6) / 1e6);
  };
  const CTX12 = [
    { w: 3, maxF: 100, unit: 'cm', A: [2, 12], intro: 'The displacement $x$ (in cm) of a mass on a spring from its rest position at time $t$ (in seconds) is modeled by' },
    { w: 2, maxF: 1, unit: 'm', A: [2, 5], intro: 'The height $x$ (in m) of a buoy above its mean level at time $t$ (in seconds) is modeled by' },
    { w: 2, maxF: 2, unit: 'cm', A: [4, 20], intro: 'The horizontal displacement $x$ (in cm) of a pendulum bob from its lowest point at time $t$ (in seconds) is modeled by' },
  ];
  const pickCtx12 = function (r, hz) {                                                         // only contexts whose motion is not absurdly fast
    const pool = [];
    CTX12.forEach(function (c) { if (c.maxF >= hz) for (let i = 0; i < c.w; i++) pool.push(c); });
    return r.pick(pool);
  };
  // periods T = p/q seconds and frequencies f = p/q hertz, with their decimal text
  const TS12 = [[1, 4, '0.25'], [2, 5, '0.4'], [1, 2, '0.5'], [4, 5, '0.8'], [3, 2, '1.5'], [2, 1, '2'], [5, 2, '2.5'], [3, 1, '3'], [4, 1, '4'], [5, 1, '5'], [6, 1, '6'], [8, 1, '8']];
  const HZ12 = [[1, 4, '0.25'], [1, 2, '0.5'], [3, 2, '1.5'], [2, 1, '2'], [5, 2, '2.5'], [3, 1, '3'], [4, 1, '4'], [5, 1, '5'], [10, 1, '10'], [50, 1, '50'], [60, 1, '60'], [2, 5, '0.4'], [4, 5, '0.8'], [5, 4, '1.25']];
  const T2F12 = TS12.concat([[1, 50, '0.02'], [1, 100, '0.01'], [1, 20, '0.05']]);
  const EXACT12 = ' Give an exact answer.';
  const ampPick12 = function (r, c) { return r.int(c.A[0], c.A[1]) + (r.rand() < 0.3 ? 0.5 : 0); };

  reg12('amp', 2, function (r) {
    const om = pickOm12(r), ph = r.rand() < 0.9 ? radOf(r.pick(PHD12)) : [0, 1], c = pickCtx12(r, hzOf12(om));
    const a = ampPick12(r, c), neg = r.rand() < 0.4, A = neg ? -a : a;
    return {
      type: 'num', unit: c.unit,
      prompt: c.intro + ' $' + eqTex12(A, om, ph) + '$. What is the amplitude of the motion?',
      answer: String(a),
      hints: [
        'The amplitude is the greatest distance the object ever gets from its rest position, that is, the largest value of $\\left|x(t)\\right|$.',
        'In $x(t) = A\\cos(\\omega t + \\varphi)$ the cosine always lies between $-1$ and $1$, so $x$ ranges between $-\\left|A\\right|$ and $\\left|A\\right|$.',
        'Read $A$ from the formula (the number multiplying the cosine) and take its absolute value: an amplitude is a distance, so it is never negative.'],
      solution: 'The cosine takes every value from $-1$ to $1$, so $x(t) = A\\cos(\\omega t + \\varphi)$ ranges from $-\\left|A\\right|$ to $\\left|A\\right|$. ' +
        (neg ? 'Here $A = ' + A + '$, so the amplitude is $\\left|A\\right| = \\left|' + A + '\\right| = ' + a + '$ ' : 'Here $A = ' + a + '$, so the amplitude is $' + a + '$ ') + c.unit + '.',
      $m: { kind: 'amp', neg: neg },
    };
  });

  reg12('omega', 3, function (r) {
    const sub = r.pick(['eq', 'eq', 'T', 'f']);
    if (sub === 'eq') {
      const om = pickOm12(r), ph = radOf(r.pick(PHD12)), c = pickCtx12(r, hzOf12(om)), A = r.int(c.A[0], c.A[1]);
      return {
        type: 'num', unit: 'rad/s',
        prompt: c.intro + ' $' + eqTex12(A, om, ph) + '$. What is the angular frequency $\\omega$ of the motion, in radians per second?' + (om.pi ? EXACT12 : ''),
        answer: omCalc12(om),
        hints: [
          'Compare the formula with the standard form $x(t) = A\\cos(\\omega t + \\varphi)$. The angular frequency $\\omega$ is the number multiplying $t$ inside the cosine.',
          'Here the argument of the cosine is $' + argTex12(om, ph) + '$. Find the term that contains $t$ and read off its coefficient.'],
        solution: 'In $x(t) = A\\cos(\\omega t + \\varphi)$ the angular frequency $\\omega$ is the coefficient of $t$ inside the cosine. Here the argument is $' + argTex12(om, ph) + '$, so $\\omega = ' + omTex12(om) + '$ rad/s.',
        $m: { kind: 'omega', sub: sub },
      };
    }
    if (sub === 'T') {
      const t = r.pick(TS12), om = fr(2 * t[1], t[0]);
      return {
        type: 'num', unit: 'rad/s',
        prompt: 'An object oscillates with period $T = ' + t[2] + '$ s. What is its angular frequency $\\omega$ in radians per second?' + EXACT12,
        answer: piC(om),
        hints: [
          'During one period $T$ the angle $\\omega t$ increases by one full turn, $2\\pi$ radians. So $\\omega T = 2\\pi$.',
          'Solve for the angular frequency: $\\omega = \\frac{2\\pi}{T}$. Here $T = ' + t[2] + '$.',
          'Divide $2$ by $' + t[2] + '$ (it may help to write $' + t[2] + '$ as a fraction first) and keep the factor $\\pi$.'],
        solution: 'In one period the angle $\\omega t$ advances by one full turn, $2\\pi$, so $\\omega T = 2\\pi$ and $\\omega = \\frac{2\\pi}{T}$.\n\n' + disp(['\\omega', '\\frac{2\\pi}{' + t[2] + '}', piT(om)]) + '\n\nSo $\\omega = ' + piT(om) + '$ rad/s.',
        $m: { kind: 'omega', sub: sub },
      };
    }
    const f = r.pick(HZ12), om = fr(2 * f[0], f[1]);
    return {
      type: 'num', unit: 'rad/s',
      prompt: 'An object oscillates with frequency $f = ' + f[2] + '$ Hz (cycles per second). What is its angular frequency $\\omega$ in radians per second?' + EXACT12,
      answer: piC(om),
      hints: [
        'Each cycle is one full turn of $2\\pi$ radians, and the object completes $f$ cycles every second. So $\\omega = 2\\pi f$.',
        'Here $f = ' + f[2] + '$, so $\\omega = 2\\pi \\cdot ' + f[2] + '$.',
        'Multiply $2$ by $' + f[2] + '$ and keep the factor $\\pi$.'],
      solution: 'Each cycle is one full turn of $2\\pi$ radians and there are $f$ cycles per second, so $\\omega = 2\\pi f$.\n\n' + disp(['\\omega', '2\\pi f', '2\\pi \\cdot ' + f[2], piT(om)]) + '\n\nSo $\\omega = ' + piT(om) + '$ rad/s.',
      $m: { kind: 'omega', sub: sub },
    };
  });

  reg12('freq', 3, function (r) {
    const sub = r.pick(['eq', 'eq', 'w', 'T']);
    if (sub === 'eq') {
      const om = pickOm12(r, 'pi'), ph = radOf(r.pick(PHD12)), c = pickCtx12(r, hzOf12(om)), A = r.int(c.A[0], c.A[1]);
      const f = fr(om.f[0], 2 * om.f[1]);
      return {
        type: 'num', unit: 'Hz',
        prompt: c.intro + ' $' + eqTex12(A, om, ph) + '$. What is the frequency $f$ of the motion, in hertz (cycles per second)?' + (f[1] > 1 ? FRAC_ASK : ''),
        answer: fcalc(f),
        hints: [
          'The frequency is the number of cycles per second. One cycle corresponds to $2\\pi$ radians of the angle, so $f = \\frac{\\omega}{2\\pi}$.',
          'The angular frequency $\\omega$ is the coefficient of $t$ inside the cosine. Here $\\omega = ' + omTex12(om) + '$ rad/s.',
          'Divide $\\omega$ by $2\\pi$. The factors of $\\pi$ cancel.'],
        solution: 'The angular frequency is the coefficient of $t$: $\\omega = ' + omTex12(om) + '$ rad/s. One cycle is $2\\pi$ radians, so\n\n' + disp(['f', '\\frac{\\omega}{2\\pi}', '\\frac{' + omTex12(om) + '}{2\\pi}', ftex(f)]) + '\n\nSo the frequency is $' + numT12(f) + '$ Hz.',
        $m: { kind: 'freq', sub: sub },
      };
    }
    if (sub === 'w') {
      const om = pickOm12(r, 'int'), ph = radOf(r.pick(PHD12)), c = pickCtx12(r, hzOf12(om)), A = r.int(c.A[0], c.A[1]);
      const w = om.f[0], val = w / (2 * Math.PI), ans = rs7(val, 2), v4 = f4(val);
      return {
        type: 'num', unit: 'Hz', tol: halfUlp(2),
        prompt: c.intro + ' $' + eqTex12(A, om, ph) + '$. What is the frequency $f$ of the motion, in hertz (cycles per second)?' + RND7[2],
        answer: ans,
        hints: [
          'The frequency is the number of cycles per second. One cycle corresponds to $2\\pi$ radians of the angle, so $f = \\frac{\\omega}{2\\pi}$.',
          'The angular frequency $\\omega$ is the coefficient of $t$ inside the cosine. Here $\\omega = ' + w + '$ rad/s.',
          'Divide $' + w + '$ by $2\\pi$ with a calculator and round only at the end.'],
        solution: 'The angular frequency is the coefficient of $t$: $\\omega = ' + w + '$ rad/s. One cycle is $2\\pi$ radians, so\n\n' + align([['f', '\\frac{\\omega}{2\\pi}'], ['', '\\frac{' + w + '}{2\\pi}'], ['', v4, 'calculator', '\\approx'], ['', ans, 'rounded to two decimal places', '\\approx']]) + '\n\nSo the frequency is about $' + ans + '$ Hz.',
        $m: { kind: 'freq', sub: sub },
      };
    }
    const t = r.pick(T2F12), f = fr(t[1], t[0]);
    return {
      type: 'num', unit: 'Hz',
      prompt: 'The period of an oscillation is $T = ' + t[2] + '$ s. What is its frequency $f$ in hertz (cycles per second)?' + (f[1] > 1 ? FRAC_ASK : ''),
      answer: fcalc(f),
      hints: [
        'The period is the time for one cycle, so in one second the object completes $\\frac{1}{T}$ cycles.',
        'So the frequency is $f = \\frac{1}{T}$. Here $T = ' + t[2] + '$.',
        'Divide $1$ by $' + t[2] + '$, or write $' + t[2] + '$ as a fraction and take its reciprocal.'],
      solution: 'The period is the time for one cycle, so the frequency is its reciprocal.\n\n' + disp(['f', '\\frac{1}{T}', '\\frac{1}{' + t[2] + '}', ftex(f)]) + '\n\nSo the frequency is $' + numT12(f) + '$ Hz.',
      $m: { kind: 'freq', sub: sub },
    };
  });

  reg12('period', 3, function (r) {
    const sub = r.pick(['eq', 'eq', 'w', 'f']);
    if (sub === 'eq') {
      const om = pickOm12(r, 'pi'), ph = radOf(r.pick(PHD12)), c = pickCtx12(r, hzOf12(om)), A = r.int(c.A[0], c.A[1]);
      const T = fr(2 * om.f[1], om.f[0]);
      return {
        type: 'num', unit: 's',
        prompt: c.intro + ' $' + eqTex12(A, om, ph) + '$. What is the period $T$ of the motion, in seconds?' + (T[1] > 1 ? FRAC_ASK : ''),
        answer: fcalc(T),
        hints: [
          'The period is the time for one full cycle. In that time the angle $\\omega t$ increases by $2\\pi$, so $\\omega T = 2\\pi$ and $T = \\frac{2\\pi}{\\omega}$.',
          'The angular frequency $\\omega$ is the coefficient of $t$ inside the cosine. Here $\\omega = ' + omTex12(om) + '$ rad/s.',
          'Divide $2\\pi$ by $\\omega$. The factors of $\\pi$ cancel.'],
        solution: 'The angular frequency is the coefficient of $t$: $\\omega = ' + omTex12(om) + '$ rad/s. In one period the angle increases by $2\\pi$, so\n\n' + disp(['T', '\\frac{2\\pi}{\\omega}', '\\frac{2\\pi}{' + omTex12(om) + '}', ftex(T)]) + '\n\nSo the period is $' + numT12(T) + '$ s.',
        $m: { kind: 'period', sub: sub },
      };
    }
    if (sub === 'w') {
      const om = pickOm12(r, 'int'), ph = radOf(r.pick(PHD12)), c = pickCtx12(r, hzOf12(om)), A = r.int(c.A[0], c.A[1]);
      const w = om.f[0], T = fr(2, w);
      return {
        type: 'num', unit: 's',
        prompt: c.intro + ' $' + eqTex12(A, om, ph) + '$. What is the period $T$ of the motion, in seconds?' + EXACT12,
        answer: piC(T),
        hints: [
          'The period is the time for one full cycle. In that time the angle $\\omega t$ increases by $2\\pi$, so $\\omega T = 2\\pi$ and $T = \\frac{2\\pi}{\\omega}$.',
          'The angular frequency $\\omega$ is the coefficient of $t$ inside the cosine. Here $\\omega = ' + w + '$ rad/s.',
          'Write $\\frac{2\\pi}{' + w + '}$ and reduce the fraction. Leave the answer as a multiple of $\\pi$.'],
        solution: 'The angular frequency is the coefficient of $t$: $\\omega = ' + w + '$ rad/s. In one period the angle increases by $2\\pi$, so\n\n' + disp(['T', '\\frac{2\\pi}{\\omega}', '\\frac{2\\pi}{' + w + '}', piT(T)]) + '\n\nSo the period is $' + piT(T) + '$ s.',
        $m: { kind: 'period', sub: sub },
      };
    }
    const h = r.pick(HZ12), T = fr(h[1], h[0]);
    return {
      type: 'num', unit: 's',
      prompt: 'An object oscillates with frequency $f = ' + h[2] + '$ Hz (cycles per second). What is its period $T$ in seconds?' + (T[1] > 1 ? FRAC_ASK : ''),
      answer: fcalc(T),
      hints: [
        'The frequency is the number of cycles per second, and the period is the time for one cycle.',
        'So the period is the reciprocal of the frequency: $T = \\frac{1}{f}$. Here $f = ' + h[2] + '$.',
        'Divide $1$ by $' + h[2] + '$, or write $' + h[2] + '$ as a fraction and take its reciprocal.'],
      solution: 'The period is the time for one cycle, so it is the reciprocal of the frequency.\n\n' + disp(['T', '\\frac{1}{f}', '\\frac{1}{' + h[2] + '}', ftex(T)]) + '\n\nSo the period is $' + numT12(T) + '$ s.',
      $m: { kind: 'period', sub: sub },
    };
  });

  const tSec12 = function (f) {                                                                // a time in seconds from a fraction: 2, 0.25 or \frac{1}{3}
    if (f[1] === 1) return String(f[0]);
    return terminates12(f[1]) ? String(Math.round(f[0] / f[1] * 1e6) / 1e6) : ftex(f);
  };
  const dpar12 = function (s) { return String(s).charAt(0) === '-' ? '(' + s + ')' : String(s); };
  const PHI12 = ' with $-\\pi < \\varphi \\le \\pi$';

  reg12('phase', 7, function (r) {
    const sub = r.pick(['read', 'sin', 'sin', 'shift', 'shift', 'init', 'init']);
    if (sub === 'read') {
      const om = pickOm12(r), ph = radOf(r.pick(PHD12)), c = pickCtx12(r, hzOf12(om)), A = r.int(c.A[0], c.A[1]);
      return {
        type: 'num', unit: 'rad',
        prompt: c.intro + ' $' + eqTex12(A, om, ph) + '$. What is the phase constant $\\varphi$ of the motion, in radians?' + EXACT12,
        answer: piC(ph),
        hints: [
          'In $x(t) = A\\cos(\\omega t + \\varphi)$ the phase constant $\\varphi$ is the constant added to $\\omega t$ inside the cosine. Watch the sign: $\\omega t - c$ means $\\varphi = -c$.',
          'Here the argument is $' + argTex12(om, ph) + '$. Write it in the form $\\omega t + \\varphi$ and read off $\\varphi$.'],
        solution: ph[0] < 0 ? 'Write the argument in the form $\\omega t + \\varphi$:\n\n$$' + argTex12(om, ph) + ' = ' + wtTex12(om) + ' + \\left(' + piT(ph) + '\\right)$$\n\nSo the phase constant is $\\varphi = ' + piT(ph) + '$ rad.'
          : 'The argument $' + argTex12(om, ph) + '$ already has the form $\\omega t + \\varphi$, so the phase constant is $\\varphi = ' + piT(ph) + '$ rad.',
        $m: { kind: 'phase', sub: sub },
      };
    }
    if (sub === 'sin') {
      const om = pickOm12(r), c = pickCtx12(r, hzOf12(om)), A = r.int(c.A[0], c.A[1]), psi = r.pick([0, 30, 45, 60, 90, 120, 135, 150, 180, -30, -45, -60, -90, -120, -135, -150]);
      const ps = radOf(psi), fu = radOf(psi - 90), fp = radOf(prin11(psi - 90)), wt = wtTex12(om);
      const sineForm = A + '\\sin\\left(' + argTex12(om, ps) + '\\right)', cosU = A + '\\cos\\left(' + wt + phPart12(fu) + '\\right)', cosP = A + '\\cos\\left(' + wt + phPart12(fp) + '\\right)';
      const chain = [sineForm, A + '\\cos\\left(' + argTex12(om, ps) + ' - \\frac{\\pi}{2}\\right)', cosU];
      if (fu[0] !== fp[0] || fu[1] !== fp[1]) chain.push(cosP);
      return {
        type: 'num', unit: 'rad',
        prompt: c.intro + ' $' + eqTex12(A, om, ps, 'sin') + '$. The same motion can be written as $x(t) = ' + A + '\\cos\\left(' + wt + ' + \\varphi\\right)$' + PHI12 + '. Find $\\varphi$.' + EXACT12,
        answer: piC(fp),
        hints: [
          'The sine and cosine curves are shifted copies of each other: $\\sin\\theta = \\cos\\left(\\theta - \\frac{\\pi}{2}\\right)$.',
          'Apply this with $\\theta = ' + argTex12(om, ps) + '$, the argument of the sine. The new argument is $' + argTex12(om, ps) + ' - \\frac{\\pi}{2}$.',
          'Combine the constants to get $\\varphi$. If the result is outside $(-\\pi, \\pi]$, add or subtract $2\\pi$ (the cosine does not change).'],
        solution: 'Use $\\sin\\theta = \\cos\\left(\\theta - \\frac{\\pi}{2}\\right)$ with $\\theta = ' + argTex12(om, ps) + '$.\n\n' + disp(chain) +
          (chain.length === 4 ? '\n\nThe cosine has period $2\\pi$, so adding or subtracting $2\\pi$ inside it gives the same curve; this brings the constant into $(-\\pi, \\pi]$.' : '') + '\n\nSo $\\varphi = ' + piT(fp) + '$ rad.',
        $m: { kind: 'phase', sub: sub },
      };
    }
    if (sub === 'shift') {
      const om = pickOm12(r), c = pickCtx12(r, hzOf12(om)), A = r.int(c.A[0], c.A[1]), isMax = r.rand() < 0.6;
      const pd = r.pick(isMax ? [-30, -45, -60, -90, -120, -135, -150] : PHD12), ph = radOf(pd);
      const lead = isMax ? fr(-ph[0], ph[1]) : fr(ph[1] - ph[0], ph[1]);                      // omega * t0 in units of pi
      const t0 = om.pi ? fdiv(lead, om.f) : fdiv(lead, [om.f[0], 1]);                          // seconds (pi-type) or multiples of pi (integer omega)
      if (t0[1] > 12 || t0[0] > 40) again();
      const tT = om.pi ? tSec12(t0) : piT(t0), prodT = omTex12(om) + ' \\cdot ' + dpar12(tT);
      const word = isMax ? 'maximum' : 'minimum', big = isMax ? 'largest' : 'smallest';
      return {
        type: 'num', unit: 'rad',
        prompt: c.intro + ' $x(t) = ' + A + '\\cos\\left(' + wtTex12(om) + ' + \\varphi\\right)$' + PHI12 + '. The ' + (c.unit === 'm' ? 'buoy' : 'object') + ' first reaches its ' + word + ' value of $x$ (the ' + big + ' value) at $t = ' + tT + '$ seconds. Find $\\varphi$.' + EXACT12,
        answer: piC(ph),
        hints: isMax ? [
          'The cosine is at its maximum value $1$ when its argument equals $0$. Because $\\varphi$ is between $-\\pi$ and $\\pi$, the argument starts below this at $t = 0$ and the first time it reaches $0$ is the first maximum.',
          'So at $t = ' + tT + '$ the argument is $0$: $' + prodT + ' + \\varphi = 0$.',
          'Solve for $\\varphi$ and check that it lies in $(-\\pi, \\pi]$.'] : [
          'The cosine is at its minimum value $-1$ when its argument equals $\\pi$. Because $\\varphi$ is between $-\\pi$ and $\\pi$, the first time the argument reaches $\\pi$ is the first minimum.',
          'So at $t = ' + tT + '$ the argument is $\\pi$: $' + prodT + ' + \\varphi = \\pi$.',
          'Solve for $\\varphi$ and check that it lies in $(-\\pi, \\pi]$.'],
        solution: (isMax ? 'The cosine is at its maximum when its argument is $0$, so at $t = ' + tT + '$ we need $' + prodT + ' + \\varphi = 0$.\n\n' + disp(['\\varphi', '-' + prodT, piT(ph)])
          : 'The cosine is at its minimum when its argument is $\\pi$, so at $t = ' + tT + '$ we need $' + prodT + ' + \\varphi = \\pi$.\n\n' + disp(['\\varphi', '\\pi - ' + prodT, piT(ph)])) + '\n\nThis lies in $(-\\pi, \\pi]$, so $\\varphi = ' + piT(ph) + '$ rad.',
        $m: { kind: 'phase', sub: sub, max: isMax },
      };
    }
    // initial condition: x(0) and the direction of motion
    const A = 2 * r.int(2, 6), al = r.pick([30, 45, 60, 90, 120, 135, 150]), dec = r.rand() < 0.5, pd = dec ? al : -al, ph = radOf(pd);
    const cs = exTrig('cos', al), x0 = sxMul(cs, [A, 1]), ratio = '\\frac{' + sxTex(x0) + '}{' + A + '}';
    const alT = piT(radOf(al)), motion = dec ? 'toward smaller values of $x$ (so $x$ is decreasing)' : 'toward larger values of $x$ (so $x$ is increasing)';
    return {
      type: 'num', unit: 'rad',
      prompt: 'The displacement $x$ (in cm) of a mass on a spring at time $t$ (in seconds) is modeled by $x(t) = ' + A + '\\cos(\\omega t + \\varphi)$, where $\\omega > 0$ and $-\\pi < \\varphi \\le \\pi$. At $t = 0$ the displacement is $x(0) = ' + sxTex(x0) + '$ and the mass is moving ' + motion + '. Find $\\varphi$.' + EXACT12,
      answer: piC(ph),
      hints: [
        'At $t = 0$ the formula gives $x(0) = ' + A + '\\cos\\varphi$, so $\\cos\\varphi = \\frac{x(0)}{' + A + '}$. Work out this ratio.',
        'Use the unit circle to find the angle $\\alpha$ between $0$ and $\\pi$ with this cosine. The two solutions in $(-\\pi, \\pi]$ are $\\varphi = \\alpha$ and $\\varphi = -\\alpha$.',
        'As $t$ increases the angle $\\omega t + \\varphi$ increases. The cosine decreases while the angle is between $0$ and $\\pi$ and increases while it is between $-\\pi$ and $0$. Pick the sign of $\\varphi$ that matches the motion.'],
      solution: 'At $t = 0$ we have $x(0) = ' + A + '\\cos\\varphi$, so\n\n' + disp(['\\cos\\varphi', '\\frac{x(0)}{' + A + '}', ratio, sxTex(cs)]) + '\n\nThe angle between $0$ and $\\pi$ with this cosine is $\\alpha = ' + alT + '$, so $\\varphi = ' + alT + '$ or $\\varphi = -' + alT + '$.\n\n' +
        'As time passes the angle $\\omega t + \\varphi$ increases. The cosine ' + (dec ? 'decreases' : 'increases') + ' for angles ' + (dec ? 'between $0$ and $\\pi$' : 'between $-\\pi$ and $0$') + ', and the mass is moving ' + (dec ? 'toward smaller' : 'toward larger') + ' values of $x$, so $\\varphi$ is ' + (dec ? 'positive' : 'negative') + '.\n\nSo $\\varphi = ' + piT(ph) + '$ rad.',
      $m: { kind: 'phase', sub: sub, A: A, dec: dec },
    };
  });

  reg12('value', 4, function (r) {
    const om = pickOm12(r), c = pickCtx12(r, hzOf12(om)), A = ampPick12(r, c), usePi = r.rand() < 0.7;
    const ph = usePi ? radOf(r.pick(PHD12)) : { dec: r.pick([0.4, 0.6, 0.8, 1.2, 1.5, 2.1, -0.5, -0.9, -1.3]) };
    const t0 = r.pick([0.5, 1, 1.5, 2, 2.5, 3, 4, 5]), t0s = String(t0), arg = omVal12(om) * t0 + phVal12(ph);
    if (Math.abs(arg) > 45) again();
    const q6 = arg / (Math.PI / 6), q4 = arg / (Math.PI / 4);
    if (Math.abs(q6 - Math.round(q6)) < 1e-9 || Math.abs(q4 - Math.round(q4)) < 1e-9) again();       // special angles belong to the exact version
    const cv = Math.cos(arg), val = A * cv;
    if (Math.abs(val) < 0.3) again();
    const ans = rs7(val, 2), Atx = String(A), a4 = f4(arg), c4 = f4(cv);
    const rows = [['x(' + t0s + ')', Atx + '\\cos\\left(' + omTex12(om) + ' \\cdot ' + t0s + phPart12(ph) + '\\right)', ['substitute ', 't = ' + t0s]],
      ['', Atx + '\\cos(' + a4 + ')', 'angle in radians', '\\approx'], ['', Atx + ' \\cdot ' + dpar12(c4), 'calculator in radian mode', '\\approx'], ['', ans, undefined, '\\approx']];
    return {
      type: 'num', unit: c.unit, tol: halfUlp(2),
      prompt: c.intro + ' $' + eqTex12(A, om, ph) + '$. Find the displacement $x(' + t0s + ')$ at $t = ' + t0s + '$ seconds.' + RND7[2],
      answer: ans,
      hints: [
        'Substitute $t = ' + t0s + '$ into the formula: $x(' + t0s + ') = ' + Atx + '\\cos\\left(' + omTex12(om) + ' \\cdot ' + t0s + phPart12(ph) + '\\right)$.',
        'Work out the angle inside the cosine first. It is in radians, so put your calculator in radian mode before taking the cosine.',
        'Multiply the cosine by the amplitude $' + Atx + '$, and round to two decimal places only at the end.'],
      solution: 'Substitute $t = ' + t0s + '$ and evaluate with the calculator in radian mode.\n\n' + align(rows) + '\n\nSo $x(' + t0s + ') \\approx ' + ans + '$ ' + c.unit + '.',
      $m: { kind: 'value', t0: t0 },
    };
  });

  reg12('valueEx', 2, function (r) {
    const om = pickOm12(r, 'pi'), c = pickCtx12(r, hzOf12(om)), A = r.int(c.A[0], c.A[1]), ph = radOf(r.pick(PHD12)), t0 = r.int(1, 6);
    const sumDeg = 180 * om.f[0] * t0 / om.f[1] + phVal12(ph) * 180 / Math.PI;
    if (Math.abs(sumDeg - Math.round(sumDeg)) > 1e-9) again();
    const sd = Math.round(sumDeg);
    if ((sd % 30 !== 0 && sd % 45 !== 0) || sd >= 720) again();
    const cs = exTrig('cos', sd);
    if (cs[0] === 0) again();
    const fs = fr(sd, 180), fRed = radOf(sd >= 360 ? nmod(sd, 360) : sd), val = sxMul(cs, [A, 1]);
    const chain = ['x(' + t0 + ')', A + '\\cos\\left(' + omTex12(om) + ' \\cdot ' + t0 + phPart12(ph) + '\\right)', A + '\\cos\\left(' + piT(fs) + '\\right)'];
    if (sd >= 360) chain.push(A + '\\cos\\left(' + piT(fRed) + '\\right)');
    chain.push(A + ' \\cdot ' + parL11(sxTex(cs)), sxTex(val));
    return {
      type: 'num', unit: c.unit,
      prompt: c.intro + ' $' + eqTex12(A, om, ph) + '$. Find the displacement $x(' + t0 + ')$ at $t = ' + t0 + '$ seconds.' + EXACT12,
      answer: sxCalc(val),
      hints: [
        'Substitute $t = ' + t0 + '$ and work out the angle inside the cosine: $' + omTex12(om) + ' \\cdot ' + t0 + phPart12(ph) + '$. Combine the multiples of $\\pi$ into one angle.',
        'If the angle is larger than $2\\pi$, subtract $2\\pi$ (one full turn) to find a coterminal angle.',
        'Use the unit circle to find the exact cosine of that angle, then multiply by the amplitude $' + A + '$.'],
      solution: 'Substitute $t = ' + t0 + '$ and use the unit circle.\n\n' + disp(chain) + (sd >= 360 ? '\n\nThe angle $' + piT(fs) + '$ is coterminal with $' + piT(fRed) + '$ (subtract $2\\pi$).' : '') + '\n\nSo $x(' + t0 + ') = ' + sxTex(val) + '$ ' + c.unit + '.',
      $m: { kind: 'valueEx', t0: t0 },
    };
  });

  reg12('conv', 2, function (r) {
    const g = r.int(2, 4), s0 = r.int(1, 6), n0 = r.int(1, 9);
    if (gcd(s0, n0) !== 1 || s0 === n0 || (s0 === 1 && r.rand() < 0.7)) again();
    const N = g * n0, S = g * s0, sub = r.pick(['f', 'T', 'w']), f = fr(n0, s0), T = fr(s0, n0), om = fr(2 * n0, s0);
    const core = 'A mass on a spring completes $' + N + '$ full oscillations in $' + S + '$ seconds. ';
    if (sub === 'f') {
      return {
        type: 'num', unit: 'Hz', prompt: core + 'What is the frequency of the motion, in hertz (cycles per second)?' + (f[1] > 1 ? FRAC_ASK : ''), answer: fcalc(f),
        hints: ['The frequency is the number of cycles per second: $f = \\frac{\\text{number of cycles}}{\\text{time in seconds}}$.', 'Here that is $f = \\frac{' + N + '}{' + S + '}$.', 'Reduce the fraction by dividing the top and bottom by their greatest common factor.'],
        solution: 'The frequency is the number of cycles per second.\n\n' + disp(['f', '\\frac{' + N + '}{' + S + '}', ftex(f)]) + '\n\nSo the frequency is $' + numT12(f) + '$ Hz.',
        $m: { kind: 'conv', sub: sub },
      };
    }
    if (sub === 'T') {
      return {
        type: 'num', unit: 's', prompt: core + 'What is the period of the motion, in seconds?' + (T[1] > 1 ? FRAC_ASK : ''), answer: fcalc(T),
        hints: ['The period is the time for one cycle: $T = \\frac{\\text{time in seconds}}{\\text{number of cycles}}$.', 'Here that is $T = \\frac{' + S + '}{' + N + '}$.', 'Reduce the fraction by dividing the top and bottom by their greatest common factor.'],
        solution: 'The period is the time taken by one cycle.\n\n' + disp(['T', '\\frac{' + S + '}{' + N + '}', ftex(T)]) + '\n\nSo the period is $' + numT12(T) + '$ s.',
        $m: { kind: 'conv', sub: sub },
      };
    }
    return {
      type: 'num', unit: 'rad/s', prompt: core + 'What is the angular frequency of the motion, in radians per second?' + EXACT12, answer: piC(om),
      hints: ['First find the frequency in cycles per second: $f = \\frac{\\text{number of cycles}}{\\text{time in seconds}}$. Then use $\\omega = 2\\pi f$.', 'Here $f = \\frac{' + N + '}{' + S + '}$ cycles per second, so $\\omega = 2\\pi \\cdot \\frac{' + N + '}{' + S + '}$.', 'Simplify the fraction multiplying $\\pi$.'],
      solution: 'Each cycle is one full turn of $2\\pi$ radians, so $\\omega = 2\\pi f$ where $f$ is the number of cycles per second.\n\n' + disp(['\\omega', '2\\pi \\cdot \\frac{' + N + '}{' + S + '}', piT(om)]) + '\n\nSo $\\omega = ' + piT(om) + '$ rad/s.',
      $m: { kind: 'conv', sub: sub },
    };
  });

  reg12('model', 2, function (r) {
    const t = r.pick(TS12), om = fr(2 * t[1], t[0]), A = r.int(2, 12), start = r.pick(['max', 'min', 'up', 'down']);
    const ph = start === 'max' ? [0, 1] : start === 'min' ? [1, 1] : start === 'up' ? [-1, 2] : [1, 2];
    const where = { max: 'its maximum displacement ($x = ' + A + '$ cm)', min: 'its minimum displacement ($x = -' + A + '$ cm)', up: 'its rest position ($x = 0$), moving in the positive direction', down: 'its rest position ($x = 0$), moving in the negative direction' }[start];
    const wc = piC(om), wTerm = wc.indexOf('/') >= 0 ? '(' + wc + ')t' : wc + ' t', phc = ph[0] === 0 ? '' : (ph[0] < 0 ? ' - ' : ' + ') + piC([Math.abs(ph[0]), ph[1]]);
    const wT = piT(om), model = A + '\\cos\\left(' + (wT.indexOf('frac') >= 0 ? wT + 't' : wT + ' t') + phPart12(ph) + '\\right)';
    const last = { max: 'At $t = 0$ the mass is at its maximum, $x(0) = A$, so $\\cos\\varphi = 1$. Which angle in $(-\\pi, \\pi]$ has cosine $1$?',
      min: 'At $t = 0$ the mass is at its minimum, $x(0) = -A$, so $\\cos\\varphi = -1$. Which angle in $(-\\pi, \\pi]$ has cosine $-1$?',
      up: 'At $t = 0$ we have $x(0) = 0$, so $\\cos\\varphi = 0$ and $\\varphi = \\pm\\frac{\\pi}{2}$. The cosine is increasing when its argument is between $-\\pi$ and $0$ and decreasing when it is between $0$ and $\\pi$. Which sign gives motion in the positive direction?',
      down: 'At $t = 0$ we have $x(0) = 0$, so $\\cos\\varphi = 0$ and $\\varphi = \\pm\\frac{\\pi}{2}$. The cosine is increasing when its argument is between $-\\pi$ and $0$ and decreasing when it is between $0$ and $\\pi$. Which sign gives motion in the negative direction?' }[start];
    const phWhy = { max: 'The mass starts at its maximum, so $\\cos\\varphi = 1$ and $\\varphi = 0$.', min: 'The mass starts at its minimum, so $\\cos\\varphi = -1$ and $\\varphi = \\pi$.',
      up: 'The mass starts at the rest position, so $\\cos\\varphi = 0$ and $\\varphi = \\pm\\frac{\\pi}{2}$. Moving in the positive direction means $x$ is increasing, and the cosine increases for arguments between $-\\pi$ and $0$, so $\\varphi = -\\frac{\\pi}{2}$.',
      down: 'The mass starts at the rest position, so $\\cos\\varphi = 0$ and $\\varphi = \\pm\\frac{\\pi}{2}$. Moving in the negative direction means $x$ is decreasing, and the cosine decreases for arguments between $0$ and $\\pi$, so $\\varphi = \\frac{\\pi}{2}$.' }[start];
    return {
      type: 'expr', vars: ['t'], lead: '$x(t) =$',
      prompt: 'A mass on a spring oscillates with amplitude $' + A + '$ cm and period $' + t[2] + '$ s. At $t = 0$ it is at ' + where + '. Write a model $x(t) = A\\cos(\\omega t + \\varphi)$' + PHI12 + ' for its displacement $x$ (in cm) at time $t$ (in seconds). Type the formula with `cos` and `pi`, for example `3cos(2t + pi/4)`.',
      answer: A + 'cos(' + wTerm + phc + ')',
      hints: [
        'The amplitude gives $A = ' + A + '$. The period gives the angular frequency: $\\omega = \\frac{2\\pi}{T} = \\frac{2\\pi}{' + t[2] + '}$.',
        'The phase constant $\\varphi$ is fixed by the state at $t = 0$, because $x(0) = A\\cos\\varphi$.',
        last],
      solution: 'The amplitude is $A = ' + A + '$ cm and the angular frequency is\n\n' + disp(['\\omega', '\\frac{2\\pi}{T}', '\\frac{2\\pi}{' + t[2] + '}', wT]) + '\n\n' + phWhy + '\n\nSo the model is $x(t) = ' + model + '$.',
      $m: { kind: 'model', A: A, T: t[0] / t[1], start: start },
    };
  });

  // @@F2-GENERATORS-END

  const api = { generators: G, has: function (k) { return !!G[k]; }, make: make };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.ToEGen = api;
})(typeof window !== 'undefined' ? window : this);
