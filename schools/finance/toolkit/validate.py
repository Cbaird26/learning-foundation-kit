#!/usr/bin/env python3
"""Validate one course's lesson sources and build its JSON.

usage: python3 /home/claude/finance/toolkit/validate.py CODE [L03 ...]
Reads  /home/claude/finance/content/CODE/L01.txt ... L12.txt and project.txt
Writes /home/claude/finance/build/CODE.json (always) and prints every problem found.
Exit status 0 only when there are no errors.
"""
import sys, os, json, re, math, cmath, random, subprocess, tempfile, warnings, time, hashlib
for _v in ('OPENBLAS_NUM_THREADS', 'OMP_NUM_THREADS', 'MKL_NUM_THREADS'):
    os.environ.setdefault(_v, '1')  # many validators run at once; threaded BLAS can crash them
import numpy as np
from scipy import integrate, optimize, special
from fractions import Fraction

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from lessonfmt import parse_lesson, parse_project, FormatError

CONTENT = '/home/claude/finance/content'
BUILD = '/home/claude/finance/build'
CATALOG = json.load(open(os.environ.get('TOE_CATALOG', '/home/claude/finance/work/courses_raw.json')))
warnings.filterwarnings('ignore')

# ---------------- check-expression environment ----------------
def _real_if_close(z):
    z = complex(z)
    return z.real if abs(z.imag) <= 1e-10 * max(1.0, abs(z.real)) else z

def sqrt(x):
    return np.emath.sqrt(x) if np.any(np.asarray(x, dtype=complex).real < 0) and not np.iscomplexobj(x) else np.sqrt(x)

def log(x):
    return np.emath.log(x) if not np.iscomplexobj(x) and np.any(np.asarray(x) <= 0) else np.log(x)

def quad(f, a, b):
    return integrate.quad(f, a, b, limit=400, epsabs=1e-13, epsrel=1e-12)[0]

def quad2(f, x0, x1, y0, y1):
    """Integral over x0<=x<=x1 and y0(x)<=y<=y1(x) of f(x, y); y bounds may be numbers or functions of x."""
    g = y0 if callable(y0) else (lambda x, c=y0: c)
    h = y1 if callable(y1) else (lambda x, c=y1: c)
    return integrate.dblquad(lambda y, x: f(x, y), x0, x1, g, h, epsabs=1e-12, epsrel=1e-11)[0]

def quad3(f, x0, x1, y0, y1, z0, z1):
    return integrate.tplquad(lambda z, y, x: f(x, y, z), x0, x1, y0, y1, z0, z1, epsabs=1e-11, epsrel=1e-10)[0]

def nderiv(f, x, n=1):
    """Numerical derivative of order 1, 2 or 3 at x (Richardson-extrapolated central differences)."""
    def d(h):
        if n == 1: return (-f(x + 2*h) + 8*f(x + h) - 8*f(x - h) + f(x - 2*h)) / (12*h)
        if n == 2: return (-f(x + 2*h) + 16*f(x + h) - 30*f(x) + 16*f(x - h) - f(x - 2*h)) / (12*h*h)
        if n == 3: return (f(x + 2*h) - 2*f(x + h) + 2*f(x - h) - f(x - 2*h)) / (2*h**3)
        raise ValueError('nderiv supports n = 1, 2, 3')
    h = {1: 1e-3, 2: 2e-3, 3: 1e-2}[n] * max(1.0, abs(x))
    order = {1: 4, 2: 4, 3: 2}[n]
    a, b = d(h), d(h / 2)
    return b + (b - a) / (2**order - 1)

def pderiv(f, point, var_index, n=1):
    """Partial derivative of f(*point) with respect to argument var_index."""
    point = list(point)
    def g(t):
        p = point.copy(); p[var_index] = t; return f(*p)
    return nderiv(g, point[var_index], n)

def root(f, a, b=None):
    if b is None:
        return optimize.newton(f, a, tol=1e-14, maxiter=500)
    fa, fb = f(a), f(b)
    if fa == 0: return a
    if fb == 0: return b
    if fa * fb < 0:
        return optimize.brentq(f, a, b, xtol=1e-15, rtol=1e-15, maxiter=500)
    r = allroots(f, a, b)
    if len(r) != 1:
        raise ValueError(f'root(f, {a}, {b}): expected exactly one root in the interval, found {len(r)}')
    return r[0]

def allroots(f, a, b, n=20001):
    """All roots of f in [a, b] found by sign changes on a fine grid (does not find double roots)."""
    xs = np.linspace(a, b, n)
    vals = np.array([f(x) for x in xs], dtype=float)
    out = []
    for i in range(n - 1):
        if vals[i] == 0:
            out.append(xs[i])
        elif vals[i] * vals[i + 1] < 0:
            out.append(optimize.brentq(f, xs[i], xs[i + 1], xtol=1e-15, rtol=1e-15))
    if vals[-1] == 0: out.append(xs[-1])
    return out

def roots(coeffs):
    r = np.roots(coeffs)
    r = [_real_if_close(z) for z in r]
    return sorted(r, key=lambda z: (complex(z).real, complex(z).imag))

def lin(A, b):
    return [_real_if_close(v) for v in np.linalg.solve(np.array(A, dtype=complex), np.array(b, dtype=complex))]

def eig(A):
    w = np.linalg.eigvals(np.array(A, dtype=complex))
    w = [_real_if_close(z) for z in w]
    return sorted(w, key=lambda z: (complex(z).real, complex(z).imag))

def det(A): return _real_if_close(np.linalg.det(np.array(A, dtype=complex)))
def inv(A): return np.linalg.inv(np.array(A, dtype=float)).tolist()
def rank(A): return int(np.linalg.matrix_rank(np.array(A, dtype=float)))
def mat(A): return np.array(A, dtype=float)
def dot(u, v): return _real_if_close(np.dot(np.array(u, dtype=complex), np.array(v, dtype=complex)))
def cross(u, v): return np.cross(np.array(u, dtype=float), np.array(v, dtype=float)).tolist()
def norm(u): return float(np.linalg.norm(np.array(u, dtype=complex)))

def lim(f, x0, side=0):
    """Numerical limit of f at x0: side=0 two-sided (average), +1 from the right, -1 from the left."""
    def R(h):
        if side > 0: return f(x0 + h)
        if side < 0: return f(x0 - h)
        return (f(x0 + h) + f(x0 - h)) / 2
    h = 1e-3 * max(1.0, abs(x0))
    a, b, c = R(h), R(h / 2), R(h / 4)
    if side == 0:
        return (16 * c - 4 * b) / 12 + ((16 * c - 4 * b) / 12 - (4 * b - a) / 3) / 15
    # one-sided: error is O(h); two Richardson steps
    r1, r2 = 2 * b - a, 2 * c - b
    return (4 * r2 - r1) / 3

def liminf(f, sign=1):
    """Numerical limit as x -> +infinity (sign=1) or -infinity (sign=-1)."""
    x = 1e5 * sign
    a, b, c = f(x), f(2 * x), f(4 * x)
    r1, r2 = 2 * b - a, 2 * c - b
    return (4 * r2 - r1) / 3

def nsum(f, a, b):
    return sum(f(k) for k in range(int(a), int(b) + 1))

def series(f, a=0, maxn=2_000_000):
    """Sum of a FAST-converging series f(a) + f(a+1) + ... (stops when terms fall below 1e-17 of the sum)."""
    s, small = 0.0, 0
    for k in range(int(a), int(a) + maxn):
        t = f(k); s += t
        small = small + 1 if abs(t) <= 1e-17 * max(1.0, abs(s)) else 0
        if small >= 20: return s
    raise ValueError('series() did not converge fast enough; use a closed form checked another way')

def ivp(f, y0, t0, t1):
    """State at t1 of y' = f(t, y), y(t0) = y0 (y0 a number or list). Returns a number or list."""
    scalar = np.isscalar(y0)
    y0v = [y0] if scalar else list(y0)
    fun = (lambda t, y: [f(t, y[0])]) if scalar else (lambda t, y: f(t, y))
    sol = integrate.solve_ivp(fun, (t0, t1), y0v, method='DOP853', rtol=1e-12, atol=1e-13)
    yv = sol.y[:, -1].tolist()
    return yv[0] if scalar else yv

ENV = {
    '__builtins__': {'sum': sum, 'range': range, 'min': min, 'max': max, 'round': round, 'len': len, 'abs': abs,
                     'int': int, 'float': float, 'complex': complex, 'sorted': sorted, 'list': list, 'tuple': tuple,
                     'map': map, 'zip': zip, 'enumerate': enumerate, 'pow': pow, 'divmod': divmod, 'all': all, 'any': any,
                     'reversed': reversed, 'set': set, 'dict': dict, 'str': str, 'bool': bool, 'bin': bin, 'hex': hex, 'oct': oct, 'ord': ord, 'chr': chr, 'repr': repr, 'format': format, 'next': next, 'iter': iter, 'frozenset': frozenset, '__import__': __import__, 'hasattr': hasattr, 'getattr': getattr, 'isinstance': isinstance, 'filter': filter, 'True': True, 'False': False, 'None': None},
    'math': math, 'cmath': cmath, 'np': np, 'special': special, 'Fraction': Fraction,
    'sin': np.sin, 'cos': np.cos, 'tan': np.tan, 'arcsin': np.arcsin, 'arccos': np.arccos, 'arctan': np.arctan,
    'arctan2': np.arctan2, 'sinh': np.sinh, 'cosh': np.cosh, 'tanh': np.tanh, 'exp': np.exp, 'log': log, 'ln': log,
    'log10': np.log10, 'log2': np.log2, 'sqrt': sqrt, 'cbrt': np.cbrt, 'floor': math.floor, 'ceil': math.ceil,
    'sec': lambda x: 1 / np.cos(x), 'csc': lambda x: 1 / np.sin(x), 'cot': lambda x: 1 / np.tan(x),
    'pi': math.pi, 'e': math.e, 'inf': math.inf, 'I': 1j,
    'comb': math.comb, 'perm': math.perm, 'factorial': math.factorial, 'gamma': math.gamma, 'erf': math.erf,
    'quad': quad, 'quad2': quad2, 'quad3': quad3, 'nderiv': nderiv, 'pderiv': pderiv, 'root': root,
    'allroots': allroots, 'roots': roots, 'lin': lin, 'eig': eig, 'det': det, 'inv': inv, 'rank': rank, 'mat': mat,
    'dot': dot, 'cross': cross, 'norm': norm, 'lim': lim, 'liminf': liminf, 'nsum': nsum, 'series': series, 'ivp': ivp,
}
ENV['run'] = lambda src, stdin=None: run(src, stdin)

# ---------------- finance helpers for check expressions ----------------
# Spreadsheet sign conventions: money paid out is negative, money received positive; when=0 payments at the end of
# each period, when=1 at the beginning. npv() takes the first cash flow at time 0 (unlike a spreadsheet's NPV()).
import statistics as _stats
from decimal import Decimal as _Decimal, ROUND_HALF_UP as _RHU

def tvm_fv(rate, nper, pmt=0.0, pv=0.0, when=0):
    if rate == 0: return -(pv + pmt * nper)
    g = (1 + rate) ** nper
    return -(pv * g + pmt * (1 + rate * when) * (g - 1) / rate)

def tvm_pv(rate, nper, pmt=0.0, fv=0.0, when=0):
    if rate == 0: return -(fv + pmt * nper)
    g = (1 + rate) ** nper
    return -(fv + pmt * (1 + rate * when) * (g - 1) / rate) / g

def tvm_pmt(rate, nper, pv, fv=0.0, when=0):
    if rate == 0: return -(pv + fv) / nper
    g = (1 + rate) ** nper
    return -(fv + pv * g) * rate / ((1 + rate * when) * (g - 1))

def tvm_nper(rate, pmt, pv, fv=0.0, when=0):
    if rate == 0: return -(pv + fv) / pmt
    z = pmt * (1 + rate * when) / rate
    return math.log((z - fv) / (pv + z)) / math.log(1 + rate)

def tvm_rate(nper, pmt, pv, fv=0.0, when=0):
    f = lambda r: (pv + pmt * nper + fv) if abs(r) < 1e-12 else pv * (1 + r) ** nper + pmt * (1 + r * when) * ((1 + r) ** nper - 1) / r + fv
    rs = [x for x in allroots(f, -0.99, 2.0, 40001) if abs(x) > 1e-9 or abs(f(0.0)) < 1e-9]
    if len(rs) != 1:
        raise ValueError(f'tvm_rate: expected exactly one rate between -99% and 200% per period, found {len(rs)}')
    return rs[0]

def npv(rate, cashflows):
    return sum(cf / (1 + rate) ** t for t, cf in enumerate(cashflows))

def irr(cashflows, lo=-0.99, hi=10.0):
    rs = allroots(lambda r: npv(r, cashflows), lo, hi, 40001)
    if len(rs) != 1:
        raise ValueError(f'irr: expected exactly one IRR between {lo} and {hi}, found {len(rs)}')
    return rs[0]

def ncdf(x):
    return 0.5 * (1 + math.erf(x / math.sqrt(2)))

def ninv(p):
    return _stats.NormalDist().inv_cdf(p)

def bsm(S, K, T, r, sigma, q=0.0, kind='call'):
    """Black-Scholes-Merton price of a European option; r and q continuously compounded, T in years."""
    d1 = (math.log(S / K) + (r - q + sigma ** 2 / 2) * T) / (sigma * math.sqrt(T))
    d2 = d1 - sigma * math.sqrt(T)
    if kind == 'call':
        return S * math.exp(-q * T) * ncdf(d1) - K * math.exp(-r * T) * ncdf(d2)
    if kind == 'put':
        return K * math.exp(-r * T) * ncdf(-d2) - S * math.exp(-q * T) * ncdf(-d1)
    raise ValueError("kind must be 'call' or 'put'")

def bond_price(face, coupon_rate, ytm, years, freq=2):
    """Price on a coupon date (no accrued interest); coupon_rate and ytm are annual rates paid and compounded freq times a year."""
    n = round(years * freq)
    c, y = face * coupon_rate / freq, ytm / freq
    return sum(c / (1 + y) ** t for t in range(1, n + 1)) + face / (1 + y) ** n

def bond_ytm(price, face, coupon_rate, years, freq=2):
    return root(lambda y: bond_price(face, coupon_rate, y, years, freq) - price, -0.5, 5.0)

def mac_duration(face, coupon_rate, ytm, years, freq=2):
    """Macaulay duration in years."""
    n = round(years * freq)
    c, y = face * coupon_rate / freq, ytm / freq
    cfs = [c] * n
    cfs[-1] += face
    pvs = [cf / (1 + y) ** t for t, cf in enumerate(cfs, 1)]
    return sum(t * v for t, v in enumerate(pvs, 1)) / sum(pvs) / freq

def mod_duration(face, coupon_rate, ytm, years, freq=2):
    return mac_duration(face, coupon_rate, ytm, years, freq) / (1 + ytm / freq)

def cents(x):
    """Round half up to the cent, as a float (for checks of money that the prompt says to round)."""
    return float(_Decimal(repr(x)).quantize(_Decimal('0.01'), rounding=_RHU))

ENV.update({'tvm_fv': tvm_fv, 'tvm_pv': tvm_pv, 'tvm_pmt': tvm_pmt, 'tvm_nper': tvm_nper, 'tvm_rate': tvm_rate,
            'npv': npv, 'irr': irr, 'ncdf': ncdf, 'ninv': ninv, 'bsm': bsm, 'bond_price': bond_price,
            'bond_ytm': bond_ytm, 'mac_duration': mac_duration, 'mod_duration': mod_duration, 'cents': cents,
            'statistics': _stats, 'NormalDist': _stats.NormalDist, 'Decimal': _Decimal})

def run_c(src, stdin=None):
    """Compile a C program with gcc (C17) and return what it prints. For checks of C predict-the-output items."""
    with tempfile.TemporaryDirectory() as d:
        c, exe = os.path.join(d, 'prog.c'), os.path.join(d, 'prog')
        open(c, 'w').write(src)
        r = subprocess.run(['gcc', '-std=c17', '-O0', '-w', '-o', exe, c, '-lm'], capture_output=True, text=True, timeout=30)
        if r.returncode != 0:
            raise ValueError('the C program did not compile: ' + r.stderr.strip().split('\n')[0][:200])
        r = subprocess.run([exe], input=stdin or '', capture_output=True, text=True, timeout=10, cwd=d)
        return r.stdout

def sql(setup, query):
    """Run SQL setup statements in a fresh in-memory SQLite database, then one query; return its rows as a list of tuples."""
    import sqlite3
    con = sqlite3.connect(':memory:')
    try:
        con.executescript(setup)
        return [tuple(r) for r in con.execute(query).fetchall()]
    finally:
        con.close()

ENV['run_c'] = run_c
ENV['sql'] = sql

HARNESS = '/home/claude/finance/src/pyharness.py'

def harness(req, timeout=20):
    """Run one request through the exercise harness under CPython (isolated subprocess)."""
    t = time.time()
    try:
        r = subprocess.run([sys.executable, '-I', HARNESS], input=json.dumps(req), capture_output=True, text=True,
                           timeout=timeout, cwd=tempfile.gettempdir())
    except subprocess.TimeoutExpired:
        return {'result': 'timeout', 'out': '', 'tb': f'ran longer than {timeout} s', 'secs': timeout}
    if r.returncode != 0 or not r.stdout.strip():
        return {'result': 'error', 'out': '', 'tb': 'harness failed: ' + r.stderr[-300:], 'secs': time.time() - t}
    res = json.loads(r.stdout)
    res['secs'] = time.time() - t
    return res

def run(src, stdin=None):
    """Run a Python program (CPython) and return what it prints. For checks of predict-the-output items."""
    res = harness({'mode': 'run', 'src': src, 'stdin': stdin})
    if res['result'] != 'ok':
        raise ValueError('the program in run() failed: ' + (res.get('tb') or res['result']).strip().split('\n')[-1])
    return res['out']

def norm_text(s):
    """How text answers are compared: line by line, runs of spaces count as one, outer blank lines ignored."""
    lines = [re.sub(r'[ \t]+', ' ', l).strip() for l in str(s).replace('\r\n', '\n').split('\n')]
    while lines and not lines[0]: lines.pop(0)
    while lines and not lines[-1]: lines.pop()
    return '\n'.join(lines)

def run_check(code):
    return eval(code, dict(ENV))

def to_json_num(v):
    if isinstance(v, str):
        return v
    z = complex(v)
    if not (math.isfinite(z.real) and math.isfinite(z.imag)):
        if z.imag == 0 and math.isinf(z.real):
            return z.real
        return None
    return z.real if abs(z.imag) <= 1e-10 * max(1.0, abs(z.real)) else [z.real, z.imag]

def flatten_vals(v):
    if isinstance(v, (str,)):
        return [v]
    if isinstance(v, dict):
        v = list(v.values())
    if hasattr(v, 'tolist'):
        v = v.tolist()
    if isinstance(v, (list, tuple, set)):
        out = []
        for x in v:
            out.extend(flatten_vals(x))
        return out
    return [v]

def parse_domain(spec):
    out = {}
    if not spec: return out
    for part in re.split(r'[;,]', spec):
        m = re.match(r'^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:\s*(-?[\d.]+)\s*\.\.\s*(-?[\d.]+)\s*$', part)
        if m: out[m.group(1)] = (float(m.group(2)), float(m.group(3)))
    return out

# ---------------- validation ----------------
WORDS = lambda s: len(re.findall(r'\w+', re.sub(r'\$\$[\s\S]*?\$\$|\$[^$]*\$', ' m ', (s or '').replace('\\$', ' D '))))
AUTO = {'num', 'expr', 'list', 'tuple', 'mc', 'ms', 'code', 'text'}
NEEDS_CHECK = {'num', 'expr', 'list', 'tuple'}
MODEL_SECS = 2.0       # CPython time limit for a model solution with its tests
BROWSER_MS = 4000      # browser (Brython) time limit for the same; the site allows 8 s

def check_code(item, key, errs, warns, batch):
    if not item.get('model', '').strip(): errs.append(f'{key}: code item needs a model: block (the reference solution)'); return
    if not (item.get('tests', '').strip() or 'stdout' in item):
        errs.append(f'{key}: code item needs tests: (asserts) or stdout: (the exact expected output), or both'); return
    tests = item.get('tests', '')
    if tests.strip():
        try:
            compile(tests, '<tests>', 'exec')
        except SyntaxError as e:
            errs.append(f'{key}: tests do not compile: {e}'); return
        if not re.search(r'^assert\b', tests, re.M): errs.append(f'{key}: tests need at least one top-level assert line')
    if item.get('starter', '').strip():
        try:
            compile(item['starter'], '<starter>', 'exec')
        except SyntaxError as e:
            errs.append(f'{key}: starter does not compile (learners must be able to run it): {e}')
    req = {'mode': 'check', 'src': item['model'], 'tests': tests, 'expect': item.get('stdout'), 'stdin': item.get('stdin'), 'cases': item.get('cases')}
    if item.get('stdin') and 'stdout' in item and not item.get('cases') and not tests.strip():
        warns.append(f'{key}: a program that reads input is checked on one input only; add a second stdin:/stdout: pair so that a program ignoring its input cannot pass')
    res = harness(req)
    if res['result'] != 'pass':
        why = res.get('tb') or res.get('stdout_msg') or '; '.join(t['msg'] for t in res.get('tests', []) if not t['ok']) or res['result']
        errs.append(f'{key}: the model solution does not pass its own tests under CPython: {why.strip()[-400:]}'); return
    if res['secs'] > MODEL_SECS: errs.append(f"{key}: model solution plus tests take {res['secs']:.1f} s under CPython; keep the work small (the browser is slower)")
    sres = harness(dict(req, src=item.get('starter', '')))
    if sres['result'] == 'pass': errs.append(f'{key}: the starter code already passes the tests; the tests must require the learner\'s work')
    batch.setdefault('browser', []).append((key, dict(req, limit=8000)))
    for fld in ('starter', 'model', 'tests'):
        for ln in item.get(fld, '').split('\n'):
            if len(ln) > 100: warns.append(f'{key}: {fld} has a line longer than 100 characters'); break
        if '\t' in item.get(fld, ''): errs.append(f'{key}: {fld} contains a tab; indent with 4 spaces')

def check_text(item, key, errs, warns):
    ans = item.get('answer', '')
    if not str(ans).strip(): errs.append(f'{key}: text item needs an answer'); return
    if len(norm_text(ans).split('\n')) > 12: warns.append(f'{key}: text answer is long; keep predicted output to a few lines')
    if 'check' not in item:
        if 'nocheck' in item: warns.append(f"{key}: nocheck ({item['nocheck'][:60]})")
        else: errs.append(f'{key}: needs a check (usually run("...the program...")) or nocheck: <reason>')
        return
    try:
        val = run_check(item['check'])
    except Exception as e:
        errs.append(f"{key}: check failed to run: {type(e).__name__}: {str(e)[:200]}"); return
    if norm_text(val) != norm_text(ans):
        errs.append(f'{key}: answer {norm_text(ans)!r} does not match the check, which gives {norm_text(val)!r}')
    for a in item.get('accept', []):
        if norm_text(a) == norm_text(ans): warns.append(f'{key}: accept: {a!r} is the same as the answer after spacing is normalized')

def check_item(item, where, errs, warns, batch):
    t = item['type']
    key = f"{where} (line {item.get('line')})"
    if not item.get('prompt', '').strip(): errs.append(f'{key}: missing prompt')
    if not item.get('solution', '').strip(): errs.append(f'{key}: missing solution')
    if not item.get('hints'): errs.append(f'{key}: needs at least one hint')
    if len(item.get('hints', [])) > 4: warns.append(f'{key}: more than 4 hints')
    if t in ('mc', 'ms'):
        ch = item.get('choices', [])
        if not 3 <= len(ch) <= 6: errs.append(f'{key}: {t} needs 3-6 choices (has {len(ch)})')
        if len(set(c.strip() for c in ch)) != len(ch): errs.append(f'{key}: duplicate choices')
        if t == 'mc' and item.get('_ncorrect') != 1: errs.append(f'{key}: mc needs exactly one choice* (has {item.get("_ncorrect")})')
        if t == 'ms' and not item.get('_ncorrect'): errs.append(f'{key}: ms needs at least one choice*')
        for c in ch:
            if re.search(r'\b(all|none) of the above\b', c, re.I): errs.append(f'{key}: avoid "all/none of the above" (choices are shuffled)')
    if t == 'self' and len(item.get('rubric', [])) < 2: errs.append(f'{key}: self item needs at least 2 rubric lines')
    if t == 'num':
        unit = str(item.get('unit', '')).strip().lower()
        pr = re.sub(r'\$[^$]*\$', ' ', item.get('prompt', ''))
        if re.search(r'(as an? (annual |annualized |monthly )?percent(age)?\b(?! of)|what percent(age)?\b|percent(age)? change|as percent\b(?! of))', pr, re.I) \
                and not re.search(r'percentage points?', pr, re.I) and '%' not in unit and 'percent' not in unit:
            errs.append(f'{key}: the prompt asks for a percent: add "unit: %" and give the answer in percent (7.25, not 0.0725)')
        ans = str(item.get('answer', '')).strip()
        if re.search(r'[$%,]', ans):
            errs.append(f'{key}: write the answer as a plain number, without $, % or thousands separators (use lead: \\$ or unit: %)')
    if t == 'code': check_code(item, key, errs, warns, batch)
    if t == 'text': check_text(item, key, errs, warns)
    if t in NEEDS_CHECK:
        if not str(item.get('answer', '')).strip(): errs.append(f'{key}: missing answer'); return
        if t == 'expr' and not item.get('vars'): errs.append(f'{key}: expr needs vars'); return
        if 'check' not in item:
            if 'nocheck' in item: warns.append(f"{key}: nocheck ({item['nocheck'][:60]})")
            else: errs.append(f'{key}: needs a check (an independent Python computation) or nocheck: <reason>')
        bi = {k: item[k] for k in ('type', 'answer', 'vars', 'tol', 'const', 'form', 'unit', 'domain') if k in item}
        bi['key'] = key
        if 'check' in item:
            try:
                val = run_check(item['check'])
                if t == 'num':
                    if isinstance(val, str):
                        bi['expected'] = val.lower()
                    else:
                        fl = flatten_vals(val)
                        if len(fl) != 1: raise ValueError(f'num check must give one value, got {len(fl)}')
                        bi['expected'] = to_json_num(fl[0])
                        if bi['expected'] is None: raise ValueError('check gave a non-finite value')
                elif t in ('list', 'tuple'):
                    fl = flatten_vals(val)
                    bi['expected'] = [to_json_num(x) for x in fl]
                    if any(x is None for x in bi['expected']): raise ValueError('check gave a non-finite value')
                elif t == 'expr':
                    if not callable(val): raise ValueError('expr check must be a lambda taking ' + ', '.join(item['vars']))
                    dom = parse_domain(item.get('domain'))
                    rnd = random.Random(hash(item['answer']) % 100000 + 17)
                    points, values = [], []
                    for _ in range(6):
                        env = {v: rnd.uniform(*dom.get(v, (0.35, 2.65))) for v in item['vars']}
                        points.append(env)
                        try:
                            values.append(to_json_num(val(*[env[v] for v in item['vars']])))
                        except (ZeroDivisionError, ValueError, OverflowError):
                            values.append(None)
                    bi['expected'] = {'points': points, 'values': values}
            except Exception as e:
                errs.append(f"{key}: check failed to run: {type(e).__name__}: {str(e)[:160]}")
        batch['items'].append(bi)
    elif t in ('mc',):
        batch['items'].append({'key': key, 'type': 'mc', 'answer': item.get('answer')})
    for fld in ('prompt', 'solution', 'lead'):
        if item.get(fld): batch['tex'].append({'key': f'{key} {fld}', 'text': item[fld]})
    for k, h in enumerate(item.get('hints', [])): batch['tex'].append({'key': f'{key} hint {k+1}', 'text': h})
    for k, c in enumerate(item.get('choices', [])): batch['tex'].append({'key': f'{key} choice {k+1}', 'text': c})
    for k, r in enumerate(item.get('rubric', [])): batch['tex'].append({'key': f'{key} rubric {k+1}', 'text': r})


def validate(code, only=None):
    course = next((c for c in CATALOG if c['code'] == code), None)
    if not course:
        print(f'unknown course code {code}'); return 2
    d = os.path.join(CONTENT, code)
    errs, warns = [], []
    batch = {'items': [], 'tex': []}
    lessons = []
    for wk in range(1, 13):
        name = f'L{wk:02d}'
        path = os.path.join(d, name + '.txt')
        if only and name not in only:
            continue
        if not os.path.exists(path):
            errs.append(f'{name}: file missing'); continue
        try:
            L = parse_lesson(open(path, encoding='utf-8').read())
        except FormatError as e:
            errs.append(f'{name}: {e}'); continue
        L['id'] = f'{code}-{wk:02d}'; L['week'] = wk
        w = name
        if not L.get('title'): errs.append(f'{w}: missing title')
        if not L.get('summary'): errs.append(f'{w}: missing summary')
        if len(L.get('objectives', [])) < 2: errs.append(f'{w}: needs 2-4 objectives')
        nw = WORDS(L.get('article', ''))
        MINW = 100 if course.get('level') == 'elementary' else 180
        if nw < MINW: errs.append(f'{w}: article too short ({nw} words; aim for the length the brief gives for this level)')
        elif nw > 1200: warns.append(f'{w}: article long ({nw} words)')
        if not L['examples']: errs.append(f'{w}: needs at least one @example')
        for k, ex in enumerate(L['examples']):
            if len(ex['steps']) < 2: errs.append(f'{w}: example {k+1} needs at least 2 steps')
            batch['tex'].append({'key': f'{w} example {k+1} problem', 'text': ex['problem']})
            for j, st in enumerate(ex['steps']): batch['tex'].append({'key': f'{w} example {k+1} step {j+1}', 'text': st})
        if not 4 <= len(L['practice']) <= 7: errs.append(f"{w}: needs 4-7 @practice items (has {len(L['practice'])})")
        if not 2 <= len(L['quiz']) <= 3: errs.append(f"{w}: needs 2-3 @quiz items (has {len(L['quiz'])})")
        auto = sum(1 for it in L['practice'] + L['quiz'] if it['type'] in AUTO)
        if auto < 3: errs.append(f'{w}: at least 3 practice/quiz items must be auto-graded (code, text, num, expr, list, tuple, mc, ms)')
        ncode = sum(1 for it in L['practice'] + L['quiz'] if it['type'] == 'code')
        if course.get('profile') == 'P' and ncode < 2: errs.append(f'{w}: a programming (P) course needs at least 2 code items per lesson among practice and quiz (has {ncode})')
        for k, it in enumerate(L['practice']): check_item(it, f'{w} practice {k+1}', errs, warns, batch)
        for k, it in enumerate(L['quiz']): check_item(it, f'{w} quiz {k+1}', errs, warns, batch)
        for fld in ('article', 'summary', 'title', 'reading'):
            if L.get(fld): batch['tex'].append({'key': f'{w} {fld}', 'text': L[fld]})
        for k, o in enumerate(L.get('objectives', [])): batch['tex'].append({'key': f'{w} objective {k+1}', 'text': o})
        for k, m in enumerate(L.get('mistakes', [])): batch['tex'].append({'key': f'{w} mistake {k+1}', 'text': m})
        lessons.append(L)
    project = None
    ppath = os.path.join(d, 'project.txt')
    if not only or 'project' in only:
        if not os.path.exists(ppath):
            errs.append('project.txt: file missing')
        else:
            try:
                project = parse_project(open(ppath, encoding='utf-8').read())
                if not project.get('title'): errs.append('project: missing title')
                if len(project.get('steps', [])) < 3: errs.append('project: needs at least 3 steps')
                if len(project.get('deliverables', [])) < 2: errs.append('project: needs at least 2 deliverables')
                if len(project.get('rubric', [])) < 3: errs.append('project: needs at least 3 rubric lines')
                if WORDS(project.get('review', '')) < 120: errs.append('project: @review needs a real review guide (120+ words)')
                if not 2 <= len(project['exam']) <= 4: errs.append(f"project: needs 2-4 @exam items (has {len(project['exam'])})")
                for k, it in enumerate(project['exam']): check_item(it, f'project exam {k+1}', errs, warns, batch)
                for fld in ('overview', 'review', 'safety'):
                    if project.get(fld): batch['tex'].append({'key': f'project {fld}', 'text': project[fld]})
                for k, x in enumerate(project.get('tutor', [])):
                    if '\n' in x.strip(): errs.append(f'project: tutor {k+1} has extra lines after it; put supplied cases, data or sources in material: fields (one per item, after the steps), never after the tutor lines')
                for lst in ('goals', 'steps', 'materials', 'deliverables', 'rubric', 'tutor'):
                    for k, x in enumerate(project.get(lst, [])): batch['tex'].append({'key': f'project {lst} {k+1}', 'text': x})
            except FormatError as e:
                errs.append(f'project.txt: {e}')
    # browser Python: every model solution must also pass in the site's runner (Brython in Chromium)
    bro = batch.pop('browser', [])
    if bro and os.environ.get('TOE_SKIP_BROWSER') != '1':
        try:
            sys.path.insert(0, '/home/claude/finance/toolkit')
            from pycheck import run_requests
            results = run_requests([r for _, r in bro])
            for (key, _), res in zip(bro, results):
                if res.get('result') != 'pass':
                    why = res.get('tb') or res.get('stdout_msg') or '; '.join(t['msg'] for t in res.get('tests', []) if not t['ok']) or res.get('result')
                    errs.append(f"{key}: the model solution fails in the site's browser Python (Brython 3.14): {str(why).strip()[-400:]}. Use plainer standard Python; see the brief's list of what the browser cannot run.")
                elif res.get('wall_ms', 0) > BROWSER_MS:
                    errs.append(f"{key}: the model solution takes {res['wall_ms'] / 1000:.1f} s in the browser; keep tests small (under about 1 s)")
        except Exception as e:
            errs.append(f'internal: browser check failed: {type(e).__name__}: {str(e)[:300]}')
    # node: answers + TeX
    with tempfile.NamedTemporaryFile('w', suffix='.json', delete=False) as tf:
        json.dump(batch, tf)
        tpath = tf.name
    res = subprocess.run(['node', '/home/claude/finance/toolkit/verify.js', tpath], capture_output=True, text=True)
    os.unlink(tpath)
    if res.returncode != 0:
        errs.append('internal: verify.js failed: ' + res.stderr[-400:])
    else:
        for e in json.loads(res.stdout or '[]'):
            (warns if e.get('warn') else errs).append(f"{e['key']}: {e['msg']}")
    # write build output: only files with no errors are published
    bad = set()
    for e in errs:
        m = re.match(r'^(L\d\d|project)', e)
        bad.add(m.group(1) if m else '*')
    if not only and '*' not in bad:
        os.makedirs(BUILD, exist_ok=True)
        def clean(it):
            return {k: v for k, v in it.items() if k not in ('line', '_ncorrect', 'check', 'nocheck')}
        ready = [L for L in lessons if f"L{L['week']:02d}" not in bad]
        for L in ready:
            L['practice'] = [clean(i) for i in L['practice']]
            L['quiz'] = [clean(i) for i in L['quiz']]
        proj = project if (project and 'project' not in bad) else None
        if proj:
            proj['exam'] = [clean(i) for i in proj['exam']]
        out = os.path.join(BUILD, code + '.json')
        if ready or proj:
            json.dump({'code': code, 'lessons': ready, 'project': proj, 'ready': [L['week'] for L in ready]}, open(out, 'w'), ensure_ascii=False)
        elif os.path.exists(out):
            os.remove(out)
    for w in warns: print('warning:', w)
    for e in errs: print('ERROR:', e)
    n_items = sum(len(L['practice']) + len(L['quiz']) for L in lessons)
    print(f"{code}: {len(lessons)} lessons, {n_items} items, {len(errs)} errors, {len(warns)} warnings")
    return 0 if not errs else 1


if __name__ == '__main__':
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(2)
    sys.exit(validate(sys.argv[1], set(sys.argv[2:]) or None))
