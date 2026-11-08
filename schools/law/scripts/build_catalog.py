"""Build the site catalog (src/catalog.json) and the writer briefs (toolkit/courses/<CODE>.json) from work/courses_raw.json."""
import json, os

ROOT = '/home/claude/law'
raw = json.load(open(f'{ROOT}/work/courses_raw.json'))
meta = json.load(open(f'{ROOT}/work/meta.json'))
STAGE_NAME = {s['key']: s['name'] for s in meta['stages']}

PROFILE_LABEL = {'Y': 'Y young learner', 'T': 'T theory', 'W': 'W reading and writing', 'L': 'L laboratory science',
                 'J': 'J legal analysis', 'D': 'D drafting and advocacy'}
AUDIENCE = {
    'elementary': 'a child in grades K–5 working with an adult helper who reads along',
    'middle': 'a student in grades 6–8',
    'high': 'a high-school student (grades 9–12) or an adult reviewing high-school work',
    'college': 'a pre-law college student (any major) preparing for law school and the LSAT',
    'law': 'a law student in a U.S. JD program',
    'bar': 'a law graduate preparing for a U.S. bar exam (the Uniform Bar Exam or the NextGen bar exam)',
}

PROFILES = {
    'Y': {'name': 'Young learner', 'weights': [['Practice', 40], ['Check-ups', 20], ['Final check', 20], ['Project', 20]],
          'evidence': 'Gets most questions right again a week later and can show the idea with objects or drawings.'},
    'T': {'name': 'Theory', 'weights': [['Problem sets', 25], ['Quizzes', 10], ['Midterm', 20], ['Final', 30], ['Project', 15]],
          'evidence': 'Two independent cumulative attempts near 85%, with sound reasoning and repaired prerequisites.'},
    'W': {'name': 'Reading and writing', 'weights': [['Writing assignments', 40], ['Reading quizzes', 20], ['Midterm', 15], ['Final', 15], ['Project', 10]],
          'evidence': 'A clear, supported piece of writing on an unseen prompt, and accurate analysis of an unseen text.'},
    'L': {'name': 'Laboratory science', 'weights': [['Problem sets', 25], ['Lab reports', 25], ['Midterm', 15], ['Final', 25], ['Project', 10]],
          'evidence': 'Two cumulative attempts near 85%, plus a lab report with data, uncertainty and a defensible conclusion.'},
    'J': {'name': 'Legal analysis', 'weights': [['Case briefs and problems', 25], ['Quizzes', 10], ['Midterm', 15], ['Final exam', 40], ['Project', 10]],
          'evidence': 'Two exam-style cumulative attempts near 80% on unseen questions, and written analyses that spot the issues, state the rules accurately and apply them to the facts.'},
    'D': {'name': 'Drafting and advocacy', 'weights': [['Writing and drafting assignments', 50], ['Skills exercises', 20], ['Final', 15], ['Project', 15]],
          'evidence': 'A complete, well-organized written or oral product on an unseen problem that a supervising lawyer could use with minor edits.'},
}

RESOURCES = [
    {'level': 'Elementary school', 'free': [['Khan Academy math by grade', 'https://www.khanacademy.org/math'], ['Reading Rockets', 'https://www.readingrockets.org/'], ['NASA Space Place', 'https://spaceplace.nasa.gov/']],
     'paid': 'A library card: picture books and early readers for daily reading aloud.', 'paidUrl': None},
    {'level': 'Middle and high school', 'free': [['Khan Academy', 'https://www.khanacademy.org/'], ['CK-12', 'https://www.ck12.org/'], ['CommonLit', 'https://www.commonlit.org/'], ['OpenStax high-school books', 'https://openstax.org/subjects']],
     'paid': 'A tutor or study group if weekly practice stalls.', 'paidUrl': None},
    {'level': 'College pre-law', 'free': [['OpenStax college textbooks', 'https://openstax.org/subjects'], ['forall x: an open introduction to formal logic', 'https://forallx.openlogicproject.org/'], ['LSAC: LSAT prep and free LawHub practice tests', 'https://www.lsac.org/lsat/prep']],
     'paid': 'A LawHub Advantage subscription from LSAC (paid) for the full library of official practice tests.', 'paidUrl': 'https://www.lsac.org/lsat/prep'},
    {'level': 'Law school', 'free': [['Cornell Legal Information Institute (statutes, rules, Wex)', 'https://www.law.cornell.edu/'], ['H2O open casebooks', 'https://opencasebook.org/'], ['Oyez (Supreme Court cases and arguments)', 'https://www.oyez.org/'], ['Justia case law', 'https://law.justia.com/'], ['Constitution Annotated', 'https://constitution.congress.gov/']],
     'paid': 'Your law school\'s casebooks and its free student access to the major research databases.', 'paidUrl': None},
    {'level': 'Bar exam', 'free': [['NCBE: content outlines, sample questions and NextGen information', 'https://www.ncbex.org/'], ['Your jurisdiction\'s bar admission office (rules, deadlines, character and fitness)', 'https://www.ncbex.org/bar-admissions/']],
     'paid': 'NCBE study aids (paid licensed past questions) or a commercial bar review course.', 'paidUrl': 'https://www.ncbex.org/'},
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
