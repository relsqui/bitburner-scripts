/** @param {NS} ns **/

async function batchCycle(ns, { target, threads, timing, options }) {
  if (options.debug) {
    ns.print(`weaken ${target} -t ${threads.mitigateHack}`);
    ns.print(`sleep ${timing.beforeWeaken}`);
    ns.print(`weaken ${target} -t ${threads.mitigateGrow}`);
    ns.print(`sleep ${timing.beforeGrow}`);
    ns.print(`grow ${target} -t ${threads.grow}`);
    ns.print(`sleep ${timing.beforeHack}`);
    ns.print(`hack ${target} -t ${threads.hack}`);
  } else {
    ns.run(options.files.weaken, threads.mitigateHack, target, "1");
    await ns.sleep(timing.beforeWeaken);
    ns.run(options.files.weaken, threads.mitigateGrow, target, "2");
    await ns.sleep(timing.beforeGrow);
    if (threads.grow) {
      ns.run(options.files.grow, threads.grow, target);
    }
    await ns.sleep(timing.beforeHack);
    if (threads.hack) {
      ns.run(options.files.hack, threads.hack, target);
    }
    await ns.sleep(options.delay);
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
