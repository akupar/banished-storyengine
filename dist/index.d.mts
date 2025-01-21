declare class Molecule {
    stateSet: bigint;
    stateNonset: bigint;
    mask: bigint;
    constructor(stateSet: bigint, stateNonset: bigint, mask?: bigint);
    toString(): string;
    equals(other: Molecule): boolean;
    test(state: bigint): boolean;
    applyToState(state: bigint): bigint;
    overlapsWith(other: Molecule): boolean;
    getUnion(other: Molecule): Molecule;
    getIntersection(other: Molecule): Molecule;
    getInverse(): Molecule;
    getOppositesRemoved(other: Molecule): Molecule;
    removeBits(bits: bigint): void;
    withoutBits(bits: bigint): Molecule;
}

type ActionsRecord = {
    say?: string;
    reward?: number;
};

declare class Transition {
    name: string;
    given: Molecule;
    actions: ActionsRecord | undefined;
    fieldsToSet: Molecule;
    fieldsToSetWithoutIgnored: Molecule;
    colorId: number;
    maskBits: number;
    constructor(name: string, given: Molecule, actions: ActionsRecord, fieldsToSet: Molecule, fieldsToSetWithoutIgnored: Molecule);
    get id(): number;
    get color(): string;
    get givenMask(): bigint;
    matches(state: bigint): boolean;
    apply(state: bigint): bigint;
}

declare class Choice {
    name: string;
    given: Molecule | null;
    constructor(name: string, given: Molecule | null);
}
declare class StoryPoint {
    id: string;
    entry: Molecule;
    data: ActionsRecord | undefined;
    choices: Map<string, Choice>;
    choiceNames: string[];
    maskBits: number;
    constructor(id: string, entry: Molecule, data: ActionsRecord | undefined, choices: Map<string, Choice>);
    get hash(): number;
    get entryMask(): bigint;
    matches(state: bigint): boolean;
    applyChoice(state: bigint, choice: Transition): bigint;
    getUnion(other: StoryPoint): StoryPoint;
    filterChoices(state: bigint): string[];
    toString(): string;
}

declare class StoryEngine {
    state: bigint;
    choiceNames: string[];
    currentStoryPoint: StoryPoint | null;
    constructor();
    reset(): void;
    setState(state: bigint): void;
    select(selection: string): any;
    get current(): StoryPoint | null;
    hasTidbits(tidbits: string[]): boolean;
    hasGiven(tidbits: string[]): boolean;
}

declare const engine: StoryEngine;

export { StoryPoint, Transition, engine as default };
