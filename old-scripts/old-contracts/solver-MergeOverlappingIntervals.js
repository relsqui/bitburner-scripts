/** @param {NS} ns **/

function canMerge(a, b) {
  return !(a[0] > b[1] || b[0] > a[1]);
}

function merge(a, b) {
  return [Math.min(a[0], b[0]), Math.max(a[1], b[1])];
}

function mergeStep(ns, intervals) {
  const newIntervals = [];
  let current = intervals[0];
  let merges = 0;
  for (let i=1; i<intervals.length; i++) {
      if (canMerge(current, intervals[i])) {
        // ns.tprint(`Merging ${current} with ${intervals[i]}`);
        current = merge(current, intervals[i]);
        merges += 1
      } else {
        // ns.tprint(`Pushing ${current}, starting with ${intervals[i]}`);
        newIntervals.push(current);
        current = intervals[i];
      }
  }
  newIntervals.push(current);
  return [merges, newIntervals];
}

export async function solve(ns, intervals) {
  let merges;
  let result = intervals;
  result.sort((a, b) => a[0] - b[0]);
  // ns.tprint(`Sorted: ${result}`);
  do {
    // ns.tprint("Doing a merge step");
    [merges, result] = mergeStep(ns, result);
    // ns.tprint(`Made ${merges} merges`);
  } while (merges > 0);
  return result;
}

export async function main(ns) {
  const data = [[13,23],[9,15],[24,25],[1,10],[3,5],[2,9],[14,21],[23,30],[23,28],[10,17],[10,20],[1,5],[23,26],[18,28],[4,9],[6,13],[8,14],[24,26]]
  // 9,23,24,25,1,10,14,21,23,30,10,20,1,5,18,28,4,14,24,26
  ns.tprint(data);
  ns.tprint(await solve(ns, data));
}