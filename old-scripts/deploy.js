/** @param {NS} ns **/

const agentsPerHost = 1;

function nope(ns, who, why) {
	ns.print(`Can't deploy ${who}: ${why}`);
}

export async function main(ns) {
	let hostname = ns.args[0];
	let scriptFile = "ddos-agent.script";
	let agents = agentsPerHost;
	let freeRam = ns.getServerMaxRam(hostname) - ns.getServerUsedRam(hostname);
	if (freeRam < 1) return nope(ns, hostname, `free ram is ${freeRam}`);
	if (hostname == "home") freeRam -= 20; // save some to use
	let maxThreads = Math.floor(freeRam/ns.getScriptRam(scriptFile));
	let threadsPerAgent = Math.floor(maxThreads / agents);
	if (threadsPerAgent < 1) return nope(ns, hostname, `threadsPerAgent is ${threadsPerAgent}`);
	if (hostname != "home") {
		await ns.scp(scriptFile, hostname);
		ns.killall(hostname);
	}
	for (let i=0; i<agents; i++) {
		let agentName = hostname + "-" + "ABCDEFGH"[i];
		if (0 == ns.exec(scriptFile, hostname, threadsPerAgent, agentName, threadsPerAgent)) {
			nope(ns, hostname, `agent ${i} failed to start`);
			return;
		}
		await ns.sleep(10);
	}
}