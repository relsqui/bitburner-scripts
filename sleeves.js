/** @param {NS} ns **/

import { makeTable } from './table.js';

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

function makeTask(fn, args) {
    let task, crime, gymStatType, factionWorkType;
    switch (fn) {
        case "setToCommitCrime":
            task = "Crime";
            crime = args[0];
            break;
        case "setToFactionWork":
            task = "Faction";
            factionWorkType = args[2];
            break;
        case "setToGymWorkout":
            task = "Gym";
            gymStatType = `Train ${args[2]}`;
            break;
        case "setToUniversityCourse":
            task = "Class";
            break;
    }
    return { task, crime, gymStatType, factionWorkType };
}

function assignTask(ns, i, fn, ...args) {
    const task = makeTask(fn, args);
    if (formatTask(ns, i) == formatTask(ns, i, task)) {
        // this sleeve is already doing this task
        return;
    }
    ns.sleeve[fn](i, ...args);
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
            if (s.sync < 100) {
                ns.sleeve.setToSynchronize(i);
            } else if (s.shock > 50) {
                ns.sleeve.setToShockRecovery(i);
            } else if (!ns.gang.inGang()) {
                if (s.agility < 70 || s.defense < 70 || s.dexterity < 70 || s.strength < 70) {
                    assignTask(ns, i, "setToCommitCrime", "Mug");
                } else {
                    assignTask(ns, i, "setToCommitCrime", "Homicide");
                }
            } else if (ns.getPlayer().hacking < 100) {
                let course = "Study Computer Science";
                if (ns.getServerMoneyAvailable("home") > 100000000) {
                    ns.sleeve.travel(i, "Volhaven");
                    course = "Algorithms";
                }
                if (ns.sleeve.getInformation(i).city == "Volhaven") {
                    ns.sleeve.setToUniversityCourse(i, "ZB Institute of Technology", course);
                } else {
                    ns.sleeve.setToUniversityCourse(i, "Rothman University", course);
                }
            } else if (s.shock > 0) {
                ns.sleeve.setToShockRecovery(i);
            } else {
                if (s.agility < 70 || s.defense < 70 || s.dexterity < 70 || s.strength < 70) {
                    assignTask(ns, i, "setToCommitCrime", "Mug");
                } else if (s.agility < 200 || s.defense < 200 || s.dexterity < 200 || s.strength < 200) {
                    assignTask(ns, i, "setToCommitCrime", "Homicide");
                } else {
                    assignTask(ns, i, "setToCommitCrime", "Heist");
                }
            }
            rows.push(formatStats(ns, i));
        }
        ns.print(makeTable(ns, rows, labels));
        await ns.sleep(1000);
    }
}