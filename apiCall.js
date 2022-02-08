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
        type: "Spiralize Matrix",
        data: [[1]],
    }
    // const payload = {"type":"Spiralize Matrix","data":[[25,20,37,41,49,40,44,42],[41,34,9,33,19,17,50,14],[40,9,39,44,15,33,18,21],[24,34,35,50,21,29,5,12],[46,4,7,20,29,18,11,39],[18,49,24,2,36,40,32,36],[23,38,31,16,9,45,21,31],[36,12,39,44,15,29,13,34],[30,6,19,45,33,4,37,26],[12,24,22,31,45,10,13,25],[49,30,50,39,25,42,44,4],[11,7,30,15,37,8,41,10]]};
    const response = await call(ns, "contract", payload);
    ns.tprint(JSON.stringify(response, null, 2));
}