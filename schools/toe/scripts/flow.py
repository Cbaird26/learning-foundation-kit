"""Click through a full practice session, a unit quiz and the error log in headless Chromium."""
import sys, os, threading, http.server, functools, socketserver
from playwright.sync_api import sync_playwright
os.environ['PLAYWRIGHT_BROWSERS_PATH'] = '/opt/pw-browsers'
site = sys.argv[1]
code = sys.argv[2] if len(sys.argv) > 2 else 'f1'
shots = sys.argv[3] if len(sys.argv) > 3 else None
SK = ('<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover">'
      '<style>:root{color-scheme:light}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>')
raw = open(os.path.join(site, 'index.html'), encoding='utf-8').read()
open(os.path.join(site, '_test.html'), 'w', encoding='utf-8').write(SK + raw + '</body></html>')
class Q(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *a): pass
httpd = socketserver.TCPServer(('127.0.0.1', 0), functools.partial(Q, directory=site))
port = httpd.server_address[1]
threading.Thread(target=httpd.serve_forever, daemon=True).start()
KJS = open('/opt/npm-tools/node_modules/katex/dist/katex.min.js').read()
errs = []
with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={'width': 1200, 'height': 900})
    page.route('**/cdnjs.cloudflare.com/**', lambda r: r.fulfill(status=200, content_type='application/javascript', body=KJS))
    page.route('**/fonts.g*/**', lambda r: r.abort())
    page.on('pageerror', lambda e: errs.append(f'pageerror: {e}'))
    page.on('console', lambda m: errs.append(f'console.{m.type}: {m.text}') if m.type == 'error' and 'ERR_FAILED' not in m.text else None)
    page.goto(f'http://127.0.0.1:{port}/_test.html#practice-{code}-01')
    page.wait_for_timeout(800)
    for k in range(8):
        if page.query_selector('#showsol'):
            page.click('#showsol'); page.wait_for_timeout(120)
        elif page.query_selector('#reveal'):
            page.click('#reveal'); page.wait_for_timeout(120)
            if page.query_selector('[data-self="no"]'): page.click('[data-self="no"]'); page.wait_for_timeout(120)
        nb = page.query_selector('#next')
        if nb: nb.click(); page.wait_for_timeout(200)
        if page.query_selector('.score-big'): break
    print('practice result:', page.inner_text('.results')[:160].replace('\n', ' | ') if page.query_selector('.results') else 'NO RESULTS')
    page.evaluate(f"location.hash = 'quiz-{code}-1'"); page.wait_for_timeout(600)
    for k in range(10):
        if page.query_selector('input[name="ch"]'):
            page.click('.choice'); page.wait_for_timeout(60)
        elif page.query_selector('#ans') and page.eval_on_selector('#ans', 'e => e.tagName') == 'INPUT':
            page.fill('#ans', '1')
        if page.query_selector('#reveal'):
            page.click('#reveal'); page.wait_for_timeout(100)
            if page.query_selector('[data-self="yes"]'): page.click('[data-self="yes"]'); page.wait_for_timeout(100)
        if page.query_selector('#check'): page.click('#check'); page.wait_for_timeout(120)
        if page.query_selector('#next'): page.click('#next'); page.wait_for_timeout(150)
        if page.query_selector('.score-big'): break
    print('quiz result:', page.inner_text('.results')[:160].replace('\n', ' | ') if page.query_selector('.results') else 'NO RESULTS')
    page.evaluate("location.hash = 'errors'"); page.wait_for_timeout(800)
    print('error log:', page.inner_text('main')[:300].replace('\n', ' | '))
    if shots: page.screenshot(path=os.path.join(shots, 'errors.png'))
    rb = page.query_selector('[data-retry]')
    if rb:
        rb.click(); page.wait_for_timeout(600)
        print('retry view:', page.inner_text('main')[:160].replace('\n', ' | '))
    page.evaluate(f"location.hash = 'course-{code}'"); page.wait_for_timeout(700)
    print('course:', page.inner_text('.mastery-card')[:200].replace('\n', ' | '))
    page.evaluate(f"location.hash = 'final-{code}'"); page.wait_for_timeout(600)
    page.click('#begin'); page.wait_for_timeout(300)
    for k in range(20):
        if page.query_selector('#skip'): page.click('#skip'); page.wait_for_timeout(80)
        if page.query_selector('.score-big'): break
    print('final:', page.inner_text('.results')[:120].replace('\n', ' | ') if page.query_selector('.results') else 'NO RESULTS')
    b.close()
httpd.shutdown()
print('\n'.join(errs) if errs else 'no errors')
