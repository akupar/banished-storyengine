import { storyPointStore, library, transitionLib } from './story';
import { StoryPoint } from './storyPoint';
import { toBinaryString, destructureTidbitArray } from './util';
import { STATELEN } from './constants';


export class StoryEngine {
    state = 0n;
    choiceNames: string[] = [];
    currentStoryPoint: StoryPoint | null = null;

    constructor() {
        this.reset();
    }

    reset() {
        this.setState(0n);
    }

    setState(state: bigint) {
        this.state = state;
        this.currentStoryPoint = storyPointStore.getCombinationMatch(state);
        if ( this.currentStoryPoint.data?.say ) {
            console.log(this.currentStoryPoint.data.say);
        }

        this.choiceNames = [];
        for ( let choiceName of this.currentStoryPoint.choiceNames ) {
            this.choiceNames.push(choiceName);
        }
    }


    select(selection: string) {
        if ( !this.currentStoryPoint ) {
            throw new Error(`StoryPoint not selected`);
        }
        if ( !this.choiceNames.includes(selection) ) {
            throw new Error(`No such choice: ${selection}`);
        }

        const choice = transitionLib.getTransition(selection, this.state);
        if ( !choice ) {
            throw new Error(`Couldn't find transition ${selection} from ${toBinaryString(this.state, STATELEN)} ${this.currentStoryPoint.toString()}`);
        }

        this.setState(this.currentStoryPoint.applyChoice(this.state, choice));

        return choice;
    }

    get current() {
        return this.currentStoryPoint;
    }

    hasTidbits(tidbits: string[]): boolean {
        const number = library.getAtomNumberFor(tidbits);
        return !!(this.state & number);
    }

    hasGiven(tidbits: string[]): boolean {
        const { positive, negative, ignored } = destructureTidbitArray(tidbits);
        const given = library.getMoleculeFor([...positive, ...ignored], negative);
        return given.test(this.state);
    }
};
