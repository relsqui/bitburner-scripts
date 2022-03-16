/** @param {NS} ns **/

import { hosts_by_distance } from './breadth-first.js';

export async function main(ns) {
	ns.disableLog("sleep");
	const instruction = ns.args[0];
	const servers = hosts_by_distance(ns).filter((h) => h.startsWith("hacknet-node-"));
	if (instruction == "stop") {
		servers.map((s) => {
			ns.killall(s);
		})
		// servers.map(ns.killall);
	} else if (instruction == "share") {
		while (true) {
			for (let server of servers) {
				if (ns.ps(server).length == 0) {
					ns.run("share-it.js", 1, server);
				}
			}
			await ns.sleep(10);
		}
	} else {
		ns.tprint("Need an instruction (stop|share).");
	}
}