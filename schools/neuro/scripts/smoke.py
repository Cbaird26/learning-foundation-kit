"""Smoke-test the built site in headless Chromium: visit every view, click through a practice question, collect errors.
usage: python3 smoke.py SITE_DIR [--shots OUTDIR] [--hashes h1,h2]"""
import sys, os, threading, http.server, functools, socketserver, json
from playwright.sync_api import sync_playwright

site = sys.argv[1]
shots = sys.argv[sys.argv.index('--shots') + 1] if '--shots' in sys.argv else None
hashes = sys.argv[sys.argv.index('--hashes') + 1].split(',') if '--hashes' in sys.argv else [
    'home', 'courses', 'course-f1', 'lesson-f1-03', 'practice-f1-03', 'quiz-f1-2', 'start', 'errors', 'method', 'path', 'project-f1', 'course-g7b', 'lesson-p7a-04']
os.environ['PLAYWRIGHT_BROWSERS_PATH'] = '/opt/pw-browsers'

SKELETON_HEAD = ('<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover">'
                 '<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>')
raw = open(os.path.join(site, 'index.html'), encoding='utf-8').read()
if not raw.startswith('<!doctype'):
    open(os.path.join(site, '_test.html'), 'w', encoding='utf-8').write(SKELETON_HEAD + raw + '</body></html>')
    PAGE = '_test.html'
else:
    PAGE = 'index.html'

class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
httpd = socketserver.TCPServer(('127.0.0.1', 0), functools.partial(Q, directory=site))
port = httpd.server_address[1]
threading.Thread(target=httpd.serve_forever, daemon=True).start()
KATEX_JS = open('/opt/npm-tools/node_modules/katex/dist/katex.min.js').read()

errors = []
with sync_playwright() as p:
    b = p.chromium.launch()
    for width, tag in ((1280, 'desk'), (390, 'phone')):
        ctx = b.new_context(viewport={'width': width, 'height': 900}, color_scheme='light' if tag == 'desk' else 'dark')
        page = ctx.new_page()
        page.route('**/cdnjs.cloudflare.com/**', lambda r: r.fulfill(status=200, content_type='application/javascript', body=KATEX_JS))
        page.route('**/fonts.googleapis.com/**', lambda r: r.abort())
        page.route('**/fonts.gstatic.com/**', lambda r: r.abort())
        page.on('console', lambda m: errors.append(f'[{tag}] console.{m.type}: {m.text}') if m.type in ('error', 'warning') else None)
        page.on('pageerror', lambda e: errors.append(f'[{tag}] pageerror: {e}'))
        page.goto(f'http://127.0.0.1:{port}/{PAGE}#home')
        page.wait_for_timeout(600)
        for h in hashes:
            page.evaluate(f"location.hash = '{h}'")
            page.wait_for_timeout(500)
            overflow = page.evaluate('document.documentElement.scrollWidth - window.innerWidth')
            if overflow > 1:
                errors.append(f'[{tag}] #{h}: horizontal overflow {overflow}px')
            txt = page.inner_text('main')[:120].replace('\n', ' | ')
            if 'Something went wrong' in txt:
                errors.append(f'[{tag}] #{h}: view error')
            if shots and tag == 'desk' and h in ('home', 'course-f1', 'lesson-f1-03'):
                page.screenshot(path=os.path.join(shots, f'{tag}-{h}.png'), full_page=False)
            if shots and tag == 'phone' and h in ('home', 'practice-f1-03'):
                page.screenshot(path=os.path.join(shots, f'{tag}-{h}.png'), full_page=False)
            if h.startswith('practice-'):
                # answer the first question with garbage then the right thing if possible
                inp = page.query_selector('#ans')
                if inp and inp.evaluate('el => el.tagName') == 'INPUT':
                    inp.fill('2x+')
                    page.wait_for_timeout(100)
                    page.click('#check')
                    page.wait_for_timeout(150)
                    page.fill('#ans', '7')
                    page.click('#check')
                    page.wait_for_timeout(200)
                    fb = page.inner_text('.ex-card')[:300].replace('\n', ' | ')
                    print(f'[{tag}] practice feedback:', fb[:200])
                    if shots and tag == 'desk':
                        page.screenshot(path=os.path.join(shots, f'{tag}-practice-answered.png'))
        ctx.close()
    b.close()
httpd.shutdown()
print('\n'.join(errors) if errors else 'no errors')
