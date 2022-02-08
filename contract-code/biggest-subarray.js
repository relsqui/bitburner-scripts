/** @param {NS} ns **/
/*
Given the following integer array, find the contiguous subarray (containing at least one number) which has the largest sum and return that sum. 'Sum' refers to the sum of all the numbers in the subarray.
*/

export function solve(ns, array) {
	let subarrays = [];
	for (let start=0; start<array.length; start++) {
		for (let end=start+1; end<array.length+1; end++) {
			subarrays.push(array.slice(start, end));
		}
	}
	/*
	for (let sub of subarrays) {
		ns.tprint(`${sub.reduce((x, y) => x + y)} | ${sub}`);
	}
	*/
	return Math.max(...subarrays.map((a) => a.reduce((x, y) => x + y)));
}

export async function main(ns) {
	// let array = [4,-8,-9,10,6,-6,-2,2,-2,3,2,-3,5,-4,5,6,0,-4,10,-8,-3,2,7,-5,-3,-1,10,-6,-9,10,-6];
	const array = [9, 8, 6, -5, 6, 4, -2, -10, -8, 9, -1, -6, 0, -3, 7, -7, -9, -8, -7, -2, -8, -4, 9, -9, 7, -1, -8, -8, -6, -10, -10];
	ns.tprint(array);
	ns.tprint(solve(ns, array));
}