export function ObjectMutationObserver(o: JSONStructure): JSONValue {
    const meta: OMOMeta = {
        data: o,
        parents: []
    }
    return new Proxy(meta, {
        get: proxyGet,
        set: proxySet
    }) as unknown as JSONValue;
}

function proxyGet(target: OMOMeta, p: number | string | symbol): JSONValue | OMOMeta {
    if (p === OMOKEY) {
        return target;
    }
    const val = (target.data as JSONMap)[(p as any)];
    if (typeof val == 'object')
        return ObjectMutationObserver(val);
    return val;
}

function proxySet(target: OMOMeta, p: number | string | symbol, value: any): boolean {
    if (p === OMOKEY)
        return false;
    return true;
}


export interface OMOMeta {
    data: JSONStructure;
    parents: OMOMeta[]

}

export const OMOKEY = Symbol("OMO Master Key");
export type JSONValue = JSONPrimitive | JSONStructure;
export type JSONPrimitive = string | number | boolean | null;
export type JSONStructure = JSONMap | JSONArray;
export type JSONMap = { [key: string]: JSONValue };
export type JSONArray = JSONValue[]