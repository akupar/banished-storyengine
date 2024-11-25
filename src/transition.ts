import { type Molecule } from './quarks';
import { countSetBits } from './countbits';
import { toBinaryString, cyrb53 } from './util';
import { STATELEN } from './constants';
import { ActionsRecord } from './types';


function getColor(id: number) {
    return id.toString(16).substring(0, 6);
}

let colorId = 0;

export class Transition {
    name: string;
    given: Molecule;
    actions: ActionsRecord | undefined;
    fieldsToSet: Molecule;
    fieldsToSetWithoutIgnored: Molecule;
    colorId: number;
    maskBits: number;

    constructor(name: string, given: Molecule, actions: ActionsRecord, fieldsToSet: Molecule, fieldsToSetWithoutIgnored: Molecule) {
        this.name = name;
        this.given = given;
        this.actions = actions;
        this.fieldsToSet = fieldsToSet;
        this.fieldsToSetWithoutIgnored = fieldsToSetWithoutIgnored;
        this.colorId = colorId++;

        if ( this.given.overlapsWith(fieldsToSet) ) {
            throw new Error(`Entry transition and fieldsToSet overlap: ${this.given}, ${fieldsToSet}`);
        }

        this.maskBits = countSetBits(this.given.stateSet);
    }

    get id() {
        return this.colorId;
    }


    get color() {
        return '#' + getColor(cyrb53(`${this.actions?.say ?? ""} ${this.colorId}`));
    }

    get givenMask() {
        return this.given.mask;
    }

    matches(state: bigint) {
        return this.given.test(state);
    }

    apply(state: bigint) {
        return this.fieldsToSet.applyToState(state);
    }


};



export class TransitionStore {
    name: string;
    transitions: Transition[];
    commonFieldsToSet: Molecule;

    constructor(name: string, transitions: Transition[]) {
        this.name = name;
        this.transitions = transitions;
        let common = transitions[0].fieldsToSetWithoutIgnored;
        for ( const other of transitions.slice(1) ) {
            common = common.getIntersection(other.fieldsToSet);
        }
        this.commonFieldsToSet = common;
    }

    get size() {
        return this.transitions.length;
    }

    getAllMatching(state: bigint): Transition[] {
        const found = [];

        for ( let transition of this.transitions ) {
            if ( transition.matches(state) ) {
                found.push(transition);
            }
        }

        return found;
    }

    getMatch(state: bigint) {
        const matches = this.getAllMatching(state)
                            .sort((a, b) => b.maskBits - a.maskBits);
        console.error("matches:", matches);
        if ( matches.length > 1 ) {
            //console.log("had many matches");
            //console.log(matches);
        }
        if ( matches.length > 1 && matches[1].maskBits === matches[0].maskBits ) {
            throw new Error(`Too many matches: ${matches}`);
        }

        /* if ( matches.length === 0 ) {
         *     throw new Error("No matches");
         * }
         */
        return matches.length > 0 ? matches[0] : null;
    }

    addTransitions(transitions: Transition[]) {
        for ( const transition of transitions ) {

        }
    }

};

export class TransitionLib {
    entriesByName = new Map();

    constructor() {

    }

    add(name: string, store: TransitionStore) {
        this.entriesByName.set(name, store);
    }

    getGroup(name: string) {
        return this.entriesByName.get(name);
    }

    getTransition(name: string, state: bigint) {
        const store = this.entriesByName.get(name);
        if ( !store ) {
            throw new Error(`No such action: ${name}`);
        }
        return store.getMatch(state);
    }

    getAllTransitions(name: string, state: bigint) {
        const store = this.entriesByName.get(name);
        if ( !store ) {
            throw new Error(`No such action: ${name}`);
        }
        return store.getAllMatching(state);
    }

    createOrUpdate(name: string, transitions: Transition[]) {
        const transitionStore = this.getGroup(name);
        if ( transitionStore ) {
            transitions = [...transitionStore.transitions, ...transitions];
        }
        const newStore = new TransitionStore(name, transitions);
        this.entriesByName.set(name, newStore);
    }

};

export default TransitionLib;
