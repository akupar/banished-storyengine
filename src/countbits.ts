
// https://www.geeksforgeeks.org/count-set-bits-in-an-integer/


const bitsSetTable256: number[] = new Array(256);

// Function to initialise the lookup table
(initialize => {
    bitsSetTable256[0] = Number(0n);
    for ( let i = 0; i < 256; i++ ) {
        bitsSetTable256[i] = (i & 1) + bitsSetTable256[i / 2];
    }
})();


// Function to return the count
// of set bits in n
export function countSetBits(n: bigint) {
    let sum = 0;
    while ( n > 0n ) {
        const byte = Number(n & 0xffn);
        sum += bitsSetTable256[byte];
        n = n >> 8n;
    }
    return sum;
};
