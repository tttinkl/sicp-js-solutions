// SICP JS 3.3.1

const v = list("a", "b", "c", "d");

/** 翻转链表 */
function mystery(x) {
    function loop(x, y) {
        if (is_null(x)) {
            return y;
        } else {
            const temp = tail(x);
            set_tail(x, y);
            return loop(temp, x);
        }
    }
    return loop(x, null);
}

const w = mystery(v);

const x = list("a", "b");
const z1 = pair(x, x);
const z2 = pair(list("a", "b"), list("a", "b"));
