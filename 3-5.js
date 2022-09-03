"use strict"

const math_sqrt = Math.sqrt;

var gcd = (a, b) => {
  if (b === 0) {
    return a
  } else {
    return gcd(b, a % b);
  }
}

const random_init = 1;

var make_rand = () => {
  let x = random_init;
  return () => {
    x = rand_update(x);
    return x;
  }
}

const rand = make_rand();

var dirichlet_test = () => {
  return gcd(rand(), rand()) === 1;
}

var monte_carlo = (trials, experiment) => {
  var iter = (trials_remaining, trials_passed) => {
    if (trials_remaining === 0) {
      return trials_passed / trials;
    } else if (experiment()) {
      return iter(trials_remaining - 1, trials_passed + 1);
    } else {
      return iter(trials_remaining - 1, trials_passed);
    }
  }
  return iter(trials, 0);
}


var estimate_pi = (trials) => {
  return math_sqrt(6 / monte_carlo(trials, dirichlet_test))
}

var ramdom_in_range = (low, high) => {
  return low + (high - low) * Math.random()
}

var estimate_intergral = (pred, x1, x2, y1, y2, trials) => {
  const area_rect = (x2 - x1) * (y2 - y1);
  const di =  monte_carlo(
    trials,
    () => pred(
      ramdom_in_range(x1, x2),
      ramdom_in_range(y1, y2),
      )) * area_rect;
  return di / 9;
}

var predicate_P = (x, y) => {
  return (x - 5) ** 2 + (y - 7) ** 2 <= 3 ** 2;
}

const ei = estimate_intergral(predicate_P, 2, 8, 4 , 10, 20000);
console.log(ei);

