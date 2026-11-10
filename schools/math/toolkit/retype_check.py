#!/usr/bin/env python3
"""Find code items that ask the learner to re-type a function that the lesson's article or a worked example
already gives in full.

usage: python3 toolkit/retype_check.py [--threshold 0.8] CODE [CODE ...]

For each code item, the main function (the first `name(` written in backticks in the prompt) is compared,
with function names normalized, to every function defined in the article and the worked examples of the
same lesson. Items at or above the threshold are listed. Judge each one: a variant that changes the idea
(another distance, a stopping rule, log space) can be legitimately similar, while the same function under a
new name, or the article's step wrapped in a loop, is not."""
import ast, difflib, os, re, sys

CONTENT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'content')
SEC = re.compile(r'^@(lesson|article|example|mistakes|practice|quiz|project|review|exam)\b(.*)$', re.M)


def sections(text):
    ms = list(SEC.finditer(text))
    for i, m in enumerate(ms):
        end = ms[i + 1].start() if i + 1 < len(ms) else len(text)
        yield m.group(1), m.group(2).strip(), text[m.end():end]


def functions(src):
    """Map each function name defined in the python blocks of src to its source without the docstring."""
    out = {}
    for block in re.findall(r'```python\n(.*?)```', src, re.S):
        try:
            tree = ast.parse(block)
        except SyntaxError:
            continue
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                b = node.body
                if len(b) > 1 and isinstance(b[0], ast.Expr) and isinstance(getattr(b[0], 'value', None), ast.Constant) \
                        and isinstance(b[0].value.value, str):
                    node.body = b[1:]
                out[node.name] = re.sub(r'^def \w+', 'def f', ast.unparse(node))
    return out


def model_functions(body):
    m = re.search(r'^model:\s*\n```python\n(.*?)```', body, re.M | re.S)
    return functions('```python\n' + m.group(1) + '```') if m else {}


def check(code, threshold):
    found = []
    folder = os.path.join(CONTENT, code)
    for fn in sorted(os.listdir(folder)):
        if not fn.endswith('.txt'):
            continue
        secs = list(sections(open(os.path.join(folder, fn), encoding='utf-8').read()))
        given = {}
        for kind, _, body in secs:
            if kind in ('article', 'example'):
                given.update(functions(body))
        for kind, arg, body in secs:
            if kind not in ('practice', 'quiz', 'exam') or not arg.startswith('code'):
                continue
            pm = re.search(r'^prompt:.*?`([A-Za-z_]\w*)\(', body, re.M)
            mf = model_functions(body)
            if not pm or pm.group(1) not in mf:
                continue
            main = pm.group(1)
            best = max(((difflib.SequenceMatcher(None, g, mf[main]).ratio(), n) for n, g in given.items()),
                       default=(0.0, None))
            if best[0] >= threshold:
                found.append(f'{code}/{fn} {kind} code `{main}` is {best[0]:.2f} similar to `{best[1]}` in the article or a worked example')
    return found


if __name__ == '__main__':
    args = sys.argv[1:]
    th = 0.8
    if args[:1] == ['--threshold']:
        th, args = float(args[1]), args[2:]
    hits = [h for c in args for h in check(c, th)]
    print('\n'.join(hits) if hits else 'no code item is close to an article function')
