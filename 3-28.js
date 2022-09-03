// 3-28, 3-29

function make_wire() {

}

function logical_not(s) {
  return s === 0
    ? 1
    : s === 1
    ? 0
    : error(s, "invalid signal");
}

function logical_or(a1, a2) {
  if (a1 === 1 || a2 === 1) {
    return 1;
  } else {
    return 0;
  }
}

function logical_and(a1, a2) {
  if (a1 === 1 && a2 === 1) {
    return 1;
  } else {
    return 0;
  }
}



const a = make_wire();
const b = make_wire();
const c = make_wire();
const d = make_wire();
const e = make_wire();
const s = make_wire();

function or_gate(a1, a2, output) {
  function or_action_function() {
    const new_value = logical_or(get_signal(a1),
                                 get_signal(a2));
    after_delay(or_gate_delay,
                () => set_signal(output, new_value));
              }
    add_action(a1, or_action_function);
    add_action(a2, or_action_function);
    return "ok";
}

/** implements by and_gate and inverter */
function or_gate(a1, a2, output) {
  const inverter_1_to_and = make_wire();
  const inverter_2_to_and = make_wire();

  inverter(a1, inverter_1_to_and);
  inverter(a2, inverter_2_to_and);

  const and_to_inverter = make_wire();
  and_gate(inverter_1_to_and, inverter_2_to_and, and_to_inverter);
  inverter(and_to_inverter, output);
  return "ok";
}

or_gate(a, b, d);

function and_gate(a1, a2, output) {
  function and_action_function() {
    const new_value = logical_and(get_signal(a1),
                                  get_signal(a2));
    after_delay(and_gate_delay,
                () => set_signal(output, new_value));
  }
  add_action(a1, and_action_function);
  add_action(a2, and_action_function);
  return "ok";
}

and_gate(a, b, c);

function inverter(input, output) {
  function invert_input() {
    const new_value = logical_not(get_signal(input));
    after_delay(
      inverter_delay,
      () => set_signal(output, new_value)
    );
  }
  add_action(input, invert_input);
  return "ok";
}

inverter(c, e);

function and_gate() {

}

and_gate(d, e, s);

function half_adder(a, b, s, c) {
  const d = make_wire();
  const e = make_wire();
  or_gate(a, b, d);
  and_gate(a, b, c);
  inverter(c, e);
  and_gate(d, e, s);
  return "ok";
}

function full_adder(a, b, c_in, sum, c_out) {
  const s = make_wire();
  const c1 = make_wire();
  const c2 = make_wire();
  half_adder(b, c_in, s, c1);
  half_adder(a, s, sum, c2);
  or_gate(c1, c2, c_out);
  return "ok";
}

