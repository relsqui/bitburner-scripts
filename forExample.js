/** @param {NS} ns **/
export async function main(ns) {
    const foo = document;
    ns.write("example/foo.txt", JSON.stringify(foo, null, 2));
}