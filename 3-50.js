
function stream_tail(stream) {
  return tail(stream)();
}

function stream_ref(s, n) {
  return n === 0
    ? head(s)
    : stream_ref(stream_tail(s), n - 1);
}

function stream_map(f, s) {
  return is_null(s)
    ? null
    : pair(f(head(s)),
           () => stream_map(f, stream_tail(s)));
}

function stream_for_each(fun, s) {
  if (is_null(s)) {
    return true;
  } else {
    fun(head(s));
    return stream_for_each(fun, stream_tail(s));
  }
}

function stream_filter(pred, stream) {
  return is_null(stream)
    ? null
    : pred(head(stream))
    ? pair(head(stream),
           () => stream_filter(pred, stream_tail(stream)))
    : stream_filter(pred, stream_tail(stream));
}

function add_streams(s1, s2) {
  return stream_map_2((x1, x2) => {
    const r = x1 + x2;
    display('result', r);
    return r;
  }, s1, s2);
}

function memo(fun) {	    
  let already_run = false;
  let result = undefined;
  return () => {
             if (!already_run) {
                 result = fun();
                 already_run = true;
                 return result;
             } else {
                 return result;
             }
         };
}

function stream_map_optimized(f, s) {
  return is_null(s)
         ? null
         : pair(f(head(s)),
                memo(() =>
                       stream_map_optimized(f, stream_tail(s))));
}


function stream_map_2(f, s1, s2) {
  if (is_null(s1) && is_null(s2)) {
    return null;
  }
  const head_1 = is_null(s1) ? null : head(s1);
  const head_2 = is_null(s2) ? null : head(s2);

  return pair(f(head_1, head_2)),
              () => stream_map_2(f, stream_tail(s1), stream_tail(s2));
}

function stream_map_2_optimized(f, s1, s2) {
  if (is_null(s1) && is_null(s2)) {
    return null;
  }

  const head_1 = is_null(s1) ? null : head(s1);
  const head_2 = is_null(s2) ? null : head(s2);

  return pair(f(head_1, head_2)),
  memo(() => stream_map_2_optimized(f, stream_tail(s1), stream_tail(s2)));
}

function mul_streams(s1, s2) {
  return stream_map_2((x1, x2) => x1 * x2, s1, s2);
}

const ones = pair(1, () => ones);

const intergers = pair(1, () => add_streams(ones, intergers));

const fibs = pair(0,
  () => pair(1,
             () => add_streams(stream_tail(fibs),
                               fibs)));

const fibs_memo = stream_map_optimized((x) => x,
                                      pair(0,
                                        () => pair(1,
                                                  () => add_streams(stream_tail(fibs_memo),
                                                  fibs_memo))));

const factorials = pair(1, () => mul_streams(stream_tail(intergers), factorials));


// 3-55
function partial_sums(s) {
  const e_1 = head(s);

  const stream = pair(e_1,
                      () => add_streams(partial_sums(s), stream_tail(s)));
  return stream;
}

function nextIter(stream) {
  let s = stream;
  return () => {
    const result = head(s);
    s = stream_tail(s);
    return result;
  };
}


// 3-70
function merge(s1, s2, weight) {
  weight = weight === undefined ? (x) => x : weight;
  if (is_null(s1)) {
    return s2;
  } else if (is_null(s2)) {
    return s1;
  } else {
    const s1head = head(s1);
    const s2head = head(s2);
    const w1 = weight(s1head);
    const w2 = weight(s2head);
    return w1 < w2
      ? pair(s1head, () => merge(stream_tail(s1), s2, weight))
      : w1 > w2
      ? pair(s2head, () => merge(s1, stream_tail(s2), weight))
      : pair(s2head, () => merge(stream_tail(s2), stream_tail(s1), weight));
  }
}



function weight_pairs(s1, s2, weight) {
  return pair(list(head(s1), head(s2)),
              () => merge(stream_map((x) => list(head(s1), x), stream_tail(s2)),
                          weight_pairs(stream_tail(s1), stream_tail(s2), weight),
                          weight));
}

// 3-56

function scale_streams(stream, factor) {
  return pair(head(stream) * factor, () => scale_streams(stream_tail(stream), factor));
}

const S = pair(1, () => merge(merge(scale_streams(S, 2),
                                    scale_streams(S, 3)),
                              scale_streams(S, 5)));


// 3-64

function stream_limit(stream, tolerance) {
  let before = head(stream);
  function impl(stream) {
    const current = head(stream);
    if (math_abs(before - current) < tolerance) {
      return current;
    } else {
      before = current;
      return impl(stream_tail(stream));
    }
  }

  return impl(stream_tail(stream));
}


function sqrt(x, tolerance) {
  return stream_limit(sqrt_stream(x), tolerance);
}

function interleave(s1, s2) {
  return is_null(s1)
    ? s2
    : pair(head(s1), () => interleave(s2, stream_tail(s1)));
}

function pairs(s1, s2) {
  return pair(list(head(s1), head(s2)),
              () => interleave(stream_map((x) => list(head(s1), x), stream_tail(s2)),
                                pairs(stream_tail(s1), stream_tail(s2))));
}


// 3-67 跑起来有问题
function pairs_2(s1, s2) {
  return pair(list(head(s1), head(s2)),
              () => interleave(
                pairs_2(stream_tail(s1), stream_tail(s2)),
                interleave(stream_map((x) => list(head(s1), x), stream_tail(s2)),
                           stream_map((x) => list(x, head(s2)), stream_tail(s1)))));
}

function triples(s, t, u) {
  const origin_triple = pair(
              list(head(s), head(t), head(u)),
              () => interleave(
                stream_map((x) => pair(head(s), x), stream_tail(pairs(t, u))),
                triples(stream_tail(s), stream_tail(t), stream_tail(u))));
  return stream_filter((x) => {
    const e_1 = head(x);
    const e_2 = head(tail(x));
    const e_3 = head(tail(tail(x)));
    display(list(e_1, e_2, e_3));
    return e_1 * e_1 + e_2 * e_2 === e_3 * e_3;
  }, origin_triple);
}

// 3-71
function cube(x) {
  return x * x * x;
}

function ramanujan() {
  const weight = (p) => cube(head(p), tail(p));
  const origin_pair = weight_pairs(intergers, intergers, weight);
  const next = nextIter(origin_pair);
  let flag = weight(head(origin_pair));
  function finder() {
    const r = weight(next());
    if (r === flag) {
      flag = r;
      return r;
    } else {
      flag = r;
      return finder();
    }
  }
  return pair(finder(), () => finder());
}

