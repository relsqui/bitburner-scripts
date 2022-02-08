/** @param {NS} ns **/
export async function main(ns) {
	const signals = {
		"weaken": ns.weaken,
		"grow": ns.grow,
		"hack": ns.hack,
	}
	await signals[ns.args[0]](ns.args[1]);
}