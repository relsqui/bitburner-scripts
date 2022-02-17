/** @param {NS} ns **/
export async function main(ns) {
    for (let file of ns.ls("home", "batchPlan_home_")) {
        ns.rm(file);
    }
}