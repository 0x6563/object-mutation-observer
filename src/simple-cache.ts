export class SimpleCache {
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