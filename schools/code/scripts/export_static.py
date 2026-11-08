"""Export a standalone static copy (for GitHub Pages or any web host): index.html with a full document skeleton,
the course data files, a README and .nojekyll. Outside claude.ai, progress saves in the learner's browser and the
tutor offers a copy-a-prompt fallback."""
import os, re, shutil, glob

SITE = '/home/claude/code/site'
OUT = '/home/claude/code/export'
HEAD = ('<!doctype html><html lang="en"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
        '<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}'
        'body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style></head><body>')
README = """# ToE Learning Foundation

A Khan Academy-style self-study school for a 39-course curriculum that runs from algebra to graduate theoretical physics:
foundation mathematics, university mathematics, undergraduate physics, graduate preparation and research, and optional enrichment.

Each course follows a 14-week syllabus. Every weekly lesson has an explanation, worked examples revealed step by step,
common mistakes, a pointer into a free primary reading, and auto-graded practice with progressive hints and full solutions.
Skills move through five mastery levels (Not started, Attempted, Familiar, Proficient, Mastered) through practice,
unit quizzes, a midterm, a timed cumulative final and a course challenge. Missed questions go into an error log with a
48-hour parallel-problem retry. A placement check recommends where to begin.

## Hosting

This folder is a static site: `index.html` plus `data/*.json`. Serve it from any static host, for example GitHub Pages
(Settings → Pages → deploy from this branch). Opening `index.html` straight from disk will not load the course files,
because browsers block `fetch` on `file://` pages; use a local server such as `python3 -m http.server` instead.

Outside claude.ai, progress is saved in each learner's own browser, and the tutor offers to copy a ready-made prompt
for use in a chat with Claude.

Self-study scores are private progress indicators and do not award credit.
"""

def main():
    if os.path.exists(OUT):
        shutil.rmtree(OUT)
    os.makedirs(os.path.join(OUT, 'data'))
    body = open(os.path.join(SITE, 'index.html'), encoding='utf-8').read()
    # move the page's leading <title>, <meta> and <link> tags into <head>, where they belong outside claude.ai
    m = re.match(r'(?:\s*(?:<title>[^<]*</title>|<meta\b[^>]*>|<link\b[^>]*>))+', body)
    tags = m.group(0) if m else ''
    body = body[len(tags):]
    tags = re.sub(r'\s*<meta name="claude:[^"]*"[^>]*>', '', tags)
    head = HEAD.replace('</head><body>', tags.strip() + '</head><body>')
    open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(head + body + '</body></html>')
    for f in glob.glob(os.path.join(SITE, 'data', '*.json')):
        shutil.copy(f, os.path.join(OUT, 'data'))
    open(os.path.join(OUT, 'README.md'), 'w').write(README)
    open(os.path.join(OUT, '.nojekyll'), 'w').write('')
    print('exported to', OUT, len(glob.glob(os.path.join(OUT, 'data', '*.json'))), 'course files')

if __name__ == '__main__':
    main()
