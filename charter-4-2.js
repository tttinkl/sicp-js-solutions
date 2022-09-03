/* --------------------------------------------- table -------------------------- */
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
        return local_table;
      }
      : error(m, "unknow operation -- table");
  }
  return dispatch;
}

const table = make_table(equal);
const get = (key) => table('lookup')(list('*', key));
const set = (key, value) => table('insert')(list('*', key), value);
/* ------------------------------- table end --------------------- */

/* ------------------------------- utils ------------------------- */

// left-to-right
function my_map(exps, env) {
  function iter(exps, result) {
    const exp = head(exps);
    if (is_null(tail(exps))) {
      return pair(evaluate(exp, env), result);
    } else {
      return iter(tail(exps), pair(evaluate(exp, env), result));
    }
  }
  return iter(exps, null);
}

// right-to-left 
function my_map_2(exps, env) {
  if (is_null(exps)) {
    return null;
  }
  const rest = my_map_2(tail(exps), env);
  return pair(evaluate(head(exps), env), rest);
}

function map_join(proc, lst, joiner) {
  joiner = joiner === undefined ? ',' : joiner;
  function iter(lst, result) {
    if (is_null(lst)) {
      return result;
    }
    const is_last = is_null(tail(lst));
    return iter(tail(lst), result + proc(head(lst)) + (is_last ? '' : joiner));
  }
  return iter(lst, '');
}

function map_to_list(lst_1, lst_2) {
  function iter(lst_1, lst_2, result) {
    if (is_null(lst_1)) {
      return result;
    }
    return iter(tail(lst_1), 
                tail(lst_2), 
                append(result, 
                       pair(head(lst_1), head(lst_2))));
  }
  return iter(lst_1, lst_2, null);
}

function join_lists(lsts) {
  function iter(lsts, result) {
    if (is_null(head(lsts))) {
      return result;
    }
    const tails = map(lst => tail(lst), lsts);
    const joined = accumulate((lst, result) => {
      return pair(head(lst), result);
    }, null, lsts);
    result = append(result, list(joined));
    return iter(tails, result);
  }
  return iter(lsts, null);
}

/* -------------------------- main code ---------------------- */
/**
 * environment manipulate
 */
const the_empty_environment = null;

// exercise 4.10
function env_scan(env, target, proc) {
  function scan(locals) {
    return is_null(locals)
      ? env_scan(enclosing_environment(env), target, proc)
      : target === symbol_of_local(head(locals))
      ? proc(locals)
      : scan(tail(locals));
  }
  if (env === the_empty_environment) {
    error(target, 'not found');
  } else {
    const frame = first_frame(env);
    return scan(frame);
  }
}

// 4-12 (1
function lookup_symbol_value(symbol, env) {
    return env_scan(env, symbol, (locals) => {
      const value = value_of_local(head(locals));
      if (is_unassigned(value)) {
        error(symbol_of_local(head(locals)), 'can not access an unassigned variable');
      } else {
        return value;
      }
    });
}

function assign_symbol_value(symbol, value, env) {
  env_scan(env, symbol, (locals) => {
    if (
      is_constant(type_of_local(head(locals)))
      && (! is_unassigned(value_of_local(head(locals))))) {
      error(head(locals), 'can not reassign');
    }
    set_head(tail(tail(head(locals))), value);
  });
}


/**
 * collection of locals
 * @returns Array<[symbol, type, value]>
 */
function make_frame(symbols, types, values) {
  return join_lists(list(symbols, types, values));
}

function symbol_of_local(local) {
  return list_ref(local, 0);
}

function type_of_local(local) {
  return list_ref(local, 1);
}

function value_of_local(local) {
  return list_ref(local, 2);
}

function extend_environment(symbols, types, values, base_env) {
  const returt = length(symbols) === length(values)
    ? pair(make_frame(symbols, types, values), base_env)
    : error('length error');
  return returt;
}

function enclosing_environment(env) {
  return tail(env);
}

function first_frame(env) {
  return head(env);
}

function list_of_values(exps, env) {
  return map(arg => evaluate(arg, env), exps);
}

function is_unassigned(value) {
  return value ===  "*unassigned*";
}

function list_of_unassigned(symbols) {
  return map(symbol => "*unassigned*", symbols);
}

function list_of_symbol_type(locals) {
  return map(local => head(local), locals);
}

function list_of_symbol(locals) {
  return map(local => head(tail(local)), locals);
}

function is_constant(tag) {
  return tag === 'constant_declaration';
}

function is_variable(tag) {
  return tag === 'variable_declaration';
}

function is_tagged_list(component, the_tag) {
  return is_pair(component) && head(component) === the_tag;
}

function is_truthy(x) {
  return is_boolean(x)
    ? x
    : error(x, 'boolean expectedm, received');
}

function is_falsy(x) { return ! is_truthy(x); }

function evaluate(component, env) {
  function evaluate_generic() {
    const exact_eval = get(head(component));
    if (is_undefined(exact_eval)) {
      error(head(component), 'eval function not found.');
    }
    return exact_eval(component, env);
  }
  return evaluate_generic();
}

function list_of_arg_values(exps, env) {
  return map(exp => actual_value(exp, env), exps);
}

function list_of_delayed_args(exps, env) {
  return map(exp => delay_it(exp, env), exps);
}

function apply(fun, args, env) {
  if (is_primitive_function(fun)) {
    return apply_primitive_function(fun, 
                                    list_of_arg_values(args, env));
  } else if (is_compound_function(fun)) {
    const params = function_parameters(fun);
    const symbol_type = map((symbol) => 'variable_declaration', params);

    const result = evaluate(function_body(fun),
                             extend_environment(function_parameters(fun),
                                                symbol_type,
                                                list_of_delayed_args(args, env),
                                                function_environment(fun)));
    return is_return_value(result)
      ? return_value_content(result)
      : undefined;
  } else {
    error(fun, "unkonw function type -- apply");
  }
}

/**
 * lazy
 */

function actual_value(exp, env) {
  return force_it(evaluate(exp, env));
}

function delay_it(exp, env) {
  return list('thunk', exp, env);
}

function is_thunk(obj) {
  return is_tagged_list(obj, "thunk");
}

function thunk_exp(thunk) {
  return head(tail(thunk));
}

function thunk_env(thunk) {
  return head(tail(tail(thunk)));
}

function is_evaluated_thunk(obj) {
  return is_tagged_list(obj, 'evaluated_thunk');
}

function thunk_value(evaluated_thunk) {
  return head(tail(evaluated_thunk));
}

function force_it(obj) {
  if(is_thunk(obj)) {
    const result = actual_value(thunk_exp(obj), thunk_env(obj));
    set_head(obj, "evaluated_thunk");
    set_head(tail(obj), result);
    set_tail(tail(obj), null);
    return result;
  } else if (is_evaluated_thunk(obj)) {
    return thunk_value(obj);
  } else {
    return obj;
  }
}


/**
 * return_statemnt --- 返回语句
 */
function is_return_value(component) {
  return is_tagged_list(component, 'return_value');
}

function return_value_content(value) {
  return tail(value);
}

function make_return_value(value) {
  return pair('return_value', value);
}

function return_expression(component) {
  return head(tail(component));
}

function eval_return_statement(component, env) {
  return make_return_value(evaluate(return_expression(component), env));
}
set('return_statement', eval_return_statement);

/** 
 * name
 */
function symbol_of_name(component) {
  return head(tail(component));
}

function make_name(symbol) {
  return list("name", symbol);
} 
set('name', (component, env) => lookup_symbol_value(symbol_of_name(component), env));


/**
 * literal --- 字面量
 */
function literal_value(component) {
  return head(tail(component));
}

function make_literal(value) {
  return list('literal', value);
}
set('literal', (component, env) => literal_value(component));

/** 
 * application --- 调用
 */
function make_application(function_expression, argument_expressions) {
  return list("application",
              function_expression, argument_expressions);
}

function function_expression(component) {
  return head(tail(component));
}

function arg_expreesions(component) {
  return head(tail(tail(component)));
}

function eval_application(component, env) {
  return apply(actual_value(function_expression(component), env),
               arg_expreesions(component), env);
}


set('application', eval_application);

/**
 * conditional --- 三元表达式条件语句
 */
function make_conditional(conditional_predicate, conditional_consequent, conditional_alternative) {
  return list('conditional_expression', conditional_predicate, conditional_consequent, conditional_alternative);
}

function conditional_predicate(component) {
  return head(tail(component));
}

function conditional_consequent(component) {
  return head(tail(tail(component)));
}

function conditional_alternative(component) {
  return head(tail(tail(tail(component))));
}

function eval_conditional(component, env) {
  return is_truthy(actual_value(conditional_predicate(component), env))
    ? evaluate(conditional_consequent(component), env)
    : evaluate(conditional_alternative(component), env);
}
set('conditional_expression', eval_conditional);
set('conditional_statement', eval_conditional);

/**
 * sequence --- 多句语句
 */
function is_sequence(component) {
  return is_tagged_list(component, "sequence");
}
function sequence_statements(component) {   
  return head(tail(component));
}
function first_statement(stmts) {
  return head(stmts);
}
function rest_statements(stmts) {
  return tail(stmts);
}
function is_empty_sequence(stmts) {
  return is_null(stmts);
}
function is_last_statement(stmts) {
  return is_null(tail(stmts));
}

function eval_sequence(stmts, env) {
  if (is_empty_sequence(stmts)) {
    return undefined;
  } else if (is_last_statement(stmts)) {
    return evaluate(first_statement(stmts), env);
  } else {
    const first_stmt_value = evaluate(first_statement(stmts), env);
    if (
      is_return_value(first_stmt_value) ||
      is_break_flag(first_stmt_value) ||
      is_continue_flag(first_stmt_value)
    ) {
      return first_stmt_value;
    } else {
      return eval_sequence(rest_statements(stmts), env);
    }
  }
}
set('sequence', (component, env) => eval_sequence(sequence_statements(component), env));

/** 
 * assignment --- 赋值语句
 */
function is_assignment(component) {
  return is_tagged_list(component, "assignment");
}
function assignment_symbol(component) {
  return head(tail(head(tail(component))));
}
function assignment_value_expression(component) {
  return head(tail(tail(component)));
}

function eval_assignment(component, env) {
  const value = evaluate(assignment_value_expression(component), env);
  assign_symbol_value(assignment_symbol(component), value, env);
  return value;
}
set('assignment', eval_assignment);

/**
 *  block --- 语句块 
 */
function block_body(component) {
  return head(tail(component));
}

function eval_block(component, env) {
  const body = block_body(component);
  const locals = scan_out_declarations(body);
  const symbols = list_of_symbol(locals);
  const types = list_of_symbol_type(locals);
  const unassigneds = list_of_unassigned(locals);

  return evaluate(body, extend_environment(symbols,
                                           types,
                                           unassigneds,
                                          env));
}
set('block', eval_block);

/** 
 * declaration --- 声明语句
 */
function is_declaration(component) {
  return is_tagged_list(component, "constant_declaration") ||
         is_tagged_list(component, "variable_declaration") ||
         is_tagged_list(component, "function_declaration");
}

function is_variable_declaration(component) {
  return is_tagged_list(component, "variable_declaration");
}

function is_constant_declaration(component) {
  return is_tagged_list(component, "constant_declaration");
}

function declaration_type(component) {
  return list_ref(component, 0);
}

function declaration_symbol(component) {
  return symbol_of_name(head(tail(component)));
}

function declaration_value_expression(component) {
  return head(tail(tail(component)));
}

function make_constant_declaration(name, value_expression) {
  return list("constant_declaration", name, value_expression);
}

/** 
 * 获取语句或 sequence 中所有声明变量名
 * @return locals: Array<[type, symbol]>
 */
function scan_out_declarations(component) {
  const result = is_sequence(component)
    ? accumulate(append,
                 null,
                  map(scan_out_declarations,
                      sequence_statements(component)))
    : is_declaration(component)
    ? list(list(declaration_type(component), declaration_symbol(component)))
    : null;
  return result;
}

function eval_declaration(component, env) {
  assign_symbol_value(declaration_symbol(component),
                      evaluate(declaration_value_expression(component), env),
                      env);
  return undefined;
}
set('constant_declaration', eval_declaration);
set('variable_declaration', eval_declaration);

/**
 * lambda --- 箭头函数
 */
 function is_lambda_expression(component) {
  return is_tagged_list(component, 'lambda_expression');
}

function make_lambda_expression(paramters, body) {
  return list('lambda_expression', paramters, body);
}

function lambda_body(component) {
  return head(tail(tail(component)));
}

function lambda_parameter_symbols(component) {
  return map(symbol_of_name, head(tail(component)));
}

function eval_lambda(component, env) {
  return make_function(lambda_parameter_symbols(component), lambda_body(component), env);
}
set('lambda_expression', eval_lambda);

/**
 * function
 */
function is_primitive_function(fun) {
  return is_tagged_list(fun, "primitive");
}

function primitive_implementation(fun) {
  return head(tail(fun));
}

function is_compound_function(f) {
  return is_tagged_list(f, "compound_function");
}

function is_function_declaration(component) {	    
  return is_tagged_list(component, "function_declaration");
}

function make_function(parameters, body, env) {
  return list("compound_function", parameters, body, env);
}

function function_declaration_name(component) {
  return list_ref(component, 1);
}

function function_declaration_parameters(component) {
  return list_ref(component, 2);
}

function function_declaration_body(component) {
  return list_ref(component, 3);
}

function function_parameters(component) {
  return list_ref(component, 1);
}

function function_body(f) {
  return list_ref(f, 2); 
}

function function_environment(component) {
  return list_ref(component, 3);
}

function function_decl_to_constant_decl(component) {
  return make_constant_declaration(
             function_declaration_name(component),
             make_lambda_expression(
                 function_declaration_parameters(component),
                 function_declaration_body(component)));
}

function apply_primitive_function(fun, arglist) {
  return apply_in_underlying_javascript(
    primitive_implementation(fun), arglist);
}

function eval_function_declaration(component, env) {
  return evaluate(function_decl_to_constant_decl(component), env);
}
set('function_declaration', eval_function_declaration);

/**
 * operator
 */
function is_unary_operator_combination(component) {	    
  return is_tagged_list(component, "unary_operator_combination");
}
function is_binary_operator_combination(component) {	    
  return is_tagged_list(component, "binary_operator_combination");
}
function operator_symbol(component) {
  return list_ref(component, 1);
}
function first_operand(component) {
  return list_ref(component, 2);
}
function second_operand(component) {
  return list_ref(component, 3);
}

function operator_combination_to_application(component) {
  const operator = operator_symbol(component);
  return is_unary_operator_combination(component)
         ? make_application(make_name(operator),
                            list(first_operand(component)))
         : make_application(make_name(operator),
                            list(first_operand(component),
                                 second_operand(component)));
}
function eval_operator(component, env) {
  return evaluate(operator_combination_to_application(component), env);
}
set("unary_operator_combination", eval_operator);
set("binary_operator_combination", eval_operator);

/**
 * while loop
 */
function while_predicate(component) {
  return list_ref(component, 1);
}

function while_body(component) {
  return list_ref(component, 2);
}

// exercise 4.7
function while_loop(pred, body) {
  function iter(time) {
    if (time <= 10) {
      if (pred()) {
        const result = body();
        if (is_break_flag(result)) {

        } else {
          iter(time + 1);
        }
      }
    }
  }
  iter(0);
}

function evaluate_while_body(component, env) {
  const body = while_body(component);
  const locals = scan_out_declarations(body);
  const symbols = list_of_symbol(locals);
  const types = list_of_symbol_type(locals);
  const unassigneds = list_of_unassigned(locals);

  return evaluate(component, extend_environment(symbols, types, unassigneds, env));
}

function while_to_application(component, env) {
  while_loop(() => is_truthy(evaluate(while_predicate(component), env)), 
             () => evaluate(while_body(component), env));
}

function eval_while(component, env) {
  return while_to_application(component, env);
}
set('while_loop', eval_while);

function is_break_flag(component) {
  return is_tagged_list(component, 'break_flag');
}
function make_break_flag() {
  return list('break_flag');
}
set('break_statement', (component, env) => make_break_flag());


function is_continue_flag(component) {
  return is_tagged_list(component, 'continue_flag');
}
function make_continue_flag() {
  return list('continue_flag');
}
set('continue_statement', (component, env) => make_continue_flag());

/* ---------------------------------- set up ------------------------------- */

const primitive_functions = list(list('head', head),
                                 list('tail', tail),
                                 list('pair', pair),
                                 list('map', map),
                                 list('is_null', is_null),
                                 list('+', (x, y) => x + y),
                                 list('<', (x, y) => x < y),
                                 list('-', (x, y) => x - y),
                                 list('===', (x, y) => x === y),
                                 list('display', display));

const primitive_constants = list(list('undefined', undefined),
                                list('math_PI', math_PI));

const primitive_function_symbols =
    map(f => head(f), primitive_functions);


const primitive_constant_symbols =
    map(c => head(c), primitive_constants);

const primitive_function_objects =
    map(f => list("primitive", head(tail(f))),
        primitive_functions);

const primitive_constant_values =
    map(c => head(tail(c)), primitive_constants);


function setup_environment() {
  const primitive_symbols = append(primitive_function_symbols, primitive_constant_symbols);
  const primitive_symbol_types = map((symbol) => 'constant_declaration', primitive_symbols);
  return extend_environment(primitive_symbols,
                            primitive_symbol_types,
                            append(primitive_function_objects, primitive_constant_values),
                            the_empty_environment);
}

const the_global_environment = setup_environment();

/* ---------------------------------- driven ------------------------------- */

const input_prompt = 'M-evaluate input: ';
const output_prompt = 'M-evaluate value: ';

function driver_loop(env, history) {
  const input = user_read(history);
  if (is_null(input)) {
    display('evaluator terminated');
  } else {
    const program = parse(input);
    const locals = scan_out_declarations(program);
    const unassigned = list_of_unassigned(locals);
    const symbols = list_of_symbol(locals);
    const types = list_of_symbol_type(locals);
    const program_env = extend_environment(symbols, types, unassigned, env);
    const output = actual_value(program, program_env);
    const print_str = user_print(output_prompt, output);
    const new_history = history
                        + '\n'
                        + input 
                        + '\n'
                        + print_str
                        + '\n'
                        + input_prompt;
    return driver_loop(program_env, new_history);
  }
}

function user_read(prompt_string) {
  return prompt(prompt_string);
}

function user_print(string, object) {
  function prepare(object) {
      return is_compound_function(object)
             ? "< compound-function >"
             : is_primitive_function(object)
             ? "< primitive-function >"
             : is_pair(object)
             ? pair(prepare(head(object)),
                    prepare(tail(object)))
             : object;
  }
  const print_str = string + " " + stringify(prepare(object));
  display(print_str);
  return print_str;
}

// driver_loop(the_global_environment, '\n --- session start---\n' + input_prompt);

const e = (str) => {
  return actual_value(parse(str), the_global_environment);
};

e(`{
  function pair(x, y) {	
    return m => m(x, y);
  }
  function head(z) {    
    return z((p, q) => p);
  }
  function tail(z) {
    return z((p, q) => q);
  }
  function list_ref(items, n) {	
    return n === 0
           ? head(items)
           : list_ref(tail(items), n - 1);
  }
  function map(fun, items) {	   
    return is_null(items)
           ? null
           : pair(fun(head(items)),
                  map(fun, tail(items)));
  }
  function list(x, ...rest) {
    return m => m(x, list(...rest));
  }
  

  function scale_list(items, factor) {
      return map(x => x * factor, items);
    }
  function add_lists(list1, list2) {
    return is_null(list1)
            ? list2
            : is_null(list2)    
            ? list1
            : pair(head(list1) + head(list2),
                  add_lists(tail(list1), tail(list2)));
  }
    const ones = pair(1, ones);
    const integers = pair(1, add_lists(ones, integers));
    list_ref(integers, 17);
}`);


// let count = 0;
// function id(x) {
//   count = count + 1;
//   return x;
// }

// function square(x) {
//   return x * x;
// }
// // exercise 4.27
// // const t = get_time();
// function power(x, n) {
//   if (n === 1) {
//     return x;
//   }
//   return x * power(x, n - 1);
// }

// power(power(1, 100), 1000);

/**
 * power(1, 100) * power(power(1, 100), 99)
 * power(1, 100) * power(1, 100) * power(power(1, 100), 98);
 * power(1, 100) * power(1, 100) * power(1, 100) * power(power(1, 100), 97);...
 * ...
 * ...
 * power(1, 100) * power(1, 100) * ......... power(1, 100) * power(power(1, 100), 1)
 * power(1, 100) * power(1, 100) * ......... power(1, 100) * power(1, 100)
 * 
 */
