"""Parse ToE lesson source files (.txt) into dictionaries.

Format: sections start with a line beginning with '@' at column 0.
  @lesson            fields: title, summary, objective*, reading
  @article           raw markdown body
  @example           fields: title, problem, step*, answer
  @mistakes          raw body, one '- ' bullet per line
  @practice <type>   item fields (see README)
  @quiz <type>       same as practice, reserved for quizzes and tests
  @project           fields: title, overview, goal*, step*, deliverable*, rubric*, safety, tutor*
  @review            raw markdown body
  @exam <type>       cumulative final-exam items (project.txt only)
Fields are 'key: value'. A line that does not start with a known key continues the previous field.
"""
import re

RAW_SECTIONS = {'article', 'mistakes', 'review'}
REPEATABLE = {'objective', 'step', 'hint', 'choice', 'choice*', 'rubric', 'goal', 'deliverable', 'tutor'}
KNOWN = {'title', 'summary', 'objective', 'reading', 'problem', 'step', 'answer', 'check', 'nocheck', 'vars', 'domain',
         'tol', 'form', 'const', 'unit', 'lead', 'choice', 'choice*', 'hint', 'solution', 'rubric', 'overview', 'goal',
         'deliverable', 'safety', 'tutor', 'note'}
ITEM_TYPES = {'num', 'expr', 'list', 'tuple', 'mc', 'ms', 'self'}
FIELD_RE = re.compile(r'^([a-z]+\*?):(?:\s|$)(.*)$')


class FormatError(Exception):
    pass


def parse_sections(text):
    sections = []
    cur = None
    for lineno, line in enumerate(text.splitlines(), 1):
        if line.startswith('@') and re.match(r'^@[a-z]+(\s+[a-z]+)?\s*$', line.strip()):
            parts = line.strip()[1:].split()
            cur = {'kind': parts[0], 'arg': parts[1] if len(parts) > 1 else None, 'lines': [], 'line': lineno}
            sections.append(cur)
            continue
        if cur is None:
            if line.strip():
                raise FormatError(f'line {lineno}: text before the first @section')
            continue
        cur['lines'].append(line)
    return sections


def parse_fields(sec):
    fields = []  # list of (key, value)
    for line in sec['lines']:
        m = FIELD_RE.match(line)
        if m and m.group(1) in KNOWN:
            fields.append([m.group(1), m.group(2).strip()])
        elif fields:
            fields[-1][1] = fields[-1][1] + '\n' + line
        elif line.strip():
            raise FormatError(f"section @{sec['kind']} (line {sec['line']}): text before the first field: {line[:60]!r}")
    out = {}
    for k, v in fields:
        v = v.strip()
        if k in REPEATABLE:
            out.setdefault(k, []).append(v)
        else:
            if k in out:
                raise FormatError(f"section @{sec['kind']} (line {sec['line']}): field '{k}' appears twice")
            out[k] = v
    return out


def raw_body(sec):
    return '\n'.join(sec['lines']).strip('\n')


def build_item(sec):
    t = sec['arg']
    if t not in ITEM_TYPES:
        raise FormatError(f"line {sec['line']}: @{sec['kind']} needs a type: one of {sorted(ITEM_TYPES)}")
    f = parse_fields(sec)
    item = {'type': t, 'line': sec['line']}
    for k in ('prompt', 'answer', 'check', 'nocheck', 'domain', 'tol', 'form', 'unit', 'lead', 'solution', 'note'):
        if k in f:
            item[k] = f[k]
    # 'prompt' is parsed as continuation-safe: allow 'problem' alias
    if 'prompt' not in item and 'problem' in f:
        item['prompt'] = f['problem']
    if 'vars' in f:
        item['vars'] = [v.strip() for v in re.split(r'[,\s]+', f['vars']) if v.strip()]
    if 'const' in f:
        item['const'] = f['const'].lower() in ('yes', 'true', '1')
    item['hints'] = f.get('hint', [])
    if t in ('mc', 'ms'):
        choices, correct = [], []
        # preserve the original order of choices
        for line in sec['lines']:
            m = FIELD_RE.match(line)
            if m and m.group(1) in ('choice', 'choice*'):
                choices.append(m.group(2).strip())
                if m.group(1) == 'choice*':
                    correct.append(len(choices) - 1)
            elif m and m.group(1) in KNOWN:
                continue
        item['choices'] = choices
        item['answer'] = correct[0] if (t == 'mc' and len(correct) == 1) else correct
        item['_ncorrect'] = len(correct)
    if t == 'self':
        item['rubric'] = f.get('rubric', [])
    return item


# 'prompt' must be a known key too
KNOWN.add('prompt')


def parse_lesson(text):
    secs = parse_sections(text)
    lesson = {'examples': [], 'practice': [], 'quiz': [], 'mistakes': []}
    for s in secs:
        k = s['kind']
        if k == 'lesson':
            f = parse_fields(s)
            lesson['title'] = f.get('title', '')
            lesson['summary'] = f.get('summary', '')
            lesson['objectives'] = f.get('objective', [])
            if 'reading' in f:
                lesson['reading'] = f['reading']
        elif k == 'article':
            lesson['article'] = raw_body(s)
        elif k == 'example':
            f = parse_fields(s)
            ex = {'title': f.get('title', 'Worked example'), 'problem': f.get('problem', f.get('prompt', '')),
                  'steps': f.get('step', [])}
            if 'answer' in f:
                ex['answer'] = f['answer']
            lesson['examples'].append(ex)
        elif k == 'mistakes':
            lesson['mistakes'] = [re.sub(r'^\s*[-*]\s+', '', l).strip() for l in s['lines'] if l.strip()]
        elif k in ('practice', 'quiz'):
            lesson[k].append(build_item(s))
        else:
            raise FormatError(f"line {s['line']}: unknown section @{k} in a lesson file")
    return lesson


def parse_project(text):
    secs = parse_sections(text)
    proj = {'exam': []}
    for s in secs:
        k = s['kind']
        if k == 'project':
            f = parse_fields(s)
            proj['title'] = f.get('title', '')
            proj['overview'] = f.get('overview', '')
            proj['goals'] = f.get('goal', [])
            proj['steps'] = f.get('step', [])
            proj['deliverables'] = f.get('deliverable', [])
            proj['rubric'] = f.get('rubric', [])
            proj['tutor'] = f.get('tutor', [])
            if 'safety' in f:
                proj['safety'] = f['safety']
        elif k == 'review':
            proj['review'] = raw_body(s)
        elif k == 'exam':
            proj['exam'].append(build_item(s))
        else:
            raise FormatError(f"line {s['line']}: unknown section @{k} in project.txt")
    return proj
