import { expect } from 'chai';
import { ObjectMutationObserver } from '../src';
import { GetTestObject } from './utils';
describe('Static tests', () => {

    it('static watch', async () => {
        const object = GetTestObject();
        const observed = ObjectMutationObserver.Watch(object);
        expect(observed.nested.c).to.equal(object.nested.c);
    });
});