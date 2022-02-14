/** @param {NS} ns **/
export async function main(ns) {
    ns.disableLog("ALL");
    const cycles = 5;
    function fmt(n, places = 2) {
        return ns.nFormat(n, "0." + "0".repeat(places) + "a");
    }
    ns.tail();
    while (true) {
        ns.clearLog();
        const gang = ns.gang.getGangInformation();
        const pString = `${fmt(gang.power)} Power`;
        const rString = `${fmt(gang.respect)} + ${fmt(gang.respectGainRate * cycles)}/s Respect`;
        const mString = `${ns.nFormat(gang.moneyGainRate * cycles, "$0.00a")}/s`;
        const wString = `${fmt(gang.wantedLevel)} + ${fmt(gang.wantedLevelGainRate * cycles, 8)}/s (${ns.nFormat(-1 + gang.wantedPenalty, "0.00%")}) Wanted Level`;
        const war = gang.territoryWarfareEngaged ? "ON" : "OFF";
        const clashChance = ns.nFormat(gang.territoryClashChance, "0.00%");
        ns.print(`${gang.faction} Gang`);
        ns.print(`${ns.nFormat(gang.territory, "0.00%")} territory, warfare is ${war} (${clashChance})`);
        ns.print([mString, pString, rString].join(" || "));
        ns.print(wString + "\n");
        for (let member of ns.gang.getMemberNames()) {
            const info = ns.gang.getMemberInformation(member);
            ns.print(`${member} - ${info.task}`);
        }
        await ns.sleep(100);
    }
}