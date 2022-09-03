const { appendFile } = require('fs');

function integral(integrand, initial_value, dt) {
  const integ = pair(initial_value,
                     () => add_streams(scale_streams(integrand, dt),
                                       integ));
  return integ;
}

function RC(R, C, ) {
  
}


function output_stream(input) {
  let input_s = undefined;
  function impl() {
    input_s = input_s === undefined ? input : stream_tail(input_s);
    const p = pair(head(input_s), () => impl());
    return p;
  }
  return impl();
}

function command_stream() {
  let queue = list();
  function getHead ()  {
    if (is_null(queue)) {
      return 'empty';
    } else {
      return head(queue);
    }
  }
  const stream = () => pair(getHead(), () => {
    if (is_null(queue)) {
    } else {
      queue = tail(queue);
    }
    return stream();
  });
  function put(str) {
    append(queue, list(str));
  }
  function dispatch(m) {
    return m === 'stream'
    ? stream()
    : m === 'put'
    ? put
    : m === 'queue'
    ? queue
    : m === 'unimplement';
  }
  return dispatch;
}

const cmd = command_stream();
const stream = cmd('stream');
const put = cmd('put');

const output = output_stream(stream);

head(output);
put('1');
head(output);
head(stream_tail(output));
