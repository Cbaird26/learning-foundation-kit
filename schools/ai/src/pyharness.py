"""Coding Learning Foundation: runs a learner's Python code and checks it against tests.

The same file runs in two places:
  * in the browser, inside a Web Worker running Brython (handle(request_json) -> result_json);
  * on the build machine under CPython, to verify every exercise (python3 -I pyharness.py < request.json).

Request:  {"mode": "run" | "check", "src": str, "tests": str, "expect": str | null, "stdin": str | null,
           "cases": [{"stdin": str, "stdout": str}, ...] | null   (the first case is the stdin/expect pair)}
Result:   {"result": "ok" | "pass" | "fail" | "error", "out": str, "tb": str,
           "tests": [{"line": int, "src": str, "ok": bool, "msg": str}], "passed": int, "total": int,
           "stdout_ok": bool | null, "stdout_msg": str, "restart": bool}
"""
import sys
import json
import io
import types

IN_BROWSER = sys.implementation.name.lower() == 'brython'
YOUR_CODE = '<your code>'
TESTS = '<tests>'
OUT_LIMIT = 200000
RECURSION_LIMIT = 1000


class OutputLimit(Exception):
    pass


class _AsMain:
    """While the learner's code runs, its namespace is the module __main__ (so unittest.main(), pickle and
    typing.get_type_hints find it) and sys.argv is a plain script's."""

    def __init__(self, mod):
        self.mod = mod
        self.saved = None

    def __enter__(self):
        self.saved = (sys.modules.get('__main__'), getattr(sys, 'argv', None))
        sys.modules['__main__'] = self.mod
        sys.argv = ['main.py']
        return self

    def __exit__(self, *exc):
        main, argv = self.saved
        if main is not None:
            sys.modules['__main__'] = main
        else:
            sys.modules.pop('__main__', None)
        if argv is not None:
            sys.argv = argv
        return False


class _Out:
    def __init__(self):
        self.parts = []
        self.size = 0

    def write(self, s):
        s = str(s)
        self.size += len(s)
        if self.size > OUT_LIMIT:
            raise OutputLimit('Your program printed more than %d characters, so it was stopped.' % OUT_LIMIT)
        self.parts.append(s)
        return len(s)

    def flush(self):
        pass

    def text(self):
        return ''.join(self.parts)


class _MemFile:
    """A text file kept in memory. Files opened for writing save their text when closed."""

    def __init__(self, files, name, mode, initial=''):
        self._files, self.name, self.mode = files, name, mode
        self._buf = initial
        self._pos = len(initial) if 'a' in mode else 0
        self.closed = False
        self._writable = any(c in mode for c in 'wax+')
        self._readable = 'r' in mode or '+' in mode

    def _check(self, reading):
        if self.closed:
            raise ValueError('I/O operation on closed file.')
        if reading and not self._readable:
            raise io.UnsupportedOperation('not readable')
        if not reading and not self._writable:
            raise io.UnsupportedOperation('not writable')

    def read(self, size=-1):
        self._check(True)
        end = len(self._buf) if size is None or size < 0 else min(len(self._buf), self._pos + size)
        out = self._buf[self._pos:end]
        self._pos = end
        return out

    def readline(self, size=-1):
        self._check(True)
        nl = self._buf.find('\n', self._pos)
        end = len(self._buf) if nl < 0 else nl + 1
        if size is not None and size >= 0:
            end = min(end, self._pos + size)
        out = self._buf[self._pos:end]
        self._pos = end
        return out

    def readlines(self, hint=-1):
        lines = []
        while True:
            line = self.readline()
            if not line:
                return lines
            lines.append(line)

    def __iter__(self):
        return self

    def __next__(self):
        line = self.readline()
        if not line:
            raise StopIteration
        return line

    def write(self, s):
        self._check(False)
        if not isinstance(s, str):
            raise TypeError('write() argument must be str, not %s' % type(s).__name__)
        if 'a' in self.mode:
            self._pos = len(self._buf)
        self._buf = self._buf[:self._pos] + s + self._buf[self._pos + len(s):]
        self._pos += len(s)
        return len(s)

    def writelines(self, lines):
        for line in lines:
            self.write(line)

    def seek(self, pos, whence=0):
        self._pos = max(0, pos if whence == 0 else (self._pos + pos if whence == 1 else len(self._buf) + pos))
        return self._pos

    def tell(self):
        return self._pos

    def flush(self):
        pass

    def close(self):
        if not self.closed and self._writable:
            self._files[self.name] = self._buf
        self.closed = True

    def __enter__(self):
        return self

    def __exit__(self, *exc):
        self.close()
        return False


def _make_env(files, stdin_lines, out, mark):
    """Names provided to the learner's code and to the tests."""
    feed = list(stdin_lines)

    def input(prompt=''):
        if prompt:
            sys.stdout.write(str(prompt))
        if not feed:
            raise EOFError('EOF when reading a line (this exercise gives no more input)')
        return feed.pop(0)

    def open(file, mode='r', *args, **kwargs):
        name = str(file)
        if 'b' in mode:
            raise ValueError('binary files are not available here; use text mode')
        if 'r' in mode and '+' not in mode:
            if name not in files:
                raise FileNotFoundError("[Errno 2] No such file or directory: %r" % name)
            return _MemFile(files, name, mode, files[name])
        if 'x' in mode and name in files:
            raise FileExistsError("[Errno 17] File exists: %r" % name)
        start = files.get(name, '') if ('a' in mode or 'r' in mode) else ''
        if 'w' in mode or 'x' in mode:
            files[name] = ''
        elif name not in files and 'r' in mode:
            raise FileNotFoundError("[Errno 2] No such file or directory: %r" % name)
        return _MemFile(files, name, mode, start)

    def write_file(name, text):
        files[str(name)] = str(text)

    def read_file(name):
        return files[str(name)]

    def output():
        """Text printed since the tests began, or since the last call to output()."""
        t = out.text()
        got = t[mark[0]:]
        mark[0] = len(t)
        return got

    def raises(exc_type, func, *args, **kwargs):
        """True when func(*args, **kwargs) raises exc_type (or a subclass of it)."""
        try:
            func(*args, **kwargs)
        except exc_type:
            return True
        except BaseException:
            return False
        return False

    def help(obj=None):
        if obj is None:
            print('Type help(name) to see the documentation of a function, class or module.')
            return
        name = getattr(obj, '__name__', type(obj).__name__)
        doc = getattr(obj, '__doc__', None)
        print('Help on %s:\n' % name)
        print('    ' + (doc.strip().replace('\n', '\n    ') if doc else '(no documentation)'))

    return {'input': input, 'open': open, 'help': help, 'write_file': write_file, 'read_file': read_file, 'output': output,
            'raises': raises}


def _lines(src):
    return src.split('\n')


def _clean_name(e):
    name = type(e).__name__
    msg = str(e) if not isinstance(e, type) else ''
    if name == 'JavascriptError' and ('call stack' in msg or 'too much recursion' in msg):
        return 'RecursionError', 'maximum recursion depth exceeded'
    if name == 'ModuleNotFoundError' and msg and not msg.startswith('No module'):
        msg = 'No module named %r' % msg
    return name, msg


def _is_stack_overflow(e):
    name, _ = _clean_name(e)
    return name == 'RecursionError'


def format_exc(e, sources):
    """A traceback like CPython's, showing only frames from the learner's code and the tests."""
    if isinstance(e, OutputLimit):
        return str(e) + '\n'
    if isinstance(e, SyntaxError):
        out = []
        fn = e.filename or YOUR_CODE
        if e.lineno:
            out.append('  File "%s", line %s\n' % (fn, e.lineno))
            text = e.text
            if text is None and fn in sources and 1 <= e.lineno <= len(sources[fn]):
                text = sources[fn][e.lineno - 1]
            if text:
                text = text.rstrip('\n')
                stripped = text.lstrip()
                out.append('    ' + stripped + '\n')
                if e.offset and e.offset > 0:
                    col = e.offset - 1 - (len(text) - len(stripped))
                    width = 1
                    if getattr(e, 'end_offset', None) and getattr(e, 'end_lineno', None) == e.lineno and e.end_offset > e.offset:
                        width = e.end_offset - e.offset
                    if 0 <= col <= len(stripped):
                        out.append('    ' + ' ' * col + '^' * max(1, min(width, len(stripped) - col + 1)) + '\n')
        out.append('%s: %s\n' % (type(e).__name__, e.msg))
        return ''.join(out)
    frames = []
    tb = getattr(e, '__traceback__', None)
    while tb is not None:
        co = tb.tb_frame.f_code
        if co.co_filename in sources:
            frames.append((co.co_filename, tb.tb_lineno, co.co_name))
        tb = tb.tb_next
    out = []
    if frames:
        out.append('Traceback (most recent call last):\n')
        last, count = None, 0

        def flush_repeats():
            if count > 3:
                out.append('  [Previous line repeated %d more time%s]\n' % (count - 3, '' if count - 3 == 1 else 's'))

        for f in frames:
            if f == last:
                count += 1
                if count > 3:
                    continue
            else:
                flush_repeats()
                last, count = f, 1
            fn, ln, name = f
            out.append('  File "%s", line %s, in %s\n' % (fn, ln, name))
            src = sources[fn]
            if 1 <= ln <= len(src) and src[ln - 1].strip():
                out.append('    ' + src[ln - 1].strip() + '\n')
        flush_repeats()
    name, msg = _clean_name(e)
    out.append(name + (': ' + msg if msg else '') + '\n')
    if IN_BROWSER and name == 'ModuleNotFoundError':
        out.append('(The Python on this site runs in your browser. It has most of the standard library, '
                   'but some modules, such as sqlite3, threading and third-party packages, are not available here.)\n')
    return ''.join(out)


def _norm_out(s):
    s = (s or '').replace('\r\n', '\n').replace('\r', '\n')
    return '\n'.join(line.rstrip() for line in s.split('\n')).rstrip('\n')


def _compare_stdout(got, want):
    g, w = _norm_out(got), _norm_out(want)
    if g == w:
        return True, ''
    gl, wl = g.split('\n') if g else [], w.split('\n') if w else []
    for i in range(min(len(gl), len(wl))):
        if gl[i] != wl[i]:
            return False, 'Line %d of the output should be %r, but your program printed %r.' % (i + 1, wl[i], gl[i])
    if len(gl) < len(wl):
        return False, 'Your program printed %d line%s; %d %s expected. The next expected line is %r.' % (
            len(gl), '' if len(gl) == 1 else 's', len(wl), 'was' if len(wl) == 1 else 'were', wl[len(gl)])
    return False, 'Your program printed %d line%s, but only %d %s expected. The first extra line is %r.' % (
        len(gl), '' if len(gl) == 1 else 's', len(wl), 'was' if len(wl) == 1 else 'were', gl[len(wl)])


def _short(v, n=200):
    try:
        r = repr(v)
    except Exception:
        r = '<unprintable value>'
    return r if len(r) <= n else r[:n] + '…'


def _test_chunks(tests):
    """Split the tests into top-level statements: (first_line, last_line, node or None)."""
    import ast
    tree = ast.parse(tests, TESTS)
    groups = []
    for node in tree.body:
        a, b = node.lineno, getattr(node, 'end_lineno', None) or node.lineno
        if getattr(node, 'decorator_list', None):
            a = min([a] + [d.lineno for d in node.decorator_list])
        if groups and a <= groups[-1][1]:
            groups[-1][1] = max(groups[-1][1], b)
            groups[-1][2] = None  # several statements share a line: run them together
        else:
            groups.append([a, b, node])
    return groups


def _run_chunk(text, first, ns):
    code = compile('\n' * (first - 1) + text, TESTS, 'exec')
    exec(code, ns)


def _eval_part(tests, node, ns):
    import ast
    seg = ast.get_source_segment(tests, node)
    if seg is None:
        seg = ast.unparse(node)
    _run_chunk('__t_value__ = (' + seg + '\n)', node.lineno, ns)
    return ns.pop('__t_value__')


def _assert_test(tests, src_text, node, ns, sources):
    """Run one assert statement; on failure explain it. Returns (ok, msg)."""
    import ast
    t = node.test
    msg_node = node.msg
    if isinstance(t, ast.Compare) and len(t.ops) == 1 and isinstance(t.ops[0], (ast.Eq, ast.Is)):
        got = _eval_part(tests, t.left, ns)
        want = _eval_part(tests, t.comparators[0], ns)
        ok = (got is want) if isinstance(t.ops[0], ast.Is) else (got == want)
        if ok:
            return True, ''
        left = ast.get_source_segment(tests, t.left) or ast.unparse(t.left)
        extra = ''
        if msg_node is not None:
            extra = ' ' + str(_eval_part(tests, msg_node, ns))
        return False, '%s gave %s, but %s was expected.%s' % (left.strip(), _short(got), _short(want), extra)
    try:
        _run_chunk(src_text, node.lineno, ns)
        return True, ''
    except AssertionError as e:
        m = str(e)
        return False, (m if m else 'This test failed: ' + src_text.strip().split('\n')[0])


def run(src, stdin=None, files=None):
    """Run a whole program. Returns output and any error."""
    out = _Out()
    files = dict(files or {})
    sources = {YOUR_CODE: _lines(src)}
    main = types.ModuleType('__main__')
    ns = main.__dict__
    ns.update(_make_env(files, _lines(stdin) if stdin else [], out, [0]))
    res = {'result': 'ok', 'out': '', 'tb': '', 'restart': False}
    saved = (sys.stdout, sys.stderr)
    sys.stdout = sys.stderr = out
    try:
        sys.setrecursionlimit(RECURSION_LIMIT)
        with _AsMain(main):
            exec(compile(src, YOUR_CODE, 'exec'), ns)
    except SystemExit:
        pass
    except BaseException as e:
        res['result'] = 'error'
        res['tb'] = format_exc(e, sources)
        res['restart'] = _is_stack_overflow(e)
    finally:
        sys.stdout, sys.stderr = saved
    res['out'] = out.text()
    return res


def _extra_case(src, stdin, expect, files):
    """Run the whole program again on another input; returns (ok, msg)."""
    out = _Out()
    sources = {YOUR_CODE: _lines(src)}
    main = types.ModuleType('__main__')
    ns = main.__dict__
    ns.update(_make_env(dict(files or {}), _lines(stdin) if stdin else [], out, [0]))
    saved = (sys.stdout, sys.stderr)
    sys.stdout = sys.stderr = out
    try:
        sys.setrecursionlimit(RECURSION_LIMIT)
        with _AsMain(main):
            exec(compile(src, YOUR_CODE, 'exec'), ns)
    except SystemExit:
        pass
    except BaseException as e:
        sys.stdout, sys.stderr = saved
        return False, 'Your program raised an error on this input:\n' + format_exc(e, sources).rstrip('\n'), _is_stack_overflow(e)
    finally:
        sys.stdout, sys.stderr = saved
    ok, msg = _compare_stdout(out.text(), expect)
    return ok, msg, False


def check(src, tests='', expect=None, stdin=None, files=None, cases=None):
    """Run the learner's code, then the tests in the same namespace; then any further input/output cases."""
    out = _Out()
    files = dict(files or {})
    sources = {YOUR_CODE: _lines(src), TESTS: _lines(tests or '')}
    mark = [0]
    main = types.ModuleType('__main__')
    ns = main.__dict__
    ns.update(_make_env(files, _lines(stdin) if stdin else [], out, mark))
    res = {'result': 'pass', 'out': '', 'tb': '', 'tests': [], 'passed': 0, 'total': 0,
           'stdout_ok': None, 'stdout_msg': '', 'restart': False}
    saved = (sys.stdout, sys.stderr)
    sys.stdout = sys.stderr = out
    as_main = _AsMain(main).__enter__()
    try:
        try:
            sys.setrecursionlimit(RECURSION_LIMIT)
            exec(compile(src, YOUR_CODE, 'exec'), ns)
        except SystemExit:
            pass
        except BaseException as e:
            res['result'] = 'error'
            res['tb'] = format_exc(e, sources)
            res['restart'] = _is_stack_overflow(e)
            return res
        res['out'] = out.text()
        mark[0] = len(res['out'])
        if expect is not None:
            ok, msg = _compare_stdout(res['out'], expect)
            res['stdout_ok'], res['stdout_msg'] = ok, msg
            if not ok:
                res['result'] = 'fail'
            if cases:
                res['cases'] = [{'stdin': stdin or '', 'ok': ok, 'msg': msg}]
        if tests and tests.strip():
            import ast
            tl = _lines(tests)
            for first, last, node in _test_chunks(tests):
                text = '\n'.join(tl[first - 1:last])
                is_test = isinstance(node, ast.Assert)
                entry = {'line': first, 'src': text.strip(), 'ok': True, 'msg': ''}
                try:
                    sys.setrecursionlimit(RECURSION_LIMIT)
                    if is_test:
                        ok, msg = _assert_test(tests, text, node, ns, sources)
                        entry['ok'], entry['msg'] = ok, msg
                    else:
                        _run_chunk(text, first, ns)
                except SystemExit:
                    entry['ok'] = False
                    entry['msg'] = 'Your code called exit() while being tested.'
                except BaseException as e:
                    entry['ok'] = False
                    entry['msg'] = format_exc(e, sources).rstrip('\n')
                    if _is_stack_overflow(e):
                        res['restart'] = True
                if is_test:
                    res['total'] += 1
                    if entry['ok']:
                        res['passed'] += 1
                    res['tests'].append(entry)
                elif not entry['ok']:
                    entry['setup'] = True
                    res['tests'].append(entry)
                    res['result'] = 'error'
                    res['tb'] = entry['msg'] + '\n'
                    break
                if res['restart']:
                    break
            if res['result'] == 'pass' and res['passed'] < res['total']:
                res['result'] = 'fail'
    finally:
        as_main.__exit__()
        sys.stdout, sys.stderr = saved
    for c in (cases or [])[1:]:
        if res['restart']:
            break
        ok, msg, restart = _extra_case(src, c.get('stdin'), c.get('stdout') or '', files)
        res.setdefault('cases', []).append({'stdin': c.get('stdin') or '', 'ok': ok, 'msg': msg})
        res['restart'] = res['restart'] or restart
        if not ok:
            res['stdout_ok'] = False
            if not res['stdout_msg']:
                res['stdout_msg'] = msg
            if res['result'] == 'pass':
                res['result'] = 'fail'
    return res


def handle(request_json):
    req = json.loads(request_json)
    try:
        if req.get('mode') == 'check':
            res = check(req.get('src', ''), req.get('tests', ''), req.get('expect'), req.get('stdin'), req.get('files'), req.get('cases'))
        else:
            res = run(req.get('src', ''), req.get('stdin'), req.get('files'))
    except BaseException as e:  # a failure inside the harness itself
        res = {'result': 'error', 'out': '', 'tb': 'Internal error in the code runner: %s: %s\n' % (type(e).__name__, e), 'restart': True, 'internal': True}
    # Brython's ensure_ascii escaping breaks characters outside the BMP (emoji), so the browser keeps them as they are
    return json.dumps(res, ensure_ascii=not IN_BROWSER)


if __name__ == '__main__':
    data = sys.stdin.read()
    real = sys.stdout
    result = handle(data)
    real.write(result)
    real.flush()
