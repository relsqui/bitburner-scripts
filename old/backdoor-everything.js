import { hosts_by_distance } from "breadth-first.js";

export async function main(ns) {
	let hosts = hosts_by_distance(ns);
	for (let host of hosts) {
		if (host != "home" && !host.startsWith("warthog")) {
			if (host == ".") host = "dot";
			if (host == "I.I.I.I") host = "IIII";
			ns.tprintf(`goto-${host}; backdoor`)
		}
	}
}