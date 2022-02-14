/** @param {NS} ns **/
// ^-- this comment is what makes the fancy tooltips work

export async function main(ns) {
    // your code will start running here
    // ns is an object with netscript functions in it
    ns.print("Hello, world!");
    // the full list is here: https://github.com/danielyxie/bitburner/blob/dev/markdown/bitburner.ns.md

    // v-- you can usually declare variables with "const" followed by the name and a starting value
    const myList = ["square", "brackets", "are", 4, "lists", "(and indexes, like [0] and [1] below)"];
    // myList[0] == "square"
    // myList[1] == "brackets"

    const myObj = {
        curly: "braces",
        are: 4,
        objects: "and blocks! like functions and loops",
        aList: ["values", "can", "be", "lists"],
        "keys can be long": true,
    }
    // myObject.curly == "braces"
    // myObject.are == 4
    // myObject["keys can be long"] == true
    // (there's those square brackets being indexes again!)
    // myObject["curly"] == myObject.curly
    // those two are equivalent, use whichever is convenient

    // v-- if you're going to re-assign the variable later, use "let"
    let myVar = "something I'm going to change later";
    myVar = theSameThingTwice(myVar);
    // myVar == "something I'm going to change latersomething I'm going to change later"
    // (the definition of theSameThingTwice is at the bottom of the file)

    for (let animal of ["cat", "dog", "rabbit"]) {
        // the first time this loop runs, animal == "cat"
        // then "dog" then "rabbit", then we continue ...
        ns.tprint(animal + "s are cute");
    }
    // ... from here

    while ("cat".length == 3) {
        // always sleep in infinite loops!
        await ns.sleep(10000);

        if (itIsTimeToStopLooping) {
            break;
        }
    }

    // some ns functions require "await" before them. common examples:
    await ns.sleep(10);
    await ns.hack();
    await ns.grow();
    await ns.weaken();
    // if the docs say a function returns "Promise<something>", you need to await it
    // (if you forget you'll usually get a helpful error message though)
}

// it doesn't matter what order functions go in
// organize your files however makes it easiest for you to find things
function theSameThingTwice(someString) {
    // whatever argument we get, we'll call it "someString" while we're in this function
    // js strings have a function called "repeat".
    // "a".repeat(10) == "aaaaaaaaaa"
    return someString.repeat(2);
}

// I learned most of the not-bitburner parts of this from Mozilla's great docs:
// https://developer.mozilla.org/en-US/docs/Web/javascript
// (I haven't been through their tutorials but use their reference pages all the time)