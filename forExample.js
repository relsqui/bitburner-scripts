/** @param {NS} ns **/

export async function main(ns) {
    function pprint(o) {
        ns.tprint(JSON.stringify(o, null, 2));
    }
    // pprint(ns.sleeve.getInformation(0));
    pprint(ns.sleeve.getTask(0));
}