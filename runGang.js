/** @param {NS} ns **/

const enemyRates = [];
let ourLastChange = 0;

function averageEnemyRate() {
	return enemyRates.reduce((a, b) => a + b) / enemyRates.length;
}

async function waitForTick(ns, getEnemy) {
	const oldPower = getEnemy().power;
	while (oldPower == getEnemy().power) {
		await ns.sleep(10);
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
			ns.toast(`Ascended ${name}!`, "success");
		}
	}
}

async function equipEveryone(ns, gangMembers, equipment) {
	for (let equip of equipment) {
		for (let name of gangMembers) {
			if (ns.gang.purchaseEquipment(name, equip)) {
				ns.print(`Bought ${equip} for ${name}.`);
			}
		}
	}
}

async function assignTasksForTick(ns, enemy, getEnemy, gangMembers, enableTerritory) {
	function getGang() {
		return ns.gang.getGangInformation();
	}

	const oldPower = getGang().power;
	const oldEnemyPower = getEnemy().power;

	ns.gang.setTerritoryWarfare(enableTerritory && oldPower > oldEnemyPower && getGang().territory < 1);

	ns.print("Assigning gang to fight for territory ...");
	for (let member of gangMembers) {
		ns.gang.setMemberTask(member, "Territory Warfare");
	}

	await waitForTick(ns, getEnemy);

	const newPower = getGang().power;
	const newEnemyPower = getEnemy().power;
	const ourChange = newPower - oldPower;
	const theirChange = newEnemyPower - oldEnemyPower;
	enemyRates.push(theirChange);
	const enemyAverage = averageEnemyRate();
	ns.print(`We gained ${ourChange} power that tick.`);
	ns.print(`${enemy} gained ${theirChange} power.`);
	ns.print(`(They gain ${enemyAverage} per tick on average, with ${enemyRates.length} samples).`);

	if (newPower < newEnemyPower) {
		// figure out when that will change.
		// their change rate is inconsistent so we just use the average:
		// enemy power after t ticks = enemyAverage * t + newEnemyPower
		// we consistently accelerate. we'll estimate the rate of change
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
	return [biggestEnemy, enemyPower];
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

function setTasks(ns, priority, gangMembers, taskTable) {
	// assign tasks from most to least powerful
	// gangMembers = gangMembers.slice().reverse();
	let wantedGainSoFar = 0;
	for (let member of gangMembers) {
		const stats = ns.gang.getMemberInformation(member);
		const gang = ns.gang.getGangInformation();
		let tasks = bestTaskFor(ns, stats, gang, taskTable, priority);
		if (!stats) {
			// they died this tick
			continue;
		}
		let task = "Train Combat";
		if (tasks.length > 0) {
			tasks = tasks.filter((task) => 0 > wantedGainSoFar + ns.formulas.gang.wantedLevelGain(gang, stats, taskTable[task]));
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

export async function main(ns) {
	ns.disableLog("ALL");
	const buying = true;
	const enableTerritory = true;
	const buildPower = true;
	const tickSpacing = 19000;
	const [biggestEnemy, enemyPower] = getBiggestEnemy(ns);
	ns.print(`Biggest enemy is ${biggestEnemy} with ${enemyPower} power.`);
	const enemyInfoFn = () => ns.gang.getOtherGangInformation()[biggestEnemy];
	const equipment = equipmentByCombatValue(ns);
	ns.print("Waiting for first tick ...");
	await waitForTick(ns, enemyInfoFn);
	const taskTable = getTaskTable(ns);
	while (true) {
		if (buildPower) {
			// this is spammy when there's not much else going on each tick
			ns.print(`Sleeping for ${tickSpacing} ms.`);
		}
		await ns.sleep(tickSpacing);
		maybeRecruit(ns);
		const gangMembers = ns.gang.getMemberNames();
		gangMembers.sort((a, b) => averageCombatMult(ns, b) - averageCombatMult(ns, a));
		const priority = ns.args[0] || (gangMembers.length < 12 ? "respect" : "money");
		ns.print(`Prioritizing ${priority}`);
		if (buildPower) {
			await assignTasksForTick(ns, biggestEnemy, enemyInfoFn, gangMembers, enableTerritory);
		}
		setTasks(ns, priority, gangMembers, taskTable);
		if (buying) {
			for (let member of gangMembers) {
				maybeAscend(ns, member);
			}
			equipEveryone(ns, gangMembers, equipment);
		}
	}
}