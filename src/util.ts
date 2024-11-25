export function toBinaryString(number: BigInt, width: number) {
    return number.toString(2).padStart(width, '0');
};

export function getColor(id: number) {
    const hex = id.toString(16).padStart(6, '0');
    return hex.substring(hex.length - 6, hex.length);
};

// https://stackoverflow.com/a/52171480
export function cyrb53(str: string, seed: number = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
    for(let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
    }
    h1  = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
    h2  = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
};


/**
 * Separates positive, negative, and ignored conditions from array of conditions removing the prefix, for example:
 * ['talkingToBert', '-knowsAboutHunter', '?metBert']
 * -> { positive: ['talkingToBert'], negative: ['knowsAboutHunter'], ignored: ['metBert] }
 **/
export function destructureTidbitArray(condition: string[]) {
    const positive = [];
    const negative = [];
    // Tidbits prefixed with asterisk are not added to the given condition of a story point.
    const ignored = [];

    for ( const tidbit of condition ) {
        if ( tidbit.startsWith('-') ) {
            negative.push(tidbit.substring(1));
        } else if ( tidbit.startsWith('?') ) {
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
};
