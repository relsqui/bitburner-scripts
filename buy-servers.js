/**
* @param {NS} ns
**/

import { getSettings } from './settings.js';

let ram;
let nameScheme;
let defaultRam = 16;
let defaultName = "warthog";

function canAffordServer(ns) {
	const maxSpend = getSettings(ns).servers.maxSpend;
	let funds = ns.getServerMoneyAvailable("home");
	if (maxSpend) {
		funds = Math.min(maxSpend, funds);
	}
	return funds > ns.getPurchasedServerCost(ram);
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
			ns.toast("Bought " + newServer + " with " + ramString(ns));
			ns.print("Bought " + newServer + " with " + ramString(ns));

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
			while (!getSettings(ns).servers.buying) {
				await ns.sleep(1000);
			}
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
				ns.toast(`Upgrading ${purchasedServers[i]} to ${ramString(ns)}`);
				ns.killall(server);
				ns.deleteServer(server);
				purchasedServers[i] = await buyServer(ns);
			}
		}
		ram *= 2;
		if (ram > ns.getPurchasedServerMaxRam()) {
			ns.toast("Maximum server size reached. Have a nice day!");
			ns.tprint("Maximum server size reached. Have a nice day!");
			break;
		} else {
			const cost = ns.nFormat(ns.getPurchasedServerCost(ram), "$0.00a");
			ns.print(`Raising server size to ${ramString(ns)} (${cost})`);
			await ns.sleep(1);
		}
	}
}