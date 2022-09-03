function foo() {
  let num ;
  return (n) => {
    if (n === 0) {
      return num = n;
    }
    if (num !== undefined) {
      return num;
    }
    return num = n;
  }
}

const f = foo();