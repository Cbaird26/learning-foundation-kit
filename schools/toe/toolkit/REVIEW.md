# Full-course review: reviewer prompt and order

Order (learning path): F1 F2 F3 F4 M1 M4 M6 M2 P1 M3 M5 M7 P2 P3 P4 M8a M8b M9a M9b P5 P6a P6b P7a P7b P8 P9 G1 G2 G3 G4 G5 G6 G7a G7b G7c G7d G8 E1 E2

Started in the first batch (Oct 27, 23:52): F1 F2 F3 F4 M1 (default model), M4 M6 M2 (sonnet). Later started: P1 M3 M5 M7 P2 P3 P4 M8a M8b M9a P5 P6a P6b P7a P7b M9b P8 P9 G1 G2 G3 G4 G5 G6 G7a G7b G7c G7d G8 E1 E2 (all started). Position-reference fix-up for F1–F4, M1–M8a, P1–P4 done (62 lines).
Later courses: model sonnet, up to 8 running at once. A course is done when it appears in /home/claude/toe/work/review_log.txt.
Pre-review snapshot of all lessons: /home/claude/toe/work/pre_review/content/

Prompt template (replace CODE and TITLE; for F4, P9 and G6 add the sentence about running code; for M6, M9a, E1 and E2 add the sentence about proofs):

You are an independent reviewer for course CODE (TITLE) of the ToE Learning Foundation, a self-study curriculum in mathematics and physics for an adult learner working alone. Your job is to find and fix errors in /home/claude/toe/content/CODE/L01.txt to L12.txt and project.txt. Do not open other files, except /home/claude/toe/toolkit/BRIEF.md if you need the file format. Work in your own new folder inside the scratchpad and run Python with -I, because other reviewers leave scripts there.

Format: sections start with @lesson, @article, @example, @mistakes, @practice <type> and @quiz <type> (and @project, @review and @exam in project.txt). Items have prompt, answer, check, hint and solution fields. In multiple-choice items, the options marked `choice*:` are the ones the site treats as correct. The site shuffles the choices when it shows them, so a hint or solution must name a choice by its content, never by its position ("the second choice", "option B", "the first has ..."); rewrite any position reference you find, and count it as a fix. `rubric:` lines are what learners check their own work against. Each `check:` is a Python computation that the validator compares with `answer:`, so final answers already agree with their checks. A check can share an item's mistake, though, so confirm that the prompt, the method, the answer and the solution agree.

Work file by file. Read each file once, then check every statement and formula in the article, every step of the worked examples, and every hint. Check every step of every solution, including intermediate numbers (recompute them with short Python calculations), and confirm the solution reaches the stated answer with the rounding the prompt asks for. Check that the choices marked correct are correct and the others are wrong, and check the rubric lines, definitions, conventions and units. In project.txt, also check the review guide and the exam items. Also fix: any item that needs data from another item ("the previous problem") — restate the data; any quiz item whose numbers repeat a worked example exactly — change its numbers; and any prompt whose required method is ambiguous in a way that would mark a correct alternative answer wrong — state the method. A num item without a `tol:` line needs an exact answer (the site rejects rounded decimals for it), so its prompt should not ask for a decimal; a prompt that asks for a rounded value needs a `tol:`.

Fix each error you are confident about directly, with a minimal Edit that keeps the format. Do not rewrite for style or change wording that is merely different from what you would write. If you change a numeric answer, update its solution and, if needed, its check. If something seems wrong but you are not sure, do not edit it; list it as unsure.

When all 13 files are done, run python3 /home/claude/toe/toolkit/validate.py CODE and fix anything until it reports 0 errors. Then append one line to /home/claude/toe/work/review_log.txt: "CODE reviewed: N fixes". Finish with at most 25 lines: each fix as file:line, what was wrong and what it says now, then any unsure points.

Code sentence: This course teaches Python: run every code snippet whose output a lesson, item or solution states, and confirm the stated output and any claims about Python's behaviour.
Proof sentence: In this proof course, check each model proof for logical gaps and invalid steps, as well as the statements themselves.

After each batch: python3 /home/claude/toe/scripts/build_site.py, then publish /home/claude/toe/site/index.html with every file in /home/claude/toe/site/data/ as data/<name>.json (artifact https://claude.ai/artifact/RiRTzVG17WZavTmTb961oM).
