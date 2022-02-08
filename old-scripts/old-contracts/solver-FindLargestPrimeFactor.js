/** @param {NS} ns **/

const seen = {
  1: [1],
}

function primeFactors(ns, number) {
  if (!seen[number]) {
    const maxFactor = Math.sqrt(number);
    let i = 2;
    for(; i <= maxFactor; i++) {
      if (number % i == 0) {
        break;
      }
    }
    if (i > maxFactor) {
      // ns.tprint(`${number} is prime`);
      seen[number] = [number];
    } else {
      // ns.tprint(`${number} is not prime`);
      seen[number] = primeFactors(ns, i).concat(primeFactors(ns, number/i));
    }
  }
  return seen[number];
}

export async function solve(ns, number) {
  return Math.max(...primeFactors(ns, number));
}

export async function main(ns) {
  const data = 293846;
  ns.tprint(data);
  ns.tprint(await solve(ns, data));
}