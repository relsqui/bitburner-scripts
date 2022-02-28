/** @param {NS} ns **/

export async function main(ns) {
	const start = Date.now();
	ns.disableLog("sleep");
	ns.run("find-contracts.js", 1, "loop");
	ns.run("sleeves.js");
	if (ns.gang.inGang()) {
		ns.run("runGang.js");
	}
	if (ns.getPlayer().hasCorporation) {
		ns.run("runCorp.js");
	}
	ns.run("loop.js");
	ns.run("sendBatches.js");
	ns.universityCourse("Rothman University", "Study Computer Science", false);
	while (!ns.getPlayer().tor && !ns.purchaseTor()) {
		await ns.sleep(2000);
	}
	for (let file of ["BruteSSH.exe", "FTPCrack.exe", "relaySMTP.exe", "HTTPWorm.exe", "SQLInject.exe"]) {
		while (!ns.fileExists(file) && !ns.purchaseProgram(file)) {
			await ns.sleep(5000);
		}
	}
	ns.run("buy-servers.js", 1, "loop");
	if (ns.getServerMoneyAvailable("home") < 100000000) {
		// we're not on the grind yet, come back later
		ns.exit();
	}
	if (ns.getPlayer().hacking < 2500 && ns.getServerMoneyAvailable("home") > 200000 && ns.travelToCity("Volhaven")) {
		ns.universityCourse("ZB Institute of Technology", "Algorithms", false);
	}
	if (ns.getOwnedAugmentations(true).includes("The Red Pill")) {
		// just waiting on hack xp
		ns.exit();
	}
	while (ns.getPlayer().hacking < 2500 || ns.getServerMoneyAvailable("home") < 100000000000) {
		await ns.sleep(1000);
	}
	ns.tprint(`Time to flight: ${ns.nFormat((Date.now()-start)/1000, "00:00:00")}.`);
	ns.toast("Time to fly!")
	while (ns.getFactionRep("Daedalus") == 0 && !ns.checkFactionInvitations().includes("Daedalus")) {
		await ns.sleep(5000);
	}
	ns.joinFaction("Daedalus");
	if (ns.getFactionFavor("Daedalus") < 150) {
		ns.run("waitForFavor.js");
		ns.kill("sendBatches.js", "home");
		ns.run("orchestrate.js", 1, "stop");
		ns.run("warthogs.js", 1, "stop");
		ns.run("orchestrate.js", 1, "share");
		ns.run("warthogs.js", 1, "share");
		ns.run("share-it.js", 1, "home");
	}
	ns.toast("LFGGGGGGGGGGGG", "success", 5000);
}