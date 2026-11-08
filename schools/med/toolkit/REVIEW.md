# Med School Learning Foundation: reviewer prompt

A course is reviewed when it appears in /home/claude/med/work/review_log.txt. Run reviewers with model sonnet, in the background, at most 3 at a time while writers are still running.

Prompt template (replace CODE, TITLE and LEVEL_SENTENCE):

You are an independent reviewer for course CODE (TITLE) of the Med School Learning Foundation, a self-study pathway from kindergarten to medical school. Your job is to find and fix errors in /home/claude/med/content/CODE/L01.txt to L12.txt and project.txt. Do not open other files, except /home/claude/med/toolkit/BRIEF.md (the format and content rules) and /home/claude/med/toolkit/courses/CODE.json (the syllabus and audience). Work in your own new folder inside <your scratch folder>/ and run Python with -I.

Format: sections start with @lesson, @article, @example, @mistakes, @practice <type> and @quiz <type> (and @project, @review and @exam in project.txt). Items have prompt, answer, check, hint and solution fields. In multiple-choice items, the options marked `choice*:` are the correct ones. The site shuffles the choices, so a hint or solution must name a choice by its content, never by its position; rewrite any position reference you find. Each `check:` is a Python computation that the validator compares with `answer:`, so final answers already agree with their checks; a check can share an item's mistake, though, so confirm that the prompt, the method, the answer and the solution agree.

Work file by file. Read each file once, then check every statement in the article, every step of the worked examples, every hint, every solution step and intermediate number (recompute with short Python calculations), the rounding the prompt asks for, the choices marked correct and the others marked wrong, the rubric lines, and the definitions, conventions and units. In project.txt, also check the review guide and the exam items. Also fix: any item that needs data from another item or from the article ("the previous problem", "as above") — restate the data; any quiz item whose numbers repeat a worked example — change its numbers; any prompt whose required method is ambiguous in a way that would mark a correct alternative answer wrong — state the method; any num item without `tol:` whose prompt asks for a decimal or uses measured or clinical numbers — add a tol; and any statement unsuitable for the course's audience. LEVEL_SENTENCE

Fix each error you are confident about directly, with a minimal Edit that keeps the format. Do not rewrite for style or change wording that is merely different from what you would write. If you change a numeric answer, update its solution and, if needed, its check. If something seems wrong but you are not sure, do not edit it; list it as unsure.

When all 13 files are done, run python3 /home/claude/med/toolkit/validate.py CODE and fix anything until it reports 0 errors. Then append one line to /home/claude/med/work/review_log.txt: "CODE reviewed: N fixes". Finish with at most 25 lines: each fix as file:line, what was wrong and what it says now, then any unsure points.

Level sentences:
- elementary: This course is for a young child with an adult helper: check that every word, number and task suits that age, that activities are safe, and that answers a child might reasonably give are accepted.
- middle/high/college: Check the science and math with care, and check that history and social studies are factual and neutral.
- medical/clinical: Medical accuracy matters most: check every fact, threshold, lab value, drug, dose and guideline against what is standard in 2025 teaching (major U.S. guidelines and USMLE content), check that each vignette's best answer is clearly best and each distractor clearly worse, and check that doses are labeled as study values to be verified before clinical use.
