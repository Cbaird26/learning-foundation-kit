"""Build the site catalog (src/catalog.json) and the writer briefs (toolkit/courses/<CODE>.json) from work/courses_raw.json."""
import json, os

ROOT = '/home/claude/finance'
raw = json.load(open(f'{ROOT}/work/courses_raw.json'))
meta = json.load(open(f'{ROOT}/work/meta.json'))
STAGE_NAME = {s['key']: s['name'] for s in meta['stages']}

PROFILE_LABEL = {'Y': 'Y young learner', 'T': 'T theory', 'W': 'W reading and writing', 'L': 'L laboratory science',
                 'P': 'P programming and modeling', 'E': 'E professional practice'}
AUDIENCE = {
    'elementary': 'a child in grades K–5 working with an adult helper who reads along',
    'middle': 'a student in grades 6–8',
    'high': 'a high-school student (grades 9–12) or an adult reviewing high-school work',
    'college': 'a college student in a finance, accounting or business degree program, or a career changer studying the same material on their own',
    'professional': 'a finance graduate or career changer preparing for the CFA Program exams and a career in investment analysis',
}

PROFILES = {
    'Y': {'name': 'Young learner', 'weights': [['Practice', 40], ['Check-ups', 20], ['Final check', 20], ['Project', 20]],
          'evidence': 'Gets most questions right again a week later and can show the idea with coins, objects or drawings.'},
    'T': {'name': 'Theory', 'weights': [['Problem sets', 25], ['Quizzes', 10], ['Midterm', 20], ['Final', 30], ['Project', 15]],
          'evidence': 'Two independent cumulative attempts near 85%, with sound reasoning and repaired prerequisites.'},
    'W': {'name': 'Reading and writing', 'weights': [['Writing assignments', 40], ['Reading quizzes', 20], ['Midterm', 15], ['Final', 15], ['Project', 10]],
          'evidence': 'A clear, supported piece of writing on an unseen prompt, and accurate analysis of an unseen text.'},
    'L': {'name': 'Laboratory science', 'weights': [['Problem sets', 25], ['Lab reports', 25], ['Midterm', 15], ['Final', 25], ['Project', 10]],
          'evidence': 'Two cumulative attempts near 85%, plus a lab report with data, uncertainty and a defensible conclusion.'},
    'P': {'name': 'Programming and modeling', 'weights': [['Programming and modeling exercises', 30], ['Quizzes', 10], ['Midterm', 15], ['Final', 25], ['Project', 20]],
          'evidence': 'Two cumulative attempts near 85% on unseen problems, and a working, tested program or model you built yourself without copying it or having AI write it.'},
    'E': {'name': 'Professional practice', 'weights': [['Cases and practice exercises', 35], ['Quizzes', 15], ['Final', 20], ['Project', 30]],
          'evidence': 'A finished report, model or case analysis that a senior analyst would accept with small changes, plus near 85% on an unseen cumulative check.'},
}

RESOURCES = [
    {'level': 'Elementary school', 'free': [['Khan Academy math by grade', 'https://www.khanacademy.org/math'], ['Reading Rockets', 'https://www.readingrockets.org/'], ['Money as You Grow (CFPB)', 'https://www.consumerfinance.gov/consumer-tools/money-as-you-grow/'], ['Practical Money Skills', 'https://www.practicalmoneyskills.com/']],
     'paid': 'A library card: picture books and early readers for daily reading aloud, including books about money.', 'paidUrl': None},
    {'level': 'Middle and high school', 'free': [['Khan Academy', 'https://www.khanacademy.org/'], ['CK-12', 'https://www.ck12.org/'], ['Next Gen Personal Finance', 'https://www.ngpf.org/'], ['Python for Everybody', 'https://www.py4e.com/']],
     'paid': 'A tutor or a study group if weekly practice stalls; a basic financial calculator is optional.', 'paidUrl': None},
    {'level': 'College finance degree', 'free': [['MIT OpenCourseWare', 'https://ocw.mit.edu/'], ['OpenStax free textbooks: business, accounting and economics', 'https://openstax.org/subjects/business'], ['Damodaran Online (NYU Stern): valuation and corporate finance', 'https://pages.stern.nyu.edu/~adamodar/'], ['FRED economic data (Federal Reserve Bank of St. Louis)', 'https://fred.stlouisfed.org/']],
     'paid': 'A computer with a spreadsheet program, a financial calculator allowed on the CFA exams, and, if you want a credential, an accredited degree program.', 'paidUrl': None},
    {'level': 'CFA Program and investment career', 'free': [['CFA Institute: the CFA Program', 'https://www.cfainstitute.org/programs/cfa-program'], ['SEC EDGAR company filings', 'https://www.sec.gov/search-filings'], ['Investor.gov (SEC investor education)', 'https://www.investor.gov/'], ['FINRA: qualification exams such as the SIE', 'https://www.finra.org/registration-exams-ce/qualification-exams']],
     'paid': 'CFA Program enrollment and exam fees, paid to CFA Institute (check current fees on its site), and optionally a paid question bank for timed practice.', 'paidUrl': None},
]

order = [c['code'] for c in raw]
courses = []
for c in raw:
    units = []
    for n, u in enumerate(c['units'], 1):
        caps = [t[0].upper() + t[1:] for t in u['topics']]
        units.append({'n': n, 'weeks': u['weeks'], 'topics': caps, 'name': caps[0] + ' · ' + caps[1], 'deliverable': u['deliverable']})
    lvl = c['level']
    courses.append({
        'code': c['code'], 'title': c['title'], 'group': c['stage'], 'level': lvl, 'hours': meta['hours'][lvl], 'finalMinutes': meta['finalMin'][lvl],
        'prereqText': c['prerequisites'].rstrip('.'), 'req': c['req'], 'soft': c['soft'],
        'purpose': c['purpose'], 'why': c['why'], 'ready': c['ready'], 'reading': c['reading'], 'readingNote': c.get('readingNote'),
        'supplement': c.get('supplement'), 'units': units, 'project': c['project'], 'profile': c['profile'], 'completion': c['completion'],
        'elective': bool(c.get('elective')),
    })
for c in courses:
    c['leadsTo'] = [d['code'] for d in courses if c['code'] in d['req']]

catalog = {'groups': meta['stages'], 'courses': courses, 'profiles': PROFILES, 'resources': RESOURCES}
json.dump(catalog, open(f'{ROOT}/src/catalog.json', 'w'), ensure_ascii=False, separators=(',', ':'))

os.makedirs(f'{ROOT}/toolkit/courses', exist_ok=True)
for c in raw:
    weeks = {}
    for u in c['units']:
        for w, t in zip(u['weeks'], u['topics']):
            weeks[str(w)] = t[0].upper() + t[1:]
    brief = {
        'code': c['code'], 'title': c['title'], 'stage': STAGE_NAME[c['stage']], 'level': c['level'], 'audience': AUDIENCE[c['level']],
        'profile': PROFILE_LABEL[c['profile']], 'prerequisites': c['prerequisites'], 'purpose': c['purpose'],
        'primary_reading': c['reading']['title'], 'weeks': weeks,
        'blocks': [{'weeks': u['weeks'], 'deliverable': u['deliverable']} for u in c['units']],
        'project': c['project'], 'completion': c['completion'],
        'files': {f'L{w:02d}.txt': weeks[str(w)] for w in range(1, 13)},
    }
    json.dump(brief, open(f'{ROOT}/toolkit/courses/{c["code"]}.json', 'w'), indent=1, ensure_ascii=False)
print(len(courses), 'courses in catalog;', os.path.getsize(f'{ROOT}/src/catalog.json') // 1024, 'KB')
