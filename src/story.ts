import { Molecule, Library, quark, type NonInternedQuark } from './quarks';
import { StoryPoint, StoryPointStore, Choice } from './storyPoint';
import { Transition, TransitionStore, TransitionLib } from './transition';
import { destructureTidbitArray } from './util';
import { StoryPointRecord, ChoiceRecord, VariantRecord, EnrichedVariantRecord, ActionsRecord } from './types';
// @ts-ignore
import storyData from './data/story.json' with { type: 'json' };


function getMolecule(cond: string[]) {
    const { positive, negative, ignored } = destructureTidbitArray(cond);
    return library.getMoleculeFor([...positive, ...ignored], negative);
}

function getMoleculeWithoutIgnored(cond: string[]) {
    const { positive, negative, ignored } = destructureTidbitArray(cond);
    return library.getMoleculeFor(positive, negative);
}


/**
 * Finds and returns all the tidbits in the story.
 **/
const extractTidbits = (data: StoryPointRecord[]) => {
    const seen = new Set<string>();
    const quarks: NonInternedQuark[] = [];

    const addTidbits = (condition: string[]) => {
        const { positive, negative, ignored } = destructureTidbitArray(condition);
        for ( let q of [...positive, ...negative, ...ignored] ) {
            if ( !seen.has(q) ) {
                quarks.push(quark(q));
                seen.add(q);
            }
        }
    };

    for ( const entry of data as StoryPointRecord[] ) {
        addTidbits(entry.given);

        for ( const choice of entry.choices ) {
            if ( choice.set ) {
                addTidbits(choice.set);
            }
            if ( choice.given ) {
                addTidbits(choice.given);
            }
        }
    }

    return quarks;
}


function handleChoices(entryCondition: Molecule, choiceRecords: ChoiceRecord[], ignoredMask: bigint): Map<string, Choice> {
    const choices = new Map<string, Choice>();
    for ( const choiceRecord of choiceRecords ) {
        const choiceName = choiceRecord.name;
        const choiceCondition = choiceRecord.given ? getMoleculeWithoutIgnored(choiceRecord.given) : null;
        choices.set(choiceName, new Choice(choiceName, choiceCondition));
        //console.log("created choice:", choices.get(choiceName));
        const variants = prepareVariants(choiceRecord);

        const transitions = [];
        for ( const variant of variants ) {
            const variantCondition = getMolecule(variant.given);
            const variantEntryCondition = variantCondition.getUnion(entryCondition);
            const fieldsToSet = getMolecule(variant.set);
            let fieldsToSetWithoutIgnored = fieldsToSet.withoutBits(ignoredMask);

            // If the choice is conditional, mark opposites of the condition and values to set as ignored from the entry.
            // For example. If entry.given is [] and a choice has given [-foundCat] and set [foundCat], -foundCat is not
            // included in the entry condition as it normally would be.
            if ( choiceCondition ) {
                fieldsToSetWithoutIgnored = fieldsToSetWithoutIgnored.getOppositesRemoved(choiceCondition);
            }

            const actions: ActionsRecord = {
                say: variant.say,
                reward: variant.reward,
            };

            const transition = new Transition(choiceName, variantEntryCondition, actions, fieldsToSet, fieldsToSetWithoutIgnored);
            //console.log(choiceName, transition);
            transitions.push(transition);
        }

        transitionLib.createOrUpdate(choiceName, transitions);
    }

    return choices;
}

/**
 * Returns a list of one variants if there are no variants in the record, otherwise returns variants.
 **/
function prepareVariants(choice: ChoiceRecord): EnrichedVariantRecord[] {
    if ( choice.variants ) {
        return choice.variants.map(variant => ({
            ...variant,
            name: choice.name,
            set: choice.set
        }));
    } else {
        return [
            {
                name: choice.name,
                given: choice.given ?? [],
                say: choice.say,
                reward: choice.reward,
                set: choice.set
            }
        ];
    }
}

function extractStoryPoints(data: StoryPointRecord[]) {
    const storyPoints = [];

    for ( const entry of data ) {
        const { positive, negative, ignored } = destructureTidbitArray(entry.given);
        const ignoredMask = library.getAtomNumberFor(ignored);
        let matcher = library.getMoleculeFor(positive, negative);
        const choices = handleChoices(matcher, entry.choices ?? [], ignoredMask);

        for ( const choiceName of choices.keys() ) {
            const transitionGroup = transitionLib.getGroup(choiceName);
            matcher = matcher.getUnion(transitionGroup.commonFieldsToSet.getInverse());
        }

        const storyPoint = new StoryPoint(
            entry.given.length === 0 ? "Ø" : entry.given.join("|"),
            matcher,
            entry.actions,
            choices
        );
        storyPoints.push(storyPoint);
    }

    return storyPoints;
}

const tidbits = extractTidbits(storyData);


console.log("TIDBITS:", tidbits);

const library = new Library(tidbits);
const transitionLib = new TransitionLib();

const storyPoints = extractStoryPoints(storyData);

const storyPointStore = new StoryPointStore(storyPoints);

export { storyPointStore, library, transitionLib };
