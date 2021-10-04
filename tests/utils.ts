import { ObjectMutationObserver } from "../src";

export function GetTestBed() {
    const object = GetTestObject();
    const observer = new ObjectMutationObserver();
    const observed = observer.watch(object);
    return { object, observer, observed }
}

export function GetTestObject() {
    const linked = {
        link: 'a',
        obj: {}
    }
    const obj: any = {
        "1": 2,
        a: "b",
        linked1: linked,
        linked2: linked,
        nested: {
            c: "c"
        },
        recursive: {},
        array: [2, 4, 3, 5, 1, 6],
        sorted: [1, 2, 3, 4, 5, 6]
    };
    obj.recursive.obj = obj;
    return obj;
}