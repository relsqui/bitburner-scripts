/** @param {NS} ns **/

const seen = {};

export async function solve(ns, triangle, row = 0, i = 0) {
  const key = `${row},${i}`;
  if (!seen[key]) {
    if (row == triangle.length - 1) {
      seen[key] = triangle[row][i];
    } else {
      const left = await solve(ns, triangle, row+1, i);
      const right = await solve(ns, triangle, row+1, i+1);
      seen[key] = triangle[row][i] + Math.min(left, right);
    }
  }
  return seen[key];
}

export async function main(ns) {
  /*
  const triangle = [
      [2],
     [3,4],
    [6,5,7],
   [4,1,8,3]
  ]; // 11
  */
  const triangle = [
          [8],
         [7,1],
        [6,4,1],
       [5,6,5,6],
      [8,1,1,2,8],
     [5,3,4,2,3,1],
    [9,1,9,7,5,3,5],
   [7,3,7,6,4,9,7,2],
  [8,9,7,3,3,1,3,8,6]
]
  for (let i=triangle.length; i>0; i--) {
    ns.tprint(" ".repeat(i), triangle[triangle.length-i]);
  }
  ns.tprint(await solve(ns, triangle));
}