/**
 * @param {string} digits
 * @param {number} target
 */
export async function allSums(digits, target) {
    var cache = new Map();
    var opts = await maths(String(digits), cache);
    var res = [];
    opts.forEach((o) => {
        if (eval(o) == target) {
            res.push(o);
        }
    });

    return res;
}


/**
 * @param {string} digits
 * @param {Map<string,strung[]} cache
 */
async function maths(digits, cache) {
    var opts = [];
    if (cache.has(digits)) {
        return cache.get(digits);
    }
    for (var i = 1; i <= digits.length; i++) {
        var n = digits.substr(0, i);

        if (i == digits.length) {
            opts.push(n);
            continue;
        }

        var sub = [];
        sub = await maths(digits.substr(i), cache);
        sub.forEach((s) => {
            // s = Number(s);
            opts.push(n + "+" + s);
            opts.push(n + "-" + s);
            opts.push(n + "*" + s);
        })
    }

    var res = [];
    var invalid = /[-+*]0\d/;
    res = opts.filter((o) => { return !invalid.test(o) });

    cache.set(digits, res);
    return res;
}

export async function main(ns) {
    const data = ["51748178101",4];
    ns.write("maths.txt", await allSums(...data), "w");
}