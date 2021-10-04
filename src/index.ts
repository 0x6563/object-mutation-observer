export class ObjectMutationObserver {
    public static global = new ObjectMutationObserver();

    private static $key = Symbol();
    public static get Key() { return ObjectMutationObserver.$key; }
    get key() { return ObjectMutationObserver.$key; }

    private references: WeakMap<object, ObjectMeta> = new WeakMap();
    private changelog: LogEvent[] = [];
    private pending;
    private prototypeTraps = new Map<any, Set<string>>();

    constructor(config?: {}) {
        this.prototypeTraps.set(Array.prototype, new Set(['copyWithin', 'fill', 'pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift']));
    }

    public static get HasChanges() {
        return ObjectMutationObserver.global.hasChanges;
    }
    get hasChanges() {
        return this.changelog.length > 0;
    }

    public static get Watch() { return ObjectMutationObserver.global.watch; }
    watch<T extends object>(o: T): T {
        const p = this.getMeta(o).proxy;
        this.traverse(o);
        return p;
    }

    public static get Listen() { return ObjectMutationObserver.global.listen; }
    listen<T extends object>(o: T, callback: ChangeCallback) {
        this.getMeta(o).listeners.add(callback);
        return callback;
    }

    public static get Unlisten() { return ObjectMutationObserver.global.unlisten; }
    unlisten<T extends object>(o: T, callback: ChangeCallback) {
        this.getMeta(o).listeners.delete(callback);
    }

    public static get GetNative() { return ObjectMutationObserver.global.getNative; }
    getNative<T extends object>(o: T) {
        return this.getMeta(o).native;
    }

    waitFor(event: 'publish' | 'changes' | 'prepublish') {

    }

    public static get Changes() { return ObjectMutationObserver.global.changes; }
    get changes() {
        return this.changelog.map(v => ({ ...v, paths: this.getParents(v.target, v.key as string) }));
    }

    private traverse(o: object, chain: Set<any> = new Set()) {
        if (chain.has(o) || typeof o != 'object')
            return;

        chain.add(o);

        if (Array.isArray(o)) {
            for (let key = 0; key < o.length; key++) {
                if (typeof o[key] == 'object') {
                    this.link(o, key)
                    this.traverse(o[key], chain);
                }
            }
        } else {
            for (const key in o) {
                if (o.hasOwnProperty(key)) {
                    if (typeof o[key] == 'object') {
                        this.link(o, key as never)
                        this.traverse(o[key], chain);
                    }
                }
            }
        }
    }

    private getMeta<T extends object>(o: T): ObjectMeta {
        return this.references.has(o) ? this.references.get(o) : this.register(o);
    }

    private register<T extends object>(o: T) {
        const proxy = new Proxy<T & object>(o, this.proxyHandlers);
        const meta: ObjectMeta = { native: o, proxy, parents: new Map(), listeners: new Set() }
        this.references.set(o, meta);
        this.references.set(proxy, meta);
        return meta;
    }

    private link<T extends object, K extends keyof T>(parent: T, key: K) {
        if (!(key in parent))
            return;
        const child = this.getMeta(parent[key] as unknown as any);
        if (child) {
            if (!child.parents.has(parent))
                child.parents.set(parent, { keys: new Set() });
            child.parents.get(parent).keys.add(key);
        }
    }

    private unlink<T extends object, K extends keyof T>(parent: T, key: K) {
        const child = this.getMeta(parent[key] as unknown as any);
        if (child && child.parents.has(parent)) {
            child.parents.get(parent).keys.delete(key);
            if (child.parents.get(parent).keys.size == 0) {
                child.parents.delete(parent);
            }
        }

    }

    private log(event: LogEvent) {
        if (!this.pending) {
            this.pending = setTimeout(() => this.publish(), 0);
        }
        this.changelog.push(event);
    }

    private publish() {
        clearTimeout(this.pending);
        const changes = this.changes;
        this.changelog = [];
        for (const change of changes) {
            for (const [ref, paths] of change.paths) {
                for (let listener of this.getMeta(ref).listeners) {
                    listener(change);
                }
            }
        }
    }

    private getParents(obj: any, path: string = '', refs: Map<any, Set<string>> = new Map(), chain: Set<any> = new Set()) {
        if (!refs.has(obj))
            refs.set(obj, new Set());
        const paths = refs.get(obj);
        paths.add(path);

        if (chain.has(obj))
            return;
        chain.add(obj);
        const parents = this.getMeta(obj).parents;
        for (let [parent, { keys }] of parents) {
            for (let key of keys) {
                this.getParents(parent, `${key as string}.${path}`, refs, new Set(chain));
            }
        }
        return refs;
    }

    private proxyHandlers: ProxyHandler<any> = {
        get: <T extends object, K extends keyof T>(target: T, key: K) => {

            if (key === this.key)
                return this.getMeta(target);

            const val = target[key];
            if (typeof val == 'object')
                return this.getMeta(val as unknown as object).proxy;

            if (typeof val == 'function') {
                const proto = Object.getPrototypeOf(target);
                if (this.prototypeTraps.has(proto) && this.prototypeTraps.get(proto).has(key as string))
                    return (...args) => {
                        const ref = Symbol();
                        this.log({ event: 'execute', type: 'start', target, key, ref });
                        const r = proto[key as keyof (typeof proto)].apply(this.getMeta(target).proxy, args);
                        this.log({ event: 'execute', type: 'end', target, key, ref });
                        return r;
                    }
            }

            return val;
        },
        set: <T extends object, K extends keyof T>(target: T, key: K, value: any): boolean => {
            const previous = target[key];

            if (key === this.key)
                return false;
            if (target[key] === value)
                return true;

            if (typeof target[key] === 'object')
                this.unlink(target, key)
            const b = target[key] = value;
            if (typeof target[key] === 'object')
                this.link(target, key)
            this.log({ event: 'change', type: 'set', target, key, previous, current: target[key] });

            return b;
        },
        deleteProperty: <T extends object, K extends keyof T>(target: T, key: K) => {
            const previous = target[key];

            if (typeof target[key] === 'object')
                this.unlink(target, key);

            delete target[key];
            this.log({ event: 'change', type: 'delete', target, key, previous });
            return true;
        }
    }
}
export const Watch = ObjectMutationObserver.Watch;
export type ChangeCallback = (event: LogEvent) => void;
export type LogEvent = LogEventSet | LogEventDelete | LogEventExecute;

interface LogEventExecute {
    event: 'execute';
    type: 'start' | 'end';
    target: any;
    key: keyof LogEventSet['target'];
    ref: Symbol;
}

interface LogEventSet {
    event: 'change';
    type: 'set';
    target: any;
    key: keyof LogEventSet['target'];
    previous: any;
    current: any;
}
interface LogEventDelete {
    event: 'change';
    type: 'delete';
    target: any;
    key: keyof LogEventSet['target'];
    previous: any;
}
interface Configuration {
    dispatch: 'async' | 'sync';
}
interface ObjectMeta {
    native: any,
    proxy: any;
    parents: Map<object, { keys: Set<keyof any> }>;
    listeners: Set<ChangeCallback>;
}
