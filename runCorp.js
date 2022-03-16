/** @param {NS} ns **/
import { makeWeightedVolWh } from './optimizeWarehouse.js';
import { getSettings } from './settings.js';
import { makeTable } from './table.js';

const productDivisions = ["Tobacco", "Software", "Healthcare", "Food", "Pharmaceutical", "Computer", "Robotics", "RealEstate"];
const materials = ["Water", "Energy", "Food", "Plants", "Hardware", "Robots", "AI Cores", "Real Estate"];
const materialInputs = {
    Energy: ["Hardware", "Metal"],
    Utilities: ["Hardware", "Metal"],
    Agriculture: ["Water", "Energy"],
    Fishing: ["Energy"],
    Mining: ["Energy"],
    Food: ["Food", "Water", "Energy"],
    Tobacco: ["Plants", "Water"],
    Chemical: ["Plants", "Energy", "Water"],
    Pharmaceutical: ["Chemicals", "Energy", "Water"],
    Computer: ["Metal", "Energy"],
    Robotics: ["Hardware", "Energy"],
    Software: ["Hardware", "Energy"],
    Healthcare: ["Robots", "AICores", "Energy", "Water"],
    RealEstate: ["Metal", "Energy", "Water", "Hardware"],
}
const materialOutputs = {
    Energy: ["Energy"],
    Utilities: ["Water"],
    Agriculture: ["Plants", "Food"],
    Fishing: ["Food"],
    Mining: ["Metal"],
    Food: [],
    Tobacco: [],
    Chemical: ["Chemicals"],
    Pharmaceutical: ["Drugs"],
    Computer: ["Hardware"],
    Robotics: ["Robots"],
    Software: ["AICores"],
    Healthcare: [],
    RealEstate: ["RealEstate"], // why not Real Estate?
}

function growWarehouse(ns, { division, city, warehouse }, threshold = 0.95) {
    if (warehouse.size * threshold < warehouse.sizeUsed) {
        const upgradeCost = ns.corporation.getUpgradeWarehouseCost(division.name, city);
        const smartStorageCost = ns.corporation.getUpgradeLevelCost("Smart Storage");
        if (upgradeCost * 6 < smartStorageCost) {
            // if we're upgrading this warehouse we probably will want to in the other cities too
            if (ns.corporation.getCorporation().funds > upgradeCost) {
                ns.corporation.upgradeWarehouse(division.name, city);
                ns.toast(`Upgraded ${division.name} warehouse in ${city}.`);
            }
        } else {
            if (ns.corporation.getCorporation().funds > smartStorageCost) {
                ns.corporation.levelUpgrade("Smart Storage");
                ns.toast(`Bought a level of Smart Storage.`);
            }
        }
    }
    return ns.corporation.getWarehouse(division.name, city);
}

function sellMaterials(ns, {division, city}) {
    for (let material of materialOutputs[division.type]) {
        ns.corporation.sellMaterial(division.name, city, material, "MAX", "MP");
    }
    if (ns.corporation.hasResearched(division.name, "Market-TA.II")) {
        for (let material of materials) {
            ns.corporation.setMaterialMarketTA2(division.name, city, material, true);
        }
    }
}

function stockWarehouse(ns, { division, city }) {
    const stockRate = getSettings(ns).corp.whStockRate || 0.5;
    const targetInv = makeWeightedVolWh(division.type, ns.corporation.getWarehouse(division.name, city).size * stockRate);

    for (let key of Object.keys(targetInv)) {
        if (materialInputs[division.type].includes(key)) {
            // we'd just be fighting smart supply
            // TODO: move this logic into the warehouse optimizer
            // so we can take it into account when balancing
            continue;
        }
        const material = ns.corporation.getMaterial(division.name, city, key);
        // sell price is over 10 seconds
        const dQty = (targetInv[key] - material.qty) / 10;
        if (dQty < 0) {
            ns.corporation.buyMaterial(division.name, city, key, 0, "MP");
            ns.corporation.sellMaterial(division.name, city, key, -1 * dQty, "MP");
        } else {
            ns.corporation.sellMaterial(division.name, city, key, 0, "MP");
            ns.corporation.buyMaterial(division.name, city, key, dQty, "MP");
        }
    }
    return ns.corporation.getWarehouse(division.name, city);
}

function buyAds(ns, { division }) {
    const upgradeCost = ns.corporation.getOfficeSizeUpgradeCost(division.name, "Aevum", 15);
    const adCost = ns.corporation.getHireAdVertCost(division.name);
    if (adCost < upgradeCost && adCost < ns.corporation.getCorporation().funds) {
        ns.corporation.hireAdVert(division.name);
        ns.toast(`Buying an ad for ${division.name}`);
    }
}

function drainWarehouse(ns, { division, city }) {
    ns.corporation.setSmartSupply(division.name, city, false);
    for (let material of materials) {
        ns.corporation.buyMaterial(division.name, city, material, 0, "MP");
        ns.corporation.sellMaterial(division.name, city, material, "MAX", "MP");
    }
    return ns.corporation.getWarehouse(division.name, city);
}

function researchIfPossible(ns, division, researchNames, skipBuffer) {
    const newResearches = researchNames.filter((r) => !ns.corporation.hasResearched(division.name, r));
    if (newResearches.length == 0) {
        return true;
    }
    const totalCost = researchNames.reduce((total, r) => total + ns.corporation.getResearchCost(division.name, r), 0);
    if (division.research < totalCost * 2 || (division.research - totalCost < 50000 && !skipBuffer)) {
        return false;
    }
    for (let r of newResearches) {
        ns.toast(`${division.name} researched ${r}`);
        ns.corporation.research(division.name, r);
    }
    return true;
}

function expandDivision(ns, { division }) {
    function corpFunds() {
        return ns.corporation.getCorporation().funds;
    }
    function updatedDivision() {
        return ns.corporation.getCorporation().divisions.filter((d) => d.name == division.name)[0];
    }
    const cities = ["Aevum", "Chongqing", "Ishima", "New Tokyo", "Sector-12", "Volhaven"];
    const cityCost = ns.corporation.getExpandCityCost();
    const warehouseCost = ns.corporation.getPurchaseWarehouseCost();
    for (let city of cities) {
        if (!division.cities.includes(city) && cityCost + warehouseCost < corpFunds()) {
            ns.toast(`Expanding ${division.name} to ${city}`);
            ns.corporation.expandCity(division.name, city);
            division = updatedDivision();
        }
        if (division.cities.includes(city) && !ns.corporation.hasWarehouse(division.name, city) &&
            warehouseCost < corpFunds()) {
            ns.corporation.purchaseWarehouse(division.name, city);
        }
    }
    return division;
}

function doResearch(ns, { division }) {
    const priorities = [
        ["Hi-Tech R&D Laboratory"],
        ["Market-TA.I", "Market-TA.II"],
        ["Drones", "Drones - Assembly"],
        ["Drones - Transport"],
        ["AutoPartyManager"],
        ["AutoBrew"],
    ]
    // if (productDivisions.includes(division.type)) {
    //     priorities.push(
    //         ["uPgrade: Fulcrum", "uPgrade: Capacity.I"],
    //         ["uPgrade: Capacity.II"],
    //     );
    // }
    priorities.push(
        ["Automatic Drug Administration", "CPH4 Injections"],
        ["Self-Correcting Assemblers"],
        ["Go-Juice"],
        ["JoyWire"],
        ["Overclock"],
        ["Sti.mu"]
    );
    // if (productDivisions.includes(division.type)) {
    //     priorities.push(
    //         ["uPgrade: Dashboard"],
    //     )
    // }
    for (let researchSet of priorities) {
        const updatedDivision = ns.corporation.getCorporation().divisions.filter((d) => d.name == division.name)[0];
        if (!researchIfPossible(ns, updatedDivision, researchSet, researchSet[0] == "Hi-Tech R&D Laboratory")) {
            return;
        }
    }
}

const priceGuesses = {};

function guessPrice(product) {
    const [lastGuess, lastGuessTime] = priceGuesses[product.name] || [1, 0];
    if (Date.now() - lastGuessTime < 15000) {
        // we need at least a market cycle to know if a guess worked
        return `MP*${lastGuess}`;
    }

    const priceSplit = (product.sCost || "").split("*");
    const currentMult = priceSplit.length > 1 ? Number(priceSplit[1]) : 1000;
    const closeEnough = 5;
    const [storedQty, prodQty, sellQty] = product.cityData["Aevum"];

    let newMult = currentMult;
    if (storedQty > 0 && prodQty > sellQty) {
        newMult = Math.floor((currentMult + lastGuess) / 2)
    } else if (prodQty + closeEnough < sellQty && currentMult > lastGuess) {
        priceGuesses[product.name] = [currentMult, Date.now()];
        newMult *= 2;
    }
    return `MP*${newMult}`;
}

function cycleProducts(ns, { division }) {
    if (!division.cities.includes("Aevum")) {
        return;
    }
    const products = getProducts(ns, { division });

    if (!productDivisions.includes(division.type)) {
        // sometimes they get products by accident when I'm messing with the script
        // and you can't sell them, they just eat inv forever
        for (let product of products) {
            ns.toast(`Discontinuing bug product ${product.name}`);
            ns.corporation.discontinueProduct(division.name, product.name);
        }
        return;
    }

    let finishedProducts = [];
    let inDevelopment = [];
    for (let product of products) {
        if (product.developmentProgress < 100) {
            inDevelopment.push(product);
        } else {
            finishedProducts.push(product);
        }
        if (product.developmentProgress >= 100 || ns.corporation.hasResearched(division.name, "uPgrade: Dashboard")) {
            ns.corporation.sellProduct(division.name, "Aevum", product.name, "MAX", guessPrice(product), true);
            if (ns.corporation.hasResearched(division.name, "Market-TA.II")) {
                ns.corporation.setProductMarketTA2(division.name, product.name, true);
            }
        }
    }

    let maxProducts = 3;
    for (let r of ["uPgrade: Capacity.I", "uPgrade: Capacity.II"]) {
        if (ns.corporation.hasResearched(division.name, r)) {
            maxProducts++;
        }
    }

    if (finishedProducts.length == maxProducts && ns.corporation.getCorporation().funds > 0) {
        const oldProduct = products.shift();
        ns.toast(`Discontinuing ${oldProduct.name}.`);
        ns.corporation.discontinueProduct(division.name, oldProduct.name);
    }

    if (inDevelopment.length == 0 && products.length < maxProducts) {
        const investment = Math.ceil(ns.corporation.getCorporation().funds / 100);
        if (investment < 0) {
            return;
        }
        const allNames = products.map((p) => p.name);
        let name;
        do {
            name = `${division.name} ${Math.round(Math.random() * 100000)}`
        } while (allNames.includes(name));
        ns.toast(`Developing ${name}`);
        ns.corporation.makeProduct(division.name, "Aevum", `${name}`, investment, investment);
    }
}

function getProducts(ns, { division }) {
    const updatedDivision = ns.corporation.getCorporation().divisions.filter((d) => d.name == division.name)[0];
    const productNames = updatedDivision.products;
    const products = [];
    for (let name of productNames) {
        products.push(ns.corporation.getProduct(division.name, name));
    }
    return products;
}

function jobCounts(ns, { division, city, office }) {
    const counts = {};
    for (let name of office.employees) {
        const employee = ns.corporation.getEmployee(division.name, city, name);
        counts[employee.pos] = (counts[employee.pos] || 0) + 1;
    }
    return counts;
}

function getHappyStats(ns, context, office) {
    const employees = office.employees.map(
        (eName) => ns.corporation.getEmployee(context.division.name, context.city, eName)
    );
    return ["hap", "ene", "mor"].map(
        (key) => employees.reduce((total, e) => total + e[key], 0) / employees.length
    )
}

async function hirePeople(ns, context) {
    if (context.division.cities.length < 6) {
        return;
    }
    const happyThreshold = 99.95;
    // max new hires per office per tick
    const baseHeadcount = 1;
    const { division, city } = context;
    let office = ns.corporation.getOffice(division.name, city);
    let headCount = office.size > baseHeadcount ? baseHeadcount : baseHeadcount - office.size;
    // if no hiring cap is set, set it high enough that we can hire
    const hiringCap = getSettings(ns).corp.hiringCap || office.size + headCount;

    const belowMinHeadcount = office.size < (getSettings(ns).corp.minHeadcount || 9);
    if (getSettings(ns).corp.hiring && office.employees.length >= office.size && office.size < hiringCap &&
        (productDivisions.includes(division.type) || ns.corporation.hasResearched(division.name, "Market-TA.II") || belowMinHeadcount)) {
        const upgradeCost = ns.corporation.getOfficeSizeUpgradeCost(division.name, city, headCount);
        const employeesAreHappy = Math.min(...getHappyStats(ns, context, office)) >= happyThreshold;
        const aevumUpgradesFirst = (!productDivisions.includes(division.type)) || city == "Aevum" ||
            office.size + 60 < ns.corporation.getOffice(division.name, "Aevum").size;
        if (((employeesAreHappy && aevumUpgradesFirst) || belowMinHeadcount) && ns.corporation.getCorporation().funds > upgradeCost) {
            ns.corporation.upgradeOfficeSize(division.name, city, headCount);
            office = ns.corporation.getOffice(division.name, city);
        } else {
            return;
        }
    }

    const newNames = [];
    while (newNames.length < office.size - office.employees.length && headCount > 0) {
        newNames.push(ns.corporation.hireEmployee(division.name, city).name);
        headCount--;
    }
    let jobs;
    if (office.size < 4) {
        jobs = ["Operations", "Engineer", "Business"];
    } else {
        jobs = ["Operations", "Engineer", "Management", "Research & Development", "Business"];
    }
    const assignments = jobCounts(ns, { office, ...context });
    for (let job of jobs) {
        let targetCount = Math.ceil(office.size / jobs.length) - (assignments[job] || 0);
        while (targetCount > 0 && newNames.length > 0) {
            await ns.corporation.assignJob(division.name, city, newNames.pop(), job);
            targetCount--;
        }
    }
}

function makeRow(ns, context) {
    let { division, city, warehouse } = context;
    let productString = "";
    const products = getProducts(ns, context);
    const productCompletion = products.map((p) => p.developmentProgress).filter((p) => p < 100);
    if (city == "Aevum" && productCompletion.length > 0) {
        productString = Math.max(...productCompletion).toString().slice(0, 5) + "%";
    }
    return [division.name, city, Math.round(warehouse.sizeUsed), warehouse.size, productString];

}

export async function main(ns) {
    if (!ns.corporation.hasUnlockUpgrade("Smart Supply")) {
        ns.corporation.unlockUpgrade("Smart Supply");
    }
    if (!(ns.corporation.hasUnlockUpgrade("Office API") && ns.corporation.hasUnlockUpgrade("Warehouse API"))) {
        ns.tprint("Need office/warehouse APIs to use this!");
        return;
    }
    ns.disableLog("ALL");
    while (true) {
        const data = [];
        const corp = ns.corporation.getCorporation();
        const maxAnalytics = getSettings(ns).corp.maxAnalytics;
        if (getSettings(ns).corp.advertising && corp.divisions.length > 2  &&
            corp.funds > ns.corporation.getUpgradeLevelCost("Wilson Analytics") &&
            ((!maxAnalytics) || ns.corporation.getUpgradeLevel("Wilson Analytics") < maxAnalytics)) {
            ns.toast("Upgrading Wilson Analytics");
            ns.corporation.levelUpgrade("Wilson Analytics");
        }
        // most lucrative divisions get the first shot at resources
        corp.divisions.sort((a, b) => (b.thisCycleRevenue - b.thisCycleExpenses) - (a.thisCycleRevenue - a.thisCycleExpenses));
        for (let division of corp.divisions) {
            let context = { corp, division };
            if (getSettings(ns).corp.expanding) {
                context.division = expandDivision(ns, context);
            }
            doResearch(ns, context);
            cycleProducts(ns, context);
            if (getSettings(ns).corp.advertising && division.cities.length == 6 &&
                ns.corporation.getOffice(division.name, "Aevum").size >= (getSettings(ns).corp.minHeadcount || 30) &&
                (productDivisions.includes(division.type) || ns.corporation.hasResearched(division.name, "Market-TA.II"))) {
                buyAds(ns, context);
            }
            for (let city of division.cities) {
                context.city = city;
                await hirePeople(ns, context);
                if (ns.corporation.hasWarehouse(division.name, city)) {
                    context.warehouse = ns.corporation.getWarehouse(division.name, city);
                    context.warehouse = growWarehouse(ns, context);
                    sellMaterials(ns, context);
                    if (context.warehouse.size * 0.95 < context.warehouse.sizeUsed) {
                        context.warehouse = drainWarehouse(ns, context);
                    } else {
                        ns.corporation.setSmartSupply(division.name, city, true);
                        context.warehouse = stockWarehouse(ns, context);
                    }
                } else {
                    context.warehouse = { size: 0, sizeUsed: 0 };
                }
                data.push(makeRow(ns, context));
            }
        }
        ns.clearLog();
        ns.print(makeTable(ns, data, ["Division", "City", "Used", "Total", "Dev"]));
        await ns.sleep(getSettings(ns).corp.delay || 10000);
    }
}