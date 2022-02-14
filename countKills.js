/** @param {NS} ns **/
export async function main(ns) {
    ns.write("killCount.js", ns.getPlayer().numPeopleKilled, "a");
}