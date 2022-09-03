function find(el, list) {
  if (list === null) {
      return null;
  }
  if (head(list) === el) {
      return el;
  }else {
      return find(el, tail(list));
  }
}

function count_pairs(pairs) {
let s = null;
function resolve(pairs) {
  if (pairs === null) {
      return 0;
  }
  if (! is_pair(pairs)) {
      return 0;
  }
  if (find(pairs, s) !== null) {
      return 0;
  }
  s = s === null
      ? pair(s, null)
      : pair(pairs, s);
  const r1 = resolve(head(pairs));
  const r2 = resolve(tail(pairs));
  display(r1);
  display(r2);
  display("\n~~~");
  return r1 + r2 + 1;
}
return resolve(pairs);
}


const list1 = list('a', 'b', 'c');

const pair1 = pair(1, 2);
const pair2 = pair(pair1, pair1);
const pair3 = pair(pair2, pair2);
const pair4 = pair(pair3, pair3);
count_pairs(pair3);