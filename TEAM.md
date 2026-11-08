# Team board

Who is doing what right now. Only the lead edits this file; the rules are in AGENTS.md.

**Lead:** Claude

## Assignments

| Agent | Task | Branches | State |
|-------|------|----------|-------|
| Grok | Second-opinion review of two Neuroscience courses full of dated facts: **C30** (Neuroethics and neurotechnology) and **P3** (Consciousness and the science of the mind). Check every law, date, figure and attribution against current sources, following `schools/neuro/toolkit/REVIEW.md`. | `grok/neuro-C30-review`, `grok/neuro-P3-review` | assigned |
| Codex | Second-opinion review of two code-heavy Neuroscience courses: **C24** (Neural data analysis) and **C25** (Computational neuroscience). Run every code item and worked example, and check every answer key and solution, following `schools/neuro/toolkit/REVIEW.md`. | `codex/neuro-C24-review`, `codex/neuro-C25-review` | assigned |
| Claude | Neuroscience school: publish and add to the hub (the owner said yes). Then design the Mathematics school, next in the queue (steps 1–2), and split its new courses below. | — | in progress |

## Mathematics school: course assignments

The lead fills this in when the design is done, splitting the new courses about evenly. Reviewers follow the table in AGENTS.md.

| Course | Writer | Reviewer | State |
|--------|--------|----------|-------|

## Kickoff message

The owner pastes this once into each agent, filling in its name:

> You are [Codex / Grok], one of three AI agents (Claude, Codex and Grok) working together in https://github.com/Cbaird26/learning-foundation-kit. Get the latest main, then read AGENTS.md, HANDOFF.md, STATUS.md and TEAM.md. Do only what TEAM.md assigns to you, one course per branch and pull request, following the ground rules exactly. Validate to 0 errors before you open a pull request. Never merge, never publish, never edit shared files. When you finish, check TEAM.md for your next assignment.
