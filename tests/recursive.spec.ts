import { expect } from 'chai';
import { GetTestBed } from './utils';
describe('Recursion', () => {
    it('checking value returns', () => {
        const { object, observer, observed } = GetTestBed();
        observed.recursive.obj['a'] = 'c';
        // console.log(observer.changes[0].paths);
        expect(observed["1"]).to.equal(object["1"]);

    });
    it('checking value returns', () => {
        const { object, observer, observed } = GetTestBed();
        observed.linked1.link = '3'
        console.log(observer.changes[0].paths);
        expect(observed["1"]).to.equal(object["1"]);

    });
});