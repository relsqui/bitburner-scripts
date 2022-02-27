/** @param {NS} ns **/

function waitingFor(ns, pid) {
	for (let process of ns.ps()) {
		if (process.pid == pid) {
			return true;
		}
	}
	return false;
}

async function batchCycle(ns, batch, { host, target, threads, timing, options }) {
	// ns.toast(`Starting ${host} -> ${target} batch ${batch} | ` +
	// 	`${threads.hack} h / ${threads.mitigateHack} w / ${threads.grow} g / ${threads.mitigateGrow} w | ` +
	// 	`ETA ${timing.etaString}.`, "info", 4000);
	// we're wasting some time on sometimes unnecessary sleeps here
	// for the sake of making the timing as consistent as possible
	if (threads.mitigateHack > 0) {
		ns.run(options.files.weaken, threads.mitigateHack, target, "mitigateHack", batch);
	}
	await ns.sleep(timing.beforeWeaken);
	ns.run(options.files.weaken, threads.mitigateGrow, target, "mitigateGrow", batch);
	await ns.sleep(timing.beforeGrow);
	if (threads.grow > 0) {
		ns.run(options.files.grow, threads.grow, target, batch);
	}
	await ns.sleep(timing.beforeHack);
	if (threads.hack > 0) {
		ns.run(options.files.hack, threads.hack, target, batch);
	}
	await ns.sleep(timing.betweenBatches);
}

export async function main(ns) {
	const [host, target] = ns.args.slice(0, 2);
	const batch = ns.args[2] || 0;
	ns.print(`Managing batches from ${host} to ${target}`);
	const planFile = `batchPlan_${host}_${target}.txt`;
	const rawPlan = ns.read(planFile);
	if (ns.rm(planFile, host) == 0) {
		// ns.tprint(`Can't remove ${planFile} on ${host}`)
	}
	ns.print("Starting this plan:");
	ns.print(rawPlan);
	const batchPlan = JSON.parse(rawPlan);
	await batchCycle(ns, batch, batchPlan);
}