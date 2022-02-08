import { find_paths } from "depth-first.js";

export function autocomplete(data, args) {
	return [...data.servers];
}

export default async function goto(ns, dest) {
	let paths = find_paths(ns);
	await ns.connect("home");
	for (let step of paths[dest]) {
		if (!await ns.connect(step)) {
			ns.tprint(`Failed to connect to ${step}`);
			ns.exit();
		}
	}
}

export async function main(ns) {
	await goto(ns, ns.args[0]);
}