// exercise 4.34
// function an_integer_starting_from(n) {
//   return amb(n, an_integer_starting_from(n + 1));
// }
// function a_pythogorean_triple() {    
//   const k = an_integer_starting_from(1);
//   const i = an_integer_between(1, k - 1);
//   const j = an_integer_between(1, k - 1);
//   require(i <= j);
//   require(i + j > k);
//   require(i * i + j * j === k * k);
//   return list(i, j, k);
// }

// a_pythogorean_triple();
// // Press "Run" for the first solution. Type
// // retry
// // in the REPL on the right, for more solutions

// // exercise 4.38

// function distinct(items) {	
//   return is_null(items)
//          ? true
//          : is_null(tail(items))
//          ? true
//          : is_null(member(head(items), tail(items)))
//          ? distinct(tail(items))
//          : false;
// }

// function office_move() {
//   const alyssa = amb(1, 2, 3, 4);
//   const ben = amb(2, 3, 4, 5);
//   const cy = amb(2, 3, 4);
//   const lem = amb(1, 2, 3, 4, 5);
//   const louis = amb(1, 2, 3, 4, 5);
//   require(lem > ben);
//   require(math_abs(louis - cy) !== 1);
//   require(math_abs(cy - ben) !== 1);
//   require(distinct(list(alyssa, ben, cy, lem, louis)));
//   return list(list("alyssa", alyssa),
//               list("ben", ben),
//               list("cy", cy),
//               list("lem", lem),
//               list("louis", louis));
// }

/* ---------------------------------------------- nondeterministic evaluator -------------------------*/
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
        error('can not access an unassigned variable');
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

function ambeval(component, env, succeed, fail) {
  return analyze(component)(env, succeed, fail);
}

function analyze(component) {
  function analyze_generic() {
    const exact_analyze = get(head(component));
    if (is_undefined(exact_analyze)) {
      error(head(component), 'analyze function not found.');
    }
    return exact_analyze(component);
  }
  return analyze_generic();
}

/** 
 * amb
*/
function is_amb(component) {
  return is_tagged_list(component, 'application')
    && is_name(function_expression(component))
    && symbol_of_name(function_expression(component)) === 'amb';
}

function amb_choices(component) {
  return arg_expreesions(component);
}

function analyze_amb(component) {
  const cfuns = map(analyze, amb_choices(component));
  return (env, succeed, fail) => {
    function try_next(choices) {
      return is_null(choices)
        ? fail()
        : head(choices)(env,
                        succeed,
                        () => try_next(tail(choices)));
    }
    return try_next(cfuns);
  };
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

function analyze_return_statement(component) {
  const rfun = analyze(return_expression(component));
  return (env, succeed, fail) => 
    rfun(env,
         (val, fail2) => succeed(make_return_value(val), fail2),
         fail);
}
set('return_statement', analyze_return_statement);

/** 
 * name
 */
function is_name(component) {
  return is_tagged_list(component, 'name');
}

function symbol_of_name(component) {
  return head(tail(component));
}

function make_name(symbol) {
  return list("name", symbol);
} 

function analyze_name(component) {
  const name = symbol_of_name(component);
  return (env, succeed, fail) => succeed(lookup_symbol_value(name, env), fail);
}
 
set('name', analyze_name);


/**
 * literal --- 字面量
 */
function literal_value(component) {
  return head(tail(component));
}

function make_literal(value) {
  return list('literal', value);
}

function analyze_literal(component) {
  return (env, succeed, fail) => succeed(literal_value(component), fail);
}
set('literal', analyze_literal);

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

function analyze_application(component) {
  const ffun = analyze(function_expression(component));
  const afuns = map(analyze, arg_expreesions(component));
  if (is_amb(component)) {
    return analyze_amb(component);
  }
  return (env, succeed, fail) => 
    ffun(env,
         (fun, fail2) => get_args(afuns,
                                  env,
                                  (args, fail3) =>
                                    execute_application(fun, args, succeed, fail3),
                                  fail2),
         fail);
}

function get_args(afuns, env, succeed, fail) {
  return is_null(afuns)
    ? succeed(null, fail)
    : head(afuns)(env,
                 (arg, fail2) => 
                    get_args(tail(afuns),
                             env,
                             (args, fail3) => 
                              succeed(pair(arg, args), fail3),
                              fail2),
                 fail);
}

function execute_application(fun, args, succeed, fail) {
  return is_primitive_function(fun)
         ? succeed(apply_primitive_function(fun, args),
                   fail)
         : is_compound_function(fun) 
         ? function_body(fun)(
               extend_environment(function_parameters(fun),
                                  map((symbol) => 'variable_declaration', function_parameters(fun)),
                                  args,
                                  function_environment(fun)),
               (body_result, fail2) => 
                 succeed(is_return_value(body_result) 
                         ? return_value_content(body_result)
                         : undefined,
                         fail2),
               fail)
         : error(fun, "unknown function type - execute_application");
}

set('application', analyze_application);

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

function analyze_conditional(component) {
  const pfun = analyze(conditional_predicate(component));
  const cfun = analyze(conditional_consequent(component));
  const afun = analyze(conditional_alternative(component));
  return (env, succeed, fail) => 
    pfun(env,
      (pred_value, fail2) =>
        is_truthy(pred_value)
          ? cfun(env, succeed, fail2)
          : afun(env, succeed, fail2),
          fail);
}
set('conditional_expression', analyze_conditional);
set('conditional_statement', analyze_conditional);

/**
 * sequence --- 多句语句
 */
function is_sequence(component) {
  return is_tagged_list(component, "sequence");
}
function sequence_statements(component) {   
  return head(tail(component));
}

function analyze_sequence(stmts) {
  function is_terminated_value (component) {
    return is_return_value(component) 
        || is_break_flag(component) 
        || is_continue_flag(component);
  }
  function sequentially(a, b) {
    return (env, succeed, fail) => {
      a(env,
        (a_value, fail2) => 
          is_terminated_value(a_value)
            ? succeed(a_value, fail2)
            : b(env, succeed, fail2),
          fail);
    };
  }
  function loop(first_fun, rest_funs) {
    return is_null(rest_funs)
      ? first_fun
      : loop(sequentially(first_fun, head(rest_funs)),
             tail(rest_funs));
    }
    const funs = map(analyze, stmts);
    return is_null(funs)
      ? (env, succeed, fail) => undefined
      : loop(head(funs), tail(funs));
}

set('sequence', (component) => analyze_sequence(sequence_statements(component)));

/** 
 * assignment --- 赋值语句
 */
function assignment_symbol(component) {
  return head(tail(head(tail(component))));
}
function assignment_value_expression(component) {
  return head(tail(tail(component)));
}

function analyze_assignment(component) {
  const symbol = assignment_symbol(component);
  const vfun = analyze(assignment_value_expression(component));
  return (env, succeed, fail) => 
    vfun(env, 
         (val, fail2) => {
           const old_value = lookup_symbol_value(symbol, env);
           assign_symbol_value(symbol, val, env);
            return succeed(val, () => {
              assign_symbol_value(symbol, old_value, env);
              return fail2();
            });
         },
         fail);
}

set('assignment', analyze_assignment);

/**
 *  block --- 语句块 
 */
function block_body(component) {
  return head(tail(component));
}

function analyze_block(component) {
  const body = block_body(component);
  const bfun = analyze(body);
  const locals = scan_out_declarations(body);
  const symbols = list_of_symbol(locals);
  const types = list_of_symbol_type(locals);
  const unassigneds = list_of_unassigned(locals);

  return (env, succeed, fail) => bfun(extend_environment(symbols,
                                           types,
                                           unassigneds,
                                          env), 
                                       succeed, 
                                       fail);
}
set('block', analyze_block);

/** 
 * declaration --- 声明语句
 */
function is_declaration(component) {
  return is_tagged_list(component, "constant_declaration") ||
         is_tagged_list(component, "variable_declaration") ||
         is_tagged_list(component, "function_declaration");
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

function analyze_declaration(component) {
  const symbol = declaration_symbol(component);
  const vfun = analyze(declaration_value_expression(component));
  return (env, succeed, fail) => {
    vfun(env,
      (val, fail2) => {
        assign_symbol_value(symbol, val, env);
        return succeed(undefined, fail2);
      },
    fail);
  };
}
set('constant_declaration', analyze_declaration);
set('variable_declaration', analyze_declaration);

/**
 * lambda --- 箭头函数
 */
function make_lambda_expression(paramters, body) {
  return list('lambda_expression', paramters, body);
}

function lambda_body(component) {
  return head(tail(tail(component)));
}

function lambda_parameter_symbols(component) {
  return map(symbol_of_name, head(tail(component)));
}

function analyze_labmda_expreesion(component) {
  const params = lambda_parameter_symbols(component);
  const bfun = analyze(lambda_body(component));
  return (env, succeed, fail) => succeed(make_function(params, bfun, env), fail);
}
set('lambda_expression', analyze_labmda_expreesion);

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

function analyze_function_declaration(component) {
  return analyze(function_decl_to_constant_decl(component));
}
set('function_declaration', analyze_function_declaration);

/**
 * operator
 */
function is_unary_operator_combination(component) {	    
  return is_tagged_list(component, "unary_operator_combination");
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
function analyze_operation(component) {
  return analyze(operator_combination_to_application(component));
}
set("unary_operator_combination", analyze_operation);
set("binary_operator_combination", analyze_operation);

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

function while_to_application(component) {
  const pfun = analyze(while_predicate(component));
  const bfun = analyze(while_body(component));
  return env => 
  while_loop(() => is_truthy(pfun(env)), 
             () => bfun(env));
}

function analyze__while(component) {
  return while_to_application(component);
}
set('while_loop', analyze__while);

function is_break_flag(component) {
  return is_tagged_list(component, 'break_flag');
}
function make_break_flag() {
  return list('break_flag');
}
set('break_statement', (component) => env => make_break_flag());


function is_continue_flag(component) {
  return is_tagged_list(component, 'continue_flag');
}
function make_continue_flag() {
  return list('continue_flag');
}
set('continue_statement', (component) => env => make_continue_flag());

/* ---------------------------------- set up ------------------------------- */

const primitive_functions = list(list('head', head),
                                 list('tail', tail),
                                 list('pair', pair),
                                 list('is_null', is_null),
                                 list('!', (x) => !x),
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

const input_prompt = 'amb-evaluate input: ';
const output_prompt = 'amb-evaluate value: ';

function driver_loop(env) {
  function internal_loop(retry) {
    const input = user_read(input_prompt);
    if (is_null(input)) {
      display("evaluator terminated");
    } else if (input === 'retry') {
      return retry();
    } else {
      display("starting a new problem");
      const program = parse(input);
      const locals = scan_out_declarations(program);
      const unassigned = list_of_unassigned(locals);
      const symbols = list_of_symbol(locals);
      const types = list_of_symbol_type(locals);
      const program_env = extend_environment(symbols, types, unassigned, env);
      return ambeval(
        program,
        program_env,
        // ambeval success
        (val, next_alternative) => {
          user_print(output_prompt, val);
          return internal_loop(next_alternative);
        },
        // ambeval failure
        () => {
          display('There are no more values of');
          display(input);
          return driver_loop(program_env);
        });
    }
  }
  return internal_loop(() => {
    display("There is no current problem");
    return driver_loop(env);
  });
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

driver_loop(the_global_environment);



// SICP JS 4.3.2
/* -------------------------------- nature language ----------------------- */
// let not_yet_parsed = null;

// function parse_word(word_list) {      
//     require(! is_null(not_yet_parsed));
//     require(! is_null(member(head(not_yet_parsed), tail(word_list))));
//     const found_word = head(not_yet_parsed);
//     not_yet_parsed = tail(not_yet_parsed);
//     return list(head(word_list), found_word);
// }

// const prepositions = list("prep", "for", "to", "in", "by", "with");

// function parse_prepositional_phrase() {      
//     return list("prep-phrase",
//                 parse_word(prepositions),
//                 parse_noun_phrase());
// }

// const nouns = list("noun", "student", "professor", "cat", "class");

// const verbs = list("verb", "studies", "lectures", "eats", "sleeps");

// const adjs = list('adjective', 'happy', 'lovely');

// const advs = list('adverb', 'quickly', 'slowly');

// const articles = list("article", "the", "a");


// function parse_simple_noun_phrase() {      
//     return list("simple-noun-phrase",
//                 parse_word(articles),
//                 parse_adj_none());
// }


// function parse_adj_none() {
//   const noun = parse_word(nouns);
//   return amb(noun, list('adjective-noun', parse_word(adjs), noun));
// }

// function parse_noun_phrase() {
//     function maybe_extend(noun_phrase) {
//         return amb(noun_phrase,
//                    maybe_extend(list("noun-phrase",
//                                      noun_phrase,
//                                      parse_prepositional_phrase())));
//     }
//     return maybe_extend(parse_simple_noun_phrase());
// }

// function parse_sentence() {
//     return list("sentence",
//                 parse_noun_phrase(),
//                 parse_verb_phrase());
// }
// function parse_verb_phrase() {
//     function maybe_extend(verb_phrase) {
//         return amb(verb_phrase,
//                    maybe_extend(list("verb-phrase",
//                                      verb_phrase,
//                                      parse_prepositional_phrase())));
//     }		   
//     return maybe_extend(parse_word(verbs));
// }

// function parse_input(input) {
//     not_yet_parsed = input;
//     const sent = parse_sentence();
//     require(is_null(not_yet_parsed));
//     return sent;
// }

// parse_input(list("the", "professor", "lectures",
//                  "to", "the", "student", "with", "the", "cat"));

function require(p) {
  if (! p) {
      amb();
  } else {}
}
let a = amb(1, 2, 3);
require(a === 2);
display(a);