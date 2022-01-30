/** @param {NS} ns **/

async function batchCycle(ns, { host, target, threads, timing, options }) {
  if (options.debug) {
    ns.tprint(`Batch plan on ${host}:`);
    ns.tprint(`  weaken ${target} -t ${threads.mitigateHack}`);
    ns.tprint(`  sleep ${timing.beforeWeaken}`);
    ns.tprint(`  weaken ${target} -t ${threads.mitigateGrow}`);
    ns.tprint(`  sleep ${timing.beforeGrow}`);
    ns.tprint(`  grow ${target} -t ${threads.grow}`);
    ns.tprint(`  sleep ${timing.beforeHack}`);
    ns.tprint(`  hack ${target} -t ${threads.hack}`);
  } else {
    if (threads.mitigateHack) {
      ns.run(options.files.weaken, threads.mitigateHack, target, "mitigateHack");
    }
    await ns.sleep(timing.beforeWeaken);
    if (threads.mitigateGrow) {
      ns.run(options.files.weaken, threads.mitigateGrow, target, "mitigateGrow");
    }
    await ns.sleep(timing.beforeGrow);
    if (threads.grow) {
      ns.run(options.files.grow, threads.grow, target);
    }
    await ns.sleep(timing.beforeHack);
    if (threads.hack) {
      ns.run(options.files.hack, threads.hack, target);
    }
  }
}

export async function main(ns) {
  const host = ns.getHostname();
  ns.print(`Managing batch on ${host}`);
  const planFile = `batchPlan-${host}.txt`;
  const batchPlan = JSON.parse(ns.read(planFile));
  ns.print("Starting this plan:");
  ns.print(JSON.stringify(batchPlan, null, 2));
  await batchCycle(ns, batchPlan);
}
