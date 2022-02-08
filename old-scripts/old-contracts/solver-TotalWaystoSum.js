/** @param {NS} ns **/
// How many different ways can the number 40 be written as a sum of at least two positive integers?

async function findSums(ns, total, greaterThan=0, cache={0: [], 1: [1]}, depth=0) {
	if (total in cache) return cache[total];
	let sums = [];
	for (let i=greaterThan+1; i<total; i++) {
		let subSums = await findSums(ns, total-i, i, cache, depth+1);
		for (let sum of subSums) {
			sums.push([i].concat(sum).sort());
		}
		await ns.sleep(10);
	}
	cache[total] = sums;
	return sums;
}

export async function solve(ns, total) {
	let sums = await findSums(ns, total);
	// if it's stupid but it works it's not stupid
	let uniques = sums.map((s) => s.toString()).filter((string, index, array) => array.indexOf(string) == index);
	for (let u of uniques) {
		ns.tprint(u);
	}
	// ns.tprint(`(scrubbed ${sums.length-uniques.length} duplicates)`);
	return uniques.length;
}

export async function main(ns) {
	ns.tprint(await solve(ns, ns.args[0]));
}