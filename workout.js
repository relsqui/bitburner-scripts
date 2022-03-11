/** @param {NS} ns **/
export async function main(ns) {
    ns.disableLog("sleep");
    const threshold = ns.args[0];
    const delay = 3000;
    const stats = ["strength", "defense", "dexterity", "agility"];
    stats.sort((a, b) => ns.getPlayer()[a] - ns.getPlayer()[b]);
    for (let stat of stats) {
        let prevStat = ns.getPlayer()[stat];
        if (threshold && prevStat >= threshold) {
            continue;
        }
        ns.gymWorkout("powerhouse gym", stat, false);
        let newStat = prevStat;
        do {
            prevStat = newStat;
            await ns.sleep(delay);
            newStat = ns.getPlayer()[stat];
        } while (newStat < (threshold || newStat + 1) && newStat > prevStat);
    }
    ns.stopAction();
}