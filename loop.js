/** @param {NS} ns **/
import { hosts_by_distance } from "breadth-first.js";

export async function main(ns) {
	ns.disableLog("ALL");
	const allServers = hosts_by_distance(ns);
	let ownedServers = [];
	while (allServers.length > ownedServers.length) {
		ns.clearLog();
		ns.run("orchestrate.js", 1, "own");
		ownedServers = allServers.filter((server) => ns.hasRootAccess(server));
		ns.print(`${allServers.length-ownedServers.length} servers remaining:\n`);
		for (let server of allServers) {
			if (!ownedServers.includes(server)) {
				ns.print(`  ${server} (${ns.getServerRequiredHackingLevel(server)})`);
			}
		}
		for (let faction of ns.checkFactionInvitations()) {
			if (ns.joinFaction(faction)) {
				ns.toast(`Joined ${faction}!`, "success");
				ns.tprint(`Joined ${faction}.`);
			}
		}
		await ns.sleep(1000);
	}
	ns.tprint("All servers owned.");
}