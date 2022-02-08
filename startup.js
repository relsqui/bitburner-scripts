/** @param {NS} ns **/

export async function main(ns) {
	const start = Date.now();
	ns.run("find-contracts.js", 1, "loop");
	ns.run("runGang.js");
	const pid = ns.run("loop.js");
	// ns.tail(pid);
	ns.universityCourse("Rothman University", "Study Computer Science", false);
	while (!ns.getPlayer().tor && !ns.purchaseTor()) {
		await ns.sleep(2000);
	}
	for (let file of ["BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe"]) {
		while (!ns.fileExists(file) && !ns.purchaseProgram(file)) {
			await ns.sleep(2000);
		}
	}
	if (ns.getPlayer().hacking < 2500 && ns.getServerMoneyAvailable("home") > 200000 && ns.travelToCity("Volhaven")) {
		ns.universityCourse("ZB Institute of Technology", "Algorithms", false);
	}
	while (ns.getPlayer().hacking < 2500) {
		await ns.sleep(1000);
	}
	ns.tprint(`Time to flight: ${ns.nFormat((Date.now()-start)/1000, "00:00:00")}.`);
	ns.toast("Time to fly!")
	while (!ns.checkFactionInvitations().includes("Daedalus")) {
		await ns.sleep(5000);
	}
	if (ns.getFactionFavor("Daedalus") < 150) {
		ns.workForFaction("Daedalus", "Hacking Contracts", false);
		ns.run("waitForFavor.js");
		ns.run("orchestrate.js", 1, "share");
		ns.run("share-it.js", 1, "home");
	}
	ns.toast("LFGGGGGGGGGGGG", "success", 5000);
}