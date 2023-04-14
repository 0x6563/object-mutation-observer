import { ObjectMutationObserver, ObjectMutationObserverConfig } from "../src/index.js";

export function GetTestBed(config?: ObjectMutationObserverConfig) {
    const object = GetTestObject();
    const observer = new ObjectMutationObserver(Object.assign({}, { emit: 'never', resolveChangeAncestors: 'late' }, config));
    const observed = observer.watch(object);
    return { object, observer, observed }
}

export function GetTestObject() {
    const linked = {
        link: 'a',
        obj: {}
    }
    const obj = {
        "1": 2,
        a: "b",
        linked1: linked,
        linked2: linked,
        nested: {
            c: "c"
        },
        recursive: { obj: this },
        array: [2, 4, 3, 5, 1, 6],
        sorted: [1, 2, 3, 4, 5, 6],
        [Symbol()]: {
            symbol: {
                bool: true
            },
            linked
        }
    };
    obj.recursive = { obj };
    return obj;
}