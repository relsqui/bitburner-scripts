/** @param {NS} ns **/
import { hosts_by_distance } from "breadth-first.js";

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
		joinAllFactions(ns);
		await ns.sleep(1000);
	}
	ns.tprint("All servers owned.");
	while (true) {
		joinAllFactions(ns);
		await ns.sleep(1000);
	}
}