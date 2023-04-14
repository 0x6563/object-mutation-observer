import { expect } from 'chai';
import { GetTestBed } from './utils.js';
describe('Recursion', () => {
    it('checking value returns', () => {
        const { object, observer, observed } = GetTestBed({ emit: 'sync' });
        let change;
        observer.watch(observed, '', v => change = v);
        observed.recursive.obj['a'] = 'c';
        expect(observed["1"]).to.equal(object["1"]);

    });
    it('checking value returns', () => {
        const { object, observer, observed } = GetTestBed();
        observed.linked1.link = '3'
        expect(observed["1"]).to.equal(object["1"]);

    });
});