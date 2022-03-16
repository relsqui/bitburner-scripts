/** @param {NS} ns **/

import goto from './goto.js';
import { hosts_by_distance } from './breadth-first.js';

export async function main(ns) {
    ns.clearLog();
    ns.disableLog("ALL");
    const hosts = hosts_by_distance(ns)
        .filter((host) =>
            !["w0r1d_d43m0n", "darkweb"].includes(host) &&
            !host.startsWith("hacknet-node-") &&
            !host.startsWith("warthog")
        ).map((host) => {
            return {host, hackReq: ns.getServerRequiredHackingLevel(host)};
        }).sort((a, b) => a.hackReq - b.hackReq);

    for (let { host, hackReq } of hosts) {
        if (ns.getServer(host).backdoorInstalled) {
            ns.print(`${host} already backdoored.`);
            continue;
        }
        ns.print(`  Next is ${host} at ${hackReq}`);
        while (ns.getHackingLevel() < ns.getServerRequiredHackingLevel(host) ||
               !ns.hasRootAccess(host)) {
            await ns.sleep(100);
        }
        await goto(ns, host);
        await ns.installBackdoor(host);
        ns.print(`Backdoored ${host}`);
        await ns.connect("home");
        await ns.sleep(10);
    }
}