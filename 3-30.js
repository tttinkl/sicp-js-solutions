// 3-28, 3-29

function make_queue() {
  return pair(null, null);
}

function is_empty_queue(queue) {
  return is_null(front_ptr(queue));
} 

function front_queue(queue) {
  return is_empty_queue(queue)
    ? error(queue, "front_queue called with an empty queue")
    : head(front_ptr(queue));
}

function insert_queue(queue, item) {
  const new_pair = pair(item, null);
  if (is_empty_queue(queue)) {
    set_front_ptr(queue, new_pair);
    set_rear_ptr(queue, new_pair);
  } else {
    set_tail(rear_ptr(queue), new_pair);
    set_rear_ptr(queue, new_pair);
  }
}

function delete_queue(queue) {
  if (is_empty_queue(queue)) {
    error(queue, "delete_queue called with an empty queue");
  } else {
    set_front_ptr(queue, tail(front_ptr(queue)));
    return queue;
  }
}

function front_ptr(queue) {
  return head(queue);
}

function rear_ptr(queue) {
  return tail(queue);
}

function set_front_ptr(queue, item) {
  set_head(queue, item);
}

function set_rear_ptr(queue, item) {
  set_tail(queue, item);
}

function print_queue(queue) {
  display(front_ptr(queue));
}

function call_each(functions) {
  if (is_null(functions)) {
    return "done";
  } else {
    head(functions)();
    return call_each(tail(functions));
  }
}

function make_wire() {
  let signal_value = 0;
  let action_functions = null;

  function set_my_signal(new_value) {
    if (signal_value !== new_value) {
      signal_value = new_value;
      return call_each(action_functions);
    } else {
      return "done";
    }
  }
  function accept_action_function(func) {
    action_functions = pair(func, action_functions);
    func();
  }
  function dispatch(m) {
    return m === "get_signal"
      ? signal_value
      : m === "set_signal"
      ? set_my_signal
      : m === "add_action"
      ? accept_action_function
      : error(m, "unknow operation -- wire");
  }
  return dispatch;
}

function get_signal(wire) {
  return wire("get_signal");
}

function set_signal(wire, new_value) {
  return wire("set_signal")(new_value);
}

function add_action(wire, action_function) {
  return wire("add_action")(action_function);
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

function ripple_carry_added(n, table_a, table_b, c_in, table_s, c_out) {
  const get_a = table_a("get");
  const get_b = table_b("get");
  const get_s = table_s("get");
  function iter(current, c_in) {
    if (current < n) {
      const wire_a = get_a(n);
      const wire_b = get_b(n);
      const wire_s = get_s(n);
      let wire_c = undefined;
      if (n - 1 > current) {
        wire_c = make_wire();
      } else {
        wire_c = c_out;
      }
      full_adder(wire_a, wire_b, c_in, wire_s, wire_c);
      iter(current + 1, wire_c);
    }
  }
  iter(0, c_in);
}

//agenda

function make_agenda() {
  return list(0);
}

function current_time(agenda) {
  return head(agenda);
}

function set_current_time(agenda, time) {
  set_head(agenda, time);
}

function segments(agenda) {
  return tail(agenda);
}

function set_segments(agenda, segs) {
  return set_tail(agenda, segs);
}

function first_segment(agenda) {
  return head(segments(agenda));
}

function rest_segments(agenda) {
  return tail(segments(agenda));
}


function is_empty_agenda(agenda) {
  return is_null(segments(agenda));
}

function first_agenda_item(agenda) {
  if (is_empty_agenda(agenda)) {
    error("agenda is empty -- fist_agenda_item");
  } else {
    const first_seg = first_segment(agenda);
    set_current_time(agenda, segment_time(first_seg));
    return front_queue(segment_queue(first_seg));
  }
}

function remove_first_agenda_item(agenda) {
  const q = segment_queue(first_segment(agenda));
  delete_queue(q);
  if (is_empty_queue(q)) {
    set_segments(agenda, (rest_segments(agenda)));
  } else {}
}

function add_to_agenda(time, action, agenda) {
  function belongs_before(segs) {
     return is_null(segs) || time < segment_time(head(segs));
  }
  function make_new_time_segment(time, action) {
     const q = make_queue();
     insert_queue(q, action);
     return make_time_segment(time, q);
  }
  function add_to_segments(segs) {
     if (segment_time(head(segs)) === time) {
         insert_queue(segment_queue(head(segs)), action);
     } else {
         const rest = tail(segs);
         if (belongs_before(rest)) {
             set_tail(segs, pair(make_new_time_segment(time, action),
                                 tail(segs)));
         } else {
             add_to_segments(rest);
         }
     }
  }
  const segs = segments(agenda);
  if (belongs_before(segs)) {
      set_segments(agenda,
                   pair(make_new_time_segment(time, action), segs));
  } else {
      add_to_segments(segs);
  }
}


function after_delay(delay, action) {
  add_to_agenda(delay + current_time(the_agenda), action, the_agenda);
}

function make_time_segment(time, queue) {
  return pair(time, queue);
}

function segment_time(s) {
  return head(s);
}

function segment_queue(s) {
  return tail(s);
}


function propagate() {
  if (is_empty_agenda(the_agenda)) {
    return "done";
  } else {
    const first_item = first_agenda_item(the_agenda);
    first_item();
    remove_first_agenda_item(the_agenda);
    return propagate();
  }
}

function probe(name, wire) {
  add_action(wire, 
             () => display(name + " " +
                           stringify(current_time(the_agenda)) + 
                           ", new value = " + 
                           stringify(get_signal(wire))));
}

const the_agenda = make_agenda();
const inverter_delay = 2;
const and_gate_delay = 3;
const or_gate_delay = 5;

const input_1 = make_wire(); // delay: 8
const input_2 = make_wire(); // delay: 7
const sum = make_wire();
const carry = make_wire();

probe("sum", sum);

// probe("carry", carry);

half_adder(input_1, input_2, sum, carry);

// set_signal(input_1, 1);

// propagate();

// set_signal(input_2, 1);

// set_signal(input_1, 0);
// set_signal(input_2, 1);
// propagate();


