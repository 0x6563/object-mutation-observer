import { expect } from 'chai';
import { LogEventExecute } from '../src';
import { GetTestBed } from './utils';
describe('Array tests', () => {

    it('checking array push', () => {
        const { object, observer, observed } = GetTestBed();
        expect(object.array.length).to.equal(6);
        expect(observed.array.length).to.equal(6);
        observed.array.push(3);
        expect(object.array[6]).to.equal(3);
        expect(object.array.length).to.equal(7);
        expect(observed.array.length).to.equal(7);

    });
    it('checking array copywithin', () => {
        const { object, observer, observed } = GetTestBed();
        observed.sorted.copyWithin(0, 3, 5);
        expect(object.sorted[0]).to.equal(4);
        expect(object.sorted[1]).to.equal(5);
        expect(object.sorted[2]).to.equal(3);
        expect(object.sorted[3]).to.equal(4);
        expect(object.sorted[4]).to.equal(5);
    });
    it('checking array index set', () => {
        const { object, observer, observed } = GetTestBed();
        observed.array[0] = 3;
        expect(object.array[0]).to.equal(3);
    });
    it('checking array sort', () => {
        const { object, observer, observed } = GetTestBed({ tagFunctions: ['array-mutators'], emit: 'never' });

        observed.array.sort();
        expect(object.array[0]).to.equal(1);
        expect(object.array[1]).to.equal(2);
        expect(object.array[2]).to.equal(3);
        expect(object.array[3]).to.equal(4);
        expect(object.array[4]).to.equal(5);
        expect(object.array[5]).to.equal(6);
    });
    it('checking array pop', () => {
        const { object, observer, observed } = GetTestBed();
        observed.array.pop();
        expect(object.array.length).to.equal(5);
    });

    it('checking array push pop', () => {
        const { object, observer, observed } = GetTestBed({ tagFunctions: ['array-mutators'], emit: 'never' });
        observed.array.push(observed.array.pop());
        const executes = observer.changes.filter((v: any) => v.tag) as LogEventExecute[];
        expect(executes[0].tag).to.equal(executes[1].tag);
        expect(executes[2].tag).to.equal(executes[3].tag);
    });
});