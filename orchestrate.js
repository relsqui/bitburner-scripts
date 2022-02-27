import { hosts_by_distance } from "breadth-first.js";
import goto from "goto.js";

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
		ns.tprint("Failed to copy ", file, " to ", hostname);
	}
}

async function run(hostname) {
	const file = ns.args[1];
	const mem = ns.getScriptRam(file, hostname);
	const ram = ns.getServerMaxRam(hostname) - ns.getServerUsedRam(hostname);
	if (ns.fileExists(file, hostname)) {
		if (ram > mem && ns.exec(file, hostname) == 0) {
			ns.tprint("Failed to run ", file, " on ", hostname);
		}
	} else {
		ns.tprint(`${file} doesn't exist on ${hostname}`);
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
		return;
	}
	// let myLevel = ns.getHackingLevel();
	// let levelRequired = ns.getServerRequiredHackingLevel(hostname);
	// if (myLevel < levelRequired) {
	// 	if (ns.args[1] == "verbose" && levelRequired < Math.max(myLevel + 100, myLevel * 1.5)) {
	// 		skipNote(hostname, `insufficient hack level: ${myLevel} < ${levelRequired}`);
	// 	}
	// 	return;
	// }
	let portOpeners = Object.keys(allPortOpeners).filter(function (file) { return ns.fileExists(file) });
	let availablePorts = portOpeners.length;
	let portsRequired = ns.getServerNumPortsRequired(hostname);
	if (portsRequired > availablePorts) {
		return;
	}

	for (let opener of portOpeners) {
		// ns.tprint("Running ", opener, " on ", hostname);
		allPortOpeners[opener](hostname);
	}
	await ns.nuke(hostname);
	ns.toast(`Rooted ${hostname}.`, "success", 500);
}

async function backdoor(hostname) {
	const prevServer = ns.getCurrentServer();
	await goto(ns, hostname);
	await ns.sleep(10);

	await ns.installBackdoor(hostname);
	ns.toast(`Backdoored ${hostname}`);
	await goto(ns, prevServer);
}

async function shareIt(hostname) {
	ns.print("Sharing ", hostname);
	ns.run("share-it.js", 1, hostname);
}

async function list(hostname) {
	const currSec = Math.round(ns.getServerSecurityLevel(hostname));
	const minSec = Math.round(ns.getServerMinSecurityLevel(hostname));
	const currMoney = ns.nFormat(ns.getServerMoneyAvailable(hostname), "$0.00a");
	const maxMoney = ns.nFormat(ns.getServerMaxMoney(hostname), "$0.00a");
	let info = hostname;
	info += ` : ${currSec}/${minSec} `
	info += `| ${currMoney}/${maxMoney}`
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

async function listPs(hostname) {
	if (ns.getServerRam(hostname) == 0) {
		return;
	}
	ns.tprint(hostname + ":");
	for (let process of ns.ps(hostname)) {
		ns.tprint(`  (${process.threads}) ${process.filename} ${process.args.join(" ")}`);
	}
}

export async function main(netScript) {
	ns = netScript;
	let cues = {
		copy,
		run,
		list,
		own,
		backdoor,
		ps: listPs,
		share: shareIt,
		stop: ns.killall,
		value,
	}
	let delays = {
		deploy: 5 * 1000,
	}
	let rootlessCues = ["list", "own"];
	let noPurchaseCues = ["value", "own", "list", "stop", "share", "backdoor"];
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
		await ns.sleep(delays[cue] || 1);
	}
}