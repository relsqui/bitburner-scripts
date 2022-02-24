/** @param {NS} ns **/

// defining an object
const petTypes = {
    // key: value
    "Simkhe": "cat",
    "Archer": "cat",
    "Zii": "cat", 
    "Violet": "dog"
}

const simkhePraise = "Simkhe is a good " + petTypes.Simkhe;

// sometimes you have a bunch of variables already
// that you want to put in an object together

const name = "Simkhe";
const species = "cat";
const colors = ["black", "white"];
const quality = "perfect";

// this situation is so common that there's a shorthand:

const simkheStats = {
    // equivalent to name: name
    name,
    // species: species
    species,
    // etc.
    colors,
    quality
}

const detailedSimkhePraise = simkheStats.name + " is a " + simkheStats.quality + 
    " " + simkheStats.colors[0] + " and " + simkheStats.colors[1] + " " + simkheStats.species;

export async function main(ns) {
    ns.tprint(simkhePraise);
    ns.tprint(detailedSimkhePraise);
}