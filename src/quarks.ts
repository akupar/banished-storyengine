import { toBinaryString } from './util';
import { STATELEN } from './constants';


/**
 * Represents Quark before it is interned to library.
 **/
export class NonInternedQuark {
    name: string;

    constructor(name: string) {
        this.name = name;
    }
};

/**
 * This is just a convinience function so we don't need to use new with NonInternedQuark.
 **/
export function quark(name: string) {
    return new NonInternedQuark(name);
};

export class Quark {
    name: string;
    _bitnum: number;
    _mask: bigint;

    constructor(quark: NonInternedQuark, bitnum: number) {
        this.name = quark.name;
        this._bitnum = bitnum;
        this._mask = 1n << BigInt(bitnum);
    }

    get bitnum() {
        return this._bitnum;
    }

    test(state: bigint) {
        return !!(state & this._mask);
    }
};

export class Library {
    quarksByNumber: Quark[];
    quarksByName: Map<string, Quark>;

    constructor(items: NonInternedQuark[]) {
        this.quarksByNumber = new Array(items.length);
        this.quarksByName = new Map();

        for ( const [i, item] of items.entries() ) {
            if ( this.quarksByName.has(item.name) ) {
                throw new Error(`Multiple quarks of the same name: ${item.name}`);
            }
            const quark = new Quark(item, i);
            this.quarksByNumber[i] = quark
            this.quarksByName.set(item.name, quark);
        }
    }

    get length() {
        return this.quarksByNumber.length;
    }

    nameState(state: bigint) {
        return this.quarksByNumber
                   .filter(quark => quark.test(state))
                   .map(quark => quark.name);
    }

    nameMolecule(molecule: Molecule) {
        const str = molecule.toString();
        const out = new Array(str.length);
        for ( let i = str.length - 1; i > -1; i-- ) {
            const number = str.length - 1 - i;
            const quark = this.quarksByNumber[number];
            if ( !quark ) {
                continue;
            }
            if ( str[i] === '?' ) {
                out[i] = `?${quark.name}`;
            } else if ( str[i] === '0' ) {
                out[i] = `-${quark.name}`;
            } else  {
                out[i] = `${quark.name}`;
            }
        }

        return JSON.stringify(out);
    }

    getQuark(name: string) {
        return this.quarksByName.get(name);
    }

    getAtomNumberFor(state: string[]) {
        let number = 0n;
        for ( let name of state ) {
            if ( name.startsWith('?') ) {
                name = name.substring(1);
            }
            const quark = this.quarksByName.get(name);
            if ( quark === undefined ) {
                throw new Error(`No such quark: ${name}`);
            }
            number |= quark._mask;
        }

        return number;
    }

    getMoleculeFor(positiveSet: string[], negativeSet: string[]) {
        const positiveNumber = this.getAtomNumberFor(positiveSet.map(q => q.startsWith('?') ? q.substring(1) : q));
        const negativeNumber = this.getAtomNumberFor(negativeSet.map(q => q.startsWith('?') ? q.substring(1) : q));

        const positiveMandatory = this.getAtomNumberFor(removeOptional(positiveSet));
        const negativeMandatory = this.getAtomNumberFor(removeOptional(negativeSet));

        return new Molecule(positiveNumber, negativeNumber, positiveMandatory | negativeMandatory);
    }
};

const removeOptional = (transition: string[]) =>
    transition.filter(tidbit => !tidbit.startsWith('?'));



export class Molecule {
    stateSet: bigint;
    stateNonset: bigint;
    mask: bigint;

    constructor(stateSet: bigint, stateNonset: bigint, mask?: bigint) {
        if ( stateSet & stateNonset ) {
            throw new Error("Set and unset overlap");
        }
        this.stateSet = stateSet;
        this.stateNonset = stateNonset;
        this.mask = mask ?? (stateSet | stateNonset);
    }

    toString() {
        const mask = this.mask.toString(2);
        const w = Math.max(mask.length, STATELEN);
        const s = toBinaryString(this.stateSet, w);
        const u = toBinaryString(this.stateNonset, w);
        const m = toBinaryString(this.mask, w);

        const str = new Array(w);
        for ( let i = 0; i < w; i++ ) {
            if ( s[i] === '1' && m[i] === '1' ) {
                str[i] = '1';
            } else if ( u[i] === '0' && m[i] === '1' ) {
                str[i] = '0';
            } else {
                str[i] = '?';
            }
        }
        return str.join('');
    }

    equals(other: Molecule) {
        return this.mask === other.mask && this.stateSet === other.stateSet && this.stateNonset === other.stateNonset;
    }

    test(state: bigint) {
        //console.error("this:", this.toString(), "state", toBinaryString(state, STATELEN));
        if ( this.mask === 0n ) {
            return true;
        }

        return !!((this.mask & state) === this.stateSet);
    }

    applyToState(state: bigint): bigint {
        return state & ~this.stateNonset | this.stateSet ;
    }

    overlapsWith(other: Molecule): boolean {
        if ( (this.stateSet & other.stateSet) !== 0n
          || (this.stateNonset & other.stateNonset) !== 0n ) {
            return true;
        }

        return false;
    }

    getUnion(other: Molecule): Molecule {
        return new Molecule(this.stateSet | other.stateSet, this.stateNonset | other.stateNonset);
    }

    getIntersection(other: Molecule): Molecule {
        return new Molecule(this.stateSet & other.stateSet, this.stateNonset & other.stateNonset);
    }

    getInverse(): Molecule {
        return new Molecule(this.stateNonset, this.stateSet);
    }

    getOppositesRemoved(other: Molecule): Molecule {
        return new Molecule(this.stateSet ^ (this.stateSet & other.stateNonset), this.stateNonset ^ (this.stateNonset & other.stateSet));
    }

    removeBits(bits: bigint) {
        this.stateSet ^= bits;
        this.stateNonset ^= bits;
    }

    withoutBits(bits: bigint) {
        return new Molecule(this.stateSet ^ (bits & this.stateSet), this.stateNonset ^ (bits & this.stateNonset));
    }
};
