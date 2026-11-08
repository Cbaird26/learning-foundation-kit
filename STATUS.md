# Status

Last updated: 2026-11-08

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

The AI school's writer prompt, per-course notes and log are in `schools/ai/work/WRITERS.md`.

Decisions so far:
- Python runs in the page (Brython), as in Coding, Finance and Metaphysics. Brython has no NumPy, so graded exercises
  build each method from scratch in plain Python on tiny data; lessons may show NumPy or PyTorch code for reference.
- Laws and policy are taught only from the verified "current facts" in the BRIEF (EU AI Act with the 2026 Digital
  Omnibus dates, US executive orders, California SB 53, NIST AI RMF), with a reminder to check the current text.

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

## In progress: Neuroscience Learning Foundation (`schools/neuro`)

Neuroscience and cognitive science, from kindergarten to graduate research and qualifying exams, with Python in the
page for data analysis and modeling (owner's choices, Nov 7: "Neuro + cog sci to PhD prep" and "Yes, for data and
modeling"). 70 courses in five stages: K–12 from the AI school (with its programming track; J10 and H15 left out),
college sciences from the Med school (C1–C7 and the clinical electives C28–C29), mathematics and machine learning
from the AI school (C8–C10, C22, C23), philosophy of mind from the Metaphysics school (C21), and 21 new courses
(C11–C20, C24–C27, C30, P1–P6). Storage prefix `nlf`; site file `neuroscience-learning-foundation.html`; repo to be
`neuroscience-learning-foundation`.

| Step | State |
| --- | --- |
| 1. Curriculum (`schools/neuro/work/curriculum.py`) and course files | done |
| 2. Brief, review template, validated example lesson (`example_neuro_lesson.txt`), rebranded app | in progress |
| 3. Write the 21 new courses | not started |
| 4. Independent review of each course | not started |
| 5. Integrate and build | not started |
| 6. Test the page | not started |
| 7. Publish as `neuroscience-learning-foundation` (owner's yes first) | not started |
| 8. Add to the hub | not started |

How to continue step 3: for each course without 13 files, write it exactly as `schools/neuro/toolkit/BRIEF.md` says,
using `schools/neuro/toolkit/courses/<CODE>.json` and the example `schools/neuro/toolkit/example_neuro_lesson.txt`,
then run `python3 schools/neuro/toolkit/validate.py <CODE>` until it reports 0 errors, then
`python3 schools/neuro/toolkit/retype_check.py <CODE>`. `schools/neuro/work/WRITERS.md` has the writer prompt,
per-course notes and the log. Step 4 uses `schools/neuro/toolkit/REVIEW.md`; record each review in
`schools/neuro/work/review_log.txt`.

Rules specific to this school (in the BRIEF): neuroscience units and notation; laws on neural data, research ethics and
classifications taught only from the verified "current facts" (UNESCO 2025 recommendation, Chile 2021 and 2023, the four
US state laws and the federal MIND Act bill, the Declaration of Helsinki 2024, the Common Rule, DSM-5-TR and ICD-11);
contested questions (consciousness, free will, nature and nurture, animal research, enhancement) presented fairly;
no group-difference claims; drugs and stimulation only at the textbook level; projects with people use only low-risk
tasks with volunteers who agree, and no project involves animals.

<!-- course-table -->
| Course | Title | Files | Validates | Reviewed |
| --- | --- | --- | --- | --- |
| C11 | Introduction to neuroscience: brain and behavior | 13/13 | yes | yes |
| C12 | Cellular and molecular neuroscience | 13/13 | yes | yes |
| C13 | Neuroanatomy and functional systems | 13/13 | yes | yes |
| C14 | Cognitive psychology | 13/13 | yes | yes |
| C15 | Statistics and experimental design for brain and behavioral science | 13/13 | yes | yes |
| C16 | Sensation, perception and psychophysics | 13/13 | yes | yes |
| C17 | Learning, memory and plasticity | 13/13 | yes | yes |
| C18 | Behavioral neuroscience: motivation, emotion, sleep and stress | 13/13 | yes | yes |
| C19 | Cognitive neuroscience | 13/13 | yes | yes |
| C20 | Language and cognitive development | 13/13 | yes | yes |
| C24 | Neural data analysis | 13/13 | yes | yes |
| C25 | Computational neuroscience | 13/13 | yes | yes |
| C26 | Computational cognitive modeling | 13/13 | yes | yes |
| C27 | Neuroimaging methods: fMRI, EEG and MEG | 13/13 | yes | yes |
| C30 | Neuroethics and neurotechnology | 13/13 | yes | yes |
| P1 | Theoretical neuroscience | 13/13 | yes |  |
| P2 | Circuits and systems neuroscience: methods and causal evidence | 13/13 | yes | yes |
| P3 | Consciousness and the science of the mind | 13/13 | yes | yes |
| P4 | Brains and machines: neural networks as models of the brain | 13/13 | yes |  |
| P5 | Research methods and reproducibility in the brain and behavioral sciences | 11/13 |  |  |
| P6 | Research apprenticeship and qualifying exams | 10/13 |  |  |
<!-- /course-table -->

## Queue of future schools (one at a time, in this order)

1. AI and machine learning (done, live)
2. Neuroscience and cognitive science (to neuroscience PhD prep) (in progress)
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
- 2026-11-07: Neuroscience Learning Foundation set up: 70 courses (49 reused, 21 new), brief, review template, validated example lesson, rebranded app, trial build passes; next: write the 21 new courses
- 2026-11-07: Writers started for C11-C15
- 2026-11-07: C11 and C13 written and in review; C12, C14, C15, C16 and C17 being written
- 2026-11-08: C11 and C13 reviewed with follow-ups; C14 written and in review; C12, C15, C16, C17 and C18 being written
- 2026-11-08: C15 written and in review; C19 started
- 2026-11-08: C14 reviewed; C20 started
- 2026-11-08: C12 written and in review; C15 reviewed with follow-up; C24 started
- 2026-11-08: C12 reviewed with follow-ups
- 2026-11-08: C18 and C20 written and in review; C16, C17, C19, C24, C25 and C26 being written
- 2026-11-08: Neuro: C16, C17, C19 written; C18 (7 fixes), C19 (13), C20 (4) reviewed with follow-ups; reviews of C16 and C17 running; writers C24, C25, C26, C27, C30, P1 running; BRIEF adds the OECD 2019 neurotechnology recommendation
- 2026-11-08: Neuro: C24 written (review running); C16 (7 fixes) and C17 (17 fixes) reviewed with follow-ups; P2 and P3 started; BRIEF adds graduate attributions, Cogitate 2025, the 2023 IIT letter and the 2024 New York Declaration
- 2026-11-08: Neuro: C24 reviewed (20 fixes); P4 started; BRIEF adds NIH data-sharing and public-access dates and reporting guidelines; writers C25, C26, C27, C30, P1, P2, P3, P4 running; P5 and P6 next
- 2026-11-08: Neuro: C30 written (review running); writers C25, C26, C27, P1, P2, P3, P4 running; P5 and P6 next
- 2026-11-08: Neuro: C26 written (review running); reviews of C26 and C30 running; writers C25, C27, P1, P2, P3, P4 running; P5 and P6 next
- 2026-11-08: Neuro: C25 written (review running); C30 reviewed (11 fixes); P5 and P6 started, so all 21 new courses are written or in progress; writers C27, P1–P6 and reviews of C25 and C26 running
- 2026-11-08: Neuro: C27, P1, P2, P3 written; C25 (18 fixes), C26 (11), P2 (11) reviewed with follow-ups; reviews of C27, P1, P3 running; writers P4, P5, P6 running
- 2026-11-08: Neuro: P3 reviewed (12 fixes; hot-zone attribution restored to Koch and colleagues 2016 after a check); reviews of C27 and P1 running; writers P4, P5, P6 running
- 2026-11-08: Neuro: C27 reviewed (9 fixes); 17 of 21 new courses written and reviewed; review of P1 running; writers P4, P5, P6 running
