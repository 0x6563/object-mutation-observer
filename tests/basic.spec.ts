import { expect } from 'chai';
import { GetTestBed } from './utils';
describe('Basic tests', () => {
    it('primitive values match', () => {
        const { object, observer, observed } = GetTestBed();
        expect(observed["1"]).to.equal(object["1"]);
    });
    it('nested values match', () => {
        const { object, observer, observed } = GetTestBed();
        expect(observed.nested.c).to.equal(object.nested.c);
    });
    it('observed nested object always returns the same object', () => {
        const { object, observer, observed } = GetTestBed();
        expect(observed.nested).to.equal(observed.nested);
    });
    it('observed primitive value sets', () => {
        const { object, observer, observed } = GetTestBed();
        observed["1"] = 3;
        expect(object["1"]).to.equal(3);
    });
    it('observed nested value sets', () => {
        const { object, observer, observed } = GetTestBed();
        observed.nested.c = 'd'
        expect(object.nested.c).to.equal("d");
    });
    it('observed objects sets native nested object', () => {
        const { object, observer, observed } = GetTestBed();
        const o = { d: 'd' };
        observed.nested = o;
        expect(object.nested).to.equal(o);
    });
    it('get native from observed object', () => {
        const { object, observer, observed } = GetTestBed();
        const o = { d: 'd' };
        observed.nested = o;
        const native = observer.getNative(observed.nested)
        expect(native).to.equal(o);
    });
    it('observed object does trigger changes', () => {
        const { object, observer, observed } = GetTestBed();
        observed.array.pop();
        const changes = observer.changes;
        expect(changes.length).to.be.greaterThan(0);
    });
    it('native object does not trigger changes', () => {
        const { object, observer, observed } = GetTestBed();
        object.array.pop();
        const changes = observer.changes;
        expect(changes.length).to.equal(0);
    });
});