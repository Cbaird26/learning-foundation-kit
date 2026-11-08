# Writing one course for the ToE Learning Foundation

The ToE Learning Foundation is a Khan Academy–style self-study site for a 39-course curriculum that runs from algebra to graduate theoretical physics. Each course follows a 14-week syllabus. You write the lessons for ONE course: weeks 1–12 (one lesson per weekly topic) plus a project/review/final-exam file for weeks 13–14. The learner is a motivated adult studying alone with an AI tutor; assume the course prerequisites, but briefly remind key prerequisite facts when you use them. Address the learner as "you". Use the standard names of laws, constants, equations and theorems (Planck's constant, the de Broglie wavelength, Gauss's law, the Schrödinger equation, the Cauchy–Schwarz inequality): learners need them to use the readings. Do not write about real people themselves (no biographies or anecdotes), and never mention the curriculum's author.

## Files you write (only these)

- `/home/claude/toe/content/<CODE>/L01.txt` … `L12.txt` — week N lesson = the syllabus topic for week N.
- `/home/claude/toe/content/<CODE>/project.txt` — the week 13–14 project brief, review guide and cumulative exam items.

Your course data (topics, block deliverables, project, primary reading) is in `/home/claude/toe/toolkit/courses/<CODE>.json`. Read it and `/home/claude/toe/toolkit/example_lesson.txt` (a complete lesson showing the exact format) before writing anything.

## File format

Sections start with `@name` at the start of a line. Fields are `key: value`; a line that does not begin with a known key continues the previous field, so multi-line values are fine. Write TeX directly (`$\frac{1}{2}$`); there is no escaping. Inline math is `$...$`, display math is `$$...$$`; write `\$` for a literal dollar sign.

Lesson file sections, in order:
- `@lesson` — `title:` (the week's topic as a clear title), `summary:` (one sentence: what the learner will be able to do), `objective:` ×2–4, `reading:` (see below).
- `@article` — markdown: paragraphs, `###` subheadings, **bold**, lists, tables, ```` ```python ```` code fences, `$math$`. 300–650 words (graduate courses up to 900).
- `@example` ×1–2 — `title:`, `problem:`, `step:` ×3–6 (each step is revealed one at a time, Khan-style).
- `@mistakes` — 2–4 lines starting with `- `.
- `@practice <type>` ×5 — ordered easy → hard.
- `@quiz <type>` ×2 — new problems used only in unit quizzes, the midterm and the final. Never near-copies of practice items.

Item fields: `prompt:`, `answer:`, `check:`, `hint:` ×1–3 (progressive; the last hint gets the learner to the method but not the final value), `solution:` (complete and short), plus optional `vars:`, `domain:`, `tol:`, `form:`, `const:`, `unit:`, `lead:`. Item types:

| type | learner enters | answer | check |
|---|---|---|---|
| `num` | one number or exact value | `3/4`, `sqrt(2)/2`, `2pi`, `1.5e3`, `3-2i`, `inf`, `dne` | expression giving the value |
| `expr` | an expression in `vars` | `3x^2 sin(x)` | `lambda x: ...` taking `vars` in order |
| `list` | several values, any order | `-2, 3` (or `none`) | expression giving all values |
| `tuple` | ordered values | `(2, -1, 0)` | expression giving the components in order |
| `mc` | one choice | — mark the correct `choice*:` | — |
| `ms` | select all that apply | — mark every correct `choice*:` | — |
| `self` | works on paper, then compares | — give `solution:` (a model answer) and `rubric:` ×2–4 | — |

`mc`/`ms` use `choice:` lines (3–5 total) with the correct ones written `choice*:`. Choices are shuffled, so never use "all/none of the above". Distractors come from real misconceptions. Use `self` for proofs, derivations, code to write, designs and explanations; give a complete model `solution:` and 2–4 `rubric:` lines the learner checks their work against.

Optional fields: `vars: x, y` (expr; also any multi-letter or subscripted symbol such as `omega`, `v_0`); `domain: x: 3..6; t: 0..1` (sampling ranges for expr equivalence; default 0.35..2.65 for each variable — set it whenever the answer is undefined there); `tol: 0.005` (absolute) or `tol: 1%` (relative) whenever the prompt asks for rounding or uses measured data; `form: expanded` or `form: factored` (when the prompt demands that form); `const: yes` (antiderivatives: accept any added constant; tell the learner to omit $+C$); `unit: m/s` (shown after the input box; ask for the value in that unit); `lead: $f'(x) =$` (shown before the input box).

## Canonical answer syntax (what the site's grader reads)

Plain calculator syntax with implicit multiplication: `3/4`, `-sqrt(3)/2`, `2pi`, `pi/6`, `e^(-x)`, `x^2`, `ln(x)` (natural log), `log(x)` (base 10 only), `log_2(x)`, `abs(x)`, `asin(x)`, `5!`, `1.5e3`, `3 - 2i` (`i` is the imaginary unit unless it is declared in `vars`), `inf`, `dne`. Greek names (`theta`, `omega`, `hbar`) and subscripts (`v_0`) work when declared in `vars`. No units, words or `x =` inside answers. Prefer exact answers; for rounded answers give the rounded value and a `tol`.

## Checks: every num/expr/list/tuple item must be verified by computation

`check:` is ONE Python expression that computes the expected result **independently from the problem statement**: solve the original equation (`root`), differentiate the original function (`nderiv`), integrate (`quad`), simulate an ODE (`ivp`), sum the series, multiply the matrices — never retype your answer. The validator compares it with your `answer` using the site's own grader. For `expr`, the check is a lambda that returns, for given inputs, the value the correct expression must have (e.g. for "differentiate $x^3\sin x$": `lambda x: nderiv(lambda t: t**3*sin(t), x)`; for "simplify $3(x+2)-2(x-1)$": `lambda x: 3*(x+2) - 2*(x-1)`).

Available names: `quad(f,a,b)`, `quad2(f,x0,x1,y0,y1)` (y bounds may be functions of x), `quad3(f,x0,x1,y0,y1,z0,z1)`, `nderiv(f,x,n=1..3)`, `pderiv(f,point,i,n)`, `root(f,a,b)` (exactly one root in [a,b]), `allroots(f,a,b)`, `roots(coeffs)`, `lin(A,b)`, `eig(A)`, `det(A)`, `inv(A)`, `rank(A)`, `mat(A)`, `dot`, `cross`, `norm`, `lim(f,x0,side=0|1|-1)`, `liminf(f)`, `nsum(f,a,b)` (inclusive), `series(f,a)` (fast-converging only), `ivp(f,y0,t0,t1)`, `comb`, `perm`, `factorial`, `gamma`, `erf`, `Fraction`, `math`, `cmath`, `np`, `special` (scipy.special), `sin cos tan sec csc cot arcsin arccos arctan arctan2 sinh cosh tanh exp log ln log10 log2 sqrt cbrt floor ceil`, `pi`, `e`, `I` (imaginary unit), `inf`, and Python builtins such as `sum`, `range`, `min`, `max`, `round`. `log` is the natural log here. A check may return `"dne"` or `inf`. Only when an item truly cannot be computed, write `nocheck: <reason>` instead (at most two per course).

## Content standards

- **Correct above all.** Precise definitions, true statements, conventions stated (sign conventions, metric signature, units, branch cuts). If unsure of a fact, choose a problem you can verify.
- **Khan-style teaching:** intuition and a concrete case first, then the precise statement; short paragraphs; key results in display math; worked examples whose steps each do one thing.
- **Physics:** SI units, given values stated in the prompt (e.g. take $g = 9.8\ \text{m/s}^2$), `unit:` and `tol: 1%` for numeric answers from data.
- **Course profile** (in your course JSON): T theory — standard mix. C computation — Python in articles and examples; "what does this print" `mc`, `num` items whose check runs the same computation in Python, `self` items for code to write (model code in the solution). L laboratory — uncertainty, calibration and fitting computations (`num` with `tol`), design choices (`mc`), procedures (`self`); only safe home experiments (motion, low-voltage circuits) or clearly labeled supplied/simulated data. R research — mostly `self`, `mc` and `ms` with good rubrics, plus `num` where statistics or estimates arise. Proof courses use `self` for proofs but still include `mc`/`ms` (valid vs invalid steps, negations, counterexamples) and `num` where natural.
- Each lesson's practice + quiz items include at least 3 auto-graded ones (not `self`); computational courses should have 4+ of 5 practice items auto-graded.
- Where natural, one item in a block's second-week lesson exercises that block's deliverable (in your course JSON).
- **reading:** name the part of the course's primary reading to study that week (lecture/session/chapter/section) only if you are confident it exists there; otherwise name the topic to look up in that resource. No URLs anywhere.
- Original wording only: do not reproduce textbook passages or problems.
- Week 7 is an ordinary lesson; the site schedules the midterm itself.

## project.txt

- `@project` — `title:`, `overview:` (2–3 sentences), `goal:` ×2–4, `step:` ×4–8 (a concrete plan), `deliverable:` ×2–4, `rubric:` ×3–6 (criteria matching the course profile), optional `safety:`, `tutor:` ×2–3 (good questions to ask the AI tutor while doing the project). Base it on the syllabus project.
- `@review` — markdown week-13 review guide: the course's key results and methods week by week, a self-check list, and the most common errors. 250–600 words.
- `@exam <type>` ×3 — cumulative, multi-step final-exam problems that connect several weeks; at least one auto-graded; same fields and checks as practice items.

## Workflow

1. Read your course JSON and the example lesson, once each. Do not open any other file: not the site's checker, the validator, the toolkit scripts or other courses. Everything you need is in this brief. Do not run experiments before writing; write, then let the validator tell you what to fix.
2. If some of your lesson files already exist (you may be resuming), run the validator first and continue with the missing ones. Never rewrite a lesson that already passes.
3. Write two lessons per message (two Write calls), in week order, then project.txt. Do not read your files back after writing them.
4. After every four lessons, run `python3 /home/claude/toe/toolkit/validate.py <CODE>` and fix every ERROR in the files you have written (ignore "file missing" for files you have not written yet). Fix errors with Edit, using the reported line numbers. When all files exist, rerun until it reports 0 errors.
5. Finish with a message of at most five lines: the validator result, the item count, any `nocheck` items, and any topic where you are unsure of accuracy. Do not paste lesson content.

Work only inside your course folder. Do not modify the toolkit, install packages or browse the web.
