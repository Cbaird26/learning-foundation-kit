# AGENTS.md

Instructions for every AI agent working in this repository. Three agents work here side by side: **Claude**, **Codex** and **Grok**. Read this file first, then:

1. **HANDOFF.md**: the project, the ground rules, setup and how a school is built (steps 1–8).
2. **STATUS.md**: where the work stands.
3. **TEAM.md**: what is assigned to you right now.

## Ground rules come first

Every rule under "Ground rules" in HANDOFF.md applies to every agent on every task. Above all:

- **Nothing personal, anywhere.** No names, email addresses, local file paths or account details in any file, commit message or pull request.
- **Nothing goes live without the owner's yes.** Never create a repo, publish a site, or push to a school's live repo or the hub repo. Those are the lead's steps, and only after the owner approves.

## Roles

- **Lead** (Claude, unless TEAM.md names another agent): designs each school and rebrands its app (steps 1–2), assigns courses in TEAM.md, merges pull requests, keeps STATUS.md and TEAM.md current, integrates, builds and tests (steps 5–6), and asks the owner before publishing (steps 7–8).
- **Writers and reviewers** (Claude, Codex, Grok): write the courses TEAM.md assigns to you (step 3) and review the courses TEAM.md assigns to you (step 4).

If the lead runs out of budget, the owner names a new lead in TEAM.md.

## Working side by side without collisions

1. Do only what TEAM.md assigns to you. If nothing is assigned to you, say so and stop.
2. One course, one branch, one pull request, starting from the latest `main`. Name the branch `<agent>/<school>-<COURSE>-write` or `<agent>/<school>-<COURSE>-review` (for example `codex/neuro-C24-review`) and title the pull request `<school> <COURSE>: write` or `<school> <COURSE>: review`.
3. A writing or review branch changes only `schools/<school>/content/<COURSE>/`.
4. Only the lead edits shared files: `AGENTS.md`, `TEAM.md`, `STATUS.md`, `HANDOFF.md`, `README.md`, `package.json`, `hub/`, `tools/`, and each school's `work/`, `toolkit/`, `src/`, `scripts/`, `vendor/` and `publish/`. If a shared file needs a change, such as an out-of-date fact in a BRIEF, say so in your pull request.
5. Never push to `main`, never merge, and never rewrite another agent's branch.

## Definition of done

**Writing (step 3).** The course has all 13 files (`L01.txt` … `L12.txt` and `project.txt`), written exactly as the school's `toolkit/BRIEF.md` says, from its spec in `toolkit/courses/<COURSE>.json`. `python3 schools/<school>/toolkit/validate.py <COURSE>` reports 0 errors, and `retype_check.py <COURSE>` passes where the school has it. The pull request names the facts you looked up, with their sources, and anything you are unsure of.

**Review (step 4).** Follow the school's `toolkit/REVIEW.md`: check facts, attributions, answer keys, solutions, level and fairness; look up anything that can change instead of trusting memory; fix what you are sure of; re-validate to 0 errors. The pull request lists what you changed and what you were not sure of, and ends with a one-line entry for `work/review_log.txt` in the style of the lines already there (the lead adds it when merging).

## Independent review across models

A course is always reviewed by a different AI from the one that wrote it.

| Writer | Reviewer |
|--------|----------|
| Claude | Codex    |
| Codex  | Grok     |
| Grok   | Claude   |

## Setup

As in HANDOFF.md "Setup": `npm install`, then `python3 tools/relocate.py` once per checkout. Without Playwright and Chromium, set `TOE_SKIP_BROWSER=1`. Never commit the changes `relocate.py` makes to scripts, briefs or `tools/paths.json`.

## Running low on budget

Stop at a clean point (a finished, validated course or a finished review), push your branch, and say in the pull request exactly where you stopped. If you cannot push, give the owner a zip of the changed files and list them.
