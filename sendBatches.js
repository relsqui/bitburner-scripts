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

function findTargets(ns, knownTargets = []) {
	const newTargets = [];
	for (let host of hosts_by_distance(ns)) {
		// TODO: don't hardcode the name scheme
		if (host.startsWith("warthog") ||
			knownTargets.includes(host) ||
			ns.getServerMaxMoney(host) == 0) {
			continue;
		}
		newTargets.push(host);
	}
	newTargets.sort((a, b) => targetValue(ns, b) - targetValue(ns, a));
	return [...knownTargets, ...newTargets];
}

function hasMemory(ns, host) {
	return ns.getServerMaxRam(host) > 16;
}

function notRunningABatch(ns, host) {
	const processes = ns.ps(host);
	for (let p of processes) {
		// TODO: don't hardcode this filename
		if (p.filename == "manageBatches.js") {
			return false;
		}
	}
	return true;
}

function findHosts(ns) {
	const hosts = ["home", ...ns.getPurchasedServers()]
		.filter((h) => hasMemory(ns, h))
		.filter((h) => notRunningABatch(ns, h))
		.sort((a, b) => ns.getServerMaxRam(b) - ns.getServerMaxRam(a));
	return hosts;
}

export async function sendBatches(ns) {
	const delay = 100;
	let targets = [];
	let nextTarget = -1;
	function getNextTarget() {
		targets = findTargets(ns, targets);
		nextTarget = (nextTarget + 1) % targets.length;
		return targets[nextTarget];
	}

	ns.disableLog("ALL");

	/*
	next iteration: make both lists at the top of the loop, once
	keep track of who's on who so you can display the whole set
	but keep all the skip logic and stuff; if we restart the script,
	just show the ones we know about (that start ater this starts)
	... also fix batch sizing so we stop overhacking
	... also enable multiple targets per host so we stop UNDERhacking
	*/

	while (true) {
		const hosts = findHosts(ns);
		for (let host of hosts) {
			const target = getNextTarget();
			const batchPlan = await deployBatchPlan(ns, host, target, { delay });
			ns.exec(batchPlan.options.files.manager, host, 1, host);
			ns.print(`Deploying ${host} to hack ${target}, eta: ${batchPlan.timing.etaString}`);
			if (batchPlan.batchCount == 0) {
				ns.print("Batch count is 0!");
			}
		}
		if (hosts.length > 0) {
			ns.print("---");
		}
		await ns.sleep(10000);
	}
}

export async function main(ns) {
	await sendBatches(ns);
}