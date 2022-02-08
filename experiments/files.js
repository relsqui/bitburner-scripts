/** @param {NS} ns **/

export async function varsToFile(ns, file, obj) {
	await ns.write(file, JSON.stringify(obj, null, 2), "w");
}

export async function varsFromFile(ns, file) {
	return JSON.parse(await ns.read(file));
}

export async function main(ns) {
	const varFile = "myVars.txt";
	const originalVars = {
		"key": "value",
		"special chars": "that's \"not\" a problem",
		"not just strings": [10, true, ["rutabaga"]]
	};

	ns.tprint("Writing vars ...");
	await varsToFile(ns, varFile, originalVars);

	ns.tprint("Reading vars ...");
	const vars = await varsFromFile(ns, varFile);
	// vars now has our original object in it

	ns.tprint("Here's what we read ...");
	ns.tprint(vars.key); // value
	ns.tprint(vars["special chars"]); // that's "not" a problem
	ns.tprint(vars["not just strings"]);
	const nonStringArray = vars["not just strings"];
	ns.tprint(nonStringArray[0]); // 10
	if (nonStringArray[1]) { // true
		ns.tprint(nonStringArray[2]); // rutabaga
	}
}