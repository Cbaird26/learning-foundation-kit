/* Finance Learning Foundation — the study method and the path to the CFA Program and an investment career. */
(function () {
  'use strict';
  const App = window.ToEApp;
  const { CAT, esc, codeTag } = App;

  App.route(/^method$/, () => {
    const prof = CAT.profiles;
    const row = (cells) => '<tr>' + cells.map((c) => '<td>' + c + '</td>').join('') + '</tr>';
    App.mount('<div class="wrap"><div class="lesson-layout"><article style="min-width:0">' +
      '<div class="section"><span class="eyebrow">How to study here</span><h1 class="lesson-title">The study method</h1><p class="lesson-summary">A steady rhythm, an honest error log, and tests you take on your own. Short daily practice beats long, rare sessions at every age.</p></div>' +
      '<div class="prose">' +
      '<h2>Find your starting point</h2><p>Use the <a href="#start">starting-point page</a> to pick your stage. If you think you already know a course, take its course challenge: one unseen question from every week. About 85% means you can move on; a lower score shows exactly which weeks to study. Starting a little too early costs a few days; starting too late costs months of confusion.</p>' +
      '<h2>How much time to plan</h2><div class="table-wrap"><table><thead><tr><th>Stage</th><th>A typical week</th><th>Notes</th></tr></thead><tbody>' +
      row(['Elementary (K–5)', '15–30 minutes a day, 4–5 days a week, per subject', 'A grown-up reads along, helps with the hands-on tasks and checks the rubrics. Stop while it is still fun.']) +
      row(['Middle school', '3–4 hours per course', 'Three or four courses at a time: math, English, a science and history.']) +
      row(['High school', '4–6 hours per course', 'Lab courses need extra time for the hands-on investigations.']) +
      row(['College finance degree', '8–12 hours per course', 'Two or three courses at a time is a full self-study load; full-time students usually take four or five.']) +
      row(['CFA Program and investment career', '8–12 hours per course', 'CFA Institute recommends about 300 hours of study for each exam level, so plan on several months per level alongside the review course here.']) +
      '</tbody></table></div><p>A 14-week syllabus at a slower pace may take 20–30 weeks. That is fine: mastery decides progress, not the calendar. Every fourth week, learn nothing new and repair old errors instead.</p>' +
      '<h2>A week of study</h2><div class="table-wrap"><table><thead><tr><th>Session</th><th>Task</th><th>Output</th></tr></thead><tbody>' +
      row(['Learn', 'Read one lesson and its worked examples, then the matching part of the course reading.', 'Notes in your own words and questions to ask.']) +
      row(['Practice', 'Solve the practice questions on paper or in the code editor before checking.', 'Skills move up as you answer correctly on the first try.']) +
      row(['Retrieve', 'Redo earlier problems before looking at your notes.', 'A list of what has faded.']) +
      row(['Repair', 'Retry the parallel problems waiting in your error log.', 'Errors marked repaired.']) +
      row(['Test', 'A unit quiz or timed mixed set with no notes, tutor or AI.', 'An honest score and next week\'s priorities.']) +
      '</tbody></table></div>' +
      '<h2>The error log</h2><p>For each miss, note the first wrong step and the missing idea behind it, then solve a new parallel problem 48 hours later. This site records the problem and its solution, keeps the 48-hour clock and serves the parallel problem; you supply the two columns that make you think: where it went wrong, and why.</p>' +
      '<h2>Using the tutor and AI well</h2><p>Use the tutor for a hint, another explanation, a check of your working or extra practice, after you have tried yourself. Check important claims against the course reading or a worked solution: agreement with an AI is not proof. The tutor is switched off during quizzes and exams. Children should use the tutor with a grown-up.</p>' +
      '<h2>Python here</h2><p>Python exercises run real Python in your browser, with no installation and no network: the site uses Brython, which follows Python 3.14. Press <strong>Run</strong> as often as you like to try your code, and <strong>Check</strong> when you are ready: it runs the exercise\'s tests and grades your work. A program that runs for too long is stopped after a few seconds. Code blocks in the lessons have a <strong>Try it</strong> button so you can run and change the examples, and the <a href="#python">Python page</a> is a scratchpad for your own experiments.</p><p>The browser\'s Python has the whole language and most of the standard library, including <code>math</code>, <code>statistics</code>, <code>decimal</code>, <code>datetime</code>, <code>csv</code> and <code>random</code>, but not threads, networking or third-party packages such as NumPy and pandas. Courses that use those, or a spreadsheet program, explain how to set them up on your own computer. Your code stays in your browser; nothing is uploaded.</p>' +
      '<h2>The mastery gate</h2><p>Before you treat a course as done, aim for about 85% on two unseen, timed tests a week or two apart: here, the week 14 final and the course challenge. For modeling and professional-practice courses, also finish the project yourself: a working, tested model or a finished report is the real evidence.</p>' +
      '<h2>Mastery levels on this site</h2><p>Each weekly lesson is one skill with five levels: Not started, Attempted, Familiar, Proficient and Mastered.</p><ul>' +
      '<li><strong>Practice</strong> moves a skill to Familiar at 70% and to Proficient at 100%. A question counts only when you answer it correctly on the first try without a hint.</li>' +
      '<li><strong>Unit quizzes</strong> move each skill up one level, as far as Proficient, when you answer its questions correctly, and down one level when you miss them.</li>' +
      '<li><strong>The midterm, the final and the course challenge</strong> can take a Proficient skill to Mastered. Misses there lower the level, so mastery stays honest.</li>' +
      '<li><strong>Mastery points</strong>: 50 for Familiar, 80 for Proficient and 100 for Mastered.</li></ul>' +
      '<h2>Assessment profiles</h2><p>Each course has a profile that sets what counts toward completion.</p><div class="table-wrap"><table><thead><tr><th>Profile</th><th>Weights</th><th>Completion evidence</th></tr></thead><tbody>' +
      Object.keys(prof).map((k) => '<tr><td>' + k + ' · ' + esc(prof[k].name) + '</td><td>' + prof[k].weights.map((w) => esc(w[0]) + ' ' + w[1] + '%').join('; ') + '</td><td>' + esc(prof[k].evidence) + '</td></tr>').join('') + '</tbody></table></div>' +
      '<h2>Safety and honesty</h2><p>Home activities use only safe household materials, with a grown-up for children. Lessons about money, taxes, investing and the law are general education, not personal investment, tax or legal advice; tax brackets, contribution limits and rules change every year, so check the official source before you act. Practice trades and portfolios here are imaginary: never risk money you cannot afford to lose. Self-study scores are private progress indicators and do not award credit, degrees or any professional credential.</p>' +
      '<h2>About the CFA Program</h2><p>The CFA Program review courses here are original study material written for this site. They are not affiliated with, endorsed by or produced by CFA Institute, and they use no CFA Institute curriculum text or exam questions. Topic weights, rules and fees change from year to year, so always check the current details on the CFA Institute website. CFA® and Chartered Financial Analyst® are registered trademarks owned by CFA Institute.</p>' +
      '<h2>Free resources</h2><div class="table-wrap"><table><thead><tr><th>Level</th><th>Free resources</th><th>Optional extra help</th></tr></thead><tbody>' +
      CAT.resources.map((r) => '<tr><td>' + esc(r.level) + '</td><td>' + r.free.map((f) => '<a href="' + esc(f[1]) + '" target="_blank" rel="noopener">' + esc(f[0]) + '</a>').join('<br>') + '</td><td>' + (r.paidUrl ? '<a href="' + esc(r.paidUrl) + '" target="_blank" rel="noopener">' + esc(r.paid) + '</a>' : esc(r.paid)) + '</td></tr>').join('') + '</tbody></table></div>' +
      '<p>Course availability and terms change, so check before you pay for anything.</p>' +
      '</div></article><aside class="lesson-side"><div class="side-card"><span class="eyebrow">Start</span><a class="btn btn-primary" href="#start">Choose a starting point</a><a class="btn" href="#errors">Open your error log</a><a class="btn btn-quiet" href="#path">The path to an investment career</a></div></aside></div></div>');
  }, 'method');

  const STRANDS = [
    ['Mathematics and statistics', 'Counting to calculus and statistics, then business statistics, quantitative methods and econometrics.', ['K1', 'K2', 'K3', 'J1', 'J2', 'J3', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'C5', 'C6', 'C12']],
    ['Money, economics and markets', 'Money math and financial literacy, personal finance, micro- and macroeconomics, markets and institutions, and international finance.', ['K10', 'J10', 'H15', 'H16', 'C3', 'C4', 'C8', 'C18']],
    ['Accounting and corporate finance', 'Financial and managerial accounting, financial reporting and analysis, and corporate finance from the time value of money to valuation and mergers.', ['C1', 'C2', 'C9', 'C11', 'C7', 'C15']],
    ['Investments and risk', 'Investments, fixed income, derivatives, portfolio management, risk management, behavioral finance and the three CFA Program levels.', ['C10', 'C13', 'C14', 'C16', 'C19', 'C20', 'P1', 'P2', 'P3']],
    ['Programming and modeling', 'Python from first programs to data analysis, tested financial models and a full equity research report.', ['J9', 'H14', 'C17', 'P4', 'P5']],
    ['Reading, writing, science and the profession', 'Literacy, the sciences and history, business law and ethics, and the professional standards of investment work.', ['K4', 'K5', 'K6', 'K7', 'K8', 'K9', 'J4', 'J5', 'J6', 'J7', 'J8', 'H7', 'H8', 'H9', 'H10', 'H11', 'H12', 'H13', 'C21', 'P6']],
  ];
  const MILESTONES = [
    ['Kindergarten to grade 5', 'About ages 5 to 11', 'Number sense, fluent reading, curiosity about the world, and first money skills: counting, earning, saving and spending.'],
    ['Grades 6 to 8', 'About ages 11 to 14', 'Ratios to pre-algebra, reading and writing, the sciences and history, first programs in Python, and financial literacy: budgets, banking, interest and credit.'],
    ['Grades 9 to 12', 'About ages 14 to 18', 'Algebra through calculus and statistics, the lab sciences, strong reading and writing, Python with data, personal finance and AP-level economics.'],
    ['College finance degree', "Usually four years for a bachelor's degree", 'Accounting, economics, statistics and quantitative methods first; then corporate finance, markets and institutions, financial reporting and analysis, investments and econometrics; then fixed income, derivatives, valuation, portfolio management, Python modeling, international finance, risk, behavioral finance, and law and ethics. Summer internships, often after the second and third years, are a common route to a first analyst job.'],
    ['CFA Program', 'Often two to four years, usually alongside work', "Three exams, Levels I, II and III, taken in order. You can usually sit Level I in the last two years of a bachelor's degree. The charter also requires 4,000 hours of relevant work experience over at least 36 months and membership of CFA Institute; check the current rules on its website."],
    ['Working as an analyst', 'Ongoing', 'Research, modeling and client work under a code of ethics, licensing where the job requires it, and continuous learning. This site ends where your first job begins.'],
  ];
  App.route(/^path$/, () => {
    App.mount('<div class="wrap"><div class="section"><span class="eyebrow">Why the curriculum is shaped this way</span><h1 class="lesson-title">The path to an investment career</h1>' +
      '<p class="lesson-summary">Finance rests on everything before it: mathematics and statistics for measuring return and risk, accounting and economics for reading companies and markets, clear writing for research and clients, and the ethics that keep clients\' trust.</p></div>' +
      '<section class="section"><h2>The milestones</h2><div class="panel" style="padding:0"><div class="table-wrap"><table><thead><tr><th>Stage</th><th>Typical timing</th><th>What it builds</th></tr></thead><tbody>' +
      MILESTONES.map((r) => '<tr><td><b>' + esc(r[0]) + '</b></td><td>' + esc(r[1]) + '</td><td>' + esc(r[2]) + '</td></tr>').join('') + '</tbody></table></div></div>' +
      '<p class="muted" style="max-width:70ch">This site teaches the knowledge and the practice. Most entry-level analyst jobs ask for a bachelor\'s degree in finance, accounting, economics or a related field, and the CFA charter is awarded only by CFA Institute. A portfolio of finished research and tested models helps either way. Self-study here does not award credit, degrees or any credential, and it is not affiliated with CFA Institute.</p></section>' +
      '<section class="section"><h2>Six strands</h2><div class="grid">' + STRANDS.map((s) => '<div class="panel stack" style="gap:10px"><span class="eyebrow">' + esc(s[0]) + '</span><p class="faint" style="font-size:var(--s-xs)">' + esc(s[1]) + '</p>' +
        '<div class="row" style="gap:6px;flex-wrap:wrap">' + s[2].map((c) => codeTag(c)).join('') + '</div></div>').join('') + '</div></section>' +
      '<div class="row" style="margin-top:22px"><a class="btn btn-primary" href="#courses">Browse all ' + CAT.courses.length + ' courses</a><a class="btn" href="#start">Find your starting point</a></div></div>');
  }, 'path');
})();
