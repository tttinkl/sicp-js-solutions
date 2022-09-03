function make_deque() {
  return pair(null, null);
}

function front_ptr(queue) {
  return head(queue);
} 

function rear_ptr(queue) {
  return tail(queue);
}

function is_empty_deque(queue) {
  return is_null(front_ptr(queue)) || is_null(rear_ptr(queue));
}

function front_deque(queue) {
  return is_empty_deque(queue)
    ? error('front_deque is called with an empty deque')
    : head(front_ptr(queue));
}

function rear_deque(queue) {
  return is_empty_deque(queue)
    ? error("rear_deque is called with an empty deque")
    : head(rear_ptr(queue));
}

function set_front_ptr(queue, item) {
  set_head(queue, item);
}

function set_rear_ptr(queue, item) {
  set_tail(queue, item);
}


function _insert_deque(queue, item, ptr, set_ptr, set_another_ptr) {
  const new_pair = pair(item, ptr);
  if (is_empty_deque(queue)) {
    set_ptr(queue, new_pair);
    set_another_ptr(queue, new_pair);
  } else {
    set_ptr(queue, new_pair);
  }
  
} 

function _delete_dequeue(queue, ptr, set_ptr, set_another_ptr) {
  if (is_empty_deque(queue)) {
    error("front_delete_deque called with an empty deque");
  } else {
    set_ptr(queue, tail(ptr));
    if (is_empty_deque(queue)) {
      set_another_ptr(queue, null);
    }
    return queue;
  }
}

function front_insert_deque(queue, item) {
  _insert_deque(queue, item, front_ptr(queue), set_front_ptr, set_rear_ptr);
}

function front_delete_deque(queue) {
  return _delete_dequeue(queue, front_ptr(queue), set_front_ptr, set_rear_ptr);
}

function rear_insert_deque(queue, item) {
  _insert_deque(queue, item, rear_ptr(queue), set_rear_ptr, set_front_ptr);
}

function rear_delete_deque(queue) {
  return _delete_dequeue(queue, rear_ptr(queue), set_rear_ptr, set_front_ptr);
}

const dq = make_deque();
front_insert_deque(dq, 1);
display(front_deque(dq));
display(rear_deque(dq));
display(dq);
display(front_delete_deque(dq));
rear_insert_deque(dq, 2);
rear_insert_deque(dq, 3);
display(dq);
rear_delete_deque(dq);
rear_delete_deque(dq);
display(dq);