import { expect } from 'chai';
import { GetTestBed } from './utils.js';
describe('Listener tests', () => {
    it('root change', () => {
        const { object, observer, observed } = GetTestBed({ emit: 'sync' });
        let change;
        let previous = observed.a;
        let current = '123';
        observer.watch(observed, v => change = v);
        observed.a = current;
        expect(change).to.deep.include({
            event: 'change',
            type: 'set',
            target: observed,
            key: 'a',
            previous,
            current,
            reference: observed,
            paths: ["/a", "/recursive/obj/a"]
        });
    });

    it('child change', () => {
        const { object, observer, observed } = GetTestBed({ emit: 'sync' });
        let change;
        observer.watch(observed, v => change = v);
        let previous = observed.nested.c;
        let current = '123';
        observed.nested.c = current;
        expect(change).to.deep.include({
            event: 'change',
            type: 'set',
            target: observed.nested,
            key: 'c',
            previous,
            current,
            reference: observed,
            paths: ['/nested/c', '/recursive/obj/nested/c']
        });
    });

    it('nested change', () => {
        const { object, observer, observed } = GetTestBed({ emit: 'sync' });
        let change;
        observer.watch(observed.nested, v => change = v);
        let previous = observed.nested.c;
        let current = '123';
        observed.nested.c = current;
        expect(change).to.deep.include({
            event: 'change',
            type: 'set',
            target: observed.nested,
            key: 'c',
            previous,
            current,
            reference: observed.nested,
            paths: ['/c']
        });
    });

    it('sibling change', () => {
        const { object, observer, observed } = GetTestBed({ emit: 'sync' });
        let change;
        observer.watch(observed.nested, v => change = v);
        observed.a = '123';
        expect(change).to.equal(undefined);
    });

    it('new property', () => {
        const { object, observer, observed } = GetTestBed({ emit: 'sync' });
        let change;
        let current = 123;
        observer.watch(observed, v => change = v);
        (observed as any).f = current;
        expect(change).to.deep.include({
            event: 'change',
            type: 'set',
            target: observed,
            key: 'f',
            previous: undefined,
            current,
            reference: observed,
            paths: ["/f", "/recursive/obj/f"]
        });
    });

    it('delete property', () => {
        const { object, observer, observed } = GetTestBed({ emit: 'sync' });
        let change;
        observer.watch(observed, v => change = v);
        delete observed.a;
        expect(change).to.deep.include({
            event: 'change',
            type: 'delete',
            target: observed,
            key: 'a',
            previous: 'b',
            reference: observed,
            paths: ["/a", "/recursive/obj/a"]
        });
    });

    it('delete undefined property', () => {
        const { object, observer, observed } = GetTestBed({ emit: 'sync' });
        let change;
        observer.watch(observed, v => change = v);
        delete (observed as any).f;
        expect(change).to.deep.include({
            event: 'change',
            type: 'delete',
            target: observed,
            key: 'f',
            previous: undefined,
            reference: observed,
            paths: ["/f", "/recursive/obj/f"]
        });
    });

    it('checking array sort', () => {
        const { object, observer, observed } = GetTestBed({ emit: 'sync' });
        let changes: any[] = [];
        observer.watch(observed, v => changes.push(v));
        observed.array.sort();
        expect(object.array[0]).to.equal(1);
        expect(object.array[1]).to.equal(2);
        expect(object.array[2]).to.equal(3);
        expect(object.array[3]).to.equal(4);
        expect(object.array[4]).to.equal(5);
        expect(object.array[5]).to.equal(6);
    });

    it('checking array set', () => {
        const { object, observer, observed } = GetTestBed({ emit: 'sync' });
        let changes: any[] = [];
        observer.watch(observed, v => changes.push(v));
        observed.array[0] = 1;
        expect(object.array[0]).to.equal(1);
        expect(changes.length).to.equal(1);

    });

    it('checking new object mutations', () => {
        const { object, observer, observed } = GetTestBed({ emit: 'sync' });
        let changes: any[] = [];
        observer.watch(observed, v => changes.push(v));
        observed.b = { c: [] };
        observed.b.a = 1;
        observed.b.c.push(1); 
        expect(changes.length).to.equal(3);

    });

    it('checking empty object mutations', () => {
        const { object, observer, observed } = GetTestBed({ emit: 'sync' });
        let changes: any[] = [];
        observer.watch(observed, v => changes.push(v));
        const a = {};
        const b = {};
        observed.b = a;
        observed.b = b;
        expect(changes.length).to.equal(2);

    });
});