/** @param {NS} ns **/
export async function main(ns) {
    while (ns.getServerMaxRam("home") < 256) {
        ns.run("orchestrate.js", 1, "own");
        await ns.sleep(3000);
        const pid = ns.run("find-contracts.js");
        await ns.sleep(3000);
        ns.kill(pid);
        ns.upgradeHomeRam();
    }
    ns.run("startup.js");
}