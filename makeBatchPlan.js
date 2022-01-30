/** @param {NS} ns **/
function getThreadRatio(ns, host, target) {
  const cores = ns.getServer(host).cpuCores;
  const atMinSec = ns.getServerSecurityLevel(target) == ns.getServerMinSecurityLevel(target);
  const atMaxMoney = ns.getServerMoneyAvailable(target) == ns.getServerMaxMoney(target);

  let hackThreads = 0;
  let hackRate = 0;
  let hackSecChange = 0;
  if (atMinSec && atMaxMoney) {
    hackThreads = 1;
    hackRate = ns.hackAnalyze(target);
    hackSecChange = ns.hackAnalyzeSecurity(1);
  }

  let growThreads = 0;
  if (hackThreads || !atMaxMoney) {
    growThreads = Math.ceil(ns.growthAnalyze(target, 1 + hackRate, cores));
  }
  const growSecChange = ns.growthAnalyzeSecurity(growThreads);

  const weakenPerThread = ns.weakenAnalyze(1, cores);
  let mitigateHack = 1;
  let mitigateGrow = 1;
  if (atMinSec) {
    mitigateHack = Math.ceil(hackSecChange / weakenPerThread);
    mitigateGrow = Math.ceil(growSecChange / weakenPerThread);
  }

  return {
    hack: hackThreads, hackRate, hackSecChange,
    grow: growThreads, growSecChange,
    mitigateHack, mitigateGrow
  };
}

function getTiming(ns, target, delay) {
  const wTime = ns.getWeakenTime(target);
  const gTime = ns.getGrowTime(target);
  const hTime = ns.getHackTime(target);
  const eta = delay * 2 + wTime;
  return {
    eta, etaString: ns.nFormat(eta/1000, "00:00:00"),
    wTime, gTime, hTime,
    beforeWeaken: delay * 2,
    beforeGrow: Math.ceil(wTime - gTime - delay),
    beforeHack: Math.ceil(gTime - hTime - (delay * 2)),
  };
}

function getBatchSettings(ns, host, target, delay) {
  const threadRatio = getThreadRatio(ns, host, target);
  const timing = getTiming(ns, target, delay);
  return [threadRatio, timing];
}

export function makeBatchPlan(ns, host, target, options) {
  const [threadRatio, timing] = getBatchSettings(ns, host, target, options.delay);
  const minimumRam = threadRatio.hack * ns.getScriptRam(options.files.hack, host) +
    threadRatio.grow * ns.getScriptRam(options.files.grow, host) +
    (threadRatio.mitigateHack + threadRatio.mitigateGrow) * ns.getScriptRam(options.files.weaken, host);
  let freeRam = ns.getServerMaxRam(host) - ns.getServerUsedRam(host) - ns.getScriptRam(options.files.manager, host);
  if (host == "home") {
    // leave some breathing room
    freeRam = Math.max(0, freeRam - 20);
  }
  let batchSize = Math.floor(freeRam / minimumRam);
  if (batchSize == Infinity) {
    batchSize = 0;
  }
  const threads = {
    hack: threadRatio.hack * batchSize,
    grow: threadRatio.grow * batchSize,
    mitigateHack: threadRatio.mitigateHack * batchSize,
    mitigateGrow: threadRatio.mitigateGrow * batchSize,
  };
  const ramPerBatch = minimumRam * batchSize;
  const ram = { minimumRam, ramPerBatch };
  return {host, target, batchSize, ram, threads, timing, options};
}

export async function deployBatchPlan(ns, host, target, opts = {}) {
  const options = {
    delay: 500,
    ...opts,
    files: {
      manager: "manageBatch.js",
      hack: "just-hack.js",
      weaken: "just-weaken.js",
      grow: "just-grow.js",
      ...(opts.files || {})
    },
  }
  const batchPlan = makeBatchPlan(ns, host, target, options);
  const planFile = `batchPlan-${host}.txt`;
  // write and scp overwrite scripts but not text files for some reason
  ns.rm(planFile, host);
  await ns.write(planFile, JSON.stringify(batchPlan, null, 2), "w");
  if (host != ns.getHostname()) {
    await ns.scp([planFile, ...Object.values(options.files)], host);
    ns.rm(planFile);
  }
}

export async function main(ns) {
  const host = "home";
  const target = "rho-construction";
  await deployBatchPlan(ns, host, target);
}