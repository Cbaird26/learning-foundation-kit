/* ToE Learning Foundation — math input parser, evaluator and answer grader.
   Runs in the browser (window.ToEChecker) and in Node (module.exports). */
(function (root) {
  'use strict';

  // ---------- complex arithmetic ----------
  const C = (re, im) => ({ re: re, im: im || 0 });
  const isReal = (a) => Math.abs(a.im) < 1e-14 * Math.max(1, Math.abs(a.re));
  const add = (a, b) => C(a.re + b.re, a.im + b.im);
  const sub = (a, b) => C(a.re - b.re, a.im - b.im);
  const mul = (a, b) => C(a.re * b.re - a.im * b.im, a.re * b.im + a.im * b.re);
  const div = (a, b) => {
    if (b.im === 0) return C(a.re / b.re, a.im / b.re);
    const d = b.re * b.re + b.im * b.im;
    return C((a.re * b.re + a.im * b.im) / d, (a.im * b.re - a.re * b.im) / d);
  };
  const neg = (a) => C(-a.re, -a.im);
  const cabs = (a) => Math.hypot(a.re, a.im);
  const carg = (a) => Math.atan2(a.im, a.re);
  const cexp = (a) => { const m = Math.exp(a.re); return a.im === 0 ? C(m) : C(m * Math.cos(a.im), m * Math.sin(a.im)); };
  const clog = (a) => (a.im === 0 && a.re > 0) ? C(Math.log(a.re)) : C(Math.log(cabs(a)), carg(a));
  const I = C(0, 1);

  function oddDenominator(p) {
    for (let q = 1; q <= 15; q += 2) {
      const n = p * q;
      if (Math.abs(n - Math.round(n)) < 1e-9) return { num: Math.round(n), den: q };
    }
    return null;
  }
  function cpow(a, b) {
    if (a.im === 0 && b.im === 0) {
      if (a.re >= 0 || Number.isInteger(b.re)) return C(Math.pow(a.re, b.re));
      const r = oddDenominator(b.re);
      if (r) { // real odd root of a negative number, e.g. (-8)^(1/3) = -2
        const mag = Math.pow(-a.re, b.re);
        return C(r.num % 2 === 0 ? mag : -mag);
      }
    }
    if (a.re === 0 && a.im === 0) return (b.re > 0) ? C(0) : C(NaN);
    if (b.im === 0 && Number.isInteger(b.re) && Math.abs(b.re) <= 64) {
      let r = C(1), base = b.re < 0 ? div(C(1), a) : a;
      for (let k = 0; k < Math.abs(b.re); k++) r = mul(r, base);
      return r;
    }
    return cexp(mul(b, clog(a)));
  }
  function csqrt(a) {
    if (a.im === 0 && a.re >= 0) return C(Math.sqrt(a.re));
    const m = cabs(a), re = Math.sqrt((m + a.re) / 2), im = Math.sqrt((m - a.re) / 2);
    return C(re, a.im < 0 ? -im : im);
  }
  function csin(a) { return a.im === 0 ? C(Math.sin(a.re)) : C(Math.sin(a.re) * Math.cosh(a.im), Math.cos(a.re) * Math.sinh(a.im)); }
  function ccos(a) { return a.im === 0 ? C(Math.cos(a.re)) : C(Math.cos(a.re) * Math.cosh(a.im), -Math.sin(a.re) * Math.sinh(a.im)); }
  function ctan(a) { return a.im === 0 ? C(Math.tan(a.re)) : div(csin(a), ccos(a)); }
  function csinh(a) { return a.im === 0 ? C(Math.sinh(a.re)) : mul(C(0.5), sub(cexp(a), cexp(neg(a)))); }
  function ccosh(a) { return a.im === 0 ? C(Math.cosh(a.re)) : mul(C(0.5), add(cexp(a), cexp(neg(a)))); }
  function ctanh(a) { return a.im === 0 ? C(Math.tanh(a.re)) : div(csinh(a), ccosh(a)); }
  function casin(a) {
    if (a.im === 0 && Math.abs(a.re) <= 1) return C(Math.asin(a.re));
    return mul(neg(I), clog(add(mul(I, a), csqrt(sub(C(1), mul(a, a))))));
  }
  function cacos(a) {
    if (a.im === 0 && Math.abs(a.re) <= 1) return C(Math.acos(a.re));
    return sub(C(Math.PI / 2), casin(a));
  }
  function catan(a) {
    if (a.im === 0) return C(Math.atan(a.re));
    return mul(div(I, C(2)), sub(clog(sub(C(1), mul(I, a))), clog(add(C(1), mul(I, a)))));
  }
  // Lanczos gamma for factorial of non-integers
  function gammaReal(z) {
    if (z < 0.5) return Math.PI / (Math.sin(Math.PI * z) * gammaReal(1 - z));
    const g = 7, p = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
      -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
    z -= 1; let x = p[0];
    for (let i = 1; i < g + 2; i++) x += p[i] / (z + i);
    const t = z + g + 0.5;
    return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
  }
  function cfact(a) {
    if (!isReal(a)) return C(NaN);
    const n = a.re;
    if (Number.isInteger(n) && n >= 0) { let r = 1; for (let k = 2; k <= n; k++) r *= k; return C(r); }
    return C(gammaReal(n + 1));
  }
  const realOnly = (f) => (a) => isReal(a) ? C(f(a.re)) : C(NaN);

  const FUNCS = {
    sin: csin, cos: ccos, tan: ctan,
    sec: (a) => div(C(1), ccos(a)), csc: (a) => div(C(1), csin(a)), cot: (a) => div(ccos(a), csin(a)),
    asin: casin, acos: cacos, atan: catan, arcsin: casin, arccos: cacos, arctan: catan,
    sinh: csinh, cosh: ccosh, tanh: ctanh,
    sqrt: csqrt, cbrt: (a) => isReal(a) ? C(Math.cbrt(a.re)) : cpow(a, C(1 / 3)),
    ln: clog, log: (a) => div(clog(a), C(Math.LN10)), lg: (a) => div(clog(a), C(Math.LN10)),
    exp: cexp, abs: (a) => C(cabs(a)),
    floor: realOnly(Math.floor), ceil: realOnly(Math.ceil),
    re: (a) => C(a.re), im: (a) => C(a.im), conj: (a) => C(a.re, -a.im), arg: (a) => C(carg(a))
  };
  const FUNC_TEX = { sin: '\\sin', cos: '\\cos', tan: '\\tan', sec: '\\sec', csc: '\\csc', cot: '\\cot',
    asin: '\\arcsin', acos: '\\arccos', atan: '\\arctan', arcsin: '\\arcsin', arccos: '\\arccos', arctan: '\\arctan',
    sinh: '\\sinh', cosh: '\\cosh', tanh: '\\tanh', ln: '\\ln', log: '\\log', lg: '\\log', exp: '\\exp',
    floor: '\\operatorname{floor}', ceil: '\\operatorname{ceil}', re: '\\operatorname{Re}', im: '\\operatorname{Im}',
    conj: '\\operatorname{conj}', arg: '\\arg' };
  const GREEK = ['alpha', 'beta', 'gamma', 'delta', 'epsilon', 'varepsilon', 'zeta', 'eta', 'theta', 'vartheta', 'iota', 'kappa',
    'lambda', 'mu', 'nu', 'xi', 'rho', 'sigma', 'tau', 'upsilon', 'phi', 'varphi', 'chi', 'psi', 'omega',
    'Gamma', 'Delta', 'Theta', 'Lambda', 'Xi', 'Sigma', 'Phi', 'Psi', 'Omega'];
  const UNICODE = { 'α': 'alpha', 'β': 'beta', 'γ': 'gamma', 'δ': 'delta', 'ε': 'epsilon', 'ζ': 'zeta', 'η': 'eta',
    'θ': 'theta', 'ι': 'iota', 'κ': 'kappa', 'λ': 'lambda', 'μ': 'mu', 'ν': 'nu', 'ξ': 'xi', 'ρ': 'rho', 'σ': 'sigma',
    'τ': 'tau', 'φ': 'phi', 'ϕ': 'phi', 'χ': 'chi', 'ψ': 'psi', 'ω': 'omega', 'Γ': 'Gamma', 'Δ': 'Delta', 'Θ': 'Theta',
    'Λ': 'Lambda', 'Σ': 'Sigma', 'Φ': 'Phi', 'Ψ': 'Psi', 'Ω': 'Omega', 'π': 'pi', 'ħ': 'hbar' };

  // ---------- tokenizer ----------
  function normalize(s) {
    s = String(s == null ? '' : s);
    s = s.replace(/\$/g, '').replace(/\\left|\\right/g, '').replace(/\\cdot|\\times/g, '*').replace(/\\pi/g, 'pi')
      .replace(/\\sqrt/g, 'sqrt').replace(/\\(sin|cos|tan|ln|log|exp|arcsin|arccos|arctan|sinh|cosh|tanh|sec|csc|cot)/g, '$1')
      .replace(/\\(alpha|beta|gamma|delta|epsilon|theta|lambda|mu|nu|rho|sigma|tau|phi|omega|psi|chi|xi|eta|zeta|kappa)/g, '$1')
      .replace(/\\infty/g, 'inf').replace(/\\frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, '(($1)/($2))')
      .replace(/[{}]/g, (c) => (c === '{' ? '(' : ')'));
    s = s.replace(/[−–—]/g, '-').replace(/[×·⋅∙]/g, '*').replace(/÷/g, '/').replace(/√/g, 'sqrt')
      .replace(/∞/g, 'inf').replace(/²/g, '^2').replace(/³/g, '^3').replace(/⁴/g, '^4').replace(/\*\*/g, '^')
      .replace(/[⟨〈]/g, '(').replace(/[⟩〉]/g, ')').replace(/∅/g, 'none');
    s = s.replace(/[α-ωΑ-Ωπϕħ]/g, (c) => (UNICODE[c] ? ' ' + UNICODE[c] + ' ' : c));
    s = s.replace(/\b(dne|does not exist|undefined)\b/gi, 'dne').replace(/\b(infinity|inf)\b/gi, 'inf').replace(/\bnone\b/gi, 'none');
    return s.trim();
  }

  function tokenize(src, names) {
    const toks = [];
    let i = 0;
    const s = src;
    while (i < s.length) {
      const c = s[i];
      if (/\s/.test(c)) { i++; continue; }
      if (/[0-9.]/.test(c)) {
        const m = /^(\d+\.?\d*|\.\d+)([eE][+-]?\d+)?/.exec(s.slice(i));
        if (!m || m[0] === '.') throw new Error('Unexpected "."');
        toks.push({ t: 'num', v: parseFloat(m[0]), raw: m[0] });
        i += m[0].length; continue;
      }
      if (/[A-Za-z_]/.test(c)) {
        const m = /^[A-Za-z]+(_\{?[A-Za-z0-9]+\}?)?[A-Za-z]*/.exec(s.slice(i));
        let run = m[0];
        i += run.length;
        if (run === 'log') { // log2(8), log10(x): digits right after log name the base
          const b = /^(\d+(?:\.\d+)?)(?=\s*\()/.exec(s.slice(i));
          if (b) { toks.push({ t: 'func', v: 'logb', base: parseFloat(b[1]) }); i += b[0].length; continue; }
        }
        splitIdent(run.replace(/[{}]/g, ''), names).forEach((tk) => toks.push(tk));
        continue;
      }
      if ('+-*/^()|!,'.includes(c)) { toks.push({ t: c }); i++; continue; }
      if (c === '[') { toks.push({ t: '(' }); i++; continue; }
      if (c === ']') { toks.push({ t: ')' }); i++; continue; }
      if (c === '<' || c === '>') { toks.push({ t: c === '<' ? '(' : ')' }); i++; continue; }
      throw new Error('Unexpected symbol "' + c + '"');
    }
    return toks;
  }

  function splitIdent(run, names) {
    // log_2 or log2 → log base 2
    let m = /^log_?(\d+(?:\.\d+)?)$/.exec(run);
    if (m) return [{ t: 'func', v: 'logb', base: parseFloat(m[1]) }];
    const out = [];
    let rest = run;
    while (rest.length) {
      // longest known name first
      let best = '';
      for (const n of names) if (n.length > best.length && rest.startsWith(n)) best = n;
      if (!best) {
        // variable with subscript like v_0 not in names → keep whole
        const sm = /^([A-Za-z])_([A-Za-z0-9]+)/.exec(rest);
        best = sm ? sm[0] : rest[0];
      }
      rest = rest.slice(best.length);
      if (FUNCS[best]) out.push({ t: 'func', v: best });
      else out.push({ t: 'id', v: best });
    }
    return out;
  }

  // ---------- parser (precedence climbing) ----------
  function parse(src, opts) {
    opts = opts || {};
    const vars = (opts.vars || []).slice();
    const names = Object.keys(FUNCS).concat(GREEK, ['pi', 'inf', 'infinity', 'oo', 'dne', 'none', 'hbar'], vars);
    const toks = tokenize(normalize(src), names);
    let p = 0, absDepth = 0;
    const peek = () => toks[p];
    const next = () => toks[p++];
    const expect = (t) => { const k = next(); if (!k || k.t !== t) throw new Error('Expected "' + t + '"'); return k; };
    const startsPrimary = (k) => k && (k.t === 'num' || k.t === 'id' || k.t === 'func' || k.t === '(' || (k.t === '|' && absDepth === 0));

    function parseExpr() {
      let left = parseTerm();
      while (peek() && (peek().t === '+' || peek().t === '-')) {
        const op = next().t;
        left = { k: op === '+' ? 'add' : 'sub', a: left, b: parseTerm() };
      }
      return left;
    }
    function parseTerm() {
      let left = parseUnary();
      for (;;) {
        const k = peek();
        if (k && (k.t === '*' || k.t === '/')) { next(); left = { k: k.t === '*' ? 'mul' : 'div', a: left, b: parseUnary() }; }
        else if (startsPrimary(k)) { left = { k: 'mul', a: left, b: parsePower(), implicit: true }; }
        else break;
      }
      return left;
    }
    function parseUnary() {
      const k = peek();
      if (k && k.t === '-') { next(); return { k: 'neg', a: parseUnary() }; }
      if (k && k.t === '+') { next(); return parseUnary(); }
      return parsePower();
    }
    function parsePower() {
      const base = parsePostfix();
      if (peek() && peek().t === '^') { next(); return { k: 'pow', a: base, b: parseUnary() }; }
      return base;
    }
    function parsePostfix() {
      let e = parsePrimary();
      while (peek() && peek().t === '!') { next(); e = { k: 'fact', a: e }; }
      return e;
    }
    function parsePrimary() {
      const k = next();
      if (!k) throw new Error('Incomplete expression');
      if (k.t === 'num') return { k: 'num', v: k.v, raw: k.raw };
      if (k.t === '(') {
        const e = parseExpr();
        if (peek() && peek().t === ',') { // tuple inside parentheses
          const items = [e];
          while (peek() && peek().t === ',') { next(); items.push(parseExpr()); }
          expect(')');
          return { k: 'tuple', items: items };
        }
        expect(')'); return { k: 'paren', a: e };
      }
      if (k.t === '|') { absDepth++; const e = parseExpr(); expect('|'); absDepth--; return { k: 'call', f: 'abs', a: e }; }
      if (k.t === 'func') {
        let power = null;
        if (peek() && peek().t === '^') { next(); power = parsePostfix(); }
        let arg;
        if (peek() && peek().t === '(') { next(); arg = parseExpr(); expect(')'); }
        else { // sin 2x means sin(2x): take a run of numbers and symbols as the argument
          arg = parsePower();
          while (peek() && (peek().t === 'num' || peek().t === 'id')) arg = { k: 'mul', a: arg, b: parsePower(), implicit: true };
        }
        let node = k.v === 'logb' ? { k: 'logb', base: k.base, a: arg } : { k: 'call', f: k.v, a: arg };
        if (power) node = { k: 'pow', a: node, b: power };
        return node;
      }
      if (k.t === 'id') {
        const v = k.v;
        if (vars.indexOf(v) >= 0) return { k: 'var', v: v };
        if (v === 'pi') return { k: 'const', v: 'pi' };
        if (v === 'e') return { k: 'const', v: 'e' };
        if (v === 'i') return { k: 'const', v: 'i' };
        if (v === 'inf' || v === 'infinity' || v === 'oo') return { k: 'const', v: 'inf' };
        if (v === 'dne') return { k: 'special', v: 'dne' };
        if (v === 'none') return { k: 'special', v: 'none' };
        return { k: 'var', v: v, free: true };
      }
      throw new Error('Unexpected "' + k.t + '"');
    }
    if (!toks.length) throw new Error('Empty answer');
    const tree = parseExpr();
    if (p < toks.length) throw new Error('Unexpected "' + (toks[p].t === 'num' ? toks[p].raw : toks[p].v || toks[p].t) + '"');
    return tree;
  }

  function evaluate(node, env) {
    switch (node.k) {
      case 'num': return C(node.v);
      case 'paren': return evaluate(node.a, env);
      case 'const':
        if (node.v === 'pi') return C(Math.PI);
        if (node.v === 'e') return C(Math.E);
        if (node.v === 'i') return C(0, 1);
        if (node.v === 'inf') return C(Infinity);
        break;
      case 'var':
        if (env && Object.prototype.hasOwnProperty.call(env, node.v)) return C(env[node.v]);
        throw new Error('Unknown symbol "' + node.v + '"');
      case 'add': return add(evaluate(node.a, env), evaluate(node.b, env));
      case 'sub': return sub(evaluate(node.a, env), evaluate(node.b, env));
      case 'mul': return mul(evaluate(node.a, env), evaluate(node.b, env));
      case 'div': return div(evaluate(node.a, env), evaluate(node.b, env));
      case 'neg': return neg(evaluate(node.a, env));
      case 'pow': return cpow(evaluate(node.a, env), evaluate(node.b, env));
      case 'fact': return cfact(evaluate(node.a, env));
      case 'call': return FUNCS[node.f](evaluate(node.a, env));
      case 'logb': return div(clog(evaluate(node.a, env)), C(Math.log(node.base)));
      case 'special': throw new Error('special');
      case 'tuple': throw new Error('A single value was expected');
    }
    throw new Error('Cannot evaluate');
  }

  function freeVars(node, acc) {
    acc = acc || new Set();
    if (!node || typeof node !== 'object') return acc;
    if (node.k === 'var' && node.free) acc.add(node.v);
    ['a', 'b'].forEach((key) => { if (node[key]) freeVars(node[key], acc); });
    if (node.items) node.items.forEach((n) => freeVars(n, acc));
    return acc;
  }

  // ---------- TeX preview of learner input ----------
  const PREC = { add: 1, sub: 1, mul: 2, div: 2, neg: 3, pow: 4 };
  function texName(v) {
    if (GREEK.indexOf(v) >= 0) return '\\' + v;
    if (v === 'hbar') return '\\hbar';
    const m = /^([A-Za-z]+)_([A-Za-z0-9]+)$/.exec(v);
    if (m) return texName(m[1]) + '_{' + m[2] + '}';
    return v.length > 1 ? '\\mathit{' + v + '}' : v;
  }
  function toTex(node) {
    const wrap = (n, prec) => {
      const t = toTex(n);
      return (PREC[n.k] && PREC[n.k] < prec) ? '\\left(' + t + '\\right)' : t;
    };
    switch (node.k) {
      case 'num': return node.raw.replace(/[eE]([+-]?\d+)/, '\\times 10^{$1}');
      case 'paren': return '\\left(' + toTex(node.a) + '\\right)';
      case 'const': return node.v === 'pi' ? '\\pi' : node.v === 'inf' ? '\\infty' : node.v;
      case 'special': return node.v === 'dne' ? '\\text{DNE}' : '\\varnothing';
      case 'var': return texName(node.v);
      case 'add': return toTex(node.a) + '+' + toTex(node.b);
      case 'sub': return toTex(node.a) + '-' + wrap(node.b, 2);
      case 'mul': {
        const a = wrap(node.a, 2), b = wrap(node.b, 2);
        const needDot = !node.implicit || (node.b.k === 'num') || /^[0-9]/.test(b);
        return a + (needDot ? ' \\cdot ' : ' ') + b;
      }
      case 'div': return '\\dfrac{' + toTex(node.a.k === 'paren' ? node.a.a : node.a) + '}{' + toTex(node.b.k === 'paren' ? node.b.a : node.b) + '}';
      case 'neg': return '-' + wrap(node.a, 3);
      case 'pow': {
        const base = (node.a.k === 'call') ? '\\left(' + toTex(node.a) + '\\right)' : wrap(node.a, 5);
        return '{' + base + '}^{' + toTex(node.b.k === 'paren' ? node.b.a : node.b) + '}';
      }
      case 'fact': return wrap(node.a, 5) + '!';
      case 'call':
        if (node.f === 'sqrt') return '\\sqrt{' + toTex(node.a) + '}';
        if (node.f === 'cbrt') return '\\sqrt[3]{' + toTex(node.a) + '}';
        if (node.f === 'abs') return '\\left|' + toTex(node.a) + '\\right|';
        return FUNC_TEX[node.f] + '\\left(' + toTex(node.a) + '\\right)';
      case 'logb': return '\\log_{' + node.base + '}\\left(' + toTex(node.a) + '\\right)';
      case 'tuple': return '\\left(' + node.items.map(toTex).join(', ') + '\\right)';
    }
    return '';
  }

  // ---------- grading ----------
  function stripLead(s, item) {
    s = String(s || '').trim();
    // remove "x =" style prefix and the expected unit suffix
    s = s.replace(/^[A-Za-z][A-Za-z_0-9]*(\([A-Za-z]\))?\s*=\s*/, '');
    if (item && item.unit) {
      const u = String(item.unit).trim();
      if (u && s.endsWith(u)) s = s.slice(0, -u.length).trim();
    }
    return s;
  }
  function tolOf(item) {
    const t = item && item.tol != null ? String(item.tol).trim() : '';
    if (!t) return { rel: 1e-6, abs: 1e-9 };
    if (t.endsWith('%')) return { rel: parseFloat(t) / 100, abs: 0 };
    return { rel: 0, abs: parseFloat(t) };
  }
  function closeTo(a, b, tol) {
    if (!isFinite(a.re) || !isFinite(b.re)) return a.re === b.re && isReal(a) && isReal(b);
    const d = Math.hypot(a.re - b.re, a.im - b.im);
    const scale = Math.max(cabs(a), cabs(b));
    return d <= Math.max(tol.abs, tol.rel * scale, 1e-12);
  }
  function valueOf(str, item) {
    const tree = parse(stripLead(str, item), { vars: [] });
    if (tree.k === 'special') return { special: tree.v };
    const fv = freeVars(tree);
    if (fv.size) throw new Error('Your answer should be a number (found "' + Array.from(fv)[0] + '")');
    return { value: evaluate(tree, {}), tree: tree };
  }
  function splitList(s) {
    s = String(s || '').trim().replace(/^\{|\}$/g, '');
    if (/^(none|no solution|no solutions|no real solutions|empty|∅|\{\})$/i.test(s)) return [];
    return s.split(/\s*(?:,|;|\band\b|\bor\b)\s*/i).filter((x) => x.length);
  }
  function stripBrackets(s) {
    s = String(s || '').trim();
    if (/^[([<⟨]/.test(s) && /[)\]>⟩]$/.test(s)) s = s.slice(1, -1);
    return s;
  }
  // deterministic or random sample points
  function samplePoints(vars, domain, n, seed) {
    let state = seed || 12345;
    const rnd = () => { state = (state * 1103515245 + 12345) % 2147483648; return state / 2147483648; };
    const pts = [];
    for (let k = 0; k < n; k++) {
      const env = {};
      vars.forEach((v) => {
        const d = (domain && domain[v]) || [0.35, 2.65];
        env[v] = d[0] + (d[1] - d[0]) * rnd();
      });
      pts.push(env);
    }
    return pts;
  }
  function parseDomain(spec) {
    // "x: 3..6; t: 0..1"
    const out = {};
    if (!spec) return out;
    String(spec).split(/[;,]/).forEach((part) => {
      const m = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(-?[\d.]+)\s*\.\.\s*(-?[\d.]+)\s*$/.exec(part);
      if (m) out[m[1]] = [parseFloat(m[2]), parseFloat(m[3])];
    });
    return out;
  }
  function exprEquivalent(aTree, bTree, vars, item, seed) {
    const domain = parseDomain(item.domain);
    const pts = samplePoints(vars, domain, 8, seed);
    const tol = { rel: 1e-6, abs: 1e-9 };
    let valid = 0, offset = null;
    for (const env of pts) {
      let va, vb;
      try { va = evaluate(aTree, env); vb = evaluate(bTree, env); } catch (e) { return { ok: false, err: e.message }; }
      if (!isFinite(vb.re) || !isFinite(vb.im) || isNaN(vb.re)) continue;
      if (!isFinite(va.re) || isNaN(va.re)) return { ok: false };
      if (item.const) {
        const d = sub(va, vb);
        if (offset === null) offset = d;
        else if (!closeTo(d, offset, tol)) return { ok: false };
      } else if (!closeTo(va, vb, tol)) return { ok: false };
      valid++;
    }
    return { ok: valid >= 3 };
  }
  function hasSumFactor(node) { // for "expanded" form
    if (!node || typeof node !== 'object') return false;
    if (node.k === 'mul') {
      const isSum = (n) => n && (n.k === 'paren' ? isSum(n.a) : (n.k === 'add' || n.k === 'sub'));
      if (isSum(node.a) || isSum(node.b)) return true;
    }
    if (node.k === 'pow') {
      const isSum = (n) => n && (n.k === 'paren' ? isSum(n.a) : (n.k === 'add' || n.k === 'sub'));
      if (isSum(node.a)) return true;
    }
    return ['a', 'b'].some((k) => node[k] && hasSumFactor(node[k]));
  }
  function isProductForm(node) {
    while (node.k === 'paren' || node.k === 'neg') node = node.a;
    return node.k === 'mul' || (node.k === 'pow' && node.b.k === 'num');
  }

  // text answers: compared line by line, runs of spaces count as one, outer blank lines ignored
  function normText(t) {
    const lines = String(t == null ? '' : t).replace(/\r\n?/g, '\n').split('\n').map((l) => l.replace(/[ \t]+/g, ' ').trim());
    while (lines.length && !lines[0]) lines.shift();
    while (lines.length && !lines[lines.length - 1]) lines.pop();
    return lines.join('\n');
  }
  function grade(item, input) {
    const type = item.type;
    try {
      if (type === 'mc') return { correct: Number(input) === Number(item.answer) };
      if (type === 'ms') {
        const want = (item.answer || []).map(Number).sort().join(',');
        const got = (input || []).map(Number).sort().join(',');
        return { correct: want === got };
      }
      if (type === 'self') return { correct: input === 'yes', self: true };
      if (String(input || '').trim() === '') return { correct: false, empty: true, message: 'Enter an answer first.' };
      if (type === 'text') {
        const got = normText(input);
        const ok = [item.answer].concat(item.accept || []).some((a) => normText(a) === got);
        if (ok) return { correct: true };
        const near = [item.answer].concat(item.accept || []).some((a) => normText(a).toLowerCase() === got.toLowerCase() || normText(a).replace(/\s+/g, '') === got.replace(/\s+/g, ''));
        return { correct: false, message: near ? 'Close: check capital letters, spaces and punctuation. Type it exactly.' : '' };
      }
      if (type === 'num') {
        const want = valueOf(item.answer, null);
        let got;
        try { got = valueOf(input, item); } catch (e) { return { correct: false, invalid: true, message: e.message }; }
        if (want.special || got.special) return { correct: want.special === got.special };
        const tol = tolOf(item);
        if (closeTo(got.value, want.value, tol)) return { correct: true };
        if (!item.tol && closeTo(got.value, want.value, { rel: 0.01, abs: 0 }) && /\d\.\d{2,}/.test(String(input)))
          return { correct: false, invalid: true, needExact: true, message: 'This one needs an exact value, such as a fraction, sqrt(2) or pi, not a rounded decimal. This try did not count.' };
        return { correct: false };
      }
      if (type === 'expr') {
        const vars = item.vars || [];
        let got;
        try { got = parse(stripLead(input, item), { vars: vars }); } catch (e) { return { correct: false, invalid: true, message: e.message }; }
        const fv = freeVars(got);
        if (fv.size) return { correct: false, invalid: true, message: 'Unknown symbol "' + Array.from(fv)[0] + '". Use ' + (vars.length ? vars.join(', ') : 'numbers only') + '.' };
        const want = parse(item.answer, { vars: vars });
        const eq = exprEquivalent(got, want, vars, item, (Date.now() % 100000) + 7);
        if (!eq.ok) return { correct: false };
        if (item.form === 'expanded' && hasSumFactor(got)) return { correct: false, message: 'Equivalent, but expand it fully: multiply out every bracket.' };
        if (item.form === 'factored' && !isProductForm(got)) return { correct: false, message: 'Equivalent, but write it as a product of factors.' };
        return { correct: true };
      }
      if (type === 'list' || type === 'tuple') {
        const vars = item.vars || [];
        const wantParts = splitList(stripBrackets(item.answer));
        let raw = String(input || '').trim();
        if (type === 'tuple') raw = raw.replace(/^\([A-Za-z_0-9, ]+\)\s*=\s*/, '');
        raw = stripBrackets(raw);
        const gotParts = splitList(raw).map((part) => stripLead(part, item));
        if (wantParts.length !== gotParts.length) return { correct: false, message: gotParts.length < wantParts.length && type === 'list' ? 'Not quite. Check that you entered every value.' : undefined };
        const tol = tolOf(item);
        const cmp = (g, w) => {
          if (vars.length) {
            const gt = parse(g, { vars: vars }), wt = parse(w, { vars: vars });
            if (freeVars(gt).size) return false;
            return exprEquivalent(gt, wt, vars, item, 99).ok;
          }
          const a = valueOf(g, item), b = valueOf(w, null);
          if (a.special || b.special) return a.special === b.special;
          return closeTo(a.value, b.value, tol);
        };
        if (type === 'tuple') {
          for (let k = 0; k < wantParts.length; k++) if (!cmp(gotParts[k], wantParts[k])) return { correct: false };
          return { correct: true };
        }
        const used = new Array(gotParts.length).fill(false);
        for (const w of wantParts) {
          let found = false;
          for (let k = 0; k < gotParts.length; k++) {
            if (used[k]) continue;
            let ok = false;
            try { ok = cmp(gotParts[k], w); } catch (e) { return { correct: false, invalid: true, message: e.message }; }
            if (ok) { used[k] = true; found = true; break; }
          }
          if (!found) return { correct: false };
        }
        return { correct: true };
      }
    } catch (e) {
      return { correct: false, invalid: true, message: e.message };
    }
    return { correct: false };
  }

  function preview(input, item) {
    try {
      const s = String(input || '').trim();
      if (!s) return '';
      if (item && (item.type === 'list')) return splitList(s).map((p) => toTex(parse(p, { vars: item.vars || [] }))).join(',\\; ');
      return toTex(parse(stripLead(s, item), { vars: (item && item.vars) || [] }));
    } catch (e) { return null; }
  }

  const api = { normText: normText, parse: parse, evaluate: evaluate, grade: grade, preview: preview, toTex: toTex, freeVars: freeVars,
    splitList: splitList, stripBrackets: stripBrackets, samplePoints: samplePoints, parseDomain: parseDomain, C: C };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ToEChecker = api;
})(typeof window !== 'undefined' ? window : this);
