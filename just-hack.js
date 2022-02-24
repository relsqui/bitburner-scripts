/** @param {NS} ns **/
export async function main(ns) {
	// const currMoney = ns.getServerMoneyAvailable(ns.args[0]);
	const money = await ns.hack(ns.args[0]);
	// if (money > 1000000) {
	// 	ns.toast(`${ns.getHostname()} stole ${ns.nFormat(money, "$0.00a")}/${ns.nFormat(currMoney, "$0.00a")} from ${ns.args[0]}!`,
	// 		money > 0 ? "success" : "warning");
	// }
}