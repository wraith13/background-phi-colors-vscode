export class Cache<keyT, valueT>
{
    cache: { [key: string]: valueT } = { };
    public constructor(public loader: (key: keyT) => valueT)
    {
    }
    public get = (key: keyT): valueT => this.getCore(key, JSON.stringify(key));
    private getCore = (key: keyT, keyJson: string): valueT => undefined === this.cache[keyJson] ?
        (this.cache[keyJson] = this.loader(key)):
        this.cache[keyJson]
    public getCache = (key: keyT): valueT => this.cache[JSON.stringify(key)];
    public clear = () => this.cache = { };
}
