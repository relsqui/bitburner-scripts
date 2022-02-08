/** @param {NS} ns **/
const delay = 5 * 1000;

export async function main(ns) {
	const target = ns.args[0];
	if (target) {
		for (let hostname of ns.getPurchasedServers()) {
			if (target == "stop") {
				ns.killall(hostname);
			} else {
				ns.run("deploy.js", 1, hostname, target);
				await ns.sleep(delay);
			}
		}
	} else {
		ns.tprint("Need a target");
	}
}