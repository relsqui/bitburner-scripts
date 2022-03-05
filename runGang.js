/** @param {NS} ns **/

import { getSettings } from './settings.js';

const enemyRates = {};
let ourLastChange = 0;

function averageEnemyRate(enemy) {
	return enemyRates[enemy].reduce((a, b) => a + b) / enemyRates[enemy].length;
}

async function waitForTick(ns, infoFn) {
	const oldPower = infoFn().power;
	while (oldPower == infoFn().power) {
		await ns.sleep(1);
	}
	ns.print("Tick!");
}

async function maybeRecruit(ns) {
	const names = ["Apple", "Banana", "Coconut", "Durian", "Elderberry",
		"Fig", "Guava", "Honeysuckle", "Ice Cream", "Jicama", "Kiwi", "Lime"];
	if (ns.gang.canRecruitMember()) {
		for (let i = 0; i < names.length; i++) {
			if (ns.gang.recruitMember(names[i])) {
				ns.toast(`Recruited ${names[i]}!`, "success", 3000);
				ns.gang.setMemberTask(names[i], "Train Combat");
				break;
			}
		}
	}
}

async function maybeAscend(ns, name) {
	const { agi, cha, def, dex, str } = ns.gang.getAscensionResult(name);
	if ((agi + cha + def + dex + str) / 5 >= 2) {
		if (ns.gang.ascendMember(name)) {
			ns.print(`Ascended ${name}!`);
			ns.toast(`Ascended ${name}!`, "success", 4000);
		}
	}
}

async function equipEveryone(ns, gangMembers, equipment) {
	for (let equip of equipment) {
		for (let name of gangMembers) {
			if (ns.gang.getEquipmentCost(equip) < (getSettings(ns).gang.maxSpend || ns.getServerMoneyAvailable("home"))
				&& ns.gang.purchaseEquipment(name, equip)) {
				ns.print(`Bought ${equip} for ${name}.`);
				ns.toast(`Bought ${equip} for ${name}.`, "info");
			}
		}
	}
}

async function assignTasksForTick(ns, enemy, getEnemy, gangMembers) {
	function getGang() {
		return ns.gang.getGangInformation();
	}

	const oldPower = getGang().power;
	const oldEnemyPower = getEnemy().power;
	const weRunTheCity = Number(getGang().territory) >= 0.99;

	ns.gang.setTerritoryWarfare(oldPower > oldEnemyPower && !weRunTheCity);

	if (weRunTheCity) {
		ns.print("Skipping territory assignment because we run this city.");
	} else {
		ns.print(`Assigning gang to fight for territory (${getGang().territory})...`);
		for (let member of gangMembers) {
			ns.gang.setMemberTask(member, "Territory Warfare");
		}
	}

	await waitForTick(ns, getEnemy);

	const newPower = getGang().power;
	const newEnemyPower = getEnemy().power;
	const ourChange = newPower - oldPower;
	const theirChange = newEnemyPower - oldEnemyPower;
	enemyRates[enemy] = enemyRates[enemy] || [];
	enemyRates[enemy].push(theirChange);
	const enemyAverage = averageEnemyRate(enemy);
	ns.print(`We gained ${ourChange} power that tick.`);
	ns.print(`${enemy} gained ${theirChange} power.`);
	ns.print(`(They gain ${enemyAverage} per tick on average, with ${enemyRates[enemy].length} samples).`);

	if (newPower < newEnemyPower) {
		// figure out when that will change.
		// their change rate is inconsistent so we just use the average:
		// enemy power after t ticks = enemyAverage * t + newEnemyPower
		// we consistently accelerate, so we'll estimate our rate of change
		// as the average of our last and current change rates:
		// our power after t ticks = (ourChange + ourLastChange)/2 * t + newPower
		// we overtake them when those two values are equal:
		// enemyAverage * t + newEnemyPower = (ourChange + ourLastChange)/2 * t + newPower
		// solve for t:
		const ticksUntilParity = (newEnemyPower - newPower) / ((ourChange + ourLastChange) / 2 - enemyAverage)
		// if that's negative, we're not overtaking anyone
		if (ticksUntilParity > 0) {
			// 20 seconds per tick
			const msUntilParity = Math.ceil(ticksUntilParity) * 20000;
			ns.print(`We'll overtake them around ${(new Date(Date.now() + msUntilParity)).toLocaleString()}.`);
		}
		ourLastChange = ourChange;
	}
}

function getBiggestEnemy(ns) {
	const enemies = ns.gang.getOtherGangInformation();
	const us = ns.gang.getGangInformation();
	let biggestEnemy;
	let enemyPower = 0;
	for (let e of Object.keys(enemies)) {
		if (e != us.faction && enemies[e].power > enemyPower) {
			biggestEnemy = e;
			enemyPower = enemies[e].power;
		}
	}
	const enemyInfoFn = () => ns.gang.getOtherGangInformation()[biggestEnemy];
	return [biggestEnemy, enemyPower, enemyInfoFn];
}

function equipmentByCombatValue(ns) {
	function getValue(eq) {
		const stats = ns.gang.getEquipmentStats(eq);
		let value = 0;
		for (let key of ["agi", "cha", "def", "dex", "str"]) {
			value += stats[key] || 0;
		}
		return value / ns.gang.getEquipmentCost(eq);
	}
	const eqNames = ns.gang.getEquipmentNames();
	eqNames.sort((a, b) => getValue(b) - getValue(a));
	return eqNames;
}

function equipmentByHackMult(ns) {
	function getHackMult(eq) {
		return ns.gang.getEquipmentStats(eq)["hack"] || 0;
	}
	const eqNames = ns.gang.getEquipmentNames();
	eqNames.sort((a, b) => getHackMult(b) - getHackMult(a));
	return eqNames;
}

function averageCombatMult(ns, member) {
	const stats = ns.gang.getMemberInformation(member);
	let mult = 0;
	for (let key of ["agi", "cha", "def", "dex", "str"]) {
		mult += stats[key] || 0;
	}
	return mult / 5;
}

function getTaskTable(ns) {
	const tasks = ["Mug People", "Deal Drugs", "Strongarm Civilians", "Run a Con",
		"Armed Robbery", "Traffick Illegal Arms", "Threaten & Blackmail",
		"Human Trafficking", "Terrorism", "Train Combat", "Train Hacking",
		"Train Charisma", "Territory Warfare", "Vigilante Justice"];
	const taskTable = {};
	for (let task of tasks) {
		taskTable[task] = ns.gang.getTaskStats(task);
	}
	return taskTable;
}

function bestTaskFor(ns, memberStats, gang, taskTable, priority) {
	function value(task) {
		return ns.formulas.gang[priority + "Gain"](gang, memberStats, taskTable[task]);
	}
	return Object.keys(taskTable)
		.filter((task) => value(task) > 0)
		.sort((a, b) => value(b) - value(a));
}

function setTasks(ns, priority, taskTable) {
	let wantedGainSoFar = 0;
	const gangMembers = ns.gang.getMemberNames();
	gangMembers.sort((a, b) => averageCombatMult(ns, b) - averageCombatMult(ns, a));
	for (let member of gangMembers) {
		const gang = ns.gang.getGangInformation();
		const stats = ns.gang.getMemberInformation(member);
		let tasks = bestTaskFor(ns, stats, gang, taskTable, priority);
		let task = "Train Combat";
		if (tasks.length > 0) {
			// this is weirdly named; the penalty is 1 minus this number
			if (gang.wantedPenalty < 0.95 && gang.wantedLevel > 100) {
				tasks = tasks.filter((task) => -10 > wantedGainSoFar + ns.formulas.gang.wantedLevelGain(gang, stats, taskTable[task]));
			}
			if (tasks.length == 0) {
				task = "Vigilante Justice";
			} else {
				task = tasks[0];
			}
		}
		ns.gang.setMemberTask(member, task);
		wantedGainSoFar += ns.formulas.gang.wantedLevelGain(gang, stats, taskTable[task]);
		ns.print(`Assigning ${member} to ${task}. (${wantedGainSoFar})`);
	}
}

function choosePriority(ns) {
	const prioritySetting = getSettings(ns).gang.priority;
	if (prioritySetting) {
		return prioritySetting;
	}
	const repTarget = getSettings(ns).gang.repTarget || 2500000;
	const moneyTarget = getSettings(ns).gang.moneyTarget || 1000000;
	const gang = ns.gang.getGangInformation();
	if (ns.getServerMoneyAvailable("home") < moneyTarget ||
		ns.getFactionRep(gang.faction) > repTarget || 
		gang.territory == 1) {
		return "money";
	}
	return "respect";
}

export async function main(ns) {
	ns.disableLog("ALL");
	const tickSpacing = 17500;
	let [biggestEnemy, enemyPower, enemyInfoFn] = getBiggestEnemy(ns);
	ns.print(`Biggest enemy is ${biggestEnemy} with ${enemyPower} power.`);
	const equipment = equipmentByCombatValue(ns);
	ns.print("Waiting for first tick ...");
	await waitForTick(ns, enemyInfoFn);
	const taskTable = getTaskTable(ns);
	while (true) {
		const buying = getSettings(ns).gang.buying;
		const { power, territory } = ns.gang.getGangInformation();
		const buildPower = territory < 1 || power < enemyInfoFn().power;
		if (buildPower) {
			// this is spammy when there's not much else going on each tick
			ns.print(`Sleeping for ${tickSpacing} ms.`);
		}
		await ns.sleep(tickSpacing);
		maybeRecruit(ns);
		let gangMembers = ns.gang.getMemberNames();
		gangMembers.sort((a, b) => averageCombatMult(ns, b) - averageCombatMult(ns, a));
		const priority = ns.args[0] || choosePriority(ns);
		ns.print(`Prioritizing ${priority}`);
		[biggestEnemy, enemyPower, enemyInfoFn] = getBiggestEnemy(ns);
		ns.print(`Biggest enemy is ${biggestEnemy} with ${enemyPower} power.`);
		if (buildPower) {
			await assignTasksForTick(ns, biggestEnemy, enemyInfoFn, gangMembers);
		}
		setTasks(ns, priority, taskTable);
		if (buying) {
			// do this again because they can die during the tick
			gangMembers = ns.gang.getMemberNames();
			gangMembers.sort((a, b) => averageCombatMult(ns, b) - averageCombatMult(ns, a));
			for (let member of gangMembers) {
				maybeAscend(ns, member);
			}
			equipEveryone(ns, gangMembers, equipment);
		}
	}
}