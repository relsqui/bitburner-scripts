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
        ns.print(`(${fmt(favorSoFar)} + ${fmt(favorGain)}) = ${fmt(favorSoFar+favorGain)} / ${neededFavor}`);
        ns.print("Share power: " + ns.getSharePower());
        await ns.sleep(5000);
    } while (favorSoFar + favorGain < neededFavor);
    ns.kill("share-me.js");
    ns.kill("warthogs.js");
    ns.run("orchestrate.js", 1, "stop");
    ns.run("sendBatches.js");
    ns.toast("Time to install!", "success");
}