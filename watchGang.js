/** @param {NS} ns **/
export async function main(ns) {
    ns.disableLog("ALL");
    function fmt(n, places = 2) {
        return ns.nFormat(n, "0." + "0".repeat(places));
    }
    ns.tail();
    while (true) {
        ns.clearLog();
        const gang = ns.gang.getGangInformation();
        const pString = `${Math.round(gang.power)} Power`;
        const rString = `${Math.round(gang.respect)} + ${fmt(gang.respectGainRate)}/s Respect`;
        const mString = `${ns.nFormat(gang.moneyGainRate, "$0.00a")}/s`;
        const wString = `${fmt(gang.wantedLevel)} + ${fmt(gang.wantedLevelGainRate, 8)}/s (${ns.nFormat(-1 + gang.wantedPenalty, "0.00%")}) Wanted Level`;
        ns.print(`${gang.faction} Gang\n`);
        ns.print([mString, pString, rString].join(" || "));
        ns.print(wString + "\n");
        for (let member of ns.gang.getMemberNames()) {
            const info = ns.gang.getMemberInformation(member);
            ns.print(`${member} - ${info.task}`);
        }
        await ns.sleep(100);
    }
}