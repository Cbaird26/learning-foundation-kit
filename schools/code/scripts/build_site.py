"""Assemble the offline site: one self-contained HTML file with the app, KaTeX, the catalog, every finished course and the
in-page Python runner embedded.
Output: /home/claude/code/site/coding-learning-foundation.html (opens by double-click, no server or network needed)."""
import base64, json, os, re, glob, hashlib, subprocess, sys, tempfile
from concurrent.futures import ThreadPoolExecutor

ROOT = '/home/claude/code'
SRC = f'{ROOT}/src'
SITE = f'{ROOT}/site'
KATEX = '/opt/npm-tools/node_modules/katex/dist'
OUT = f'{SITE}/coding-learning-foundation.html'
HARNESS = f'{SRC}/pyharness.py'
RUNCACHE = f'{ROOT}/build/runnable-cache-v2.json'  # a block gets "Try it" only if it runs the same in CPython and in the browser

def read(p):
    return open(p, encoding='utf-8').read()

def katex_css():
    css = read(os.path.join(KATEX, 'katex.min.css'))
    def repl(m):
        data = base64.b64encode(open(os.path.join(KATEX, 'fonts', m.group(1) + '.woff2'), 'rb').read()).decode()
        return 'src:url(data:font/woff2;base64,' + data + ') format("woff2")'
    css, n = re.subn(r'src:url\(fonts/(KaTeX_[A-Za-z0-9_-]+)\.woff2\) format\("woff2"\)(?:,url\([^)]*\) format\("[a-z]+"\))*', repl, css)
    assert n >= 18, f'only {n} font faces inlined'
    return css

GEN_ALIAS = """
(function () {
  var G = window.ToEGen; if (!G) return;
  var A = { H1: 'F1', H3: 'F2', H4: 'F3', H5: 'M1' };
  function m(id) { var p = String(id).split('-'); return A[p[0]] ? A[p[0]] + '-' + p[1] : null; }
  window.ToEGen = { has: function (id) { var o = m(id); return !!o && G.has(o); }, make: function (id, seed) { var o = m(id); return o ? G.make(o, seed) : null; } };
})();
"""

def safe_js(s):
    return s.replace('</script', '<\\/script')

def safe_json(s):
    """JSON text that cannot end or confuse an inline script element: every '<' that could start a tag or comment is escaped."""
    return re.sub(r'<(?=/|!--|script)', r'\\u003c', s, flags=re.I)

# ---- "Try it": mark Python blocks in articles and examples that run cleanly as runnable ----
FENCE = re.compile(r'```python\n([\s\S]*?)```')

VOLATILE = re.compile(r'\b(random|time|datetime|uuid|secrets|unittest|logging)\b')  # output may differ from run to run


def _cpython_out(src):
    """The block's output under CPython, or None if it is not a clean, short, non-interactive run."""
    if re.search(r'\binput\s*\(', src) or 'while True' in src:
        return None
    try:
        r = subprocess.run([sys.executable, '-I', HARNESS], input=json.dumps({'mode': 'run', 'src': src}), capture_output=True,
                           text=True, timeout=10, cwd=tempfile.gettempdir())
        res = json.loads(r.stdout)
    except Exception:
        return None
    if res.get('result') == 'ok' and len(res.get('out', '')) < 5000:
        return res.get('out', '')
    return None


def mark_runnable(courses):
    cache = {}
    if os.path.exists(RUNCACHE):
        try: cache = json.load(open(RUNCACHE))
        except Exception: cache = {}
    texts = []
    for d in courses:
        for L in d.get('lessons', []):
            texts.append(L.get('article', ''))
            for ex in L.get('examples', []):
                texts.append(ex.get('problem', ''))
                texts.extend(ex.get('steps', []))
    key = lambda b: hashlib.sha1(b.encode()).hexdigest()
    todo = sorted({b for t in texts for b in FENCE.findall(t or '') if key(b) not in cache})
    with ThreadPoolExecutor(4) as pool:
        cout = dict(zip(todo, pool.map(_cpython_out, todo)))
    clean = [b for b in todo if cout[b] is not None]
    if clean:
        sys.path.insert(0, f'{ROOT}/toolkit')
        from pycheck import run_requests
        for b, r in zip(clean, run_requests([{'mode': 'run', 'src': b, 'stdin': None, 'limit': 6000} for b in clean])):
            same = r.get('result') == 'ok' and (r.get('out', '') == cout[b] or bool(VOLATILE.search(b)))
            cache[key(b)] = same
            if not same:
                print('no Try it (browser differs):', b.splitlines()[0][:70], '|', (r.get('tb') or r.get('out') or '').strip().splitlines()[-1:])
    for b in todo:
        cache.setdefault(key(b), False)
    json.dump(cache, open(RUNCACHE, 'w'))
    def mark(t):
        return FENCE.sub(lambda m: ('```python-run\n' if cache.get(key(m.group(1))) else '```python\n') + m.group(1) + '```', t or '')
    for d in courses:
        for L in d.get('lessons', []):
            L['article'] = mark(L.get('article', ''))
            for ex in L.get('examples', []):
                ex['problem'] = mark(ex.get('problem', ''))
                ex['steps'] = [mark(x) for x in ex.get('steps', [])]
    return sum(1 for t in texts for b in FENCE.findall(t or '') if cache.get(key(b)))

def main():
    os.makedirs(SITE, exist_ok=True)
    tpl = read(os.path.join(SRC, 'index.template.html'))
    gens = read(os.path.join(SRC, 'generators.good.js')) + GEN_ALIAS
    app = '\n'.join(read(os.path.join(SRC, f)) for f in ('pyrunner.js', 'app_core.js', 'app_code.js', 'app_ex.js', 'app_tutor.js', 'app_static.js'))
    app += "\nwindow.ToEApp.katexReady = function () { var h = (location.hash || '').slice(1); var s = window.ToEApp.sessions[h]; if (s) window.ToEApp.renderSession(s); else window.ToEApp.render(); };\nwindow.ToEApp.boot();\n"
    ready, blocks, courses = {}, [], []
    codes = {c['code'] for c in json.load(open(os.path.join(SRC, 'catalog.json')))['courses']}
    for f in sorted(glob.glob(f'{ROOT}/build/*.json')):
        if os.path.basename(f)[:-5] not in codes:
            continue
        d = json.load(open(f, encoding='utf-8'))
        if d.get('lessons'):
            courses.append(d)
    nrun = mark_runnable(courses)
    for d in courses:
        ready[d['code']] = {'weeks': sorted(L['week'] for L in d['lessons']), 'project': bool(d.get('project'))}
        blob = safe_json(json.dumps(d, ensure_ascii=False, separators=(',', ':')))
        blocks.append(f'<script type="application/json" id="course-{d["code"]}">{blob}</script>')
    catalog = safe_json(read(os.path.join(SRC, 'catalog.json'))) + ';\nwindow.TOE_READY = ' + json.dumps(ready, separators=(',', ':'))
    assert '</script' not in catalog
    sys.path.insert(0, os.path.join(ROOT, 'scripts'))
    import pyworker
    wpath, _ = pyworker.build()
    worker = safe_json(json.dumps(read(wpath), ensure_ascii=False))
    assert '</script' not in worker.lower() and '<!--' not in worker
    body = (tpl.replace('/*APP_CSS*/', read(os.path.join(SRC, 'app.css')))
               .replace('/*KATEX_CSS*/', katex_css())
               .replace('/*KATEX_JS*/', safe_js(read(os.path.join(KATEX, 'katex.min.js'))))
               .replace('/*CHECKER*/', safe_js(read(os.path.join(SRC, 'checker.js'))))
               .replace('/*MATHTEXT*/', safe_js(read(os.path.join(SRC, 'mathtext.js'))))
               .replace('/*GENERATORS*/', safe_js(gens))
               .replace('/*CATALOG*/', catalog)
               .replace('<script>\n/*COURSE_DATA*/\n</script>', '\n'.join(blocks))
               .replace('/*PYWORKER*/', worker)
               .replace('/*APP*/', safe_js(app)))
    body = re.sub(r'<meta name="claude:[^"]*"[^>]*>\n?', '', body)
    cut = body.index('<header class="topbar">')
    head, rest = body[:cut], body[cut:]
    page = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
            + head + '</head>\n<body>\n' + rest + '\n</body>\n</html>\n')
    open(OUT, 'w', encoding='utf-8').write(page)
    print('ready:', ', '.join(f"{k} {len(v['weeks'])}/12{'+P' if v['project'] else ''}" for k, v in ready.items()) or 'none')
    print(f'{os.path.basename(OUT)}: {len(page) / 1024 / 1024:.1f} MB, {len(ready)} courses embedded, {nrun} runnable code blocks')

if __name__ == '__main__':
    main()
