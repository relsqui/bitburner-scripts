/** @param {NS} ns **/
import { getAugments } from './buyAugments.js';

async function installAugments(ns, delay=3) {
    if (await getAugments(ns) == 0 && !ns.args[1]) {
        ns.tprint("No augments available.");
        ns.exit();
    }
    ns.tail();
    for (;delay > 0; delay--) {
        ns.clearLog();
        ns.print("About to buy and install augments.");
        ns.print(`You have ${delay} seconds to kill this.`);
        await ns.sleep(1000);
    }
    if (await getAugments(ns, true) == 0 && !ns.args[1]) {
        ns.tprint("Nothing installed, not shutting down yet.");
        ns.exit();
    }
}

async function installNFG(ns) {
    // just buy as much as we can from whoever will sell it to us
    for (let faction of ns.getPlayer().factions) {
        while (ns.purchaseAugmentation(faction, "NeuroFlux Governor")) {
            await ns.sleep(10);
        }
    }
}

async function upgradeHome(ns) {
    while (ns.upgradeHomeRam() || ns.upgradeHomeCores()) {
        await ns.sleep(10);
    }
}

function rmTempFiles(ns) {
    ns.run("cleanUpPlans.js");
    ns.run("cleanUpTmp.js");
}

export async function main(ns) {
    ns.disableLog("sleep");
    await installAugments(ns, ns.args[0]);
    await upgradeHome(ns);
    await installNFG(ns);
    rmTempFiles(ns);
    ns.installAugmentations("startup.js");
}