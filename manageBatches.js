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
	if (threads.mitigateHack) {
		ns.run(options.files.weaken, threads.mitigateHack, target, "mitigateHack", batch);
	}
	await ns.sleep(timing.beforeWeaken);
	const lastPid = ns.run(options.files.weaken, threads.mitigateGrow, target, "mitigateGrow", batch);
	await ns.sleep(timing.beforeGrow);
	if (threads.grow) {
		ns.run(options.files.grow, threads.grow, target, batch);
	}
	await ns.sleep(timing.beforeHack);
	if (threads.hack) {
		ns.run(options.files.hack, threads.hack, target, batch);
	}
	while (waitingFor(ns, lastPid)) {
		await ns.sleep(10);
	}
}

export async function main(ns) {
	const host = ns.args[0];
	ns.print(`Managing batches on ${host}`);
	const planFile = `batchPlan-${host}.txt`;
	const rawPlan = ns.read(planFile);
	ns.print("Starting this plan:");
	ns.print(rawPlan);
	const batchPlan = JSON.parse(rawPlan);
	for (let batch = 0; batch < batchPlan.batchCount; batch++) {
		await batchCycle(ns, batch, batchPlan);
	}
}