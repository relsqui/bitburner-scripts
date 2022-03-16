/** @param {NS} ns **/
export async function main(ns) {
	const file="contract-936033.cct";
	const host="rothman-uni";
	// const data=ns.codingcontract.getData(file, host);
	const solution=ns.read("maths.txt").split(",");
	// ns.tprint(solution);
	ns.tprint(ns.codingcontract.attempt(solution, file, host, {returnReward: true}));
}