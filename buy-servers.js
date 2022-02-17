/**
* @param {NS} ns
**/

let ram;
let nameScheme;
let defaultRam = 16;
let defaultName = "warthog";

function canAffordServer(ns, multi = 1) {
	return ns.getServerMoneyAvailable("home") > ns.getPurchasedServerCost(ram * multi);
}

async function buyServer(ns) {
	if (canAffordServer(ns)) {
		let newServer = ns.purchaseServer(nameScheme, ram);
		return newServer;
	}
}

function ramString(ns) {
	let ramFormat = "0b";
	return ns.nFormat(ram * 1000000000, ramFormat);
}

export async function main(ns) {
	ns.disableLog("ALL");
	ram = defaultRam;
	nameScheme = defaultName;
	const loop = (ns.args[0] == "loop");
	let purchasedServers = ns.getPurchasedServers();
	while (purchasedServers.length < ns.getPurchasedServerLimit()) {
		let newServer = await buyServer(ns);
		if (newServer) {
			ns.toast("Bought " + newServer + " with " + ramString(ns), "info");
			ns.print("Bought " + newServer + " with " + ramString(ns), "info");

			purchasedServers = ns.getPurchasedServers();
			await ns.sleep(1);
		} else {
			if (loop) {
				await ns.sleep(300000);
			} else {
				return;
			}
		}
	}
	while (true) {
		for(let i=0; i<purchasedServers.length; i++) {
			let server = purchasedServers[i];
			if (ns.getServerMaxRam(server) < ram) {
				while (!canAffordServer(ns)) {
					if (loop) {
						await ns.sleep(1000);
					} else {
						return;
					}
				}
				// ns.print(`Waiting for ${server} to stop running processes`);
				// while (ns.ps(server).length > 0) {
				// 	await ns.sleep(1000);
				// }
				ns.print(`Upgrading ${purchasedServers[i]} to ${ramString(ns)}`);
				ns.killall(server);
				ns.deleteServer(server);
				purchasedServers[i] = await buyServer(ns);
			}
		}
		ram *= 2;
		if (ram > ns.getPurchasedServerMaxRam()) {
			ns.print("Maximum server size reached. Have a nice day!");
			ns.tprint("Maximum server size reached. Have a nice day!");
			break;
		} else {
			const cost = ns.nFormat(ns.getPurchasedServerCost(ram), "$0.00a");
			ns.print(`Raising server size to ${ramString(ns)} (${cost})`);
			await ns.sleep(1);
		}
	}
}