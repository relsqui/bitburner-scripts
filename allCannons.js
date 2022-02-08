/** @param {NS} ns **/

export async function main(ns) {
    ns.run("batchPurchased.js", 1, ns.args[0]);
    ns.run("batchOwned.js", 1, ns.args[0]);
    ns.run("batchOne.js", 1, "home", ns.args[0]);
}