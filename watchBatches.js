/** @param {NS} ns **/

import { makeMeter, makeTable } from './table.js';
import { hosts_by_distance } from './breadth-first.js';

function getTargetStats(ns, target, plans) {
    if (target == "") {
        return ["", "", ""];
    }
    const maxMoney = ns.getServerMaxMoney(target);
    const currMoney = ns.getServerMoneyAvailable(target);
    const moneyBar = makeMeter(ns, maxMoney, currMoney, 8);
    const minSec = ns.getServerMinSecurityLevel(target);
    const currSec = ns.getServerSecurityLevel(target);
    const maxSec = Math.max(100, currSec);
    const secBar = makeMeter(ns, maxSec - minSec, currSec - minSec, 8);

    let w = 0;
    let g = 0;
    let h = 0;
    for (let plan of Object.values(plans)) {
        w += plan.threads.mitigateHack + plan.threads.mitigateGrow;
        g += plan.threads.grow;
        h += plan.threads.hack;
    }
    [w, g, h] = [w, g, h].map((n) => ns.nFormat(n, "0,0"));
    return [ns.nFormat(maxMoney, "$0.00a"), moneyBar, secBar, w, g, h];
}

function getHosts(plans) {
    const hosts = [];
    for (let plan of Object.values(plans)) {
        if (!hosts.includes(plan.host)) {
            hosts.push(plan.host)
        }
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

function getNextETA(ns, plansByHost) {
    const plans = Object.values(plansByHost);
    if (plans.length == 0) {
        return "";
    }
    function timeToFinish(plan) {
        return Math.round((plan.timing.started + plan.timing.eta - Date.now())/1000);
    }
    plans.sort((a, b) => timeToFinish(a) - timeToFinish(b));
    return timeToFinish(plans[0]);
}

export function buildMonitorTable(ns, plansByHost, targets = null) {
    const plansByTarget = flipPlanTable(plansByHost);
    const myHack = ns.getHackingLevel();
    targets = targets || hosts_by_distance(ns).filter((h) => !h.startsWith("warthog"))
        .filter(ns.hasRootAccess)
        .filter((t) => myHack >= ns.getServerRequiredHackingLevel(t))
        .filter((t) => ns.getServerMaxMoney(t) > 0)
        .sort((a, b) => ns.getServerMaxMoney(b) - ns.getServerMaxMoney(a))
        .slice(0, 20);
    const labels = ["Target", "Max $", "Curr $", "Curr Sec", "W", "G", "H", "Hosts", "ETA"];
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
        data.push([target, ...targetStats, hostString, getNextETA(ns, plans)]);
    }
    const table = makeTable(ns, data, labels, null, "batch status");
    return table;
}