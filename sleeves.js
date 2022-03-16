/** @param {NS} ns **/

import { companies } from './getJobs.js';
import { getSettings } from './settings.js';
import { makeTable } from './table.js';


function crimeSuccessRate(ns, i, crime) {
    // adapted from https://github.com/danielyxie/bitburner/blob/dev/src/Crime/Crime.ts
    const stats = ns.sleeve.getSleeveStats(i);
    const crimeStats = ns.getCrimeStats(crime);
    // defined in Constants.ts, afaict I can't get at it from code
    const maxSkillLevel = 975;
    let chance =
      crimeStats.hacking_success_weight * stats.hacking +
      crimeStats.strength_success_weight * stats.strength +
      crimeStats.defense_success_weight * stats.defense +
      crimeStats.dexterity_success_weight * stats.dexterity +
      crimeStats.agility_success_weight * stats.agility +
      crimeStats.charisma_success_weight * stats.charisma;
    chance /= maxSkillLevel;
    chance /= crimeStats.difficulty;
    chance *= ns.sleeve.getInformation(i).mult.crimeSuccess;
    return Math.min(chance, 1);
}

function formatTask(ns, i, t) {
    const task = t || ns.sleeve.getTask(i);
    let taskString = task.task;
    const details = []
    for (let key of ["crime", "gymStatType", "factionWorkType", "location"]) {
        if (task[key] && !["", "None"].includes(task[key]) && !task[key].match(/^[0-9.]*$/)) {
            details.push(task[key]);
        }
    }
    if (details.length > 0) {
        taskString += ` (${details.join(", ")})`;
    }
    if (task.task = "Crime" && task.crime) {
        taskString += ` ${ns.nFormat(crimeSuccessRate(ns, i, task.crime), "0%")}`;
    }
    return taskString;
}

const lastIncome = [];

function getIncome(ns, i) {
    let money = 0;
    let time = 1;
    const info = ns.sleeve.getInformation(i);
    const newIncome = {
        money: info.earningsForPlayer.workMoneyGain || 0,
        time: Date.now()/1000,
        // strip crime success percentages so they don't count as different tasks
        task: formatTask(ns, i).replace(/[0-9]*%/, ""),
    }
    if (lastIncome[i]) {
        money = newIncome.money - lastIncome[i].money;
        time = newIncome.time - lastIncome[i].time;
    }
    if ((!lastIncome[i]) || lastIncome[i].task != newIncome.task) {
        lastIncome[i] = newIncome;
    }
    return money/time;
}

function formatStats(ns, i) {
    const formatted = [i, ns.sleeve.getSleeveAugmentations(i).length];
    const stats = ns.sleeve.getSleeveStats(i);
    formatted.push(ns.nFormat(stats.shock, "0.000"));
    for (let key of ["hacking", "strength", "defense", "dexterity", "agility", "charisma"]) {
        formatted.push(ns.nFormat(stats[key], "0a"));
    }
    formatted.push(formatTask(ns, i));
    formatted.push(ns.nFormat(getIncome(ns, i), "$0.00a"));
    return formatted;
}

function assignCrime(ns, i, crimes) {
    const crimeSuccessThreshold = getSettings(ns).sleeves.crimeSuccessThreshold || 0.5;
    let crime;
    for (crime of crimes) {
        if (crimeSuccessRate(ns, i, crime) > crimeSuccessThreshold) {
            break;
        }
    }
    const task = ns.sleeve.getTask(i);
    if (task.crime == crime) {
        return;
    }
    ns.sleeve.setToCommitCrime(i, crime);
}

function hasCrimeBuffs(aug) {
    const priorities = ["crime_success_mult", "crime_money_mult"];
    for (let skill of ["agility", "dexterity", "defense", "strength"]) {
        priorities.push(skill + "_mult", skill + "_exp_mult");
    }
    for (let key of priorities) {
        if (aug[key] && aug[key] > 1) {
            return true;
        }
    }
    return false;
}

function hasHackBuffs(aug) {
    const keys = Object.keys(aug).filter((k) => k.startsWith("hacking"));
    for (let key of keys) {
        if (aug[key] && aug[key] > 1) {
            return true;
        }
    }
    return false;
}

function buyAnAugment(ns, i) {
    const augPairs = ns.sleeve.getSleevePurchasableAugs(i);
    let augments = [];
    for (let {cost, name} of augPairs) {
        augments.push({
            name,
            cost,
            ...ns.getAugmentationStats(name)
        })
    }
    const maxSpend = getSettings(ns).sleeves.maxSpend || ns.getServerMoneyAvailable("home");
    augments = augments.filter((a) => a.cost < maxSpend);
    let augsToGet = augments.filter(hasCrimeBuffs);
    if (augsToGet.length == 0 && getSettings(ns).sleeves.augTypes.hacking) {
        augsToGet = augments.filter(hasHackBuffs);
    }
    if (augsToGet.length == 0 && getSettings(ns).sleeves.augTypes.other) {
        augsToGet = augments;
    }
    augsToGet.sort((a, b) => a.cost - b.cost);
    if (augsToGet.length > 0 && ns.getServerMoneyAvailable("home") > augsToGet[0].cost) {
        ns.sleeve.purchaseSleeveAug(i, augsToGet[0].name);
        ns.toast(`Bought ${augsToGet[0].name} for sleeve ${i}.`);
    }
}

function studyCS(ns, i) {
    let course = "Study Computer Science";
    if (getSettings(ns).sleeves.buying && ns.getServerMoneyAvailable("home") > 300000000) {
        ns.sleeve.travel(i, "Volhaven");
        course = "Algorithms";
    }
    let uni;
    if (ns.sleeve.getInformation(i).city == "Volhaven") {
        uni = "ZB Institute of Technology";
    } else {
        ns.sleeve.travel(i, "Sector-12");
        uni = "Rothman University";
    }
    const task = ns.sleeve.getTask(i);
    if (task.task == "Class" && task.location == uni) {
        return;
    }
    ns.sleeve.setToUniversityCourse(i, uni, course);
}

function getPriorityTask(ns, i) {
    switch (getSettings(ns).sleeves.priority) {
        case "cs":
            studyCS(ns, i);
            return true;
        case "cha":
            ns.sleeve.travel(i, "Volhaven");
            ns.sleeve.setToUniversityCourse(i, "ZB Institute of Technology", "Leadership");
            return true;
        case "rep":
            let factions = ns.getPlayer().factions;
            if (factions.includes("Daedalus")) {
                factions = factions.filter((f) => f != "Daedalus");
                factions.unshift("Daedalus");
            }
            const myFaction = factions[i];
            const factionPref = getSettings(ns).sleeves.faction;
            if (myFaction && (myFaction == factionPref || !factionPref)) {
                for (let workType of ["Security", "Field", "Hacking"]) {
                    if (ns.sleeve.setToFactionWork(i, myFaction, workType)) {
                        return true;
                    }
                }
            }
            return false;
        case "money":
            assignCrime(ns, i, ["Heist", "Homicide", "Mug"]);
            return true;
        default:
            return false;
    }
}

export async function main(ns) {
    ns.disableLog("ALL");
    const labels = ["#", "A", "Shock", "Hack", "Str", "Def", "Dex", "Agi", "Cha", "Task", "$"];
    const sleeveCount = ns.sleeve.getNumSleeves();
    for (let i = 0; i < sleeveCount; i++) {
        // clear tasks on startup so we don't get overlapping
        // factions, jobs, etc.
        ns.sleeve.setToShockRecovery(i);
    }
    while (true) {
        ns.clearLog();
        const sleeveCount = ns.sleeve.getNumSleeves();
        const rows = [];
        for (let i = 0; i < sleeveCount; i++) {
            if (getSettings(ns).sleeves.buying) {
                buyAnAugment(ns, i);
            }
            const s = ns.sleeve.getSleeveStats(i);
            const p = ns.getPlayer();
            if (getPriorityTask(ns, i)) {
            } else if (!ns.gang.inGang()) {
                assignCrime(ns, i, ["Homicide"]);
            } else if (s.shock > 50) {
                ns.sleeve.setToShockRecovery(i);
            } else if (s.sync < 100) {
                ns.sleeve.setToSynchronize(i);
            } else if (p.hacking < (getSettings(ns).sleeves.targetHackLvl || 50)) {
                studyCS(ns, i);
            } else if (i == 0 && ns.getFactionRep("Daedalus") > 0 && !ns.getOwnedAugmentations(true).includes("The Red Pill")) {
                ns.sleeve.setToFactionWork(i, "Daedalus", "Hacking Contracts");
            } else if (getSettings(ns).sleeves.doJobs && ns.getPlayer().jobs[companies[i]]) {
                ns.sleeve.setToCompanyWork(i, companies[i]);
            } else {
                assignCrime(ns, i, ["Heist", "Homicide", "Mug"]);
            }
            rows.push(formatStats(ns, i));
        }
        ns.print(makeTable(ns, rows, labels));
        await ns.sleep(1000);
    }
}