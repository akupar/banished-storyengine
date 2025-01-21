"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var src_exports = {};
__export(src_exports, {
  StoryPoint: () => StoryPoint,
  Transition: () => Transition,
  default: () => src_default
});
module.exports = __toCommonJS(src_exports);

// src/util.ts
function toBinaryString(number, width) {
  return number.toString(2).padStart(width, "0");
}
function cyrb53(str, seed = 0) {
  let h1 = 3735928559 ^ seed, h2 = 1103547991 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ h1 >>> 16, 2246822507);
  h1 ^= Math.imul(h2 ^ h2 >>> 13, 3266489909);
  h2 = Math.imul(h2 ^ h2 >>> 16, 2246822507);
  h2 ^= Math.imul(h1 ^ h1 >>> 13, 3266489909);
  return 4294967296 * (2097151 & h2) + (h1 >>> 0);
}
function destructureTidbitArray(condition) {
  const positive = [];
  const negative = [];
  const ignored = [];
  for (const tidbit of condition) {
    if (tidbit.startsWith("-")) {
      negative.push(tidbit.substring(1));
    } else if (tidbit.startsWith("?")) {
      ignored.push(tidbit.substring(1));
    } else {
      positive.push(tidbit);
    }
  }
  return {
    positive,
    negative,
    ignored
  };
}

// src/constants.ts
var STATELEN = 20;

// src/quarks.ts
var NonInternedQuark = class {
  constructor(name) {
    this.name = name;
  }
};
function quark(name) {
  return new NonInternedQuark(name);
}
var Quark = class {
  constructor(quark2, bitnum) {
    this.name = quark2.name;
    this._bitnum = bitnum;
    this._mask = 1n << BigInt(bitnum);
  }
  get bitnum() {
    return this._bitnum;
  }
  test(state) {
    return !!(state & this._mask);
  }
};
var Library = class {
  constructor(items) {
    this.quarksByNumber = new Array(items.length);
    this.quarksByName = /* @__PURE__ */ new Map();
    for (const [i, item] of items.entries()) {
      if (this.quarksByName.has(item.name)) {
        throw new Error(`Multiple quarks of the same name: ${item.name}`);
      }
      const quark2 = new Quark(item, i);
      this.quarksByNumber[i] = quark2;
      this.quarksByName.set(item.name, quark2);
    }
  }
  get length() {
    return this.quarksByNumber.length;
  }
  nameState(state) {
    return this.quarksByNumber.filter((quark2) => quark2.test(state)).map((quark2) => quark2.name);
  }
  nameMolecule(molecule) {
    const str = molecule.toString();
    const out = new Array(str.length);
    for (let i = str.length - 1; i > -1; i--) {
      const number = str.length - 1 - i;
      const quark2 = this.quarksByNumber[number];
      if (!quark2) {
        continue;
      }
      if (str[i] === "?") {
        out[i] = `?${quark2.name}`;
      } else if (str[i] === "0") {
        out[i] = `-${quark2.name}`;
      } else {
        out[i] = `${quark2.name}`;
      }
    }
    return JSON.stringify(out);
  }
  getQuark(name) {
    return this.quarksByName.get(name);
  }
  getAtomNumberFor(state) {
    let number = 0n;
    for (let name of state) {
      if (name.startsWith("?")) {
        name = name.substring(1);
      }
      const quark2 = this.quarksByName.get(name);
      if (quark2 === void 0) {
        throw new Error(`No such quark: ${name}`);
      }
      number |= quark2._mask;
    }
    return number;
  }
  getMoleculeFor(positiveSet, negativeSet) {
    const positiveNumber = this.getAtomNumberFor(positiveSet.map((q) => q.startsWith("?") ? q.substring(1) : q));
    const negativeNumber = this.getAtomNumberFor(negativeSet.map((q) => q.startsWith("?") ? q.substring(1) : q));
    const positiveMandatory = this.getAtomNumberFor(removeOptional(positiveSet));
    const negativeMandatory = this.getAtomNumberFor(removeOptional(negativeSet));
    return new Molecule(positiveNumber, negativeNumber, positiveMandatory | negativeMandatory);
  }
};
var removeOptional = (transition) => transition.filter((tidbit) => !tidbit.startsWith("?"));
var Molecule = class _Molecule {
  constructor(stateSet, stateNonset, mask) {
    if (stateSet & stateNonset) {
      throw new Error("Set and unset overlap");
    }
    this.stateSet = stateSet;
    this.stateNonset = stateNonset;
    this.mask = mask ?? stateSet | stateNonset;
  }
  toString() {
    const mask = this.mask.toString(2);
    const w = Math.max(mask.length, STATELEN);
    const s = toBinaryString(this.stateSet, w);
    const u = toBinaryString(this.stateNonset, w);
    const m = toBinaryString(this.mask, w);
    const str = new Array(w);
    for (let i = 0; i < w; i++) {
      if (s[i] === "1" && m[i] === "1") {
        str[i] = "1";
      } else if (u[i] === "0" && m[i] === "1") {
        str[i] = "0";
      } else {
        str[i] = "?";
      }
    }
    return str.join("");
  }
  equals(other) {
    return this.mask === other.mask && this.stateSet === other.stateSet && this.stateNonset === other.stateNonset;
  }
  test(state) {
    if (this.mask === 0n) {
      return true;
    }
    return !!((this.mask & state) === this.stateSet);
  }
  applyToState(state) {
    return state & ~this.stateNonset | this.stateSet;
  }
  overlapsWith(other) {
    if ((this.stateSet & other.stateSet) !== 0n || (this.stateNonset & other.stateNonset) !== 0n) {
      return true;
    }
    return false;
  }
  getUnion(other) {
    return new _Molecule(this.stateSet | other.stateSet, this.stateNonset | other.stateNonset);
  }
  getIntersection(other) {
    return new _Molecule(this.stateSet & other.stateSet, this.stateNonset & other.stateNonset);
  }
  getInverse() {
    return new _Molecule(this.stateNonset, this.stateSet);
  }
  getOppositesRemoved(other) {
    return new _Molecule(this.stateSet ^ this.stateSet & other.stateNonset, this.stateNonset ^ this.stateNonset & other.stateSet);
  }
  removeBits(bits) {
    this.stateSet ^= bits;
    this.stateNonset ^= bits;
  }
  withoutBits(bits) {
    return new _Molecule(this.stateSet ^ bits & this.stateSet, this.stateNonset ^ bits & this.stateNonset);
  }
};

// src/countbits.ts
var bitsSetTable256 = new Array(256);
((initialize) => {
  bitsSetTable256[0] = Number(0n);
  for (let i = 0; i < 256; i++) {
    bitsSetTable256[i] = (i & 1) + bitsSetTable256[i / 2];
  }
})();
function countSetBits(n) {
  let sum = 0;
  while (n > 0n) {
    const byte = Number(n & 0xffn);
    sum += bitsSetTable256[byte];
    n = n >> 8n;
  }
  return sum;
}

// src/storyPoint.ts
var Choice = class {
  constructor(name, given) {
    this.name = name;
    this.given = given;
  }
};
var StoryPoint = class _StoryPoint {
  constructor(id, entry, data, choices) {
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
  matches(state) {
    return this.entry.test(state);
  }
  applyChoice(state, choice) {
    return choice.fieldsToSet.applyToState(state);
  }
  getUnion(other) {
    if (this.data !== void 0 && other.data !== void 0) {
      throw new Error(`Both story points contain data: ${this.id} and ${other.id}`);
    }
    const choiceNames = [];
    const choices = /* @__PURE__ */ new Map();
    for (const item of this.choiceNames) {
      const choice = this.choices.get(item);
      if (!choice) {
        continue;
      }
      choiceNames.push(item);
      choices.set(item, choice);
    }
    for (const item of other.choiceNames) {
      if (!choiceNames.includes(item)) {
        const choice = other.choices.get(item);
        if (!choice) {
          continue;
        }
        choiceNames.push(item);
        choices.set(item, choice);
      }
    }
    return new _StoryPoint(
      `${this.id}+${other.id}`,
      this.entry.getUnion(other.entry),
      this.data ?? other.data,
      choices
    );
  }
  filterChoices(state) {
    const choiceNames = [];
    for (const choiceName of this.choiceNames) {
      const choice = this.choices.get(choiceName);
      if (choice && (!choice.given || choice.given.test(state))) {
        choiceNames.push(choiceName);
      }
    }
    return choiceNames;
  }
  toString() {
    return `StoryPoint { data: ${JSON.stringify(this.data)} }`;
  }
};
var StoryPointStore = class {
  constructor(storyPoints2) {
    this.storyPoints = storyPoints2;
  }
  get size() {
    return this.storyPoints.length;
  }
  getAllMatching(state) {
    const found = [];
    for (let storyPoint of this.storyPoints) {
      if (storyPoint.matches(state)) {
        found.push(storyPoint);
      }
    }
    return found;
  }
  getMatch(state) {
    const matches = this.getAllMatching(state).sort((a, b) => b.maskBits - a.maskBits);
    if (matches.length > 1) {
    }
    if (matches.length > 1) {
      throw new Error("Too many matches");
    }
    return matches.length > 0 ? matches[0] : null;
  }
  getCombinationMatch(state) {
    const storyPoints2 = this.getAllMatching(state);
    let storyPoint = storyPoints2[0];
    console.error("Combining:", storyPoints2);
    for (const other of storyPoints2.slice(1)) {
      storyPoint = storyPoint.getUnion(other);
    }
    return storyPoint;
  }
};

// src/transition.ts
function getColor(id) {
  return id.toString(16).substring(0, 6);
}
var colorId = 0;
var Transition = class {
  constructor(name, given, actions, fieldsToSet, fieldsToSetWithoutIgnored) {
    this.name = name;
    this.given = given;
    this.actions = actions;
    this.fieldsToSet = fieldsToSet;
    this.fieldsToSetWithoutIgnored = fieldsToSetWithoutIgnored;
    this.colorId = colorId++;
    if (this.given.overlapsWith(fieldsToSet)) {
      throw new Error(`Entry transition and fieldsToSet overlap: ${this.given}, ${fieldsToSet}`);
    }
    this.maskBits = countSetBits(this.given.stateSet);
  }
  get id() {
    return this.colorId;
  }
  get color() {
    return "#" + getColor(cyrb53(`${this.actions?.say ?? ""} ${this.colorId}`));
  }
  get givenMask() {
    return this.given.mask;
  }
  matches(state) {
    return this.given.test(state);
  }
  apply(state) {
    return this.fieldsToSet.applyToState(state);
  }
};
var TransitionStore = class {
  constructor(name, transitions) {
    this.name = name;
    this.transitions = transitions;
    let common = transitions[0].fieldsToSetWithoutIgnored;
    for (const other of transitions.slice(1)) {
      common = common.getIntersection(other.fieldsToSet);
    }
    this.commonFieldsToSet = common;
  }
  get size() {
    return this.transitions.length;
  }
  getAllMatching(state) {
    const found = [];
    for (let transition of this.transitions) {
      if (transition.matches(state)) {
        found.push(transition);
      }
    }
    return found;
  }
  getMatch(state) {
    const matches = this.getAllMatching(state).sort((a, b) => b.maskBits - a.maskBits);
    console.error("matches:", matches);
    if (matches.length > 1) {
    }
    if (matches.length > 1 && matches[1].maskBits === matches[0].maskBits) {
      throw new Error(`Too many matches: ${matches}`);
    }
    return matches.length > 0 ? matches[0] : null;
  }
  addTransitions(transitions) {
    for (const transition of transitions) {
    }
  }
};
var TransitionLib = class {
  constructor() {
    this.entriesByName = /* @__PURE__ */ new Map();
  }
  add(name, store) {
    this.entriesByName.set(name, store);
  }
  getGroup(name) {
    return this.entriesByName.get(name);
  }
  getTransition(name, state) {
    const store = this.entriesByName.get(name);
    if (!store) {
      throw new Error(`No such action: ${name}`);
    }
    return store.getMatch(state);
  }
  getAllTransitions(name, state) {
    const store = this.entriesByName.get(name);
    if (!store) {
      throw new Error(`No such action: ${name}`);
    }
    return store.getAllMatching(state);
  }
  createOrUpdate(name, transitions) {
    const transitionStore = this.getGroup(name);
    if (transitionStore) {
      transitions = [...transitionStore.transitions, ...transitions];
    }
    const newStore = new TransitionStore(name, transitions);
    this.entriesByName.set(name, newStore);
  }
};

// data/story.json
var story_default = [
  {
    given: [],
    actions: {
      say: "You are in a town with three people: Gandor, Bert, and Lortha.\n"
    },
    choices: [
      {
        name: "talkToGandor",
        variants: [
          {
            given: [
              "-metGandor"
            ],
            say: "Hello, travelers! It's nice to see new people around here. Not many people\ndare to visit here anymore. Not after what happened to the hunter.\n"
          },
          {
            given: [
              "metGandor"
            ],
            say: "Hello again! It's nice to see new people around here. Not many people dare\nto visit here anymore. Not after what happened to the hunter.\n"
          }
        ],
        set: [
          "talkingToGandor"
        ]
      },
      {
        name: "talkToBert",
        set: [
          "talkingToBert"
        ],
        variants: [
          {
            given: [
              "-metBert"
            ],
            say: "Hello, mister. Here is my pocket money.\n",
            reward: 50
          },
          {
            given: [
              "metBert"
            ],
            say: "Hello, again. I don't have any more pocket money.\n"
          }
        ]
      },
      {
        name: "talkToLortha",
        variants: [
          {
            given: [
              "-metLortha",
              "-knowsAboutCat",
              "-foundCat"
            ],
            say: "Oh, good morning. I don't have time to talk. I'm looking for my cat.\n"
          },
          {
            given: [
              "metLortha",
              "-knowsAboutCat",
              "-foundCat"
            ],
            say: "I don't have time to talk. I'm looking for my cat.\n"
          },
          {
            given: [
              "knowsAboutCat",
              "-foundCat"
            ],
            say: "Can't you see I'm busy!\n"
          },
          {
            given: [
              "knowsAboutCat",
              "foundCat",
              "-rewardedForFindingMrMittens"
            ],
            say: "Have you found Mister Mittens?\n"
          },
          {
            given: [
              "knowsAboutCat",
              "foundCat",
              "rewardedForFindingMrMittens"
            ],
            say: "Hello. Thank you again for finding Mister Mittens.\n"
          }
        ],
        set: [
          "talkingToLortha"
        ]
      },
      {
        name: "setFoundCat",
        given: [
          "knowsAboutCat",
          "-foundCat"
        ],
        say: "Cat Found!\nAs you search through the rubble you hear a hearty meow.\nYou have found mr. Mittens!\n",
        set: [
          "foundCat"
        ]
      }
    ]
  },
  {
    given: [
      "talkingToGandor",
      "?metGandor"
    ],
    choices: [
      {
        name: "exitTalk",
        say: "You stop talking to Gandor.\n",
        set: [
          "-talkingToGandor",
          "metGandor"
        ]
      }
    ]
  },
  {
    given: [
      "talkingToGandor",
      "-knowsAboutTheHunter"
    ],
    choices: [
      {
        name: "askAboutTheHunter",
        say: "The hunter was found without a head. In the bushes northeast. I bet the goblins\ndid it. The governor has set a price of 500\xA4 for any one who manages to destroy\nthe goblin nest.\n",
        set: [
          "knowsAboutTheHunter"
        ]
      }
    ]
  },
  {
    given: [
      "talkingToGandor",
      "knowsAboutTheHunter",
      "-knowsAboutPrize"
    ],
    choices: [
      {
        name: "askAboutPrize",
        say: "You get 500\xA4 from the mayor if you destroy the goblin nest. It's not going\nto be an easy job, but it\u2019s big money.\n",
        set: [
          "knowsAboutPrize"
        ]
      }
    ]
  },
  {
    given: [
      "talkingToGandor",
      "knowsAboutTheHunter",
      "-knowsAboutGoblins"
    ],
    choices: [
      {
        name: "askAboutGoblins",
        say: "Goblins! Nasty creatures. They live somewhere in the mountains up north.\nThere's a prize for killing them.\n",
        set: [
          "knowsAboutGoblins"
        ]
      }
    ]
  },
  {
    given: [
      "talkingToGandor",
      "knowsAboutTheHunter",
      "-knowsBertFoundTheBody"
    ],
    choices: [
      {
        name: "askWhoFoundTheBody",
        say: "The boy, Bert, found him when he was collecting wood in the woods.\n",
        set: [
          "knowsBertFoundTheBody"
        ]
      }
    ]
  },
  {
    given: [
      "talkingToBert",
      "?metBert"
    ],
    choices: [
      {
        name: "exitTalk",
        say: "You stop talking to Bert.\n",
        set: [
          "-talkingToBert",
          "metBert"
        ]
      }
    ]
  },
  {
    given: [
      "talkingToBert",
      "knowsAboutCat",
      "-foundCat"
    ],
    choices: [
      {
        name: "askAboutLorthasCat",
        say: "I think I saw the cat near the storehouse by the river.\n",
        set: [
          "knowsTheCatIsInTheStorehouse"
        ]
      }
    ]
  },
  {
    given: [
      "talkingToBert",
      "knowsBertFoundTheBody"
    ],
    choices: [
      {
        name: "askAboutPlace",
        say: "I found the hunter headless, his famous neclace gone. It was northeast by\nthe river.\n",
        set: [
          "knowsAboutPlace"
        ]
      }
    ]
  },
  {
    given: [
      "talkingToLortha",
      "?metLortha"
    ],
    choices: [
      {
        name: "exitTalk",
        say: "You stop talking to Lortha.\n",
        set: [
          "-talkingToLortha",
          "metLortha"
        ]
      }
    ]
  },
  {
    given: [
      "talkingToLortha",
      "-foundCat"
    ],
    choices: [
      {
        name: "askAboutCat",
        say: "It's missing. Stop bugging me unless you find it!\n",
        set: [
          "knowsAboutCat"
        ]
      }
    ]
  },
  {
    given: [
      "talkingToLortha",
      "foundCat"
    ],
    choices: [
      {
        name: "informTheCatIsFound",
        say: "Thank you so much! Here's a little reward for your help.\n",
        reward: 100,
        set: [
          "rewardedForFindingMrMittens"
        ]
      }
    ]
  }
];

// src/story.ts
function getMolecule(cond) {
  const { positive, negative, ignored } = destructureTidbitArray(cond);
  return library.getMoleculeFor([...positive, ...ignored], negative);
}
function getMoleculeWithoutIgnored(cond) {
  const { positive, negative, ignored } = destructureTidbitArray(cond);
  return library.getMoleculeFor(positive, negative);
}
var extractTidbits = (data) => {
  const seen = /* @__PURE__ */ new Set();
  const quarks = [];
  const addTidbits = (condition) => {
    const { positive, negative, ignored } = destructureTidbitArray(condition);
    for (let q of [...positive, ...negative, ...ignored]) {
      if (!seen.has(q)) {
        quarks.push(quark(q));
        seen.add(q);
      }
    }
  };
  for (const entry of data) {
    addTidbits(entry.given);
    for (const choice of entry.choices) {
      if (choice.set) {
        addTidbits(choice.set);
      }
      if (choice.given) {
        addTidbits(choice.given);
      }
    }
  }
  return quarks;
};
function handleChoices(entryCondition, choiceRecords, ignoredMask) {
  const choices = /* @__PURE__ */ new Map();
  for (const choiceRecord of choiceRecords) {
    const choiceName = choiceRecord.name;
    const choiceCondition = choiceRecord.given ? getMoleculeWithoutIgnored(choiceRecord.given) : null;
    choices.set(choiceName, new Choice(choiceName, choiceCondition));
    const variants = prepareVariants(choiceRecord);
    const transitions = [];
    for (const variant of variants) {
      const variantCondition = getMolecule(variant.given);
      const variantEntryCondition = variantCondition.getUnion(entryCondition);
      const fieldsToSet = getMolecule(variant.set);
      let fieldsToSetWithoutIgnored = fieldsToSet.withoutBits(ignoredMask);
      if (choiceCondition) {
        fieldsToSetWithoutIgnored = fieldsToSetWithoutIgnored.getOppositesRemoved(choiceCondition);
      }
      const actions = {
        say: variant.say,
        reward: variant.reward
      };
      const transition = new Transition(choiceName, variantEntryCondition, actions, fieldsToSet, fieldsToSetWithoutIgnored);
      transitions.push(transition);
    }
    transitionLib.createOrUpdate(choiceName, transitions);
  }
  return choices;
}
function prepareVariants(choice) {
  if (choice.variants) {
    return choice.variants.map((variant) => ({
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
function extractStoryPoints(data) {
  const storyPoints2 = [];
  for (const entry of data) {
    const { positive, negative, ignored } = destructureTidbitArray(entry.given);
    const ignoredMask = library.getAtomNumberFor(ignored);
    let matcher = library.getMoleculeFor(positive, negative);
    const choices = handleChoices(matcher, entry.choices ?? [], ignoredMask);
    for (const choiceName of choices.keys()) {
      const transitionGroup = transitionLib.getGroup(choiceName);
      matcher = matcher.getUnion(transitionGroup.commonFieldsToSet.getInverse());
    }
    const storyPoint = new StoryPoint(
      entry.given.length === 0 ? "\xD8" : entry.given.join("|"),
      matcher,
      entry.actions,
      choices
    );
    storyPoints2.push(storyPoint);
  }
  return storyPoints2;
}
var tidbits = extractTidbits(story_default);
console.log("TIDBITS:", tidbits);
var library = new Library(tidbits);
var transitionLib = new TransitionLib();
var storyPoints = extractStoryPoints(story_default);
var storyPointStore = new StoryPointStore(storyPoints);

// src/storyEngine.ts
var StoryEngine = class {
  constructor() {
    this.state = 0n;
    this.choiceNames = [];
    this.currentStoryPoint = null;
    this.reset();
  }
  reset() {
    this.setState(0n);
  }
  setState(state) {
    this.state = state;
    this.currentStoryPoint = storyPointStore.getCombinationMatch(state);
    if (this.currentStoryPoint.data?.say) {
      console.log(this.currentStoryPoint.data.say);
    }
    this.choiceNames = [];
    for (let choiceName of this.currentStoryPoint.choiceNames) {
      this.choiceNames.push(choiceName);
    }
  }
  select(selection) {
    if (!this.currentStoryPoint) {
      throw new Error(`StoryPoint not selected`);
    }
    if (!this.choiceNames.includes(selection)) {
      throw new Error(`No such choice: ${selection}`);
    }
    const choice = transitionLib.getTransition(selection, this.state);
    if (!choice) {
      throw new Error(`Couldn't find transition ${selection} from ${toBinaryString(this.state, STATELEN)} ${this.currentStoryPoint.toString()}`);
    }
    this.setState(this.currentStoryPoint.applyChoice(this.state, choice));
    return choice;
  }
  get current() {
    return this.currentStoryPoint;
  }
  hasTidbits(tidbits2) {
    const number = library.getAtomNumberFor(tidbits2);
    return !!(this.state & number);
  }
  hasGiven(tidbits2) {
    const { positive, negative, ignored } = destructureTidbitArray(tidbits2);
    const given = library.getMoleculeFor([...positive, ...ignored], negative);
    return given.test(this.state);
  }
};

// src/index.ts
var engine = new StoryEngine();
var src_default = engine;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  StoryPoint,
  Transition
});
//# sourceMappingURL=index.js.map