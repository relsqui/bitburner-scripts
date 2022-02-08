/** @param {NS} ns **/

/*
Given the following array of arrays of numbers representing a 2D matrix, return the elements of the matrix as an array in spiral order:

*/

export function solve (ns, grid) {
	function printStatus() {
		// ns.tprint(`${row}, ${col} = ${grid[row][col]}`);
	}
	function printWH() {
		// ns.tprint(`width ${width}, height ${height}`);
	}
	function finished() {
		return !(unrolled.length < finalLength);
	}
	// ns.tprint(`grid is ${grid.length} rows x ${grid[0].length} columns`);
	const finalLength = grid.length * grid[0].length;
	let width = grid[0].length;
	let height = grid.length - 1;
	let unrolled = [];
	let row = 0;
	let col = -1;
	printWH();
	while (true) {
		for (let i=0; i<Math.max(width, 0); i++) {
			col++;
			unrolled.push(grid[row][col]);
			printStatus();
		}
		width--;
		if (finished()) break;
		printWH();
		for (let i=0; i<Math.max(height, 0); i++) {
			row++;
			unrolled.push(grid[row][col]);
			printStatus();
		}
		height--;
		if (finished()) break;
		printWH();
		for (let i=0; i<Math.max(width, 0); i++) {
			col--;
			unrolled.push(grid[row][col]);
			printStatus();
		}
		width--;
		if (finished()) break;
		printWH();
		for (let i=0; i<Math.max(height, 0); i++) {
			row--;
			unrolled.push(grid[row][col]);
			printStatus();
		}
		height--;
		if (finished()) break;
		printWH();
	}
	return unrolled;
}

export async function main(ns) {
    const grid = [
		[32,50, 6,41, 8, 8, 2,29,20],
        [31,21,25,23,12,40, 1,27, 3],
        [ 8,14,46,21,23,15,39,17,11],
        [42,10,36, 6,13, 8,12,10,40],
        [47,25,19,35, 8, 5,16,42,43],
        [31,43,12,41,47,50,12, 1,19],
        [ 1, 1,27,14,11,50,27,40,17],
        [33,50, 7,32,35,10,25,26,45],
    ]
	for (let row of grid) {
		ns.tprint(row.map((n) => n.toString().padStart(2, " ")).join(", "));
	}
	const solution = solve(ns, grid);
	ns.tprint(solution);
	ns.tprint("solution length: ", solution.length);
	ns.tprint("grid size: ", grid.length * grid[0].length);
}