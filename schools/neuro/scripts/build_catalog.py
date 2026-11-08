"""Build the site catalog (src/catalog.json) and the writer briefs (toolkit/courses/<CODE>.json) from work/courses_raw.json."""
import json, os

ROOT = '/home/claude/neuro'
raw = json.load(open(f'{ROOT}/work/courses_raw.json'))
meta = json.load(open(f'{ROOT}/work/meta.json'))
STAGE_NAME = {s['key']: s['name'] for s in meta['stages']}

PROFILE_LABEL = {'Y': 'Y young learner', 'T': 'T theory', 'W': 'W reading and writing', 'L': 'L laboratory science',
                 'P': 'P programming and modeling', 'E': 'E research practice', 'X': 'X clinical'}
AUDIENCE = {
    'elementary': 'a child in grades K–5 working with an adult helper who reads along',
    'middle': 'a student in grades 6–8',
    'high': 'a high-school student (grades 9–12) or an adult reviewing high-school work',
    'college': 'a college student in a neuroscience, cognitive science, psychology or biology degree program, or an adult studying the same material on their own',
    'professional': 'a graduate preparing for research in neuroscience or cognitive science, or a graduate student in the first years of a PhD or a research role',
}

PROFILES = {
    'Y': {'name': 'Young learner', 'weights': [['Practice', 40], ['Check-ups', 20], ['Final check', 20], ['Project', 20]],
          'evidence': 'Gets most questions right again a week later and can explain the idea in their own words, with objects or drawings.'},
    'T': {'name': 'Theory', 'weights': [['Problem sets', 25], ['Quizzes', 10], ['Midterm', 20], ['Final', 30], ['Project', 15]],
          'evidence': 'Two independent cumulative attempts near 85%, with sound reasoning and repaired prerequisites.'},
    'W': {'name': 'Reading and writing', 'weights': [['Writing assignments', 40], ['Reading quizzes', 20], ['Midterm', 15], ['Final', 15], ['Project', 10]],
          'evidence': 'A clear, well-argued essay on an unseen prompt, and an accurate, balanced analysis of an unseen case or policy question.'},
    'L': {'name': 'Laboratory science', 'weights': [['Problem sets', 25], ['Lab reports', 25], ['Midterm', 15], ['Final', 25], ['Project', 10]],
          'evidence': 'Two cumulative attempts near 85%, plus a lab report with data, uncertainty and a defensible conclusion.'},
    'P': {'name': 'Programming and modeling', 'weights': [['Programming exercises', 30], ['Quizzes', 10], ['Midterm', 15], ['Final', 25], ['Project', 20]],
          'evidence': 'Two cumulative attempts near 85% on unseen problems, and a working, tested program you built yourself without copying it or having AI write it.'},
    'X': {'name': 'Clinical', 'weights': [['Case work', 30], ['Quizzes', 15], ['Midterm', 15], ['Board-style final', 30], ['Project', 10]],
          'evidence': 'Two board-style cumulative attempts near 80%, and complete written cases with sound reasoning.'},
    'E': {'name': 'Research practice', 'weights': [['Papers and exercises', 35], ['Quizzes', 15], ['Final', 20], ['Project', 30]],
          'evidence': 'A finished paper, proposal or exam answer that a faculty reader would accept with small changes, plus near 85% on an unseen cumulative check.'},
}

RESOURCES = [
    {'level': 'Elementary school', 'free': [['Khan Academy math by grade', 'https://www.khanacademy.org/math'], ['Reading Rockets', 'https://www.readingrockets.org/'], ['Code.org', 'https://code.org/'], ['Scratch', 'https://scratch.mit.edu/']],
     'paid': 'A library card: picture books for daily reading aloud, including books about the body and the senses, and a computer or tablet for first programs.', 'paidUrl': None},
    {'level': 'Middle and high school', 'free': [['Khan Academy', 'https://www.khanacademy.org/'], ['CK-12', 'https://www.ck12.org/'], ['BrainFacts.org (Society for Neuroscience)', 'https://www.brainfacts.org/'], ["The Python Tutorial (python.org)", 'https://docs.python.org/3/tutorial/']],
     'paid': 'A tutor, a study partner or a science club if weekly practice stalls.', 'paidUrl': None},
    {'level': 'College neuroscience and cognitive science degree', 'free': [['Neuroscience Online (UTHealth Houston)', 'https://nba.uth.tmc.edu/neuroscience/'], ['OpenStax Psychology 2e', 'https://openstax.org/details/books/psychology-2e'], ['Neuronal Dynamics (free online)', 'https://neuronaldynamics.epfl.ch/online/'], ['MIT OpenCourseWare', 'https://ocw.mit.edu/']],
     'paid': 'A laptop for data analysis and, if you want a credential and laboratory experience, an accredited degree program with research opportunities.', 'paidUrl': None},
    {'level': 'Graduate study and research', 'free': [['Neuromatch Academy course materials', 'https://compneuro.neuromatch.io/'], ['OpenNeuro open data sets', 'https://openneuro.org/'], ['bioRxiv neuroscience preprints', 'https://www.biorxiv.org/collection/neuroscience'], ['PubMed', 'https://pubmed.ncbi.nlm.nih.gov/']],
     'paid': "Laboratory placements, conference travel and, for the degree itself, admission to a PhD program; check each program's funding before you apply.", 'paidUrl': None},
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
