/** @param {NS} ns **/
import { deployBatchPlan } from './makeBatchPlan.js';

export function autocomplete(data, args) {
	return [...data.servers];
}

export async function main(ns) {
	const [host, target] = ns.args;
	const delay = 150;
	ns.disableLog("ALL");
	ns.enableLog("exec");
	while (true) {
		const batchPlan = await deployBatchPlan(ns, host, target, { delay });
		ns.print(JSON.stringify(batchPlan, null, 2));
		while (ns.ps(host).filter((p) => Object.values(batchPlan.options.files).includes(p.filename)).length > 0) {
			ns.print(`Waiting for batches to finish on ${host}`);
			await ns.sleep(batchPlan.timing.betweenBatches * 10);
		}
		if (batchPlan.batchCount == 0) {
			await ns.sleep(batchPlan.timing.betweenBatches);
		} else {
			for (let batch = 0; batch < batchPlan.batchCount; batch++) {
				if (ns.exec("manageBatch.js", host, 1, host, batch) == 0) {
					break;
				}
				await ns.sleep(batchPlan.timing.betweenBatches);
			}
		}
	}
}