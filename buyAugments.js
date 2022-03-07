/** @param {NS} ns **/

import { makeTable } from './table.js';

function getAllAugments(ns, includingNFG=false) {
    const augments = {};
    for (let faction of ns.getPlayer().factions) {
        for (let aug of ns.getAugmentationsFromFaction(faction)) {
            if (aug == "NeuroFlux Governor" && !includingNFG) {
                continue;
            }
            if (augments[aug]) {
                augments[aug].factions.push(faction);
            } else {
                augments[aug] = {
                    name: aug,
                    price: ns.getAugmentationPrice(aug),
                    rep: ns.getAugmentationRepReq(aug),
                    factions: [faction],
                    prereqs: ns.getAugmentationPrereq(aug),
                    ... ns.getAugmentationStats(aug)
                };
            }
        }
    }
    return augments;
}

function makeRow(ns, augment) {
    function totalMult(key) {
        return Object.keys(augment)
            .filter((k) => k.startsWith(key))
            .map((k) => augment[k])
            .reduce((sum, mult) => sum * mult, 1);
    }
    function fmtMult(key) {
        return totalMult(key) == 1 ? "" : ns.nFormat(totalMult(key), "0.0000");
    }
    const hack = fmtMult("hacking");
    const crime = fmtMult("crime");
    return [augment.name, ns.nFormat(augment.price, "$0.00a"), ns.nFormat(augment.rep, "0.00a"), hack, crime, augment.factions];
}

function pickFaction(ns, aug) {
    for (let faction of aug.factions) {
        if (ns.getFactionRep(faction) > aug.rep) {
            return faction;
        }
    }
    return null;
}

function canBuy(ns, aug) {
    if (ns.getServerMoneyAvailable("home") < aug.price) {
        return false;
    }
    if (!pickFaction) {
        return false;
    }
    const owned = ns.getOwnedAugmentations();
    if (owned.includes(aug.name)) {
        return false;
    }
    for (let prereq of aug.prereqs) {
        if (!owned.includes(prereq)) {
            return false;
        }
    }
    return true;
}

function makeRows(ns, augments) {
    let rows = [];
    for (let aug of Object.values(augments).filter((aug) => canBuy(ns, aug))) {
        const row = makeRow(ns, aug);
        if (row) {
            rows.push(row);
        }
    }
    return rows;
}

export async function getAugments(ns, purchase=false, print=false) {
    const labels = ["Augment", "Price", "Rep", "Hack", "Crime", "Factions"];
    const key = "Hack";
    const augments = getAllAugments(ns);
    let rows = makeRows(ns, augments);

    function value(row) {
        return Number(row[labels.indexOf(key)]) / augments[row[0]].price;
    }

    rows = rows.filter(value).sort((a, b) => value(b) - value(a));

    if (purchase) {
        let bought = 0;
        for (let row of rows) {
            const augment = augments[row[0]];
            const faction = pickFaction(ns, augment);
            if (ns.purchaseAugmentation(faction, augment.name)) {
                ns.toast(`Bought ${augment.name} for ${ns.nFormat(augment.price, "$0.00a")}.`);
                bought++;
            }
        }
        return bought;
    } else if (rows.length && print) {
        ns.tprintf(makeTable(ns, rows, labels));
        ns.tprintf("\nCall this script with -y to do the purchase.");
    }
    return rows.length;
}

export async function main(ns) {
    await getAugments(ns, ns.args[0] == "-y", true);
}