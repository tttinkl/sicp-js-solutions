


function assoc(key, records, same_key) {
  return is_null(records)
    ? undefined
    : same_key(key, head(head(records)))
    ? head(records)
    : assoc(key, tail(records), same_key);
}


function make_table(same_key) {
  const local_table = list("*table");

  const get_value = tail;

  function is_table(t) { 
    return is_pair(t) && head(t) === "*table";
  }

  function lookup(keys) {
    function lookup_generic(keys, table) {
      if (is_null(keys)) {
        return table;
      }
      const key_1 = head(keys);
      const key_rest = tail(keys);
      const record = assoc(key_1, tail(table), same_key);
      if (is_undefined(record)) {
        return undefined;
      }
      if (is_null(key_rest)) {
        return get_value(record);
      } else if (is_table(get_value(record))) {
        return lookup_generic(key_rest, get_value(record));
      } else {
        error('invalid key');
      }
    }
    return lookup_generic(keys, local_table);
  }


  function insert(keys, value) {
    function insert_generic(keys, value, table) {
      const key_1 = head(keys);
      const key_rest = tail(keys);
      const record = assoc(key_1, tail(table), same_key);
      if (is_undefined(record)) {
        if (is_null(key_rest)) {
          set_tail(
            table,
            pair(pair(key_1, value), tail(table)));
        } else {
          const new_subtable = list("*table");
          set_tail(
            table,
            pair(pair(key_1, new_subtable), tail(table))
          );
          insert_generic(key_rest, value, new_subtable);
        }
      } else {
        if (is_null(key_rest)) {
          set_tail(record, value);
        } else {
          if (is_table(get_value(record))) {
            insert_generic(key_rest, value, get_value(record));
          } else {
            const new_subtable = list("*table");
            set_tail(record, new_subtable);
            insert_generic(key_rest, value, new_subtable);
          }
        }
      }
    }
    insert_generic(keys, value, local_table);
  }

  function dispatch(m) {
    return m === "lookup"
      ? lookup
      : m === "insert"
      ? insert
      : m === "show"
      ? () => {
        display(local_table);
        return local_table;
      }
      : error(m, "unknow operation -- table");
  }
  return dispatch;
}

const table = make_table(equal);

const get = table('lookup');
const put = table('insert');
const show = table('show');

// Test

put(list("a"), 1);
put(list("b", "c"), 2);
put(list("d", "e", "f"), 3);

display(get(list("a")));
display(get(list("b", "c")));
display(get(list("d", "e", "f")));

put(list("a", "b"), 1);
display(get(list("a")));
put(list("b", "c", "d"), 2);
display(get(list("b", "c")));
put(list("b"), 1);
display(get(list("b")));