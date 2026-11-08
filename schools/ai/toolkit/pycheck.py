"""Run exercise requests through the in-browser Python runner (Brython in headless Chromium).

usage as a module: results = run_requests([req, ...])   # req as for pyharness.handle, plus optional 'limit' (ms)
usage from the shell: python3 pycheck.py requests.json   # prints the results as JSON
Results are cached in /home/claude/ai/build/pycache/ by a hash of the request and of the runner build.
"""
import hashlib, json, os, sys, time

ROOT = '/home/claude/ai'
WORKER = f'{ROOT}/build/pyworker.js'
CACHE = f'{ROOT}/build/pycache'
PAGE_JS = r'''
window.PY = (function () {
  var url = URL.createObjectURL(new Blob([document.getElementById('pyworker').textContent], {type: 'text/javascript'}));
  var w = null, ready = null, pending = {}, seq = 0;
  function start() {
    w = new Worker(url);
    ready = new Promise(function (res, rej) {
      w.onmessage = function (ev) {
        if (ev.data && ev.data.ready) { res(ev.data.ms); return; }
        var p = pending[ev.data.id]; if (p) { delete pending[ev.data.id]; clearTimeout(p.timer); p.res(ev.data); if (ev.data.restart) { w.terminate(); start(); } }
      };
      w.onerror = function (e) { rej(e.message || String(e)); };
    });
  }
  start();
  return {
    run: function (req, limitMs) {
      var id = ++seq;
      return ready.then(function () {
        return new Promise(function (res) {
          var timer = setTimeout(function () { delete pending[id]; w.terminate(); start(); res({id: id, result: 'timeout', out: '', tb: ''}); }, limitMs);
          pending[id] = {res: res, timer: timer};
          req.id = id;
          w.postMessage(req);
        });
      });
    },
    ready: function () { return ready; }
  };
})();
'''


def _page_path():
    src = open(WORKER, encoding='utf-8').read().replace('</script', '<\\/script')
    h = hashlib.sha1(src.encode()).hexdigest()[:12]
    p = f'{CACHE}/page-{h}.html'
    if not os.path.exists(p):
        os.makedirs(CACHE, exist_ok=True)
        page = ('<!doctype html><html><head><meta charset="utf-8"><title>pycheck</title></head><body>'
                '<script type="text/js-worker" id="pyworker">' + src + '</script><script>' + PAGE_JS + '</script></body></html>')
        tmp = p + '.%d.tmp' % os.getpid()
        open(tmp, 'w', encoding='utf-8').write(page)
        os.replace(tmp, p)
    return p, h


def _key(req, h):
    body = json.dumps({k: req.get(k) for k in ('mode', 'src', 'tests', 'expect', 'stdin', 'files', 'limit', 'cases')}, sort_keys=True)
    return hashlib.sha1((h + body).encode()).hexdigest()


def run_requests(reqs, use_cache=True):
    page, h = _page_path()
    out = [None] * len(reqs)
    todo = []
    for i, r in enumerate(reqs):
        k = _key(r, h)
        cp = f'{CACHE}/{k}.json'
        if use_cache and os.path.exists(cp):
            try:
                out[i] = json.load(open(cp)); continue
            except Exception:
                pass
        todo.append((i, k))
    if todo:
        from playwright.sync_api import sync_playwright
        with sync_playwright() as p:
            b = p.chromium.launch()
            pg = b.new_page()
            errs = []
            pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.route('**/*', lambda r: r.continue_() if r.request.url.startswith(('file:', 'data:', 'blob:')) else r.abort())
            pg.goto('file://' + page)
            pg.evaluate('PY.ready()')
            for i, k in todo:
                req = dict(reqs[i])
                limit = int(req.pop('limit', 8000))
                t = time.time()
                res = pg.evaluate('([r, l]) => PY.run(r, l)', [req, limit])
                res['wall_ms'] = int((time.time() - t) * 1000)
                out[i] = res
                if res.get('result') != 'timeout':
                    tmp = f'{CACHE}/{k}.json.{os.getpid()}.tmp'
                    json.dump(res, open(tmp, 'w'))
                    os.replace(tmp, f'{CACHE}/{k}.json')
            b.close()
            if errs:
                raise RuntimeError('page errors: ' + '; '.join(errs)[:500])
    return out


if __name__ == '__main__':
    reqs = json.load(open(sys.argv[1]))
    print(json.dumps(run_requests(reqs, use_cache='--fresh' not in sys.argv), indent=1))
