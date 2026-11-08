"""Exercise the tutor drawer and account storage against a mocked window.claude (sample, db, user)."""
import sys, os, threading, http.server, functools, socketserver, json
from playwright.sync_api import sync_playwright
os.environ['PLAYWRIGHT_BROWSERS_PATH'] = '/opt/pw-browsers'
site = sys.argv[1]; shots = sys.argv[2] if len(sys.argv) > 2 else None
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
MOCK = r"""
(function(){
  const store = (window.__store = JSON.parse(sessionStorage.getItem('mockdb') || '{}'));
  const calls = (window.__calls = []);
  const db = { doc(path) { return { path, async get() { const d = store[path]; return { id: path.split('/').pop(), exists: !!d, data: () => d ? JSON.parse(JSON.stringify(d)) : undefined, metadata: {} }; },
                                    async set(body) { calls.push(['set', path, JSON.stringify(body).length]); store[path] = JSON.parse(JSON.stringify(body)); sessionStorage.setItem('mockdb', JSON.stringify(store)); } }; } };
  const user = { async id() { return 'u_test123'; }, async isOwner() { return true; } };
  const sample = async function (input, opts) {
    calls.push(['sample', Array.isArray(input) ? input.length : 1, JSON.stringify(input).length, !!(opts && opts.images)]);
    const t = 'Look at the first step. What happens to $x$ when you subtract $5$? $$3x = 15$$';
    await new Promise(r => setTimeout(r, 50));
    opts && opts.onText && opts.onText({ text: t, delta: t });
    return { text: t, truncated: false, modelTierApplied: 'default' };
  };
  sample.limits = async () => ({ maxPromptBytes: 262144, images: { maxCount: 1, maxInputBytes: 20000000, mediaTypes: ['image/png', 'image/jpeg'] } });
  sample.json = async (input) => { calls.push(['json']); return [
    { type: 'num', prompt: 'Solve $2x + 3 = 11$.', answer: '4', hints: ['Subtract 3.'], solution: '$x = 4$.' },
    { type: 'mc', prompt: 'Pick the even number.', choices: ['3', '4', '5', '7'], answer: 1, hints: ['Divisible by 2.'], solution: '4.' },
    { type: 'num', prompt: 'Broken one', answer: 'x+', hints: [], solution: 'none' } ]; };
  window.claude = { use: async (name) => ({ sample, db, user })[name] || null };
})();
"""
errs = []
with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={'width': 1280, 'height': 900})
    page.add_init_script(MOCK)
    page.route('**/cdnjs.cloudflare.com/**', lambda r: r.fulfill(status=200, content_type='application/javascript', body=KJS))
    page.route('**/fonts.g*/**', lambda r: r.abort())
    page.on('pageerror', lambda e: errs.append(f'pageerror: {e}'))
    page.on('console', lambda m: errs.append(f'console.{m.type}: {m.text}') if m.type == 'error' and 'ERR_FAILED' not in m.text else None)
    page.goto(f'http://127.0.0.1:{port}/_test.html#lesson-f1-03'); page.wait_for_timeout(900)
    print('save state:', page.inner_text('#save-state'))
    page.click('[data-tutor="lesson"]'); page.wait_for_timeout(300)
    print('drawer ctx:', page.inner_text('#t-ctx'))
    print('quick:', page.inner_text('#t-quick').replace('\n', ' | '))
    page.fill('#t-in', 'Why do we undo operations in reverse order?')
    page.click('#t-send'); page.wait_for_timeout(500)
    print('msgs:', page.inner_text('#t-msgs')[:200].replace('\n', ' | '))
    if shots: page.screenshot(path=os.path.join(shots, 'tutor.png'))
    page.click('[data-q="__practice__"]'); page.wait_for_timeout(600)
    print('ai practice view:', page.inner_text('main')[:220].replace('\n', ' | '))
    page.evaluate("location.hash = 'practice-f1-03'"); page.wait_for_timeout(500)
    page.fill('#ans', '7'); page.click('#check'); page.wait_for_timeout(200)
    if not page.query_selector('#next'): page.click('#showsol'); page.wait_for_timeout(200)
    page.click('#next'); page.wait_for_timeout(200)
    page.click('#tutor-btn'); page.wait_for_timeout(200)
    print('question ctx:', page.inner_text('#t-ctx'))
    page.click('[data-q="Give me a hint"]'); page.wait_for_timeout(400)
    page.evaluate("location.hash = 'quiz-f1-2'"); page.wait_for_timeout(500)
    print('quiz tutor:', page.inner_text('#t-msgs')[:120].replace('\n', ' | '))
    page.evaluate("ToEApp.Store.data.skills['F1-01'] = {level: 2, n: 1}; ToEApp.Store.touch('progress'); ToEApp.Store.elog.entries.push({id:'x', key:'F1-01:p0', code:'F1', lessonId:'F1-01', status:'open', retryAfter: 0}); ToEApp.Store.touch('errorlog');")
    page.wait_for_timeout(2600)
    print('remote progress level:', page.evaluate("JSON.stringify(window.__store['data/users/u_test123/progress'] && window.__store['data/users/u_test123/progress'].skills)"))
    page.reload(); page.wait_for_timeout(1200)
    page.evaluate("localStorage.clear()")
    page.reload(); page.wait_for_timeout(1500)
    print('after reload with cleared local storage, level =', page.evaluate("ToEApp.level('F1-01')"))
    calls = page.evaluate('window.__calls')
    print('calls:', calls)
    store = page.evaluate('Object.keys(window.__store)')
    print('stored docs:', store)
    b.close()
httpd.shutdown()
print('\n'.join(errs) if errs else 'no errors')
