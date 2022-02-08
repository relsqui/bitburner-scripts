/** @param {NS} ns **/

function compress(ns, array) {
  const compressed = [];
  if (array.length > 0) {
    let sum = array[0];
    let currentSign = sum >= 0;
    for (let n of array.slice(1)) {
      if (n >= 0 == currentSign) {
        sum += n;
      } else {
        compressed.push(sum);
        sum = n;
        currentSign = !currentSign;
      }
    }
    compressed.push(sum);
  }
  return compressed;
}

export async function solve(ns, array) {
  const compressed = compress(ns, array);
  const sums = [];
  for (let start = 0; start < compressed.length; start++) {
    for (let end = start + 1; end < compressed.length + 1; end++) {
      let slice = compressed.slice(start, end);
      let sum = slice.reduce((a, b) => a + b);
      // ns.tprint(`sum(${slice}) = ${sum}`);
      sums.push(sum);
    }
  }
  return Math.max(...sums);
}

export async function main(ns) {
  const data = [-5,2,-2,3,-1,5];
  // 7
  ns.tprint(data);
  ns.tprint(await solve(ns, data));
}