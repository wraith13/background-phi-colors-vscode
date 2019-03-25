import * as vscode from 'vscode';
import { phiColors } from 'phi-colors';

const getTicks = () => new Date().getTime();
const roundCenti = (value : number) : number => Math.round(value *100) /100;
const percentToDisplayString = (value : number, locales?: string | string[]) : string =>`${roundCenti(value).toLocaleString(locales, { style: "percent" })}`;

export module Profiler
{
    let profileScore: { [scope: string]: number } = { };
    let entryStack: ProfileEntry[] = [ ];
    let isProfiling = false;
    
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
                //console.log(`${"*".repeat(entryStack.length)} ${this.name} begin`);
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
                //console.log(`${"*".repeat(entryStack.length)} ${this.name} end`);
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
    };
    export const stop = () =>
    {
        isProfiling = false;
    };
    export const getReport = () =>
        Object.keys(profileScore)
            .map
            (
                name =>
                (
                    {
                        name,
                        ticks: profileScore[name]
                    }
                )
            )
            .sort((a, b) => b.ticks -a.ticks);

}

export module BackgroundPhiColors
{
    const applicationKey = "background-phi-colors";
    class Cache<keyT, valueT>
    {
        cache: { [key: string]: valueT } = { };
        public constructor(public loader: (key: keyT) => valueT)
        {

        }

        public get = (key: keyT): valueT => this.getCore(key, JSON.stringify(key));
        private getCore = (key: keyT, keyJson: string): valueT => undefined === this.cache[keyJson] ?
            (this.cache[keyJson] = this.loader(key)):
            this.cache[keyJson]
        public clear = () => this.cache = { };
    }
    class Config<valueT>
    {
        public constructor
        (
            public name: string,
            public defaultValue?: valueT,
            public minValue?: valueT,
            public maxValue?: valueT
        )
        {

        }

        cache = new Cache
        (
            (lang: string): valueT =>
            {
                const langSection = vscode.workspace.getConfiguration(`[${lang}]`);
                let result: valueT = <valueT>langSection[`${applicationKey}.${this.name}`];
                if (undefined === result)
                {
                    result = <valueT>vscode.workspace.getConfiguration(applicationKey)[this.name];
                    if (undefined === result)
                    {
                        if (undefined !== this.defaultValue)
                        {
                            result = this.defaultValue;
                        }
                    }
                }
                else
                if (undefined !== this.minValue && result < this.minValue)
                {
                    result = this.minValue;
                }
                else
                if (undefined !== this.maxValue && this.maxValue < result)
                {
                    result = this.maxValue;
                }
                return result;
            }
        );

        public get = this.cache.get;
        public clear = this.cache.clear;
    }
    
    const enabled = new Config("enabled", true);
    const enabledPanels = new Config("enabledPanels", true);
    const fileSizeLimit = new Config("fileSizeLimit", 100 *1024, 10 *1024, 10 *1024 *1024);
    const basicDelay = new Config("basicDelay", 10, 1, 1500);
    const additionalDelay = new Config("additionalDelay", 200, 50, 1500);
    const baseColor = new Config("baseColor", "#CC6666");
    //const spaceBaseColor = new Config("spaceBaseColor", <string | undefined>undefined);
    //const spaceErrorColor = new Config("spaceErrorColor", <string | undefined>undefined);
    //const symbolBaseColor = new Config("symbolBaseColor", <string | undefined>undefined);
    //const symbolColorMap = new Config("symbolColorMap", <string[]>[]);
    //const tokenBaseColor = new Config("tokenBaseColor", <string | undefined>undefined);
    //const tokenColorMap = new Config("tokenColorMap", <string[]>[]);
    const indentMode = new Config("indentMode", "full"); // "none", "light", "smart", "full"
    const tokenMode = new Config("tokenMode", "smart"); // "none", "light", "smart", "full"
    const indentErrorEnabled = new Config("indentErrorEnabled", true);
    const traillingSpacesErrorEnabled = new Config("traillingSpacesErrorEnabled", true);
    const bodySpacesEnabled = new Config("bodySpacesEnabled", true);
    const traillingSpacesEnabled = new Config("traillingSpacesEnabled", true);
    const symbolEnabled = new Config("symbolEnabled", false);
    const showIndentErrorInOverviewRulerLane = new Config("showIndentErrorInOverviewRulerLane", true);
    const showActiveTokenInOverviewRulerLane = new Config("showActiveTokenInOverviewRulerLane", true);
    const showTraillingSpacesErrorInOverviewRulerLane = new Config("showTraillingSpacesErrorInOverviewRulerLane", true);
    const spacesAlpha =new Config("spacesAlpha", 0x11, 0x00, 0xFF);
    const spacesActiveAlpha =new Config("spacesActiveAlpha", 0x33, 0x00, 0xFF);
    const spacesErrorAlpha =new Config("spacesErrorAlpha", 0x88, 0x00, 0xFF);
    const symbolAlpha =new Config("symbolAlpha", 0x44, 0x00, 0xFF);
    const tokenAlpha =new Config("tokenAlpha", 0x33, 0x00, 0xFF);
    const tokenActiveAlpha =new Config("tokenActiveAlpha", 0x66, 0x00, 0xFF);

    const isDecorated: { [fileName: string]: boolean } = { };
    const isOverTheLimit: { [fileName: string]: boolean } = { };
    const isLimitNoticed: { [fileName: string]: boolean } = { };
    let isPaused: { [fileName: string]: boolean } = { };
    let isPausedAll: boolean | undefined = false;
    let profilerOutputChannel: vscode.OutputChannel | undefined = undefined;
    const getProfilerOutputChannel = () => profilerOutputChannel ?
        profilerOutputChannel:
        (profilerOutputChannel = vscode.window.createOutputChannel("Background Phi Colors Profiler"));

    interface DecorationParam
    {
        name: string;
        base: phiColors.Hsla;
        hue: number;
        alpha: number;
        overviewRulerLane?: vscode.OverviewRulerLane;
    }
    interface DecorationEntry
    {
        startPosition: number;
        length: number;
        decorationParam: DecorationParam;
    }
    const makeIndentErrorDecorationParam = (lang: string) => makeHueDecoration("indenet:error", lang, -1, spacesErrorAlpha, showIndentErrorInOverviewRulerLane.get(lang) ? vscode.OverviewRulerLane.Left: undefined);
    const makeTrailingSpacesErrorDecorationParam = (lang: string) => makeHueDecoration("trailling-spaces", lang, -1, spacesErrorAlpha, showTraillingSpacesErrorInOverviewRulerLane.get(lang) ? vscode.OverviewRulerLane.Right: undefined);
    let decorations: { [decorationParamJson: string]: { decorator: vscode.TextEditorDecorationType, rangesOrOptions: vscode.Range[] } } = { };

    export const initialize = (context: vscode.ExtensionContext): void =>
    {
        context.subscriptions.push
        (
            //  コマンドの登録
            vscode.commands.registerCommand(`${applicationKey}.overTheLimig`, () => activeTextEditor(overTheLimit)),
            vscode.commands.registerCommand(`${applicationKey}.pause`, () => activeTextEditor(pause)),
            vscode.commands.registerCommand
            (
                `${applicationKey}.pauseAll`, () =>
                {
                    isPausedAll = undefined !== isPausedAll ?
                        !isPausedAll:
                        enabled.get("");
                    isPaused = { };
                    updateAllDecoration();
                }
            ),
            vscode.commands.registerCommand
            (
                `${applicationKey}.startProfile`, () =>
                {
                    const outputChannel = getProfilerOutputChannel();
                    outputChannel.show();
                    if (Profiler.getIsProfiling())
                    {
                        outputChannel.appendLine(`🚫 You have already started the profile.`);
                    }
                    else
                    {
                        outputChannel.appendLine(`⏱ Start Profile! - ${new Date()}`);
                        Profiler.start();
                    }
                }
            ),
            vscode.commands.registerCommand
            (
                `${applicationKey}.stopProfile`, () =>
                {
                    const outputChannel = getProfilerOutputChannel();
                    outputChannel.show();
                    if (Profiler.getIsProfiling())
                    {
                        Profiler.stop();
                        outputChannel.appendLine(`⏲ Stop Profile! - ${new Date()}`);
                        outputChannel.appendLine(`📊 Profile Report`);
                        const total = Profiler.getReport().map(i => i.ticks).reduce((p, c) => p +c);
                        outputChannel.appendLine(`- Total: ${total.toLocaleString()}ms ( ${percentToDisplayString(1)} )`);
                        Profiler.getReport().forEach(i => outputChannel.appendLine(`- ${i.name}: ${i.ticks.toLocaleString()}ms ( ${percentToDisplayString(i.ticks / total)} )`));
                    }
                    else
                    {
                        outputChannel.appendLine(`🚫 Profile has not been started.`);
                    }
                }
            ),

            //  イベントリスナーの登録
            vscode.workspace.onDidChangeConfiguration(() => onDidChangeConfiguration()),
            vscode.workspace.onDidChangeWorkspaceFolders(() => onDidChangeWorkspaceFolders()),
            vscode.workspace.onDidChangeTextDocument(event => onDidChangeTextDocument(event.document)),
            vscode.workspace.onDidCloseTextDocument((document) => onDidCloseTextDocument(document)),
            vscode.window.onDidChangeActiveTextEditor(() => onDidChangeActiveTextEditor()),
            vscode.window.onDidChangeTextEditorSelection(() => onDidChangeTextEditorSelection()),
        );

        updateAllDecoration();
    };

    const valueThen = <valueT>(value: valueT | undefined, f: (value: valueT) => void) =>
    {
        if (value)
        {
            f(value);
        }
    };
    const activeTextEditor = (f: (textEditor: vscode.TextEditor) => void) => valueThen(vscode.window.activeTextEditor, f);

    export const overTheLimit = (textEditor: vscode.TextEditor) =>
    {
        isOverTheLimit[textEditor.document.fileName] = true;
        delayUpdateDecoration(textEditor);
    };

    export const pause = (textEditor: vscode.TextEditor) =>
    {
        isPaused[textEditor.document.fileName] =
            undefined !== isPaused[textEditor.document.fileName] ?
                !isPaused[textEditor.document.fileName]:
                (
                    undefined !== isPausedAll ?
                        !isPausedAll:
                        enabled.get("")
                );
        delayUpdateDecoration(textEditor);
    };

    class DocumentDecorationCacheEntry
    {
        isDefaultIndentCharactorSpace: boolean = false;
        indentUnit: string = "";
        indentUnitSize: number = 0;
        indentLevelMap: { cursor: number, length: number }[][] = [];
    }
    const documentDecorationCache = new Map<vscode.TextDocument, DocumentDecorationCacheEntry>();

    class EditorDecorationCacheEntry
    {
        tabSize: number = 0;
        indentIndex: number = 0;
        strongTokens: string[] = [];
    }
    const editorDecorationCache = new Map<vscode.TextEditor, EditorDecorationCacheEntry>();

    export const clearAllDecorationCache = (): void =>
    {
        documentDecorationCache.clear();
        editorDecorationCache.clear();
    };
    export const clearDecorationCache = (document: vscode.TextDocument): void =>
    {
        documentDecorationCache.delete(document);
        for(const key of editorDecorationCache.keys())
        {
            if (document === key.document)
            {
                editorDecorationCache.delete(key);
            }
        }
    };


    export const onDidChangeConfiguration = (): void =>
    {
        [
            enabled,
            enabledPanels,
            fileSizeLimit,
            basicDelay,
            additionalDelay,
            baseColor,
            //spaceBaseColor,
            //spaceErrorColor,
            //symbolBaseColor,
            //symbolColorMap,
            //tokenBaseColor,
            //tokenColorMap,
            indentMode,
            tokenMode,
            indentErrorEnabled,
            traillingSpacesErrorEnabled,
            bodySpacesEnabled,
            traillingSpacesEnabled,
            symbolEnabled,
            showIndentErrorInOverviewRulerLane,
            showActiveTokenInOverviewRulerLane,
            showTraillingSpacesErrorInOverviewRulerLane,
            spacesAlpha,
            spacesActiveAlpha,
            spacesErrorAlpha,
            symbolAlpha,
            tokenAlpha,
            tokenActiveAlpha,
        ]
        .forEach(i => i.clear());

        Object.keys(decorations).forEach(i => decorations[i].decorator.dispose());
        decorations = { };

        clearAllDecorationCache();

        updateAllDecoration();
    };

    const lastUpdateStamp = new Map<vscode.TextEditor, number>();
    export const delayUpdateDecoration = (textEditor: vscode.TextEditor): void =>
    {
        const updateStamp = getTicks();
        lastUpdateStamp.set(textEditor, updateStamp);
        setTimeout
        (
            () =>
            {
                if (lastUpdateStamp.get(textEditor) === updateStamp)
                {
                    lastUpdateStamp.delete(textEditor);
                    updateDecoration(textEditor);
                }
            },
            basicDelay.get(textEditor.document.languageId) +
            (
                undefined === documentDecorationCache.get(textEditor.document) ?
                    additionalDelay.get(textEditor.document.languageId):
                    0
            )
        );
    };

    export const updateAllDecoration = () =>
        vscode.window.visibleTextEditors.forEach(i => delayUpdateDecoration(i));

    export const onDidChangeWorkspaceFolders = onDidChangeConfiguration;

    export const onDidChangeActiveTextEditor = (): void => activeTextEditor(delayUpdateDecoration);

    export const onDidCloseTextDocument = clearDecorationCache;

    export const onDidChangeTextDocument = (document: vscode.TextDocument): void =>
    {
        clearDecorationCache(document);
        vscode.window.visibleTextEditors
            .filter(i => i.document === document)
            .forEach(i => delayUpdateDecoration(i));
    };
    
    export const onDidChangeTextEditorSelection = () => activeTextEditor
    (
        textEditor =>
        {
            const lang = textEditor.document.languageId;
            if
            (
                [
                    indentMode,
                    tokenMode
                ]
                .map(i => i.get(lang))
                .some
                (
                    i =>
                    [
                        "none",
                        "light"
                    ]
                    .indexOf(i) < 0
                )
            )
            {
                delayUpdateDecoration(textEditor);
            }
        }
    );

    export const gcd = (a: number, b: number) : number => b ? gcd(b, a % b): a;

    export const getIndentSize = (text: string, tabSize: number): number =>
        text.replace(/\t/g, (s, offset) => s.repeat(tabSize -(offset %tabSize))).length;

    export const getIndentUnit =
    (
        indentSizeDistribution:{ [key: number]: number },
        tabSize: number,
        isDefaultIndentCharactorSpace: boolean
    ): string => Profiler.profile
    (
        "getIndentUnit", () =>
        {
            if (isDefaultIndentCharactorSpace)
            {
                let indentUnitSize = tabSize;
                if (0 < Object.keys(indentSizeDistribution).length)
                {
                    const sortedIndentSizeDistribution = Object.keys(indentSizeDistribution)
                        .map(key => parseInt(key))
                        .map(key => ({ indentSize: key, Count: indentSizeDistribution[key], }))
                        .sort((a, b) => b.Count -a.Count);
                    if (1 < sortedIndentSizeDistribution.length)
                    {
                        const failingLine = sortedIndentSizeDistribution[0].Count / 10;
                        const topIndentSizeDistribution = sortedIndentSizeDistribution.filter((i, index) => failingLine < i.Count && index < 10);
                        indentUnitSize = topIndentSizeDistribution.map(i => i.indentSize).reduce((a, b) => gcd(a, b));
                    }
                    else
                    {
                        indentUnitSize = sortedIndentSizeDistribution[0].indentSize;
                    }
                }
                return " ".repeat(indentUnitSize);
            }
            return "\t";
        }
    );
    
    const makeRange = (textEditor: vscode.TextEditor, startPosition: number, length: number) => new vscode.Range
    (
        textEditor.document.positionAt(startPosition),
        textEditor.document.positionAt(startPosition +length)
    );

    const inverseKeepUndefined = (v: boolean | undefined) => undefined === v ? v: !v;
    const updateDecoration = (textEditor: vscode.TextEditor) => Profiler.profile
    (
        "updateDecoration",
        () =>
        {
            const lang = textEditor.document.languageId;
            const text = textEditor.document.getText();
    
            //  clear
            Profiler.profile("updateDecoration.clear", () => Object.keys(decorations).forEach(i => decorations[i].rangesOrOptions = []));
    
            if
            (
                
                [
                    inverseKeepUndefined(isPaused[textEditor.document.fileName]),
                    inverseKeepUndefined(isPausedAll),
                    enabled.get(lang)
                ]
                .filter(i => undefined !== i)[0] &&
                (textEditor.viewColumn || enabledPanels.get(lang))
            )
            {
                if (false === isPaused[textEditor.document.fileName] || text.length <= fileSizeLimit.get(lang) || isOverTheLimit[textEditor.document.fileName])
                {
                    const currentDocumentDecorationCache = new DocumentDecorationCacheEntry();
                    const previousDocumentDecorationCache = documentDecorationCache.get(textEditor.document);
                    const currentEditorDecorationCache = new EditorDecorationCacheEntry();
                    const previousEditorDecorationCache = editorDecorationCache.get(textEditor);

                    const tabSize =
                        undefined !== previousEditorDecorationCache ?
                            previousEditorDecorationCache.tabSize:
                            (
                                undefined === textEditor.options.tabSize ?
                                4:
                                (
                                    "number" === typeof textEditor.options.tabSize ?
                                        textEditor.options.tabSize:
                                        parseInt(textEditor.options.tabSize)
                                )
                            );

                    currentEditorDecorationCache.tabSize = tabSize;
    
                    let entry: DecorationEntry[] = [];

                    //  update
                    entry = entry.concat
                    (
                        updateIndentDecoration
                        (
                            lang,
                            text,
                            textEditor,
                            tabSize,
                            currentDocumentDecorationCache,
                            previousDocumentDecorationCache,
                            currentEditorDecorationCache,
                            previousEditorDecorationCache
                        )
                    );
                    if ("none" !== tokenMode.get(lang))
                    {
                        const showActive = 0 <= ["smart", "full"].indexOf(tokenMode.get(lang));
                        const showRegular = 0 <= ["light", "full"].indexOf(tokenMode.get(lang));
                        currentEditorDecorationCache.strongTokens = showActive ?
                            regExpExecToArray
                            (
                                /\w+/gm,
                                textEditor.document
                                    .lineAt(textEditor.selection.active.line).text
                            )
                            .map(i => i[0]):
                            [];
                        
                        if
                        (
                            !previousEditorDecorationCache ||
                            (
                                showActive &&
                                (
                                    previousEditorDecorationCache.strongTokens.some(i => currentEditorDecorationCache.strongTokens.indexOf(i) < 0) ||
                                    currentEditorDecorationCache.strongTokens.some(i => previousEditorDecorationCache.strongTokens.indexOf(i) < 0)
                                )
                            )
                        )
                        {
                            entry = entry.concat
                            (
                                updateTokesDecoration
                                (
                                    lang,
                                    text,
                                    textEditor,
                                    tabSize,
                                    showRegular,
                                    currentEditorDecorationCache.strongTokens,
                                    undefined !== previousEditorDecorationCache ? previousEditorDecorationCache.strongTokens: undefined
                                )
                            );

                            if (previousEditorDecorationCache)
                            {
                                entry = entry.concat
                                (
                                    previousEditorDecorationCache.strongTokens
                                        .filter(i => currentEditorDecorationCache.strongTokens.indexOf(i) < 0)
                                        .map
                                        (
                                            i =>
                                            (
                                                {
                                                    startPosition: -1,
                                                    length: -1,
                                                    decorationParam: makeHueDecoration
                                                    (
                                                        `token:${i}`,
                                                        lang,
                                                        hash(i),
                                                        tokenActiveAlpha,
                                                        showActiveTokenInOverviewRulerLane.get(lang) ? vscode.OverviewRulerLane.Center: undefined,
                                                    )
                                                }
                                            )
                                        )
                                );
                                if (showRegular)
                                {
                                    entry = entry.concat
                                    (
                                        currentEditorDecorationCache.strongTokens
                                            .filter(i => previousEditorDecorationCache.strongTokens.indexOf(i) < 0)
                                            .map
                                            (
                                                i =>
                                                (
                                                    {
                                                        startPosition: -1,
                                                        length: -1,
                                                        decorationParam: makeHueDecoration
                                                        (
                                                            `token:${i}`,
                                                            lang,
                                                            hash(i),
                                                            tokenAlpha,
                                                        )
                                                    }
                                                )
                                            )
                                    );
                                }
                            }
                        }
                    }
                    if (!previousEditorDecorationCache && symbolEnabled.get(lang))
                    {
                        entry = entry.concat(updateSymbolsDecoration(lang, text, textEditor, tabSize));
                    }
                    if (!previousEditorDecorationCache && bodySpacesEnabled.get(lang))
                    {
                        entry = entry.concat(updateBodySpacesDecoration(lang, text, textEditor, tabSize));
                    }
                    if (!previousEditorDecorationCache && traillingSpacesEnabled.get(lang))
                    {
                        entry = entry.concat(updateTrailSpacesDecoration(lang, text, textEditor, tabSize, traillingSpacesErrorEnabled.get(lang)));
                    }

                    //  apply
                    Profiler.profile
                    (
                        "updateDecoration.apply(regular)", () =>
                        {
                            entry.forEach(i => addDecoration(textEditor, i));
                            const isToDecorate = 0 < entry.length; //Object.keys(decorations).some(i => 0 < decorations[i].rangesOrOptions.length);
                            if (isDecorated[textEditor.document.fileName] || isToDecorate)
                            {
                                const currentDecorations = entry.map(i => JSON.stringify(i.decorationParam));
                                Object.keys(decorations)
                                    .filter(i => 0 <= currentDecorations.indexOf(i))
                                    .map(i => decorations[i])
                                    .forEach
                                    (
                                        i => textEditor.setDecorations(i.decorator, i.rangesOrOptions)
                                    );
                                isDecorated[textEditor.document.fileName] = isToDecorate;
                            }
                        }
                    );
                    documentDecorationCache.set(textEditor.document, currentDocumentDecorationCache);
                    editorDecorationCache.set(textEditor, currentEditorDecorationCache);
                }
                else
                {
                    clearDecorationCache(textEditor.document);

                    if (!isLimitNoticed[textEditor.document.fileName])
                    {
                        isLimitNoticed[textEditor.document.fileName] = true;
                        vscode.window.showWarningMessage(`${textEditor.document.fileName} is too large! background-phi-colors has been disabled. But you can over the limit!`, "Close", "Over the limit").then
                        (
                            i =>
                            {
                                if ("Over the limit" === i)
                                {
                                    overTheLimit(textEditor);
                                }
                            }
                        );
                    }
                }
            }
            else
            {
                //  apply(for clear)
                Profiler.profile
                (
                    "updateDecoration.apply(clear)", () =>
                    {
                        const isToDecorate = Object.keys(decorations).some(i => 0 < decorations[i].rangesOrOptions.length);
                        if (isDecorated[textEditor.document.fileName] || isToDecorate)
                        {
                            Object.keys(decorations).map(i => decorations[i]).forEach
                            (
                                i => textEditor.setDecorations(i.decorator, i.rangesOrOptions)
                            );
                            isDecorated[textEditor.document.fileName] = isToDecorate;
                        }
                    }
                );
            }
        }
    );

    let hslaCache = new Cache((color: string) => phiColors.rgbaToHsla(phiColors.rgbaFromStyle(color)));
    export const makeHueDecoration =
    (
        name: string,
        lang: string,
        hue: number,
        alpha: Config<number>,
        overviewRulerLane?: vscode.OverviewRulerLane
    ) =>
    (
        {
            name,
            base: hslaCache.get(baseColor.get(lang)),
            hue: hue +1,
            alpha: alpha.get(lang),
            overviewRulerLane: overviewRulerLane,
        }
    );

    export const addDecoration = (textEditor: vscode.TextEditor, entry: DecorationEntry) =>
    {
        const key = JSON.stringify(entry.decorationParam);
        if (!decorations[key])
        {
            decorations[key] =
            {
                decorator: createTextEditorDecorationType
                (
                    phiColors.rgbForStyle
                    (
                        phiColors.hslaToRgba
                        (
                            phiColors.generate
                            (
                                entry.decorationParam.base,
                                entry.decorationParam.hue,
                                0,
                                0,
                                0
                            )
                        )
                    )
                    +((0x100 +entry.decorationParam.alpha).toString(16)).substr(1),
                    entry.decorationParam.overviewRulerLane,
                ),
                rangesOrOptions: []
            };
        }
        if (0 <= entry.length)
        {
            decorations[key].rangesOrOptions.push
            (
                makeRange
                (
                    textEditor,
                    entry.startPosition,
                    entry.length
                )
            );
        }
    };

    export const updateIndentDecoration =
    (
        lang: string,
        text: string,
        textEditor: vscode.TextEditor,
        tabSize: number,
        currentDocumentDecorationCache: DocumentDecorationCacheEntry,
        previousDocumentDecorationCache: DocumentDecorationCacheEntry | undefined,
        currentEditorDecorationCache: EditorDecorationCacheEntry,
        previousEditorDecorationCache: EditorDecorationCacheEntry | undefined
    ): DecorationEntry[] => Profiler.profile
    (
        "updateIndentDecoration", () =>
        {
            let result: DecorationEntry[] = [];
            const showActive = 0 <= ["smart", "full"].indexOf(indentMode.get(lang));
            const showRegular = 0 <= ["light", "full"].indexOf(indentMode.get(lang));
            if (showActive || showRegular)
            {
                const showIndentError = indentErrorEnabled.get(lang);
                const currentIndentSize = showActive ? getIndentSize
                    (
                        textEditor.document
                            .lineAt(textEditor.selection.active.line)
                            .text
                            .substr(0, textEditor.selection.active.character)
                            .replace(/[^ \t]+.*$/, ""
                        ),
                        tabSize
                    ):
                    -1;

                const indents: { index: number, text: string }[] = [];
                if (!previousEditorDecorationCache || !previousDocumentDecorationCache) // previousEditorDecorationCache があるのに previousDocumentDecorationCache がないという状況は存在しないハズなので本来的には || !previousDocumentDecorationCache は要らないがロジック上一応条件に含めておく
                {
                    Profiler.profile
                    (
                        "updateIndentDecoration.prescan",
                        () =>
                        regExpExecToArray
                        (
                            /^([ \t]+)([^\r\n]*)$/gm,
                            text
                        )
                        .forEach
                        (
                            match =>
                            {
                                indents.push
                                (
                                    {
                                        index: match.index,
                                        text: match[1]
                                    }
                                );
                            }
                        )
                    );
                }

                if (previousDocumentDecorationCache)
                {
                    Object.keys(previousDocumentDecorationCache).forEach(key => (<any>currentDocumentDecorationCache)[key] = (<any>previousDocumentDecorationCache)[key]);
                }
                else
                {
                    let totalSpaces = 0;
                    let totalTabs = 0;
                    const indentSizeDistribution:{ [key: number]: number } = { };
                    Profiler.profile
                    (
                        "updateIndentDecoration.scan",
                        () =>
                        indents.forEach
                        (
                            indent =>
                            {
                                const length = indent.text.length;
                                const tabs = indent.text.replace(/ /g, "").length;
                                const spaces = length -tabs;
                                totalSpaces += spaces;
                                totalTabs += tabs;
                                const indentSize = getIndentSize(indent.text, tabSize);
                                if (indentSizeDistribution[indentSize])
                                {
                                    ++indentSizeDistribution[indentSize];
                                }
                                else
                                {
                                    indentSizeDistribution[indentSize] = 1;
                                }
                            }
                        )
                    );
    
                    currentDocumentDecorationCache.isDefaultIndentCharactorSpace = totalTabs *tabSize <= totalSpaces;
                    currentDocumentDecorationCache.indentUnit = getIndentUnit(indentSizeDistribution, tabSize, currentDocumentDecorationCache.isDefaultIndentCharactorSpace);
                    currentDocumentDecorationCache.indentUnitSize = getIndentSize(currentDocumentDecorationCache.indentUnit, tabSize);
                }
                currentEditorDecorationCache.indentIndex = Math.floor(currentIndentSize /currentDocumentDecorationCache.indentUnitSize);
                const addIndentLevelMap = (cursor: number, length: number, indent: number) =>
                {
                    if (undefined === currentDocumentDecorationCache.indentLevelMap[indent])
                    {
                        currentDocumentDecorationCache.indentLevelMap[indent] = [];
                    }
                    currentDocumentDecorationCache.indentLevelMap[indent].push({ cursor, length });
                };
                const addIndentDecoration = (cursor: number, length: number, indent: number): DecorationEntry =>
                {
                    return {
                        startPosition: cursor,
                        length,
                        decorationParam: makeHueDecoration
                        (
                            `indent:${indent}`,
                            lang,
                            indent,
                            (currentEditorDecorationCache.indentIndex === indent) ? spacesActiveAlpha: spacesAlpha
                        )
                    };
                };
                const addErrorIndentDecoration = (cursor: number, length: number, indent: number): DecorationEntry =>
                (
                    {
                        startPosition: cursor,
                        length,
                        decorationParam: makeIndentErrorDecorationParam(lang)
                    }
                );
                if (previousEditorDecorationCache)
                {
                    if (showActive && previousEditorDecorationCache.indentIndex !== currentEditorDecorationCache.indentIndex)
                    {
                        result.push
                        (
                            {
                                startPosition: -1,
                                length: -1,
                                decorationParam: makeHueDecoration
                                (
                                    `indent:${previousEditorDecorationCache.indentIndex}`,
                                    lang,
                                    previousEditorDecorationCache.indentIndex,
                                    spacesActiveAlpha
                                )
                            }
                        );
                        result = result.concat
                        (
                            currentDocumentDecorationCache.indentLevelMap[currentEditorDecorationCache.indentIndex]
                                .map(i => addIndentDecoration(i.cursor, i.length, currentEditorDecorationCache.indentIndex))
                        );
                        if (showRegular)
                        {
                            result = result.concat
                            (
                                currentDocumentDecorationCache.indentLevelMap[previousEditorDecorationCache.indentIndex]
                                    .map(i => addIndentDecoration(i.cursor, i.length, previousEditorDecorationCache.indentIndex))
                            );
                            result.push
                            (
                                {
                                    startPosition: -1,
                                    length: -1,
                                    decorationParam: makeHueDecoration
                                    (
                                        `indent:${currentEditorDecorationCache.indentIndex}`,
                                        lang,
                                        currentEditorDecorationCache.indentIndex,
                                        spacesAlpha
                                    )
                                }
                            );
                        }
                    }
                }
                else
                {
                    Profiler.profile
                    (
                        "updateIndentDecoration.addDecoration",
                        () =>
                        {
                            indents.forEach
                            (
                                indent =>
                                {
                                    let text = indent.text;
                                    let cursor = indent.index;
                                    let length = 0;
                                    for(let i = 0; 0 < text.length; ++i)
                                    {
                                        cursor += length;
                                        if (text.startsWith(currentDocumentDecorationCache.indentUnit))
                                        {
                                            length = currentDocumentDecorationCache.indentUnit.length;
                                            addIndentLevelMap(cursor, length, i);
                                            text = text.substr(currentDocumentDecorationCache.indentUnit.length);
                                        }
                                        else
                                        {
                                            if (getIndentSize(text, tabSize) < currentDocumentDecorationCache.indentUnitSize)
                                            {
                                                length = text.length;
                                                if (showIndentError)
                                                {
                                                    result.push(addErrorIndentDecoration(cursor, length, i));
                                                }
                                                else
                                                {
                                                    addIndentLevelMap(cursor, length, i);
                                                }
                                                text = "";
                                            }
                                            else
                                            {
                                                if (currentDocumentDecorationCache.isDefaultIndentCharactorSpace)
                                                {
                                                    const spaces = text.length -text.replace(/^ +/, "").length;
                                                    if (0 < spaces)
                                                    {
                                                        length = spaces;
                                                        addIndentLevelMap(cursor, length, i);
                                                        cursor += length;
                                                    }
                                                    length = 1;
                                                    if (showIndentError)
                                                    {
                                                        result.push(addErrorIndentDecoration(cursor, length, i));
                                                    }
                                                    else
                                                    {
                                                        addIndentLevelMap(cursor, length, i);
                                                    }
                                                    const indentCount = Math.ceil(getIndentSize(text.substr(0, spaces +1), tabSize) /currentDocumentDecorationCache.indentUnitSize) -1;
                                                    i += indentCount;
                                                    text = text.substr(spaces +1);
                                                }
                                                else
                                                {
                                                    const spaces = Math.min(text.length -text.replace(/$ +/, "").length, currentDocumentDecorationCache.indentUnitSize);
                                                    length = spaces;
                                                    if (showIndentError)
                                                    {
                                                        result.push(addErrorIndentDecoration(cursor, length, i));
                                                    }
                                                    else
                                                    {
                                                        addIndentLevelMap(cursor, length, i);
                                                    }
                                                    text = text.substr(spaces);
                                                }
                                            }
                                        }
                                    }
                                }
                            );
                            result = result.concat
                            (
                                currentDocumentDecorationCache.indentLevelMap
                                    .map
                                    (
                                        (level, index) => showRegular || currentEditorDecorationCache.indentIndex === index ?
                                            level.map(i => addIndentDecoration(i.cursor, i.length, index)):
                                            []
                                    )
                                    .reduce((a, b) => a.concat(b))
                            );
                        }
                    );
                }
            }
            return result;
        }
    );

    export const regExpExecToArray = (regexp: RegExp, text: string) =>
    {
        const result: RegExpExecArray[] = [];
        while(true)
        {
            const match = regexp.exec(text);
            if (null === match)
            {
                break;
            }
            result.push(match);
        }
        return result;
    };

    export const updateSymbolsDecoration =
    (
        lang: string,
        text: string,
        textEditor: vscode.TextEditor,
        tabSize: number
    ): DecorationEntry[] => Profiler.profile
    (
        "updateSymbolsDecoration", () =>
        regExpExecToArray
        (
            /[\!\.\,\:\;\(\)\[\]\{\}\<\>\"\'\`\#\$\%\&\=\-\+\*\@\\\/\|\?\^\~"]/gm,
            text
        )
        .map
        (
            match =>
            (
                {
                    startPosition: match.index,
                    length: match[0].length,
                    decorationParam: makeHueDecoration
                    (
                        "symbols",
                        lang,
                        (
                            <{ [key: string]: number }>
                            {
                                "!": 1,
                                ".": 2,
                                ",": 3,
                                ":": 4,
                                ";": 5,
                                "(": 6,
                                ")": 6,
                                "[": 7,
                                "]": 7,
                                "{": 8,
                                "}": 8,
                                "<": 9,
                                ">": 9,
                                "\"": 10,
                                "\'": 11,
                                "\`": 12,
                                "\#": 13,
                                "\$": 14,
                                "\%": 15,
                                "\&": 16,
                                "\=": 17,
                                "\-": 18,
                                "\+": 19,
                                "\*": 20,
                                "\@": 21,
                                "\\": 22,
                                "\/": 23,
                                "\|": 24,
                                "\?": 25,
                                "\^": 26,
                                "\~": 27,
                            }
                        )[match[0]],
                        symbolAlpha
                    )
                }
            )
        )
    );
    export const hash = (source: string): number =>
        source.split("").map(i => i.codePointAt(0) || 0).reduce((a, b) => a *719 +b)
        %34; // ← 通常、こういうところの数字は素数にすることが望ましいがここについては https://wraith13.github.io/phi-ratio-coloring/phi-ratio-coloring.htm で類似色の出てくる周期をベース(8,13,21,...)に調整すること。
    export const updateTokesDecoration =
    (
        lang: string,
        text: string,
        textEditor: vscode.TextEditor,
        tabSize: number,
        showRegular: boolean,
        strongTokens: string[],
        previousStrongTokens?: string[]
    ): DecorationEntry[] => Profiler.profile
    (
        "updateTokesDecoration", () =>
        regExpExecToArray
        (
            /\w+/gm,
            text
        )
        .filter
        (
            match =>
                undefined === previousStrongTokens ||
                (
                    (0 <= previousStrongTokens.indexOf(match[0])) !== (0 <= strongTokens.indexOf(match[0])) 
                )
        )
        .map
        (
            match =>
            (
                {
                    index: match.index,
                    token: match[0],
                    isActive: 0 <= strongTokens.indexOf(match[0])
                }
            )
        )
        .filter(i => showRegular || i.isActive)
        .map
        (
            i =>
            (
                {
                    startPosition: i.index,
                    length: i.token.length,
                    decorationParam: makeHueDecoration
                    (
                        `token:${i.token}`,
                        lang,
                        hash(i.token),
                        i.isActive ? tokenActiveAlpha: tokenAlpha,
                        i.isActive && showActiveTokenInOverviewRulerLane.get(lang) ? vscode.OverviewRulerLane.Center: undefined,
                    )
                }
            )
        )
    );
    export const updateBodySpacesDecoration =
    (
        lang: string,
        text: string,
        textEditor: vscode.TextEditor,
        tabSize: number
    ): DecorationEntry[] => Profiler.profile
    (
        "updateBodySpacesDecoration", () =>
        regExpExecToArray
        (
            /^([ \t]*)([^ \t\r\n]+)([^\r\n]+)([^ \t\r\n]+)([ \t]*)$/gm,
            text
        )
        .map
        (
            prematch => regExpExecToArray
            (
                / {2,}|\t+/gm,
                prematch[3]
            )
            .map
            (
                match =>
                (
                    {
                        startPosition: prematch.index +prematch[1].length +prematch[2].length +match.index,
                        length: match[0].length,
                        decorationParam: makeHueDecoration
                        (
                            "body-spaces",
                            lang,
                            match[0].startsWith("\t") ?
                                //  tabs
                                ((match[0].length *tabSize) -((prematch[1].length +prematch[2].length +match.index) %tabSize)) -1:
                                //  spaces
                                match[0].length -1,
                            spacesActiveAlpha
                        )
                    }
                )
            )
        )
        .reduce((a, b) => a.concat(b))
    );
    export const updateTrailSpacesDecoration =
    (
        lang: string,
        text: string,
        textEditor: vscode.TextEditor,
        tabSize: number,
        showError: boolean
    ): DecorationEntry[] => Profiler.profile
    (
        "updateTrailSpacesDecoration", () =>
        regExpExecToArray
        (
            /^([^\r\n]*[^ \t\r\n]+)([ \t]+)$/gm,
            text
        )
        .map
        (
            match =>
            (
                {
                    startPosition: match.index +match[1].length,
                    length: match[2].length,
                    decorationParam: showError ?
                        makeTrailingSpacesErrorDecorationParam(lang):
                        makeHueDecoration("trailling-spaces", lang, match[2].length, spacesAlpha)
                }
            )
        )
    );

    export const createTextEditorDecorationType =
    (
        backgroundColor: string,
        overviewRulerLane?: vscode.OverviewRulerLane
    ) => vscode.window.createTextEditorDecorationType
    (
        {
            backgroundColor: backgroundColor,
            overviewRulerColor: undefined !== overviewRulerLane ? backgroundColor: undefined,
            overviewRulerLane: overviewRulerLane,
        }
    );
}

export function activate(context: vscode.ExtensionContext): void
{
    BackgroundPhiColors.initialize(context);
}

export function deactivate(): void
{
}

//  for sample

    /*
     *
     * EXACTLY WRONG INDENT
     *
     */
    
    //    body spaces

    // trailling spaces        

