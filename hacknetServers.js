/** @param {NS} ns **/

import { getSettings } from './settings.js';
import { makeMeter, makeTable } from './table.js';


function getLevelOption(ns, i, s, mult, oldProd) {
    const price = ns.hacknet.getLevelUpgradeCost(i, 1);
    const newProd = ns.formulas.hacknetServers.hashGainRate(s.level + 1, s.ram, s.ram, s.cores, mult);
    const dProd = newProd - oldProd;
    const fn = (ns, i) => ns.hacknet.upgradeLevel(i, 1);
    return { i, type: "level", price, dProd, fn, msg: `hn-${i} is now level ${s.level + 1}` };
}

function getRamOption(ns, i, s, mult, oldProd) {
    const price = ns.hacknet.getRamUpgradeCost(i, 1);
    const newProd = ns.formulas.hacknetServers.hashGainRate(s.level, s.ram * 2, s.ram * 2, s.cores, mult);
    const dProd = newProd - oldProd;
    const fn = (ns, i) => ns.hacknet.upgradeRam(i, 1);
    return { i, type: "ram", price, dProd, fn, msg: `hn-${i} now has ${ns.nFormat(s.ram * 2000000000, "0b")} ram` };
}

function getCoreOption(ns, i, s, mult, oldProd) {
    const price = ns.hacknet.getCoreUpgradeCost(i, 1);
    const newProd = ns.formulas.hacknetServers.hashGainRate(s.level, s.ram, s.ram, s.cores + 1, mult);
    const dProd = newProd - oldProd;
    const fn = (ns, i) => ns.hacknet.upgradeCore(i, 1);
    return { i, type: "core", price, dProd, fn, msg: `hn-${i} now has ${s.cores + 1} cores` };
}

function getCacheOption(ns, i, s, _mult, _oldProd) {
    const price = ns.hacknet.getCacheUpgradeCost(i, 1);
    const fn = (ns, i) => ns.hacknet.upgradeCache(i, 1);
    return { i, type: "cache", price, dProd: 0, fn, msg: `hn-${i} now has ${s.cache + 1} cache` };
}

function getUpgradeOptions(ns) {
    const options = [];
    const mult = ns.getPlayer().hacknet_node_money_mult;
    for (let i = 0; i < ns.hacknet.numNodes(); i++) {
        const s = ns.hacknet.getNodeStats(i);
        for (let getOption of [getLevelOption, getRamOption, getCoreOption, getCacheOption]) {
            // I'm not sure this is right, but it's at least
            // wrong the same way as the option functions
            const oldProd = ns.formulas.hacknetServers.hashGainRate(s.level + 1, s.ram, s.ram, s.cores, mult);
            options.push(getOption(ns, i, s, mult, oldProd));
        }
    }
    return options;
}

function atMaxProd(ns) {
    const maxProd = getSettings(ns).hacknet.maxProd;
    if (maxProd == null) {
        // no prod requirement -> okay to keep growing prod
        return false;
    }
    let production = 0;
    for (let i = 0; i < ns.hacknet.numNodes(); i++) {
        production += ns.hacknet.getNodeStats(i).production;
    }
    return production > maxProd;
}

function atMinCache(ns) {
    if (ns.hacknet.numNodes() == 0) {
        // buy servers, then worry about cache
        return true;
    }
    const minCache = getSettings(ns).hacknet.minCache;
    if (minCache == null) {
        // no cache requirement -> don't buy cache unless overflowing
        return true;
    }
    return ns.hacknet.hashCapacity() > minCache;
}

function upgradeServers(ns) {
    const buying = getSettings(ns).hacknet.buying && !atMaxProd(ns);
    const buyingCache = getSettings(ns).hacknet.buyingCache || !atMinCache(ns);
    if (!(buying || buyingCache)) {
        return;
    }

    const toast = getSettings(ns).hacknet.toasts ? ns.toast : () => { };
    if (buying && ns.hacknet.purchaseNode() > -1) {
        toast("Bought a new hacknet node");
        return;
    }

    let threshold = getSettings(ns).hacknet.cacheThreshold;
    threshold = threshold == null ? 0.9 : threshold;
    let options = getUpgradeOptions(ns)
        .sort((a, b) => b.dProd / b.price - a.dProd / a.price);

    if (ns.hacknet.numHashes() > ns.hacknet.hashCapacity() * threshold || !atMinCache(ns)) {
        options = options.filter((upgrade) => upgrade.type == "cache");
        options.sort((a, b) => a.price - b.price);
    } else if (buying) {
        options = options.filter((upgrade) => upgrade.type != "cache");
    } else {
        options = [];
    }

    for (let upgrade of options) {
        if (upgrade.fn(ns, upgrade.i)) {
            toast(upgrade.msg);
            break;
        }
    }
}

function getUpgradePriorities(ns) {
    return ns.hacknet.getHashUpgrades()
        .filter((upgrade) => {
            for (let priority of getSettings(ns).hacknet.upgrades || []) {
                if (upgrade.toLowerCase().endsWith(priority.toLowerCase())) {
                    return true;
                }
            }
            return false;
        });
}

function spendHashes(ns) {
    const threshold = getSettings(ns).hacknet.saveThreshold || 0;
    const maxSpends = getSettings(ns).hacknet.maxSpends || 100;
    for (let upgrade of getUpgradePriorities(ns)) {
        const cost = ns.hacknet.hashCost(upgrade);
        for (let i = 0; i < maxSpends; i++) {
            if (ns.hacknet.spendHashes(upgrade)) {
                ns.toast(`Bought '${upgrade}' (#${ns.nFormat(cost, "0.00a")})`);
            } else {
                break;
            }
        }
    }
    for (let i = 0; (i < maxSpends) && (ns.hacknet.numHashes() + 4 > ns.hacknet.hashCapacity() * threshold); i++) {
        ns.hacknet.spendHashes("Sell for Money");
    }
}

function makeRow(ns, i) {
    const { name, production, level, ram, cores, cache } = ns.hacknet.getNodeStats(i);
    return [
        name,
        ns.nFormat(production, "0.000"),
        level,
        ns.nFormat(ram * 1000000000, "0.00b"),
        cores,
        cache
    ];
}

function printStatus(ns) {
    ns.clearLog();

    const labels = ["", "#/s", "Lvl", "RAM", "Co", "Ca"];
    const rows = [];
    let totalProduction = 0;
    for (let i = 0; i < ns.hacknet.numNodes(); i++) {
        rows.push(makeRow(ns, i));
        totalProduction += ns.hacknet.getNodeStats(i).production;
    }
    const nodeTable = makeTable(ns, rows, labels);

    const meterLength = nodeTable.indexOf("\n") - 3;
    const currHashes = ns.hacknet.numHashes();
    const hashCap = ns.hacknet.hashCapacity();
    const meter = makeMeter(ns, hashCap, currHashes, meterLength);

    const currString = ns.nFormat(currHashes, "0.00a");
    const capString = ns.nFormat(hashCap, "0.00a");
    const hashesInMoney = ns.nFormat(currHashes * 250000, "$0.00a");
    const prod = ns.nFormat(totalProduction, "0.00a");
    const cashProd = ns.nFormat(1000000 * totalProduction / 4, "$0.00a");

    const upgradeForecast = prod == 0 ? [] : getUpgradePriorities(ns).map((upgrade) => {
        const name = upgrade.replace(/.* for /, "");
        const cost = ns.hacknet.hashCost(upgrade);
        const eta = ns.nFormat((cost - currHashes)/prod, "00:00").replace(/0*:/, "");
        return `  Next ${name}: #${ns.nFormat(cost, "0.00a")} (${eta})`;
    });

    ns.print(` [${meter}]`);
    ns.print(`  #${currString}/${capString} (${hashesInMoney}) + #${prod}/s (${cashProd})\n`);
    ns.print(upgradeForecast.join("\n") + "\n");
    ns.print(nodeTable);
    ns.print("");
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