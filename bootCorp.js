/** @param {NS} ns **/
export async function main(ns) {
    while (!ns.getPlayer().hasCorporation) {
        await ns.sleep(1000);
        if (ns.corporation.createCorporation("Whiskers Inc.", true)) {
            ns.corporation.expandIndustry("Agriculture", "Cat Grass Fields");
            ns.run("runCorp.js");
            ns.toast("Corp founded!");
        }
    }
}