class NextEvent<T> {
    private resolve: Function;
    private promise: Promise<T> = this.newPromise;
    private get newPromise() { return new Promise<T>((resolve) => this.resolve = resolve); }

    get event() { return this.promise; }

    next(value?: T) {
        this.resolve(value);
        this.promise = this.newPromise
    }
}

class SimpleCache {
    private weakmap: WeakMap<any, any> = new WeakMap();
    private map: Map<any, any> = new Map();

    get(key: any, action: Function) {
        let map = this.getMap(key);
        if (!map.has(key))
            map.set(key, action());
        return map.get(key);
    }

    delete(key: any) {
        return this.getMap(key).delete(key);
    }

    clear() {
        this.weakmap = new WeakMap();
        this.map = new Map();
    }

    private getMap(key: any) {
        return (typeof key == 'object' || typeof key == 'function') ? this.weakmap : this.map;
    }
}

class DefaultPathEncoder implements PathEncoder {
    private symbols: Map<symbol, string> = new Map();
    private id: number = 0;

    private getSymbolKey(key: symbol) {
        if (!this.symbols.has(key))
            this.symbols.set(key, (++this.id).toString());
        return '~9' + this.symbols.get(key);
    }

    encode(_parent: any, key: string) {
        if (typeof key === 'symbol') {
            return '/' + this.getSymbolKey(key);
        }
        return '/' + key.toString().replace(/~/g, '~0').replace(/\//g, '~1');
    }

    join(a: string, b: string) {
        return `${a}${b}`
    }

    getMatches(a: Set<string>, b: Set<string>): (string)[] {
        const intersect = [];
        let [min, max]: Set<string>[] = a.size > b.size ? [b, a] : [a, b];
        for (const m of min) {
            if (max.has(m))
                intersect.push(m);
        }
        return intersect;
    }
}

export const AccessKey = Symbol();

export const Defaults: ObjectMutationObserverConfig = {
    emit: 'async',
    resolveChangeAncestors: 'early',
    greedyProxy: true,
    pathEncoder: DefaultPathEncoder
}

export class ObjectMutationObserver {
    public static global = new ObjectMutationObserver();
    private logId = 0;
    private listenerId = 0;
    private references: WeakMap<any, ObjectMeta<any>> = new WeakMap();
    private changelog: LoggedEvent[] = [];
    private pending;
    private tagFunctions = new Set();
    private config: ObjectMutationObserverConfig = {};
    private encoder: PathEncoder;
    private tickers = {
        'change': new NextEvent<void>(),
        'emit': new NextEvent<void>(),
    }

    constructor(config?: ObjectMutationObserverConfig) {
        this.configure(config);
    }

    static get Key() { return AccessKey; }
    get key() { return AccessKey; }

    static get Changes(): LoggedEvent[] { return ObjectMutationObserver.global.changes; }
    get changes(): LoggedEvent[] {
        return this.changelog.map(change => {
            if (this.config.resolveChangeAncestors === 'late')
                change.ancestors = this.getAncestors(change.target, this.encoder.encode(change.target, change.key as string))
            return { ...change }
        });
    }

    static get HasChanges() { return ObjectMutationObserver.global.hasChanges; }
    get hasChanges() {
        return this.changelog.length > 0;
    }

    static Configure(config: ObjectMutationObserverConfig) { return ObjectMutationObserver.global.configure(config) }
    configure(config: ObjectMutationObserverConfig) {
        const c = Object.assign({}, Defaults, this.config, config);
        if (this.config.pathEncoder != c.pathEncoder)
            this.encoder = (typeof c.pathEncoder == 'function') ? new (c.pathEncoder)() : c.pathEncoder;
        this.tagFunctions = new Set();
        if (Array.isArray(c.tagFunctions))
            for (const f of c.tagFunctions) {
                if (typeof f == 'function') {
                    this.tagFunctions.add(f)
                } else if (f === 'array-mutators') {
                    this.tagFunctions.add(Array.prototype.copyWithin);
                    this.tagFunctions.add(Array.prototype.fill);
                    this.tagFunctions.add(Array.prototype.pop);
                    this.tagFunctions.add(Array.prototype.push);
                    this.tagFunctions.add(Array.prototype.reverse);
                    this.tagFunctions.add(Array.prototype.shift);
                    this.tagFunctions.add(Array.prototype.sort);
                    this.tagFunctions.add(Array.prototype.splice);
                    this.tagFunctions.add(Array.prototype.unshift);
                }
            }
        this.config = c;
    }

    static Watch<T>(o: T);
    static Watch<T>(o: T, callback: ChangeCallback);
    static Watch<T>(o: T, path: string, callback: ChangeCallback);
    static Watch<T>(o: T, path?: string | ChangeCallback, callback?: ChangeCallback): Proxied<T> { return ObjectMutationObserver.global.watch(o, path as any, callback); }

    watch<T>(o: T);
    watch<T>(o: T, callback: ChangeCallback);
    watch<T>(o: T, path: string, callback: ChangeCallback);
    watch<T>(o: T, path?: string | ChangeCallback, callback?: ChangeCallback): Proxied<T> {
        if (typeof o != 'object')
            return o as Proxied<T>;
        if (typeof path === 'function') {
            callback = path;
            path = '';
        }
        const ref = this.add(o);
        if (callback)
            this.addListener(ref, path, callback)
        return ref.proxy;
    }

    static Unwatch<T>(o: T, callback: ChangeCallback);
    static Unwatch<T>(o: T, path: string, callback: ChangeCallback);
    static Unwatch<T>(o: T, path: string | ChangeCallback, callback?: ChangeCallback) { return ObjectMutationObserver.global.unwatch(o, path as any, callback); }

    unwatch<T>(o: T, callback: ChangeCallback);
    unwatch<T>(o: T, path: string, callback: ChangeCallback);
    unwatch<T>(o: T, path: string | ChangeCallback, callback?: ChangeCallback) {
        if (typeof path === 'function') {
            callback = path;
            path = '';
        }

        const listener = this.getMeta(o).listeners.get(callback);
        if (path)
            listener.paths.delete(path);
        else
            listener.all = false;

        if (!listener.paths.size && !listener.all)
            this.unwatchAll(o, callback)
    }

    static UnwatchAll<T>(o: T, callback: ChangeCallback) { return ObjectMutationObserver.global.unwatchAll(o, callback); }
    unwatchAll<T>(o: T, callback: ChangeCallback) {
        this.getMeta(o).listeners.delete(callback);
    }

    static GetNative<T extends object>(o: T) { return ObjectMutationObserver.global.getNative(o); }
    getNative<T extends object>(o: T) {
        return this.getMeta(o).native;
    }

    static GetParents(o: any) { return ObjectMutationObserver.global.getParents(o); }
    getParents(o: any) {
        return this.getAncestors(o);
    }

    static PathEncode(parent: any, key: keyof any) { return ObjectMutationObserver.global.pathEncode(parent, key); }
    pathEncode(parent: any, key: keyof any) {
        return this.encoder.encode(parent, key);
    }

    static WaitFor(event: Events) { return ObjectMutationObserver.global.waitFor(event); }
    waitFor(event: Events) {
        return this.tickers[event].event;
    }

    static Emit() { return ObjectMutationObserver.global.emit(); }
    emit() {
        clearTimeout(this.pending);
        if (!this.hasChanges)
            return;
        const cache = new SimpleCache();
        const changes = this.changes;
        this.changelog = [];
        let li: ChangeArray = [];

        for (const change of changes) {
            for (const [reference, pathsSet] of change.ancestors) {
                for (let [_callback, listener] of this.getMeta(reference).listeners) {
                    const matchedPaths = this.encoder.getMatches(listener.paths, pathsSet);
                    if (listener.all || matchedPaths.length) {
                        li.push({
                            listener: {
                                ...listener
                            },
                            change: {
                                ...change,
                                reference,
                                paths: cache.get(pathsSet, () => Array.from(pathsSet)),
                                matchedPaths
                            }
                        })
                    }
                }
            }
        }
        if (this.config.callbackStrategy)
            li = this.config.callbackStrategy(li);
        if (li)
            li.forEach(v => v.listener.callback(v.change));
        this.tickers.emit.next();
    }

    private add<T>(o: T) {
        if (this.references.has(o))
            return this.getMeta(o);
        const p = this.getMeta(o);
        if (this.config.greedyProxy)
            this.traverse(p.proxy);
        return p;
    }

    private addListener<T>(meta: ObjectMeta<T>, path: string, callback: ChangeCallback) {
        if (!meta.listeners.has(callback))
            meta.listeners.set(callback, { callback, all: false, listenerId: ++this.listenerId, paths: new Set() });
        if (!path)
            meta.listeners.get(callback).all = true;
        else
            meta.listeners.get(callback).paths.add(path);
    }
    private getProxy<T>(o: T): Proxied<T> {
        return this.getMeta(o).proxy;
    }

    private getMeta<T>(o: T): ObjectMeta<T> {
        return this.references.has(o) ? this.references.get(o) : this.register(o);
    }

    private register<T>(o: T) {
        const proxy: Proxied<T> = new Proxy(o, this.proxyHandlers);
        const meta: ObjectMeta<T> = { proxy, parents: new Map(), listeners: new Map(), native: o }
        this.references.set(o, meta);
        this.references.set(proxy, meta);
        return meta;
    }

    private link<T, K extends keyof T>(proxied: T, key: K) {
        const child = this.getMeta(proxied[key] as any);
        if (!child.parents.has(proxied))
            child.parents.set(proxied, { keys: new Set() });
        child.parents.get(proxied).keys.add(key);
    }

    private unlink<T, K extends keyof T>(proxied: T, key: K) {
        const child = this.getMeta(proxied[key] as any);
        if (child && child.parents.has(proxied)) {
            child.parents.get(proxied).keys.delete(key);
            if (child.parents.get(proxied).keys.size == 0) {
                child.parents.delete(proxied);
            }
        }
    }

    private log(event: LogEvent) {
        if (event.event == 'change') {
            if (event.previous && typeof event.previous == 'object')
                event.previous = this.getProxy(event.previous);
            if (event.type === 'set' && typeof event.current == 'object')
                event.current = this.getProxy(event.current);
        }

        if (this.config.resolveChangeAncestors === 'early')
            event.ancestors = this.getAncestors(event.target, this.encoder.encode(event.target, event.key as string));

        this.changelog.push({ ...event, logId: this.logId++ });

        switch (this.config.emit) {
            case 'never':
                return;
            case 'sync':
                return this.emit();
            case 'async':
                clearTimeout(this.pending);
                this.pending = setTimeout(() => this.emit(), 0);
        }
        this.tickers.change.next();
    }

    private getAncestors<T>(obj: T, path: string = '', refs: Ancestors = new Map(), chain: Set<any> = new Set()) {
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
                this.getAncestors(parent, this.encoder.join(this.encoder.encode(parent, key as string), path), refs, chain);
            }
        }
        return refs;
    }

    private traverse<T>(o: T, chain: Set<any> = new Set()) {
        if (chain.has(o))
            return;

        chain.add(o);

        for (const key in o) {
            if (o.hasOwnProperty(key) && typeof o[key] == 'object') {
                this.link(o, key);
                this.traverse(o[key], chain);
            }
        }
        const symbols = Object.getOwnPropertySymbols(o);

        for (const key of symbols) {
            this.link(o, key as keyof typeof o);
            this.traverse(o[key], chain);
        }
    }

    private proxyHandlers: ProxyHandler<any> = {
        get: <T extends object, K extends keyof T>(target: T, key: K, receiver: any) => {
            if (key === this.key)
                return this.getMeta(target);

            const val = target[key];
            if (typeof val == 'object')
                return this.getProxy(val as unknown as object);

            if (typeof val == 'function') {
                if (this.tagFunctions.has(val))
                    return (...args) => {
                        const tag = Symbol();
                        const _this = this.references.has(receiver) ? this.getProxy(receiver) : receiver;
                        this.log({ event: 'execute', type: 'start', target, key, tag });
                        const r = val.apply(_this, args);
                        this.log({ event: 'execute', type: 'end', target, key, tag });
                        return r;
                    }
            }
            return val;
        },
        set: <T extends object, K extends keyof T>(target: T, key: K, value: any): boolean => {
            const previous = target[key];
            const proxied = this.getProxy(target);

            if (key === this.key)
                return false;
            if (target[key] === value)
                return true;

            if (typeof target[key] === 'object')
                this.unlink(proxied, key)
            const b = target[key] = value;
            if (typeof target[key] === 'object')
                this.link(proxied, key)
            this.log({ event: 'change', type: 'set', target: proxied, key, previous, current: target[key] });

            return b;
        },
        deleteProperty: <T extends object, K extends keyof T>(target: T, key: K) => {
            const previous = target[key];
            const proxied = this.getProxy(target);

            if (typeof target[key] === 'object')
                this.unlink(proxied, key);

            delete target[key];
            this.log({ event: 'change', type: 'delete', target: proxied, key, previous });
            return true;
        }
    }
}

export const { Watch, Unwatch, UnwatchAll, GetNative, GetParents, WaitFor, Emit } = ObjectMutationObserver;

export interface ObjectMutationObserverConfig {
    emit?: 'sync' | 'async' | 'never';
    resolveChangeAncestors?: 'early' | 'late' | 'never';
    greedyProxy?: boolean;
    tagFunctions?: (Function | 'array-mutators')[];
    callbackStrategy?: CallbackStrategy;
    pathEncoder?: PathEncoder | (new () => PathEncoder);
}

export interface Listener {
    callback: ChangeCallback;
    listenerId: number;
    all: boolean;
    paths: Set<string>;
}
export interface PathEncoder {
    encode: (parent: any, key: keyof any) => string;
    join: (a: string, b: string) => string;
    getMatches: (a: Set<string>, b: Set<string>) => string[]
}

export interface LogEventExecute extends LogEventBase {
    event: 'execute';
    type: 'start' | 'end';
    tag: Symbol;
}

export interface LogEventSet extends LogEventBase {
    event: 'change';
    type: 'set';
    previous: any;
    current: any;
}

export interface LogEventDelete extends LogEventBase {
    event: 'change';
    type: 'delete';
    previous: any;
}

interface ObjectMeta<T> {
    native: Native<T>;
    proxy: Proxied<T>;
    parents: Parents;
    listeners: Map<ChangeCallback, Listener>;
}

interface LogEventBase {
    target: any;
    key: keyof LogEventBase['target'];
    ancestors?: Ancestors;
}

export type ChangeCallback = (event: ChangeEvent | ChangeEvent[]) => void;
export type CallbackStrategy = (changes: ChangeArray) => ChangeArray;
export type LogEvent = LogEventSet | LogEventDelete | LogEventExecute;
export type ChangeEvent = LoggedEvent & ReferenceInfo;
export type ChangeArray = { listener: Listener, change: ChangeEvent | ChangeEvent[] }[];

type Events = 'change' | 'emit';
type LogIdInfo = { logId: number };
type ReferenceInfo = { reference: any; paths: string[]; matchedPaths: string[] }
type LoggedEvent = LogEvent & LogIdInfo;
type Native<T> = T;
type Proxied<T> = T extends object | Function ? T & { [AccessKey]: ObjectMeta<T> } : T;
type Parents = Map<Proxied<any>, { keys: Set<keyof any> }>;
type Ancestors = Map<Proxied<any>, Set<string>>;