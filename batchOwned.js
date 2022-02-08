/** @param {NS} ns **/
import { deployBatchPlan } from './makeBatchPlan.js';
import { hosts_by_distance } from "breadth-first.js";

export function autocomplete(data, args) {
	return [...data.servers];
}

export async function main(ns) {
	const delay = 150;
	// ns.disableLog("ALL");
	ns.enableLog("exec");
	ns.enableLog("killall");
	let hosts;
	while (true) {
		// using purchased name scheme instead of checking the purchased list
		// to avoid race conditions with the server buying script
		hosts = hosts_by_distance(ns).filter(ns.hasRootAccess).filter((h) => !h.startsWith("warthog"));
		for (let host of hosts) {
			const target = ns.args[0] || host;
			await ns.sleep(delay * 4);
			if (ns.ps(host).length != 0) {
				ns.print(`${host} isn't ready for another batch yet.`);
				continue;
			}
			const batchPlan = await deployBatchPlan(ns, host, target, { delay });
			for (let batch = 0; batch < batchPlan.batchCount; batch++) {
				if (ns.exec("manageBatch.js", host, 1, host, batch) == 0) {
					break;
				}
				await ns.sleep(delay * 4);
			}
		}
	}
}