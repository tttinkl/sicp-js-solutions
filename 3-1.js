function make_accumulator(initial) {
  return (num) => {
    return initial = initial + num;
  }
}

const a = make_accumulator(5);
const log = console.log;
log(a(10))
log(a(10));