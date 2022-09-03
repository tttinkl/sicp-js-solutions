/** one-demensional table lookup */
// function lookup(key, table) {
//   const record = assoc(key, tail(table));
//   return is_undefined(record)
//     ? undefined
//     : tail(record);
// }


function assoc(key, records, same_key = equal) {
  return is_null(records)
    ? undefined
    : equal(key, head(head(records)))
    ? head(records)
    : assoc(key, tail(records));
}


/** one-dimensional table insert */
// function insert(key, value, table) {
//   const record = assoc(key, tail(table));
//   if (is_undefined(record)) {
//     set_tail(table, pair(pair(key, value), tail(table)));
//   } else {
//     set_tail(record, value);
//   }
// }



function make_table(same_key = equal) {
  const local_table =  list("*table");

  function lookup(key_1, key_2) {
    const subtable = assoc(key_1, tail(local_table), same_key);
    if (is_undefined(subtable)) {
      return undefined;
    } else {
      const record = assoc(key_2, tail(subtable));
      return is_undefined(record)
        ? undefined
        : tail(record);
    }
  }

  function insert(key_1, key_2, value) {
    const subtable = assoc(key_1, tail(local_table));
    if (is_undefined(subtable)) {
      set_tail(table, pair(list(key_1, pair(key_2, value)), tail(local_table)));
    } else {
      const record = assoc(key_2, tail(local_table), same_key);
      if (is_undefined(record)) {
        set_tail(subtable, pair(pair(key_2, value), tail(subtable)));
      } else {
        set_tail(record, value);
      }
    }
    return "ok";
  }

  function dispatch(m) {
    return m === "lookup"
      ? lookup
      : m === "insert"
      ? insert
      : error(m, "unknow operation -- table");
  }
  return dispatch;
}