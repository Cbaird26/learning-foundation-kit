#!/usr/bin/env python3
"""Point every school's scripts at this checkout.

The build scripts, validators and briefs use absolute paths: each school at <schools_root>/<school>
(originally /home/claude/<school>) and KaTeX at <katex_root> (originally /opt/npm-tools/node_modules/katex).
Run this once after cloning, and again whenever the checkout moves:

    npm install                 # KaTeX, for the site build and the math check
    python3 tools/relocate.py

The current roots are recorded in tools/paths.json, so running it twice is harmless.
"""
import json, os, re

KIT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONF = os.path.join(KIT, 'tools', 'paths.json')
conf = json.load(open(CONF))
new_schools = os.path.join(KIT, 'schools')
new_katex = os.path.join(KIT, 'node_modules', 'katex')
names = sorted(d for d in os.listdir(new_schools) if os.path.isdir(os.path.join(new_schools, d)))
old_root = conf['schools_root'].rstrip('/')
school_rx = re.compile(re.escape(old_root) + r'/(' + '|'.join(map(re.escape, names)) + r')(?![A-Za-z0-9_-])')
pw_rx = re.compile(r"os\.environ\['PLAYWRIGHT_BROWSERS_PATH'\] = '/opt/pw-browsers'")
changed = 0
for s in names:
    for dp, dn, fn in os.walk(os.path.join(new_schools, s)):
        if os.sep + 'content' in dp or os.sep + 'vendor' in dp:
            continue  # lesson text and third-party code contain no build paths
        for f in fn:
            if not f.endswith(('.py', '.js', '.md', '.txt', '.json', '.sh', '.html')):
                continue
            p = os.path.join(dp, f)
            try:
                t = open(p, encoding='utf-8').read()
            except UnicodeDecodeError:
                continue
            t2 = school_rx.sub(lambda m: new_schools + '/' + m.group(1), t)
            t2 = t2.replace(conf['katex_root'], new_katex)
            t2 = pw_rx.sub("os.path.isdir('/opt/pw-browsers') and os.environ.setdefault('PLAYWRIGHT_BROWSERS_PATH', '/opt/pw-browsers')", t2)
            if t2 != t:
                open(p, 'w', encoding='utf-8').write(t2)
                changed += 1
conf['schools_root'], conf['katex_root'] = new_schools, new_katex
json.dump(conf, open(CONF, 'w'), indent=2)
print(f'Updated {changed} files. Schools: {new_schools}  KaTeX: {new_katex}')
