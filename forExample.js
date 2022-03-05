/** @param {NS} ns **/

function manyArgs(...args) {
    return args;
}

export async function main(ns) {
    ns.tprint(manyArgs(1, 2, 3));
}