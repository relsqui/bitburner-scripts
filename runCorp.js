/** @param {NS} ns **/
import { makeTable } from './table.js';

function growWarehouse(ns, {division, city, warehouse}) {
    function fmt (n) {
        return ns.nFormat(n, "$0.00a");
    }
    const threshold = 0.95;
    if (warehouse.size * threshold < warehouse.sizeUsed) {
        const funds = ns.corporation.getCorporation().funds;
        const upgradeCost = ns.corporation.getUpgradeWarehouseCost(division.name, city);
        if (funds > upgradeCost) {
            // ns.tprint(`Would upgrade warehouse for ${division.name}/${city}: ${fmt(funds)} > ${fmt(upgradeCost)}`);
            // ns.corporation.upgradeWarehouse(division.name, city);
            // ns.toast(`Upgraded ${division.name} warehouse in ${city}.`);
        }
    }
    return ns.corporation.getWarehouse(division.name, city);
}

function stockWarehouse(ns, { division, city }) {
    if (division.type != "Agriculture") {
        return ns.corporation.getWarehouse(division.name, city);
    }
    const targetInv = {
        "Hardware": 9300,
        "Robots": 726,
        "AI Cores": 6270,
        "Real Estate": 230400
    };
    for (let key of Object.keys(targetInv)) {
        const material = ns.corporation.getMaterial(division.name, city, key);
        // sell price is over 10 seconds
        const dQty = (targetInv[key] - material.qty)/10;
        if (dQty < 0) {
            // ns.tprint(`Would sell ${-dQty} ${key} from ${division.name}/${city}`);
            ns.corporation.buyMaterial(division.name, city, key, 0, "MP");
            ns.corporation.sellMaterial(division.name, city, key, -1 * dQty, "MP");
        } else {
            // ns.tprint(`Would buy ${dQty} ${key} for ${division.name}/${city}`);
            ns.corporation.sellMaterial(division.name, city, key, 0, "MP");
            ns.corporation.buyMaterial(division.name, city, key, dQty, "MP");
        }
    }
    return ns.corporation.getWarehouse(division.name, city);
}

function drainWarehouse(ns, { division, city }) {
    ns.corporation.setSmartSupply(division.name, city, false);
    const materials = ["Water", "Energy", "Food", "Plants", "Hardware", "Robots", "AI Cores", "Real Estate"];
    for (let material of materials) {
        ns.corporation.buyMaterial(division.name, city, material, 0, "MP");
        ns.corporation.sellMaterial(division.name, city, material, "MAX", "MP");
    }
    return ns.corporation.getWarehouse(division.name, city);
}

function cycleProducts(ns, {corp, division}) {
    if (!division.cities.includes("Aevum")) {
        return;
    }
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
        const oldProduct = products.shift();
        ns.toast(`Discontinuing ${oldProduct.name}.`);
        ns.corporation.discontinueProduct(division.name, oldProduct.name);
    }

    if (products.length == finishedProducts.length) {
        const investment = Math.ceil(corp.funds/100);
        const name = `${division.name} ${Math.round(Math.random() * 10000)}`
        ns.toast(`Developing ${name}`);
        ns.corporation.makeProduct(division.name, "Aevum", `${name}`, investment, investment);
    }
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

function jobCounts(ns, {division, city, office}) {
    const counts = {};
    for (let name of office.employees) {
        const employee = ns.corporation.getEmployee(division.name, city, name);
        counts[employee.pos] = (counts[employee.pos] || 0) + 1;
    }
    return counts;
}

async function hirePeople(ns, context) {
    const {division, city} = context;
    const office = ns.corporation.getOffice(division.name, city);
    if (office.employees.length >= office.size) {
        return;
    }
    const newNames = [];
    while (newNames.length < office.size - office.employees.length) {
        newNames.push(ns.corporation.hireEmployee(division.name, city).name);
    }
    const jobs = ["Operations", "Engineer", "Management", "Research & Development", "Business"];
    const assignments = jobCounts(ns, {office, ...context});
    for (let job of jobs) {
        let targetCount = Math.ceil(office.size / jobs.length) - (assignments[job] || 0);
        while (targetCount > 0 && newNames.length > 0) {
            await ns.corporation.assignJob(division.name, city, newNames.pop(), job);
            targetCount--;
        }
    }
}

function makeRow(ns, context) {
    let {division, city, warehouse} = context;
    let productString = "";
    const productCompletion = getProducts(ns, context).map((product) => product.developmentProgress);
    productCompletion.filter((c) => c < 100);
    if (city == "Aevum" && productCompletion[0]) {
        productString = productCompletion[0].toString().slice(0, 5) + "%";
    }
    return [division.name, city, Math.round(warehouse.sizeUsed), warehouse.size, productString];

}

export async function main(ns) {
    const labels = ["Division", "City", "Used", "Total", "Dev"];
    ns.disableLog("ALL");
    while (true) {
        const data = [];
        const corp = ns.corporation.getCorporation();
        for (let division of corp.divisions) {
            let context = {corp, division};
            cycleProducts(ns, context);
            for (let city of division.cities) {
                context.city = city;
                await hirePeople(ns, context);
                if (ns.corporation.hasWarehouse(division.name, city)) {
                    context.warehouse = ns.corporation.getWarehouse(division.name, city);
                    if (context.warehouse.size * 0.95 < context.warehouse.sizeUsed) {
                        context.warehouse = drainWarehouse(ns, context);
                    } else {
                        ns.corporation.setSmartSupply(division.name, city, true);
                        context.warehouse = stockWarehouse(ns, context);
                    }
                } else {
                    context.warehouse = {size: 0, sizeUsed: 0};
                }
                data.push(makeRow(ns, context));
            }
        }
        ns.clearLog();
        ns.print(makeTable(ns, data, labels));
        await ns.sleep(1000);
    }
}