/** @param {NS} ns **/
import { makeTable } from './table.js';

export const companies = [
    "MegaCorp", "ECorp", "Clarke Incorporated", "Bachman & Associates",
    "KuaiGong International", "Four Sigma", "Blade Industries", "OmniTek Incorporated"
];

const lastTitle = {
    Business: "Chief Executive Officer",
    Software: "Chief Technology Officer",
    Security: "Head of Security",
}

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

function workingAt(ns, company) {
    const player = ns.getPlayer()
    return player.isWorking && player.location == company
}

export async function main(ns) {
    const field = ns.args[0] || "Software";
    const title = lastTitle[field] || "";
    const delay = 5000;
    const doWork = ns.args.includes("work");
    ns.disableLog("ALL");
    while (Object.values(ns.getPlayer().jobs).filter((t) => t === title).length < companies.length) {
        // outermost loop means if we can't even start working for a company we'll try again
        for (let company of companies) {
            while (ns.getPlayer().jobs[company] != title) {
                for (let c of companies.filter((c) => c !== company)) {
                    // do a round of applications to take advantage of rep from sleeves
                    if (ns.applyToCompany(c, field)) {
                        status[company] = "Waiting";
                    }
                }
                if (!(ns.applyToCompany(company, field) || ns.getPlayer().jobs[company])) {
                    status[company] = "Unqualified";
                    break;
                }
                if (doWork && !workingAt(ns, company)) {
                    ns.workForCompany(company, false);
                }
                if (workingAt(ns, company)) {
                    status[company] = "Working";
                }
                printStatus(ns);
                await ns.sleep(delay);
            }
            if (ns.getPlayer().jobs[company] == title) {
                status[company] = "Done";
            }
        }
        printStatus(ns);
        await ns.sleep(delay);
    }
}