function append_mutator(x, y) {
  set_tail(last_pair(x), y);
}

function last_pair(x) {
  return is_null(tail(x))
    ? x
    : last_pair(tail(x));
}

const x = list("a", "b");
const y = list("c", "d");
const z = append(x, y);

display(tail(x));

const w = append_mutator(x, y);
display(tail(x));