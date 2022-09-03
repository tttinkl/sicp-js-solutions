function fun_1(succeed, fail) {
  const arr = [1, 2, 3];
  let index = -1;
  function try_next() {
    index = index + 1;
    if (index === 3) {
      fail();
    } else {
      fun_2(
        arr[index],
        succeed,
        () => try_next());
    }
  }
  try_next();
}
function fun_2(num, succeed, fail) {
  console.log('fun_2 succeed', num);
  fun_3(
    num,
    (val, fail2) => {
      succeed(val, fail2);
    },
    fail);
}
function fun_3(num, succeed, fail) {
  if (num === 4) {
    console.log('fun_3 succeed');
    succeed(num, fail);
  } else {
    console.log('fun_3 fail');
    fail();
  }
}

fun_1(
  (val, fail) => {
    console.log('final success', val)
  },
  () => console.log('failed')
);


