/** @param {NS} ns **/

export async function main(ns) {
    ns.disableLog("sleep");
    while (true) {
        // if we don't keep tail up it's hard to stop this script
        ns.tail();
        ns.commitCrime(ns.args[0] || "homicide");
        while (ns.isBusy()) {
            await ns.sleep(10);
        }
    }
}