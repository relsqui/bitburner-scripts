/** @param {NS} ns **/

const hostToStock = {
	"rho-construction": "RHOC",
	"megacorp": "MGCP",
	"4sigma": "FSIG",
}

export default hostToStock;

export async function main(ns) {
	ns.tprint(hostToStock);
}