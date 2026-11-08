/* ToE Learning Foundation — markdown-with-math rendering shared by the site and the content validator.
   protect(): pulls $...$ / $$...$$ out of text (skipping code) and leaves placeholders.
   renderMarkdown(): a small, safe markdown subset (headings, lists, tables, code, quotes, links, emphasis). */
(function (root) {
  'use strict';
  const PH = (i) => '\u0001' + i + '\u0002';

  function protect(src) {
    const maths = [];
    const codes = [];
    let s = String(src == null ? '' : src);
    // fenced code blocks first
    s = s.replace(/```([A-Za-z0-9_+-]*)\n([\s\S]*?)```/g, (m, lang, body) => {
      codes.push({ block: true, lang: lang, body: body.replace(/\n$/, '') });
      return '\u0003' + (codes.length - 1) + '\u0004';
    });
    s = s.replace(/`([^`\n]+)`/g, (m, body) => { codes.push({ block: false, body: body }); return '\u0003' + (codes.length - 1) + '\u0004'; });
    let out = '';
    let i = 0;
    while (i < s.length) {
      const c = s[i];
      if (c === '\\' && s[i + 1] === '$') { out += '$'; i += 2; continue; }
      if (c === '$') {
        const display = s[i + 1] === '$';
        const open = display ? 2 : 1;
        let j = i + open, found = -1;
        while (j < s.length) {
          if (s[j] === '\\') { j += 2; continue; }
          if (s[j] === '$') {
            if (display) { if (s[j + 1] === '$') { found = j; break; } }
            else { found = j; break; }
          }
          j++;
        }
        if (found < 0) { maths.push({ tex: s.slice(i + open), display: display, unclosed: true }); out += PH(maths.length - 1); break; }
        maths.push({ tex: s.slice(i + open, found), display: display });
        out += PH(maths.length - 1);
        i = found + open;
        continue;
      }
      out += c; i++;
    }
    return { text: out, maths: maths, codes: codes };
  }

  const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function inline(t, ctx) {
    t = esc(t);
    t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    t = t.replace(/(^|[^*\w])\*([^*\s][^*]*?)\*(?!\w)/g, '$1<em>$2</em>');
    t = t.replace(/(^|[\s(])_([^_\s][^_]*?)_(?=[\s).,;:!?]|$)/g, '$1<em>$2</em>');
    t = t.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
    return t;
  }

  function renderMarkdown(src, renderMath, opts) {
    opts = opts || {};
    const p = protect(src);
    const lines = p.text.split('\n');
    const html = [];
    let i = 0;
    const isBlank = (l) => !l || !l.trim();
    while (i < lines.length) {
      const line = lines[i];
      if (isBlank(line)) { i++; continue; }
      let m;
      if ((m = /^(#{2,4})\s+(.*)$/.exec(line))) {
        const level = Math.min(4, m[1].length + (opts.headingShift || 0));
        html.push('<h' + level + '>' + inline(m[2]) + '</h' + level + '>'); i++; continue;
      }
      if (/^\s*(---|\*\*\*)\s*$/.test(line)) { html.push('<hr>'); i++; continue; }
      if (/^\u0003\d+\u0004\s*$/.test(line.trim()) && p.codes[+line.trim().slice(1, -1)].block) {
        html.push(line.trim()); i++; continue;
      }
      if (/^\s*>\s?/.test(line)) {
        const buf = [];
        while (i < lines.length && /^\s*>\s?/.test(lines[i])) { buf.push(lines[i].replace(/^\s*>\s?/, '')); i++; }
        html.push('<blockquote>' + inline(buf.join(' ')) + '</blockquote>'); continue;
      }
      if (/^\s*\|.*\|\s*$/.test(line)) {
        const rows = [];
        while (i < lines.length && /^\s*\|.*\|\s*$/.test(lines[i])) { rows.push(lines[i].trim()); i++; }
        const cells = (r) => r.replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
        let out = '<div class="table-wrap"><table>';
        let body = rows;
        if (rows.length > 1 && /^\|?\s*:?-{2,}/.test(rows[1])) {
          out += '<thead><tr>' + cells(rows[0]).map((c) => '<th>' + inline(c) + '</th>').join('') + '</tr></thead>';
          body = rows.slice(2);
        }
        out += '<tbody>' + body.map((r) => '<tr>' + cells(r).map((c) => '<td>' + inline(c) + '</td>').join('') + '</tr>').join('') + '</tbody></table></div>';
        html.push(out); continue;
      }
      if (/^\s*([-*]|\d+[.)])\s+/.test(line)) {
        const ordered = /^\s*\d+[.)]\s+/.test(line);
        const items = [];
        while (i < lines.length && !isBlank(lines[i])) {
          const l = lines[i];
          if (/^\s*([-*]|\d+[.)])\s+/.test(l)) items.push(l.replace(/^\s*([-*]|\d+[.)])\s+/, ''));
          else if (items.length) items[items.length - 1] += ' ' + l.trim();
          i++;
          if (i < lines.length && isBlank(lines[i]) && i + 1 < lines.length && /^\s*([-*]|\d+[.)])\s+/.test(lines[i + 1])) i++;
        }
        const tag = ordered ? 'ol' : 'ul';
        html.push('<' + tag + '>' + items.map((it) => '<li>' + inline(it) + '</li>').join('') + '</' + tag + '>');
        continue;
      }
      const buf = [];
      const isCodeLine = (l) => /^\u0003\d+\u0004\s*$/.test(l.trim()) && p.codes[+l.trim().slice(1, -1)].block;
      while (i < lines.length && !isBlank(lines[i]) && !/^(#{2,4})\s/.test(lines[i]) && !/^\s*([-*]|\d+[.)])\s+/.test(lines[i]) && !/^\s*\|.*\|\s*$/.test(lines[i]) && !/^\s*>/.test(lines[i]) && !(buf.length && isCodeLine(lines[i]))) {
        buf.push(lines[i]); i++;
      }
      if (!buf.length) { buf.push(lines[i]); i++; }
      const para = buf.join('\n');
      // a paragraph that is only a display equation stays unwrapped
      if (/^\u0001\d+\u0002$/.test(para.trim()) && p.maths[+para.trim().slice(1, -1)].display) html.push(para.trim());
      else html.push('<p>' + inline(para).replace(/\n/g, ' ') + '</p>');
    }
    let out = html.join('\n');
    out = out.replace(/\u0003(\d+)\u0004/g, (m, k) => {
      const c = p.codes[+k];
      if (c.block) return '<pre class="code"><code' + (c.lang ? ' data-lang="' + esc(c.lang) + '"' : '') + '>' + esc(c.body) + '</code></pre>';
      return '<code>' + esc(c.body) + '</code>';
    });
    return placeMath(out, p, renderMath);
  }
  // inline math keeps following punctuation on the same line
  function placeMath(out, p, renderMath) {
    return out.replace(/\u0001(\d+)\u0002([.,;:!?)\]]*)/g, (m, k, punct) => {
      const mm = p.maths[+k];
      const html = renderMath(mm.tex, mm.display);
      return punct && !mm.display ? html + '\u2060' + punct : html + punct;
    });
  }

  // inline-only rendering (prompts, hints, choices): no block structure except line breaks
  function renderInline(src, renderMath) {
    const p = protect(src);
    let out = p.text.split(/\n{2,}/).map((para) => inline(para).replace(/\n/g, '<br>')).join('<br><br>');
    out = out.replace(/\u0003(\d+)\u0004/g, (m, k) => {
      const c = p.codes[+k];
      return c.block ? '<pre class="code"><code>' + esc(c.body) + '</code></pre>' : '<code>' + esc(c.body) + '</code>';
    });
    return placeMath(out, p, renderMath);
  }

  const api = { protect: protect, renderMarkdown: renderMarkdown, renderInline: renderInline, esc: esc };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.ToEText = api;
})(typeof window !== 'undefined' ? window : this);
