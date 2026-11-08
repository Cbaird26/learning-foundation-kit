# Status

Last updated: 2026-11-07

## Live

Seven schools and the hub are live (see the table in HANDOFF.md). Their sources in `schools/` match the live pages.
The newest is the AI Learning Foundation, live at https://cbaird26.github.io/ai-learning-foundation/ (repo
`ai-learning-foundation`) and listed on the hub.

## Done: AI Learning Foundation (`schools/ai`)

A school of artificial intelligence and machine learning: 66 courses from kindergarten to machine-learning research.
46 courses are reused from the Coding school (its K–12 courses, and its CS core renumbered C1–C10); 20 are new
(C11–C24 and P1–P6). Storage prefix `alf`; site file `ai-learning-foundation.html`; repo `ai-learning-foundation`.

| Step | State |
| --- | --- |
| 1. Design (curriculum.py, catalog, BRIEF, REVIEW, example lesson) | done |
| 2. Rebrand the app (storage prefix `alf`, texts, tutor, method and path pages) | done |
| 3. Write the 20 new courses | done (see table) |
| 4. Independent review of each course | done (see table) |
| 5. Integrate and build | done (66 courses validate with 0 errors; 16.8 MB page) |
| 6. Test the page | done (279 routes, in-page Python, grading, final exam, error log, phone and dark views) |
| 7. Publish as `ai-learning-foundation` (owner's yes first) | done (approved; live on GitHub Pages) |
| 8. Add to the hub | done |

How to continue step 3: for each course without 13 files, write it exactly as `schools/ai/toolkit/BRIEF.md` says, using
`schools/ai/toolkit/courses/<CODE>.json` and the example `schools/ai/toolkit/example_ml_lesson.txt`, then run
`python3 schools/ai/toolkit/validate.py <CODE>` until it reports 0 errors. `schools/ai/work/WRITERS.md` has the writer
prompt, per-course notes and the log. Step 4 uses `schools/ai/toolkit/REVIEW.md`; record each review in
`schools/ai/work/review_log.txt`.

Decisions so far:
- Python runs in the page (Brython), as in Coding, Finance and Metaphysics. Brython has no NumPy, so graded exercises
  build each method from scratch in plain Python on tiny data; lessons may show NumPy or PyTorch code for reference.
- Laws and policy are taught only from the verified "current facts" in the BRIEF (EU AI Act with the 2026 Digital
  Omnibus dates, US executive orders, California SB 53, NIST AI RMF), with a reminder to check the current text.

<!-- ai-table -->
| Course | Title | Files | Validates | Reviewed |
| --- | --- | --- | --- | --- |
| C11 | Numerical computing in Python for machine learning | 13/13 | yes | yes |
| C12 | Optimization for machine learning | 13/13 | yes | yes |
| C13 | Probability, statistics and information theory for machine learning | 13/13 | yes | yes |
| C14 | Data science: wrangling, exploration and visualization | 13/13 | yes | yes |
| C15 | Supervised learning in depth | 13/13 | yes | yes |
| C16 | Unsupervised learning and probabilistic models | 13/13 | yes | yes |
| C17 | Deep learning foundations | 13/13 | yes | yes |
| C18 | Deep learning architectures: convolution, recurrence and attention | 13/13 | yes | yes |
| C19 | Natural language processing | 13/13 | yes | yes |
| C20 | Computer vision | 13/13 | yes | yes |
| C21 | Reinforcement learning | 13/13 | yes | yes |
| C22 | Causal inference and experimentation | 13/13 | yes | yes |
| C23 | AI ethics, safety and governance | 13/13 | yes | yes |
| C24 | Machine learning engineering and MLOps | 13/13 | yes | yes |
| P1 | Statistical learning theory | 13/13 | yes | yes |
| P2 | Probabilistic machine learning and generative models | 13/13 | yes | yes |
| P3 | Large language models | 13/13 | yes | yes |
| P4 | Interpretability and AI alignment | 13/13 | yes | yes |
| P5 | Research methods in machine learning | 13/13 | yes | yes |
| P6 | Research apprenticeship and qualifying exams | 13/13 | yes | yes |
<!-- /ai-table -->

## Queue of future schools (one at a time, in this order)

1. AI and machine learning (done, live)
2. Neuroscience and cognitive science (to neuroscience PhD prep) (next)
3. Mathematics (to math PhD qualifying exams)
4. Economics (to economics PhD prep)
5. Electrical and computer engineering (to the FE and PE exams)
6. Nursing (to the NCLEX-RN)
7. Accounting (to the CPA exam)
8. Psychology (to licensure via the EPPP, or a research PhD)
9. Public health and epidemiology (to the MPH and the CPH exam)
10. Actuarial science (to the first SOA exams, P and FM)
11. Architecture (to the ARE)
12. Pharmacy, physician assistant, dentistry or veterinary medicine (each reuses much of Medicine)
13. Chemistry and biochemistry (to PhD prep)
14. Earth and climate science (to graduate study)
15. History (to PhD prep)
16. Latin and Ancient Greek (to reading Plato, Aristotle and Aquinas in the original)
17. Theology and religious studies (to seminary or graduate study)
18. Music theory and composition (to conservatory-level theory)

## Log

- 2026-11-07: Kit created with the sources of all six live schools and the hub. Started the AI school.
- 2026-11-07: AI school designed: 66 courses (46 reused, 20 new), brief, review template, validated example lesson, rebranded app. Next: write the 20 new courses.
- 2026-11-07: C14 written (0 errors) and in review; C11, C12, C13, C15 and C16 being written.
- 2026-11-07: C13 written (0 errors) and in review; C17 started.
- 2026-11-07: C11 written (0 errors) and in review; C14 reviewed (16 fixes plus one follow-up); C18 started.
- 2026-11-07: C12 written (0 errors) and in review; C13 reviewed (5 fixes plus follow-ups); C19 started.
- 2026-11-07: C11 and C12 reviewed; C15 written (0 errors) and in review; C20 started.
- 2026-11-07: C17 written (0 errors) and in review; C21 started.
- 2026-11-07: C15 reviewed; C16, C18 and C19 written (0 errors) and in review; C22 started.
- 2026-11-07: C18 reviewed (24 fixes); C23 started.
- 2026-11-07: C17 reviewed (34 fixes plus one follow-up).
- 2026-11-07: C20 written (0 errors) and in review; P1 started.
- 2026-11-07: C19 reviewed (27 fixes plus one follow-up).
- 2026-11-07: C20 reviewed (15 fixes plus two follow-ups).
- 2026-11-07: C16, C22 and C23 reviewed with follow-ups; C21 and C24 written and in review; P3 and P4 being written; re-typing audit found 16 code items to rework in C11, C13, C14 and C16 (fixes running); BRIEF updated with Digital Omnibus details
- 2026-11-07: C11, C13, C14 and C16 re-typing fixes done; C21 and C24 reviewed with follow-ups; P1, P2 and P3 written and in review; P4, P5 and P6 being written
- 2026-11-07: P2 and P3 reviewed with follow-ups; trial site build passes; P1 in review; P4, P5 and P6 being written
- 2026-11-07: P1 reviewed with follow-ups; 63 of 66 courses written and reviewed; P4, P5 and P6 being written
- 2026-11-07: P5 written and in review; P4 and P6 being written
- 2026-11-07: P5 reviewed with follow-up; 64 of 66 courses written and reviewed; P4 and P6 being written
- 2026-11-07: All 66 courses written; P4 and P6 in review (the last two); then final build, browser tests and the publish question
- 2026-11-07: P6 reviewed; 65 of 66 courses reviewed, P4 in review; owner approved publishing when the final build and tests pass
- 2026-11-07: All 66 courses written and reviewed; full validation, final build and browser tests next, then publish (approved)
- 2026-11-07: AI Learning Foundation published at https://cbaird26.github.io/ai-learning-foundation/ (66 courses, 0 errors, browser tests pass) and added to the hub; next school in the queue: Neuroscience and cognitive science
