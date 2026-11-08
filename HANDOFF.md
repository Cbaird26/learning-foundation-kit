# Handoff: Learning Foundation

Read this first if you are an AI agent (or a person) picking up this project. It explains what exists, the rules,
how a school is built, and how to keep this handoff current. **STATUS.md** says exactly where the work stopped.

## What this project is

A family of free, Khan Academy-style self-study schools. Each school is a complete path of courses from the basics to
the frontier of one field: every course has 12 weekly lessons (reading, worked examples, common mistakes, free
readings), auto-graded practice, quizzes, a project, a cumulative exam, mastery levels and an error log. Each school is
**one self-contained HTML page** hosted on GitHub Pages, and a hub page links them all.

| School | Live page | Repo | Courses | Storage prefix |
| --- | --- | --- | --- | --- |
| Hub | https://cbaird26.github.io/learning-foundation/ | `learning-foundation` | | reads all below |
| AI and machine learning | https://cbaird26.github.io/ai-learning-foundation/ | `ai-learning-foundation` | 66 | `alf` |
| Coding | https://cbaird26.github.io/coding-learning-foundation/ | `coding-learning-foundation` | 63 | `clf` |
| Finance | https://cbaird26.github.io/finance-learning-foundation/ | `finance-learning-foundation` | 63 | `flf` |
| Law | https://cbaird26.github.io/law-school-learning-foundation/ | `law-school-learning-foundation` | 67 | `lsl` |
| Medicine | https://cbaird26.github.io/med-school-learning-foundation/ | `med-school-learning-foundation` | 74 | `msl` |
| Metaphysics | https://cbaird26.github.io/metaphysics-learning-foundation/ | `metaphysics-learning-foundation` | 63 | `mlf` |
| Neuroscience and cognitive science | https://cbaird26.github.io/neuroscience-learning-foundation/ | `neuroscience-learning-foundation` | 70 | `nlf` |
| Theoretical physics | https://cbaird26.github.io/toe-learning-foundation/ | `toe-learning-foundation` | 39 | `toe` |

All repos are under the GitHub account `Cbaird26`. This repo (`learning-foundation-kit`) holds the **sources** for every
school and the tools to build new ones; the school repos hold only the built page.

## Ground rules (do not break these)

1. **Nothing personal, anywhere.** Never name the owner or the curriculum's author, and never put a personal name,
   email address, local file path or account detail in a site, README, commit message or this kit. The GitHub
   account name appears only inside the `github.io` and `github.com` URLs.
2. Never touch the owner's personal homepage repo (`cbaird26.github.io`); it stays private.
3. **Ask the owner before** creating a repo, publishing a site or pushing to a school's live repo. Building and
   testing locally needs no permission.
4. One school per public repo, named `<subject>-learning-foundation`, published with GitHub Pages from branch `main`,
   folder `/` (root). A school repo contains only `index.html` (the built page), `README.md`,
   `THIRD-PARTY-NOTICES.md` (when third-party code such as Brython or KaTeX fonts is embedded) and an empty
   `.nojekyll`.
5. Every new school uses a **new, unique three-letter storage prefix** (its browser data lives under
   `<prefix>-progress-v1`, `<prefix>-errorlog-v1`, `<prefix>-scratchpad-v1`). All schools share one web origin, so a
   reused prefix would mix two schools' progress.
6. Content standards (the full list is in each school's `toolkit/BRIEF.md`): accuracy first, and look up anything
   that can change (exam formats, laws, statistics, survey figures, who holds a role) instead of trusting memory;
   quotations only from texts first published before 1929, everything else paraphrased; contested questions
   (religion, politics, open scientific and philosophical debates) presented with the main views and their strongest
   arguments, never with one side marked "correct"; American spelling; no images (describe diagrams in words and
   tables); every school says plainly that scores do not award credit, degrees or any credential.
7. Commit messages and READMEs describe the work, not the people.

## Repository map

```
HANDOFF.md            this guide
STATUS.md             where the work stands, the next step, and the queue of future schools
package.json          KaTeX (needed by the site build and the math-rendering check)
tools/relocate.py     points every script at this checkout (run once after cloning)
tools/paths.json      the roots relocate.py last used
hub/index.html        the hub page; its school list is the JSON block id="school-data"
schools/<id>/
  content/<COURSE>/L01.txt … L12.txt, project.txt   lesson sources (the real work)
  toolkit/BRIEF.md       writer brief: the exact file format, item types, levels, content standards, workflow
  toolkit/REVIEW.md      reviewer prompt and checklist (one independent review per course)
  toolkit/example_*.txt  complete, valid example lessons (format samples; never copy their content)
  toolkit/courses/*.json per-course specs for writers: audience, level, weekly topics, project, readings
  toolkit/validate.py    validator: parses a course, runs every computed check, writes build/<COURSE>.json
  toolkit/pycheck.py     runs code items in the in-browser Python (Brython) through headless Chromium
  toolkit/verify.js      checks that every formula renders in KaTeX
  scripts/build_catalog.py  work/courses_raw.json + meta → src/catalog.json and toolkit/courses/*.json
  scripts/integrate.py   validates every course and reports which are ready
  scripts/build_site.py  builds the single-file site in site/
  scripts/pyworker.py    builds the in-browser Python worker (schools with code only)
  src/                   the app: index.template.html, app.css, app_core.js (store, mastery, home, courses),
                         app_ex.js (practice, quizzes, exams, error log), app_static.js (method, path, start pages),
                         app_tutor.js, app_code.js and pyrunner.js (Python), checker.js, mathtext.js, catalog.json
  vendor/brython/        Brython (Python in the browser), only in schools with code
  work/curriculum.py     the school's design: stages and every course (title, purpose, units, topics, project)
  work/courses_raw.json, work/meta.json   written by curriculum.py
  work/WRITERS.md        writer prompt template and course notes used to write the school
  publish/README.md, publish/THIRD-PARTY-NOTICES.md   what goes into the school's live repo with index.html
```

`schools/metaphysics` and `schools/finance` are the newest and most complete templates (Python in the page, all
validator rules). `schools/med` and `schools/law` are the templates without Python.

## Setup

Needs Python 3.10+ and Node 18+. Playwright with Chromium is optional (used for the in-browser Python checks and page tests).

```
git clone https://github.com/Cbaird26/learning-foundation-kit
cd learning-foundation-kit
npm install                      # KaTeX 0.16.47
python3 tools/relocate.py        # rewrites the absolute paths in scripts and briefs to this checkout
# optional, for code items and browser tests:
pip install playwright && python3 -m playwright install chromium
# without Playwright, skip the browser half of the code check:
export TOE_SKIP_BROWSER=1
```

Check the setup: `python3 schools/law/scripts/integrate.py` should list every law course as ok, and
`python3 schools/law/scripts/build_site.py` should rebuild the law site (it was verified to come out byte-identical
to the live page).

## How a school is made

Work one school at a time and commit to this kit after every step, updating STATUS.md, so the next agent can continue.

1. **Design.** Copy the closest existing school to `schools/<id>` (with Python: metaphysics or finance). Edit
   `work/curriculum.py`: the stages, which elementary, middle and high school courses to reuse (copy their
   `content/<CODE>` folders unchanged from the school they come from), and every new course with its purpose, level,
   weekly topics (12 teaching weeks; weeks 13–14 are project, review and final), project and free readings. Run it,
   then `scripts/build_catalog.py`. Update `toolkit/BRIEF.md` (the field's content standards, notation, current facts
   with sources), `toolkit/REVIEW.md` (level sentences, field-specific checks) and add an example lesson for the field.
2. **Rebrand the app.** In `src/`: page title, description and nav in `index.template.html`; the storage prefix
   (`LS_P`, `LS_E`, `PAD_KEY`), masthead and lede in `app_core.js` / `app_code.js`; method, path and start pages in
   `app_static.js`; tutor context in `app_tutor.js`. In `scripts/build_site.py`, the output file name.
3. **Write.** For each new course write `content/<CODE>/L01.txt … L12.txt` and `project.txt` exactly as
   `toolkit/BRIEF.md` specifies. After every few lessons run `python3 toolkit/validate.py <CODE>` and fix every error.
4. **Review.** Each course gets an independent review using `toolkit/REVIEW.md` (a different agent or a fresh session
   from the writer): it checks facts, attributions, answer keys, solutions, level and fairness, fixes what it is sure
   of, re-validates, and appends a line to `work/review_log.txt`.
5. **Integrate and build.** `python3 scripts/integrate.py` (all courses ok), then `python3 scripts/build_site.py`.
6. **Test the page.** Open `site/<name>.html` in a browser: home, courses, a lesson with math, practice (right and
   wrong answers), a quiz, a final exam, the error log, the Python page if any, phone width and dark mode; the console
   must show no errors.
7. **Publish (with the owner's yes).** Create the public repo `<subject>-learning-foundation`; commit the built page as
   `index.html` plus `publish/README.md` (live link, what the school covers, accuracy and fairness note, no-credit
   note), `publish/THIRD-PARTY-NOTICES.md` if needed, and `.nojekyll`; turn on Pages (main, root); open the live URL.
8. **Add it to the hub.** Add one entry to the `school-data` JSON in `hub/index.html` (title, field, school name, URL,
   color, glyph, from/to, course count, stages, short description, storage prefix as `key`); add a `--c-<color>` pair
   in the hub's CSS if it needs a new color; push to the `learning-foundation` repo (with the owner's yes); update the
   copy in this kit.

## The lesson format in one glance

Full rules: `schools/metaphysics/toolkit/BRIEF.md` (and the field's own BRIEF). A lesson file looks like this:

```
@lesson
title: …
summary: one sentence: what the learner will be able to do
objective: … (2–4)
reading: a free source, named precisely

@article
Markdown with ### subheadings, tables, ```code``` blocks and $TeX$ math.

@example
title: …
problem: …
step: … (2–6 steps, revealed one at a time)
answer: …

@mistakes
- … (2–4)

@practice num        (5 practice items, easy to hard; types: num, mc, ms, self, code, text, list, tuple)
prompt: …
answer: 14
check: 7 * 2         (computed; the validator checks it equals the answer)
hint: …
solution: …

@quiz mc             (2–3 quiz items, new problems only)
prompt: …
choice: …
choice*: the correct one (the site shuffles choices: never refer to them by position)
hint: …
solution: …
```

Each lesson needs at least three auto-graded items. `project.txt` holds `@project`, `@review` and `@exam` items.

## Keeping this handoff current

- After each step, update **STATUS.md** (what is done, what is next, any decisions) and commit with a short message.
- If you cannot push to GitHub, give the owner a zip of the changed files and say which ones changed.
- If you run low on budget, stop at a clean point (a finished, validated course), update STATUS.md, and commit.

## Prompt to give the next agent

> You are continuing the Learning Foundation project, a set of free self-study schools. Clone
> https://github.com/Cbaird26/learning-foundation-kit, read HANDOFF.md and STATUS.md, and follow the ground rules
> exactly (nothing personal anywhere; ask me before creating repos or publishing). Continue from the next step in
> STATUS.md, one course at a time, validating each course to 0 errors. After each finished step, update STATUS.md and
> commit to the kit (or give me a zip of changed files if you cannot push).
