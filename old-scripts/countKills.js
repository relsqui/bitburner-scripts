/** @param {NS} ns **/
export async function main(ns) {
    const filename = "killCount.txt";
    const kills = ns.getPlayer().numPeopleKilled;
    await ns.write(filename, kills, "a");
    ns.tprint(`${kills} kills so far. Wrote to ${filename}`);
}