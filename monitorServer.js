/** @param {NS} ns **/

export function autocomplete(data, args) {
	return [...data.servers];
}

export async function main(ns) {
	const refreshRate = 1;
	const host = ns.args[0] || ns.getHostname();
	ns.disableLog("ALL");
	ns.tail();
	while (true) {
		ns.clearLog();
		ns.print(host);
		ns.print("");
		const currentSec = ns.nFormat(ns.getServerSecurityLevel(host), "0.00");
		const minSec = ns.getServerMinSecurityLevel(host);
		ns.print(`Security: ${currentSec} / ${minSec}`)
		const currentMoney = ns.nFormat(ns.getServerMoneyAvailable(host), "$0.00a");
		const maxMoney = ns.nFormat(ns.getServerMaxMoney(host), "$0.00a");
		ns.print(`Money: ${currentMoney} / ${maxMoney}`)
		let maxRam = ns.getServerMaxRam(host);
		const freeRam = ns.nFormat(maxRam - ns.getServerUsedRam(host), "0.00ib");
		maxRam = ns.nFormat(maxRam, "0.00ib");
		ns.print(`RAM: ${freeRam} / ${maxRam}`)
		ns.print("");
		ns.print(`Grow time: ${ns.nFormat(ns.getGrowTime(host)/1000, "00:00:00")}`);
		ns.print(`Weaken time: ${ns.nFormat(ns.getWeakenTime(host)/1000, "00:00:00")}`);
		ns.print(`Hack time: ${ns.nFormat(ns.getHackTime(host)/1000, "00:00:00")}`);
		ns.print("");
		for (let p of ns.ps(host)) {
			ns.print(`(${p.pid}) ${p.filename} -t ${p.threads} ${p.args.join(" ")}`);
		}
		await ns.sleep(refreshRate);
	}
}