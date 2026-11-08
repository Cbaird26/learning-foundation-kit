# Learning Foundation kit

Sources and build tools for the Learning Foundation: free, Khan Academy-style self-study schools, each a complete path
from the basics to the frontier of a field, published as single-page sites.

**Open the schools:** https://cbaird26.github.io/learning-foundation/

- **HANDOFF.md** explains the project, the rules, setup and how a school is built, step by step.
- **STATUS.md** says where the work stands and what comes next.
- `schools/` holds every school's lessons, app, validator and build scripts; `hub/` holds the hub page.

Quick start:

```
npm install
python3 tools/relocate.py
python3 schools/law/scripts/integrate.py
python3 schools/law/scripts/build_site.py
```

Lessons are original educational content written for self-study; scores do not award credit, degrees or any
credential. Third-party software bundled in `schools/*/vendor/` keeps its own licence (see each school's
`publish/THIRD-PARTY-NOTICES.md`).
