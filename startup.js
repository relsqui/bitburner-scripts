/** @param {NS} ns **/

export async function main(ns) {
	const start = Date.now();
	ns.disableLog("sleep");
	ns.run("find-contracts.js", 1, "loop");
	ns.run("sleeves.js");
	ns.run("hacknetServers.js");
	if (ns.gang.inGang()) {
		ns.run("runGang.js");
	}
	if (ns.getServerMaxRam("home") > 1024) {
		if (ns.getPlayer().hasCorporation) {
			ns.run("runCorp.js");
		} else {
			ns.run("bootCorp.js");
		}
	} else if (ns.getPlayer().hasCorporation || ns.getServerMoneyAvailable("home") > 150e9) {
		ns.tprint("Not enough RAM to run corp.");
	}
	ns.run("loop.js");
	ns.run("backdoor.js");
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
	if (ns.getServerMoneyAvailable("home") < 100000000 || ns.getOwnedAugmentations(true).includes("The Red Pill")) {
		// ns.run("getJobs.js")
		if (!ns.gang.inGang()) {
			ns.run("doCrimes.js", 1, "karma");
		}
		ns.exit();
	}
	while (ns.getFactionRep("Daedalus") == 0 && !ns.checkFactionInvitations().includes("Daedalus")) {
		await ns.sleep(5000);
	}
	ns.joinFaction("Daedalus");
	ns.tprint(`Time to flight: ${ns.nFormat((Date.now()-start)/1000, "00:00:00")}.`);
	if (ns.getFactionFavor("Daedalus") < 150) {
		ns.run("waitForFavor.js");
		ns.kill("sendBatches.js", "home");
		ns.kill("loop.js", "home");
		await ns.sleep(1000);
		ns.run("orchestrate.js", 1, "stop");
		ns.run("warthogs.js", 1, "stop");
		await ns.sleep(1000);
		ns.run("orchestrate.js", 1, "share");
		ns.run("loop.js");
		ns.run("warthogs.js", 1, "share");
		ns.run("share-it.js", 1, "home");
	} else {
		ns.toast("LFGGGGGGGGGGGG", "success", 5000);
	}
}