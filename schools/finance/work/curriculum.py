"""The Finance Learning Foundation curriculum: kindergarten through a college finance degree to the CFA Program and a
career in investment analysis. K-12 courses are reused from the Med School Learning Foundation (same lessons) and two
Python courses from the Coding Learning Foundation, with finance-oriented notes.
Writes work/courses_raw.json (writer-facing) and work/meta.json (site-facing extras)."""
import json, copy

ROOT = '/home/claude/finance'
MED_RAW = {c['code']: c for c in json.load(open('/home/claude/med/work/courses_raw.json'))}
CODE_RAW = {c['code']: c for c in json.load(open('/home/claude/code/work/courses_raw.json'))}

STAGES = [
    ('K', 'Elementary school (K–5)', 'Numbers, reading and writing, science and the world around us, plus money: counting it, earning it, saving it and spending it wisely, learned with a grown-up close by.'),
    ('J', 'Middle school (6–8)', 'Ratios to algebra, reading and writing, the sciences and history, plus Python programming and financial literacy: banking, budgets, interest and credit.'),
    ('H', 'High school (9–12)', 'Algebra through calculus and statistics, the lab sciences, English and history, plus Python with data, a full personal finance course and AP-level economics.'),
    ('C', 'College finance degree', 'The core of a finance degree: financial and managerial accounting, economics, statistics and quantitative methods, corporate finance, markets and institutions, financial reporting and analysis, investments, fixed income, derivatives, valuation, portfolio management, Python for finance, international finance, risk, behavioral finance, and law, ethics and regulation.'),
    ('P', 'CFA Program and investment career', 'CFA Program Levels I, II and III, equity research and financial modeling, a capstone research report, and the ethics and practice of the investment profession.'),
]
LEVEL = {'K': 'elementary', 'J': 'middle', 'H': 'high', 'C': 'college', 'P': 'professional'}
FINAL_MIN = {'elementary': 30, 'middle': 45, 'high': 60, 'college': 120, 'professional': 120}
HOURS = {'elementary': '2–3', 'middle': '3–4', 'high': '4–6', 'college': '8–12', 'professional': '8–12'}

COURSES = []


def C(code, title, profile, req, soft, purpose, why, ready, reading, units, project, elective=False):
    assert len(units) == 6, code
    assert 'Week 7 midterm' in units[3][2], code
    lvl = LEVEL[code[0]]
    fm = FINAL_MIN[lvl]
    u = []
    for i, (a, b, d) in enumerate(units):
        u.append({'weeks': [2 * i + 1, 2 * i + 2], 'topics': [a, b], 'deliverable': d})
    u.append({'weeks': [13, 14], 'topics': ['Project and review', 'Cumulative final'],
              'deliverable': f'Submit the project; take an unseen {fm} minute final in week 14.'})
    completion = 'finish the project, take the week 7 midterm and week 14 cumulative final, then complete a new cumulative assessment after 1 to 2 weeks. Explain one major idea aloud without notes.'
    COURSES.append({'code': code, 'title': title, 'stage': code[0], 'level': lvl, 'profile': profile, 'req': req, 'soft': soft,
                    'prerequisites': (', '.join(req) if req else 'None') + ('; helpful: ' + ', '.join(soft) if soft else '') + '.',
                    'purpose': purpose, 'why': why, 'ready': ready,
                    'reading': {'title': reading[0], 'url': reading[1]}, 'readingScope': None, 'readingNote': None,
                    'units': u, 'project': project, 'completion': completion, 'supplement': None, 'elective': elective})


# ---------------- K-12: reused from the Med School Learning Foundation ----------------
WHY = {
    'K1': 'Counting and number sense are the base of every price, budget and balance.',
    'K2': 'Place value and multiplication are how you count money and work out totals and change.',
    'K3': 'Fractions, decimals and percentages are the everyday language of money, interest and returns.',
    'K4': 'Reading is how you will learn everything else on this path, from contracts to annual reports.',
    'K5': 'Fluent reading and clear writing make statements, reports and later textbooks easy.',
    'K6': 'Research and clear explanations grow into reading financial news and writing about companies.',
    'K7': 'Observing carefully and recording what you see is where good analysis begins.',
    'K8': 'Science teaches you to test an idea against evidence, the same habit an analyst needs.',
    'K9': 'Communities, jobs and trade are where money, businesses and markets come from.',
    'J1': 'Ratios, rates and percentages are the core of prices, discounts, interest and returns.',
    'J2': 'Equations and probability underlie interest calculations, risk and expected value.',
    'J3': 'Functions model how money grows over time and how prices respond to change.',
    'J4': 'Analysts read closely and explain their reasoning in writing every day.',
    'J5': 'Living systems teach how to reason about change and data, skills that carry into economics.',
    'J6': 'Physical science trains careful measurement and modeling with units and rates.',
    'J7': 'Earth and space science supply real data sets and teach working with uncertainty.',
    'J8': 'History explains how money, trade, banks and markets developed.',
    'H1': 'Algebra and functions are the everyday mathematics of finance.',
    'H2': 'Geometric proof trains careful step-by-step reasoning, the habit behind sound financial arguments.',
    'H3': 'Trigonometry and vectors round out the mathematics behind later quantitative courses.',
    'H4': 'Exponential and logarithmic functions are the mathematics of compound interest and growth.',
    'H5': 'Calculus underlies marginal analysis, optimization and continuous compounding.',
    'H6': 'Statistics and probability are the basis of risk, return and every model an analyst builds.',
    'H7': 'Biology is a lab science most high schools and colleges expect, and healthcare is a large sector to analyze.',
    'H8': 'Chemistry rounds out the lab sciences and helps you understand industries such as energy and materials.',
    'H9': 'Physics trains modeling with equations and units, and explains industries from energy to technology.',
    'H10': 'Close reading and clear writing prepare you for annual reports, contracts and research notes.',
    'H11': 'Research and professional writing are daily tools for investment memos and reports.',
    'H12': 'U.S. history and government explain the laws, regulators and policies that shape markets.',
    'H13': 'World history and geography give context for global markets, trade and currencies.',
}
for code, why in WHY.items():
    t = copy.deepcopy(MED_RAW[code])
    t['why'] = why
    t['reusedFrom'] = 'med:' + code
    t['elective'] = False
    COURSES.append(t)

# two Python courses reused from the Coding Learning Foundation
for code, why, soft in [
        ('J9', 'Python lets you calculate interest, budgets and returns, and later build full financial models.', []),
        ('H14', 'Lists, dictionaries, files and simulations are the tools you will use to analyze financial data.', ['H1']),
]:
    t = copy.deepcopy(CODE_RAW[code])
    t['why'] = why
    t['reusedFrom'] = 'code:' + code
    t['soft'] = soft
    t['prerequisites'] = (', '.join(t['req']) if t['req'] else 'None') + ('; helpful: ' + ', '.join(soft) if soft else '') + '.'
    t['elective'] = False
    COURSES.append(t)

OCW = 'https://ocw.mit.edu/courses/'
OSX = 'https://openstax.org/details/books/'

# ---------------- new K-12 finance courses ----------------
C('K10', 'Money math: counting, earning, saving and spending', 'Y', [], ['K2'],
  'Name coins and bills and count money, make change, compare prices, tell needs from wants, earn and set a savings goal, track spending in a simple chart, and see how a bank keeps money safe and pays a little interest.',
  'Handling money well starts with counting it and choosing what to do with it.',
  'Counts a mix of coins and bills, makes change from a purchase, and explains how long it will take to save for a goal at a fixed amount each week.',
  ('Money as You Grow (Consumer Financial Protection Bureau)', 'https://www.consumerfinance.gov/consumer-tools/money-as-you-grow/'),
  [('Coins and bills', 'Counting money', 'Count three handfuls of coins and write each total.'),
   ('Adding prices and making change', 'Comparing prices: which is the better buy?', 'Play store: buy three items and make change.'),
   ('Needs and wants', 'Earning money: jobs and work', 'Sort ten pictures into needs and wants and explain two choices.'),
   ('Saving for a goal', 'Spending plans: a simple budget', 'Week 7 midterm; make a savings chart for a goal you choose.'),
   ('Banks: keeping money safe', 'Interest: money that grows a little', 'Track a pretend bank balance for four weeks with interest.'),
   ('Giving and sharing', 'Smart choices and spotting tricks in ads', 'Explain one ad and what it wants you to buy.'),],
  'Saving plan: choose something to save for, find its price, make a weekly plan with earning, saving and spending columns, keep the chart for four weeks (real or pretend), and present how close you came and what you would change.')

C('J10', 'Financial literacy: banking, budgets, interest and credit', 'T', ['K3'], ['J1'],
  'Make and follow a budget, compare checking and savings accounts, calculate simple and compound interest, understand paychecks and taxes, use debit and credit cards safely, read a credit card statement, see how borrowing costs add up, and avoid scams.',
  'These everyday money skills protect you from costly mistakes and start your savings early.',
  'Builds a monthly budget from a paycheck, calculates compound interest on savings for several years, and explains why paying only the minimum on a credit card is expensive.',
  ('Next Gen Personal Finance: free middle-school curriculum', 'https://www.ngpf.org/'),
  [('Income, needs, wants and goals', 'Making a budget', 'Make a monthly budget for a given allowance or paycheck.'),
   ('Banks and credit unions: checking and savings', 'Simple interest', 'Compare two savings accounts by the interest they pay.'),
   ('Compound interest and the rule of 72', 'Saving and investing: why starting early matters', 'Calculate a savings balance after 1, 5 and 10 years.'),
   ('Paychecks: gross pay, taxes and net pay', 'Spending: comparison shopping and unit prices', 'Week 7 midterm; read a sample pay stub and find net pay.'),
   ('Debit cards, credit cards and credit scores', 'The cost of borrowing: loans and minimum payments', 'Show how long a card balance takes to pay off at the minimum.'),
   ('Protecting your money: scams, fraud and identity theft', 'Planning for the future: jobs, education and goals', 'Write a one-page plan for a goal five years away.')],
  'My money plan: design a one-year plan for a realistic teen budget with income, spending categories and a savings goal; compare two savings accounts and one credit option using interest calculations; and explain three choices you would make and why.')

C('H15', 'Personal finance', 'T', ['J10', 'H1'], ['H4'],
  'Plan income and spending, use bank accounts and payment tools wisely, understand taxes and how to file, use credit and loans responsibly, compare student-loan and college-cost options, protect yourself with insurance, and start investing and retirement saving with an understanding of risk, return, diversification and fees.',
  'Your own finances are the first portfolio you will manage, and they teach the core ideas of the whole field.',
  'Builds a realistic monthly budget and emergency fund plan, estimates federal income tax for a simple return, compares two loans by total cost, and explains why a low-cost diversified fund suits a long-term saver.',
  ('Khan Academy: Financial Literacy (free course)', 'https://www.khanacademy.org/college-careers-more/financial-literacy'),
  [('Earning income: jobs, paychecks and benefits', 'Budgeting and cash flow', 'Build a monthly budget from a job offer.'),
   ('Banking, payments and emergency funds', 'Taxes: how income tax works and filing a simple return', 'Estimate the federal income tax on a simple return.'),
   ('Credit reports, credit scores and credit cards', 'Loans: car loans, student loans and amortization', 'Compare two car loans by total interest paid.'),
   ('Paying for college: aid, scholarships and loans', 'Housing: renting versus buying', 'Week 7 midterm; compare the total cost of two college plans.'),
   ('Insurance: health, auto, renters and life', 'Investing basics: stocks, bonds, funds, risk and return', 'Compare two funds by fees and diversification.'),
   ('Retirement accounts: 401(k), IRA and Roth', 'Consumer protection, fraud and financial decisions', 'Project a retirement balance from age 22 to 67.')],
  'Life plan: for a chosen first job, build a one-year budget with taxes and benefits, an emergency fund, a debt-repayment plan for a student loan, an insurance checklist, and a retirement savings plan with projected balances; present the plan and the three most important trade-offs.')

C('H16', 'Economics: microeconomics and macroeconomics', 'T', ['H1'], ['H6'],
  'Use supply and demand, elasticity, costs and market structures to explain prices and firm decisions, then measure the whole economy with GDP, unemployment and inflation, and explain how fiscal policy, money, banks, the Federal Reserve, interest rates and exchange rates affect it, at the level of AP Microeconomics and AP Macroeconomics.',
  'Economics explains the prices, interest rates and policies that every investment depends on.',
  'Explains a price change with supply and demand curves, computes an elasticity and a real GDP growth rate, and traces how a change in the policy interest rate affects borrowing, spending and prices.',
  ('OpenStax Principles of Economics 3e (free)', OSX + 'principles-economics-3e'),
  [('Scarcity, choice and opportunity cost', 'Supply, demand and market equilibrium', 'Shift supply and demand curves for five news events.'),
   ('Elasticity and its uses', 'Consumer choice and producer costs', 'Compute price elasticity from two price-quantity points.'),
   ('Market structures: competition to monopoly', 'Market failure, externalities and the role of government', 'Compare profit under competition and monopoly.'),
   ('Measuring the economy: GDP and growth', 'Unemployment and inflation', 'Week 7 midterm; compute real GDP growth and an inflation rate.'),
   ('Aggregate demand and supply; fiscal policy', 'Money, banks and the Federal Reserve', 'Trace a deposit through the money multiplier.'),
   ('Monetary policy and interest rates', 'International trade and exchange rates', 'Explain how a stronger dollar affects exports.')],
  'Economic briefing: pick a current economic question (for example inflation, a tariff or a rate change), gather three data series from FRED, explain what is happening with the models from this course, and write a two-page briefing with charts and a balanced conclusion.')

# ---------------- College finance degree ----------------
C('C1', 'Financial accounting', 'T', ['H1'], ['H15'],
  'Record business transactions with double-entry bookkeeping, adjust and close the books, and prepare and read the income statement, balance sheet, statement of changes in equity and cash flow statement, including revenue recognition, receivables, inventory, long-lived assets, liabilities and equity.',
  'Accounting is the language of business; every analysis starts from financial statements.',
  'Records a month of transactions, prepares the four financial statements, and explains how a single transaction moves through all of them.',
  ('OpenStax Principles of Accounting, Volume 1: Financial Accounting (free)', OSX + 'principles-financial-accounting'),
  [('The role of accounting and the accounting equation', 'Recording transactions: debits, credits and journals', 'Journalize and post twenty transactions.'),
   ('Adjusting entries and accruals', 'The financial statements and closing the books', 'Prepare all four statements for a small business.'),
   ('Revenue recognition and receivables', 'Inventory: FIFO, LIFO and weighted average', 'Compute cost of goods sold three ways.'),
   ('Long-lived assets and depreciation', 'Liabilities and bonds payable', 'Week 7 midterm; build a depreciation schedule.'),
   ('Equity: stock, dividends and retained earnings', 'The statement of cash flows', 'Prepare a cash flow statement by the indirect method.'),
   ('Internal control and ethics in reporting', 'Reading a real annual report', 'Find ten key numbers in a public company 10-K.')],
  'Bookkeeping practice set: record three months of transactions for a small company, make the adjusting entries, prepare and reconcile the four financial statements, and write a one-page memo explaining the company\'s results and cash position.')

C('C2', 'Managerial and cost accounting', 'T', ['C1'], [],
  'Classify costs, compute product costs with job-order, process and activity-based costing, analyze cost-volume-profit, build budgets and variance analyses, and make short-term decisions about pricing, make-or-buy, special orders and capital investments.',
  'Managers and analysts use cost information to judge what earns money and what does not.',
  'Computes a break-even point and margin of safety, builds a master budget, and explains a variance and what to do about it.',
  ('OpenStax Principles of Accounting, Volume 2: Managerial Accounting (free)', OSX + 'principles-managerial-accounting'),
  [('Cost concepts and behavior', 'Job-order costing', 'Compute the cost of three jobs with overhead.'),
   ('Process costing', 'Activity-based costing', 'Compare traditional and activity-based product costs.'),
   ('Cost-volume-profit analysis', 'Variable versus absorption costing', 'Compute break-even and target-profit volumes.'),
   ('Budgeting: the master budget', 'Flexible budgets and standard costs', 'Week 7 midterm; build a quarterly master budget.'),
   ('Variance analysis', 'Relevant costs for short-term decisions', 'Analyze a make-or-buy decision.'),
   ('Pricing and responsibility accounting', 'Capital budgeting basics', 'Rank three projects by payback and net present value.')],
  'Cost and budget study: for a described manufacturer, compute product costs two ways, build a master budget, analyze last quarter\'s variances, and recommend one pricing or product-mix decision in a two-page memo with supporting schedules.')

C('C3', 'Intermediate microeconomics', 'T', ['H16', 'H5'], ['C6'],
  'Model consumer choice with utility and budget constraints, derive demand, model production and costs, analyze competitive markets, monopoly and oligopoly with game theory, and apply welfare analysis, uncertainty, information problems and externalities to real markets.',
  'Microeconomics explains how firms set prices and compete, which drives every company\'s profits.',
  'Derives a demand curve from a utility function, solves for a profit-maximizing output under monopoly, and finds a Nash equilibrium in a pricing game.',
  ('MIT OpenCourseWare 14.01 Principles of Microeconomics (free)', OCW + '14-01-principles-of-microeconomics-fall-2018/'),
  [('Preferences, utility and budget constraints', 'Optimal choice and demand', 'Solve three utility maximization problems.'),
   ('Income and substitution effects', 'Production functions', 'Decompose a price change into its two effects.'),
   ('Costs in the short and long run', 'Perfect competition and market supply', 'Derive a firm supply curve from a cost function.'),
   ('Monopoly and price discrimination', 'Game theory and oligopoly', 'Week 7 midterm; find the Nash equilibria of two games.'),
   ('Welfare, efficiency and market failure', 'Choice under uncertainty and expected utility', 'Price insurance with expected utility.'),
   ('Asymmetric information: adverse selection and moral hazard', 'Factor markets and income', 'Explain a real market failure and one remedy.')],
  'Industry analysis: choose a real industry, describe its market structure, model one pricing decision with tools from the course, use game theory to explain competitive behavior, and write a three-page analysis of how the structure affects firms\' profits.')

C('C4', 'Macroeconomics, money and banking', 'T', ['H16'], ['C3'],
  'Measure output, inflation and unemployment; model long-run growth and short-run fluctuations with IS-LM and aggregate demand and supply; explain money creation, central banking, monetary policy tools and the yield curve; and analyze fiscal policy, financial crises and open-economy effects.',
  'Interest rates, inflation and the business cycle move every asset price an analyst studies.',
  'Uses IS-LM to analyze a policy change, explains how the Federal Reserve sets and transmits its policy rate, and reads the yield curve as a signal about the economy.',
  ('MIT OpenCourseWare 14.02 Principles of Macroeconomics (free)', OCW + '14-02-principles-of-macroeconomics-spring-2023/'),
  [('National income accounting', 'Inflation, price indexes and unemployment', 'Compute real GDP, the GDP deflator and CPI inflation.'),
   ('Long-run growth: the Solow model', 'Money, banks and money creation', 'Solve for steady state in a Solow model.'),
   ('The central bank and monetary policy tools', 'Interest rates and the yield curve', 'Explain the policy rate path and a yield curve shape.'),
   ('The IS-LM model', 'Aggregate demand, aggregate supply and the Phillips curve', 'Week 7 midterm; analyze two policy shocks with IS-LM.'),
   ('Fiscal policy, deficits and debt', 'Financial crises and bank regulation', 'Explain a bank run and deposit insurance.'),
   ('Open-economy macroeconomics', 'Expectations and modern policy debates', 'Analyze a currency depreciation\'s effects.')],
  'Policy brief: use FRED data on output, inflation, unemployment and interest rates to assess the current position of the economy, explain the central bank\'s recent decisions with the course models, and write a three-page brief with charts and a balanced outlook.')

C('C5', 'Business statistics and probability with Python', 'T', ['H6'], ['H14'],
  'Describe data, use probability rules and distributions, sample and estimate with confidence intervals, test hypotheses, compare groups, fit simple and multiple regressions, and do it all in Python with business and financial data.',
  'Risk, return and every forecast are statistical, so statistics is the analyst\'s core toolkit.',
  'Computes and interprets a confidence interval and a hypothesis test on return data, fits a regression and explains its slope, R-squared and residuals, in Python.',
  ('OpenStax Introductory Business Statistics 2e (free)', OSX + 'introductory-business-statistics-2e'),
  [('Describing data: center, spread and shape', 'Probability rules and Bayes\' rule', 'Summarize a year of daily returns in Python.'),
   ('Discrete distributions: binomial and Poisson', 'The normal distribution and z-scores', 'Model the number of defaults with a binomial distribution.'),
   ('Sampling distributions and the central limit theorem', 'Confidence intervals', 'Build a confidence interval for a mean return.'),
   ('Hypothesis tests', 'Comparing two groups', 'Week 7 midterm; test whether two funds differ in average return.'),
   ('Correlation and simple regression', 'Multiple regression', 'Estimate a stock\'s beta with regression.'),
   ('Regression diagnostics', 'Statistics in business decisions', 'Check a regression\'s residuals and explain the problems.')],
  'Data study: with a supplied data set of stock and market returns, describe the data, test two hypotheses, estimate betas by regression for five stocks, check the assumptions, and write a short report with Python code and charts.')

C('C6', 'Quantitative methods for finance: calculus, matrices and optimization', 'T', ['H5'], ['H6'],
  'Use derivatives and integrals for marginal analysis and continuous compounding, series for annuities, matrices and vectors for portfolios and systems of equations, and unconstrained and constrained optimization with Lagrange multipliers.',
  'Valuation, portfolio math and optimization all rest on these tools.',
  'Prices an annuity with a geometric series, computes a portfolio\'s variance with matrices, and solves a constrained optimization with a Lagrange multiplier.',
  ('OpenStax Calculus Volume 1 (free)', OSX + 'calculus-volume-1'),
  [('Functions, limits and continuous compounding', 'Derivatives and marginal analysis', 'Find marginal cost and revenue for three firms.'),
   ('Exponentials, logarithms and growth rates', 'Integrals and present value of continuous flows', 'Value a continuous income stream.'),
   ('Sequences, series and annuities', 'Multivariable functions and partial derivatives', 'Derive the present value of an annuity from a series.'),
   ('Vectors and matrices', 'Systems of equations and matrix inverses', 'Week 7 midterm; solve a pricing system with matrices.'),
   ('Portfolio variance with matrices', 'Unconstrained optimization', 'Compute a three-asset portfolio\'s variance.'),
   ('Constrained optimization and Lagrange multipliers', 'Applications: the minimum-variance portfolio', 'Find the minimum-variance weights for two assets.')],
  'Optimization project: for a set of three to five assets with given expected returns and covariances, derive and compute the minimum-variance portfolio and one target-return portfolio, verify the answer numerically in Python, and explain each step of the mathematics.')

C('C7', 'Corporate finance I: time value of money, capital budgeting and the cost of capital', 'T', ['C1', 'H4'], ['C5', 'C6'],
  'Compute present and future values of single sums, annuities and perpetuities, value bonds and stocks, evaluate projects with NPV, IRR and payback, build project cash flows, measure risk and return, and estimate a firm\'s weighted average cost of capital.',
  'Discounting cash flows is the single most important idea in finance.',
  'Values a project from its incremental cash flows with NPV and IRR, explains when the two disagree, and estimates a WACC from market data.',
  ('OpenStax Principles of Finance (free)', OSX + 'principles-finance'),
  [('The goal of the firm and financial statements', 'Time value of money: single sums', 'Solve ten present and future value problems.'),
   ('Annuities, perpetuities and loan amortization', 'Interest rates: APR, EAR and compounding', 'Build a loan amortization schedule in Python.'),
   ('Valuing bonds', 'Valuing stocks: dividend discount models', 'Price three bonds and two stocks.'),
   ('Capital budgeting: NPV, IRR and payback', 'Project cash flows', 'Week 7 midterm; build and value a project\'s cash flows.'),
   ('Risk and return: the basics', 'The CAPM and beta', 'Estimate a cost of equity with the CAPM.'),
   ('The cost of debt and WACC', 'Sensitivity and scenario analysis', 'Compute a company\'s WACC from public data.')],
  'Capital budgeting case: for a described expansion project, forecast incremental cash flows, estimate the company\'s WACC, compute NPV, IRR and payback, run sensitivity and scenario analyses in Python, and write a two-page recommendation to the board.')

C('C8', 'Financial markets and institutions', 'T', ['C4'], ['C7'],
  'Explain how money, bond, stock, derivative and foreign-exchange markets work; how banks, insurers, pension funds, mutual funds, ETFs and hedge funds create value and manage risk; how trading, clearing and settlement work; and how central banks and regulators supervise the financial system.',
  'Knowing how markets and institutions work tells you where prices come from and what can go wrong.',
  'Explains how a trade is executed, cleared and settled, compares the risks of a bank and an insurance company, and describes what a regulator does when a bank fails.',
  ('Open Yale Courses: ECON 252 Financial Markets, taught by Robert Shiller (free)', 'https://oyc.yale.edu/economics/econ-252'),
  [('The financial system and its functions', 'Interest rates and the term structure', 'Explain three yield curve shapes and their causes.'),
   ('Money markets', 'Bond markets', 'Compare Treasury bills, commercial paper and repos.'),
   ('Stock markets: exchanges, orders and trading', 'Clearing, settlement and market structure', 'Trace an order from placement to settlement.'),
   ('Commercial banks: balance sheets and risks', 'Bank regulation and deposit insurance', 'Week 7 midterm; analyze a bank balance sheet.'),
   ('Investment banks and securities firms', 'Funds: mutual funds, ETFs, hedge funds and private equity', 'Compare the fees and structures of three funds.'),
   ('Insurance companies and pension funds', 'Financial crises and systemic risk', 'Explain one historical crisis and the reforms it led to.')],
  'Institution report: choose a large bank, insurer or asset manager, read its annual report, explain its business model, main risks and regulators, compare it with a competitor on five measures, and write a four-page report.')

C('C9', 'Intermediate financial reporting: IFRS and US GAAP', 'T', ['C1'], ['C2'],
  'Apply the conceptual framework and the main standards for revenue, receivables, inventories, property and intangibles, impairment, leases, income taxes, pensions, financial instruments, provisions, equity and earnings per share, and compare IFRS with US GAAP.',
  'Analysts must know exactly how the numbers were made to judge what they really mean.',
  'Applies the five-step revenue model to a contract, records a lease under IFRS 16 and ASC 842, computes deferred taxes and diluted EPS, and explains a key IFRS versus US GAAP difference.',
  ('IFRS Foundation: IFRS Accounting Standards navigator (free to read)', 'https://www.ifrs.org/issued-standards/list-of-standards/'),
  [('The conceptual framework and standard setters', 'Presentation of financial statements', 'Compare an IFRS and a US GAAP income statement.'),
   ('Revenue from contracts with customers', 'Receivables and inventories', 'Apply the five-step revenue model to three contracts.'),
   ('Property, plant and equipment and intangibles', 'Impairment of assets', 'Test an asset for impairment under both frameworks.'),
   ('Leases', 'Income taxes and deferred taxes', 'Week 7 midterm; record a lease from both sides.'),
   ('Pensions and employee benefits', 'Financial instruments and provisions', 'Compute a deferred tax asset and liability.'),
   ('Equity, share-based pay and earnings per share', 'Accounting changes and errors', 'Compute basic and diluted EPS.')],
  'Reporting comparison: take one IFRS reporter and one US GAAP reporter in the same industry, identify five accounting policy differences in their notes, restate one key ratio on a comparable basis, and write a three-page memo on how the differences affect analysis.')

C('C10', 'Investments: risk, return and asset pricing', 'T', ['C7', 'C5'], ['C6'],
  'Measure returns and risk, build efficient portfolios with mean-variance analysis, use the CAPM, the security market line and multifactor models, test market efficiency, and understand how stocks, bonds and funds are analyzed and how performance is evaluated.',
  'This is the theory behind every investment decision and much of the CFA Program.',
  'Builds an efficient frontier for a set of assets, prices a stock with the CAPM and a three-factor model, and evaluates a fund with the Sharpe ratio and alpha.',
  ('MIT OpenCourseWare 15.401 Finance Theory I (free)', OCW + '15-401-finance-theory-i-fall-2008/'),
  [('Investment environment and asset classes', 'Measuring return and risk', 'Compute arithmetic, geometric and money-weighted returns.'),
   ('Diversification and portfolio risk', 'Mean-variance optimization and the efficient frontier', 'Plot an efficient frontier in Python.'),
   ('The capital asset pricing model', 'Index models and estimating beta', 'Estimate betas and alphas for five stocks.'),
   ('Multifactor models and arbitrage pricing', 'Market efficiency and anomalies', 'Week 7 midterm; test a simple trading rule against the market.'),
   ('Equity valuation overview', 'Bond prices and yields overview', 'Value a stock two ways and a bond one way.'),
   ('Funds, ETFs and investment companies', 'Performance evaluation', 'Rank three funds by Sharpe, Treynor and alpha.')],
  'Portfolio case: for a given set of ten assets, estimate expected returns and covariances from historical data, build the efficient frontier and the tangency portfolio in Python, compare it with an equal-weighted portfolio out of sample, and write a three-page report on the results and their limits.')

C('C11', 'Financial statement analysis', 'T', ['C9', 'C7'], [],
  'Analyze profitability, efficiency, liquidity and solvency with ratios and DuPont analysis, assess earnings and cash-flow quality, adjust statements for comparability, analyze segments, and build a simple forecast of the statements.',
  'Analysis turns accounting numbers into a judgment about a company\'s health and value.',
  'Computes and interprets a full set of ratios with DuPont analysis, spots three warning signs of low earnings quality, and forecasts next year\'s income statement.',
  ('MIT OpenCourseWare 15.535 Business Analysis Using Financial Statements (free)', OCW + '15-535-business-analysis-using-financial-statements-spring-2003/'),
  [('The analysis framework and sources of information', 'Common-size statements and trend analysis', 'Prepare common-size statements for two companies.'),
   ('Profitability ratios and DuPont analysis', 'Activity and efficiency ratios', 'Decompose ROE for three companies.'),
   ('Liquidity and solvency', 'Cash flow analysis', 'Assess a company\'s ability to pay its debts.'),
   ('Earnings quality and red flags', 'Adjusting for accounting differences', 'Week 7 midterm; find the warning signs in a case company.'),
   ('Analyzing inventories, long-lived assets and leases', 'Segment and international analysis', 'Adjust two companies\' statements to be comparable.'),
   ('Credit analysis', 'Forecasting the financial statements', 'Forecast an income statement and balance sheet one year ahead.')],
  'Company analysis: pick a public company and its main competitor, analyze five years of statements with ratios, DuPont and cash flow analysis, assess earnings quality, forecast next year, and write a four-page analyst report with a supported conclusion.')

C('C12', 'Econometrics for finance', 'T', ['C5'], ['C6'],
  'Estimate and test linear regressions, handle heteroskedasticity, autocorrelation and multicollinearity, model time series with trends, AR and ARMA models, test for stationarity and unit roots, model volatility, and use panel data and event studies, in Python.',
  'Econometrics separates real relationships in financial data from noise and coincidence.',
  'Fits and diagnoses a regression with robust standard errors, fits an AR model to a return series, tests for a unit root, and runs an event study.',
  ('QuantEcon: free lectures on quantitative economics with Python', 'https://python.quantecon.org/'),
  [('The linear regression model', 'Inference: t and F tests', 'Estimate and test a multiple regression on return data.'),
   ('Heteroskedasticity and robust standard errors', 'Multicollinearity and model specification', 'Compare ordinary and robust standard errors.'),
   ('Dummy variables and interactions', 'Time series basics: trends and seasonality', 'Test for a January effect with a dummy variable.'),
   ('Autoregressive and moving-average models', 'Stationarity and unit roots', 'Week 7 midterm; fit an AR(1) model and forecast.'),
   ('Volatility: ARCH and GARCH', 'Panel data', 'Estimate a GARCH(1,1) model on daily returns.'),
   ('Event studies', 'Machine learning and its pitfalls in finance', 'Run an event study around earnings announcements.')],
  'Empirical study: choose a testable question about markets (for example whether earnings surprises move prices), gather or use supplied data, estimate the model in Python with diagnostics, and write a five-page paper with results, robustness checks and limitations.')

C('C13', 'Fixed income securities', 'T', ['C10'], ['C6'],
  'Price bonds and compute yields, spot and forward rates, measure interest-rate risk with duration and convexity, analyze credit risk and spreads, value bonds with embedded options, and understand mortgage-backed and other securitized products.',
  'Bonds are the largest market in the world and the base of every interest-rate model.',
  'Prices a bond from a spot curve, computes its duration and convexity and uses them to estimate a price change, and explains a credit spread.',
  ('MIT OpenCourseWare 15.433 Investments (free)', OCW + '15-433-investments-spring-2003/'),
  [('Bond features and markets', 'Pricing bonds and yield measures', 'Price ten bonds and compute their yields.'),
   ('Spot rates, forward rates and bootstrapping', 'Theories of the term structure', 'Bootstrap a spot curve from par yields.'),
   ('Duration', 'Convexity and immunization', 'Estimate price changes with duration and convexity.'),
   ('Credit risk and credit ratings', 'Credit spreads and default probabilities', 'Week 7 midterm; compute expected loss for a bond.'),
   ('Bonds with embedded options', 'Interest-rate trees and option-adjusted spread', 'Value a callable bond on a binomial tree.'),
   ('Mortgage-backed and asset-backed securities', 'Fixed income portfolio strategies', 'Compute prepayments on a mortgage pool.')],
  'Bond portfolio project: build a portfolio of five to eight bonds to match a liability, compute its duration and convexity, immunize it against a parallel rate shift, test it under three rate scenarios in Python, and write a two-page report.')

C('C14', 'Derivatives: forwards, futures, options and swaps', 'T', ['C10'], ['C6', 'C13'],
  'Price forwards and futures by no-arbitrage, hedge with futures, value interest-rate and currency swaps, explain option payoffs and strategies, price options with binomial trees and Black-Scholes-Merton, compute and use the Greeks, and understand how derivatives are used and misused.',
  'Derivatives let investors move risk, and their pricing logic appears throughout finance.',
  'Prices a forward and an option by no-arbitrage, values an option on a two-step binomial tree and with Black-Scholes-Merton, and designs a delta hedge.',
  ('Options Industry Council: free options education', 'https://www.optionseducation.org/'),
  [('Derivative markets and instruments', 'Forward contracts and no-arbitrage pricing', 'Price five forwards and find an arbitrage.'),
   ('Futures: margining and hedging', 'Swaps: interest-rate and currency', 'Compute a minimum-variance hedge ratio.'),
   ('Option payoffs and strategies', 'Put-call parity and option bounds', 'Draw the payoffs of four option strategies.'),
   ('Binomial option pricing', 'The Black-Scholes-Merton model', 'Week 7 midterm; price an option on a two-step tree.'),
   ('The Greeks and delta hedging', 'Volatility: historical and implied', 'Simulate a delta hedge in Python.'),
   ('Exotic options and Monte Carlo pricing', 'Using derivatives in risk management', 'Price an option by Monte Carlo simulation.')],
  'Hedging project: for a described company exposed to a commodity price and a currency, design hedges with futures, forwards and options, price them with the course models in Python, compare outcomes under five scenarios, and write a two-page recommendation.')

C('C15', 'Corporate finance II: valuation, capital structure, payout and mergers', 'T', ['C7', 'C11'], ['C10'],
  'Value companies with discounted cash flow, multiples and residual income; choose a capital structure using Modigliani-Miller, taxes and distress costs; set dividend and buyback policy; and analyze mergers, acquisitions, leveraged buyouts and corporate governance.',
  'These are the decisions that create or destroy company value, and the core of equity research.',
  'Builds a DCF valuation with a terminal value and a WACC, checks it against trading multiples, and explains how leverage changes the cost of capital and value.',
  ('Damodaran Online: free valuation and corporate finance materials (NYU Stern)', 'https://pages.stern.nyu.edu/~adamodar/'),
  [('Free cash flow', 'Discounted cash flow valuation', 'Compute five years of free cash flow to the firm.'),
   ('Terminal value and growth', 'Relative valuation with multiples', 'Value a company with a DCF and three multiples.'),
   ('Capital structure: Modigliani and Miller', 'Taxes, distress costs and optimal leverage', 'Show how leverage changes the cost of equity.'),
   ('Payout policy: dividends and buybacks', 'Residual income and economic profit', 'Week 7 midterm; value a company by residual income.'),
   ('Mergers and acquisitions: motives and valuation', 'Leveraged buyouts', 'Value a target and its synergies.'),
   ('Corporate governance and agency problems', 'Real options in corporate decisions', 'Value an option to expand a project.')],
  'Valuation report: value a public company with a DCF, a multiples analysis and one other method, reconcile the results into a range, test the key assumptions, and write a five-page report with a recommendation.')

C('C16', 'Portfolio management', 'T', ['C10'], ['C12', 'C13', 'C14'],
  'Write an investment policy statement, set strategic and tactical asset allocation, build and rebalance portfolios, manage equity, fixed income and alternative investments, measure and attribute performance, and manage risk with VaR and stress tests.',
  'Portfolio management combines everything before it into decisions for real clients.',
  'Writes an investment policy statement for a client, builds a strategic asset allocation, and attributes a portfolio\'s performance to allocation and selection.',
  ('CFA Institute Research Foundation: free monographs and briefs', 'https://rpc.cfainstitute.org/research/foundation'),
  [('The portfolio management process', 'Investment policy statements', 'Write an IPS for an individual investor.'),
   ('Strategic asset allocation', 'Tactical allocation and rebalancing', 'Build a strategic allocation from capital market assumptions.'),
   ('Equity portfolio management', 'Fixed income portfolio management', 'Compare passive and active equity strategies.'),
   ('Alternative investments in portfolios', 'Risk management: VaR and stress testing', 'Week 7 midterm; compute VaR three ways.'),
   ('Performance measurement', 'Performance attribution', 'Attribute returns with the Brinson model.'),
   ('Behavioral and institutional constraints', 'Ethics and fiduciary duty in portfolio management', 'Explain three conflicts of interest and their remedies.')],
  'Managed portfolio: for an assigned client, write an investment policy statement, build and justify a strategic allocation, implement it with real funds or indexes, simulate a year with rebalancing in Python, attribute the results, and present a client report.')

C('C17', 'Python for finance and financial modeling', 'P', ['H14', 'C7'], ['C5'],
  'Write clear, tested Python for financial work: time-value functions, cash-flow and loan models, data cleaning and analysis with tables of returns, three-statement and DCF models, scenario and sensitivity analysis, Monte Carlo simulation, and charts, using the standard library in the browser and pandas and NumPy on your own computer.',
  'Analysts who can model in code work faster, avoid spreadsheet errors and test more ideas.',
  'Writes a tested Python model that builds a company\'s cash flows, values it with a DCF, and runs a sensitivity table and a Monte Carlo simulation.',
  ('QuantEcon: Python Programming for Economics and Finance (free)', 'https://python-programming.quantecon.org/'),
  [('Python review for finance: functions and tests', 'Time value of money functions', 'Write and test NPV, IRR and annuity functions.'),
   ('Loans, schedules and dates', 'Working with tables of data', 'Build an amortization schedule with dates.'),
   ('Returns and risk from price data', 'Cleaning and checking financial data', 'Compute returns and volatility from a price file.'),
   ('Building an income statement forecast', 'Three-statement models that balance', 'Week 7 midterm; forecast a balance sheet that balances.'),
   ('DCF models in code', 'Sensitivity and scenario tables', 'Value a company and build a sensitivity grid.'),
   ('Monte Carlo simulation', 'Model design, testing and documentation', 'Simulate a project\'s NPV distribution.')],
  'Model library: write a small, documented and tested Python package with time-value, loan, return, three-statement and DCF functions; use it to value a real company with a scenario and Monte Carlo analysis; and write a short user guide.')

C('C18', 'International finance', 'T', ['C4', 'C10'], [],
  'Explain the balance of payments and exchange-rate regimes, use interest-rate and purchasing-power parity, forecast and hedge currency risk, value foreign projects and investments, and analyze international capital flows, sovereign risk and currency crises.',
  'Most companies and portfolios are global, so currency and country risk affect almost every analysis.',
  'Uses covered interest parity to price a forward rate, hedges a foreign receivable, and adjusts a foreign project\'s valuation for currency risk.',
  ('OpenStax Principles of Macroeconomics 3e (free)', OSX + 'principles-macroeconomics-3e'),
  [('The balance of payments', 'Exchange-rate regimes and the international monetary system', 'Analyze a country\'s balance of payments.'),
   ('The foreign exchange market', 'Interest rate parity and forward rates', 'Price three forward rates and find an arbitrage.'),
   ('Purchasing power parity and the real exchange rate', 'Forecasting exchange rates', 'Test PPP with real data.'),
   ('Transaction, economic and translation exposure', 'Hedging currency risk', 'Week 7 midterm; hedge a foreign payable three ways.'),
   ('International capital budgeting', 'International portfolio investment', 'Value a foreign project in two currencies.'),
   ('Sovereign risk and emerging markets', 'Currency crises', 'Explain one currency crisis and its causes.')],
  'Global expansion case: for a company entering a foreign market, analyze the currency and country risks, value the project in both currencies, design a hedging program, and write a three-page recommendation.')

C('C19', 'Risk management and insurance', 'T', ['C10', 'C5'], ['C14'],
  'Identify and measure market, credit, liquidity, operational and model risk; compute value at risk and expected shortfall; stress-test portfolios; understand bank capital rules; and explain insurance principles, products and enterprise risk management.',
  'Managing risk keeps institutions alive; every analyst must know what can go wrong and how badly.',
  'Computes VaR and expected shortfall three ways, designs a stress test, and explains how capital rules and insurance transfer or absorb losses.',
  ('OpenStax Principles of Finance (free)', OSX + 'principles-finance'),
  [('Risk and the risk management process', 'Measuring market risk', 'Classify the risks of three businesses.'),
   ('Value at risk: parametric, historical and Monte Carlo', 'Expected shortfall and backtesting', 'Compute VaR three ways for one portfolio.'),
   ('Credit risk measurement', 'Counterparty and liquidity risk', 'Compute expected loss for a loan book.'),
   ('Operational and model risk', 'Stress testing and scenario analysis', 'Week 7 midterm; design a stress test.'),
   ('Bank capital and the Basel framework', 'Insurance principles and products', 'Compute a simple capital ratio.'),
   ('Insurance company risk', 'Enterprise risk management and culture', 'Explain one risk failure and its lessons.')],
  'Risk report: for a given portfolio or institution, measure its market and credit risk, compute VaR and expected shortfall, run three stress scenarios in Python, and write a three-page risk report with recommendations.')

C('C20', 'Behavioral finance', 'T', ['C10'], [],
  'Explain how heuristics, biases and emotions affect investors, how limits to arbitrage let mispricing persist, which market anomalies behavioral models explain, and how advisers and institutions can design choices and processes that reduce costly mistakes.',
  'Knowing how people really decide helps you avoid their mistakes and serve clients better.',
  'Identifies the biases in a described investor\'s decisions, explains an anomaly with a behavioral model, and designs a decision process that reduces one bias.',
  ('Meir Statman, Behavioral Finance: The Second Generation (CFA Institute Research Foundation, free PDF)', 'https://rpc.cfainstitute.org/en/research/foundation/2019/behavioral-finance-the-second-generation'),
  [('Rational choice and its limits', 'Prospect theory', 'Explain five choices with prospect theory.'),
   ('Heuristics: representativeness, availability and anchoring', 'Overconfidence and self-attribution', 'Find the biases in three investor stories.'),
   ('Mental accounting and framing', 'The disposition effect', 'Measure a disposition effect in sample trades.'),
   ('Limits to arbitrage', 'Market anomalies: momentum, value and bubbles', 'Week 7 midterm; explain one bubble with behavioral ideas.'),
   ('Investor sentiment and herding', 'Corporate behavioral finance', 'Analyze a merger driven by overconfidence.'),
   ('Behavioral portfolio theory and advice', 'Choice architecture and nudges', 'Design a default that improves saving.')],
  'Bias audit: study a real investment decision or market episode, identify the biases involved with evidence, explain the price effects with course models, and propose a process to reduce the errors, in a three-page paper.')

C('C21', 'Business law, ethics and financial regulation', 'W', ['C8'], [],
  'Explain contracts, agency, business organizations and securities law; describe how the SEC, FINRA, the Federal Reserve and other regulators supervise markets and firms; apply rules on disclosure, insider trading, market manipulation and anti-money laundering; and reason through ethical dilemmas in finance.',
  'Laws, regulations and ethics set the boundaries every finance professional must work within.',
  'Explains the main securities laws and who enforces them, identifies insider trading in a case, and writes a reasoned resolution to an ethical dilemma.',
  ('OpenStax Business Law I Essentials (free)', OSX + 'business-law-i-essentials'),
  [('The legal system and contracts', 'Agency and business organizations', 'Brief a contract case.'),
   ('Securities law: the 1933 and 1934 Acts', 'Regulators: SEC, FINRA, CFTC and banking agencies', 'Map who regulates five kinds of firms.'),
   ('Disclosure and corporate reporting rules', 'Insider trading and market manipulation', 'Decide four insider trading cases.'),
   ('Investment advisers, broker-dealers and fiduciary duty', 'Anti-money laundering and sanctions', 'Week 7 midterm; compare a fiduciary and a suitability standard.'),
   ('Consumer financial protection', 'Ethics: frameworks for decisions', 'Analyze a consumer finance complaint.'),
   ('Ethical dilemmas in finance', 'Culture, compliance and whistleblowing', 'Write a resolution to an ethical dilemma.')],
  'Compliance memo: analyze a described enforcement case, identify the laws and rules broken, explain the regulators\' actions, and write a four-page memo recommending controls and ethical practices to prevent a repeat.')

# ---------------- CFA Program and investment career ----------------
C('P1', 'CFA Program Level I review', 'T', ['C10', 'C11'], ['C13', 'C14', 'C21'],
  'Review the full CFA Program Level I body of knowledge with original practice: ethical and professional standards, quantitative methods, economics, financial statement analysis, corporate issuers, equity, fixed income, derivatives, alternative investments and portfolio management, with timed mixed practice and exam strategy.',
  'Level I tests the broad foundation every investment professional is expected to know.',
  'Scores near 75% on a timed, mixed set of original Level I-style questions and explains every wrong answer.',
  ('CFA Institute: CFA Program overview and exam information', 'https://www.cfainstitute.org/programs/cfa-program'),
  [('Ethics: the Code and Standards', 'Ethics: applying the Standards to cases', 'Answer forty ethics cases and explain each answer.'),
   ('Quantitative methods', 'Economics', 'Work a timed mixed set on rates, returns and statistics.'),
   ('Financial statement analysis I', 'Financial statement analysis II', 'Work a timed set on statements and ratios.'),
   ('Corporate issuers', 'Equity investments', 'Week 7 midterm; a timed half-length mixed exam.'),
   ('Fixed income', 'Derivatives and alternative investments', 'Work a timed set on bonds and derivatives.'),
   ('Portfolio management', 'Full-length timed practice and review', 'Take a full-length timed practice exam.')],
  'Exam simulation and error log: take two full-length timed practice exams of original questions, keep an error log that classifies every miss by topic and cause, write a two-week targeted review plan, and retake a fresh mixed set to show improvement.')

C('P2', 'CFA Program Level II review', 'T', ['P1'], ['C15', 'C12'],
  'Review the CFA Program Level II body of knowledge, which centers on asset valuation, through vignette-based item sets: ethics, quantitative methods, economics, financial statement analysis, corporate issuers, equity valuation, fixed income, derivatives, alternative investments and portfolio management.',
  'Level II tests whether you can apply valuation tools to realistic cases, the daily work of an analyst.',
  'Scores near 70% on timed, original vignette-style item sets and explains the valuation reasoning behind each answer.',
  ('CFA Institute: CFA Program overview and exam information', 'https://www.cfainstitute.org/programs/cfa-program'),
  [('Ethics in vignettes', 'Quantitative methods: regression and time series', 'Work four ethics vignettes.'),
   ('Economics: currencies and growth', 'Financial statement analysis: intercorporate investments and pensions', 'Work a timed FSA item set.'),
   ('Financial statement analysis: multinationals and quality', 'Corporate issuers', 'Analyze the quality of reported earnings in a vignette.'),
   ('Equity valuation I: DDM and free cash flow', 'Equity valuation II: multiples and residual income', 'Week 7 midterm; a timed set of mixed vignettes.'),
   ('Fixed income: term structure, credit and options', 'Derivatives pricing and valuation', 'Value a callable bond and a swap in vignettes.'),
   ('Alternative investments and portfolio management', 'Full-length timed practice and review', 'Take a full-length timed practice exam.')],
  'Valuation case set: write and solve your own vignette with four item-set questions on one company, take two full-length timed practice exams of original item sets, and keep an error log with a targeted review plan.')

C('P3', 'CFA Program Level III review: portfolio management and wealth planning', 'T', ['P2', 'C16'], [],
  'Review the CFA Program Level III core (asset allocation, portfolio construction, performance measurement, derivatives and risk management, and ethics) and the three specialized pathways (portfolio management, private markets and private wealth), practicing both item sets and constructed-response answers.',
  'Level III tests whether you can make and justify portfolio decisions for real clients.',
  'Writes clear, correct constructed-response answers to an original client case and scores near 70% on timed item sets.',
  ('CFA Institute: CFA Program overview and exam information', 'https://www.cfainstitute.org/programs/cfa-program'),
  [('Capital market expectations', 'Asset allocation', 'Build an allocation for an institutional client.'),
   ('Portfolio construction: equity', 'Portfolio construction: fixed income', 'Answer a constructed-response question on a bond portfolio.'),
   ('Derivatives and currency management', 'Trading, performance evaluation and manager selection', 'Design an overlay with futures and options.'),
   ('Private wealth: individual clients and taxes', 'Institutional investors', 'Week 7 midterm; write answers to a full client case.'),
   ('Pathway topics: private markets and portfolio management', 'Ethics and GIPS at Level III', 'Work a pathway practice set.'),
   ('Constructed-response technique', 'Full-length timed practice and review', 'Take a full-length timed practice exam.')],
  'Client case portfolio: write three original client cases (an individual, an institution and a private-markets allocation) with full constructed-response answers, take a full-length timed practice exam, and keep an error log with a final review plan.')

C('P4', 'Equity research and financial modeling', 'P', ['C15', 'C17'], ['C11'],
  'Do the work of a sell-side or buy-side equity analyst: research an industry and a company, build an integrated three-statement model with schedules in Python, value the company with DCF and multiples, set a price target, and communicate a recommendation in writing and in a pitch.',
  'Building and defending a model is the core daily skill of an investment analyst.',
  'Builds a tested, integrated model of a real company, derives a price target from two methods, and writes a clear one-page investment summary.',
  ('SEC EDGAR: free company filings search', 'https://www.sec.gov/search-filings'),
  [('The analyst\'s job and research process', 'Industry analysis', 'Write a one-page industry overview.'),
   ('Reading 10-Ks, 10-Qs and earnings calls', 'Revenue drivers and forecasting', 'Build a driver-based revenue forecast in code.'),
   ('Operating costs and margins', 'Working capital, capital spending and depreciation schedules', 'Model the schedules for one company.'),
   ('Debt, interest and the cash sweep', 'Integrating the three statements', 'Week 7 midterm; integrate a model that balances.'),
   ('DCF and multiples in the model', 'Price targets, scenarios and sensitivity', 'Set a price target with a sensitivity table.'),
   ('Writing the research note', 'Pitching and defending an idea', 'Give a five-minute pitch with a one-page summary.')],
  'Initiation model: build a complete, tested Python model of a real public company with three integrated statements, schedules and a valuation, set a 12-month price target with scenarios, and write a two-page summary of the thesis and key risks.')

C('P5', 'Capstone: an equity research report', 'E', ['P4'], ['C16', 'C20'],
  'Produce a professional-quality initiation report on a public company: thesis, industry and competitive analysis, financial analysis, a full model and valuation, a price target and recommendation, risks and catalysts, an ESG and governance review, and a pitch, revised after feedback.',
  'A finished report shows employers you can do the whole job from first question to defended conclusion.',
  'Delivers a complete report and model that a senior analyst would accept with small changes, and defends it in a Q&A.',
  ('CFA Institute Research Challenge: free guidance and past reports', 'https://www.cfainstitute.org/societies/challenge'),
  [('Choosing a company and a question', 'Planning the report', 'Submit a one-page proposal.'),
   ('Business and industry analysis', 'Competitive position and moat', 'Draft the business and industry sections.'),
   ('Financial analysis', 'The model: forecast and schedules', 'Complete the forecast model.'),
   ('Valuation and price target', 'Risks, catalysts and scenarios', 'Week 7 midterm; present a draft valuation for feedback.'),
   ('ESG and governance analysis', 'Writing and editing the report', 'Submit a full draft report.'),
   ('Peer review and revision', 'The pitch and Q&A', 'Revise the report and give the final pitch.')],
  'Initiation report: a 10 to 15 page research report with a tested model, valuation, price target, risks and an ESG and governance review on a public company of your choice, revised after a peer review, plus a ten-minute recorded pitch and answers to five hard questions.')

C('P6', 'The investment profession: ethics, compliance, performance standards and careers', 'E', ['C21'], ['P1'],
  'Practice the professional side of investing: apply the CFA Institute Code and Standards to workplace dilemmas, follow compliance and conflict-of-interest rules, present performance under the GIPS standards, understand licensing such as the SIE and Series 7, serve clients as a fiduciary, and plan a career with networking, interviews and continuing education.',
  'Trust is the profession\'s product; ethics, compliance and professionalism protect clients and careers.',
  'Resolves a workplace ethics dilemma with the Standards, explains a GIPS-compliant performance presentation, and prepares a targeted resume and interview stories.',
  ('CFA Institute: Code of Ethics and Standards of Professional Conduct', 'https://www.cfainstitute.org/standards/professionals/code-ethics-standards'),
  [('Professionalism and the Code and Standards', 'Duties to clients and employers', 'Resolve five workplace dilemmas with the Standards.'),
   ('Conflicts of interest and personal trading', 'Research objectivity and communication', 'Write a personal-trading policy for a small firm.'),
   ('Compliance programs and regulators', 'Licensing: SIE, Series 7, 63, 65 and 66', 'Map which license each role needs.'),
   ('Performance presentation and GIPS', 'Client service and fiduciary practice', 'Week 7 midterm; review a performance presentation for errors.'),
   ('Careers: roles in investment management, research and banking', 'Resumes, networking and interviews', 'Draft a resume and three interview stories.'),
   ('Continuing education and professional growth', 'Technology, AI and the future of the profession', 'Write a five-year development plan.')],
  'Professional portfolio: a written ethics case analysis with your resolution, a compliance checklist for a new advisory firm, a review of a sample GIPS presentation, and a career plan with a targeted resume and interview stories.')

# ---------------- write ----------------
_ORDER = {k: i for i, (k, _, _) in enumerate(STAGES)}
COURSES.sort(key=lambda c: _ORDER[c['stage']])  # stable: new K-12 courses follow the reused ones of their stage
for c in COURSES:
    assert c['units'][-1]['weeks'] == [13, 14], c['code']
codes = [c['code'] for c in COURSES]
assert len(codes) == len(set(codes))
for c in COURSES:
    for r in c['req'] + c['soft']:
        assert r in codes, (c['code'], r)
json.dump(COURSES, open(f'{ROOT}/work/courses_raw.json', 'w'), indent=1, ensure_ascii=False)
json.dump({'stages': [{'key': k, 'name': n, 'blurb': b} for k, n, b in STAGES], 'hours': HOURS, 'finalMin': FINAL_MIN},
          open(f'{ROOT}/work/meta.json', 'w'), indent=1, ensure_ascii=False)
from collections import Counter
print(len(COURSES), 'courses;', sum(1 for c in COURSES if c.get('reusedFrom')), 'reused;', Counter(c['stage'] for c in COURSES))
