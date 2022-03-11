/** @param {NS} ns **/
export async function main(ns) {
    ns.tprint(JSON.stringify(ns.getPlayer(), null, 2));
}