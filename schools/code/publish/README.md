# Coding Learning Foundation

**Open the school:** https://cbaird26.github.io/coding-learning-foundation/

A Khan Academy-style self-study school: 63 courses in five stages, from kindergarten through a complete college computer
science degree to a software engineering job — elementary, middle and high school (including computational thinking,
Python, how computers and the internet work, and object-oriented programming), the CS degree (programming, discrete
math, developer tools, data structures, algorithms, computer organization, C, operating systems, networks, databases,
theory of computation, programming languages, software engineering, calculus II, linear algebra, probability and
statistics, security, AI, machine learning, web development and distributed systems), and career preparation (testing,
design and architecture, system design, interviews, a capstone project and the engineering profession).

Each course has 12 weekly lessons (an article, worked examples, common mistakes, and auto-graded practice and quiz
questions), a week 13–14 project with a review guide, and a cumulative final exam. Skills move through mastery levels
with unit quizzes, a midterm and course challenges, and missed questions go into an error log that brings back a
parallel problem 48 hours later.

## Python in the page

Coding exercises run real Python in the browser, with nothing to install: the page includes Brython, which follows
Python 3.14, with CPython's own json package. Press Run to try code and Check to grade it against the exercise's tests;
a program that runs too long is stopped after a few seconds. Lesson code that runs here has a "Try it" button, and the
Python tab is a scratchpad. The browser's Python has the whole language and most of the standard library, but not
sqlite3, threads, networking or packages such as NumPy; for those, and for C, SQL databases, Git and the shell, the
courses explain how to install the tools on your own computer. Your code is never uploaded.

## Using it

Open the site in any modern browser. The whole school is one self-contained page (`index.html`, about 16 MB), so you can also save the page and use it offline.

Progress and the error log are kept only in your own browser and are never uploaded. Keep using the same browser and do not clear its site data; another browser or device starts fresh. The Tutor button prepares a prompt you can copy into a chat with Claude.

## Accuracy

Every course was written and then independently reviewed. Every coding exercise's model solution was run against its
tests both in standard Python and in the browser's Python, every starter program was checked to fail them, and every
"what does this print?" answer was produced by running the program (with gcc for C and SQLite for SQL). Technology
changes quickly, so check current documentation. Security lessons teach defense; practice only on your own code.
Self-study scores do not award credit or degrees.

Third-party software in the page: [THIRD-PARTY-NOTICES.md](THIRD-PARTY-NOTICES.md).
