// SICP JS 3.4.2

function make_mutex() {
  const cell = list(false);
  function the_mutex(m) {
      return m === "acquire"
             ? test_and_set(cell)
               ? the_mutex("acquire") // retry
               : true
             : m === "release"
             ? clear(cell)
             : error(m, "unknown request -- mutex");
  }
  return the_mutex;
}
function clear(cell) {
  set_head(cell, false);
}

function make_semaphore(n) {
  function acquire() {

  }
  function release() {

  }
  function dispatch(m) {
    return m === 'acquire'
      ? acquire
      : m === 'release'
      ? release
      : error(m, 'unknown request -- mutex');
  }
  return dispatch
}



function make_serializer() {
  const mutex = make_mutex();
  return f => {
             function serialized_f() {
                 mutex("acquire");
                 const val = f();
                 mutex("release");
                 return val;
             }
             return serialized_f;          
         };
}

function make_account(balance) {
  function withdraw(amount) {
      if (balance > amount) {
          balance = balance - amount;
          return balance;
      } else {
          return "Insufficient funds";
      }
  }
  function deposit(amount) {
      balance = balance + amount;
      return balance;
  }XX
  const protect = make_serializer();
  function dispatch(m) {
      return m === "withdraw" 
             ? protect(withdraw)
             : m === "deposit"
             ? protect(deposit)
             : m === "balance"
             ? balance
             : error(m, "unknown request -- make_account");
  }
  return dispatch;
}

const my_account = make_account(100);

concurrent_execute(
  () => {
      display(my_account("balance"), "T1 balance");
      my_account("withdraw")(50);
      display(my_account("balance"), "T1 balance");
      my_account("deposit")(100);
  },
  () => { display(my_account("balance"), "T2 balance");
      my_account("withdraw")(50);
      display(my_account("balance"), "T2 balance");
      my_account("deposit")(100);
  }
);