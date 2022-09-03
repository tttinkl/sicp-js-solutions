function make_monitored(f) {
  let counter = 0;
  return (mf) => {
    switch (mf) {
      case "how many calls":
        return counter;
      case "reset count":
        return counter = 0;
      default:
        counter++;
        return f(mf);
    }
  }
}
const s = make_monitored(Math.sqrt);
console.log(s(100));
console.log(
  s("how many calls")
);