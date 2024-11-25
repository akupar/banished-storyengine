export type StoryPointRecord = {
    given: string[];
    actions?: {
        say: string;
    };
    choices: ChoiceRecord[];
};

export type ChoiceRecord = {
    name: string;
    given?: string[];
    set: string[];
    say?: string;
    reward?: number;
    variants?: VariantRecord[];
};

export type VariantRecord = {
    given: string[];
    say?: string;
};

export type EnrichedVariantRecord = {
    name: string;
    given: string[];
    say?: string;
    reward?: number;
    set: string[];
};

export type ActionsRecord = {
    say?: string;
    reward?: number;
}
