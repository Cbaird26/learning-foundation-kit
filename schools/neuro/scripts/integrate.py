"""Validate every course, report a summary table, and list missing or failing courses."""
import json, subprocess, sys, os
cat = json.load(open('/home/claude/neuro/src/catalog.json'))
rows, bad = [], []
for c in cat['courses']:
    code = c['code']
    d = f'/home/claude/neuro/content/{code}'
    if not os.path.isdir(d) or not os.path.exists(os.path.join(d, 'project.txt')):
        n = len([f for f in os.listdir(d)]) if os.path.isdir(d) else 0
        rows.append((code, 'missing', f'{n} files')); bad.append(code); continue
    r = subprocess.run(['python3', '/home/claude/neuro/toolkit/validate.py', code], capture_output=True, text=True)
    last = (r.stdout.strip().splitlines() or ['?'])[-1]
    rows.append((code, 'ok' if r.returncode == 0 else 'ERRORS', last))
    if r.returncode != 0:
        bad.append(code)
        if '-v' in sys.argv:
            print('\n'.join(l for l in r.stdout.splitlines() if l.startswith('ERROR'))[:3000])
for row in rows:
    print(f'{row[0]:5} {row[1]:7} {row[2]}')
print('not ready:', ' '.join(bad) if bad else 'none')
