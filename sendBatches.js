/** @param {NS} ns **/
import { hosts_by_distance } from "./breadth-first.js";
import { deployBatchPlan, getMaxBatches } from './makeBatchPlan.js';
import { buildMonitorTable } from './watchBatches.js';

export function autocomplete(data, args) {
	return [...data.servers];
}

function targetValue(ns, host) {
	const player = ns.getPlayer();
	const server = ns.getServer(host);
	const maxMoney = ns.getServerMaxMoney(host)
	server.security = 1;
	// const successChance = ns.formulas.hacking.hackPercent(server, player)
	const eta = ns.formulas.hacking.weakenTime(server, player);
	return maxMoney /** successChance*/ / eta;
}

function findTargets(ns) {
	const myHack = ns.getHackingLevel();
	const targets = hosts_by_distance(ns)
		// TODO: don't hardcode the name scheme
		.filter((h) => !h.startsWith("warthog"))
		.filter(ns.hasRootAccess)
		.filter((h) => ns.getServerMaxMoney(h) > 0)
		.filter((h) => myHack >= ns.getServerRequiredHackingLevel(h))
		.sort((a, b) => targetValue(ns, b) - targetValue(ns, a));
	return targets;
}

function hasMemory(ns, host) {
	return ns.getServerMaxRam(host) >= 16;
}

function findHosts(ns) {
	const purchased = ns.getPurchasedServers();
	let hosts;
	if (purchased.length > 0 && ns.getServerMaxRam(purchased[0]) == ns.getPurchasedServerMaxRam()) {
		hosts = ["home", ...purchased];
	} else {
		hosts = ["home", ...hosts_by_distance(ns)].filter(ns.hasRootAccess);
	}
	hosts = hosts.filter((h) => hasMemory(ns, h))
		.sort((a, b) => ns.getServerMaxRam(b) - ns.getServerMaxRam(a) ||
			ns.getServer(b).cpuCores - ns.getServer(a).cpuCores);
	return hosts;
}

function getAllottedRam(ns, host, oldPlans) {
	let allottedRam = 0;
	for (let target of Object.keys(oldPlans)) {
		for (let plan of Object.values(oldPlans[target])) {
			allottedRam += plan.ram.ramPerBatch * plan.batchCount;
		}
	}
	return allottedRam;
}

function hasEnoughMemory(ns, host, oldPlans, newPlan) {
	const newAllotted = getAllottedRam(ns, host, oldPlans) + (newPlan.batchCount * newPlan.ram.ramPerBatch);
	return newAllotted < ns.getServerMaxRam(host);
}

async function clearFinished(ns, allPlans) {
	const newPlans = {};
	for (let host of Object.keys(allPlans)) {
		newPlans[host] = {};
		// TODO: get filename from plan
		const managers = ns.ps(host).filter((p) => p.filename == "manageBatches.js");
		const plans = allPlans[host];
		for (let manager of managers) {
			if (manager.args.length < 3) {
				manager.args[2] = 0;
			}
			const [host, target, batch] = manager.args;
			if (plans[target] && plans[target][batch]) {
				// sometimes it doesn't exist if the batch was running
				// before this script started
				newPlans[host][target] = newPlans[host][target] || {};
				newPlans[host][target][batch] = plans[target][batch];
			}
		}
	}
	return newPlans;
}

function updateAttackers(plans) {
	const newAttackers = {};
	for (let host of Object.keys(plans)) {
		for (let target of Object.keys(plans[host])) {
			newAttackers[target] = host;
		}
	}
	return newAttackers;
}

function updateBatchCounts(plans) {
	const newBatches = {};
	for (let host of Object.keys(plans)) {
		for (let target of Object.keys(plans[host])) {
			for (let batch of Object.keys(plans[host][target])) {
				newBatches[target] = (newBatches[target] || 0) + plans[host][target][batch].batchCount;
			}
		}
	}
	return newBatches;
}

function cleanUp(ns, plan) {
	if (ns.fileExists(plan.planFile, plan.host) && ns.rm(plan.planFile, plan.host) == 0) {
		ns.tprint(`Can't delete ${plan.planFile} on ${plan.host}`);
		ns.exit();
	}
}

export async function sendBatches(ns) {
	const delay = 100;
	ns.disableLog("ALL");
	let attackers = {};
	let plans = {};
	let batchCounts = {};

	let batch = 0;
	let messages = new Array(5).fill("");
	let hostIndex = 0;
	while (true) {
		await ns.sleep(delay);
		const hosts = findHosts(ns);
		const targets = findTargets(ns);
		if (hosts.length == 0 || targets.length == 0) {
			ns.tprint(`${hosts.length} hosts, ${targets.length} targets`);
			break;
		}

		plans = await clearFinished(ns, plans);
		attackers = updateAttackers(plans);
		batchCounts = updateBatchCounts(plans);

		let target = null;
		for (let i = 0; i < targets.length; i++) {
			batchCounts[targets[i]] = batchCounts[targets[i]] || 0;
			if (batchCounts[targets[i]] < getMaxBatches(ns, targets[i], delay)) {
				target = targets[i];
				break;
			}
		}
		if (!target) {
			continue;
		}

		let host = hosts[hostIndex];
		let originalIndex = hostIndex;
		plans[host] = plans[host] || {};
		plans[host][target] = plans[host][target] || {};

		const batchOptions = {
			delay,
			priorBatches: batchCounts[target],
			availableRam: ns.getServerMaxRam(host) - getAllottedRam(ns, host, plans[host])
		}

		let batchPlan = await deployBatchPlan(ns, host, target, batchOptions);
		originalIndex = hostIndex;
		while (batchPlan.maxBatchCount <= 0) {
			cleanUp(ns, batchPlan);
			hostIndex = (hostIndex + 1) % hosts.length;
			if (hostIndex == originalIndex) {
				continue;
			}
			host = hosts[hostIndex];
			batchPlan = await deployBatchPlan(ns, host, target, batchOptions);
			await ns.sleep(delay);
		}

		const batchString = `(${batchPlan.batchCount}/${batchCounts[target]}/${batchPlan.maxBatchCount})`;
		if (batchPlan.batchCount > 0 && hasEnoughMemory(ns, host, plans[host], batchPlan)) {
			batchCounts[target] += batchPlan.batchCount;
			messages.push(`Deploying ${host} to hack ${target} ${batchString}, eta: ${batchPlan.timing.etaString}`);
			ns.exec(batchPlan.options.files.manager, host, 1, host, target, batch);
			batchPlan.timing.started = Date.now();
			attackers[target] = host;
			plans[host][target][batch] = batchPlan;
		} else {
			const availableRam = (ns.getServerMaxRam(host) - ns.getServerUsedRam(host)) * 1000000000;
			const neededRam = batchPlan.ram.ramPerBatch * 1000000000;
			const ramString = `(${ns.nFormat(availableRam, "0.00b")}/${ns.nFormat(neededRam, "0.00b")})`;
			messages.push(`Can't deploy ${host} to hack ${target} ${batchString} ${ramString}`);
			cleanUp(ns, batchPlan);
			hostIndex = (hostIndex + 1) % hosts.length;
		}
		ns.clearLog();
		ns.print(buildMonitorTable(ns, plans, targets.slice(0, 20)));
		messages = messages.slice(messages.length - 5);
		// ns.print("_____");
		// ns.print(messages.join("\n"));
		batch++;
	}
}

export async function main(ns) {
	await sendBatches(ns);
}