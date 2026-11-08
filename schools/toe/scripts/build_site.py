"""Assemble site/index.html (one self-contained page) and site/data/*.json from the sources."""
import base64, json, os, re, shutil, glob

SRC = '/home/claude/toe/src'
SITE = '/home/claude/toe/site'
KATEX = '/opt/npm-tools/node_modules/katex/dist'

def read(p):
    return open(p, encoding='utf-8').read()

def katex_css():
    css = read(os.path.join(KATEX, 'katex.min.css'))
    def repl(m):
        name = m.group(1)
        data = base64.b64encode(open(os.path.join(KATEX, 'fonts', name + '.woff2'), 'rb').read()).decode()
        return 'src:url(data:font/woff2;base64,' + data + ') format("woff2")'
    css, n = re.subn(r'src:url\(fonts/(KaTeX_[A-Za-z0-9_-]+)\.woff2\) format\("woff2"\)(?:,url\([^)]*\) format\("[a-z]+"\))*', repl, css)
    assert n >= 18, f'only {n} font faces inlined'
    return css

def main():
    os.makedirs(os.path.join(SITE, 'data'), exist_ok=True)
    tpl = read(os.path.join(SRC, 'index.template.html'))
    gen_path = os.path.join(SRC, 'generators.good.js')
    gens = read(gen_path) if os.path.exists(gen_path) else 'window.ToEGen = { has: function () { return false; }, make: function () { return null; } };'
    app = '\n'.join(read(os.path.join(SRC, f)) for f in ('app_core.js', 'app_ex.js', 'app_tutor.js', 'app_static.js'))
    app += "\nwindow.ToEApp.katexReady = function () { var h = (location.hash || '').slice(1); var s = window.ToEApp.sessions[h]; if (s) window.ToEApp.renderSession(s); else window.ToEApp.render(); };\nwindow.ToEApp.boot();\n"
    catalog = read(os.path.join(SRC, 'catalog.json'))
    ready = {}
    for f in sorted(glob.glob('/home/claude/toe/build/*.json')):
        d = json.load(open(f))
        ready[d['code']] = {'weeks': sorted(L['week'] for L in d['lessons']), 'project': bool(d.get('project'))}
    catalog = catalog + ';\nwindow.TOE_READY = ' + json.dumps(ready, separators=(',', ':'))
    out = (tpl.replace('/*APP_CSS*/', read(os.path.join(SRC, 'app.css')))
              .replace('/*KATEX_CSS*/', katex_css())
              .replace('/*CHECKER*/', read(os.path.join(SRC, 'checker.js')))
              .replace('/*MATHTEXT*/', read(os.path.join(SRC, 'mathtext.js')))
              .replace('/*GENERATORS*/', gens)
              .replace('/*CATALOG*/', catalog)
              .replace('/*APP*/', app))
    assert '</script' not in catalog
    open(os.path.join(SITE, 'index.html'), 'w', encoding='utf-8').write(out)
    n = 0
    for f in glob.glob(os.path.join(SITE, 'data', '*.json')):
        os.remove(f)
    for f in glob.glob('/home/claude/toe/build/*.json'):
        shutil.copy(f, os.path.join(SITE, 'data', os.path.basename(f))); n += 1
    print('ready:', ', '.join(f"{k} {len(v['weeks'])}/12{'+P' if v['project'] else ''}" for k, v in ready.items()))
    print(f'index.html {len(out)/1024:.0f} KB; {n} course files copied')

if __name__ == '__main__':
    main()
