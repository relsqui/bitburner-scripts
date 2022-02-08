/** @param {NS} ns **/
let ns;

const signalPort = 1;
const targetPort = 2;
const logPort = 3;
const logSize = 12;

let agentStatus;
let lastLogs;

let target;
let signal;
let minSecurity;
let maxMoney;


function log(msg) {
  lastLogs.push(msg);
}

async function setTarget(hostname) {
  let newTarget;
  if (hostname) {
    newTarget = hostname;
  } else {
    if (!target) {
      // only print this on startup, basically
      // not in the main target-checking loop
      ns.print("Waiting for target");
    }
    do {
      newTarget = await ns.peek(targetPort);
      await ns.sleep(1);
    } while (newTarget == "NULL PORT DATA");
  }
  if (target == newTarget) {
    return;
  }
  target = newTarget;
  ns.clearPort(targetPort);
  await ns.writePort(targetPort, target);
  minSecurity = ns.getServerMinSecurityLevel(target);
  maxMoney = ns.getServerMaxMoney(target);
  if (!agentStatus[target]) {
    agentStatus[target] = {
      "grow": 0,
      "weaken": 0,
      "hack": 0,
    };
  }
}

async function setSignal(sig) {
  if (sig == signal) return;
  signal = sig;
  ns.clearPort(signalPort);
  await ns.writePort(signalPort, signal);
}

async function pickSignal() {
  let currentSec = ns.getServerSecurityLevel(target);
  let expectedSec = currentSec + ns.growthAnalyzeSecurity(agentStatus[target].grow);
  expectedSec += ns.hackAnalyzeSecurity(agentStatus[target].hack);
  expectedSec -= ns.weakenAnalyze(agentStatus[target].weaken);
  expectedSec = Math.max(expectedSec, minSecurity);
  let currentMoney = ns.getServerMoneyAvailable(target);
  let maxGrowThreads = Math.floor(ns.growthAnalyze(target, Math.max(1, maxMoney / (currentMoney+1))));
  let maxHackThreads = ns.hackAnalyzeThreads(target, currentMoney);
  // should use timing here instead of just waiting, this is a stopgap
  if (expectedSec > minSecurity) {
    await setSignal("weaken");
  } else if (agentStatus[target].grow < maxGrowThreads && currentSec == minSecurity) {
    await setSignal("grow");
  } else if (agentStatus[target].hack < maxHackThreads && currentSec == minSecurity) {
    await setSignal("hack");
  } else {
    await setSignal("hold");
  }
}

function printStatus() {
  ns.clearLog();
  let security = Math.round(ns.getServerSecurityLevel(target));
  let hackChance = ns.nFormat(ns.hackAnalyzeChance(target), "0.00%");
  let moneyFormat = "$0.000a";
  let currentMoney = ns.getServerMoneyAvailable(target);
  let threadFormat = "0,000";
  ns.print("------------------------------");
  ns.print(`Order     : ${signal} ${target}`);
  ns.print(`Security  : ${security} / ${minSecurity} (${hackChance})`);
  ns.print(`Money     : ${ns.nFormat(currentMoney, moneyFormat)} / ${ns.nFormat(maxMoney, moneyFormat)}`);
  ns.print("------------------------------");
  ns.print(`Growing   : ${ns.nFormat(agentStatus[target].grow, threadFormat)}`);
  ns.print(`Weakening : ${ns.nFormat(agentStatus[target].weaken, threadFormat)}`);
  ns.print(`Hacking   : ${ns.nFormat(agentStatus[target].hack, threadFormat)}`);
  ns.print("");
  for (let logMsg of lastLogs.slice(-10)) {
    ns.print(logMsg);
  }
}

export async function main(netScript) {
  ns = netScript;
  agentStatus = {};
  lastLogs = Array(logSize).fill("");

  ns.disableLog("ALL");
  ns.clearPort(signalPort);
  ns.clearPort(targetPort);
  ns.clearPort(logPort);
  ns.clearLog();
  ns.tail();
  log("Setting initial target ...");
  await setTarget();
  log("Setting initial signal ...");
  await pickSignal();
  ns.clearLog();
  while (true) {
    printStatus();
    let agentLog = await ns.readPort(logPort);
    if (agentLog != "NULL PORT DATA") {
      log(agentLog);
      let [aName, aThreads, aStatus, aSignal, aTarget] = agentLog.split(/\s+/);
      if (aStatus == "starting:") {
        agentStatus[aTarget][aSignal] += Number(aThreads);
      }
      if (aStatus == "finished:") {
        agentStatus[aTarget][aSignal] -= Number(aThreads);
        if (aTarget != target) {
          // what's happening over here?
          setTarget(aTarget);
        }
      }
      agentLog = await ns.readPort(logPort);
    }
    await setTarget();
    await pickSignal();
    await ns.sleep(1);
  }
}