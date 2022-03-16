/** @param {NS} ns **/

import { getSettings } from './settings.js';
import { makeTable } from './table.js';

const statPrefixes = {
    hack: /hacking.*/,
    crime: /crime.*/,
    combat: /(strength|defense|dexterity|agility).*/,
    cha: /charisma.*/,
    c_rep: /company_rep.*/,
    f_rep: /faction_rep.*/,
    hacknet: /hacknet.*/,
    xp: /.*xp.*/,
    money: /.*(crime|hacking|work)_money.*/,
}

function totalMult(augment, statRegex) {
    return Object.keys(augment)
        .filter((k) => k.match(statRegex))
        .map((k) => augment[k])
        .reduce((sum, mult) => sum * mult, 1);
}

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
                    to_buy: false,
                    price: ns.getAugmentationPrice(aug),
                    rep: ns.getAugmentationRepReq(aug),
                    factions: [faction],
                    prereqs: ns.getAugmentationPrereq(aug),
                    ... ns.getAugmentationStats(aug)
                };
                for (let [key, prefixes] of Object.entries(statPrefixes)) {
                    augments[aug][key] = totalMult(augments[aug], prefixes);
                }
            }
        }
    }
    // we only made this an object to dedupe and collect factions
    return Object.values(augments);
}

function pickFaction(ns, aug) {
    for (let faction of aug.factions) {
        if (ns.getFactionRep(faction) > aug.rep) {
            return faction;
        }
    }
    return null;
}

function hasAug(ns, aug) {
    return ns.getOwnedAugmentations(true).includes(aug.name);
}

function hasPrereqs(ns, aug) {
    const owned = ns.getOwnedAugmentations();
    if (!aug.prereqs.reduce((haveAllPrereqs, prereq) => haveAllPrereqs && owned.includes(prereq), true)) {
        return false;
    }
    return true;
}

function canBuy(ns, aug) {
    if (ns.getServerMoneyAvailable("home") < aug.price) {
        return false;
    }
    if (!pickFaction(ns, aug)) {
        return false;
    }
    if (hasAug(ns, aug)) {
        return false;
    }
    return hasPrereqs(ns, aug);
}

function totalPrice(augs) {
    // don't alter the list passed in
    const augments = augs.slice();
    augments.sort((a, b) => b.price - a.price);
    let multiplier = 1;
    let price = 0;
    for (let augment of augments) {
        price += augment.price * multiplier;
        multiplier *= 1.9;
    }
    return price;
}

function makeRows(ns, augments) {
    let rows = [];
    for (let augment of augments) {
        const row = [
            augment.name,
            canBuy(ns, augment) ? "X" : hasAug(ns, augment) ? "-" : "",
            augment.to_buy ? "#" : "",
            ns.nFormat(augment.price, "$0.00a"),
        ];
        for (let key of ["rep", "hack", "hacknet", "crime", "combat", "cha", "c_rep", "f_rep"]) {
            row.push(ns.nFormat(augment[key], "0.00a"));
        }
        row.push(augment.factions.toString().replace(/[a-z ]/g, ""));
        rows.push(row);
    }
    return rows;
}

export async function getAugments(ns, purchase=false, print=false) {
    const labels = ["Name", "?", "$", "Price", "Rep", "Hack", "HNet", "Crim", "Cbat", "Cha", "CRep", "FRep", "Factions"];
    const sortKey =  (ns.args[0] == "-y" ? null : ns.args[0]) || getSettings(ns).loop.augPriority || "hack";
    let augments = getAllAugments(ns).filter((a) => !hasAug(ns, a));
    augments = augments
        .filter((a) => a[sortKey] > 1 || a.name == "The Red Pill")
        .sort((a, b) => b[sortKey]/b.price - a[sortKey]/a.price)
        .concat(...augments
            .filter((a) => a[sortKey] == 1 && a.name != "The Red Pill")
            .sort((a, b) => a.price - b.price)
        );

    const maybeBuy = augments.slice().filter((a) => canBuy(ns, a));
    for (let i=0; i < maybeBuy.length && totalPrice(maybeBuy.slice(0, i+1)) < ns.getServerMoneyAvailable("home"); i++) {
        augments[augments.indexOf(maybeBuy[i])].to_buy = true;
    }

    if (purchase) {
        augments = augments
            .filter((aug) => aug.to_buy)
            .sort((a, b) => b.price - a.price);
        for (let augment of augments) {
            const faction = pickFaction(ns, augment);
            let multiplier = 1;
            if (ns.purchaseAugmentation(faction, augment.name)) {
                ns.tprint(`Bought ${augment.name} for ${ns.nFormat(augment.price * multiplier, "$0.00a")}.`);
                multiplier *= 1.9;
            } else {
                ns.tprint(`Failed to buy ${augment.name}, bailing`);
                ns.exit();
            }
        }
        return augments;
    } else if (augments.length && print) {
        const augsToShow = augments.filter((aug) => hasPrereqs(ns, aug));
        const price = ns.nFormat(totalPrice(augments.filter((a) => a.to_buy)), "$0.00a");
        ns.tprintf(`\nAugments with no missing prereqs, sorted by expected ${sortKey} value:\n\n`);
        ns.tprintf(makeTable(ns, makeRows(ns, augsToShow), labels));
        ns.tprintf(`\nCall this script with -y to buy the augments with a # in the \$ column for ${price}.`);
    }
    return maybeBuy;
}

export async function main(ns) {
    await getAugments(ns, ns.args.includes("-y"), true);
}