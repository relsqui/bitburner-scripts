/** @param {NS} ns **/

function nope(ns, who, why) {
	ns.tprint(`Can't deploy ${who}: ${why}`);
}

export async function main(ns) {
	const hostname = ns.args[0];
	const target = ns.args[1] || hostname;
	const scriptFile = "hack-it.js";
	let freeRam = ns.getServerMaxRam(hostname) - ns.getServerUsedRam(hostname);
	if (hostname == "home") {
		// save some for everyday use
		freeRam = Math.max(0, freeRam - 20);
	}
	const threads = Math.floor(freeRam/ns.getScriptRam(scriptFile));
	const purchased = ns.getPurchasedServers();
	if (target == "home" || purchased.includes(target)) {
		nope(ns, hostname, "player-owned server");
	} else if (ns.getServerMaxMoney(target) == 0) {
		nope(ns, hostname, "no money to steal");
	} else if (threads < 1) {
		if (!purchased.includes(hostname)) {
			// nope(ns, hostname, `free ram is ${freeRam}`);
		}
	} else {
		if (hostname != "home") {
			ns.killall(hostname);
			await ns.scp(scriptFile, hostname);
		}
		if (ns.exec(scriptFile, hostname, threads, target) == 0) {
			nope(ns, hostname, `agent ${i} failed to start`);
		}
	}
}