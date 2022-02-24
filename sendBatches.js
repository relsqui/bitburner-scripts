/** @param {NS} ns **/
import { hosts_by_distance } from "./breadth-first.js";
import { deployBatchPlan } from './makeBatchPlan.js';
import { buildMonitorTable } from './watchBatches.js';

export function autocomplete(data, args) {
	return [...data.servers];
}

function targetValue(ns, host) {
	const player = ns.getPlayer();
	const server = ns.getServer(host);
	const maxMoney = ns.getServerMaxMoney(host) 
	const successChance = ns.formulas.hacking.hackPercent(server, player)
	const eta = ns.formulas.hacking.weakenTime(server, player);
	return maxMoney * successChance / eta;
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
	const hosts = ["home", ...hosts_by_distance(ns)]
		.filter(ns.hasRootAccess)
		.filter((h) => hasMemory(ns, h))
		.sort((a, b) => ns.getServerMaxRam(b) - ns.getServerMaxRam(a) ||
			ns.getServer(b).cpuCores - ns.getServer(a).cpuCores);
	return hosts;
}

function hasEnoughMemory(ns, host, oldPlans, newPlan) {
	let allottedRam = 0;
	for (let target of Object.keys(oldPlans)) {
		allottedRam += Object.values(oldPlans[target]).map((plan) => plan.ram.ramPerBatch * plan.batchCount);
	}
	return allottedRam + newPlan.ram.ramPerBatch < ns.getServerMaxRam(host);
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

export async function sendBatches(ns) {
	const singleHost = false;
	const delay = 100;
	ns.disableLog("ALL");
	let attackers = {};
	let plans = {};
	let batchCounts = {};

	let batch = 0;
	let hostIndex = 0;
	let messages = new Array(5).fill("");
	while (true) {
		await ns.sleep(1);
		const hosts = findHosts(ns);
		const targets = findTargets(ns);
		if (hosts.length == 0 || targets.length == 0) {
			continue;
		}
		for (let target of targets) {
			plans = await clearFinished(ns, plans);
			attackers = updateAttackers(plans);
			batchCounts = updateBatchCounts(plans);
			batchCounts[target] = batchCounts[target] || 0;
				
			if (hostIndex >= hosts.length) {
				hostIndex = 0;
			}

			const host = hosts[hostIndex];
			if ((singleHost && attackers[target] && attackers[target] != host) ||
				// we can't get the filename from a plan in this case
				// because we don't know whether it exists
				(ns.fileExists(`batchPlan_${host}_${target}.txt`, host))) {
				continue;
			}
			plans[host] = plans[host] || {};
			plans[host][target] = plans[host][target] || {};
			if (!host) {
				ns.print(hostIndex);
				ns.print(hosts);
			}

			const batchPlan = await deployBatchPlan(ns, host, target, { delay });

			if (batchCounts[target] >= batchPlan.maxBatchCount) {
				continue;
			}

			if (batchPlan.batchCount > 0 && hasEnoughMemory(ns, host, plans[host], batchPlan)) {
				batchCounts[target] += batchPlan.batchCount;
				const batchString = `(${batchPlan.batchCount}/${batchCounts[target]}/${batchPlan.maxBatchCount})`;
				messages.push(`Deploying ${host} to hack ${target} ${batchString}, eta: ${batchPlan.timing.etaString}`);
				ns.exec(batchPlan.options.files.manager, host, 1, host, target, batch);
				attackers[target] = host;
				plans[host][target][batch] = batchPlan;
			} else {
				// messages.push(`Can't deploy ${host} to hack ${target} with ${batchPlan.batchCount} batches`);
				hostIndex++;
			}
			ns.clearLog();
			ns.print(buildMonitorTable(ns, plans));
			ns.print("---");
			messages = messages.slice(messages.length-5);
			ns.print(messages.join("\n"));
		}
		batch++;
	}
}

export async function main(ns) {
	await sendBatches(ns);
}