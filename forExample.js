/** @param {NS} ns **/

export async function main(ns) {
    function pprint(o) {
        ns.tprint(JSON.stringify(o, null, 2));
    }
    function shallowPprint(o) {
        const flat = {};
        for (let key of Object.keys(o)) {
            flat[key] = o[key].toString();
        }
        pprint(flat);
    }

    // const elements = document.body.getElementsByTagName('*');
    // shallowPprint(elements[0])
    // pprint(document.body._reactRootContainer);


    function gainRate(level, ram, cores, mult) {
        const rate = ns.formulas.hacknetServers.hashGainRate(level, 0, ram, cores, mult);
        return `level ${level}, ram ${ram}, cores ${cores} = ${rate}`;
    }

    ns.tprint(gainRate(113, 2048, 23, 2));
}