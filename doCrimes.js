/** @param {NS} ns **/

const crimes = [
    "shoplift",
    "rob store",
    "mug someone",
    "larceny",
    "deal drugs",
    "bond forgery",
    "traffick illegal arms",
    "homicide",
    "grand theft auto",
    "kidnap and ransom",
    "assassinate",
    "heist",
];

function getCrimeValues(ns, priority) {
    const crimeValues = {};
    for (let crime of crimes) {
        const crimeStats = ns.getCrimeStats(crime);
        // using endswith lets us use 'exp' or 'xp' to combine all stat xp
        let relevantKeys = Object.keys(crimeStats).filter((k) => k.endsWith(priority));
        if (relevantKeys.length == 0) {
            // if that didn't work, check for 'hack' or 'int' etc.
            relevantKeys = Object.keys(crimeStats).filter((k) => k.startsWith(priority));
        }
        const relevantValues = relevantKeys.map((k) => crimeStats[k]);
        crimeValues[crime] = relevantValues.reduce((a, b) => a + b) / crimeStats.time;
    }
    return crimeValues;
}

export async function main(ns) {
    ns.disableLog("sleep");
    // possible priorities: karma, kills, money, STAT_exp, xp
    const priority = ns.args[0] || "money";
    const crimeValues = getCrimeValues(ns, priority);
    const ev = priority.endsWith("xp") ?
        // you get half xp for failing a crime
        (crime) => {
            const chance = ns.getCrimeChance(crime);
            return (crimeValues[crime] * chance) +
                (crimeValues[crime]/2 * (1 - chance));
        } :
        // other rewards only happen if you succeed
        (crime) => crimeValues[crime] * ns.getCrimeChance(crime);
    while (true) {
        // do this inside the loop because success chance changes
        crimes.sort((a, b) => ev(b) - ev(a));
        // if we don't keep tail up it's hard to stop this script
        ns.tail();
        ns.print(`Expected rate: ${ev(crimes[0])*1000} ${priority}/s`);
        await ns.commitCrime(crimes[0]);
        while (ns.isBusy()) {
            await ns.sleep(10);
        }
        if (priority == "karma" && ns.gang.createGang("Slum Snakes")) {
            ns.run("runGang.js");
            ns.run("watchGang.js");
            ns.workForFaction("NiteSec", "Hacking Contracts", true);
            break;
        }
    }
}