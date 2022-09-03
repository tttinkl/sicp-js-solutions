function pair(a, b) {
  return {
    head: a,
    tail: b,
  }
}
function head(p) {
  return p.head;
}
function tail(p) {
  return p.tail;
}

function char_at(s, i) {
  return s[i];
}

function apply_in_underlying_javascript(fun, args) {
  return fun(..._lst_to_array(args));
}

function stringify(s) {
  return JSON.stringify(s);
}

function is_pair(o) {
  return typeof o === 'object';
}

function is_string(s) {
  return typeof s === 'string';
}

function is_null(v) {
  return v === null;
}
function is_undefined(v) {
  return v === undefined;
}
function is_boolean(v) {
  return typeof v === 'boolean';
}

function equal(a, b) {
  return a === b;
}

function display(s) {
  console.log(s);
}

function error(s, m) {
  throw new Error(m + s);
}

function _lst_to_array(lst) {
  const vector = []
  while (!is_null(lst)) {
    vector.push(head(lst))
    lst = tail(lst)
  }
  return vector
}

function length(lst) {
  return _lst_to_array(lst).length;
}

function append(a, b) {
  return list(..._lst_to_array(a), ..._lst_to_array(b));
}

function map(proc, lst) {
  return list(..._lst_to_array(lst).map(proc));
}

function list(...args) {
  function iter(args, result) {
    if (!args || args.length === 0) {
      return result;
    }
    const [, ...rest] = args;
    return pair(args[0], iter(rest, null));
  }
  return iter(args, null);
}

function list_ref(xs, n) {
  return n === 0
         ? head(xs)
         : list_ref(tail(xs), n - 1);
}

function set_head(p, value) {
  p.head = value;
}

function set_tail(p, value) {
  p.tail = value;
}

function $accumulate(f, initial, xs, cont) {
  return is_null(xs)
         ? cont(initial)
         : $accumulate(f, initial, tail(xs), x => cont(f(head(xs), x)));
}

function accumulate(f, initial, xs) {
return $accumulate(f, initial, xs, x => x);
}

function stream_map(f, s) {
  return is_null(s)
    ? null
    : pair(f(head(s)),
           () => stream_map(f, stream_tail(s)));
}
