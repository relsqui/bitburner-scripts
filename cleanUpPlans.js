/** @param {NS} ns **/
export async function main(ns) {
    const host = ns.getHostname();
    for (let file of ns.ls(host, `batchPlan_${host}`)) {
        ns.rm(file);
    }
}