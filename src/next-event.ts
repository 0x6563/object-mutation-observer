export class NextEvent<T> {
    private resolve: Function;
    private promise: Promise<T> = this.newPromise;
    private get newPromise() { return new Promise<T>((resolve) => this.resolve = resolve); }

    get event() { return this.promise; }

    next(value?: T) {
        this.resolve(value);
        this.promise = this.newPromise
    }
}