/** @param {NS} ns **/
const startingFunds = 10000000000;
let funds = startingFunds;

// how good a forecast to buy at?
const buyThreshold = 0.6;
// how bad a forecast to sell at for any profit?
const sellThreshold = 0.5;
// at what fraction of potential profit should we sell?
// (where "potential profit" is volatility)
const profitThreshold = 0.5;
// what fraction of the portfolio can be one stock
// (haven't actually implemented this yet)
const maxSingleStock = 0.2;

// game constants
const delay = 3000;
const transactFee = 100000;

const holdings = {};

function prettyJSON(obj) {
	return JSON.stringify(obj, null, 2);
}

function prettyFunds(ns, amount) {
	return ns.nFormat(amount, "$0.000a");
}

function prettyHoldings(ns) {
	const fmt = "0.00000";
	const lines = [];
	for (let sym of Object.keys(holdings)) {
		const h = holdings[sym];
		const vol = ns.nFormat(h.vol, fmt);
		const forecast = ns.nFormat(h.forecast, fmt);
		lines.push(`${sym}: ${h.count} @ ${Math.floor(h.avgPrice)} || ` +
			`bid ${Math.floor(h.bid)} / v ${vol} / f ${forecast}`);
	}
	return lines.join("\n");
}

function valuePortfolio() {
	return Object.keys(holdings)
		.map((sym) => holdings[sym].count * holdings[sym].avgPrice)
		.reduce((a, b) => a + b, 0);
}

function printStatus(ns) {
	const portValue = valuePortfolio();
	const profit = funds + portValue - startingFunds;
	ns.print(`Cash: ${prettyFunds(ns, funds)}`);
	ns.print(`Portfolio: ${prettyFunds(ns, portValue)}`);
	ns.print(`Profit: ${prettyFunds(ns, profit)}`);
	ns.print(prettyHoldings(ns));
}

function getInfo(ns, stock) {
	return {
		"symbol": stock,
		price: ns.stock.getPrice(stock),
		ask: ns.stock.getAskPrice(stock),
		bid: ns.stock.getBidPrice(stock),
		vol: ns.stock.getVolatility(stock),
		forecast: ns.stock.getForecast(stock),
		maxShares: ns.stock.getMaxShares(stock),
	}
}

function getMarket(ns) {
	const market = {};
	for (let sym of ns.stock.getSymbols()) {
		market[sym] = getInfo(ns, sym);
	}
	return market;
}

function buyableShares(ns, stockInfo) {
	return Math.min(stockInfo.maxShares,
		Math.floor(Math.max(0, (funds * 2/3 - transactFee)) / stockInfo.bid));
}

function addShares(ns, sym, count, price) {
	if (!holdings[sym]) {
		holdings[sym] = {
			count: 0,
			avgPrice: 0,
		}
	}
	if (count > 0) {
		holdings[sym].avgPrice =
			((holdings[sym].count * holdings[sym].avgPrice) + (count * price)) /
			(holdings[sym].count + count);
	}
	holdings[sym].count += count;
	if (holdings[sym].count == 0) {
		delete holdings[sym];
	}
}

function transact(ns, order) {
	if (order.shares < 1) {
		return;
	}
	ns.print(order);
	const stockInfo = getInfo(ns, order.stock);
	let price;
	if (order.order == "buy") {
		price = stockInfo.ask;
		addShares(ns, order.stock, order.shares, price);
		funds -= order.shares * price;
	} else if (order.order == "sell") {
		price = stockInfo.bid;
		addShares(ns, order.stock, -order.shares, price);
		funds += order.shares * price;
	}
	funds -= transactFee;
}

function getGoodBuys(ns, market) {
	return Object.keys(market)
		.filter((sym) => !holdings[sym])
		.map((sym) => market[sym])
		.filter((stock) => stock.forecast > buyThreshold && buyableShares(ns, stock) > 0)
		.sort((a, b) => a.forecast - b.forecast);
}

async function marketStep(ns) {
	ns.print("---");
	printStatus(ns);
	const market = getMarket(ns);
	const goodBuys = getGoodBuys(ns, market);
	for (let stock of goodBuys) {
		const shares = buyableShares(ns, stock);
		transact(ns, { order: "buy", stock: stock.symbol, shares: shares });
	}
	for (let sym of Object.keys(holdings)) {
		const goingDown = market[sym].forecast < sellThreshold;
		const desiredMargin = 1 + (profitThreshold * market[sym].vol);
		const goodProfit = market[sym].bid > holdings[sym].avgPrice * desiredMargin;
		const anyProfit = market[sym].bid > holdings[sym].avgPrice;
		// these are just for display
		holdings[sym].bid = market[sym].bid;
		holdings[sym].forecast = market[sym].forecast;
		holdings[sym].vol = market[sym].vol;
		if (holdings[sym].count && (goodProfit || (goingDown && anyProfit))) {
			transact(ns, { order: "sell", stock: sym, shares: holdings[sym].count });
		}
	}
}

export async function main(ns) {
	ns.disableLog("sleep");
	ns.tail();
	while (true) {
		marketStep(ns);
		await ns.sleep(delay);
	}
}