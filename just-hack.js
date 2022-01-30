/** @param {NS} ns **/
export async function main(ns) {
  const money = await ns.hack(ns.args[0]);
  ns.toast(`${ns.getHostname()} stole ${money} from ${ns.args[0]}!`, "success");
}
