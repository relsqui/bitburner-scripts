/** @param {NS} ns **/
export async function main(ns) {
  const weaker = ns.nFormat(await ns.weaken(ns.args[0]), "0.0000%");
  ns.toast(`${ns.getHostname()} weakened ${ns.args[0]} by ${weaker}.`, "info");
}
