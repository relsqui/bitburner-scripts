/** @param {NS} ns **/

async function batchCycle(ns, batch, { host, target, threads, timing, options }) {
	// ns.toast(`Starting ${host} -> ${target} batch ${batch} | ` +
	// 	`${threads.hack} h / ${threads.mitigateHack} w / ${threads.grow} g / ${threads.mitigateGrow} w | ` +
	// 	`ETA ${timing.etaString}.`, "info", 4000);
	if (options.debug) {
		ns.tprint(`Batch plan on ${host}:`);
		ns.tprint(`  weaken ${target} -t ${threads.mitigateHack}`);
		ns.tprint(`  sleep ${timing.beforeWeaken}`);
		ns.tprint(`  weaken ${target} -t ${threads.mitigateGrow}`);
		ns.tprint(`  sleep ${timing.beforeGrow}`);
		ns.tprint(`  grow ${target} -t ${threads.grow}`);
		ns.tprint(`  sleep ${timing.beforeHack}`);
		ns.tprint(`  hack ${target} -t ${threads.hack}`);
	} else {
		// we're wasting some time on sometimes unnecessary sleeps here
		// for the sake of making the timing as consistent as possible
		if (threads.mitigateHack) {
			ns.run(options.files.weaken, threads.mitigateHack, target, "mitigateHack", batch);
		}
		await ns.sleep(timing.beforeWeaken);
		if (threads.mitigateGrow) {
			ns.run(options.files.weaken, threads.mitigateGrow, target, "mitigateGrow", batch);
		}
		await ns.sleep(timing.beforeGrow);
		if (threads.grow) {
			ns.run(options.files.grow, threads.grow, target, batch);
		}
		await ns.sleep(timing.beforeHack);
		if (threads.hack) {
			ns.run(options.files.hack, threads.hack, target, batch);
		}
		await ns.sleep(timing.betweenBatches);
	}
}

export async function main(ns) {
	const [host, batch] = ns.args;
	ns.print(`Managing batch on ${host}`);
	const planFile = `batchPlan-${host}.txt`;
	const batchPlan = JSON.parse(ns.read(planFile));
	ns.print("Starting this plan:");
	ns.print(JSON.stringify(batchPlan, null, 2));
	await batchCycle(ns, batch, batchPlan);
}