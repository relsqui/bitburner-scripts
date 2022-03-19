/** @param {NS} ns **/

import { getAugments } from './buyAugments.js';
import { hosts_by_distance } from 'breadth-first.js';
import { getSettings } from './settings.js';


function joinAllFactions(ns) {
	// if (getSettings(ns).loop.dontJoinFactions) {
	// 	return;
	// }
	const cities = ["Sector-12", "Volhaven", "Aevum", "Chongqing", "New Tokyo", "Ishima"];
	for (let faction of ns.checkFactionInvitations()) {
		// except cities
		if (cities.includes(faction) && !getSettings(ns).loop.joinCities) {
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
	const anyWereMissing = missing.length > 0;
	while (missing.length > 0) {
		ns.clearLog();
		ns.run("orchestrate.js", 1, "own");
		missing = missing.filter(({ server }) => !ns.hasRootAccess(server));
		for (let { server, hackLevel } of missing) {
			ns.print(`  ${server} (${hackLevel})`);
		}
		ns.print(`\n${missing.length} servers remaining.`);
		joinAllFactions(ns);
		await ns.sleep(1000);
	}
	if (anyWereMissing) {
		ns.tprint("All servers owned.");
	}
	while (true) {
		ns.clearLog();
		joinAllFactions(ns);
		if (getSettings(ns).loop.upgradeHome) {
			ns.upgradeHomeRam();
		}
		const augments = await getAugments(ns);
		const toBuy = augments.filter((augment) => augment.to_buy);
		ns.print(`${augments.length} augments available, ${toBuy.length} to purchase at once.`);
		const minAugs = getSettings(ns).loop.minAugsToBuy;
		if (minAugs && toBuy.length >= minAugs) {
			ns.run("shutdown.js", 1, 60);
		}
		await ns.sleep(1000);
	}
}