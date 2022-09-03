function make_queue() {
  let front_ptr = null;
  let rear_ptr = null;

  function is_empty_queue() {
    return is_null(front_ptr);
  } 
  
  function front_queue() {
    return is_empty_queue()
      ? error("front_queue called with an empty queue")
      : head(front_ptr);
  }
  
  function insert_queue(item) {
    const new_pair = pair(item, null);
    if (is_empty_queue()) {
      set_front_ptr(new_pair);
      set_rear_ptr(new_pair);
    } else {
      set_tail(rear_ptr, new_pair);
      set_rear_ptr(new_pair);
    }
  }
  
  function delete_queue() {
    if (is_empty_queue()) {
      error("delete_queue called with an empty queue");
    } else {
      set_front_ptr(tail(front_ptr));
      return front_ptr;
    }
  }
  
  function set_front_ptr(item) {
    front_ptr = item;
  }
  
  function set_rear_ptr(item) {
    rear_ptr = item;
  }
  

  function dispatch(m) {
    return  m === "is_empty_queue"
      ? is_empty_queue
      : m === "front_queue"
      ? front_queue
      : m === "insert_queue"
      ? insert_queue
      : m === "delete_queue"
      ? delete_queue
      : m === "front_queue"
      ? front_queue
      : error("invalid method");
  }
  return dispatch;
}

const q = make_queue();
q("is_empty_queue")();
q("insert_queue")(1);
display(q("front_queue")());
q("insert_queue")(2);
q("delete_queue")();
display(q("front_queue")());

