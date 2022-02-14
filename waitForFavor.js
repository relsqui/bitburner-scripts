/** @param {NS} ns **/
export async function main(ns) {
    function fmt(n) {
        return ns.nFormat(n, "0.00");
    }
    ns.disableLog("ALL");
    ns.tail();
    const faction = ns.args[0] || "Daedalus";
    const neededFavor = ns.getFavorToDonate();
    const favorSoFar = ns.getFactionFavor(faction);
    let favorGain;
    do {
        ns.workForFaction(faction, ns.args[1] || "Hacking Contracts", false);
        favorGain = ns.getFactionFavorGain(faction);
        ns.clearLog();
        ns.print(`(${fmt(favorSoFar)} + ${fmt(favorGain)}) / ${neededFavor} favor`);
        await ns.sleep(5000);
    } while (favorSoFar + favorGain < neededFavor);
    ns.toast("Time to install!", "success");
}