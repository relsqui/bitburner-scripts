import { find_paths } from "depth-first.js";

export async function main(ns) {
	let paths = find_paths(ns);
	let aliases = [];
	for (let [host, path] of Object.entries(paths)) {
		if (host != "home" && !host.startsWith("warthog")) {
			if (host == ".") host = "dot";
			if (host == "I.I.I.I") host = "IIII";
			let alias = path.map((step) => `connect ${step};`).join("");
			aliases.push(`alias goto-${host}="home; ${alias}"`);
		}
	}
	ns.tprint(aliases.join("; "));
}