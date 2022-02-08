/** @param {NS} ns **/

async function log(ns, payload) {
  const logPort = 4;
  while (!await ns.tryWritePort(logPort, payload)) {
    ns.print("waiting on log port")
    await ns.sleep(10);
  }
}

export async function main(ns) {
  const host = ns.getHostname();
  const target = ns.args[0] || me;
  const minSecurity = ns.getServerMinSecurityLevel(target);
  const maxMoney = ns.getServerMaxMoney(target);
  const hackFn = {
    weaken: ns.weaken,
    grow: ns.grow,
    hack: ns.hack
  }
  while (true) {
    const currentSec = Math.floor(ns.getServerSecurityLevel(target));
    const currentMoney = ns.getServerMoneyAvailable(target);
    let fnChoice;
    if (currentSec > minSecurity) {
      fnChoice = "weaken";
    } else if (currentMoney < maxMoney/2) {
      fnChoice = "grow";
    } else {
      fnChoice = "hack";
    }
    await log(ns, {host, target, currentSec, minSecurity, currentMoney, maxMoney, fnChoice});
    if (hackFn[fnChoice]) {
      await hackFn[fnChoice](target);
    }
    await ns.sleep(10);
  }
}