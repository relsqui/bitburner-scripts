/** @param {NS} ns **/

import { makeTable, makeMeter } from './table.js';

function ramFmt (ns, n) {
    return ns.nFormat(n, "0.00b");
}

function getProcessTable(ns) {
    const processes = ns.ps();
    for (let p of processes) {
        p.mem = ns.getScriptRam(p.filename);
        p.totalMem = p.mem * p.threads;
        p.row = [
            [p.filename, ...p.args].join(" "),
            ramFmt(ns, p.totalMem),
            p.threads,
            ramFmt(ns, p.mem),
            p.pid,
        ];
    }
    processes.sort((a, b) => b.totalMem - a.totalMem);

    const rows = processes.map((p) => p.row);
    const labels = ["File", "Mem", "T", "Mem/T", "Pid"];
    return makeTable(ns, rows, labels, "top");
}

function getUsageLine(ns, table) {
    const meterLength = table.indexOf("\n") - 4;
    const maxRam = ns.getServerMaxRam("home");
    const usedRam = ns.getServerUsedRam("home");
    const meter = makeMeter(ns, maxRam, usedRam, meterLength);

    const cores = ns.getServer("home").cpuCores;
    const ramPrice = ns.nFormat(ns.getUpgradeHomeRamCost(), "$0.00a");
    const coresPrice = ns.nFormat(ns.getUpgradeHomeCoresCost(), "$0.00a");
    const usage = [
        ` ${ramFmt(ns, usedRam)}/${ramFmt(ns, maxRam)} RAM`,
        `(${ramPrice})`,
        "--",
        `${cores} cores`,
        `(${coresPrice})`,
    ].join(" ");
    return [usage, meter];
}

function getDisplayString(ns) {
    const table = getProcessTable(ns);
    const [usage, meter] = getUsageLine(ns, table);
    return [usage, ` [${meter}]`, "", table].join("\n");
}

export async function main(ns) {
    const delay = 100;
    ns.disableLog("ALL");
    ns.tail();
    while (true) {
        ns.clearLog();
        ns.print(getDisplayString(ns));
        await ns.sleep(delay);
    }
}