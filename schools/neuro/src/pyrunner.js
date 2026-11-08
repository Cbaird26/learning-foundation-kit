/* Finance Learning Foundation — the in-page Python runner.
   Python (Brython) runs in a Web Worker made from the inline <script type="text/js-worker" id="pyworker">, so the page
   stays responsive and a program that runs too long can be stopped by ending the worker and starting a fresh one. */
(function () {
  'use strict';
  const RUN_MS = 6000, CHECK_MS = 10000, START_MS = 90000;
  const PY = {
    state: 'idle',            // idle | starting | ready | busy | failed
    reason: '',
    worker: null, url: null, readyP: null, pending: new Map(), seq: 0, listeners: new Set(), startedAt: 0, bootMs: 0,
    available() {
      return typeof Worker !== 'undefined' && typeof Blob !== 'undefined' && typeof URL !== 'undefined' && !!document.getElementById('pyworker');
    },
    onStatus(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); },
    set(state, reason) {
      this.state = state; if (reason !== undefined) this.reason = reason;
      this.listeners.forEach((f) => { try { f(state, this.reason); } catch (e) { /* a listener whose element is gone */ } });
    },
    statusText() {
      return { idle: 'Python is not started yet', starting: 'Starting Python… (the first start takes a few seconds)', ready: 'Python is ready',
        busy: 'Running…', failed: 'Python could not start: ' + this.reason }[this.state] || '';
    },
    start() {
      if (this.readyP) return this.readyP;
      if (!this.available()) {
        this.set('failed', 'this browser cannot run background scripts (Web Workers)');
        return Promise.reject(new Error(this.reason));
      }
      if (!this.url) {
        const el = document.getElementById('pyworker');
        const src = el.type === 'application/json' ? JSON.parse(el.textContent) : el.textContent;
        this.url = URL.createObjectURL(new Blob([src], { type: 'text/javascript' }));
      }
      this.set('starting', '');
      this.startedAt = Date.now();
      this.readyP = new Promise((resolve, reject) => {
        let w;
        try { w = new Worker(this.url); } catch (e) {
          this.readyP = null; this.set('failed', 'the browser blocked the Python worker (' + (e && e.message || e) + ')'); reject(e); return;
        }
        this.worker = w;
        let booted = false;
        const timer = setTimeout(() => { if (!booted) { w.terminate(); this.worker = null; this.readyP = null; this.set('failed', 'it took too long to start'); reject(new Error('start timeout')); } }, START_MS);
        w.onmessage = (ev) => {
          const d = ev.data || {};
          if (d.ready) { booted = true; clearTimeout(timer); this.bootMs = Date.now() - this.startedAt; this.set(this.pending.size ? 'busy' : 'ready'); resolve(); return; }
          const p = this.pending.get(d.id); if (!p) return;
          this.pending.delete(d.id); clearTimeout(p.timer);
          if (!this.pending.size && this.state === 'busy') this.set('ready');
          if (d.restart) this.restart();
          p.resolve(d);
        };
        w.onerror = (e) => {
          if (e && e.preventDefault) e.preventDefault();
          const msg = (e && e.message) || 'unknown error';
          if (!booted) { clearTimeout(timer); w.terminate(); this.worker = null; this.readyP = null; this.set('failed', msg); reject(new Error(msg)); return; }
          this.failAll({ result: 'error', out: '', tb: 'The Python runner stopped unexpectedly (' + msg + '). It is restarting; run your code again.\n', internal: true });
          this.restart();
        };
      });
      return this.readyP;
    },
    failAll(res) {
      this.pending.forEach((p, id) => { clearTimeout(p.timer); p.resolve(Object.assign({ id }, res)); });
      this.pending.clear();
    },
    restart() {
      if (this.worker) { try { this.worker.terminate(); } catch (e) { /* already gone */ } }
      this.worker = null; this.readyP = null;
      this.failAll({ result: 'error', out: '', tb: 'Python restarted.\n', internal: true });
      this.set('idle', '');
      this.start().catch(() => { /* status already shows the failure */ });
    },
    async exec(req, limitMs) {
      await this.start();
      const id = ++this.seq;
      return new Promise((resolve) => {
        const timer = setTimeout(() => {
          if (!this.pending.has(id)) return;
          this.pending.delete(id);
          resolve({ id, result: 'timeout', out: '', tb: '', ms: limitMs });
          this.restart();
        }, limitMs);
        this.pending.set(id, { resolve, timer });
        this.set('busy');
        this.worker.postMessage(Object.assign({ id }, req));
      });
    },
    run(src, stdin) { return this.exec({ mode: 'run', src: String(src || ''), stdin: stdin || null }, RUN_MS); },
    check(item, src) {
      return this.exec({ mode: 'check', src: String(src || ''), tests: item.tests || '', expect: item.stdout != null ? item.stdout : null, stdin: item.stdin || null, cases: item.cases || null }, CHECK_MS);
    },
    limits: { run: RUN_MS, check: CHECK_MS },
  };
  window.ToEPy = PY;
})();
