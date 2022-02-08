/** @param {NS} ns **/

export async function solve(ns, prices) {
	let all_profits = [];
	for (let trades=1;trades<prices.length/2;trades++) {
		ns.print(`trying ${trades} trades`);
		let lists = await generate_lists(ns, [trades, prices]);
		let profits = lists.map((list) => {
			let sum = 0;
			for (let i=1; i<list.length; i+=2) {
				sum += list[i];
			}
			for (let i=0; i<list.length; i+=2) {
				sum -= list[i];
			}
			return sum;
		});
		all_profits.push(Math.max(...profits));
	}
	return Math.max(all_profits);
}

async function generate_lists(ns, [trades, prices]) {
	let price_lists = [];
	for (let i=0; i < prices.length; i++) {
		if (trades < 1) {
			price_lists.push([prices[i]]);
		} else {
			let later_lists = await generate_lists(ns, [trades-0.5, prices.slice(i+1)]);
			for (let list of later_lists) {
				price_lists.push([prices[i]].concat(list));
			}
		}
		await ns.sleep(1);
	}
	return price_lists;
}

export async function main(ns) {
	// ANY number of trades
	let result = await solve(ns, [107,116,26,132,81,169,10,180,110,166,21,64,180,128,146,198,34,170,61,41,40,116,1,22,162,30,133,163,108,58,161,186,155,183,159,29,142,77,72,137,77,177,24]);
	await ns.write("stock-result.txt", result);
	ns.toast("Stock result is ready.");
}