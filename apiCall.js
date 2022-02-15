/** @param {NS} ns **/

function buildRequestUri(endpoint, payload) {
    const baseUri="https://bitburner-api.finn.fun/";
    return baseUri + endpoint + "?payload=" + encodeURI(JSON.stringify(payload));
}

export async function call(ns, endpoint, payload) {
    const tmpFile = `/tmp/apiResponse-${Date.now()+Math.random()}.txt`;
    const requestUri = buildRequestUri(endpoint, payload);
    let rawResponse;
    let parsed;
    if (await ns.wget(requestUri, tmpFile)) {
        rawResponse = ns.read(tmpFile);
        ns.rm(tmpFile);
        parsed = rawResponse ? JSON.parse(rawResponse) : {};
    }
    return {requestUri, payload, rawResponse, response: parsed};
}

export async function main(ns) {
    const payload = {
        type: "Subarray with Maximum Sum",
        data: [5,10,5,-7,0,2,10,3,5,2,1,-1,4,8,0,-2,1,0,-2,6,-7,-7,-9,-5,7,7,4,-6,7,8,5,-1,-2,6],
    }
    const response = await call(ns, "contract", payload);
    ns.tprint(JSON.stringify(response, null, 2));
}