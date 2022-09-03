function plus_curried(x) {
  return y => x + y;
}

plus_curried(3)(4);

function brooks(f, items) {
  return is_null(items)
    ? f
    : brooks(f(head(items)), tail(items));
}


brooks(plus_curried, list(3, 4));

function brooks_curried(items) {
  return brooks(head(items), tail(items));
}
brooks_curried(list(plus_curried, 3, 4));

brooks_curried(list(brooks_curried,
  list(plus_curried, 3, 4)));