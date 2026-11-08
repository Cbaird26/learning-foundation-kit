# Writing one course for the Med School Learning Foundation

The Med School Learning Foundation is a Khan Academy–style self-study site for a 74-course pathway from kindergarten to medical school: elementary school (K–5), middle school, high school, college pre-medical courses, medical-school foundations, organ systems, and clinical clerkships with board review. Each course follows a 14-week syllabus. You write the lessons for ONE course: weeks 1–12 (one lesson per weekly topic) plus a project/review/final-exam file for weeks 13–14. Your course JSON says who the learner is (`audience`) and the course `level`; write for that learner. Address the learner as "you". Assume the course prerequisites, but briefly remind key prerequisite facts when you use them. Use the standard names of laws, structures, signs, syndromes, tests, drugs (generic names) and theorems: learners need them to use the readings and pass exams. Do not write about real people themselves (no biographies or anecdotes; eponyms are fine), and never mention the curriculum's author.

## Files you write (only these)

- `/home/claude/med/content/<CODE>/L01.txt` … `L12.txt` — week N lesson = the syllabus topic for week N.
- `/home/claude/med/content/<CODE>/project.txt` — the week 13–14 project brief, review guide and cumulative exam items.

Your course data (audience, level, topics, block deliverables, project, primary reading) is in `/home/claude/med/toolkit/courses/<CODE>.json`. Read it and `/home/claude/med/toolkit/example_lesson.txt` (a complete lesson from a math course showing the exact format) before writing anything.

## File format

Sections start with `@name` at the start of a line. Fields are `key: value`; a line that does not begin with a known key continues the previous field, so multi-line values are fine. Write TeX directly (`$\frac{1}{2}$`); there is no escaping. Inline math is `$...$`, display math is `$$...$$`; write `\$` for a literal dollar sign (money: `\$4.50`).

Lesson file sections, in order:
- `@lesson` — `title:` (the week's topic as a clear title), `summary:` (one sentence: what the learner will be able to do), `objective:` ×2–4, `reading:` (see below).
- `@article` — markdown: paragraphs, `###` subheadings, **bold**, lists, tables, `$math$`. Length by level (see below).
- `@example` ×1–2 — `title:`, `problem:`, `step:` ×2–6 (each step is revealed one at a time, Khan-style).
- `@mistakes` — 2–4 lines starting with `- `.
- `@practice <type>` ×5 — ordered easy → hard.
- `@quiz <type>` ×2 — new problems used only in unit quizzes, the midterm and the final. Never near-copies of practice items, and never the numbers of a worked example.

Item fields: `prompt:`, `answer:`, `check:`, `hint:` ×1–3 (progressive; the last hint gets the learner to the method but not the final value), `solution:` (complete and short), plus optional `vars:`, `domain:`, `tol:`, `form:`, `const:`, `unit:`, `lead:`. Item types:

| type | learner enters | answer | check |
|---|---|---|---|
| `num` | one number or exact value | `3/4`, `sqrt(2)/2`, `2pi`, `1.5e3`, `inf`, `dne` | expression giving the value |
| `expr` | an expression in `vars` | `3x^2 sin(x)` | `lambda x: ...` taking `vars` in order |
| `list` | several values, any order | `-2, 3` (or `none`) | expression giving all values |
| `tuple` | ordered values | `(2, -1, 0)` | expression giving the components in order |
| `mc` | one choice | — mark the correct `choice*:` | — |
| `ms` | select all that apply | — mark every correct `choice*:` | — |
| `self` | works on paper, then compares | — give `solution:` (a model answer) and `rubric:` ×2–4 | — |

`mc`/`ms` use `choice:` lines (3–5 total) with the correct ones written `choice*:`. **The site shuffles the choices**, so never use "all/none of the above" or "both A and B", and in hints and solutions name a choice by its content, never by its position ("the second choice", "option B"). Distractors come from real misconceptions. Use `self` for writing, explanations, derivations, notes, plans and anything a person must judge; give a complete model `solution:` and 2–4 `rubric:` lines the learner checks their work against.

Optional fields: `vars: x, y` (expr; also any multi-letter or subscripted symbol such as `omega`, `v_0`); `domain: x: 3..6` (sampling ranges for expr equivalence; default 0.35..2.65 — set it whenever the answer is undefined there); `tol: 0.005` (absolute) or `tol: 1%` (relative) whenever the prompt asks for rounding or uses measured or clinical data; `form: expanded` or `form: factored`; `const: yes` (antiderivatives); `unit: mg` (shown after the input box; ask for the value in that unit); `lead: $x =$` (shown before the input box).

A `num` item without `tol:` needs an exact answer: the site rejects a rounded decimal for it, so such a prompt must not ask for a decimal. Any prompt that asks for a rounded value, or uses measured or clinical numbers, needs a `tol:`.

## Canonical answer syntax (what the site's grader reads)

Plain calculator syntax with implicit multiplication: `3/4`, `-sqrt(3)/2`, `2pi`, `e^(-x)`, `x^2`, `ln(x)`, `log(x)` (base 10 only), `abs(x)`, `5!`, `1.5e3`, `inf`, `dne`. No units, words or `x =` inside answers. Prefer exact answers; for rounded answers give the rounded value and a `tol`.

## Checks: every num/expr/list/tuple item must be verified by computation

`check:` is ONE Python expression that computes the expected result **independently from the problem statement**: redo the arithmetic from the given numbers (`(140 - (104 + 24))` for an anion gap, `(140 - 60) * 70 / (72 * 1.2)` for a Cockcroft–Gault clearance, `comb(5, 2)`, `90 / (90 + 10)` for a sensitivity) — never retype your answer. The validator compares it with your `answer` using the site's own grader. For `expr`, the check is a lambda that returns, for given inputs, the value the correct expression must have.

Available names: `quad(f,a,b)`, `nderiv(f,x,n=1..3)`, `root(f,a,b)`, `allroots(f,a,b)`, `roots(coeffs)`, `lin(A,b)`, `det(A)`, `inv(A)`, `mat(A)`, `dot`, `norm`, `lim(f,x0)`, `nsum(f,a,b)` (inclusive), `ivp(f,y0,t0,t1)`, `comb`, `perm`, `factorial`, `erf`, `Fraction`, `math`, `np`, `special` (scipy.special), `sin cos tan arcsin arccos arctan exp log ln log10 log2 sqrt floor ceil`, `pi`, `e`, `inf`, and Python builtins such as `sum`, `range`, `min`, `max`, `round`. `log` is the natural log here. Only when an item truly cannot be computed, write `nocheck: <reason>` instead (at most two per course).

## Writing for each level

- **Elementary (K–5).** The learner is a child with an adult helper who reads aloud. Short sentences, everyday words, one idea at a time, concrete things a child can see, count or touch. Articles 120–300 words (K–2) or 200–400 words (grades 3–5). Examples have 2–4 steps. Prompts are one or two short sentences with small, friendly numbers. Use mostly `mc` and `num` items (at least 4 of 7 auto-graded); a `self` item may be a hands-on task ("Draw…", "Read this aloud to your grown-up…") whose rubric the adult checks. Avoid TeX except for simple arithmetic like $3 + 4 = 7$. Reading courses use short original passages written by you, quoted inside the prompt. Hands-on activities use only safe household materials, with a grown-up.
- **Middle school.** Articles 250–450 words; clear, encouraging, concrete before abstract.
- **High school.** Articles 300–600 words.
- **College.** Articles 350–700 words; university-level precision, worked quantitative examples.
- **Medical and clinical.** Articles 400–900 words. Teach mechanism first, then presentation, diagnosis and management. Use clinical vignettes: "A 58-year-old man with … presents with …". `mc` items are USMLE-style single best answer with 4–5 plausible choices; `ms` items ask which findings or actions apply; `num` items cover clinical calculations (anion gap, A–a gradient, creatinine clearance, corrected calcium, sensitivity, predictive values, likelihood ratios, number needed to treat, weight-based doses, infusion rates, half-life); `self` items ask for a differential diagnosis, a plan, a note, an explanation of mechanism or a counseling script, with a model answer and rubric.

## Content standards

- **Correct above all.** Precise definitions, true statements, stated conventions and units. If unsure of a fact, choose a problem you can verify.
- **Medicine.** Teach the current standard of care as commonly taught in 2025 (major U.S. guidelines and USMLE content); where guidelines differ between organizations or are changing, say so in one clause rather than picking a side. Use generic drug names. Give doses only where a standard dose is itself a core fact (for example, epinephrine for anaphylaxis) or where a calculation is the point; label such doses as typical adult doses for study, to be checked against current references before any clinical use. Give lab values in conventional U.S. units (mg/dL, mEq/L) and add SI where useful. Vignettes are invented: no real patients. Use respectful, person-first language. Never present this as medical advice to the reader about their own health.
- **History, social studies and current issues.** Factual and neutral. Present major perspectives fairly, describe religions descriptively, and do not take sides on contested political questions.
- **Reading and writing.** Write your own passages and model essays. You may quote short passages from works published before 1929; never reproduce later copyrighted text.
- **Khan-style teaching:** intuition and a concrete case first, then the precise statement; short paragraphs; key results in display math or bold; worked examples whose steps each do one thing.
- **Science.** SI units, given values stated in the prompt, `unit:` and `tol: 1%` for numeric answers from data. Experiments only with safe household materials (no flames, heat sources, glassware or chemicals beyond kitchen items such as vinegar, baking soda and red cabbage); for anything else, use clearly labeled supplied data.
- **Course profile** (in your course JSON): Y young learner — short items, objects and pictures in words, hands-on tasks with an adult. T theory — standard mix of auto-graded items and a few `self`. W reading and writing — reading items on short original passages (`mc`, `ms`), grammar and vocabulary (`mc`), and `self` items for writing with clear rubrics; still at least 3 auto-graded items per lesson. L laboratory science — measurement, data and calculation items (`num` with `tol`), design choices (`mc`), and procedures (`self`). X clinical — vignettes, calculations, and `self` items for plans, notes and differentials.
- Each lesson's practice + quiz items include at least 3 auto-graded ones (not `self`).
- Where natural, one item in a block's second-week lesson exercises that block's deliverable (in your course JSON).
- Every item is self-contained: restate any data it needs. Never write "the previous problem", "the example above" or "as above" in an item, because items appear alone in practice sessions and exams.
- **reading:** name the part of the course's primary reading to study that week (chapter, section or article title) only if you are confident it exists there; otherwise name the topic to look up in that resource. No URLs anywhere.
- Original wording only: do not reproduce textbook, question-bank or board-review passages or questions.
- Week 7 is an ordinary lesson; the site schedules the midterm itself.

## project.txt

- `@project` — `title:`, `overview:` (2–3 sentences), `goal:` ×2–4, `step:` ×4–8 (a concrete plan), `deliverable:` ×2–4, `rubric:` ×3–6, optional `safety:`, `tutor:` ×2–3 (good questions to ask the AI tutor while doing the project). Base it on the syllabus project. Any "supplied" data, cases, sources or transcripts the project needs must be written out in `material:` fields (one per case, data set or source; markdown allowed), placed after the steps. Never put text after the `tutor:` lines: it would become part of the last tutor question.
- `@review` — markdown week-13 review guide: the course's key ideas week by week, a self-check list, and the most common errors. 250–600 words (elementary 120–300).
- `@exam <type>` ×3 — cumulative, multi-step final-exam problems that connect several weeks; at least one auto-graded; same fields and checks as practice items.

## Workflow

1. Read your course JSON and the example lesson, once each. Do not open any other file: not the site's checker, the validator, the toolkit scripts or other courses. Everything you need is in this brief. Do not run experiments before writing; write, then let the validator tell you what to fix.
2. If some of your lesson files already exist (you may be resuming), run the validator first and continue with the missing ones. Never rewrite a lesson that already passes.
3. Write two lessons per message (two Write calls), in week order, then project.txt. Do not read your files back after writing them.
4. After every four lessons, run `python3 /home/claude/med/toolkit/validate.py <CODE>` and fix every ERROR in the files you have written (ignore "file missing" for files you have not written yet). Fix errors with Edit, using the reported line numbers. When all files exist, rerun until it reports 0 errors.
5. Finish with a message of at most five lines: the validator result, the item count, any `nocheck` items, and any topic where you are unsure of accuracy. Do not paste lesson content.

Work only inside your course folder. Do not modify the toolkit, install packages or browse the web.
