import * as fs from 'node:fs';

import { parse } from 'yaml';


const loadFile = (filename: string): string | never => {
    try {
        return fs.readFileSync(filename, 'utf8');
    } catch (err) {
        throw err;
    }
};

const writeFile = (filename: string, data: string) => {
    try {
        fs.writeFileSync(filename, data, 'utf8');
    } catch (err) {
        throw err;
    }
};


const data = parse(loadFile(`${__dirname}/../data/story.yaml`));

writeFile(`${__dirname}/../data/story.json`, JSON.stringify(data, null, 2));
