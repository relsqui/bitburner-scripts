/** @param {NS} ns **/
import { makeTable } from './table.js';

export const companies = [
    "MegaCorp", "ECorp", "Clarke Incorporated", "Bachman & Associates",
    "KuaiGong International", "Four Sigma", "Blade Industries", "OmniTek Incorporated"
];

const status = companies.reduce((o, company) => {
    o[company] = "Waiting";
    return o;
}, {});

function printStatus(ns) {
    const labels = ["Company", "Rep", "Title", "Status"];
    const rows = companies.map((company) => [
        company,
        ns.nFormat(ns.getCompanyRep(company), "0.00a"),
        ns.getPlayer().jobs[company] || "",
        status[company]
    ]);
    ns.clearLog();
    ns.print(makeTable(ns, rows, labels));
}

export async function main(ns) {
    const title = "Chief Technology Officer";
    const field = "Software";
    const delay = 1000;
    ns.disableLog("ALL");
    ns.tail();
    while (Object.values(ns.getPlayer().jobs).filter((t) => t === title).length < companies.length) {
        // outermost loop means if we can't even start working for a company we'll try again
        for (let company of companies) {
            status[company] = "Done";
            while (ns.getPlayer().jobs[company] != title) {
                for (let c of companies.filter((c) => c !== company)) {
                    // do a round of applications to take advantage of rep from sleeves
                    if (ns.applyToCompany(c, field)) {
                        status[company] = "Waiting";
                    }
                }
                if (ns.applyToCompany(company, field)) {
                    status[company] = "Working";
                    ns.workForCompany(company, false);
                } else if (!ns.getPlayer().jobs[company]) {
                    status[company] = "Unqualified";
                    break;
                }
                printStatus(ns);
                await ns.sleep(delay);
            }
        }
        printStatus(ns);
        await ns.sleep(delay);
    }
}