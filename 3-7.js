// 3-3 3-4

const { log, error } = console;

function make_account(balance, password) {
  let incorrect_counter = 0;
  function withdraw(amount) {
      if (balance >= amount) {
          balance = balance - amount;
          return balance;
      } else {
          return "Insufficient funds";
      }
  }
  function deposit(amount) {
      balance = balance + amount;
      return balance;
  }
  function dispatch(m) {
      return m === "withdraw"
        ? withdraw
        : m === "deposit"
        ? deposit
        : error(m, "unknown request -- make_account");
  }
  function check (p, m) {
  if (p !== password) {
    incorrect_counter = incorrect_counter + 1;
    if (incorrect_counter === 7) {
      error("call the cops");
    } 
    return () => error("Incorrect password");
  } else {
      incorrect_counter = 0;
      return dispatch(m);
    }
  };
  return check;
}

function make_joint(account, linked_password, joint_password) {
  return (_password, m) => {
    if (_password === joint_password) {
      return account(linked_password, m)
    }else {
      return () => error("Incorrect password");
    }
  }
}