export interface PathEncoder {
    encode: (parent: any, key: keyof any) => string;
    join: (a: string, b: string) => string;
    getMatches: (a: Set<string>, b: Set<string>) => string[]
}

export class DefaultPathEncoder implements PathEncoder {
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