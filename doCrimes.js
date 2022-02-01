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
        const relevantKeys = Object.keys(crimeStats).filter((k) => k.endsWith(priority));
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
    while (true) {
        // do this inside the loop because success chance changes
        crimes.sort((a, b) =>
            crimeValues[b] * ns.getCrimeChance(b) - crimeValues[a] * ns.getCrimeChance(a));
        // if we don't keep tail up it's hard to stop this script
        ns.tail();
        await ns.commitCrime(crimes[0]);
        while (ns.isBusy()) {
            await ns.sleep(10);
        }
    }
}
