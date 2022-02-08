/** @param {NS} ns **/
import { deployBatchPlan } from './makeBatchPlan.js';

export function autocomplete(data, args) {
	return [...data.servers];
}

function buyServer(ns, nameScheme, ram) {
	const serverCount = ns.getPurchasedServers().length;
	const canAfford = ns.getServerMoneyAvailable("home") > ns.getPurchasedServerCost(ram);
	if (serverCount < ns.getPurchasedServerLimit() && canAfford) {
		return ns.purchaseServer(nameScheme, ram) || "";
	}
	return "";
}

function upgradeIfPossible(ns, host) {
	const currentRam = ns.getServerMaxRam(host);
	if (currentRam == ns.getPurchasedServerMaxRam()) {
		ns.print(`${host} is at maximum RAM.`);
	}
	const nextRam = currentRam * 2;
	if (host == "home") {
		return;
	}
	const nextCost = ns.getPurchasedServerCost(nextRam);
	const costString = ns.nFormat(nextRam * 1000000000, "0.00b");
	if (ns.getServerMoneyAvailable("home") > nextCost) {
		ns.deleteServer(host);
		ns.purchaseServer(host, nextRam);
		ns.toast(`Upgraded ${host} to ${costString}`, "info");
	} else {
		ns.print(`Can't afford to upgrade ${host} to ${costString} (${ns.nFormat(nextCost, "$0.00a")})`);
	}
}


export async function main(ns) {
	const target = ns.args[0];
	const startingRam = 16;
	const delay = 150;
	const buying = false;
	if (!target) {
		ns.tprint("Need a target.");
		ns.exit();
	}
	ns.disableLog("ALL");
	ns.enableLog("exec");
	ns.enableLog("purchaseServer");
	const firstServerCost = ns.getPurchasedServerCost(startingRam);
	while (true) {
		if (buying) {
			while (buyServer(ns, "warthog", startingRam) != "");
		}
		const hosts = ns.getPurchasedServers();
		if (hosts.length == 0) {
			ns.print(`No servers!`);
			if (buying) {
				ns.print(`First one will cost ${ns.nFormat(firstServerCost, "$0.00a")}.`);
				await ns.sleep(5000);
				continue;
			} else {
				ns.exit();
			}
		}
		for (let host of hosts) {
			await ns.sleep(delay * 4);
			if (ns.getServerUsedRam(host) > 0) {
				await ns.sleep(delay * 4);
				continue;
			}
			if (buying) {
				upgradeIfPossible(ns, host);
			}
			const batchPlan = await deployBatchPlan(ns, host, target, { delay });
			if (batchPlan.batchCount > 0) {
				ns.print(JSON.stringify(batchPlan, null, 2));
			}
			for (let batch = 0; batch < batchPlan.batchCount; batch++) {
				if (ns.exec("manageBatch.js", host, 1, host, batch) == 0) {
					break;
				}
				await ns.sleep(delay * 4);
			}
		}
	}
}