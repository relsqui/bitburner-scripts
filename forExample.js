/** @param {NS} ns **/
export async function main(ns) {
    ns.tail();
    ns.clearLog();
    // for (let number of [1, 2, 3, 4, 5]) {
    //     ns.print(number);
    // }
    const parts = "warthog".split("-");
    ns.print(parts);
    const numeric = Number(parts[1]);
    ns.print(numeric);
    ns.print(numeric-4);
    ns.print(0-numeric);
    ns.print([1, 4, numeric, 2, 6, 34].sort((a, b) => a - b));
}