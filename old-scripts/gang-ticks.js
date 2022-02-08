/** @param {NS} ns **/

const enemyRates = [];
const ourLastChange = 0;

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

async function assignTasksForTick(ns, enemy, getEnemy) {
	function getGang() {
		return ns.gang.getGangInformation();
	}

	const oldPower = getGang().power;
	const oldEnemyPower = getEnemy().power;

	const gangMembers = ns.gang.getMemberNames();
	const oldTask = {};
	const taskCounts = {};
	ns.print("Assigning gang to fight for territory ...");
	for (let member of gangMembers) {
		const task = ns.gang.getMemberInformation(member).task;
		oldTask[member] = task;
		taskCounts[task] = (taskCounts[task] || 0) + 1;
		ns.gang.setMemberTask(member, "Territory Warfare");
	}

	ns.gang.setTerritoryWarfare(gangMembers.length == 12 && oldPower > oldEnemyPower);
	await waitForTick(ns, getEnemy);

	if (ns.gang.getBonusTime() > 0) {
		// don't switch out during bonus time so we don't miss ticks
		// or do the opposite to be more conservative
		const taskStrings = Object.keys(taskCounts).map((task) => `${taskCounts[task]} ${task}`);
		ns.print(`Reassigning to original tasks (${taskStrings.join(", ")}).`);
		for (let member of gangMembers) {
			ns.gang.setMemberTask(member, oldTask[member]);
		}
	}

	const newPower = getGang().power;
	const newEnemyPower = getEnemy().power;

	if (newPower < newEnemyPower) {
		const ourChange = newPower - oldPower;
		const theirChange = newEnemyPower - oldEnemyPower;
		enemyRates.push(theirChange);
		const enemyAverage = averageEnemyRate();
	
		ns.print(`We gained ${ourChange} power that tick.`);
		ns.print(`${enemy} gained ${theirChange} power.`);
		ns.print(`(They gain ${enemyAverage} per tick on average).`);
		// their change rate is inconsistent so we just use the average:
		// enemy power after t ticks = enemyAverage * t + newEnemyPower
		// we consistently accelerate. we'll estimate the rate of change
		// as the average of our last and current change rates:
		// our power after t ticks = (ourChange + ourLastChange)/2 * t + newPower
		// we overtake them when those two values are equal:
		// enemyAverage * t + newEnemyPower = (ourChange + ourLastChange)/2 * t + newPower
		// solve for t:
		const ticksUntilParity = (newEnemyPower - newPower)/((ourChange + ourLastChange)/2 - enemyAverage)
		// 20 seconds per tick
		const msUntilParity = Math.ceil(ticksUntilParity) * 20000;
		ns.print(`We'll overtake them around ${(new Date(Date.now() + msUntilParity)).toLocaleString()}.`);
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

export async function main(ns) {
	ns.disableLog("ALL");
	const tickSpacing = 19000;
	const [biggestEnemy, enemyPower] = getBiggestEnemy(ns);
	ns.print(`Biggest enemy is ${biggestEnemy} with ${enemyPower} power.`);
	const enemyInfoFn = () => ns.gang.getOtherGangInformation()[biggestEnemy];
	ns.print("Waiting for first tick ...");
	await waitForTick(ns, enemyInfoFn);
	while (true) {
		ns.print(`Sleeping for ${tickSpacing} ms.`);
		await ns.sleep(tickSpacing);
		await assignTasksForTick(ns, biggestEnemy, enemyInfoFn);
	}
}