import { hosts_by_distance } from "breadth-first.js";
import { call } from "apiCall.js";
import * as FindAllValidMathExpressions from "solver-FindAllValidMathExpressions.js";
import * as FindLargestPrimeFactor from "solver-FindLargestPrimeFactor.js";
import * as GenerateIPAddresses from "solver-GenerateIPAddresses.js";
import * as MergeOverlappingIntervals from "solver-MergeOverlappingIntervals.js";
import * as MinimumPathSuminaTriangle from "solver-MinimumPathSuminaTriangle.js";
import * as SanitizeParenthesesinExpression from "solver-SanitizeParenthesesinExpression.js";
import * as SpiralizeMatrix from "solver-SpiralizeMatrix.js";
import * as SubarraywithMaximumSum from "solver-SubarraywithMaximumSum.js";
import * as TotalWaystoSum from "solver-TotalWaystoSum.js";
import * as UniquePathsinaGridI from "solver-UniquePathsinaGridI.js";
import * as UniquePathsinaGridII from "solver-UniquePathsinaGridII.js";

const delay = 5 * 60 * 1000;

const solvers = {
	// this is slow and I'm not confident it works yet
	// FindAllValidMathExpressions,
	FindLargestPrimeFactor,
	GenerateIPAddresses,
	MergeOverlappingIntervals,
	MinimumPathSuminaTriangle,
	// buggy, don't feel like figuring out why rn
	// SanitizeParenthesesinExpression,
	SpiralizeMatrix,
	SubarraywithMaximumSum,
	// toooo slow
	// TotalWaystoSum,
	UniquePathsinaGridI,
	UniquePathsinaGridII,
};

async function attemptContract(ns, file, host, loop) {
	const type = ns.codingcontract.getContractType(file, host);
	const data = ns.codingcontract.getData(file, host);
	const contract = `${file} on ${host} (${type})`;
	const indent = loop ? "" : "  ";
	const result = await call(ns, {type, data});
	let solution = result.solution;
	if (!solution && false) {
		const key = type.replace(/\s/g, "");
		const solver = solvers[key];
		if (solver) {
			solution = await solver.solve(ns, data);
		}
	}
	if (solution) {
		const outcome = ns.codingcontract.attempt(solution, file, host, {returnReward: true});
		if (outcome) {
			ns.toast("Contract complete!", "success");
			ns.tprint(`${indent}${contract} solved. ${outcome}`);
		} else {
			ns.toast("Contract failed!", "error");
			ns.tprint(`${indent}Failed to solve ${contract}.`);
			ns.tprint(`${indent}Solution was: ${solution}`)
			ns.exit();
		}
	} else if (!loop) {
		ns.tprint(indent, result);
	}
}

export async function main(ns) {
	const loop = (ns.args[0] == "loop");
	const hosts = hosts_by_distance(ns);
	let count;
	let lastCount;
	while (true) {
		count = 0;
		for (let host of hosts) {
			if (host != "home" && !host.startsWith("warthog")) {
				const files = ns.ls(host, ".cct");
				count += files.length;
				if (files.length) {
					if (!loop) {
						ns.tprint(`${host}:`);
					}
					for (let file of files) {
						const type = ns.codingcontract.getContractType(file, host);
						if (!loop) {
							ns.tprint(`  ${file} (${type})`);
						}
						await attemptContract(ns, file, host, loop);
					}
				}
			}
		}
		if (!loop) {
			break;
		}
		if (lastCount && count > lastCount) {
			ns.toast(`Found new contracts!`);
			lastCount = count;
		}
		await ns.sleep(delay);
	}
}