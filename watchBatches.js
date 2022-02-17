/** @param {NS} ns **/

import { makeTable } from './table.js';
import { hosts_by_distance } from './breadth-first.js';

const moneyBlocks = 16;
const secBlocks = 16;
const freeChar = ".";
const usedChar = "#";

function hostnameToNumber(hostname) {
    return Number(hostname.split("-")[1] || -1);
}

function makeMeter(full, current, blocks) {
    const blockSize = full / blocks;
    let usedBlocks = Math.round(current / blockSize);
    if (usedBlocks == 0 && current > 0) {
        // never show something as nothing
        usedBlocks = 1;
    } else if (usedBlocks == blocks && current < full) {
        // never show less than full as full
        usedBlocks -= 1;
    }
    const freeBlocks = blocks - usedBlocks;
    return usedChar.repeat(usedBlocks) + freeChar.repeat(freeBlocks);
}

function getTargetStats(ns, target, plans) {
    if (target == "") {
        return ["", "", ""];
    }
    const maxMoney = ns.getServerMaxMoney(target);
    const currMoney = ns.getServerMoneyAvailable(target);
    const moneyBar = makeMeter(maxMoney, currMoney, moneyBlocks);
    const minSec = ns.getServerMinSecurityLevel(target);
    const currSec = ns.getServerSecurityLevel(target);
    const secBar = makeMeter(100 - minSec, currSec - minSec, secBlocks);

    let w = 0;
    let g = 0;
    let h = 0;
    for (let plan of Object.values(plans)) {
        w += plan.threads.mitigateHack + plan.threads.mitigateGrow;
        g += plan.threads.grow;
        h += plan.threads.hack;
    }
    return [ns.nFormat(maxMoney, "$0.00a"), moneyBar, secBar, w, g, h];
}

function getHosts(plans) {
    const hosts = [];
    for (let plan of Object.values(plans)) {
        hosts.push(plan.host)
    }
    return hosts;
}

function flipPlanTable(plansByHost) {
    const plansByTarget = {};
    for (let host of Object.keys(plansByHost)) {
        for (let target of Object.keys(plansByHost[host])) {
            plansByTarget[target] = { ...(plansByTarget[target] || {}), ...plansByHost[host][target] };
        }
    }
    return plansByTarget;
}

export function buildMonitorTable(ns, plansByHost) {
    const plansByTarget = flipPlanTable(plansByHost);
    const targets = hosts_by_distance(ns).filter((h) => !h.startsWith("warthog"))
        .filter(ns.hasRootAccess)
        .filter((t) => ns.getServerMaxMoney(t) > 0)
        .sort((a, b) => ns.getServerMaxMoney(b) - ns.getServerMaxMoney(a))
        .slice(0, 20);
    const labels = ["Target", "Max $", "Cur $", "Cur Sec", "W", "G", "H", "Hosts"]; //, "Host", "Mem", "ETA"];
    const data = [];
    for (let target of targets) {
        const plans = plansByTarget[target] || {};
        const targetStats = getTargetStats(ns, target, plans);
        const hosts = getHosts(plans).sort((a, b) => ns.getServerMaxRam(b) - ns.getServerMaxRam(a));
        let hostString = "";
        if (hosts.length > 0) {
            hostString = `${hosts[0]}`;
            if (hosts.length > 1) {
                hostString += ` (+${hosts.length-1})`;
            }
        }
        data.push([target, ...targetStats, hostString]);
    }
    const table = makeTable(ns, data, labels);
    return table;
}