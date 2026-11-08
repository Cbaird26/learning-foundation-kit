# Status

Last updated: 2026-11-07

## Live

Six schools and the hub are live (see the table in HANDOFF.md). Their sources in `schools/` match the live pages.

## In progress: AI Learning Foundation (`schools/ai`)

A school of artificial intelligence and machine learning, from kindergarten to machine-learning research.

| Step | State |
| --- | --- |
| 1. Design (curriculum.py, catalog, BRIEF, REVIEW, example lesson) | in progress |
| 2. Rebrand the app (storage prefix `alf`) | not started |
| 3. Write the new courses | not started |
| 4. Independent review of each course | not started |
| 5. Integrate and build | not started |
| 6. Test the page | not started |
| 7. Publish as `ai-learning-foundation` (owner's yes first) | not started |
| 8. Add to the hub | not started |

Decisions so far:
- Python runs in the page (Brython), as in Coding, Finance and Metaphysics. Brython has no NumPy, so machine-learning
  exercises implement the ideas from scratch in plain Python on small data; lessons explain how the same work is done
  with NumPy and PyTorch, but graded code never imports them.
- Elementary, middle and high school courses are reused from the Coding school (which has the programming courses).

Next step: finish the design in `schools/ai/work/curriculum.py`.

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
