/** @param {NS} ns **/
function getThreadRatio(ns, host, target) {
	const cores = ns.getServer(host).cpuCores;
	const atMinSec = ns.getServerSecurityLevel(target) == ns.getServerMinSecurityLevel(target);
	const atMaxMoney = ns.getServerMoneyAvailable(target) == ns.getServerMaxMoney(target);

	// TODO: if we can weaken enough to mitigate
	// grow and hack, hack even if not ready yet

	let hackThreads = 0;
	let hackRate = 0;
	let hackSecChange = 0;
	if (atMinSec && atMaxMoney) {
		hackThreads = 1;
		hackRate = ns.hackAnalyze(target);
		hackSecChange = ns.hackAnalyzeSecurity(1);
	}

	let growThreads = 0;
	if (hackThreads > 0) {
		growThreads = Math.ceil(ns.growthAnalyze(target, 1 + hackRate, cores));
	} else if (atMinSec && !atMaxMoney) {
		growThreads = 1;
	}
	const growSecChange = ns.growthAnalyzeSecurity(growThreads);

	const weakenPerThread = ns.weakenAnalyze(1, cores);
	// always weaken at least once.
	let mitigateHack = 0;
	let mitigateGrow = 1;
	if (hackThreads > 0) {
		mitigateHack = Math.ceil(hackSecChange / weakenPerThread);
	}
	if (growThreads > 0) {
		mitigateGrow = Math.ceil(growSecChange / weakenPerThread);
	}

	return {
		hack: hackThreads, hackRate, hackSecChange,
		grow: growThreads, growSecChange,
		mitigateHack, mitigateGrow
	};
}

function getTiming(ns, target, delay) {
	// TODO: if we know we're going to skip hack or grow,
	// we can adjust the manager to skip some sleeps
	// and update the eta accordingly
	const wTime = ns.getWeakenTime(target);
	const gTime = ns.getGrowTime(target);
	const hTime = ns.getHackTime(target);
	const eta = delay * 2 + wTime;
	return {
		eta, etaString: ns.nFormat(eta / 1000, "00:00:00"),
		wTime, gTime, hTime,
		betweenBatches: delay * 4,
		beforeWeaken: delay * 2,
		beforeGrow: Math.ceil(wTime - gTime - delay),
		beforeHack: Math.ceil(gTime - hTime - (delay * 2)),
	};
}

function getBatchSize(ns, host, target, options, threadRatio, maxBatchCount) {
	const minimumRam = (threadRatio.hack * ns.getScriptRam(options.files.hack, host)) +
		(threadRatio.grow * ns.getScriptRam(options.files.grow, host)) +
		ns.getScriptRam(options.files.manager, host) +
		((threadRatio.mitigateHack + threadRatio.mitigateGrow) * ns.getScriptRam(options.files.weaken, host));
	let freeRam = options.availableRam;
	if (host == "home") {
		// leave some breathing room
		freeRam = Math.max(0, freeRam - options.homeReservedRam);
	}
	let maxPossibleSize = Math.floor(freeRam / minimumRam);
	if (maxPossibleSize == Infinity) {
		maxPossibleSize = 0;
	}
	let maxUsefulHack = 0;
	let maxUsefulGrow = 0;
	let maxUsefulWeaken = 0;
	const availableMoney = ns.getServerMoneyAvailable(target);
	const maxMoney = ns.getServerMaxMoney(target);
	if (threadRatio.hack > 0) {
		maxUsefulHack = Math.ceil(ns.hackAnalyzeThreads(target, maxMoney));
	} else if (threadRatio.grow > 0 && availableMoney > 0) {
		// TODO: predict useful grow amount from 0
		if (maxMoney == 0) {
			maxUsefulGrow = 0;
		} else {
			const cores = ns.getServer(host).cpuCores;
			const amountToGrow = maxMoney / availableMoney;
			maxUsefulGrow = Math.ceil(ns.growthAnalyze(target, amountToGrow, cores));
		}
	} else {
		// TODO: predict useful weaken amount when that's all we're doing
		maxUsefulWeaken = maxPossibleSize;
	}
	const maxUsefulSize = Math.max(maxUsefulHack, maxUsefulGrow, maxUsefulWeaken);
	const batchSize = Math.min(maxPossibleSize, maxUsefulSize);
	const maxPossibleBatches = Math.floor(freeRam / (minimumRam * batchSize));
	const batchCount = Math.min(maxBatchCount, maxPossibleBatches);
	const sizeDetails = { maxPossibleSize, maxUsefulHack, maxUsefulGrow, maxUsefulSize };
	const ram = { minimumRam, ramPerBatch: minimumRam * batchSize, freeRam };
	return [batchSize, sizeDetails, batchCount, ram];
}

export function getMaxBatches(ns, target, delay) {
	const timing = getTiming(ns, target, delay);
	return Math.floor(timing.eta / timing.betweenBatches);
}

export function makeBatchPlan(ns, host, target, options) {
	const threadRatio = getThreadRatio(ns, host, target);
	const timing = getTiming(ns, target, options.delay);
	const maxBatchCount = Math.floor(timing.eta / timing.betweenBatches) - options.priorBatches;
	let [batchSize, sizeDetails, batchCount, ram] =
		getBatchSize(ns, host, target, options, threadRatio, maxBatchCount);
	const threads = {
		hack: threadRatio.hack * batchSize,
		grow: threadRatio.grow * batchSize,
		mitigateHack: threadRatio.mitigateHack * batchSize,
		mitigateGrow: threadRatio.mitigateGrow * batchSize,
	};
	if (threads.hack + threads.grow + threads.mitigateHack + threads.mitigateGrow == 0) {
		batchCount = 0;
	}
	return {
		host, target, batchSize, batchCount, maxBatchCount,
		sizeDetails, ram, threadRatio, threads, timing, options
	};
}

export async function deployBatchPlan(ns, host, target, opts = {}) {
	const options = {
		delay: 500,
		homeReservedRam: 100,
		deploy: true,
		priorBatches: 0,
		availableRam: ns.getServerMaxRam(host) - ns.getServerUsedRam(host),
		...opts,
		files: {
			manager: "manageBatches.js",
			hack: "just-hack.js",
			weaken: "just-weaken.js",
			grow: "just-grow.js",
			...(opts.files || {})
		},
	}
	const batchPlan = makeBatchPlan(ns, host, target, options);
	if (options.deploy) {
		const planFile = `batchPlan_${host}_${target}.txt`;
		batchPlan["planFile"] = planFile;
		if (ns.fileExists(planFile, host)) {
			// these files get read a lot, make sure it actually gets deleted
			while (!ns.rm(planFile, host)) {
				await ns.sleep(10);
			}
		}
		await ns.write(planFile, JSON.stringify(batchPlan, null, 2), "w");
		if (host != ns.getHostname()) {
			await ns.scp([planFile, ...Object.values(options.files)], host);
			await ns.rm(planFile);
		}

	}
	return batchPlan;
}

export async function main(ns) {
	const [host, target] = ns.args;
	const batchPlan = await deployBatchPlan(ns, host, target, { deploy: true });
	ns.tprint(JSON.stringify(batchPlan, null, 2));
}