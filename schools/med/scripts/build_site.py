"""Assemble the offline site: one self-contained HTML file with the app, KaTeX, the catalog and every finished course embedded.
Output: /home/claude/med/site/med-school-learning-foundation.html (opens by double-click, no server or network needed)."""
import base64, json, os, re, glob

ROOT = '/home/claude/med'
SRC = f'{ROOT}/src'
SITE = f'{ROOT}/site'
KATEX = '/opt/npm-tools/node_modules/katex/dist'
OUT = f'{SITE}/med-school-learning-foundation.html'

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

def main():
    os.makedirs(SITE, exist_ok=True)
    tpl = read(os.path.join(SRC, 'index.template.html'))
    gens = read(os.path.join(SRC, 'generators.good.js')) + GEN_ALIAS
    app = '\n'.join(read(os.path.join(SRC, f)) for f in ('app_core.js', 'app_ex.js', 'app_tutor.js', 'app_static.js'))
    app += "\nwindow.ToEApp.katexReady = function () { var h = (location.hash || '').slice(1); var s = window.ToEApp.sessions[h]; if (s) window.ToEApp.renderSession(s); else window.ToEApp.render(); };\nwindow.ToEApp.boot();\n"
    ready, blocks = {}, []
    for f in sorted(glob.glob(f'{ROOT}/build/*.json')):
        d = json.load(open(f, encoding='utf-8'))
        if not d.get('lessons'):
            continue
        ready[d['code']] = {'weeks': sorted(L['week'] for L in d['lessons']), 'project': bool(d.get('project'))}
        blob = json.dumps(d, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
        blocks.append(f'<script type="application/json" id="course-{d["code"]}">{blob}</script>')
    catalog = read(os.path.join(SRC, 'catalog.json')) + ';\nwindow.TOE_READY = ' + json.dumps(ready, separators=(',', ':'))
    assert '</script' not in catalog
    body = (tpl.replace('/*APP_CSS*/', read(os.path.join(SRC, 'app.css')))
               .replace('/*KATEX_CSS*/', katex_css())
               .replace('/*KATEX_JS*/', safe_js(read(os.path.join(KATEX, 'katex.min.js'))))
               .replace('/*CHECKER*/', safe_js(read(os.path.join(SRC, 'checker.js'))))
               .replace('/*MATHTEXT*/', safe_js(read(os.path.join(SRC, 'mathtext.js'))))
               .replace('/*GENERATORS*/', safe_js(gens))
               .replace('/*CATALOG*/', catalog)
               .replace('<script>\n/*COURSE_DATA*/\n</script>', '\n'.join(blocks))
               .replace('/*APP*/', safe_js(app)))
    body = re.sub(r'<meta name="claude:[^"]*"[^>]*>\n?', '', body)
    cut = body.index('<header class="topbar">')
    head, rest = body[:cut], body[cut:]
    page = ('<!doctype html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n'
            '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
            + head + '</head>\n<body>\n' + rest + '\n</body>\n</html>\n')
    open(OUT, 'w', encoding='utf-8').write(page)
    print('ready:', ', '.join(f"{k} {len(v['weeks'])}/12{'+P' if v['project'] else ''}" for k, v in ready.items()) or 'none')
    print(f'{os.path.basename(OUT)}: {len(page) / 1024 / 1024:.1f} MB, {len(ready)} courses embedded')

if __name__ == '__main__':
    main()
