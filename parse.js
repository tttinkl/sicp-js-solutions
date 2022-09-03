function parse(s) {
  return transform(acorn.parse(s));
}
class ParseError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ParseError';
    }
}
function hasDeclarationAtToplevel(exs) {
  return exs.reduce(
    (b, ex) => b || ex.type === 'VariableDeclaration' || ex.type === 'FunctionDeclaration',
    false
  )
}
function unreachable() {
    // tslint:disable-next-line:no-console
    console.error((0, formatters_1.oneLine) `
    UNREACHABLE CODE REACHED!
    Please file an issue at
    https://github.com/source-academy/js-slang/issues
    if you see this.
  `);
}
// sequences of expressions of length 1
// can be represented by the element itself,
// instead of constructing a sequence
function makeSequenceIfNeeded(exs) {
    return exs.length === 1
        ? transform(exs[0])
        : (0, vector_to_list)(['sequence', (0, vector_to_list)(exs.map(transform))]);
}
function makeBlockIfNeeded(exs) {
    return hasDeclarationAtToplevel(exs)
        ? (0, vector_to_list)(['block', makeSequenceIfNeeded(exs)])
        : makeSequenceIfNeeded(exs);
}

function member(v, xs) {
  return is_null(xs)
         ? null
	 : v === head(xs)
	 ? xs
	 : member(v, tail(xs));
}

    function list(...args) {
      function iter(args, result) {
        if (!args || args.length === 0) {
          return result;
        }
        const [, ...rest] = args;
        return pair(args[0], iter(rest, null));
      }
      return iter(args, null);
    }
    function vector_to_list(lst) {
      return list(...lst);
    }
    const transformers = new Map([
    [
        'Program',
        (node) => {
            node = node;
            return makeSequenceIfNeeded(node.body);
        }
    ],
    [
        'BlockStatement',
        (node) => {
            return makeBlockIfNeeded(node.body);
        }
    ],
    [
        'ExpressionStatement',
        (node) => {
            return transform(node.expression);
        }
    ],
    [
        'IfStatement',
        (node) => {
            return (0, vector_to_list)([
                'conditional_statement',
                transform(node.test),
                transform(node.consequent),
                node.alternate === null
                    ? makeSequenceIfNeeded([])
                    : transform(node.alternate)
            ]);
        }
    ],
    [
        'FunctionDeclaration',
        (node) => {
            return (0, vector_to_list)([
                'function_declaration',
                transform(node.id),
                (0, vector_to_list)(node.params.map(transform)),
                makeBlockIfNeeded(node.body.body)
            ]);
        }
    ],
    [
        'VariableDeclaration',
        (node) => {
            if (node.kind === 'let') {
                return (0, vector_to_list)([
                    'variable_declaration',
                    transform(node.declarations[0].id),
                    transform(node.declarations[0].init)
                ]);
            }
            else if (node.kind === 'const') {
                return (0, vector_to_list)([
                    'constant_declaration',
                    transform(node.declarations[0].id),
                    transform(node.declarations[0].init)
                ]);
            }
            else {
                unreachable();
                throw new ParseError('Invalid declaration kind');
            }
        }
    ],
    [
        'ReturnStatement',
        (node) => {
            return (0, vector_to_list)(['return_statement', transform(node.argument)]);
        }
    ],
    [
        'CallExpression',
        (node) => {
            return (0, vector_to_list)([
                'application',
                transform(node.callee),
                (0, vector_to_list)(node.arguments.map(transform))
            ]);
        }
    ],
    [
        'UnaryExpression',
        (node) => {
            return (0, vector_to_list)([
                'unary_operator_combination',
                node.operator === '-' ? '-unary' : node.operator,
                transform(node.argument)
            ]);
        }
    ],
    [
        'BinaryExpression',
        (node) => {
            return (0, vector_to_list)([
                'binary_operator_combination',
                node.operator,
                transform(node.left),
                transform(node.right)
            ]);
        }
    ],
    [
        'LogicalExpression',
        (node) => {
            return (0, vector_to_list)([
                'logical_composition',
                node.operator,
                transform(node.left),
                transform(node.right)
            ]);
        }
    ],
    [
        'ConditionalExpression',
        (node) => {
            return (0, vector_to_list)([
                'conditional_expression',
                transform(node.test),
                transform(node.consequent),
                transform(node.alternate)
            ]);
        }
    ],
    [
        'ArrowFunctionExpression',
        (node) => {
            return (0, vector_to_list)([
                'lambda_expression',
                (0, vector_to_list)(node.params.map(transform)),
                node.body.type === 'BlockStatement'
                    ? // body.body: strip away one layer of block:
                        // The body of a function is the statement
                        // inside the curly braces.
                        makeBlockIfNeeded(node.body.body)
                    : (0, vector_to_list)(['return_statement', transform(node.body)])
            ]);
        }
    ],
    [
        'Identifier',
        (node) => {
            return (0, vector_to_list)(['name', node.name]);
        }
    ],
    [
        'Literal',
        (node) => {
            return (0, vector_to_list)(['literal', node.value]);
        }
    ],
    [
        'ArrayExpression',
        (node) => {
            return (0, vector_to_list)([
                'array_expression',
                (0, vector_to_list)(node.elements.map(transform))
            ]);
        }
    ],
    [
        'AssignmentExpression',
        (node) => {
            if (node.left.type === 'Identifier') {
                return (0, vector_to_list)([
                    'assignment',
                    transform(node.left),
                    transform(node.right)
                ]);
            }
            else if (node.left.type === 'MemberExpression') {
                return (0, vector_to_list)([
                    'object_assignment',
                    transform(node.left),
                    transform(node.right)
                ]);
            }
            else {
                unreachable();
                throw new ParseError('Invalid assignment');
            }
        }
    ],
    [
        'ForStatement',
        (node) => {
            return (0, vector_to_list)([
                'for_loop',
                transform(node.init),
                transform(node.test),
                transform(node.update),
                transform(node.body)
            ]);
        }
    ],
    [
        'WhileStatement',
        (node) => {
            return (0, vector_to_list)(['while_loop', transform(node.test), transform(node.body)]);
        }
    ],
    [
        'BreakStatement',
        (node) => {
            return (0, vector_to_list)(['break_statement']);
        }
    ],
    [
        'ContinueStatement',
        (node) => {
            return (0, vector_to_list)(['continue_statement']);
        }
    ],
    [
        'ObjectExpression',
        (node) => {
            return (0, vector_to_list)(['object_expression', (0, vector_to_list)(node.properties.map(transform))]);
        }
    ],
    [
        'MemberExpression',
        (node) => {
            const key = node.property.type === 'Identifier'
                ? (0, vector_to_list)(['property', node.property.name])
                : transform(node.property);
            return (0, vector_to_list)(['object_access', transform(node.object), key]);
        }
    ],
    [
        'Property',
        (node) => {
            if (node.key.type === 'Literal') {
                return [node.key.value, transform(node.value)];
            }
            else if (node.key.type === 'Identifier') {
                return [(0, vector_to_list)(['property', node.key.name]), transform(node.value)];
            }
            else {
                unreachable();
                throw new ParseError('Invalid property key type');
            }
        }
    ],
    [
        'ImportDeclaration',
        (node) => {
            return (0, vector_to_list)([
                'import_declaration',
                (0, vector_to_list)(node.specifiers.map(transform)),
                node.source.value
            ]);
        }
    ],
    [
        'ImportSpecifier',
        (node) => {
            return (0, vector_to_list)(['name', node.imported.name]);
        }
    ],
    [
        'ClassDeclaration',
        (node) => {
            return (0, vector_to_list)([
                'class_declaration',
                (0, vector_to_list)([
                    'name',
                    node.id === null ? null : node.id.name,
                    node.superClass === null || node.superClass === undefined
                        ? null
                        : transform(node.superClass),
                    node.body.body.map(transform)
                ])
            ]);
        }
    ],
    [
        'NewExpression',
        (node) => {
            return (0, vector_to_list)([
                'new_expression',
                transform(node.callee),
                (0, vector_to_list)(node.arguments.map(transform))
            ]);
        }
    ],
    [
        'MethodDefinition',
        (node) => {
            return (0, vector_to_list)([
                'method_definition',
                node.kind,
                transform(node.key),
                transform(node.value)
            ]);
        }
    ],
    [
        'FunctionExpression',
        (node) => {
            return (0, vector_to_list)([
                'lambda_expression',
                (0, vector_to_list)(node.params.map(transform)),
                makeBlockIfNeeded(node.body.body)
            ]);
        }
    ],
    [
        'ThisExpression',
        (node) => {
            return (0, vector_to_list)(['this_expression']);
        }
    ],
    [
        'Super',
        (node) => {
            return (0, vector_to_list)(['super_expression']);
        }
    ],
    [
        'TryStatement',
        (node) => {
            return (0, vector_to_list)([
                'try_statement',
                transform(node.block),
                node.handler === null || node.handler === undefined
                    ? null
                    : (0, vector_to_list)(['name', node.handler.param.name]),
                node.handler === null || node.handler === undefined ? null : transform(node.handler.body)
            ]);
        }
    ],
    [
        'ThrowStatement',
        (node) => {
            return (0, vector_to_list)(['throw_statement', transform(node.argument)]);
        }
    ],
    [
        'SpreadElement',
        (node) => {
            return (0, vector_to_list)(['spread_element', transform(node.argument)]);
        }
    ],
    [
        'RestElement',
        (node) => {
            return (0, vector_to_list)(['rest_element', transform(node.argument)]);
        }
    ]
]);
function transform(node) {
    if (transformers.has(node.type)) {
        const transformer = transformers.get(node.type);
        const transformed = transformer(node);
        // Attach location information
        if (transformed !== null &&
            transformed !== undefined &&
            typeof transformed === 'object' &&
            transformed.tag !== undefined) {
            transformed.loc = node.loc;
        }
        return transformed;
    }
    else {
        unreachable();
        throw new ParseError('Cannot transform unknown type: ' + node.type);
    }
}