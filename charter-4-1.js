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

/**
 * environment manipulate
 */
function lookup_symbol_value(symbol, env) {
    function env_loop(env) {
      function scan(symbols, vals) {
        return is_null(symbols)
          ? env_loop(enclosing_environment(env))
          : symbol === head(symbols)
          ? head(vals)
          : scan(tail(symbols), tail(vals));
      }
      if (env === the_empty_environment) {
        error(symbol, 'unbound name');
      } else {
        const frame = first_frame(env);
        return scan(frame_symbols(frame), frame_values(frame));
      }
    }
    return env_loop(env);
}

function assign_symbol_value(symbol, value, env) {
  function env_loop(env) {
    function scan(symbols, vals) {
      return is_null(symbols)
        ? env_loop(enclosing_environment(env))
        : symbol === head(symbols)
        ? set_head(vals, value)
        : scan(tail(symbols), tail(vals));
    }
    if (env === the_empty_environment) {
      error(symbol, 'unbound name');
    } else {
      const frame = first_frame(env);
      return scan(frame_symbols(frame), frame_values(frame));
    }
  }
  env_loop(env);
}

function make_frame(symbols, values) {
  return pair(symbols, values);
}

function frame_symbols(frame) {
  return head(frame);
}

function frame_values(frame) {
  return tail(frame);
}

function extend_environment(symbols, values, base_env) {
  return length(symbols) === length(values)
    ? pair(make_frame(symbols, values), base_env)
    : error('length error');
}

function setup_environment() {
  return extend_environment(append(primitive_function_symbols, primitive_constant_symbols),
                            append(primitive_function_objects, primitive_constant_values),
                            the_empty_environment);
}

function enclosing_environment(env) {
  return tail(env);
}

function first_frame(env) {
  return head(env);
}

const primitive_functions = list(list('head', head),
                                 list('tail', tail),
                                 list('pair', pair),
                                 list('is_null', is_null),
                                 list('+', (x, y) => x + y));

const primitive_function_symbols =
    map(f => head(f), primitive_functions);

const primitive_constants = list(list('undefined', undefined),
                                 list('math_PI', math_PI));

const primitive_constant_symbols =
    map(c => head(c), primitive_constants);


const primitive_constant_values =
    map(c => head(tail(c)), primitive_constants);

const primitive_function_objects =
    map(f => list("primitive", head(tail(f))),
        primitive_functions);

const the_empty_environment = null;
const the_global_environment = setup_environment();


function list_of_values(exps, env) {
  return my_map(exps, env);
}

function list_of_unassigned(symbols) {
  return map(symbol => "*unassigned*", symbols);
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

function unparse(component) {
  return is_literal(component)
    ? literal_unparse(component)
    : is_name(component)
    ? name_unparse(component)
    : is_application(component)
    ? application_unparse(component)
    : is_operator_combination(component)
    ? operator_combination_unparse(component)
    : is_conditional(component)
    ? conditional_unparse(component)
    : is_lambda_expression(component)
    ? lambda_expreesion_unparse(component)
    : is_sequence(component)
    ? sequence_unparse(component)
    : is_block(component)
    ? block_unparse(component)
    : is_return_statement(component)
    ? return_statement_unparse(component)
    : is_function_declaration(component)
    ? function_declaration_unparse(component)
    : is_declaration(component)
    ? declaration_unparse(component)
    : is_assignment(component)
    ? assignment_unparse(component)
    : error(component, "unknow syntax -- unparse");
}


function evaluate(component, env) {
  return is_literal(component)
    ? literal_value(component)
    : is_name(component)
    ? lookup_symbol_value(symbol_of_name(component), env)
    : is_application(component)
    ? apply(evaluate(function_expression(component), env),
            list_of_values(arg_expreesions(component), env))
    : is_operator_combination(component)
    ? evaluate(operator_combination_to_application(component), env)
    : is_conditional(component)
    ? eval_conditional(component, env)
    : is_lambda_expression(component)
    ? make_function(lambda_parameter_symbols(component), lambda_body(component), env)
    : is_sequence(component)
    ? eval_sequence(sequence_statements(component), env)
    : is_block(component)
    ? eval_block(component, env)
    : is_return_statement(component)
    ? eval_return_statement(component, env)
    : is_function_declaration(component)
    ? evaluate(function_decl_to_constant_decl(component), env)
    : is_declaration(component)
    ? eval_declaration(component, env)
    : is_assignment(component)
    ? eval_assignment(component)  
    : error(component, "unknow syntax -- evaluate");
}

function apply(fun, args) {
  if (is_primitive_function(fun)) {
    display('is primitive');
    return apply_primitive_function(fun, args);
  } else if (is_compound_function(fun)) {
    const result = evaluate(function_declaration_body(fun),
                             extend_environment(function_parameters(fun),
                                               args,
                                               function_environment(fun)));
    return is_return_value(result)
      ? return_value_content(result)
      : undefined;
  } else {
    error(fun, "unkonw function type -- apply");
  }
}

/**
 * return_statemnt --- 返回语句
 */
function is_return_statement(component) {
  return is_tagged_list(component, 'return_statement');
}

function is_return_value(component) {
  return is_tagged_list(component, 'return_value');
}

function return_value_content(value) {
  return head(tail(value));
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

function return_statement_unparse(component) {
  return 'return ' + unparse(return_expression(component));
}

function test_return_statemen_unparse() {
  display('--- return statement unparse ---');
  display(unparse(parse('function foo() {return 1;}')));
}

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

function name_unparse(component) {
  const symbol = symbol_of_name(component);
  // TO FIX
  return symbol;
}

function test_name_unparse() {
  display('--- test name unparse ---');
  display(unparse(parse('a;')));
}


/**
 * literal --- 字面量
 */

function is_literal(component) {
  return is_tagged_list(component, 'literal');
}

function literal_value(component) {
  return head(tail(component));
}

function make_literal(value) {
  return list('literal', value);
}

function literal_unparse(component) {
  const value = literal_value(component);
  return stringify(value);
}
function test_literal_unparse() {
  display('--- test literal unparse');
  display(unparse(parse("1.5;")));
  display(unparse(parse("'a';")));
  display(unparse(parse("true;")));
  display(unparse(parse("undefined;")));
  display(unparse(parse("null;")));
}

/** 
 * application --- 调用
 */
function is_application(component) {
  return is_tagged_list(component, 'application');
}

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

function argument_unparse(components) {
  return map_join(unparse, components, ',');
}

function application_unparse(component) {
  const fun_exp = function_expression(component);
  const arg_exp = arg_expreesions(component);
  if (is_name(fun_exp)) {
    return name_unparse(fun_exp) + '(' + argument_unparse(arg_exp) + ')';
  } else {
    return '(' + unparse(fun_exp) + '(' + argument_unparse(arg_exp) + ')'; 
  }
}

function test_application_unparse() {
  display('--- test application unparse ---');
  display(unparse(parse('foo(1 + 1, bar());')));
}

/**
 * conditional --- 三元表达式条件语句
 */

function is_conditional(component) {
  return is_tagged_list(component, 'conditional_expression');
}

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
  return head(tail(tail(component)));
}

function eval_conditional(component, env) {
  return is_truthy(evaluate(conditional_predicate(component), env))
    ? evaluate(conditional_consequent(component), env)
    : evaluate(conditional_alternative(component), env);
}

function conditional_unparse(component) {
  const predicate = unparse(conditional_predicate(component));
  const consequent = unparse(conditional_consequent(component));
  const alternative = unparse(conditional_alternative(component));

  return predicate + ' ? ' + consequent + ' : ' + alternative;
}

function test_conditional_unparse() {
  display('--- test conditional unparse ---');
  display(unparse(parse('true ? true : false;')));
}

/**
 * sequence --- 多句语句
 */
function is_sequence(component) {
  return is_tagged_list(component, "sequence");
}
function sequence_statements(stmt) {   
  return head(tail(stmt));
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
    if (is_return_value(first_stmt_value)) {
      return first_stmt_value;
    } else {
      return eval_sequence(rest_statements(stmts), env);
    }
  }
}

function sequence_unparse(components) {
  return map_join(comp => unparse(comp), sequence_statements(components), ';\n');
}

function test_sequence_unparse() {
  display('--- test sequence unparse ---');
  display(unparse(parse('1 + 1; 2 + 2; const a = 1;')));
}

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

function lambda_expreesion_unparse(component) {
  const params = map_join(symbol_of_name, lambda_parameter_symbols(component), ',');
  const body = unparse(lambda_body(component));
  return '(' + params + ')' + '=> {' + body + '};';
}

function test_lambda_unparse(){
  display('--- test lambda unparse');
  display(unparse(parse('() => 123;')));
}

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

function assignment_unparse(component) {
  return assignment_symbol(component) + ' = ' + unparse(assignment_value_expression(component));
}

function test_assignment_unparse() {
  display('--- test assignment unparse ---');
  display(unparse(parse('b = 2;')));
}


/**
 *  block --- 语句块 
 */
function is_block(component) {
  return is_tagged_list(component, "block");
}

function block_body(component) {
  return head(tail(component));
}

function eval_block(component, env) {
  const body = block_body(component);
  const locals = scan_out_declarations(body);
  const unassigneds = list_of_unassigned(locals);

  return evaluate(body, extend_environment(locals,
                                           unassigneds,
                                          env));
}

function block_unparse(component) {
  return '{' + unparse(block_body(component)) + '}';
}

function test_block_unparse() {
  display('--- test block unparse ---');
  display(unparse(parse('{const a = 1;}')));
}

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
 */
function scan_out_declarations(component) {
  return is_sequence(component)
    ? accumulate(append,
                 null,
                  map(scan_out_declarations,
                      sequence_statements(component)))
    : is_declaration(component)
    ? list(declaration_symbol(component))
    : null;
}

function eval_declaration(component, env) {
  assign_symbol_value(declaration_symbol(component),
                      evaluate(declaration_value_expression(component), env),
                      env);
  return undefined;
}

function declaration_unparse(component) {
  const key_word = is_variable_declaration(component)
    ? 'let'
    : 'const';
  const symbol = unparse(declaration_symbol(component));
  const exp = unparse(declaration_value_expression(component));
  return key_word + ' ' + symbol + ' = ' + exp;
}

function test_declaration_unparse() {
  display('--- test declaration unparse');
  display(unparse(parse('const a = 1; let as = 2;')));
}


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

function function_environment(component) {
  return list_ref(component, 4);
}

function function_parameters(component) {
  return list_ref(component, 2);
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

function function_declaration_unparse(component) {
  return 'function ' + unparse(function_declaration_name(component)) + '(' + map_join(unparse, function_declaration_parameters(component), ';') + ') {' + unparse(function_declaration_body(component)) + '}';
}

function test_function_unparse() {
  display('--- test function unparse');
  display(unparse(parse('function foo(a, b) { const ab = 1; return 1 + 2;}')));
}




/**
 * operator
 */
function is_operator_combination(component) {	    
  return is_unary_operator_combination(component) ||
         is_binary_operator_combination(component);
}
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

function test_operator_unparse() {
  display('--- test operator unparse');
  display(unparse(parse('!true; ')));
  display(unparse(parse('1 + 1; ')));
}

function operator_combination_unparse(component) {
  if (is_unary_operator_combination(component)) {
    const op_symbol = operator_symbol(component);
    const first_oped = unparse(first_operand(component));
    return op_symbol + ' ' + first_oped;
  } else if (is_binary_operator_combination(component)) {
    const op_symbol = operator_symbol(component);
    const first_oped = unparse(first_operand(component));
    const second_oped = unparse(second_operand(component));
    return first_oped + ' ' + op_symbol + ' ' + second_oped;
  } else {}
}

/* ----------------------------------------------------------------------------------- */

/* ---------------------------------- test ---------------------------------- */
// test_return_statemen_unparse();
// test_name_unparse();
// test_literal_unparse();
// test_application_unparse();
// test_conditional_unparse();
// test_sequence_unparse();
// test_lambda_unparse();
// test_assignment_unparse();
// test_block_unparse();
// test_declaration_unparse();
// test_function_unparse();
// test_operator_unparse();


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
    const program_env = extend_environment(locals, unassigned, env);
    const output = evaluate(program, program_env);
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

driver_loop(the_global_environment, '\n --- session start---\n' + input_prompt);

const e = (str) => {
  return evaluate(parse(str), the_global_environment);
};