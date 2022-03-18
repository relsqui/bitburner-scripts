/** @param {NS} ns **/

function parse_args(ns) {
    const cli = ns.flags([
        ["r", false]
    ]);
    ns.tprint(JSON.stringify(cli));
    if (cli._.length < 2) {
        throw new Error("You must specify at least one source and a destination.");
    }
    let dest = cli._.pop();
    if (dest.endsWith("/")) {
        dest = dest.slice(0, dest.length - 1);
    }
    const sources = cli._;
    return { dest, sources, recurse: cli.r };
}

function isDirectory(ns, path) {
    // we're defining "directory" here as the
    // beginning of another file's path
    return dirContents(ns, path).length > 0;
}

function dirContents(ns, path) {
    const host = ns.getHostname();
    if (ns.fileExists(path, host)) {
        // is a file, can't be a directory
        ns.tprint(`${path} is a file`)
        return [];
    }
    const contents = [];
    for (let file of ns.ls(host, path)) {
        // TODO: concept of cwd
        if (file.startsWith(`/${path}/`)) {
            ns.tprint(`${file} starts with ${path}`);
            contents.push(file);
        } else {
            ns.tprint(`${file} doesn't start with ${path}`);
        }
    }
    return contents;
}

function normalize(ns, { sources, dest, recurse }) {
    if (!isDirectory(ns, dest)) {
        if (sources.length > 1) {
            throw new Error(`More than one source, but '${dest}'' is not a directory.`);
        }
        return [[sources[0], dest]];
    }

    const pairs = [];
    for (let source of sources) {
        if (isDirectory(ns, source)) {
            if (!recurse) {
                throw new Error(`'${source}' is a directory, but --r not specified.`);
            }
            sources.push(...dirContents(ns, source));
        } else {
            pairs.push([source, `${dest}/${source}`]);
        }
    }
    return pairs;
}

export async function main(ns) {
    const host = ns.getHostname();
    const args = parse_args(ns);
    const filePairs = normalize(ns, args);
    for (let [ source, dest ] of filePairs) {
        ns.tprintf(`${source} -> ${dest}`);
    }
}