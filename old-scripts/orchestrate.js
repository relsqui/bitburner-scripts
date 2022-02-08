import { hosts_by_distance } from "breadth-first.js";

let ns;

function commas(numStr) {
  if (numStr.length < 4) return numStr;
  return commas(numStr.slice(0, -3)) + "," + numStr.slice(-3);
}

function skipNote(hostname, note) {
	ns.tprint("Skipping ", hostname, " (", note, ")");
}

async function copy(hostname) {
	let file = ns.args[1];
	if (!await ns.scp(file, hostname)) {
		tprint("Failed to copy ", file, " to ", hostname);
	}
}

async function own(hostname) {
	let allPortOpeners = {
		"BruteSSH.exe": ns.brutessh,
		"FTPCrack.exe": ns.ftpcrack,
		"relaySMTP.exe": ns.relaysmtp,
		"HTTPWorm.exe": ns.httpworm,
		"SQLInject.exe": ns.sqlinject
	}
	
	if (ns.hasRootAccess(hostname)) {
		// skipNote(hostname, "already owned");
		return;
	}
	let myLevel = ns.getHackingLevel();
	let levelRequired = ns.getServerRequiredHackingLevel(hostname);
	if (myLevel < levelRequired) {
		if (myLevel + 100 > levelRequired) {
			skipNote(hostname, "insufficient hack level: " + myLevel + " < " + levelRequired);
		}
		return;
	}
	let portOpeners = Object.keys(allPortOpeners).filter(function (file) { return ns.fileExists(file) });
	let availablePorts = portOpeners.length;
	let portsRequired = ns.getServerNumPortsRequired(hostname);
	if (portsRequired > availablePorts) {
		skipNote(hostname, "too many ports needed: " + portsRequired + " > " + availablePorts);
		return;
	}
	// portOpeners.foreach(function (opener) {
	for (let i=0; i<portOpeners.length; i++) {
		let opener = portOpeners[i];
		ns.tprint("Running ", opener, " on ", hostname);
		allPortOpeners[opener](hostname);
	}
	//});
	await ns.nuke(hostname);
	// not automatable ... yet
	// installBackdoor(hostname);
	await deploy(hostname);
	ns.tprint("Owned " + hostname);
}


async function deploy(hostname) {
	ns.print("Deploying ", hostname);
	while (await ns.run("deploy.js", 1, hostname) == 0) {
		await ns.sleep(1);
	}
}

async function list(hostname) {
	let info = hostname;
	info += " : " + Math.round(ns.getServerSecurityLevel(hostname));
	info += " / " + commas(Math.round(ns.getServerMoneyAvailable(hostname)).toString());
	if (ns.hasRootAccess(hostname)) {
		info += " (owned)";
	}
	ns.tprint(info);
}

async function value(hostname) {
	let minSec = ns.getServerMinSecurityLevel(hostname);
	let maxMoney = ns.getServerMaxMoney(hostname);
	let ratio = Math.round(maxMoney / minSec);
	ns.tprint(hostname, ": ", commas(ratio.toString()), " (", maxMoney, " / ", minSec, ")");
}

export async function main(netScript) {
	ns = netScript;
	let cues = {
		"copy": copy,
		"deploy": deploy,
		"list": list,
		"own": own,
		"stop": ns.killall,
		"value": value,
	}
	let rootlessCues = ["list", "own"];
	let noPurchaseCues = ["value", "own", "list"];
	let cue = ns.args[0] || "list";
	
	let hostnames = hosts_by_distance(ns);
	if (rootlessCues.indexOf(cue) == -1) {
		hostnames = hostnames.filter(ns.hasRootAccess);
	}
	if (noPurchaseCues.indexOf(cue) != -1) {
		let purchased = ns.getPurchasedServers();
		hostnames = hostnames.filter((host) => purchased.indexOf(host) == -1);
	}
	for (let host of hostnames) {
		await cues[cue](host);
		await ns.sleep(1);
	}
}