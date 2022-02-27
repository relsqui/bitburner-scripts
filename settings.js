/** @param {NS} ns **/
export function getSettings(ns) {
    const filename = "settings-json.txt";
    return JSON.parse(ns.read(filename));
}

export async function main(ns) {
    ns.tprint(JSON.stringify(getSettings(ns), null, 2));
}