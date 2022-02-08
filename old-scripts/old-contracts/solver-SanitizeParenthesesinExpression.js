/** @param {NS} ns **/

function isValid(parens) {
  let sum = 0;
  for (let i = 0; i < parens.length; i++) {
    if (parens[i] == "(") {
      sum += 1;
    } else if (parens[i] == ")") {
      sum -= 1;
    }
    if (sum < 0) {
      return false;
    }
  }
  if (sum == 0) {
    return true;
  } else {
    return false;
  }
}

function unique(string, index, array) {
	return array.indexOf(string) == index;
}

function findAll(character, string) {
  const indices = [];
  for (let i = 0; i < string.length; i++) {
    if (string[i] == character) {
      indices.push(i);
    }
  }
  return indices;
}

function chooseN(ns, n, list, nest = 0) {
  const indent = "  ".repeat(nest);
  if (n == 0) {
    return [{}];
  }
  const combinations = [];
  // ns.tprint(indent, n, list);
  for (let i = 0; i < list.length - n + 1; i++) {
    for (let subcombo of chooseN(ns, n - 1, list.slice(i + 1), nest + 1)) {
      subcombo[list[i]] = true;
      combinations.push(subcombo);
    }
  }
  return combinations;
}

export async function solve(ns, parens) {
  const parenIndices = {
    "(": findAll("(", parens),
    ")": findAll(")", parens)
  }
  const opens = parenIndices["("].length;
  const closes = parenIndices[")"].length;
  let toRemove;
  let howMany;
  if (opens == closes) {
    if (isValid(parens)) {
      return [parens];
    } else {
      return [""];
    }
  } else if (opens > closes) {
    toRemove = "(";
    howMany = opens - closes;
  } else {
    toRemove = ")";
    howMany = closes - opens;
  }
  // ns.tprint(`${opens} open, ${closes} close`);
  // ns.tprint(`Need to remove ${howMany} '${toRemove}'s`);
  const combos = chooseN(ns, howMany, parenIndices[toRemove]);
  const modifiedParens = combos.map((indexDict) => {
    let modified = "";
    for (let i = 0; i < parens.length; i++) {
      if (!indexDict[i]) {
        modified += parens[i];
      }
    }
    return modified;
  });
  return(modifiedParens.filter(isValid).filter(unique));
}

export async function main(ns) {
  const data = "())(a(a)))(())())))(";
  ns.tprint(data);
  ns.tprint(await solve(ns, data));
}