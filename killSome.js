/** @param {NS} ns **/
export async function main(ns) {
    const processes = ns.ps();
    for (let process of processes) {
        if (process.filename == ns.args[0]) {
            ns.kill(process.pid);
        }
    }
}