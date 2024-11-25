import { library } from '../story';
export { toBinaryString } from '../util';
export { STATELEN } from '../constants';

export function describeState(state: bigint): string[] {
    return library.nameState(state);
}
