"""Parse ToE lesson source files (.txt) into dictionaries.

Format: sections start with a line beginning with '@' at column 0.
  @lesson            fields: title, summary, objective*, reading
  @article           raw markdown body
  @example           fields: title, problem, step*, answer
  @mistakes          raw body, one '- ' bullet per line
  @practice <type>   item fields (see README)
  @quiz <type>       same as practice, reserved for quizzes and tests
  @project           fields: title, overview, goal*, step*, material*, deliverable*, rubric*, safety, tutor*
  @review            raw markdown body
  @exam <type>       cumulative final-exam items (project.txt only)
Fields are 'key: value'. A line that does not start with a known key continues the previous field.
Text inside ``` fences is verbatim: it never starts a field or a section (so code may contain
'name: value' lines and @decorators). Code fields (starter, tests, model, stdin, stdout) hold one fenced block.
"""
import re

RAW_SECTIONS = {'article', 'mistakes', 'review'}
REPEATABLE = {'objective', 'step', 'hint', 'choice', 'choice*', 'rubric', 'goal', 'deliverable', 'tutor', 'material', 'accept', 'stdin', 'stdout'}
KNOWN = {'title', 'summary', 'objective', 'reading', 'problem', 'step', 'answer', 'check', 'nocheck', 'vars', 'domain',
         'tol', 'form', 'const', 'unit', 'lead', 'choice', 'choice*', 'hint', 'solution', 'rubric', 'overview', 'goal',
         'deliverable', 'safety', 'tutor', 'note', 'material', 'starter', 'tests', 'model', 'stdin', 'stdout', 'accept'}
CODE_FIELDS = ('starter', 'tests', 'model', 'stdin', 'stdout')
ITEM_TYPES = {'num', 'expr', 'list', 'tuple', 'mc', 'ms', 'self', 'code', 'text'}
FENCE_RE = re.compile(r'^\s*```')
FIELD_RE = re.compile(r'^([a-z]+\*?):(?:\s|$)(.*)$')


class FormatError(Exception):
    pass


def parse_sections(text):
    sections = []
    cur = None
    fence = False
    for lineno, line in enumerate(text.splitlines(), 1):
        if FENCE_RE.match(line):
            fence = not fence
        elif not fence and line.startswith('@') and re.match(r'^@[a-z]+(\s+[a-z]+)?\s*$', line.strip()):
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
    fence = False
    for line in sec['lines']:
        m = None if fence else FIELD_RE.match(line)
        if FENCE_RE.match(line) or (m and FENCE_RE.match(m.group(2))):
            fence = not fence
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


def unfence(v):
    """The text inside one ``` fenced block; a value without a fence is returned as it is."""
    lines = v.split('\n')
    if not lines or not FENCE_RE.match(lines[0]):
        return v
    body = []
    for line in lines[1:]:
        if FENCE_RE.match(line):
            break
        body.append(line)
    else:
        raise FormatError('a ``` code block is not closed')
    rest = lines[len(body) + 2:]
    if any(l.strip() for l in rest):
        raise FormatError('text after the closing ``` of a code field; each code field holds exactly one fenced block')
    return '\n'.join(body) + '\n'


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
    if t == 'code':
        for k in CODE_FIELDS:
            if k in f:
                try:
                    item[k] = [unfence(v) for v in f[k]] if k in ('stdin', 'stdout') else unfence(f[k])
                except FormatError as e:
                    raise FormatError(f"line {sec['line']}: field '{k}': {e}")
        ins, outs = item.pop('stdin', []), item.pop('stdout', [])
        if len(ins) > 1 or len(outs) > 1:
            if len(ins) != len(outs):
                raise FormatError(f"line {sec['line']}: give stdin: and stdout: in pairs (found {len(ins)} stdin and {len(outs)} stdout)")
            item['cases'] = [{'stdin': a, 'stdout': b} for a, b in zip(ins, outs)]
        if ins:
            item['stdin'] = ins[0]
        if outs:
            item['stdout'] = outs[0]
    elif any(k in f for k in CODE_FIELDS):
        raise FormatError(f"line {sec['line']}: fields {', '.join(k for k in CODE_FIELDS if k in f)} belong only in a code item")
    if t == 'text':
        try:
            item['answer'] = unfence(f.get('answer', '')).rstrip('\n') if f.get('answer', '').lstrip().startswith('```') else f.get('answer', '')
        except FormatError as e:
            raise FormatError(f"line {sec['line']}: field 'answer': {e}")
        item['accept'] = f.get('accept', [])
    elif 'accept' in f:
        raise FormatError(f"line {sec['line']}: accept: belongs only in a text item")
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
            proj['materials'] = f.get('material', [])
            if 'safety' in f:
                proj['safety'] = f['safety']
        elif k == 'review':
            proj['review'] = raw_body(s)
        elif k == 'exam':
            proj['exam'].append(build_item(s))
        else:
            raise FormatError(f"line {s['line']}: unknown section @{k} in project.txt")
    return proj
