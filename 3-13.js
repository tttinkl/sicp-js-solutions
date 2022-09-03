function last_pair(x) {
  return is_null(tail(x))
    ? x
    : last_pair(tail(x));
}

function make_cycle() {
  set_tail(last_pair(x), x);
  return x;
}

const z = make_cycle(list("a", "b", "c"));

