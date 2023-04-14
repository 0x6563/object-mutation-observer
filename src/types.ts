import { PathEncoder } from "./path-encoder.js";

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

export interface ObjectMeta<T> {
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

export type Events = 'change' | 'emit';
export type LoggedEvent = LogEvent & LogIdInfo;
export type Proxied<T> = T extends object | Function ? T & { [AccessKey: symbol]: ObjectMeta<T> } : T;
type LogIdInfo = { logId: number };
type ReferenceInfo = { reference: any; paths: string[]; matchedPaths: string[] }
type Native<T> = T;
type Parents = Map<Proxied<any>, { keys: Set<keyof any> }>;
export type Ancestors = Map<Proxied<any>, Set<string>>;