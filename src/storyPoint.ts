import { Molecule } from './quarks';
import type { Transition, TransitionLib } from './transition';
import { countSetBits } from './countbits';
import { toBinaryString, cyrb53 } from './util';
import { ActionsRecord } from './types';


export class Choice {
    name: string;
    given: Molecule | null;

    constructor(name: string, given: Molecule | null) {
        this.name = name;
        this.given = given;
    }
};

export class StoryPoint {
    id: string;
    entry: Molecule;
    data: ActionsRecord | undefined;
    choices: Map<string, Choice>;
    choiceNames: string[];
    maskBits: number;

    constructor(id: string, entry: Molecule, data: ActionsRecord | undefined, choices: Map<string, Choice>) {
        this.id = id;
        this.entry = entry;
        this.data = data;
        this.choiceNames = Array.from(choices.keys());
        this.choices = choices;

        this.maskBits = countSetBits(this.entry.mask);
    }

    get hash() {
        return cyrb53(this.data?.say ?? "");
    }

    get entryMask() {
        return this.entry.mask;
    }

    matches(state: bigint) {
        return this.entry.test(state);
    }

    applyChoice(state: bigint, choice: Transition) {
        return choice.fieldsToSet.applyToState(state);
    }

    getUnion(other: StoryPoint) {
        if ( this.data !== undefined && other.data !== undefined ) {
            throw new Error(`Both story points contain data: ${this.id} and ${other.id}`);
        }

        const choiceNames = [];
        const choices = new Map<string, Choice>();
        for ( const item of this.choiceNames ) {
            const choice = this.choices.get(item);
            if ( !choice ) {
                continue;
            }
            choiceNames.push(item);
            choices.set(item, choice);
        }


        for ( const item of other.choiceNames ) {
            if ( !choiceNames.includes(item) ) {
                const choice = other.choices.get(item);
                if ( !choice ) {
                    continue;
                }
                choiceNames.push(item);
                choices.set(item, choice);
            }
        }

        return new StoryPoint(
            `${this.id}+${other.id}`,
            this.entry.getUnion(other.entry),
            this.data ?? other.data,
            choices
        );
    }

    filterChoices(state: bigint) {
        const choiceNames = [];
        for ( const choiceName of this.choiceNames ) {
            const choice = this.choices.get(choiceName);
            if ( choice && (!choice.given || choice.given.test(state)) ) {
                choiceNames.push(choiceName);
            }
        }

        return choiceNames;
    }

    toString() {
        return `StoryPoint { data: ${JSON.stringify(this.data)} }`;
    }
};

function compareBigInt(a: bigint, b: bigint) {
    if ( a > b ) {
        return 1;
    } else if ( a < b ){
        return -1;
    } else {
        return 0;
    }
}


export class StoryPointStore {
    storyPoints: StoryPoint[];

    constructor(storyPoints: StoryPoint[]) {
        this.storyPoints = storyPoints;
        //console.log(this.storyPoints);
    }

    get size() {
        return this.storyPoints.length;
    }

    getAllMatching(state: bigint): StoryPoint[] {
        const found = [];

        for ( let storyPoint of this.storyPoints ) {
            if ( storyPoint.matches(state) ) {
                found.push(storyPoint);
            }
        }

        return found;
    }

    getMatch(state: bigint) {
        const matches = this.getAllMatching(state)
                            .sort((a, b) => b.maskBits - a.maskBits);
        if ( matches.length > 1 ) {
            //console.log("had many matches");
            //console.log(matches);
        }
        if ( matches.length > 1 /*&& matches[1].maskBits === matches[0].maskBits*/ ) {
            throw new Error("Too many matches");
        }

        /* if ( matches.length === 0 ) {
         *     throw new Error("No matches");
         * }
         */
        return matches.length > 0 ? matches[0] : null;
    }

    getCombinationMatch(state: bigint): StoryPoint {
        const storyPoints = this.getAllMatching(state);
        let storyPoint = storyPoints[0];
        console.error("Combining:", storyPoints);
        for ( const other of storyPoints.slice(1) ) {
            storyPoint = storyPoint.getUnion(other);
        }
        return storyPoint;
    }

};
