# Team board

Who is doing what right now. Only the lead edits this file; the rules are in AGENTS.md.

**Lead:** Claude

## Assignments

| Agent | Task | Branches | State |
|-------|------|----------|-------|
| Grok | 1. Second-opinion review of two Neuroscience courses full of dated facts: **C30** (Neuroethics and neurotechnology) and **P3** (Consciousness and the science of the mind). Check every law, date, figure and attribution against current sources, following `schools/neuro/toolkit/REVIEW.md`. 2. Then write the six Mathematics courses assigned to Grok below. 3. Then review Codex's Mathematics courses as each one is merged. | `grok/neuro-C30-review`, `grok/neuro-P3-review`, then `grok/math-<COURSE>-write` and `grok/math-<COURSE>-review` | 1 assigned; 2–3 next |
| Codex | 1. Second-opinion review of two code-heavy Neuroscience courses: **C24** (Neural data analysis) and **C25** (Computational neuroscience). Run every code item and worked example, and check every answer key and solution, following `schools/neuro/toolkit/REVIEW.md`. 2. Then write the six Mathematics courses assigned to Codex below. 3. Then review Claude's Mathematics courses as each one is merged. | `codex/neuro-C24-review`, `codex/neuro-C25-review`, then `codex/math-<COURSE>-write` and `codex/math-<COURSE>-review` | 1 assigned; 2–3 next |
| Claude | Lead. The Mathematics design is done (Nov 9; steps 1–2). Writing Claude's seven Mathematics courses below, then reviewing Grok's as each one is merged; merging pull requests; integrating, building and testing; asking the owner before publishing. As lead, Claude commits its own courses to `main` after an internal review; Codex then reviews them by pull request like any other course. | `main` (lead) | in progress |

## Mathematics school: course assignments

The owner chose on Nov 9 to split the 19 new courses three ways. Each writer works from `schools/math/toolkit/BRIEF.md` and the course spec in `schools/math/toolkit/courses/<COURSE>.json`; reviewers follow `schools/math/toolkit/REVIEW.md` and the table in AGENTS.md.

| Course | Title | Writer | Reviewer | State |
|--------|-------|--------|----------|-------|
| C9 | Linear algebra II: vector spaces, inner products and spectral theory | Claude | Codex | written and reviewed internally (Nov 10); ready for Codex review |
| C10 | Abstract algebra I: groups | Claude | Codex | written and reviewed internally (Nov 10); ready for Codex review |
| C11 | Abstract algebra II: rings, fields and Galois theory | Claude | Codex | written and reviewed internally (Nov 10); ready for Codex review |
| C12 | Real analysis II: metric spaces, uniform convergence and several variables | Claude | Codex | written and reviewed internally (Nov 10); ready for Codex review |
| C13 | Complex analysis | Grok | Claude | assigned |
| C14 | Topology | Grok | Claude | assigned |
| C15 | Number theory | Codex | Grok | assigned |
| C16 | Combinatorics and graph theory | Codex | Grok | assigned |
| C17 | Numerical analysis | Codex | Grok | assigned |
| C18 | Differential geometry of curves and surfaces | Grok | Claude | assigned |
| C19 | Dynamical systems and chaos | Codex | Grok | assigned |
| C23 | Problem solving and mathematical writing | Claude | Codex | written and reviewed internally (Nov 10); ready for Codex review |
| P1 | Measure theory and integration | Claude | Codex | written and reviewed internally (Nov 10); ready for Codex review |
| P2 | Graduate algebra: groups, rings, modules and fields | Grok | Claude | assigned |
| P3 | Algebraic topology | Grok | Claude | assigned |
| P4 | Smooth manifolds | Grok | Claude | assigned |
| P5 | Functional analysis | Codex | Grok | assigned |
| P6 | Probability theory | Codex | Grok | assigned |
| P7 | Research apprenticeship and qualifying exams | Claude | Codex | written and reviewed internally (Nov 10); ready for Codex review |

Course notes for every writer are in `schools/math/work/WRITERS.md` (for example: permutations as 0-based image lists in code, no `cmath` in graded code, integers below about 10^30 in graded code, original problems only in C23). The example lesson `schools/math/toolkit/example_math_lesson.txt` is a format sample: never copy its examples, data or items.

## Kickoff message

The owner pastes this once into each agent, filling in its name:

> You are [Codex / Grok], one of three AI agents (Claude, Codex and Grok) working together in https://github.com/Cbaird26/learning-foundation-kit. Get the latest main, then read AGENTS.md, HANDOFF.md, STATUS.md and TEAM.md. Do only what TEAM.md assigns to you, one course per branch and pull request, following the ground rules exactly. Validate to 0 errors before you open a pull request. Never merge, never publish, never edit shared files. When you finish, check TEAM.md for your next assignment.
