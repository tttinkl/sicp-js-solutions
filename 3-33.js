// 3-33; 3-35; 3-37

function for_each_except(exception, fun, list) {
  function loop(items) {
      if (is_null(items)) {
          return "done";
      } else if (head(items) === exception) {
          return loop(tail(items));
      } else {
          fun(head(items));
          return loop(tail(items));
      }
  }
  return loop(list);
}

function make_connector() {
  let value = false;
  let informant = false;
  let constraints = null;
  function set_my_value(newval, setter) {
    if (!has_value(me)) {
      value = newval;
      informant = setter;
      return for_each_except(setter,
        inform_about_value,
        constraints);
    } else if (value !== newval) {
      error(list(value, newval), "contradiction");
    } else {
      return "ignored";
    }
  }
  function forget_my_value(retractor) {
    if (retractor === informant) {
      informant = false;
      return for_each_except(retractor,
        inform_about_no_value,
        constraints);
    } else {
      return "ignored";
    }
  }
  function connect(new_constraint) {
    if (is_null(member(new_constraint, constraints))) {
      constraints = pair(new_constraint, constraints);
    } else { }
    if (has_value(me)) {
      inform_about_value(new_constraint);
    } else { }
    return "done";
  }
  function me(request) {
    if (request === "has_value") {
      return informant !== false;
    } else if (request === "value") {
      return value;
    } else if (request === "set_value") {
      return set_my_value;
    } else if (request === "forget") {
      return forget_my_value;
    } else if (request === "connect") {
      return connect;
    } else if (request === "i") {
      return informant;
    } else {
      error(request, "unknown operation -- connector");
    }
  }
  return me;
}

function has_value(connector) {
  return connector("has_value");
}

function get_value(connector) {
  return connector("value");
}

function set_value(connector, new_value, informant) {
  return connector("set_value")(new_value, informant);
}

function forget_value(connector, retractor) {
  return connector("forget")(retractor);
}

function connect(connector, new_constraint) {
  return connector("connect")(new_constraint);
}

function inform_about_value(constraint) {
  return constraint("I have a value.");
}

function inform_about_no_value(constraint) {
  return constraint("I lost my value.");
}

function adder(a1, a2, sum) {
  function process_new_value() {
    if (has_value(a1) && has_value(a2)) {
      set_value(sum, get_value(a1) + get_value(a2), me);
    } else if (has_value(a1) && has_value(sum)) {
      set_value(a2, get_value(sum) - get_value(a1), me);
    } else if (has_value(a2) && has_value(sum)) {
      set_value(a1, get_value(sum) - get_value(a2), me);
    } else { }
  }
  function process_forget_value() {
    forget_value(sum, me);
    forget_value(a1, me);
    forget_value(a2, me);
    process_new_value();
  }
  function me(request) {
    if (request === "I have a value.") {
      return process_new_value();
    } else if (request === "I lost my value.") {
      process_forget_value();
    } else {
      error(request, "unknow request -- adder");
    }
  }
  connect(a1, me);
  connect(a2, me);
  connect(sum, me);
  return me;
}

function multiplier(m1, m2, product) {
  function process_new_value() {
    if ((has_value(m1) && get_value(m1) === 0)
      || (has_value(m2) && get_value(m2) === 0)) {
      set_value(product, 0, me);
    } else if (has_value(m1) && has_value(m2)) {
      set_value(product, get_value(m1) * get_value(m2), me);
    } else if (has_value(product) && has_value(m1)) {
      set_value(m2, get_value(product) / get_value(m1), me);
    } else if (has_value(product) && has_value(m2)) {
      set_value(m1, get_value(product) / get_value(m2), me);
    } else { }
  }
  function process_forget_value() {
    forget_value(product, me);
    forget_value(m1, me);
    forget_value(m2, me);
    process_new_value();
  }
  function me(request) {
    if (request === "I have a value.") {
      process_new_value();
    } else if (request === "I lost my value.") {
      process_forget_value();
    } else {
      error(request, "unknown request -- multiplier");
    }
  }
  connect(m1, me);
  connect(m2, me);
  connect(product, me);
  return me;
}

function constant(value, connector) {
  function me(request) {
    error(request, "unknown request -- constant");
  }
  connect(connector, me);
  set_value(connector, value, me);
  return me;
}

function probe(name, connector) {
  function print_probe(value) {
    display("Probe: " + name + " = " + stringify(value));
  }
  function process_new_value() {
    print_probe(get_value(connector));
  }
  function process_forget_value() {
    print_probe("?");
  }
  function me(request) {
    return request === "I have a value."
      ? process_new_value()
      : request === "I lost my value."
        ? process_forget_value()
        : error(request, "unknown request -- probe");
  }
  connect(connector, me);
  return me;
}

function celsius_fahrenheit_converter(c, f) {
  const u = make_connector();
  const v = make_connector();
  const w = make_connector();
  const x = make_connector();
  const y = make_connector();
  multiplier(c, w, u);
  multiplier(v, x, u);
  adder(v, y, f);
  constant(9, w);
  constant(5, x);
  constant(32, y);
  return "ok";
}

function averager(a, b, c) {
  function process_new_value() {
    if (has_value(z)) {
      const value_z = get_value(z);
      set_value(c, value_z / 2, me);
    } else if (has_value(c)) {
      const value_c = get_value(c);
      set_value(z, value_c * 2, me);
    }
  }

  function process_forget_value() {
    forget_value(z, me);
    forget_value(c, me);
    process_new_value();
  }

  function me(request) {
    display(request);
    if (request === "I have a value.") {
      process_new_value();
    } else if (request === "I lost my value.") {
      process_forget_value();
    } else {
      error(request, "unknow operation -- average");
    }
  }
  const z = make_connector();
  adder(a, b, z);
  connect(z, me);
  connect(c, me);
  return "ok";
}

function squarer(a, b) {
  function process_new_value() {
    if (has_value(b)) {
      if (get_value(b) < 0) {
        error(get_value(b), "square less than 0 -- squarer");
      } else {
        set_value(a, math_sqrt(get_value(b)), me);
      } 
    } else if (has_value(a)) {
      set_value(b, get_value(a) * get_value(a), me);
    } else {}
  }
  function process_forget_value() {
    forget_value(a, me);
    forget_value(b, me);
    process_new_value();
  }
  function me(request) {
    if (request === "I have a value.") {
      process_new_value();
    } else if (request === "I lost my value.") {
      process_forget_value();
    } else {
      error(request, "unknow operation -- squarer");
    }
  }
  connect(a, me);
  connect(b, me);
  return me;
}

function divisioner(d1, d2, q) {
  function process_new_value() {
    if (d2 === 0) {
      error(d2, "d2 can't be zero. -- divisioner");
    } else if (q === 0) {
      
    } else if (has_value(d1) && has_value(d2)) {
      set_value(q, get_value(d1) / get_value(d2), me);
    } else if (has_value(d1) && has_value(q)) {
      set_value(d2, get_value(d1) / get_value(q), me);
    } else if (has_value(d2) && has_value(q)) {
      set_value(d1, get_value(d2) - get_value(q), me);
    } else { }
  }
  function process_forget_value() {
    forget_value(q, me);
    forget_value(d1, me);
    forget_value(d2, me);
    process_new_value();
  }
  function me(request) {
    if (request === "I have a value.") {
      process_new_value();
    } else if (request === "I lost my value.") {
      process_forget_value();
    } else {
      error(request, "unknown request -- multiplier");
    }
  }
  connect(d1, me);
  connect(d2, me);
  connect(q, me);
  return me;
}

function celsius_fahrenheit_converter_2(x) {
  return cplus(cmul(cdiv(cv(9), cv(5)), x), cv(32));
}

function cplus(x, y) {
  const z = make_connector();
  adder(x, y, z);
  return z;
}

function cmul(x, y) {
  const z = make_connector();
  multiplier(x, y, z);
  return z;
}

function cdiv(x, y) {
  const z = make_connector();
  divisioner(x, y, z);
  return z;
}

function cv(c) {
  const z = make_connector();
  constant(c, z);
  return z;
}


const C = make_connector();
const F = celsius_fahrenheit_converter_2(C);


// const C = make_connector();
// const F = make_connector();


// celsius_fahrenheit_converter(C, F);

// probe("Celsius temp", C);
// probe("Fahrenheit temp", F);

// set_value(C, 25, "user");

// set_value(F, 212, "user"); // Error

// forget_value(C, "user");

// set_value(F, 212, "user");


// const A = make_connector();
// const B = make_connector();
// const C = make_connector();

// averager(A, B, C);

// set_value(A, 10, "user");
// set_value(B, 20, "user");

// const A = make_connector();
// const B = make_connector();

// squarer(A, B);
// set_value(A, 10, 'user');
// forget_value(A, 'user');
// set_value(B, 25, 'user');
// get_value(A);