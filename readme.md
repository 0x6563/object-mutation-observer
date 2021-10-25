## Quickstart
```JavaScript
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
    
    const observer = new ObjectMutationObserver({ emit: 'async', resolveChangeAncestors: 'early' }));
    const proxy = observer.watch(obj);
    observer.watch(proxy, v=> console.log(v));
    proxy.f = 'b';
    // console:
    // {
    //     event: 'change', // Type of event
    //     type: 'set', // Subtype of event
    //     target: proxy, // The object that had changes on it
    //     key: 'f', // The property that was modfied
    //     previous: undefined, // The previous value
    //     current: 'b', // The new value
    //     reference: proxy, // The object the listener was attached to
    //     paths: ["/f", "/recursive/obj/f"] // The paths relative to the listened to object
    // }
```



## Goals 
- Must not leak implementation code into the original objects
- Must allow multiple listeners
- Must allow attaching listeners at any time and at any level by passing the object to listen to
- Must not prevent garbage collection of objects
- Should capture all mutations
- Should be indistinguishable from original object. **No Code Changes required** ie `obj.a = '1'` must not need to be changed to `set(obj.a, '1')` * Exception for optional wrapping methods to tag execution started/ended ie Array.sort started/ended
- Should work with all objects and keys including functions and symbols
- Should work with recursive objects and objects with multiple ancestors
- Should resolve all paths relative to change
