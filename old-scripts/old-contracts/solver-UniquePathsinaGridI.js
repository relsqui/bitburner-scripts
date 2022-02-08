/** @param {NS} ns **/

const factMemo = {
  1: 1,
}

function factorial(n) {
  if (!factMemo[n]) {
    factMemo[n] = n * factorial(n-1);
  }
  return factMemo[n];
}

export async function solve(ns, [rows, cols]) {
  const r = rows-1;
  const c = cols-1;
  return factorial(r+c)/(factorial(r) * factorial(c));
}

export async function main(ns) {
  const data = [12, 2];
  ns.tprint(await solve(ns, data));
}