import { hosts_by_distance } from "breadth-first.js";
import { call } from "apiCall.js";

const delay = 5 * 60 * 1000;

async function attemptContract(ns, file, host, loop) {
	const indent = loop ? "" : "  ";
	const type = ns.codingcontract.getContractType(file, host);
	const data = ns.codingcontract.getData(file, host);
	const contract = `${file} on ${host} (${type})`;
	// if (ns.codingcontract.getNumTriesRemaining(file, host) == 1) {
	// 	ns.tprint(`${indent}Skipping ${contract} (one try remaining)`);
	// 	return;
	// }
	const result = (await call(ns, "contract", {type, data}));
	if (result.response && result.response.solution) {
		const outcome = ns.codingcontract.attempt(result.response.solution, file, host, {returnReward: true});
		if (outcome) {
			ns.toast("Contract complete!", "success");
			ns.tprint(`${indent}${contract} solved. ${outcome}`);
		} else {
			ns.toast("Contract failed!", "error");
			ns.tprint(`${indent}Failed to solve ${contract}.`);
			ns.tprint(`${indent}Solution was: ${result.response.solution}`)
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