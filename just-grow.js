/** @param {NS} ns **/
export async function main(ns) {
  const growth = ns.nFormat(await ns.grow(ns.args[0]), "0.0000%");
  ns.toast(`${ns.getHostname} grew ${ns.args[0]} by ${growth}.`, "info");
}
