/** @param {NS} ns **/

import { getAugments } from './buyAugments.js';
import goto from "goto.js";
import { hosts_by_distance } from "breadth-first.js";

async function backdoor(ns, hostname) {
	const prevServer = ns.getCurrentServer();
	await goto(ns, hostname);
	await ns.sleep(10);

	await ns.installBackdoor(hostname);
	ns.toast(`Backdoored ${hostname}`);
	await goto(ns, prevServer);
}

async function checkBackdoors(ns) {
	const servers = ["CSEC", "avmnite-02h", "I.I.I.I", "run4theh111z", "powerhouse-fitness"];
	for (let server of servers) {
		if (ns.getServer(server).backdoorInstalled ||
			ns.getPlayer().hacking < ns.getServerRequiredHackingLevel(server) ||
			!ns.hasRootAccess(server)) {
			continue;
		}
		await backdoor(ns, server);
	}
}

function joinAllFactions(ns) {
	for (let faction of ns.checkFactionInvitations()) {
		// except cities
		if (["Sector-12", "Volhaven", "Aevum", "Chongqing", "New Tokyo", "Ishima"].includes(faction)) {
			continue;
		}
		if (ns.joinFaction(faction)) {
			ns.toast(`Joined ${faction}!`, "success");
			ns.tprint(`Joined ${faction}.`);
		}
	}
}

export async function main(ns) {
	ns.disableLog("ALL");
	let missing = hosts_by_distance(ns)
		.map((server) => {return {server, hackLevel: ns.getServerRequiredHackingLevel(server)}})
		.sort((a, b) => b.hackLevel - a.hackLevel);
	while (missing.length > 0) {
		ns.clearLog();
		ns.run("orchestrate.js", 1, "own");
		missing = missing.filter(({ server, hackLevel }) => !ns.hasRootAccess(server));
		for (let { server, hackLevel } of missing) {
			ns.print(`  ${server} (${hackLevel})`);
		}
		ns.print(`\n${missing.length} servers remaining.`);
		await checkBackdoors(ns);
		joinAllFactions(ns);
		await ns.sleep(1000);
	}
	ns.tprint("All servers owned.");
	while (true) {
		ns.clearLog();
		await checkBackdoors(ns);
		joinAllFactions(ns);
		const augsAvailable = await getAugments(ns);
		ns.print(`${augsAvailable} augments available.`);
		if (augsAvailable > 10) {
			ns.run("shutdown.js");
		}
		await ns.sleep(1000);
	}
}