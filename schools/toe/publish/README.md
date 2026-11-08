# ToE Learning Foundation

**Open the school:** https://cbaird26.github.io/toe-learning-foundation/

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

Third-party software in the page: [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
