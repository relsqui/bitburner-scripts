/** @param {NS} ns **/

import { getSettings } from './settings.js';
import { makeTable } from './table.js';

/* TODO:
from https://github.com/danielyxie/bitburner/blob/dev/src/Crime/Crime.ts
  successRate(p: IPlayerOrSleeve): number {
    let chance: number =
      this.hacking_success_weight * p.hacking +
      this.strength_success_weight * p.strength +
      this.defense_success_weight * p.defense +
      this.dexterity_success_weight * p.dexterity +
      this.agility_success_weight * p.agility +
      this.charisma_success_weight * p.charisma +
      CONSTANTS.IntelligenceCrimeWeight * p.intelligence;
    chance /= CONSTANTS.MaxSkillLevel;
    chance /= this.difficulty;
    chance *= p.crime_success_mult;
    chance *= p.getIntelligenceBonus(1);

    return Math.min(chance, 1);
  }
*/

function formatTask(ns, i, t) {
    const task = t || ns.sleeve.getTask(i);
    let taskString = task.task;
    const details = []
    for (let key of ["crime", "gymStatType", "factionWorkType"]) {
        if (task[key] && !["", "None"].includes(task[key])) {
            details.push(task[key]);
        }
    }
    if (details.length > 0) {
        taskString += ` (${details.join(", ")})`;
    }
    return taskString;
}

function formatStats(ns, i) {
    const formatted = [i];
    const stats = ns.sleeve.getSleeveStats(i);
    for (let key of ["shock", "sync"]) {
        formatted.push(ns.nFormat(stats[key], "0.000"));
    }
    for (let key of ["hacking", "strength", "defense", "dexterity", "agility", "charisma"]) {
        formatted.push(stats[key]);
    }
    formatted.push(formatTask(ns, i));
    return formatted;
}

function assignCrime(ns, i, crime) {
    const task = ns.sleeve.getTask(i);
    if (task.crime == crime) {
        return;
    }
    ns.sleeve.setToCommitCrime(i, crime);
}

export async function main(ns) {
    ns.disableLog("ALL");
    const labels = ["#", "Shock", "Sync", "Hack", "Str", "Def", "Dex", "Agi", "Cha", "Task"];
    while (true) {
        ns.clearLog();
        const sleeveCount = ns.sleeve.getNumSleeves();
        const rows = [];
        for (let i = 0; i < sleeveCount; i++) {
            // TODO: autobuy augments
            const s = ns.sleeve.getSleeveStats(i);
            const p = ns.getPlayer();
            if (s.sync < 100) {
                ns.sleeve.setToSynchronize(i);
            } else if (s.shock > 50) {
                ns.sleeve.setToShockRecovery(i);
            } else if (!ns.gang.inGang()) {
                if (s.agility < 70 || s.defense < 70 || s.dexterity < 70 || s.strength < 70) {
                    assignCrime(ns, i, "Mug");
                } else {
                    assignCrime(ns, i, "Homicide");
                }
            } else if (i == 0 && ns.getFactionRep("Daedalus") > 0 && !ns.getOwnedAugmentations(true).includes("The Red Pill")) {
                ns.sleeve.setToFactionWork(i, "Daedalus", "Hacking Contracts");
            } else if (s.shock > 0) {
                ns.sleeve.setToShockRecovery(i);
            } else if (s.hacking < 200 || p.hacking < 200) {
                let course = "Study Computer Science";
                if (getSettings(ns).sleeves.buying && ns.getServerMoneyAvailable("home") > 300000000) {
                    ns.sleeve.travel(i, "Volhaven");
                    course = "Algorithms";
                }
                if (ns.sleeve.getInformation(i).city == "Volhaven") {
                    ns.sleeve.setToUniversityCourse(i, "ZB Institute of Technology", course);
                } else {
                    ns.sleeve.setToUniversityCourse(i, "Rothman University", course);
                }
            // } else {
            //     if (s.agility < 70 || s.defense < 70 || s.dexterity < 70 || s.strength < 70) {
            //         assignCrime(ns, i, "Mug");
            //     } else if (s.agility < 400 || s.defense < 400 || s.dexterity < 400 || s.strength < 400) {
            //         assignCrime(ns, i, "Homicide");
            //     } else {
            //         assignCrime(ns, i, "Heist");
            //     }
            }
            rows.push(formatStats(ns, i));
        }
        ns.print(makeTable(ns, rows, labels));
        await ns.sleep(1000);
    }
}