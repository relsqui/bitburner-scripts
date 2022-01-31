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

export async function main(ns) {
    const acceptableRisk = 0.7;
    ns.disableLog("sleep");
    while (true) {
        let crimesToTry = crimes.filter((c) => ns.getCrimeChance(c) > acceptableRisk);
        if (crimesToTry.includes("homicide")) {
            // speed grind negative karma
            crimesToTry = ["homicide"];
        }
        for (let crime of crimesToTry) {
            // make sure the process kill button is always available
            // since it's the least disruptive way to stop
            ns.tail();
            await ns.commitCrime(crime);
            while (ns.isBusy()) {
                await ns.sleep(100);
            }
        }
    }
  }