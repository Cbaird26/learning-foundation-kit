# Team board

Who is doing what right now. Only the lead edits this file; the rules are in AGENTS.md.

**Lead:** Claude

## Assignments

| Agent | Task | Branches | State |
|-------|------|----------|-------|
| Grok | 1. Second-opinion review of two Neuroscience courses full of dated facts: **C30** (Neuroethics and neurotechnology) and **P3** (Consciousness and the science of the mind). Check every law, date, figure and attribution against current sources, following `schools/neuro/toolkit/REVIEW.md`. 2. Then a second-opinion review of the Mathematics courses marked Grok below (C13, C14, C18, P2, P3, P4), each once its state says "ready for review", following `schools/math/toolkit/REVIEW.md`. | `grok/neuro-C30-review`, `grok/neuro-P3-review`, then `grok/math-<COURSE>-review` | 1 assigned; 2 as courses become ready |
| Codex | 1. Second-opinion review of two code-heavy Neuroscience courses: **C24** (Neural data analysis) and **C25** (Computational neuroscience). Run every code item and worked example, and check every answer key and solution, following `schools/neuro/toolkit/REVIEW.md`. 2. Then a second-opinion review of the Mathematics courses marked Codex below, each once its state says "ready for review", following `schools/math/toolkit/REVIEW.md`. | `codex/neuro-C24-review`, `codex/neuro-C25-review`, then `codex/math-<COURSE>-review` | 1 assigned; 2 ready now for seven courses |
| Claude | Lead. The owner chose on Nov 10 that Claude writes all 19 new Mathematics courses (nobody had started the 12 assigned to Codex and Grok). Claude's first seven are written and reviewed internally; Claude is now writing the other twelve, reviewing each internally, then integrating, building and testing, and publishing when all 64 courses are done (the owner's choice). As lead, Claude commits its courses to `main` after an internal review; Codex and Grok then give second-opinion reviews by pull request. | `main` (lead) | in progress |

## Mathematics school: course assignments

The owner chose on Nov 9 to split the 19 new courses three ways, and on Nov 10, when nobody had started the twelve assigned to Codex and Grok, chose that Claude writes all 19. Codex and Grok now give second-opinion reviews (always a different model from the writer, as AGENTS.md requires). Each writer works from `schools/math/toolkit/BRIEF.md` and the course spec in `schools/math/toolkit/courses/<COURSE>.json`; reviewers follow `schools/math/toolkit/REVIEW.md` and the table in AGENTS.md.

| Course | Title | Writer | Reviewer | State |
|--------|-------|--------|----------|-------|
| C9 | Linear algebra II: vector spaces, inner products and spectral theory | Claude | Codex | written and reviewed internally (Nov 10); ready for Codex review |
| C10 | Abstract algebra I: groups | Claude | Codex | written and reviewed internally (Nov 10); ready for Codex review |
| C11 | Abstract algebra II: rings, fields and Galois theory | Claude | Codex | written and reviewed internally (Nov 10); ready for Codex review |
| C12 | Real analysis II: metric spaces, uniform convergence and several variables | Claude | Codex | written and reviewed internally (Nov 10); ready for Codex review |
| C13 | Complex analysis | Claude | Grok | written and reviewed internally (Nov 10); ready for Grok review |
| C14 | Topology | Claude | Grok | written and reviewed internally (Nov 10); ready for Grok review |
| C15 | Number theory | Claude | Codex | written and reviewed internally (Nov 10); ready for Codex review |
| C16 | Combinatorics and graph theory | Claude | Codex | being written by Claude (Nov 10) |
| C17 | Numerical analysis | Claude | Codex | being written by Claude (Nov 10) |
| C18 | Differential geometry of curves and surfaces | Claude | Grok | being written by Claude (Nov 10) |
| C19 | Dynamical systems and chaos | Claude | Codex | being written by Claude (Nov 10) |
| C23 | Problem solving and mathematical writing | Claude | Codex | written and reviewed internally (Nov 10); ready for Codex review |
| P1 | Measure theory and integration | Claude | Codex | written and reviewed internally (Nov 10); ready for Codex review |
| P2 | Graduate algebra: groups, rings, modules and fields | Claude | Grok | written and reviewed internally (Nov 10); ready for Grok review |
| P3 | Algebraic topology | Claude | Grok | written and reviewed internally (Nov 10); ready for Grok review |
| P4 | Smooth manifolds | Claude | Grok | written and reviewed internally (Nov 10); ready for Grok review |
| P5 | Functional analysis | Claude | Codex | written and reviewed internally (Nov 10); ready for Codex review |
| P6 | Probability theory | Claude | Codex | written and reviewed internally (Nov 10); ready for Codex review |
| P7 | Research apprenticeship and qualifying exams | Claude | Codex | written and reviewed internally (Nov 10); ready for Codex review |

Course notes for every writer are in `schools/math/work/WRITERS.md` (for example: permutations as 0-based image lists in code, no `cmath` in graded code, integers below about 10^30 in graded code, original problems only in C23). The example lesson `schools/math/toolkit/example_math_lesson.txt` is a format sample: never copy its examples, data or items.

## Kickoff message

The owner pastes this once into each agent, filling in its name:

> You are [Codex / Grok], one of three AI agents (Claude, Codex and Grok) working together in https://github.com/Cbaird26/learning-foundation-kit. Get the latest main, then read AGENTS.md, HANDOFF.md, STATUS.md and TEAM.md. Do only what TEAM.md assigns to you, one course per branch and pull request, following the ground rules exactly. Validate to 0 errors before you open a pull request. Never merge, never publish, never edit shared files. When you finish, check TEAM.md for your next assignment.
