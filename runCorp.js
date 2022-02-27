/** @param {NS} ns **/
import { makeTable } from './table.js';

function maybeUpgradeWarehouse(ns, {division, city, warehouse}) {
    const threshold = 0.95;
    if (warehouse.size * threshold < warehouse.sizeUsed) {
        if (ns.corporation.getCorporation().funds < ns.corporation.getUpgradeWarehouseCost(division.name, city)) {
            ns.corporation.upgradeWarehouse(division.name, city);
            ns.toast(`Upgraded ${division.name} warehouse in ${city}.`);
        }
    }
}

function maybeCycleProducts(ns, {corp, division}) {
    const productDivisions = ["Tobacco", "Software"];
    const products = getProducts(ns, {division});
    let finishedProducts = [];
    for (let product of products) {
        if (product.developmentProgress >= 100) {
            finishedProducts.push(product);
            ns.corporation.sellProduct(division.name, "Aevum", product.name, "MAX", "MP", true);
            if (ns.corporation.hasUnlockUpgrade("Office API") &&
                ns.corporation.hasResearched(division.name, "Market-TA.II")) {
                    ns.corporation.setProductMarketTA2(division.name, product.name, true);
            }
        }
    }

    if (!productDivisions.includes(division.type)) {
        // let the first part of this function run to sell off bugged
        // products from non-product divisions, then bail here
        return;
    }
    
    if (finishedProducts.length == 3) {
        // we already have something in development
        const oldProduct = products.shift();
        ns.toast(`Discontinuing ${oldProduct.name}.`);
        ns.corporation.discontinueProduct(division.name, oldProduct.name);
    }

    if (products.length < 3) {
        const investment = Math.ceil(corp.funds/100);
        const name = `${division.name} ${Math.round(Math.random() * 10000)}`
        ns.toast(`Developing ${name}`);
        ns.corporation.makeProduct(division.name, "Aevum", `${name}`, investment, investment);
    }
    return;
}

function getProducts(ns, {division}) {
    const updatedDivision = ns.corporation.getCorporation().divisions.filter((d) => d.name == division.name)[0];
    const productNames = updatedDivision.products;
    const products = [];
    for (let name of productNames) {
        products.push(ns.corporation.getProduct(division.name, name));
    }
    return products;
}

export async function main(ns) {
    const labels = ["Division", "City", "Used", "Total", "Products"];
    ns.disableLog("ALL");
    while (true) {
        ns.clearLog();
        const data = [];
        const corp = ns.corporation.getCorporation();
        for (let division of corp.divisions) {
            let context = {corp, division};
            let productString = "";
            maybeCycleProducts(ns, context);
            productString = getProducts(ns, context).map((product) => product.name).join(", ");
            for (let city of division.cities) {
                if (!ns.corporation.hasWarehouse(division.name, city)) {
                    continue;
                }
                const warehouse = ns.corporation.getWarehouse(division.name, city);
                context = {...context, city, warehouse};
                // maybeUpgradeWarehouse(ns, context);
                data.push([division.name, city, Math.round(warehouse.sizeUsed), warehouse.size, productString]);
            }
        }
        ns.print(makeTable(ns, data, labels));
        await ns.sleep(10);
    }
}