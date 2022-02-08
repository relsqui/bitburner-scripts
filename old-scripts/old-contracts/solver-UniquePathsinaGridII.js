/** @param {NS} ns **/

const seen = {};

function countPaths(ns, grid, x = 0, y = 0) {
  const key = `${x},${y}`;
  const maxX = grid[0].length - 1;
  const maxY = grid.length - 1;
  let status;
  if (seen[key]) {
    status = ` cache (${seen[key]})`;
  } else {
    if (x == maxX && y == maxY) {
      status = " END (1)";
    } else if (x > maxX || y > maxY || grid[y][x] == 1) {
      status = " oob (0)";
    } else {
      status = " ...";
    }
  }
  // ns.tprint(" ".repeat(x+y), key, status);
  if (!seen[key]) {
    if (x == maxX && y == maxY) {
      seen[key] = 1;
    } else if (x > maxX || y > maxY || grid[y][x] == 1) {
      seen[key] = 0;
    } else {
      seen[key] = countPaths(ns, grid, x+1, y) + countPaths(ns, grid, x, y+1);
    }
  }
  return seen[key];
}

export async function solve(ns, grid) {
  return countPaths(ns, grid);
}

export async function main(ns) {
  const grid = [
    [0,0,0,0],
    [0,0,0,0],
    [0,0,0,1],
    [0,0,1,0],
    [0,0,0,0],
    [0,0,0,0],
    [0,0,0,0],
    [0,1,0,0],
    [0,0,1,1],
    [0,0,0,0],
    [1,0,1,0],
    [0,0,0,0],
  ]
  for (let row of grid) {
    ns.tprint(row);
  }
  ns.tprint(await solve(ns, grid));
}