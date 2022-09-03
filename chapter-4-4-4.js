function assoc(key, records) {
  return is_null(records)
         ? undefined
         : equal(key, head(head(records)))
         ? head(records)
         : assoc(key, tail(records));
}

/* ---------------------------- table ----------------------- */
function make_table() {
  const local_table = list("*table*");
  function lookup(key_1, key_2) {
      const subtable = assoc(key_1, tail(local_table));
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
          set_tail(local_table,
                   pair(list(key_1, pair(key_2, value)),
                        tail(local_table)));
      } else {
          const record = assoc(key_2, tail(subtable));
          if (is_undefined(record)) {
              set_tail(subtable,
                       pair(pair(key_2, value), tail(subtable)));
          } else {
              set_tail(record, value);
          }
      }
  }
  function dispatch(m) {
      return m === "lookup"
             ? lookup
             : m === "insert"
             ? insert
             : error(m, "unknown operation -- table");
  }
  return dispatch;
}

const operation_table = make_table();
const get = operation_table("lookup");
const put = operation_table("insert");
const set = (key, value) => put(key, 'js-evaluator', value);

const input_prompt = "Query input:";
const output_prompt = "Query results:";

/* ------------------------------ driver ------------------ */
function query_driver_loop() {
  const user_input = user_read(input_prompt);
  if (user_input === null) {
    return null;
  }
  const input = user_input + ';';
  if (is_null(input)) {
    display('evaluator terminated');
  } else {
    const expression = parse(input);
    const query = convert_to_query_syntax(expression);
    if (is_assertion(query)) {
      add_rule_or_assertion(assertion_body(query));
      display('Assertion added to data base.');
    } else {
      display(output_prompt);
      display_stream(
        stream_map(
          frame =>
            unparse(instantiate_expression(query, frame)),
          evaluate_query(query, singleton_stream(null))
        )
      );
    }
    return query_driver_loop();
  }
}

/* ------------------------- evaluate ------------------ */

function evaluate_query(query, frame_stream) {
  const qfun = get(type(query), 'evaluate_query');
  return is_undefined(qfun)
    ? simple_query(query, frame_stream)
    : qfun(contents(query), frame_stream);
}

/* ------------------------- simple query ----------------------- */
function simple_query(query_pattern, frame_stream) {
  return stream_flatmap(frame => 
            stream_append_delayed(
                find_assertions(query_pattern, frame),
                () => apply_rules(query_pattern, frame)),
            frame_stream);
}

/* ---------------------------- compound queries ------------------- */
function conjoin(conjuncts, frame_stream) {
  return is_empty_conjunction(conjuncts)
          ? frame_stream
          : conjoin(rest_conjuncts(conjuncts),
                    evaluate_query(first_conjunct(conjuncts),
                                   frame_stream));
}
put('and', 'evaluate_query', conjoin);

function disjoin(disjuncts, frame_stream) {
  return is_empty_disjunction(disjuncts)
    ? null
    : interleave_delayed(
          evaluate_query(first_disjunct(disjuncts), frame_stream),
          () => disjoin(rest_disjuncts(disjuncts), frame_stream)
    );
}

put('or', 'evaluate_query', disjoin);

function negate(exps, frame_stream) {
  return stream_flatmap(
            frame => 
              is_null(evaluate_query(negated_query(exps),
                                     singleton_stream(frame)))
              ? singleton_stream(frame)
              : null,
            frame_stream);
}
put('not', 'evaluate_query', negate);

function javascript_predicate(exps, frame_stream) {
  return stream_flatmap(
            frame => 
              evaluate_query(instantiate_expression(
                              javascript_predicate_expression(exps),
                              frame),
                             the_global_environment)
              ? singleton_stream(frame)
              : null,
            frame_stream);
}

put('javascript_predicate', 'evaluate_query', javascript_predicate);

const max_display = 9;
function display_stream(s) {
    function display_stream_iter(st, n) {
        if (is_null(st)) {
        } else if (n === 0) {
            display('', "...");
        } else {
            display(head(st));
            display_stream_iter(stream_tail(st), n - 1);
        }
    }
    display_stream_iter(s, max_display);
}

function always_true(ignore, frame_stream) {
  return frame_stream;
}
put('always_true', 'evaluate_query', always_true);

/* --------------------------------- assertion --------------------------- */
function find_assertions(pattern, frame) {
  return stream_flatmap(
      datum => check_an_assertion(datum, pattern, frame),
      fetch_assertions(pattern, frame)
  );
}

function check_an_assertion(assertion, query_pat, query_frame) {
  const match_result = pattern_match(query_pat, assertion, query_frame);
  return match_result === 'failed'
    ? null
    : singleton_stream(match_result);
}

function pattern_match(pattern, data, frame) {
  return frame === 'failed'
          ? 'failed'
          : equal(pattern, data)
          ? frame
          : is_query_variable(pattern)
          ? extend_if_consistent(pattern, data, frame)
          : is_pair(pattern) && is_pair(data)
          ? pattern_match(tail(pattern),
                          tail(data),
                          pattern_match(head(pattern),
                                        head(data),
                                        frame))
          : 'failed';
}

function extend_if_consistent(variable, data, frame) {
  const binding = binding_in_frame(variable, frame);
  return is_undefined(binding)
          ? extend(variable, data, frame)
          : pattern_match(binding_value(binding), data, frame);
}

function apply_rules(pattern, frame) {
  return stream_flatmap(rule => apply_a_rule(rule, pattern, frame),
                        fetch_rules(pattern, frame));
}

function apply_a_rule(rule, query_pattern, query_frame) {
  const clean_rule = rename_variables_in(rule);
  const unify_result = unify_match(query_pattern, conclusion(clean_rule), query_frame);

  return unify_result === 'failed'
         ? null
         : evaluate_query(rule_body(clean_rule),
                          singleton_stream(unify_result));
}

function rename_variables_in(rule) {
  const rule_application_id = new_rule_application_id();
  function tree_walk(exp) {
    return is_query_variable(exp)
           ? make_new_variable(exp, rule_application_id)
           : is_pair(exp)
           ? pair(tree_walk(head(exp)),
                  tree_walk(tail(exp)))
           : exp;
  }
  return tree_walk(rule);
}

function unify_match(p1, p2, frame) {
  return frame === 'failed'
         ? 'failed'
         : equal(p1, p2)
         ? frame
         : is_query_variable(p1)
         ? extend_if_possible(p1, p2, frame)
         : is_query_variable(p2)
         ? extend_if_possible(p2, p1, frame)
         : is_pair(p1) && is_pair(p2)
         ? unify_match(tail(p1), tail(p2), unify_match(head(p1), head(p2), frame))
         : 'failed';
}

function extend_if_possible(variable, value, frame) {
  const binding = binding_in_frame(variable, frame);
  if (! is_undefined(binding)) {
    return unify_match(binding_value(binding),
                                     value, frame);
  } else if (is_query_variable(value)) {
    const binding = binding_in_frame(value, frame);
    return ! is_undefined(binding)
           ? unify_match(variable,
                         binding_variable(binding),
                         frame)
           : extend(variable, value, frame);
  } else if (depends_on(value, variable, frame)) {
    return 'failed';
  } else {
    return extend(variable, value, frame);
  }
}

function depends_on(expreesion, variable, frame) {
  function tree_walk(e) {
    if (is_query_variable(e)) {
      if (equal(variable, e)) {
        return true;
      } else {
        const b = binding_in_frame(e, frame);
        return is_undefined(b)
               ? false
               : tree_walk(binding_value(b));
      }
    } else {
        return is_pair(e)
               ? tree_walk(head(e)) || tree_walk(tail(e))
               : false;
    }
  }
  return tree_walk(expreesion);
}

/* ---------------------------- maintaining data-base -----------------*/

function fetch_assertions(pattern, frame) {
  return get_indexed_assertions(pattern);
}

function get_indexed_assertions(pattern) {
  return get_stream(index_key_of(pattern), 'assertion-stream');
}

function get_stream(key1, key2) {
  const s = get(key1, key2);
  return is_undefined(s) ? null : s;
}

function fetch_rules(pattern, frame) {
  return get_indexed_rules(pattern);
}

function get_indexed_rules(pattern) {
  return get_stream(index_key_of(pattern), 'rule-stream');
}

function add_rule_or_assertion(assertion) {
  return is_rule(assertion)
         ? add_rule(assertion)
         : add_assertion(assertion);
}

function add_assertion(assertion) {
  store_assertion_in_index(assertion);
  return 'ok';
}

function add_rule(rule) {
  store_rule_in_index(rule);
  return 'ok';
}

function store_assertion_in_index(assertion) {
  const key = index_key_of(assertion);
  const current_assrtion_stream = get_stream(key, 'assertion-stream');
  put(key, 'assertion-stream',
      pair(assertion, () => current_assrtion_stream));
}

function store_rule_in_index(rule) {
  const pattern = conclusion(rule);
  const key = index_key_of(pattern);
  const current_rule_stream = get_stream(key, 'rule-stream');
  put(key, 'rule-stream', 
      pair(rule, () => current_rule_stream));
}

function index_key_of(pattern) {
  return head(pattern);
}

/* ------------------------------ stream operations ----------------------- */

function stream_map(f, s) {
  return is_null(s)
    ? null
    : pair(f(head(s)),
           () => stream_map(f, stream_tail(s)));
}

function stream_append_delayed(s1, delayed_s2) {
  return is_null(s1)
          ? delayed_s2()
          : pair(head(s1), 
                 () => stream_append_delayed(stream_tail(s1), delayed_s2));
}

function interleave_delayed(s1, delayed_s2) {
  return is_null(s1)
         ? delayed_s2()
         : pair(head(s1),
                () => interleave_delayed(delayed_s2(),
                                         () => stream_tail(s1)));
}

function stream_flatmap(fun, s) {
  return flatten_stream(stream_map(fun, s));
}

function flatten_stream(stream) {
  return is_null(stream)
         ? null
         : interleave_delayed(head(stream),
                               () => flatten_stream(stream_tail(stream)));
}

function singleton_stream(x) {
  return pair(x, () => null);
}

/* ---------------------- query ----------------- */
function convert_to_query_syntax(exp) {
  if (is_application(exp)) {
    const function_symbol = symbol_of_name(function_expression(exp));
    if (function_symbol === 'javascript_predicate') {
      return pair(function_symbol, arg_expreesions(exp));
    } else {
      const processed_args = map(convert_to_query_syntax,
                                arg_expreesions(exp));
      return function_symbol === 'pair'
              ? pair(head(processed_args), head(tail(processed_args)))
              : function_symbol === 'list'
              ? processed_args
              : pair(function_symbol, processed_args);
    }
  } else if (is_query_variable(exp)) {
    return exp;
  } else {
    return literal_value(exp);
  }
}

let rule_counter = 0;
function new_rule_application_id() {
  rule_counter = rule_counter + 1;
  return rule_counter;
}

function make_new_variable(variable, rule_application_id) {
  return make_name(symbol_of_name(variable) + '_' + 
  stringify(rule_application_id));
}


function instantiate_expression(expreesion, frame) {
  return is_query_variable(expreesion)
         ? convert(instantiate_term(expreesion, frame))
         : is_pair(expreesion)
         ? pair(instantiate_expression(head(expreesion), frame),
                instantiate_expression(tail(expreesion), frame))
         : expreesion;
}

function instantiate_term(term, frame) {
  if (is_query_variable(term)) {
    const binding = binding_in_frame(term , frame);
    return is_undefined(binding)
           ? term
           : instantiate_term(binding_value(binding), frame);
  } else if (is_pair(term)) {
    return pair(instantiate_term(head(term), frame),
                instantiate_term(tail(term), frame));
  } else {
    return term;
  }
}


function convert(term) {
  return is_query_variable(term)
         ? term
         : is_pair(term)
         ? make_application(make_name(pair),
                            list(convert(head(term)),
                                 convert(tail(term))))
         : make_literal(term);
}




/* --------------------------------------- unparse ----------------------------*/

function unparse(exp) {
  display('unparse');
  display(exp);
  return is_literal(exp)
         ? stringify(literal_value(exp))
         : is_assignment(exp)
         ? symbol_of_name(exp)
         : is_list_construction(exp)
         ? unparse(make_application(make_name('list'),
                                    element_expressions(exp)))
         : is_application(exp) && is_name(function_expression(exp))
         ? symbol_of_name(function_expression(exp)) +
              '(' + 
              comma_separated(map(unparse, arg_expreesions(exp))) +
              ')'
         : is_binary_operator_combination(exp)
         ? '(' + unparse(first_operand(exp)) +
            ' ' + operator_symbol(exp) + 
            ' ' + unparse(second_operand(exp)) + 
            ')'
         : error(exp, 'unknown syntax -- unparse');
}

function comma_separated(strings) {
  return accumulate((s, acc) => s + (acc === '' ? '' : ',' + acc),
                    '',
                    strings);
}

function is_list_construction(exp) {
  return (is_literal(exp) && is_null(literal_value(exp))) ||
         (is_application(exp) && is_name(function_expression(exp)) &&
          symbol_of_name(function_expression(exp)) === 'pair' &&
          is_list_construction(head(tail(arg_expreesions(exp)))));
}

function element_expressions(list_constr) {
  return is_literal(list_constr)
         ? null
         : pair(head(arg_expreesions(list_constr)),
                element_expressions(
                  head(tail((arg_expreesions(list_constr))))));
}

/* ------------------------------ pred & selector ------------------------ */
function is_empty_conjunction(exps) {
  return is_null(exps);
}

function first_conjunct(exps) {
  return head(exps);
}

function rest_conjuncts(exps) {
  return tail(exps);
}

function is_empty_disjunction(exps) {
  return is_null(exps);
}

function first_disjunct(exps) {
  return head(exps);
}

function rest_disjuncts(exps) {
  return tail(exps);
}

function negated_query(exps) {
  return head(exps);
}

function javascript_predicate_expression(exps) {
  return head(exps);
}

function type(exp) {
  return is_pair(exp)
         ? head(exp)
         : error(exp, 'unknown expreesion type');
}

function contents(exp) {
  return is_pair(exp)
         ? tail(exp)
         : error(exp, 'unknown expreesion contents');
}

function is_assertion(exp) {
  return type(exp) === 'assert';
}

function assertion_body(exp) {
  return head(contents(exp));
}

function is_rule(assertion) {
  return is_tagged_list(assertion, 'rule');
}
function conclusion(rule) {
  return head(tail(rule));
}

function rule_body(rule) {
  return is_null(tail(tail(rule)))
    ? list('always_true')
    : head(tail(tail(rule)));
}

function make_binding(variable, value) {
  return pair(variable, value);
}

function binding_variable(binding) {
  return head(binding);
}

function binding_value(binding) {
  return tail(binding);
}

function binding_in_frame(variable, frame) {
  return assoc(variable, frame);
}

function extend(variable, value, frame) {
  return pair(make_binding(variable, value), frame);
}

function is_name(component) {
  return is_tagged_list(component, 'name');
}

function is_application(component) {
  return is_tagged_list(component, 'application');
}

function is_literal(component) {
  return is_tagged_list(component, 'literal');
}

function is_query_variable(component) {
  return is_name(component);
}

/* ------------------------ js evaluator --------------------- */
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

function evaluate(component, env) {
  return analyze(component)(env);
}

function analyze(component) {
  function analyze_generic() {
    const exact_analyze = get(head(component), 'js-evaluator');
    if (is_undefined(exact_analyze)) {
      error(head(component), 'analyze function not found.');
    }
    return exact_analyze(component);
  }
  return analyze_generic();
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
  return env => make_return_value(rfun(env));
}
set('return_statement', analyze_return_statement);

/** 
 * name
 */
function symbol_of_name(component) {
  return head(tail(component));
}

function make_name(symbol) {
  return list("name", symbol);
} 

function analyze_name(component) {
  const name = symbol_of_name(component);
  return env => lookup_symbol_value(name, env);
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
  return env => literal_value(component);
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
  return env => execute_application(ffun(env),
                                    map(afun => afun(env), afuns));
}

function execute_application(fun, args) {
  if (is_primitive_function(fun)) {
    return apply_primitive_function(fun, args);
  } else if (is_compound_function(fun)) {
    const params = function_parameters(fun);
    const symbol_type = map((symbol) => 'variable_declaration', params);
    const result = function_body(fun)(extend_environment(params,
                                                         symbol_type,
                                                         args,
                                                         function_environment(fun)));
    return is_return_value(result)
      ? return_value_content(result)
      : undefined;
  } else {
    error(fun, "unknkow function type -- execute_application");
  }
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
  return env => is_truthy(pfun(env))
    ? cfun(env)
    : afun(env);
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

function analyze_sequence(stmts) {
  function is_terminated_value (component) {
    return is_return_value(component) 
        || is_break_flag(component) 
        || is_continue_flag(component);
  }
  function sequentially(fun1, fun2) {
    return env => {
      const fun1_val = fun1(env);
      return is_terminated_value(fun1_val)
        ? fun1_val
        : fun2(env);
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
      ? env => undefined
      : loop(head(funs), tail(funs));
}

set('sequence', (component) => analyze_sequence(sequence_statements(component)));

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

function analyze_assignment(component) {
  const symbol = assignment_symbol(component);
  const vfun = analyze(assignment_value_expression(component));
  return env => {
    const value = vfun(env);
    assign_symbol_value(symbol, value, env);
    return value;
  };
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

  return env => bfun(extend_environment(symbols,
                                           types,
                                           unassigneds,
                                          env));
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

function analyze_declaration(component) {
  const symbol = declaration_symbol(component);
  const vfun = analyze(declaration_value_expression(component));
  return env => {
    assign_symbol_value(symbol, vfun(env), env);
    return undefined;
  };
}
set('constant_declaration', analyze_declaration);
set('variable_declaration', analyze_declaration);

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

function analyze_labmda_expreesion(component) {
  const params = lambda_parameter_symbols(component);
  const bfun = analyze(lambda_body(component));
  return env => make_function(params, bfun, env);
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
                                 list('+', (x, y) => x + y),
                                 list('<', (x, y) => x < y),
                                 list('-', (x, y) => x - y),
                                 list('===', (x, y) => x === y),
                                 list('display', display));

const primitive_constants = list(list('undefined', undefined));

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

function user_read(prompt_string) {
  return prompt(prompt_string);
}

query_driver_loop();


/*
  convert_to_query_syntax(parse('job($x, "worker");'));
  assert(job('tt', 'worker'))
  job($x, 'worker')
  assert(job(list('li', 'silu'), 'worker'))
  assert(job(list('li', 'kezhong'), 'worker'))
  job(pair('li', $x), $y)
*/