/** @param {NS} ns **/
import { getAugments } from './buyAugments.js';

export async function main(ns) {
    let delay = Number(ns.args[0] || 30);
    ns.disableLog("ALL");
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
    ns.installAugmentations("startup.js");
}