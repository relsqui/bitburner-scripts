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

async function maybeDeploy(ns, hostname) {
	let target = ns.args[1] || ns.args[0];
	if (target == "loop" || !target) {
		return;
	}
	await ns.run("deploy.js", 1, hostname, target);
}

export async function main(ns) {
	ns.disableLog("sleep");
	ns.disableLog("getServerMoneyAvailable");
	ram = defaultRam;
	nameScheme = defaultName;
	const loop = (ns.args[0] == "loop");
	let purchasedServers = ns.getPurchasedServers();
	while (purchasedServers.length < ns.getPurchasedServerLimit()) {
		let newServer = await buyServer(ns);
		if (newServer) {
			ns.toast("Bought " + newServer + " with " + ramString(ns), "info");
			await maybeDeploy(ns, newServer);
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
						await ns.sleep(30000);
					} else {
						return;
					}
				}
				ns.print(`Upgrading ${purchasedServers[i]} to ${ramString(ns)}`);
				ns.toast(`Upgrading ${purchasedServers[i]} to ${ramString(ns)}`, "success");
				ns.killall(server);
				ns.deleteServer(server);
				purchasedServers[i] = await buyServer(ns);
				await maybeDeploy(ns, purchasedServers[i]);
			}
		}
		do {
			ram *= 2;
		} while (canAffordServer(ns, 2));
		if (ram == 2097152) {
			ns.tprint("Maximum server size reached. Have a nice day!");
			break;
		} else {
			ns.print(`Raising server size to ${ramString(ns)}`);
			await ns.sleep(1);
		}
	}
}