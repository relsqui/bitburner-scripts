/** @param {NS} ns **/

export async function main(ns) {
	ns.disableLog("sleep");
	const instruction = ns.args[0];
	if (instruction == "stop") {
		ns.getPurchasedServers().map(ns.killall);
	} else if (instruction == "share") {
		while (true) {
			for (let warthog of ns.getPurchasedServers()) {
				if (ns.ps(warthog).length == 0) {
					ns.run("share-it.js", 1, warthog);
				}
			}
			await ns.sleep(10);
		}
	} else {
		ns.tprint("Need an instruction (stop|share).");
	}
}