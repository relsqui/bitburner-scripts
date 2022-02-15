/** @param {NS} ns **/
import { hosts_by_distance } from "./breadth-first.js";
import { deployBatchPlan } from './makeBatchPlan.js';

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
	const newTargets = [];
	for (let host of hosts_by_distance(ns)) {
		// TODO: don't hardcode the name scheme
		if (host.startsWith("warthog") ||
			ns.getServerMaxMoney(host) == 0) {
			continue;
		}
		newTargets.push(host);
	}
	newTargets.sort((a, b) => targetValue(ns, b) - targetValue(ns, a));
	return newTargets;
}

function hasMemory(ns, host) {
	return ns.getServerMaxRam(host) > 16;
}

function findHosts(ns) {
	const hosts = ["home", ...ns.getPurchasedServers()]
		.filter((h) => hasMemory(ns, h))
		.sort((a, b) => ns.getServerMaxRam(b) - ns.getServerMaxRam(a) ||
			ns.getServer(b).cpuCores - ns.getServer(a).cpuCores);
	return hosts;
}

function hasEnoughMemory(ns, host, oldPlans, newPlan) {
	let allottedRam = 0;
	for (let target of Object.keys(oldPlans)) {
		allottedRam += Object.values(oldPlans[target]).map((plan) => plan.ram.ramPerBatch * plan.maxBatches);
	}
	return allottedRam + newPlan.ram.ramPerBatch < ns.getServerMaxRam(host);
}

function clearFinished(ns, allPlans) {
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
			newPlans[host][target] = newPlans[host][target] || {};
			newPlans[host][target][batch] = plans[target][batch];
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

export async function sendBatches(ns) {
	const delay = 100;
	ns.disableLog("ALL");
	let attackers = {};
	let plans = {};

	let batch = 0;
	while (true) {
		const hosts = findHosts(ns);
		const targets = findTargets(ns);
		let hostIndex = 0;
		for (let target of targets) {
			plans = clearFinished(ns, plans);
			attackers = updateAttackers(plans);
			const host = hosts[hostIndex];
			if (attackers[target] && attackers[target] != host) {
				continue;
			}
			plans[host] = plans[host] || {};
			plans[host][target] = plans[host][target] || {};
			const batchPlan = await deployBatchPlan(ns, host, target, { delay });
			if (batchPlan.batchCount > 0 &&
				(attackers[target] == host || hasEnoughMemory(ns, host, plans[host], batchPlan))) {
				ns.print(`Deploying ${host} to hack ${target}, eta: ${batchPlan.timing.etaString}`);
				ns.exec(batchPlan.options.files.manager, host, 1, host, target, batch);
				attackers[target] = host;
				plans[host][target][batch] = batchPlan;
			} else {
				hostIndex++;
			}
			if (hostIndex >= hosts.length) {
				break;
			}
		}
		await ns.sleep(1);
		batch++;
	}
}

export async function main(ns) {
	await sendBatches(ns);
}