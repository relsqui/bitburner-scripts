/** @param {NS} ns **/
export async function main(ns) {
	if (ns.args[0] == "check") {
		ns.tprint(`Share power is ${ns.getSharePower()}`);
	} else {
		while (true) {
			await ns.share();
			await ns.sleep(1);
		}
	}
}