function make_machine(register_names, ops, controller) {
    const machine = make_new_machine();
    for_each(register_name => 
        machine("allocate_register")(register_name),
        register_names);
    machine("install_operations")(ops);
    machine("install_instruction_sequence")
            (assemble(controller, machine));
}

function make_register(name) {
    let contents = "*unassigned";
    function dispatch(message) {
        return message === "get"
            ? contents
            : message === "set"
                ? value => { contents = value; }
                : error(message, "unknown request -- make_register");
    }
    return dispatch;
}

function get_contents(register) {
    return register("get");
}

function set_contents(register, value) {
    return register("set")(value);
}

function make_stack() {
    let stack = null;
    function push(x) { 
        stack = pair(x, stack); 
        return "done";
    }
    function pop() {
        if (is_null(stack)) {
            error("empty stack -- pop");
        } else {
            const top = head(stack);
            stack = tail(stack);
            return top;
        }
    }
    function initialize() {
        stack = null;
        return "done";
    }
    function dispatch(message) {
        return message === "push"
               ? push
               : message === "pop"
               ? pop()
               : message === "initialize"
               ? initialize()
               : error(message, "unknown request -- stack");
    }
    return dispatch;
}

function pop(stack) {
    return stack("pop");
}

function push(stack, value) {
    return stack("push")(value);
}

function make_new_machine() {
    const pc = make_register();
    /** control branching in the simulated machine */
    const flag = make_register();
    const stack = make_register();
    
    let the_instruction_sequence = null;
    let the_ops = list(list("initialize_stack", () => stack("initialize"))); // ??
    let register_table = list(list("pc", pc), list("flag", flag)); // ??
    
    function allocate_register(name) {
        if (is_undefined(assoc(name, register_table))) {
            register_table = pair(list(name, make_register(name)),
                                    register_table);
        } else {
            error(name, "multiply defined register");
        }
        return "register allocated"
    }
    
    function lookup_register(name) {
        const val = assoc(name, register_table); // ??
        return is_undefined(val)
            ? error(name, "unknown register");
            : head(tail(val));
    }
    
    function execute() {
        const insts = get_contents(pc);
        if (is_null(insts)) {
            
        }
    }
    
    
    
    
    
    
    
}