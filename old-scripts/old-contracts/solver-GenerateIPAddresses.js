/** @param {NS} ns **/

function isValid(segment) {
  if (segment.length == 0) {
    return false;
  }
  if (segment[0] == "0" && segment.length > 1) {
    return false;
  }
  if (Number(segment) > 255) {
    return false;
  }
  return true;
}

async function splitInto(ns, parts, input) {
  if (parts == 0) {
    return [];
  }
  if (parts == 1) {
    if (isValid(input)) {
      return [input];
    } else {
      return [];
    }
  }
  if (input.length < parts) {
    return [];
  }
  let splits = [];
  for (let headDigits = 1; headDigits <= 3; headDigits++) {
    let head = input.slice(null, headDigits);
    let tail = input.slice(headDigits);
    if (!isValid(head)) {
      break;
    }
    for (let split of await splitInto(ns, parts-1, tail)) {
      splits.push([head].concat(split));
    }
  }
  return splits;
}

export async function solve(ns, input) {
  return (await splitInto(ns, 4, input)).map((a) => a.join("."));
}

export async function main(ns) {
  const data = "0187142151";
  ns.tprint(data);
  ns.tprint(await solve(ns, data));
}