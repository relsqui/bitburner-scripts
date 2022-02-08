/** @param {NS} ns **/
import hostToStock from 'hostToStock.js';

const logPort = 4;
const stockPort = 5;

function parseLog(ns, log) {
  const moneyFormat = "$0.000a";
  const maxFormatted = ns.nFormat(log.maxMoney, moneyFormat);
  const currFormatted = ns.nFormat(log.currentMoney, moneyFormat);
  const secStatus = `${log.currentSec}/${log.minSecurity}`;
  const moneyStatus = `${currFormatted}/${maxFormatted}`;
  let stockSymbol = "";
  if (hostToStock[log.target]) {
    stockSymbol = ` (${hostToStock[log.target]})`;
  }
  return `[${log.host}] ${secStatus} ${moneyStatus} ${log.fnChoice} ${log.target}${stockSymbol}`;
}

async function sendStockOrder(ns, order, stock) {
  await ns.tryWritePort(stockPort, {order, stock});
}

const lastAction = {};
async function makeStockChoice(ns, log) {
  if (hostToStock[log.target] && lastAction[log.target]) {
    if (lastAction[log.target] != log.fnChoice) {
      if (lastAction[log.target] == "hack") {
        // we were hacking but now we've stopped
        await sendStockOrder(ns, "buy", hostToStock[log.target]);
      } else if (log.fnChoice == "hack") {
        // we weren't hacking but now we've started
        await sendStockOrder(ns, "sell", hostToStock[log.target]);
      }
    }
  }
  lastAction[log.target] = log.fnChoice;
}

export async function main(ns) {
  const nullPortData = "NULL PORT DATA";
  ns.disableLog("ALL");
  ns.print("---");
  while (true) {
    let log = nullPortData;
    do {
      log = await ns.readPort(logPort);
      await ns.sleep(1);
    } while (log == nullPortData);
    ns.print(parseLog(ns, log));
    await makeStockChoice(ns, log);
    await ns.sleep(1);
  }
}