/** @param {NS} ns **/

const defaultSettings = {
    joiner: " | ",
    hrChar: "-",
    hrJoiner: "-+-",
};

function rectifyRow(ns, row, widths, joiner) {
    const cells = [];
    for (let col = 0; col < widths.length; col++) {
        cells.push(ns.sprintf(`%${widths[col]}s`, (row[col] || "").toString()));
    }
    return " " + cells.join(joiner) + " ";
}

function horizontalRule(ns, widths, hrChar, hrJoiner) {
    const cells = [];
    for (let col of widths) {
        cells.push(hrChar.repeat(col));
    }
    return hrChar + cells.join(hrJoiner) + hrChar;
}

const widthMemory = {};
export function makeTable(ns, data, labels = [], settings = {}, id = null) {
    const { joiner, hrChar, hrJoiner } = { ...defaultSettings, ...settings };
    const lines = [];
    const widths = [];
    for (let row = 0; row < data.length; row++) {
        for (let col = 0; col < data[row].length; col++) {
            data[row][col] = data[row][col].toString();
            widths[col] = Math.max(widths[col] || 0, (labels[col] || "").length, data[row][col].length);
        }
    }
    if (id) {
        if (widthMemory[id]) {
            for (let i = 0; i < widths.length; i++) {
                widths[i] = Math.max(widths[i], widthMemory[id][i]);
            }
        }
        widthMemory[id] = widths.slice();
    }
    if (labels) {
        lines.push(rectifyRow(ns, labels, widths, joiner));
        lines.push(horizontalRule(ns, widths, hrChar, hrJoiner));
    }
    for (let row of data) {
        lines.push(rectifyRow(ns, row, widths, joiner));
    }
    return lines.join("\n");
}

export async function main(ns) {
    ns.tprintf(makeTable(ns, [[10, 200, 3, 4, 5], [1, 2, 3, 4.5]], ["D", "E", "FF"]));
}