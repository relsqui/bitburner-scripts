/** @param {NS} ns **/

async function find_permutations(ns, num_string) {
  const operators = ["+", "-", "*", ""];
  const permutations = [];
  if (num_string.length == 1) {
    permutations.push(num_string);
  } else {
    for (let op of operators) {
      for (let perm of await find_permutations(ns, num_string.slice(1))) {
        permutations.push(num_string[0] + op + perm);
      }
    }
  }
  await ns.sleep(1);
  return permutations;
}

export async function solve(ns, [num_string, target]) {
  let solutions = [];
  for (let perm of await find_permutations(ns, num_string)) {
    let total = eval(perm);
    if (total == target && !solutions.includes(perm)) {
      solutions.push(perm);
    }
    await ns.sleep(1);
  }
  return "[" + solutions.join(" ") + "]";
}

export async function main(ns) {
  const num_string = ns.args[0] || "123456";
  const target = ns.args[1] || 60;
  ns.tprint(await solve(ns, [num_string, target]));
}