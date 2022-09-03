function make_queue() {
  return pair1(null, null);
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

function front_queue(queue) {
  return is_empty_queue(queue)
    ? error(queue, "front_queue called with an empty queue")  
    : head(front_ptr(queue))
}

function print_queue(queue) {
  display(front_ptr(queue));
}