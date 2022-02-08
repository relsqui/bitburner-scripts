/** @param {NS} ns **/

function nope(ns, who, why) {
	ns.tprint(`Can't share ${who}: ${why}`);
}

export async function main(ns) {
	const hostname = ns.args[0];
	const scriptFile = "share-me.js";
	let freeRam = ns.getServerMaxRam(hostname) - ns.getServerUsedRam(hostname);
	if (hostname == "home") {
		// save some for everyday use
		freeRam = Math.max(0, freeRam - 100);
	}
	const threads = Math.floor(freeRam/ns.getScriptRam(scriptFile));
	const purchased = ns.getPurchasedServers();
	if (threads < 1) {
		// nope(ns, hostname, `free ram is ${freeRam}`);
	} else {
		if (hostname != "home") {
			ns.killall(hostname);
			await ns.scp(scriptFile, hostname);
		}
		if (ns.exec(scriptFile, hostname, threads) == 0) {
			nope(ns, hostname, `agent ${i} failed to start`);
		}
	}
}