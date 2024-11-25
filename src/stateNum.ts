const countSetBits = (n: bigint): number => {
    let count = 0;

    while (n) {
        count += Number(n & 1n);
        n >>= 1n;
    }

    return count;
}

type SetUnset = { set: bigint, unset: bigint };
type PN = { p: bigint, n: bigint };


// orig   0000010001000100
// set    0000000000000110
// add    0000010001000110
const add = (stateNum: bigint, { set: setNum, unset: unsetNum }: SetUnset) => {
    if ( unsetNum ) {
        throw new Error("Can't use unset here");
    }
    return (stateNum | setNum);
};

// orig   0000010001000100
// unset  0000000011000000
// rem    0000010010000100
const remove = (stateNum: bigint, { set: setNum, unset: unsetNum }: SetUnset) => {
    if ( setNum ) {
        throw new Error("Can't use set here");
    }
    return (stateNum & ~unsetNum);
};

// orig   0000010001000100
// set    0001000000000110
// unset  0001000011000000
// addrem 0000010000000110
const addAndRemove = (stateNum: bigint, { set: setNum, unset: unsetNum }: SetUnset) => {
    if ( (setNum & unsetNum) > 0 ) {
        throw new Error("Can't have common elements in add set and remove set!");
    }

    return (stateNum | setNum) & ~unsetNum;
};

/**
 * Returns true if `stateNum` contains all the elements of `setNum`.
 **/
const hasAll = (stateNum: bigint, setNum: bigint) => {
    return (stateNum & setNum) === setNum;
}

/**
 * Returns true if `stateNum` does not contain any of the elements of `unsetNum`.
 **/
const hasNot = (stateNum: bigint, unsetNum: bigint) => {
    return (stateNum & unsetNum) === 0n;
}

/**
 * Returns true if `stateNum` contains all the elements of `setNum` and if `stateNum` does not contain any of the elements of `unsetNum`.
 **/
const matches = (stateNum: bigint, { p: setNum, n: unsetNum }: PN) => {
    if ( (setNum & unsetNum) > 0 ) {
        throw new Error("Can't have common elements in positive set and negative set!");
    }
    return (stateNum & setNum) === setNum && (stateNum & unsetNum) === 0n;
}


/**
 *
 **/
const countAdditions = (stateNum: bigint, setNum: bigint) => {
    return countSetBits((stateNum ^ setNum) & setNum);
};

/**
 *
 **/
const countRemovals = (stateNum: bigint, unsetNum: bigint) => {
    return countSetBits(stateNum & unsetNum);
};

const countChanges = (stateNum: bigint, { set: setNum, unset: unsetNum }: SetUnset) => {
    if ( (setNum & unsetNum) > 0 ) {
        throw new Error("Can't have common elements in positive set and negative set!");
    }

    return ((stateNum ^ setNum) & setNum) | (stateNum & unsetNum)
};






const fmt = (val: bigint) => {
    const str = val.toString(2);
    const len = str.length;

    console.assert(len <= 16, "Liian pitkä");

    return ('0'.repeat(16 - len)) + str;
};


const stateNumberToAtomList = (stateNumber: bigint, atomPool: Map<string, bigint>) => {
    const out = [];

    console.log("STATE:", stateNumber, stateNumber.toString(2));
    for ( const atomStr of atomPool.keys() ) {
        const exponent = atomPool.get(atomStr);
        if ( !exponent ) {
            throw new Error(`No such atom: ${atomStr}`);
        }

        const atomNumber = exponent ** 2n;

        if ( stateNumber & atomNumber ) {
            console.log("atomStr -> ", atomNumber.toString(2), (stateNumber & atomNumber).toString(2));
            out.push(JSON.parse(atomStr));
        }
    }

    return out.sort();
}




const orig  = 0b000010001000110n
const set   = 0b001000000000110n
const unset = 0b000000011000000n
const exitp = 0b000000000000110n
const exitn = 0b000001000100000n
console.log("orig  ", fmt(orig));
console.log("set   ", fmt(set));
//console.log("exitp ", fmt(exitp));
//console.log("exitn ", fmt(exitn));
console.log("unset ", fmt(unset));

//console.log("add   ", fmt(add(orig, { set })))
//console.log("rem   ", fmt(remove(orig, { unset })));;
//console.log("addrem", fmt(addAndRemove(orig, { set, unset })));

//console.log("tmp   ", fmt(orig & exitp));
//console.log("hasall", hasAll(orig, exitp));
//console.log("hasnot", hasNot(orig, exitn));
//console.log("match   ", matches(orig, { set: exitp, unset: exitn }));

//console.log("ch+   ", countAdditions(orig, set));
//console.log("ch–   ", countRemovals(orig, unset));
console.log("ch–   ", fmt(countChanges(orig, { set, unset })));


export default {
    addAndRemove,
    matches,
    countSetBits,
    countChanges,
    stateNumberToAtomList
};
