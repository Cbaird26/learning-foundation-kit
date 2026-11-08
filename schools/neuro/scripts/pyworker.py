r"""Build the in-page Python runner: Brython 3.14 (BSD licence) plus the exercise harness, as one Web Worker script.

Output: /home/claude/neuro/build/pyworker.js
The site embeds this text in <script type="text/js-worker" id="pyworker"> and starts it from a Blob URL,
so Python runs offline and off the main thread; a run that takes too long is stopped by ending the worker.

Small fixes are applied to Brython at build time (each must match exactly once):
  1. keep "use strict" as the first statement and preset brython_path (a Blob worker has no usable URL);
  2. exec(compile(src, ...)) re-parses from the source text, because compile() already consumed the AST
     (otherwise docstrings vanish and annotations crash);
  3. Class[...] uses the metaclass __getitem__ first, as CPython does (Enum['NAME'] needs it);
  4. collections.deque(..., maxlen=n) works;
  5. a stray debug print in annotationlib is removed;
  6. str.split() and str.rsplit() follow CPython (Brython returned [''] for ''.split() and failed on rsplit());
  7. frozenset - set works (Brython refused a frozenset on the left of "-");
  8. re: replacement templates follow CPython (\g<name>, \g<n>, octal and escapes), [\b] means backspace,
     Match.lastindex and .lastgroup, Pattern.pattern, .flags and .groups exist, and re.error (PatternError)
     has its message, .msg and .pos;
  9. json is CPython's own pure-Python json package (vendor/cpython-json, PSF licence) instead of Brython's
     JavaScript version, so invalid input raises json.JSONDecodeError (a ValueError) with CPython's messages,
     NaN and Infinity parse, and json.decoder / json.encoder / json.scanner exist;
 10. importing asyncio (as unittest.mock does) no longer prints a notice, random.seed() splits large integers
     and str seeds as CPython does, and the time module's functions do not bind as methods (so logging's
     %(asctime)s works).
"""
import json, os, re

ROOT = '/home/claude/neuro'
VENDOR = f'{ROOT}/vendor/brython'
OUT = f'{ROOT}/build/pyworker.js'


def sub_once(s, old, new, label):
    n = s.count(old)
    assert n == 1, f'patch "{label}": expected 1 match, found {n}'
    return s.replace(old, new)


def patched_brython():
    s = open(f'{VENDOR}/brython.js', encoding='utf-8').read()
    us = '"use strict";'
    assert s.index(us) < 400
    s = s.replace(us, us + "\nself.__BRYTHON__ = {brython_path: 'file:///brython/'};", 1)
    s = sub_once(s, "if($B.exact_type(src,$B.code)){filename=src.filename}else if",
                 "if($B.exact_type(src,$B.code)){filename=src.filename\n"
                 "if(typeof src.source=='string' && src.mode=='exec' && mode=='exec'){"
                 "src=src.source.replace(/\\r\\n/g,'\\n').replace(/\\r/g,'\\n')}}else if",
                 'exec re-parses code objects')
    s = sub_once(s, "if($B.is_type(obj)){if(! Array.isArray(item)){item=$B.fast_tuple([item])}",
                 "if($B.is_type(obj)){if(obj!==_b_.type){var _mgi=$B.search_in_mro($B.get_class(obj),'__getitem__',$B.NULL)\n"
                 "if(_mgi!==$B.NULL){return $B.$call(_mgi,obj,item)}}\n"
                 "if(! Array.isArray(item)){item=$B.fast_tuple([item])}",
                 'metaclass __getitem__')
    # 4. str.split / str.rsplit: Brython 3.14.3 returns [''] for ''.split() and '   '.split(), and rsplit() with no
    #    separator raises an internal error; replace both with implementations that follow CPython exactly
    a = s.index('str_funcs.rsplit=function(){')
    b = s.index('return $B.$list(rev_res)}', a) + len('return $B.$list(rev_res)}')
    assert s.count('str_funcs.rsplit=function(){') == 1
    s = s[:a] + STR_RSPLIT + s[b:]
    a = s.index('str_funcs.split=function(self,sep,maxsplit){')
    end_marker = 'if(self instanceof String){res=res.map($B.String)}\nreturn $B.$list(res)}'
    b = s.index(end_marker, a) + len(end_marker)
    assert s.count('str_funcs.split=function(self,sep,maxsplit){') == 1 and b - a < 2000, b - a
    s = s[:a] + STR_SPLIT + s[b:]
    # bound_method.__doc__ gave the method type's docstring instead of the function's (unittest prints a test's
    # docstring, so every test without one was described as "Create a bound instance method object.")
    s = sub_once(s, "$B.method.tp_getattro=function(self,attr){var tp=$B.get_class(self)\n",
                 "$B.method.tp_getattro=function(self,attr){var tp=$B.get_class(self)\n"
                 "if(attr=='__doc__'){return $B.object_getattribute(self.im_func,$B.get_class(self.im_func),attr)}\n",
                 'method __doc__')
    # 7. frozenset - set: set.nb_subtract (shared with frozenset) required its left operand to be a set
    s = sub_once(s, "_b_.set.nb_subtract=function(self,other){\nif(! $B.$isinstance(self,_b_.set)||",
                 "_b_.set.nb_subtract=function(self,other){\nif(! $B.$isinstance(self,[set,frozenset])||",
                 'frozenset - set')
    # 8. round(): float rounding to n digits multiplied by 10**n first, so it was not correctly rounded
    #    (round(2.675, 2) gave 2.68; CPython rounds the exact binary value half to even and gives 2.67), and
    #    round(int, negative ndigits) raised an internal BigInt error; both now follow CPython exactly
    a = s.index('function float_round(x,ndigits){')
    end = 'if(! isFinite(z)){$B.RAISE(_b_.OverflowError,"overflow occurred during round")}\nreturn fast_float(z)}'
    b = s.index(end, a) + len(end)
    assert s.count('function float_round(x,ndigits){') == 1 and b - a < 2500, b - a
    s = s[:a] + FLOAT_ROUND + s[b:]
    a = s.index('var mult=Math.pow(10,n),x=arg*mult,floor=Math.floor(x),diff=Math.abs(x-floor),res')
    end = 'return $B.$call(klass,res)}}'
    b = s.index(end, a) + len(end)
    assert s.count('var mult=Math.pow(10,n),x=arg*mult') == 1 and b - a < 800, b - a
    s = s[:a] + INT_ROUND + s[b:]
    # 9. float formatting with 'f', 'F' and '%': format(2.5, '.0f') gave '3' (CPython rounds the exact value half
    #    to even: '2'), '.0%' dropped the percent sign, negative values that round to zero lost their '-', -0.0 lost
    #    its sign, numbers from 1e21 up printed in exponent form, '+' was not added to zero, and ',' grouping put a
    #    comma after the minus sign of a three-digit number ('-,123.00'). printf-style '%.2f' shared the rounding
    #    helper. All now follow CPython exactly.
    s = sub_once(s, "var roundDownToFixed=$B.roundDownToFixed=function(v,d){if(d==0 && v.toString().indexOf('e')>-1){",
                 "var roundDownToFixed=$B.roundDownToFixed=function(v,d){return $B.exact_fixed(v,d)\n"
                 "if(d==0 && v.toString().indexOf('e')>-1){", 'exact printf f')
    s = sub_once(s, 'if(fmt.type=="%"){value*=100}\nif(fmt.type=="e"){let res=value.toExponential(fmt.precision)',
                 'if(fmt.type=="%"){value*=100}\n'
                 'if(fmt.precision!==undefined && fmt.type!==undefined && (fmt.type=="%"||fmt.type=="f"||fmt.type=="F")){'
                 'var fres=$B.exact_fixed(value,fmt.precision)\n'
                 'if(Object.is(value,-0)){fres="-"+fres}\n'
                 'if(Number(fmt.precision)==0 && fmt.alternate){fres+="."}\n'
                 'if((fmt.sign==" "||fmt.sign=="+") && !fres.startsWith("-")){fres=fmt.sign+fres}\n'
                 'if(fmt.type=="%"){fres+="%"}\n'
                 'return fres}\n'
                 'if(fmt.type=="e"){let res=value.toExponential(fmt.precision)', 'exact format f')
    s = sub_once(s, "var raw=pf.split('.'),_int=raw[0]\n"
                    "if(fmt.comma){var len=_int.length,nb=Math.ceil(_int.length/3),chunks=[]\n"
                    "for(var i=0;i < nb;i++){chunks.push(_int.substring(len-3*i-3,len-3*i))}\n"
                    "chunks.reverse()\n"
                    "raw[0]=chunks.join(\",\")}",
                 "var raw=pf.split('.'),_int=raw[0],_sg=''\n"
                 "if(/^[-+ ]/.test(_int)){_sg=_int[0];_int=_int.substr(1)}\n"
                 "if(fmt.comma){var len=_int.length,nb=Math.ceil(_int.length/3),chunks=[]\n"
                 "for(var i=0;i < nb;i++){chunks.push(_int.substring(Math.max(0,len-3*i-3),len-3*i))}\n"
                 "chunks.reverse()\n"
                 "raw[0]=_sg+chunks.join(fmt.grouping_option||\",\")}", 'float comma grouping')
    # 'e' format: JS toExponential rounds exact ties up (format(1.25, '.1e') gave '1.3e+00', CPython '1.2e+00')
    #    and dropped the sign of -0.0
    s = sub_once(s, 'if(fmt.type=="e"){let res=value.toExponential(fmt.precision)',
                 'if(fmt.type=="e"||fmt.type=="E"){let eres=$B.exact_exp(value,fmt.precision)\n'
                 'if((fmt.sign==" "||fmt.sign=="+") && !eres.startsWith("-")){eres=fmt.sign+eres}\n'
                 'if(fmt.type=="E"){eres=eres.toUpperCase()}\n'
                 'return eres}\n'
                 'if(false){let res=value.toExponential(fmt.precision)', 'exact format e')
    # 'g': the exponent was taken before rounding to the requested precision (format(9.995, '.1g') gave '10',
    #    CPython '1e+01'), and precision 0 is treated as 1; 'n' (with the C locale, as CPython uses by default)
    #    is the same as 'g', but Brython printed things like '1.23457e+5'
    s = sub_once(s, 'else if(fmt.type && fmt.type.toLowerCase()=="g"){let exp_fmt=preformat(self,{type:"e"}).split("e"),exp=parseInt(exp_fmt[1])',
                 'else if(fmt.type && fmt.type.toLowerCase()=="g"){let exp_fmt=preformat(self,{type:"e",precision:Math.max(Number(fmt.precision),1)-1}).split("e"),exp=parseInt(exp_fmt[1])',
                 'g exponent after rounding')
    s = sub_once(s, 'if(fmt.precision !==undefined){\nlet prec=fmt.precision\nif(prec==0){return Math.round(value)+""}',
                 'if(fmt.precision !==undefined){\nif(fmt.type && fmt.type.toLowerCase()=="g" && Number(fmt.precision)==0){fmt.precision=1}\n'
                 'let prec=fmt.precision\nif(prec==0){return Math.round(value)+""}', 'g precision 0')
    s = sub_once(s, 'function preformat(self,fmt){var value=self.value\nif(fmt.empty){return _b_.str.$factory(self)}',
                 'function preformat(self,fmt){var value=self.value\nif(fmt.empty){return _b_.str.$factory(self)}\n'
                 'if(fmt.type=="n"){fmt.type="g"}', 'float n format')
    # printf-style '%+.2f' % -0.0 gave '+-0.00'
    s = sub_once(s, 'var format_sign=function(val,flags){if(flags.sign){if(val >=0 ||isNaN(val)||val===Number.POSITIVE_INFINITY){return "+"}}else if(flags.space){if(val >=0 ||isNaN(val)){return " "}}',
                 'var format_sign=function(val,flags){if(Object.is(val,-0)){return ""}if(flags.sign){if(val >=0 ||isNaN(val)||val===Number.POSITIVE_INFINITY){return "+"}}else if(flags.space){if(val >=0 ||isNaN(val)){return " "}}',
                 'printf sign of -0.0')
    return s


# Python's whitespace for str.split(): what str.isspace() accepts
_U = lambda h: chr(92) + 'u' + h  # written this way so no editor or transport turns the escapes into characters
PY_WS = '/[' + r'\t\n\v\f\r\x1c-\x1f \x85\xa0' + _U('1680') + _U('2000') + '-' + _U('200a') + _U('2028') + _U('2029') + _U('202f') + _U('205f') + _U('3000') + ']/'
STR_SPLIT = (r'''str_funcs.split=function(){var $=$B.args("split",3,{self:null,sep:null,maxsplit:null},arguments,{sep:_b_.None,maxsplit:-1},null,null)
var s=to_string($.self),sep=$.sep,maxsplit=$.maxsplit,res=[],WS=''' + PY_WS + r'''
if($B.is_big_int(maxsplit)){maxsplit=Number($B.int_value(maxsplit))}
if(sep===_b_.None){var i=0,n=s.length
while(true){while(i < n && WS.test(s[i])){i++}
if(i >= n){break}
if(maxsplit >= 0 && res.length==maxsplit){res.push(s.slice(i));break}
var j=i
while(j < n && ! WS.test(s[j])){j++}
res.push(s.slice(i,j));i=j}}else{
sep=to_string(sep)
if(sep.length==0){$B.RAISE(_b_.ValueError,"empty separator")}
var start=0,pos
while((maxsplit < 0 ||res.length < maxsplit)&&(pos=s.indexOf(sep,start))!=-1){res.push(s.slice(start,pos));start=pos+sep.length}
res.push(s.slice(start))}
if(s instanceof String){res=res.map($B.String)}
return $B.$list(res)}''')
FLOAT_ROUND = r'''function float_round(x,ndigits){function overflow(){$B.RAISE(_b_.OverflowError,"cannot convert float infinity to integer")}
var no_digits=ndigits===_b_.None
if(isnan(x)){if(ndigits===_b_.None){$B.RAISE(_b_.ValueError,"cannot convert float NaN to integer")}
return NAN}else if(isninf(x)){return ndigits===_b_.None ? overflow():NINF}else if(isinf(x)){return ndigits===_b_.None ? overflow():INF}
x=float_value(x)
ndigits=ndigits===_b_.None ? 0 :$B.int_value(ndigits)
if(typeof ndigits=="bigint"){ndigits=ndigits>400n ? 400 :(ndigits<-400n ? -400 :Number(ndigits))}
if(ndigits==0){var res=Math.round(x.value)
if(Math.abs(x.value-res)==0.5){
if(res % 2){res=res-1}}
if(no_digits){
return res}
return $B.fast_float(res)}
var v=x.value
if(v==0){return x}
if(ndigits>323){return x}
if(ndigits<-308){return fast_float(0*v)}
var r=$B.exact_round_decimal(v,ndigits)
if(!isFinite(r)){$B.RAISE(_b_.OverflowError,"rounded value too large to represent")}
return fast_float(r)}
$B.exact_round_decimal=function(v,nd){
var neg=v<0,a=Math.abs(v),dv=new DataView(new ArrayBuffer(8))
dv.setFloat64(0,a)
var hi=dv.getUint32(0),lo=dv.getUint32(4),ex=(hi>>>20)&0x7ff
var mant=(BigInt(hi&0xfffff)<<32n)|BigInt(lo),k
if(ex==0){k=-1074}else{mant=mant|(1n<<52n);k=ex-1075}
var D,sc
if(k>=0){D=mant<<BigInt(k);sc=0}else{D=mant*(5n**BigInt(-k));sc=-k}
var drop=sc-nd
if(drop<=0){return v}
var p=10n**BigInt(drop),q=D/p,twice=2n*(D%p)
if(twice>p||(twice==p&&(q&1n)==1n)){q=q+1n}
var res=Number(q.toString()+'e'+(-nd))
return neg ? -res :res}
$B.exact_fixed=function(v,prec){
if(!isFinite(v)){return isNaN(v) ? 'nan' :(v > 0 ? 'inf' :'-inf')}
prec=Number(prec)
var neg=v<0,a=Math.abs(v)
if(a==0){return prec > 0 ? '0.'+'0'.repeat(prec) :'0'}
var dv=new DataView(new ArrayBuffer(8))
dv.setFloat64(0,a)
var hi=dv.getUint32(0),lo=dv.getUint32(4),ex=(hi>>>20)&0x7ff
var mant=(BigInt(hi&0xfffff)<<32n)|BigInt(lo),k
if(ex==0){k=-1074}else{mant=mant|(1n<<52n);k=ex-1075}
var D,sc
if(k>=0){D=mant<<BigInt(k);sc=0}else{D=mant*(5n**BigInt(-k));sc=-k}
var q
if(sc<=prec){q=D*(10n**BigInt(prec-sc))}else{
var p=10n**BigInt(sc-prec),twice
q=D/p
twice=2n*(D%p)
if(twice>p||(twice==p&&(q&1n)==1n)){q=q+1n}}
var t=q.toString()
if(prec > 0){if(t.length<=prec){t='0'.repeat(prec-t.length+1)+t}
t=t.slice(0,t.length-prec)+'.'+t.slice(t.length-prec)}
return (neg ? '-' :'')+t}
$B.exact_exp=function(v,prec){
if(!isFinite(v)){return isNaN(v) ? 'nan' :(v > 0 ? 'inf' :'-inf')}
prec=Number(prec)
var neg=v<0||Object.is(v,-0),a=Math.abs(v)
if(a==0){return (neg ? '-' :'')+'0'+(prec > 0 ? '.'+'0'.repeat(prec) :'')+'e+00'}
var dv=new DataView(new ArrayBuffer(8))
dv.setFloat64(0,a)
var hi=dv.getUint32(0),lo=dv.getUint32(4),ex=(hi>>>20)&0x7ff
var mant=(BigInt(hi&0xfffff)<<32n)|BigInt(lo),k
if(ex==0){k=-1074}else{mant=mant|(1n<<52n);k=ex-1075}
var D,sc
if(k>=0){D=mant<<BigInt(k);sc=0}else{D=mant*(5n**BigInt(-k));sc=-k}
var ds=D.toString(),L=ds.length,e10=L-1-sc,drop=L-(prec+1),q
if(drop > 0){var p=10n**BigInt(drop),twice
q=D/p
twice=2n*(D%p)
if(twice>p||(twice==p&&(q&1n)==1n)){q=q+1n}
if(q.toString().length > prec+1){q=q/10n;e10+=1}}else{q=D*(10n**BigInt(-drop))}
var t=q.toString(),m=t[0]+(prec > 0 ? '.'+t.slice(1) :''),ae=Math.abs(e10)
return (neg ? '-' :'')+m+'e'+(e10 < 0 ? '-' :'+')+(ae < 10 ? '0'+ae :''+ae)}
'''

INT_ROUND = r'''var iv=$B.int_value(arg)
if($.ndigits===None){return iv}
var nd=$B.int_value(n)
if(typeof nd=="bigint"){nd=nd<-4000n ? -4000 :Number(nd)}
if(nd>=0){return iv}
var big=$B.to_bigint(arg),p=10n**BigInt(-nd),r=((big%p)+p)%p,q=(big-r)/p,twice=2n*r
if(twice>p||(twice==p&&((q%2n)+2n)%2n==1n)){q=q+1n}
return _b_.int.$int_or_long(q*p)}'''

STR_RSPLIT = (r'''str_funcs.rsplit=function(){var $=$B.args("rsplit",3,{self:null,sep:null,maxsplit:null},arguments,{sep:_b_.None,maxsplit:-1},null,null)
var s=to_string($.self),sep=$.sep,maxsplit=$.maxsplit,res=[],WS=''' + PY_WS + r'''
if($B.is_big_int(maxsplit)){maxsplit=Number($B.int_value(maxsplit))}
if(sep===_b_.None){var j=s.length
while(true){while(j > 0 && WS.test(s[j-1])){j--}
if(j <= 0){break}
if(maxsplit >= 0 && res.length==maxsplit){res.push(s.slice(0,j));break}
var i=j
while(i > 0 && ! WS.test(s[i-1])){i--}
res.push(s.slice(i,j));j=i}}else{
sep=to_string(sep)
if(sep.length==0){$B.RAISE(_b_.ValueError,"empty separator")}
var end=s.length,pos
while((maxsplit < 0 ||res.length < maxsplit)&& end-sep.length >= 0 &&(pos=s.lastIndexOf(sep,end-sep.length))!=-1){res.push(s.slice(pos+sep.length,end));end=pos}
res.push(s.slice(0,end))}
res.reverse()
if(s instanceof String){res=res.map($B.String)}
return $B.$list(res)}''')


RE_TRANSFORM_REPL = r'''function transform_repl(data, pattern) {
    // Parse a replacement template as CPython's re._parser.parse_template does: \g<name>, \g<number>,
    // \number (one or two digits; three octal digits make an octal escape), \0oo, the escapes
    // \a \b \f \n \r \t \v \\, an error for other escaped ASCII letters, and any other escaped
    // character kept with its backslash. A group that took no part in the match gives ''.
    var so = data.repl,
        cps = so.codepoints,
        groups = (pattern && pattern.groups) || {},
        parts = [],
        lit = '',
        n = cps.length,
        i = 0
    var ESC = {a: '\x07', b: '\b', f: '\f', n: '\n', r: '\r', t: '\t', v: '\v'}
    ESC['\\'] = '\\'
    function ch(k) { return String.fromCodePoint(cps[k]) }
    function is_digit(k) { return k < n && cps[k] >= 48 && cps[k] <= 57 }
    function is_oct(k) { return k < n && cps[k] >= 48 && cps[k] <= 55 }
    function is_identifier(name) {
        for (var k = 0; k < name.length; k++) {
            var c = name.charCodeAt(k)
            var ok = c == 95 || (c >= 65 && c <= 90) || (c >= 97 && c <= 122) || c > 127 ||
                (k > 0 && c >= 48 && c <= 57)
            if (! ok) { return false }
        }
        return name.length > 0
    }
    function addgroup(num, pos) {
        if (num != 0 && groups[num] === undefined) {
            fail('invalid group reference ' + num, pos)
        }
        parts.push(lit, num)
        lit = ''
    }
    while (i < n) {
        var c = ch(i)
        if (c != '\\') {
            lit += c
            i++
            continue
        }
        if (i + 1 >= n) {
            fail('bad escape (end of pattern)', i)
        }
        var d = ch(i + 1)
        if (d == 'g') {
            if (i + 2 >= n || cps[i + 2] != 60) {
                fail('missing <', i + 2)
            }
            var j = i + 3, name = ''
            while (j < n && cps[j] != 62) {
                name += ch(j)
                j++
            }
            if (j >= n) {
                fail('missing >, unterminated name', i + 3)
            }
            if (name.length == 0) {
                fail('missing group name', i + 3)
            }
            var num
            if (/^[0-9]+$/.test(name)) {
                num = parseInt(name)
            } else if (! is_identifier(name)) {
                fail("bad character in group name '" + name + "'", i + 3)
            } else if (groups[name] === undefined) {
                $B.RAISE(_b_.IndexError, "unknown group name '" + name + "'")
            } else {
                num = groups[name].num
            }
            addgroup(num, i + 3)
            i = j + 1
        } else if (d == '0') {
            var k = i + 2, oct = '0'
            while (k < i + 4 && is_oct(k)) {
                oct += ch(k)
                k++
            }
            lit += String.fromCharCode(parseInt(oct, 8) & 0xff)
            i = k
        } else if (d >= '1' && d <= '9') {
            var k = i + 2, digits = d
            if (is_digit(k)) {
                digits += ch(k)
                k++
                if (d <= '7' && digits[1] <= '7' && is_oct(k)) {
                    digits += ch(k)
                    k++
                    var v = parseInt(digits, 8)
                    if (v > 255) {
                        fail('octal escape value \\' + digits + ' outside of range 0-0o377', i)
                    }
                    lit += String.fromCharCode(v)
                    i = k
                    continue
                }
            }
            addgroup(parseInt(digits), i + 1)
            i = k
        } else if (ESC[d] !== undefined) {
            lit += ESC[d]
            i += 2
        } else if (/[A-Za-z]/.test(d)) {
            fail('bad escape \\' + d, i)
        } else {
            lit += '\\' + d
            i += 2
        }
    }
    parts.push(lit)
    data.repl = function(bmo) {
        var mo = bmo.mo,
            s = mo.string,
            mgroups = mo.$groups,
            is_bytes = s.type == 'bytes',
            res = parts[0]
        for (var p = 1; p < parts.length; p += 2) {
            var num = parts[p], x
            if (num == 0) {
                x = s.substring(mo.start, mo.end)
            } else {
                var g = mgroups[num]
                x = g === undefined ? '' : s.substring(g.start, g.end)
            }
            if (is_bytes && x !== '') {
                x = $B.bytes_decode(x, 'latin-1')
            }
            res += x + parts[p + 1]
        }
        return res
    }
    data.repl1 = parts.length == 1 ? parts[0] : undefined
    return data
}

'''

RE_ERROR_ATTRS = r'''error.tp_funcs = error.tp_funcs || {}
error.tp_getset = []
;['msg', 'pattern', 'pos', 'lineno', 'colno'].forEach(function(attr) {
    error.tp_funcs[attr + '_get'] = function(self) {
        var v = self[attr]
        return v === undefined ? _b_.None : v
    }
    error.tp_funcs[attr + '_set'] = function(self, value) {
        self[attr] = value
    }
    error.tp_getset.push(attr)
})
$B.set_func_names(error, "re")
$B.finalize_type(error)'''

RE_MATCH_GETSET = r'''MatchObject_funcs.lastindex_get = function(self) {
    var last = self.mo.$groups.$last
    if (last === undefined || last.length == 0) {
        return _b_.None
    }
    return parseInt($last(last))
}
MatchObject_funcs.lastindex_set = _b_.None
MatchObject_funcs.lastgroup_get = function(self) {
    var lastindex = MatchObject_funcs.lastindex_get(self)
    if (lastindex === _b_.None) {
        return _b_.None
    }
    var group = self.mo.node.$groups[lastindex],
        name = group && group.item ? group.item.name : undefined
    return name === undefined ? _b_.None : name
}
MatchObject_funcs.lastgroup_set = _b_.None
MatchObject_funcs.regs_get = function(self) {
    var res = [$B.fast_tuple([self.mo.start, self.mo.end])]
    for (var group_num in self.mo.node.$groups) {
        if (isFinite(group_num)) {
            var span = self.mo.$groups[group_num]
            res.push($B.fast_tuple(span === undefined ? [-1, -1] : [span.start, span.end]))
        }
    }
    return $B.fast_tuple(res)
}
MatchObject_funcs.re_get = function(self) {
    var n = self.mo.node
    while (n.parent) {
        n = n.parent
    }
    var flags = n.flags
    if (typeof flags == 'number') {
        flags = Flag.$factory(flags)
    }
    return Pattern.$factory({node: n, groups: n.$groups, flags, original_flags: flags,
        text: n.pattern, type: self.mo.string.type, fixed_length: n.fixed_length()})
}
MatchObject_funcs.re_set = _b_.None
MatchObject_funcs.pos_get = function(self) {
    return self.mo.pos !== undefined ? self.mo.pos : 0
}
MatchObject_funcs.pos_set = _b_.None
MatchObject_funcs.endpos_get = function(self) {
    return self.mo.endpos !== undefined ? self.mo.endpos : self.mo.string.length
}
MatchObject_funcs.endpos_set = _b_.None
MatchObject.tp_getset = ["regs", "string", "lastindex", "lastgroup", "re", "pos", "endpos"]'''

RE_PATTERN_SUBN = r'''Pattern_funcs.subn = function() {
    var $ = $B.args("subn", 4,
                {self: null, repl: null, string: null, count: null},
                arguments, {count: 0})
    var data = prepare({string: $.string})
    if ($.self.$pattern.type != data.string.type) {
        $B.RAISE(_b_.TypeError, "not the same type for pattern " +
            "and string")
    }
    return module.subn($.self, $.repl, $.string, $.count)
}

Pattern.tp_methods = ['''

RE_MODULE_SUBN = r'''    subn: function() {
        var $ = $B.args("subn", 5,
                {pattern: null, repl: null, string: null, count: null, flags: null},
                arguments, {count: 0, flags: no_flag})
        var pattern = $.pattern,
            repl = $.repl,
            data
        check_pattern_flags(pattern, $.flags)
        if (! $B.exact_type(pattern, Pattern)) {
            data = prepare({pattern, string: $.string})
            pattern = compile(data.pattern, $.flags)
        } else {
            data = prepare({string: $.string})
            pattern = pattern.$pattern
        }
        if (typeof repl != "function") {
            repl = transform_repl(prepare({repl}), pattern).repl
        }
        return $B.fast_tuple(subn(pattern, repl, data.string, $.count, $.flags))
    }
'''

RE_FLAG_COMPARE = r'''function flag_operand(x) {
    if ($B.$isinstance(x, Flag)) {
        return x.value
    }
    if (typeof x == "number" || typeof x == "boolean") {
        return Number(x)
    }
    return null
}

Flag.tp_richcompare = function(self, other, op) {
    var a = flag_operand(self), b = flag_operand(other)
    if (a === null || b === null) {
        return _b_.NotImplemented
    }
    switch (op) {
        case '__eq__': return a == b
        case '__ne__': return a != b
        case '__lt__': return a < b
        case '__le__': return a <= b
        case '__gt__': return a > b
        case '__ge__': return a >= b
    }
    return _b_.NotImplemented
}

Flag.tp_hash = function(self) {
    return self.value
}

'''

RE_FLAG_OPS = r'''Flag.nb_and = function(self, other) {
    var a = flag_operand(self), b = flag_operand(other)
    return (a === null || b === null) ? _b_.NotImplemented : Flag.$factory(a & b)
}

Flag.nb_or = function(self, other) {
    var a = flag_operand(self), b = flag_operand(other)
    return (a === null || b === null) ? _b_.NotImplemented : Flag.$factory(a | b)
}

Flag.nb_xor = function(self, other) {
    var a = flag_operand(self), b = flag_operand(other)
    return (a === null || b === null) ? _b_.NotImplemented : Flag.$factory(a ^ b)
}

'''

RE_FLAG_VALUE = r'''Flag.tp_funcs = Flag.tp_funcs || {}
Flag.tp_funcs.value_get = function(self) {
    return self.value
}
Flag.tp_funcs.value_set = _b_.None
Flag.tp_getset = ["value"]
$B.set_func_names(Flag, "re")
$B.finalize_type(Flag)'''

RE_PATTERN_GETSET = r'''Pattern_funcs.pattern_get = function(self) {
    return self.pattern
}
Pattern_funcs.pattern_set = _b_.None
Pattern_funcs.flags_get = function(self) {
    var f = self.flags,
        v = (f && f.value !== undefined) ? f.value : (typeof f == 'number' ? f : 0)
    if (self.$pattern && self.$pattern.type == 'str' && ! (v & 256)) {
        v |= 32  // re.UNICODE, as CPython reports for str patterns
    }
    return v
}
Pattern_funcs.flags_set = _b_.None
Pattern_funcs.groups_get = function(self) {
    return self.groups
}
Pattern_funcs.groups_set = _b_.None
Pattern.tp_getset = ["groupindex", "pattern", "flags", "groups"]'''


def patched_re(s):
    """Fixes to Brython's regular-expression engine (python_re.js)."""
    # [\b] inside a set is backspace: escaped_char returned the string '\b', whose length (1) made the
    # parser read the "b" again as a literal
    s = sub_once(s, "        return '\\b'\n    }\n    if (character_classes[key]",
                 "        return 8\n    }\n    if (character_classes[key]", 're [\\b]')
    a = s.index('function transform_repl(data, pattern) {')
    b = s.index('function Flag_eq(self, other) {')
    assert s.count('function transform_repl(data, pattern) {') == 1 and 0 < b - a < 4000, b - a
    s = s[:a] + RE_TRANSFORM_REPL + s[b:]
    s = sub_once(s, "        var data1 = transform_repl({repl}, pattern)\n        repl1 = data1.repl1\n",
                 "        var data1 = transform_repl({repl}, pattern)\n        repl = data1.repl\n", 're subn template')
    s = sub_once(s, 'MatchObject.tp_getset = ["regs", "string"]', RE_MATCH_GETSET, 're Match getset')
    s = sub_once(s, 'MatchObject.tp_members = [\n    ["endpos", $B.TYPES.OBJECT, "endpos", 1],\n'
                 '    ["pos", $B.TYPES.OBJECT, "pos", 1],\n    ["re", $B.TYPES.OBJECT, "re", 1]\n]\n', '',
                 're Match members')
    # split() with a compiled pattern sliced the str at code-point positions as if they were UTF-16 positions
    s = sub_once(s, "        } else {\n            data = {pattern, string}\n        }\n"
                 "        for (var bmo of module.finditer(pattern, $.string).js_gen) {",
                 "        } else {\n            data = prepare({string})\n            data.pattern = pattern\n        }\n"
                 "        for (var bmo of module.finditer(pattern, $.string).js_gen) {", 're split compiled')
    s = sub_once(s, 'Pattern.tp_getset = ["groupindex"]', RE_PATTERN_GETSET, 're Pattern getset')
    s = sub_once(s, 'var error = $B.make_type("error", [_b_.Exception])',
                 'var error = $B.make_type("PatternError", [_b_.Exception])', 're PatternError name')
    s = sub_once(s, '    error: error,\n', '    error: error,\n    PatternError: error,\n', 're PatternError export')
    s = sub_once(s, '$B.set_func_names(error, "re")\n$B.finalize_type(error)', RE_ERROR_ATTRS, 're error attributes')
    s = sub_once(s, "    throw err\n}\n\nfunction warn(klass, message, pos, text) {",
                 "    var full = message\n"
                 "    if (typeof pos == 'number') { full += ' at position ' + pos }\n"
                 "    if (err.lineno > 1) { full += ' (line ' + err.lineno + ', column ' + err.colno + ')' }\n"
                 "    err.args = $B.fast_tuple([full])\n"
                 "    throw err\n}\n\nfunction warn(klass, message, pos, text) {", 're error message')
    # sub() on a string with characters beyond U+FFFF: the text after the last match was taken from the
    # UTF-16 string at a code-point index, repeating or losing characters
    s = sub_once(s, "    if (string.is_string) {\n        res += string.string.substr(pos)\n    } else {",
                 "    if (string.is_string) {\n        res += string.substring(pos)\n    } else {", 're sub tail')
    # Pattern.subn() was missing, and re.subn() failed when the replacement was a function
    s = sub_once(s, 'Pattern.tp_methods = [', RE_PATTERN_SUBN, 're Pattern.subn')
    s = sub_once(s, '"finditer", "fullmatch", "match", "scanner", "search", "split", "sub"\n]',
                 '"finditer", "fullmatch", "match", "scanner", "search", "split", "sub", "subn"\n]', 're subn method')
    a = s.index('    subn: function() {')
    b = s.index('flags))\n    }\n', a) + len('flags))\n    }\n')
    assert s.count('    subn: function() {') == 1 and b - a < 1200, b - a
    s = s[:a] + RE_MODULE_SUBN + s[b:]
    # Pattern.groupindex showed an internal "ob_type" entry
    s = sub_once(s, "    var res = $B.empty_dict()\n    res.ob_type = GroupIndex\n", "    var res = $B.empty_dict()\n",
                 're groupindex')
    # re.I == 2 and other comparisons, hashing, .value, and int | flag
    a = s.index('Flag.tp_richcompare = function(self, other, op) {')
    b = s.index('Flag.tp_new = function(cls, args, kw) {')
    assert 0 < b - a < 800, b - a
    s = s[:a] + RE_FLAG_COMPARE + s[b:]
    a = s.index('Flag.nb_and = function(self, other) {')
    b = s.index('Flag.nb_index = function(self) {')
    assert 0 < b - a < 900, b - a
    s = s[:a] + RE_FLAG_OPS + s[b:]
    s = sub_once(s, '$B.set_func_names(Flag, "re")\n$B.finalize_type(Flag)', RE_FLAG_VALUE, 're Flag value')
    s = sub_once(s, "    u: 'U',\n", "    u: 'UNICODE',\n", 're UNICODE repr')
    # a str with characters beyond U+FFFF, prepared a second time (compiled pattern .sub/.split), lost its text
    s = sub_once(s, "        // string with surrogate pairs\n        this.string = obj.string\n",
                 "        // string with surrogate pairs\n        this.string = obj.string !== undefined ? obj.string : obj\n",
                 're surrogate string')
    # bytes patterns: _b_.str.encode is not a JavaScript function in this Brython version
    assert s.count('_b_.str.encode(') == 4
    s = s.replace('_b_.str.encode(', 'str_encode(')
    s = sub_once(s, "var _b_ = $B.builtins\n\nvar MAXGROUPS",
                 "var _b_ = $B.builtins\n\nfunction str_encode(s, encoding) {\n"
                 "    return $B.$call($B.$getattr(s, 'encode'), encoding)\n}\n\nvar MAXGROUPS", 're str_encode')
    return s


CPY_JSON = f'{ROOT}/vendor/cpython-json'
PSF_NOTICE = ('# From CPython 3.13 (Lib/json). Copyright (c) 2001 Python Software Foundation; All Rights Reserved.\n'
              '# Used under the PSF License Agreement (see LICENSE.txt beside this file in the project).\n'
              '# Changed for the in-page runner: the C accelerator module _json is not used.\n')


def install_cpython_json(vfs):
    def src(name):
        return open(f'{CPY_JSON}/{name}.py', encoding='utf-8').read()
    scanner = sub_once(src('scanner'), 'try:\n    from _json import make_scanner as c_make_scanner\n'
                       'except ImportError:\n    c_make_scanner = None\n', 'c_make_scanner = None\n', 'json scanner')
    decoder = sub_once(src('decoder'), 'try:\n    from _json import scanstring as c_scanstring\n'
                       'except ImportError:\n    c_scanstring = None\n', 'c_scanstring = None\n', 'json decoder')
    encoder = src('encoder')
    for name in ('encode_basestring_ascii', 'encode_basestring', 'make_encoder'):
        encoder = sub_once(encoder, f'try:\n    from _json import {name} as c_{name}\n'
                           f'except ImportError:\n    c_{name} = None\n', f'c_{name} = None\n', 'json encoder ' + name)
    # the same set of characters, written without \b (Brython's engine is patched for it too)
    encoder = sub_once(encoder, "ESCAPE = re.compile(r'[\\x00-\\x1f\\\\\"\\b\\f\\n\\r\\t]')",
                       "ESCAPE = re.compile(r'[\\x00-\\x1f\\\\\"]')", 'json ESCAPE')
    init = src('__init__')
    vfs['json'] = ['.py', PSF_NOTICE + init, ['codecs', 'json.decoder', 'json.encoder'], 1]
    vfs['json.decoder'] = ['.py', PSF_NOTICE + decoder, ['json.scanner', 're']]
    vfs['json.encoder'] = ['.py', PSF_NOTICE + encoder, ['re']]
    vfs['json.scanner'] = ['.py', PSF_NOTICE + scanner, ['re']]


def patched_stdlib():
    s = open(f'{VENDOR}/brython_stdlib.js', encoding='utf-8').read()
    s = sub_once(s, 'self=object.__new__(cls,*args,**kw)', 'self=object.__new__(cls)', 'deque maxlen')
    s = sub_once(s, "print('NotImplementedError for format')", 'pass', 'annotationlib print')
    head = 'var scripts = '
    assert s.count(head) == 1
    i = s.index(head) + len(head)
    vfs, end = json.JSONDecoder().raw_decode(s, i)
    vfs['python_re'][1] = patched_re(vfs['python_re'][1])
    install_cpython_json(vfs)
    # importing asyncio (unittest.mock does) printed a notice into the learner's output
    a = vfs['asyncio'][1]
    i0 = a.index("print('Brython implementation of asyncio")
    i1 = a.index("browser.aio instead')", i0) + len("browser.aio instead')")
    assert a.count("print('Brython implementation of asyncio") == 1 and i1 - i0 < 400
    vfs['asyncio'][1] = a[:i0] + 'pass' + a[i1:]
    # random.seed() with an integer of 32 bits or more (and with a str, which CPython turns into a big
    # integer) split it in base 2**32 - 1 instead of 2**32, so the sequence differed from CPython's
    vfs['_random'][1] = sub_once(vfs['_random'][1],
        "        var keys = []\n        var int32_1 = 2n ** 32n - 1n\n",
        "        var keys = []\n        var int32_1 = 2n ** 32n\n", 'random seed base')
    # unittest: Brython's traceback starts at the outermost frame, not where unittest caught the error, so a
    # failure was reported at the line that called unittest.main(); start it at the first frame after unittest's
    vfs['unittest.result'][1] = sub_once(vfs['unittest.result'][1],
        "   (exctype,value,tb)=excs.pop()\n   \n   while tb and self._is_relevant_tb_level(tb):\n",
        "   (exctype,value,tb)=excs.pop()\n   \n   t=tb\n   while t is not None and not self._is_relevant_tb_level(t):\n"
        "    t=t.tb_next\n   if t is not None:\n    tb=t\n   while tb and self._is_relevant_tb_level(tb):\n",
        'unittest traceback start')
    body = json.dumps(vfs, ensure_ascii=False)
    # characters that some JavaScript engines reject raw inside string literals, and lone surrogates
    body = re.sub('[' + chr(0x2028) + chr(0x2029) + chr(0xD800) + '-' + chr(0xDFFF) + ']',
                  lambda m: chr(92) + 'u%04x' % ord(m.group()), body)
    return s[:i] + body + s[end:]


BOOT = r'''
(function () {
  var B = self.__BRYTHON__;
  var t0 = Date.now();
  B.runPythonSource(%(harness)s, {id: 'pyharness'});
  var mod = B.imported['pyharness'];
  var handle = B.$getattr(mod, 'handle');
  function call(req) { return JSON.parse(B.$call(handle, JSON.stringify(req))); }
  // warm up the modules the checker uses, so the first real run is quick
  try { call({mode: 'check', src: 'import collections, functools, itertools, heapq, math, random\ndef f(n):\n    return n\n', tests: 'assert f(1) == 1\n'}); } catch (e) { /* reported on first real run */ }
  self.onmessage = function (ev) {
    var d = ev.data, t = Date.now(), res;
    try { res = call(d); }
    catch (e) { res = {result: 'error', out: '', tb: 'Internal error in the code runner: ' + String(e && e.message || e) + '\n', restart: true, internal: true}; }
    res.id = d.id; res.ms = Date.now() - t;
    self.postMessage(res);
  };
  self.postMessage({ready: true, ms: Date.now() - t0});
})();
'''

EXTRA_PY = r'''

# ---- additions for Brython ----
if sys.implementation.name.lower() == 'brython':
    import itertools as _it

    def _pairwise(iterable):
        it = iter(iterable)
        try:
            a = next(it)
        except StopIteration:
            return
        for b in it:
            yield a, b
            a = b

    def _batched(iterable, n, *, strict=False):
        if n < 1:
            raise ValueError('n must be at least one')
        it = iter(iterable)
        while True:
            batch = tuple(_it.islice(it, n))
            if not batch:
                return
            if strict and len(batch) != n:
                raise ValueError('batched(): incomplete batch')
            yield batch

    # import only from the bundled standard library: a missing module raises ModuleNotFoundError
    # instead of a failed network request
    sys.meta_path[:] = [f for f in sys.meta_path if getattr(f, '__name__', '') not in ('PathFinder', 'StdlibStaticFinder')]

    if not hasattr(_it, 'pairwise'):
        _it.pairwise = _pairwise
    if not hasattr(_it, 'batched'):
        _it.batched = _batched

    # Brython's time module is written in Python, so time.localtime stored as a class attribute (as
    # logging.Formatter.converter is) became a bound method and failed; make its functions behave like
    # CPython's built-in functions, which do not bind
    import time as _time
    import types as _types

    class _BuiltinFunction:
        __slots__ = ('_f', '__name__', '__qualname__', '__doc__')

        def __init__(self, f):
            self._f = f
            self.__name__ = self.__qualname__ = f.__name__
            self.__doc__ = f.__doc__

        def __call__(self, *args, **kwargs):
            return self._f(*args, **kwargs)

        def __repr__(self):
            return '<built-in function %s>' % self.__name__

    for _n in dir(_time):
        _f = getattr(_time, _n)
        if not _n.startswith('_') and isinstance(_f, _types.FunctionType):
            setattr(_time, _n, _BuiltinFunction(_f))

    # Brython's tracebacks also include the runner's own frames above the learner's code; leave them out
    # of what the traceback module prints (traceback.print_exc() and friends)
    import traceback as _traceback

    def _skip_runner_frames(tb):
        while tb is not None and 'pyharness' in tb.tb_frame.f_code.co_filename:
            tb = tb.tb_next
        return tb

    for _name in ('walk_tb', '_walk_tb_with_full_positions'):
        _orig = getattr(_traceback, _name, None)
        if _orig is not None:
            def _wrapped(tb, _orig=_orig):
                return _orig(_skip_runner_frames(tb))
            setattr(_traceback, _name, _wrapped)

    # The runner's own messages use Brython's fast JavaScript JSON codec; learners' code gets
    # CPython's json package (installed in the bundled standard library).
    import _json as _bjson

    class _ProtocolJSON:
        @staticmethod
        def loads(s):
            return _bjson.loads(s)

        @staticmethod
        def dumps(obj, ensure_ascii=False):
            return _bjson.dumps(obj, 1, skipkeys=False, ensure_ascii=ensure_ascii, check_circular=True,
                                allow_nan=True, indent=None, separators=None, default=None, sort_keys=False)

    json = _ProtocolJSON
'''


def build():
    harness = open(f'{ROOT}/src/pyharness.py', encoding='utf-8').read()
    main_at = harness.index("\nif __name__ == '__main__':")
    harness = harness[:main_at] + EXTRA_PY
    src = (patched_brython() + '\n;\n' + patched_stdlib() + '\n;\n' + BOOT % {'harness': json.dumps(harness)})
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    tmp = OUT + '.%d.tmp' % os.getpid()  # write then rename, so a check running now never reads half a file
    open(tmp, 'w', encoding='utf-8').write(src)
    os.replace(tmp, OUT)
    return OUT, len(src)


if __name__ == '__main__':
    p, n = build()
    print(p, f'{n / 1024 / 1024:.2f} MB')
