/** @param {NS} ns **/

function upgradedMoneyGainRate(ns, { MaxCores, MaxLevel, MaxRam }) {
    return ns.formulas.hacknetNodes.moneyGainRate(MaxLevel, MaxRam, MaxCores, 1) *
        ns.getPlayer().hacknet_node_money_mult;
}

function upgradedNodeCost(ns) {
    // TODO: calculate these
    return ns.hacknet.getPurchaseNodeCost() + 
        10703000 + // max levels
        2131000 + // max ram
        146929000; // max cores
}

function canBuyAnotherNode(ns) {
    return ns.hacknet.numNodes() < ns.hacknet.maxNumNodes();
}

function fmtMoney(ns, n) {
    return ns.nFormat(n, "$0.00a");
}

export async function main(ns) {
    const hnConstants = ns.formulas.hacknetNodes.constants();
    const timelineHours = ns.args[0] || 1;
    const timelineSeconds = timelineHours * 60 * 24;
    while (canBuyAnotherNode(ns) &&
        upgradedMoneyGainRate(ns, hnConstants) * timelineSeconds > upgradedNodeCost(ns)) {
        ns.toast(`Buying a hacknet node for ${fmtMoney(ns, upgradedNodeCost(ns))}`);
        const index = ns.hacknet.purchaseNode();
        ns.hacknet.upgradeCore(index, hnConstants.MaxCores);
        ns.hacknet.upgradeLevel(index, hnConstants.MaxLevel);
        ns.hacknet.upgradeRam(index, hnConstants.MaxRam);
        await ns.sleep(1);
    }
    // ns.tprint(`Next node won't pay off ${fmtMoney(ns, upgradedNodeCost(ns))} in ${timelineHours} hours.`);
    // ns.tprint(`(Expected production: ${fmtMoney(ns, upgradedMoneyGainRate(ns, hnConstants))}/s)`);
}