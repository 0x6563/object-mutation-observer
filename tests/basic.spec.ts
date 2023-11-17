import { expect } from 'chai';
import { GetTestBed } from './utils.js';
describe('Basic tests', () => {
    it('primitive values match', () => {
        const { object, observer, observed } = GetTestBed();
        expect(observed["1"]).to.equal(object["1"]);
    });
    it('respect Date this', () => {
        const { object, observer, observed } = GetTestBed();
        observed.date = new Date('1970-01-01T00:00:00.000Z');
        expect(observed.date.toISOString()).to.equal('1970-01-01T00:00:00.000Z');
    });
    it('respect Regex this', () => {
        const { object, observer, observed } = GetTestBed();
        observed.regex = new RegExp('test');
        expect(observed.regex.test('test')).to.equal(true);
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
        (observed.nested as any) = o;
        expect(object.nested).to.equal(o);
    });
    it('get native from observed object', () => {
        const { object, observer, observed } = GetTestBed();
        const o = { d: 'd' };
        (observed.nested as any) = o;
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
    it('set nested observed object and trigger changes', () => {
        const { object, observer, observed } = GetTestBed();
        const o = { d: 'd' };
        (observed.nested as any) = o;
        (observed.nested as any).d = 'c';
        expect((observed.nested as any).d).to.equal('c');
    });
    it('set nested change and delete nested object; Resolve Early', async () => {
        const { object, observer, observed } = GetTestBed({ emit: 'async', resolveChangeAncestors: 'early' });
        (observed.nested as any).c = 'c2';
        delete observed.nested as any;
        let changes: any[] = [];
        observer.watch(observed, v => changes.push(v));
        await observer.waitFor('emit');
        expect(changes.length).to.equal(2);
    });
    it('set nested change and delete nested object; Resolve Late', async () => {
        const { object, observer, observed } = GetTestBed({ emit: 'async', resolveChangeAncestors: 'late' });
        (observed.nested as any).c = 'c2';
        delete observed.nested as any;
        let changes: any[] = [];
        observer.watch(observed, v => changes.push(v));
        await observer.waitFor('emit');
        expect(changes.length).to.equal(1);
    });
});
