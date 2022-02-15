/** @param {NS} ns **/

import { makeTable } from './table.js';

const memBlocks = 6;
const moneyBlocks = 6;
const secBlocks = 6;
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

function ellipsis(string, maxLength, joiner = "'") {
    if (string.length < maxLength) {
        return string;
    }
    const half = (maxLength - joiner.length) / 2;
    const front = string.slice(0, Math.ceil(half));
    const back = string.slice(string.length - Math.floor(half));
    return front + joiner + back;
}

function countBatchProcesses(ns, host) {
    // TODO: get these from the plan file
    const [wfile, gfile, hfile] = ["just-weaken.js", "just-grow.js", "just-hack.js"];
    const processes = ns.ps(host);
    if (processes.length == 0) {
        return ["", "", "", ""];
    }
    const threadCounts = {};
    let target = processes[0].args[1];
    for (let p of processes) {
        if (p.args[1] == target) {
            threadCounts[p.filename] = (threadCounts[p.filename] || 0) + p.threads;
        }
    }
    return [target || "", threadCounts[wfile], threadCounts[gfile], threadCounts[hfile]]
        .map((a) => a == null ? "     -" : a);
}

function getTargetStats(ns, target) {
    if (target == "") {
        return ["", "", ""];
    }
    const maxMoney = ns.getServerMaxMoney(target);
    const currMoney = ns.getServerMoneyAvailable(target);
    const moneyBar = makeMeter(maxMoney, currMoney, moneyBlocks);
    const minSec = ns.getServerMinSecurityLevel(target);
    const currSec = ns.getServerSecurityLevel(target);
    const secBar = makeMeter(100 - minSec, currSec - minSec, secBlocks);
    return [ns.nFormat(maxMoney, "$0.00a"), moneyBar, secBar];
}

export async function main(ns) {
    ns.tail();
    ns.disableLog("ALL");
    while (true) {
        ns.clearLog();
        const hosts = ns.getPurchasedServers();
        hosts.sort((a, b) => hostnameToNumber(a) - hostnameToNumber(b));
        const labels = ["Host", "Size", "Memory", "W", "G", "H", "Target", "Max $", "Curr $", "Sec"];
        const data = [];
        for (let host of hosts) {
            const maxMem = ns.nFormat(ns.getServerMaxRam(host) * 1000000000, "0b");
            const memString = makeMeter(ns.getServerMaxRam(host), ns.getServerUsedRam(host), memBlocks);
            const [target, weakenThreads, growThreads, hackThreads] = countBatchProcesses(ns, host);
            const targetStats = getTargetStats(ns, target);
            data.push([host, maxMem, memString, weakenThreads, growThreads, hackThreads, ellipsis(target, 10), ...targetStats]);
        }
        ns.print(makeTable(ns, data, labels));
        await ns.sleep(100);
    }
}