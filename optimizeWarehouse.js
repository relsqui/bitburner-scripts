/** @param {NS} ns **/

import { makeTable } from './table.js';

const size = {
    // Water: 0.05,
    // Energy: 0.01,
    // Food: 0.03,
    // Plants: 0.05,
    // Metal: 0.1,
    Hardware: 0.06,
    // Chemicals: 0.05,
    // Drugs: 0.02,
    Robots: 0.5,
    AICores: 0.1,
    RealEstate: 0.005,
};

const industries = {
    Energy: {
        reFac: 0.65,
        robFac: 0.05,
        aiFac: 0.3,
        hwFac: 0
    },
    Utilities: {
        reFac: 0.5,
        robFac: 0.4,
        aiFac: 0.4,
        hwFac: 0
    },
    Agriculture: {
        reFac: 0.72,
        hwFac: 0.2,
        robFac: 0.3,
        aiFac: 0.3
    },
    Fishing: {
        reFac: 0.15,
        hwFac: 0.35,
        robFac: 0.5,
        aiFac: 0.2
    },
    Mining: {
        reFac: 0.3,
        hwFac: 0.4,
        robFac: 0.45,
        aiFac: 0.45
    },
    // NB: food is a special case, it "diminishes per city"
    Food: {
        hwFac: 0.15,
        robFac: 0.3,
        aiFac: 0.25,
        reFac: 0.05
    },
    Tobacco: {
        reFac: 0.15,
        hwFac: 0.15,
        robFac: 0.2,
        aiFac: 0.15
    },
    Chemical: {
        reFac: 0.25,
        hwFac: 0.2,
        robFac: 0.25,
        aiFac: 0.2
    },
    Pharmaceutical: {
        reFac: 0.05,
        hwFac: 0.15,
        robFac: 0.25,
        aiFac: 0.2
    },
    Computer: {
        reFac: 0.2,
        robFac: 0.36,
        aiFac: 0.19,
        hwFac: 0
    },
    Robotics: {
        reFac: 0.32,
        aiFac: 0.36,
        hwFac: 0.19,
        robFac: 0
    },
    Software: {
        hwFac: 0.25,
        reFac: 0.15,
        aiFac: 0.18,
        robFac: 0.05
    },
    Healthcare: {
        reFac: 0.1,
        hwFac: 0.1,
        robFac: 0.1,
        aiFac: 0.1
    },
    RealEstate: {
        robFac: 0.6,
        aiFac: 0.6,
        hwFac: 0.05,
        reFac: 0
    }
};

function makeWarehouse(RealEstate, Hardware, Robots, AICores) {
    return { RealEstate, Hardware, Robots, AICores };
}

function getUsage(wh, whSize) {
    return Math.ceil(Object.keys(wh).reduce((sum, mat) => wh[mat] * size[mat] + sum, 0));
}

function makeBalancedVolWh(whSize) {
    const volEach = whSize / 4;
    return makeWarehouse(
        Math.floor(volEach / size.RealEstate),
        Math.floor(volEach / size.Hardware),
        Math.floor(volEach / size.Robots),
        Math.floor(volEach / size.AICores),
    );
}

function makeBalancedQtyWh(whSize) {
    const materials = Object.keys(size);
    const totalSize = materials.reduce((sum, mat) => sum + size[mat], 0);
    const countEach = Math.floor(whSize / totalSize);
    return makeWarehouse(countEach, countEach, countEach, countEach);
}

export function makeWeightedVolWh(industryName, whSize) {
    const industry = industries[industryName];
    const weightSum = industry.reFac + industry.hwFac + industry.robFac + industry.aiFac;
    return makeWarehouse(
        Math.floor((whSize * industry.reFac / weightSum) / size.RealEstate),
        Math.floor((whSize * industry.hwFac / weightSum) / size.Hardware),
        Math.floor((whSize * industry.robFac / weightSum) / size.Robots),
        Math.floor((whSize * industry.aiFac / weightSum) / size.AICores),
    );
}

function makeWeightedQtyWh(industryName, whSize) {
    const industry = industries[industryName];
    const weightSum = (industry.reFac * size.RealEstate) + (industry.hwFac * size.Hardware)
        + (industry.robFac * size.Robots) + (industry.aiFac * size.AICores);
    return makeWarehouse(
        Math.floor(industry.reFac * whSize / weightSum),
        Math.floor(industry.hwFac * whSize / weightSum),
        Math.floor(industry.robFac * whSize / weightSum),
        Math.floor(industry.aiFac * whSize / weightSum)
    );
}

function makeBestOnlyWh(industryName, whSize) {
    const industry = industries[industryName];
    const bestMult = Math.max(...Object.values(industry));
    const zeroWh = makeWarehouse(0, 0, 0, 0);
    switch (bestMult) {
        case industry.reFac:
            return { ...zeroWh, RealEstate: Math.floor(whSize / size.RealEstate) };
        case industry.hwFac:
            return { ...zeroWh, Hardware: Math.floor(whSize / size.Hardware) };
        case industry.robFac:
            return { ...zeroWh, Robots: Math.floor(whSize / size.Robots) };
        case industry.aiFac:
            return { ...zeroWh, AICores: Math.floor(whSize / size.AICores) };
    }
}

function makeMathWh(industryName, whSize, valueFn) {
    const industry = industries[industryName];
    const materials = Object.keys(size);
    function valueMat(mat) {
        const factor = {
            RealEstate: "reFac",
            Hardware: "hwFac",
            Robots: "robFac",
            AICores: "aiFac"
        }[mat];
        return valueFn(mat, industry[factor]);
    }
    const weights = materials.reduce((obj, mat) => {
        obj[mat] = valueMat(mat);
        return obj;
    }, {});
    const totalWeight = Object.values(weights).reduce((a, b) => a + b);
    return materials.reduce((warehouse, mat) => {
        warehouse[mat] = Math.floor((whSize * weights[mat] / totalWeight) / size[mat]);
        return warehouse;
    }, {});
}

function makeMathQtyWh(industryName, whSize) {
    return makeMathWh(industryName, whSize, (mat, factor) => Math.pow(1.002, factor) / size[mat]);
}

function makeMathVolWh(industryName, whSize) {
    return makeMathWh(industryName, whSize, (mat, factor) => Math.pow(1 + (0.002 / size[mat]), factor));
}

function makeMathV3Wh(industryName, whSize) {
    return makeMathWh(industryName, whSize, (mat, factor) => Math.pow(((0.002 / size[mat]) + 1), factor));
}

function makeCalcWh(industryName, whSize) {
    const { reFac, hwFac, robFac, aiFac } = industries[industryName];
    const ratio = {
        RealEstate: reFac == 0 ? 0 : 1,
        Hardware: hwFac == 0 ? 0 : Math.max((1.002 * Math.pow(reFac, ((reFac - 1) / (hwFac - 1)))) / hwFac - 1, 0) / 0.002,
        Robots: robFac == 0 ? 0 : Math.max((1.002 * Math.pow(reFac, ((reFac - 1) / (robFac - 1)))) / robFac - 1, 0) / 0.002,
        AICores: aiFac == 0 ? 0 : Math.max((1.002 * Math.pow(reFac, ((reFac - 1) / (aiFac - 1)))) / aiFac - 1, 0) / 0.002,
    };
    const sum = Object.values(ratio).reduce((a, b) => a + b);
    return Object.keys(ratio).reduce((warehouse, material) => {
        warehouse[material] = Math.floor(whSize * ratio[material] / sum / size[material]);
        return warehouse;
    }, {});
}

function getCityMult(warehouse, industry) {
    return Math.pow(0.002 * warehouse.RealEstate + 1, industry.reFac) *
        Math.pow(0.002 * warehouse.Hardware + 1, industry.hwFac) *
        Math.pow(0.002 * warehouse.Robots + 1, industry.robFac) *
        Math.pow(0.002 * warehouse.AICores + 1, industry.aiFac);
}

function makeRow(ns, industryName, wh, whSize, strategy) {
    function ff(n) {
        return n == 0 ? "" : ns.nFormat(n, "0.00");
    }
    function fi(n) {
        return n == 0 ? "" : n;
    }
    const i = industries[industryName];
    const row = [ff(i.reFac), fi(wh.RealEstate), ff(i.hwFac), fi(wh.Hardware), ff(i.robFac), fi(wh.Robots), ff(i.aiFac), fi(wh.AICores)];
    return [industryName, strategy, ns.nFormat(getCityMult(wh, i), "0.0000"), ...row, getUsage(wh), whSize];
}

export async function main(ns) {
    const rows = [
        makeRow(ns, "Agriculture", makeWarehouse(27000, 125, 0, 75), 300, "Guide 1"),
        makeRow(ns, "Agriculture", makeWarehouse(146400, 2800, 96, 2520), 2000, "Guide 2"),
        makeRow(ns, "Agriculture", makeWarehouse(230400, 9300, 726, 6270), 3800, "Guide 3"),
    ];
    const labels = ["Industry", "Strategy", "Mult", "reFac", "RE", "hwFac", "HW", "robFac", "Rb", "aiFac", "AI", "Use", "Max"];
    for (let industryName of Object.keys(industries).sort()) {
        for (let whSize of industryName == "Agriculture" ? [150, 1200, 2700] : [150]) {
            let warehouse = makeBalancedQtyWh(whSize);
            rows.push(makeRow(ns, industryName, warehouse, whSize, "Equal qty"));
            warehouse = makeBalancedVolWh(whSize);
            rows.push(makeRow(ns, industryName, warehouse, whSize, "Equal vol"));
            warehouse = makeBestOnlyWh(industryName, whSize);
            rows.push(makeRow(ns, industryName, warehouse, whSize, "Best mat only"));
            warehouse = makeWeightedQtyWh(industryName, whSize);
            rows.push(makeRow(ns, industryName, warehouse, whSize, "Weighted qty"));
            warehouse = makeWeightedVolWh(industryName, whSize);
            rows.push(makeRow(ns, industryName, warehouse, whSize, "Weighted vol"));
            warehouse = makeMathQtyWh(industryName, whSize);
            rows.push(makeRow(ns, industryName, warehouse, whSize, "Math? qty"));
            warehouse = makeMathVolWh(industryName, whSize);
            rows.push(makeRow(ns, industryName, warehouse, whSize, "Math? vol"));
            warehouse = makeMathV3Wh(industryName, whSize);
            rows.push(makeRow(ns, industryName, warehouse, whSize, "Math v3"));
            warehouse = makeCalcWh(industryName, whSize);
            rows.push(makeRow(ns, industryName, warehouse, whSize, "Calculus??"));
        }
    }
    rows.sort((a, b) => {
        const industry = labels.indexOf("Industry");
        const mult = labels.indexOf("Mult");
        const usage = labels.indexOf("Use");
        if (a[industry] == b[industry]) {
            if (a[usage] == b[usage]) {
                return b[mult] - a[mult];
            } else {
                return b[usage] - a[usage];
            }
        } else {
            return a[industry].charCodeAt(0) - b[industry].charCodeAt(0);
        }
    });
    ns.tprintf(makeTable(ns, rows, labels));
}