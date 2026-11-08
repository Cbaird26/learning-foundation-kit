"""Build the site catalog (src/catalog.json) and the writer briefs (toolkit/courses/<CODE>.json) from work/courses_raw.json."""
import json, os

ROOT = '/home/claude/code'
raw = json.load(open(f'{ROOT}/work/courses_raw.json'))
meta = json.load(open(f'{ROOT}/work/meta.json'))
STAGE_NAME = {s['key']: s['name'] for s in meta['stages']}

PROFILE_LABEL = {'Y': 'Y young learner', 'T': 'T theory', 'W': 'W reading and writing', 'L': 'L laboratory science',
                 'P': 'P programming', 'E': 'E engineering practice'}
AUDIENCE = {
    'elementary': 'a child in grades K–5 working with an adult helper who reads along',
    'middle': 'a student in grades 6–8',
    'high': 'a high-school student (grades 9–12) or an adult reviewing high-school work',
    'college': 'a college student in a computer science degree program, or a career changer studying the same material on their own',
    'professional': 'a computer science graduate or an experienced self-taught programmer preparing for and starting a software engineering job',
}

PROFILES = {
    'Y': {'name': 'Young learner', 'weights': [['Practice', 40], ['Check-ups', 20], ['Final check', 20], ['Project', 20]],
          'evidence': 'Gets most questions right again a week later and can show the idea with objects, drawings or a tiny program.'},
    'T': {'name': 'Theory', 'weights': [['Problem sets', 25], ['Quizzes', 10], ['Midterm', 20], ['Final', 30], ['Project', 15]],
          'evidence': 'Two independent cumulative attempts near 85%, with sound reasoning and repaired prerequisites.'},
    'W': {'name': 'Reading and writing', 'weights': [['Writing assignments', 40], ['Reading quizzes', 20], ['Midterm', 15], ['Final', 15], ['Project', 10]],
          'evidence': 'A clear, supported piece of writing on an unseen prompt, and accurate analysis of an unseen text.'},
    'L': {'name': 'Laboratory science', 'weights': [['Problem sets', 25], ['Lab reports', 25], ['Midterm', 15], ['Final', 25], ['Project', 10]],
          'evidence': 'Two cumulative attempts near 85%, plus a lab report with data, uncertainty and a defensible conclusion.'},
    'P': {'name': 'Programming', 'weights': [['Programming exercises', 30], ['Quizzes', 10], ['Midterm', 15], ['Final', 25], ['Project', 20]],
          'evidence': 'Two cumulative attempts near 85% on unseen problems, and a working, tested program you wrote yourself without copying it or having AI write it.'},
    'E': {'name': 'Engineering practice', 'weights': [['Design and practice exercises', 35], ['Quizzes', 15], ['Final', 20], ['Project', 30]],
          'evidence': 'A working project and written designs that a senior engineer would accept with small changes, plus near 85% on an unseen cumulative check.'},
}

RESOURCES = [
    {'level': 'Elementary school', 'free': [['Khan Academy math by grade', 'https://www.khanacademy.org/math'], ['Reading Rockets', 'https://www.readingrockets.org/'], ['CS Unplugged', 'https://www.csunplugged.org/'], ['Scratch (block programming)', 'https://scratch.mit.edu/']],
     'paid': 'A library card: picture books and early readers for daily reading aloud.', 'paidUrl': None},
    {'level': 'Middle and high school', 'free': [['Khan Academy', 'https://www.khanacademy.org/'], ['CK-12', 'https://www.ck12.org/'], ['Python for Everybody', 'https://www.py4e.com/'], ['Think Python', 'https://allendowney.github.io/ThinkPython/']],
     'paid': 'A tutor, a coding club or a study group if weekly practice stalls.', 'paidUrl': None},
    {'level': 'College computer science', 'free': [['MIT OpenCourseWare', 'https://ocw.mit.edu/'], ['The official Python documentation and tutorial', 'https://docs.python.org/3/'], ['Open Source Society University: a free CS curriculum', 'https://github.com/ossu/computer-science'], ['The Missing Semester of Your CS Education', 'https://missing.csail.mit.edu/']],
     'paid': 'A computer you can install software on (any recent laptop) and, if you want a credential, an accredited degree program.', 'paidUrl': None},
    {'level': 'Software engineering career', 'free': [['Tech Interview Handbook', 'https://www.techinterviewhandbook.org/'], ['The System Design Primer', 'https://github.com/donnemartin/system-design-primer'], ['Software Engineering at Google', 'https://abseil.io/resources/swe-book']],
     'paid': 'Optional: a paid coding-practice platform, or a cloud account for deploying the capstone (most providers have free tiers).', 'paidUrl': None},
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
