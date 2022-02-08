let seen;

function not_checked(hostname) {
	return seen.indexOf(hostname) == -1;
}

async function copy_from(ns, hostname) {
	let neighbors = ns.scan(hostname);
	let lit_files = ns.ls(hostname, ".lit");
	if (lit_files.length > 0) {
		await ns.scp(lit_files, hostname, "home");
		ns.tprint("Copying from ", hostname, ": ", lit_files);
	}
	seen.push(hostname);
	ns.print("seen: ", seen);
	return neighbors.filter(not_checked);
}

export async function main(ns) {
	let to_scan = ["home"]
	let next, to_add;
	seen = []
	while (to_scan.length != 0) {
		ns.print("queued:", to_scan);
		next = to_scan[0];
		to_add = await copy_from(ns, next);
		to_scan = to_scan.slice(1).concat(to_add);
	}
}