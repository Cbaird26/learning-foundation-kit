# Status

Last updated: 2026-11-07

## Live

Six schools and the hub are live (see the table in HANDOFF.md). Their sources in `schools/` match the live pages.

## In progress: AI Learning Foundation (`schools/ai`)

A school of artificial intelligence and machine learning: 66 courses from kindergarten to machine-learning research.
46 courses are reused from the Coding school (its K–12 courses, and its CS core renumbered C1–C10); 20 are new
(C11–C24 and P1–P6). Storage prefix `alf`; site file `ai-learning-foundation.html`; repo to be `ai-learning-foundation`.

| Step | State |
| --- | --- |
| 1. Design (curriculum.py, catalog, BRIEF, REVIEW, example lesson) | done |
| 2. Rebrand the app (storage prefix `alf`, texts, tutor, method and path pages) | done |
| 3. Write the 20 new courses | in progress (see table) |
| 4. Independent review of each course | in progress (see table) |
| 5. Integrate and build | not started |
| 6. Test the page | not started |
| 7. Publish as `ai-learning-foundation` (owner's yes first) | not started |
| 8. Add to the hub | not started |

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
| C11 | Numerical computing in Python for machine learning | 10/13 |  |  |
| C12 | Optimization for machine learning | 10/13 |  |  |
| C13 | Probability, statistics and information theory for machine learning | 12/13 |  |  |
| C14 | Data science: wrangling, exploration and visualization | 13/13 | yes |  |
| C15 | Supervised learning in depth | 7/13 |  |  |
| C16 | Unsupervised learning and probabilistic models | 0/13 |  |  |
| C17 | Deep learning foundations | 0/13 |  |  |
| C18 | Deep learning architectures: convolution, recurrence and attention | 0/13 |  |  |
| C19 | Natural language processing | 0/13 |  |  |
| C20 | Computer vision | 0/13 |  |  |
| C21 | Reinforcement learning | 0/13 |  |  |
| C22 | Causal inference and experimentation | 0/13 |  |  |
| C23 | AI ethics, safety and governance | 0/13 |  |  |
| C24 | Machine learning engineering and MLOps | 0/13 |  |  |
| P1 | Statistical learning theory | 0/13 |  |  |
| P2 | Probabilistic machine learning and generative models | 0/13 |  |  |
| P3 | Large language models | 0/13 |  |  |
| P4 | Interpretability and AI alignment | 0/13 |  |  |
| P5 | Research methods in machine learning | 0/13 |  |  |
| P6 | Research apprenticeship and qualifying exams | 0/13 |  |  |
<!-- /ai-table -->

## Queue of future schools (one at a time, in this order)

1. AI and machine learning (in progress)
2. Neuroscience and cognitive science (to neuroscience PhD prep)
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
