/** @param {NS} ns **/

import { getSettings } from './settings.js';
import { makeMeter, makeTable } from './table.js';


function getLevelOption(ns, i, s, mult) {
    const price = ns.hacknet.getLevelUpgradeCost(i, 1);
    const newProd = ns.formulas.hacknetServers.hashGainRate(s.level+1, s.ram, s.ram, s.cores, mult);
    const dProd = newProd - s.production;
    const fn = (ns, i) => ns.hacknet.upgradeLevel(i, 1);
    return {i, type: "level", price, dProd, fn, msg: `hn-${i} is now level ${s.level+1}`};
}

function getRamOption(ns, i, s, mult) {
    const price = ns.hacknet.getRamUpgradeCost(i, 1);
    const newProd = ns.formulas.hacknetServers.hashGainRate(s.level, s.ram*2, s.ram*2, s.cores, mult);
    const dProd = newProd - s.production;
    const fn = (ns, i) => ns.hacknet.upgradeRam(i, 1);
    return {i, type: "ram", price, dProd, fn, msg: `hn-${i} now has ${ns.nFormat(s.ram*2, "0b")} ram`};
}

function getCoreOption(ns, i, s, mult) {
    const price = ns.hacknet.getCoreUpgradeCost(i, 1);
    const newProd = ns.formulas.hacknetServers.hashGainRate(s.level, s.ram, s.ram, s.cores+1, mult);
    const dProd = newProd - s.production;
    const fn = (ns, i) => ns.hacknet.upgradeCore(i, 1);
    return {i, type: "core", price, dProd, fn, msg: `hn-${i} now has ${s.cores+1} cores`};
}

function getCacheOption(ns, i, s, _mult) {
    const price = ns.hacknet.getCoreUpgradeCost(i, 1);
    const fn = (ns, i) => ns.hacknet.upgradeCache(i, 1);
    return {i, type: "cache", price, dProd: 0, fn, msg: `hn-${i} now has ${s.cache+1} cache`};
}

function getUpgradeOptions(ns) {
    const options = [];
    const player = ns.getPlayer();
    for (let i=0; i<ns.hacknet.numNodes(); i++) {
        const stats = ns.hacknet.getNodeStats(i);
        for (let getOption of [getLevelOption, getRamOption, getCoreOption, getCacheOption]) {
            options.push(getOption(ns, i, stats, player.hacknet_node_money_mult));
        }
    }
    return options;
}

function upgradeServers(ns) {
    if (!getSettings(ns).hacknet.buying) {
        return;
    }

    let options = getUpgradeOptions(ns)
        .sort((a, b) => b.dProd/b.price - a.dProd/a.price);

    const hashThresh = getSettings(ns).hacknet.cacheThreshold || 0.9;
    if (ns.hacknet.numHashes() > ns.hacknet.hashCapacity() * hashThresh) {
        options = options.filter((upgrade) => upgrade.type == "cache");
    } else if (ns.hacknet.purchaseNode() > -1) {
        ns.toast("Bought a new hacknet node");
        return;
    }

    for (let upgrade of options) {
        if (upgrade.fn(ns, upgrade.i)) {
            ns.toast(upgrade.msg);
            break;
        }
    }
}

function spendHashes(ns) {
    // square it so it's always a little less than the threshold
    // used to decide to buy cache -- spend first, then expand
    const spendThresh = Math.pow(getSettings(ns).hacknet.cacheThreshold || 0.9, 2);
    if (ns.hacknet.numHashes() + 4 > ns.hacknet.hashCapacity() * spendThresh) {
        ns.hacknet.spendHashes("Sell for Money");
    }
}

function makeRow(ns, i) {
    const { name, production, level, ram, cores, cache } = ns.hacknet.getNodeStats(i);
    return [
        name,
        ns.nFormat(production, "0.00"),
        level,
        ram,
        cores,
        cache
    ];
}

function printStatus(ns) {
    ns.clearLog();

    const labels = ["", "#/s", "Lvl", "RAM", "Core", "Cache"];
    const rows = [];
    let totalProduction = 0;
    for (let i = 0; i < ns.hacknet.numNodes(); i++) {
        rows.push(makeRow(ns, i));
        totalProduction += ns.hacknet.getNodeStats(i).production;
    }
    const nodeTable = makeTable(ns, rows, labels);
    const meterLength = nodeTable.indexOf("\n") - 4;
    const currHashes = ns.hacknet.numHashes();
    const hashCap = ns.hacknet.hashCapacity();
    const currString = ns.nFormat(currHashes, "0.00a");
    const capString = ns.nFormat(hashCap, "0a");
    const meter = makeMeter(ns, hashCap, currHashes, meterLength);
    const prod = ns.nFormat(totalProduction, "0.00a");
    const cashProd = ns.nFormat(1000000*totalProduction/4, "$0.00a");

    ns.print(` [${meter}]`);
    ns.print(`  ${currString}/${capString} stored, gaining #${prod}/s (${cashProd})\n`);
    ns.print(nodeTable);
}

export async function main(ns) {
    ns.disableLog("ALL");
    while (true) {
        upgradeServers(ns);
        spendHashes(ns);
        printStatus(ns);
        await ns.sleep(getSettings(ns).hacknet.delay || 1000);
    }
}