const getTicks = () => new Date().getTime();
let profileScore: { [scope: string]: number } = { };
let entryStack: ProfileEntry[] = [ ];
let isProfiling = false;
let startAt = 0;
let endAt = 0;
let debugCount = 0;
export class ProfileEntry
{
    startTicks: number;
    childrenTicks: number;
    public constructor(public name: string)
    {
        this.childrenTicks = 0;
        if (isProfiling)
        {
            this.startTicks = getTicks();
            entryStack.push(this);
            if (this.name.startsWith("DEBUG:"))
            {
                ++debugCount;
            }
            debug(`${"*".repeat(entryStack.length)} ${this.name} begin`);
        }
        else
        {
            this.startTicks = 0;
        }
    }
    public end()
    {
        if (0 !== this.startTicks)
        {
            debug(`${"*".repeat(entryStack.length)} ${this.name} end`);
            if (this.name.startsWith("DEBUG:"))
            {
                --debugCount;
            }
            const wholeTicks = getTicks() -this.startTicks;
            if (undefined === profileScore[this.name])
            {
                profileScore[this.name] = 0;
            }
            profileScore[this.name] += wholeTicks -this.childrenTicks;
            entryStack.pop();
            if (0 < entryStack.length)
            {
                entryStack[entryStack.length -1].childrenTicks += wholeTicks;
            }
        }
    }
}
export const profile = <ResultT>(name: string, target: ()=>ResultT): ResultT =>
{
    const entry = new ProfileEntry(name);
    try
    {
        return target();
    }
    catch(error) // 現状(VS Code v1.32.3)、こうしておかないとデバッグコンソールに例外情報が出力されない為の処置。
    {
        console.error(`Exception at: ${name}`);
        console.error(error);
        throw error; // ※この再送出により外側のこの関数で再び catch し重複してエラーが出力されることに注意。
    }
    finally
    {
        entry.end();
    }
};
export const getIsProfiling = () => isProfiling;
export const start = () =>
{
    isProfiling = true;
    profileScore = { };
    entryStack = [ ];
    startAt = getTicks();
};
export const stop = () =>
{
    isProfiling = false;
    endAt = getTicks();
};
export const getOverall = () => (isProfiling ? getTicks(): endAt) - startAt;
export const getReport = () =>
    Object.keys(profileScore)
        .map
        (
            name =>
            ({
                name,
                ticks: profileScore[name]
            })
        )
        .sort((a, b) => b.ticks -a.ticks);
export const debug = (text: string, object?: any) =>
{
    if (0 < debugCount)
    {
        if (undefined !== object)
        {
            console.log(text);
        }
        else
        {
            console.log(`${text}: ${JSON.stringify(object)}`);
        }
    }
};
