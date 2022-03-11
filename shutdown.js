/** @param {NS} ns **/
import { getAugments } from './buyAugments.js';

async function installAugments(ns, delay=3) {
    if (await getAugments(ns) == 0) {
        ns.tprint("No hacking augments available.");
        ns.exit();
    }
    ns.tail();
    for (;delay > 0; delay--) {
        ns.clearLog();
        ns.print("About to buy and install augments.");
        ns.print(`You have ${delay} seconds to kill this.`);
        await ns.sleep(1000);
    }
    if (await getAugments(ns, true) == 0) {
        ns.tprint("Nothing installed, not shutting down yet.");
        ns.exit();
    }
}

async function upgradeHome(ns) {
    while (ns.upgradeHomeRam() || ns.upgradeHomeCores()) {
        await ns.sleep(10);
    }
}

export async function main(ns) {
    ns.disableLog("ALL");
    await installAugments(ns, ns.args[0]);
    await upgradeHome(ns);
    ns.installAugmentations("startup.js");
}