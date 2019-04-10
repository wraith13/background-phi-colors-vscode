import * as vscode from 'vscode';
import { phiColors } from 'phi-colors';

const getTicks = () => new Date().getTime();
const roundCenti = (value : number) : number => Math.round(value *100) /100;
const percentToDisplayString = (value : number, locales?: string | string[]) : string =>`${roundCenti(value).toLocaleString(locales, { style: "percent" })}`;
const isCompatibleArray = <valueT>(a: valueT[], b:valueT[]) =>
    !a.some(i => b.indexOf(i) < 0) &&
    !b.some(i => a.indexOf(i) < 0);
const objctToMap = <valueT>(object: {[key:string]: valueT }) => new Map<string, valueT>(Object.keys(object).map(key => [key, object[key]]));

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
            public defaultValue: valueT,
            public validator?: (value: valueT) => boolean,
            public minValue?: valueT,
            public maxValue?: valueT
        )
        {

        }

        regulate = (rawKey: string, value: valueT): valueT =>
        {
            let result = value;
            if (this.validator && !this.validator(result))
            {
                // settings.json をテキストとして直接編集してる時はともかく GUI での編集時に無駄にエラー表示が行われてしまうので、エンドユーザーに対するエラー表示は行わない。
                //vscode.window.showErrorMessage(`${rawKey} setting value is invalid! Please check your settings.`);
                console.error(`${rawKey} setting value is invalid! Please check your settings.`);
                result = this.defaultValue;
            }
            else
            {
                if (undefined !== this.minValue && result < this.minValue)
                {
                    result = this.minValue;
                }
                else
                if (undefined !== this.maxValue && this.maxValue < result)
                {
                    result = this.maxValue;
                }
            }
            return result;
        }

        cache = new Cache
        (
            (lang: string): valueT =>
            {
                let result: valueT;
                if (undefined === lang || null === lang || 0 === lang.length)
                {
                    result = <valueT>vscode.workspace.getConfiguration(applicationKey)[this.name];
                    if (undefined === result)
                    {
                        result = this.defaultValue;
                    }
                    else
                    {
                        result = this.regulate(`${applicationKey}.${this.name}`, result);
                    }
                }
                else
                {
                    const langSection = vscode.workspace.getConfiguration(`[${lang}]`, null);
                    result = <valueT>langSection[`${applicationKey}.${this.name}`];
                    if (undefined === result)
                    {
                        result = this.get("");
                    }
                    else
                    {
                        result = this.regulate(`[${lang}].${applicationKey}.${this.name}`, result);
                    }
                }
                return result;
            }
        );

        public get = this.cache.get;
        public clear = this.cache.clear;
    }
    
    const colorValidator = (value: string) => /^#[0-9A-Fa-f]{6}$/.test(value);
    const colorOrNullValidator = (value: string | null) => null === value || colorValidator(value);
    const colorMapValidator = (value: {[key: string]: string}) =>
        undefined !== value &&
        null !== value &&
        !Object.keys(value).some(key => !colorOrNullValidator(value[key]));
    const makeEnumValidator = (valueList: string[]): (value: string) => boolean => (value: string) => 0 <= valueList.indexOf(value);

    const indentModeObject = Object.freeze({ "none": null, "light": null, "smart": null, "full": null, });
    const tokenModeObject = Object.freeze ({ "none": null, "light": null, "smart": null, "full": null, });
    const activeScopeObject = Object.freeze ({ "editor": null, "document": null, "window": null, });

    const enabled = new Config("enabled", true);
    const enabledPanels = new Config("enabledPanels", false);
    const fileSizeLimit = new Config("fileSizeLimit", 100 *1024, undefined, 10 *1024, 10 *1024 *1024);
    const basicDelay = new Config("basicDelay", 10, undefined, 1, 1500);
    const additionalDelay = new Config("additionalDelay", 200, undefined, 50, 1500);
    const baseColor = new Config("baseColor", "#5679C9", colorValidator);
    const spaceBaseColor = new Config("spaceBaseColor", <string | null>null, colorOrNullValidator);
    const spaceErrorColor = new Config("spaceErrorColor", "#DD4444", colorValidator);
    const symbolBaseColor = new Config("symbolBaseColor", <string | null>null, colorOrNullValidator);
    const symbolColorMap = new Config("symbolColorMap", <{[key: string]: string}>{}, colorMapValidator);
    const tokenBaseColor = new Config("tokenBaseColor", <string | null>null, colorOrNullValidator);
    const tokenColorMap = new Config("tokenColorMap", <{[key: string]: string}>{}, colorMapValidator);
    const indentMode = new Config<keyof typeof indentModeObject>("indentMode", "full", makeEnumValidator(Object.keys(indentModeObject)));
    const lineEnabled = new Config("lineEnabled", true);
    const tokenMode = new Config<keyof typeof tokenModeObject>("tokenMode", "smart", makeEnumValidator(Object.keys(tokenModeObject)));
    const activeScope = new Config<keyof typeof activeScopeObject>("activeScope", "editor", makeEnumValidator(Object.keys(activeScopeObject)));
    const indentErrorEnabled = new Config("indentErrorEnabled", true);
    const trailingSpacesErrorEnabled = new Config("trailingSpacesErrorEnabled", true);
    const bodySpacesEnabled = new Config("bodySpacesEnabled", true);
    const trailingSpacesEnabled = new Config("trailingSpacesEnabled", true);
    const symbolEnabled = new Config("symbolEnabled", false);
    const showIndentErrorInOverviewRulerLane = new Config("showIndentErrorInOverviewRulerLane", true);
    const showActiveTokenInOverviewRulerLane = new Config("showActiveTokenInOverviewRulerLane", true);
    const showTrailingSpacesErrorInOverviewRulerLane = new Config("showTrailingSpacesErrorInOverviewRulerLane", true);
    const spacesAlpha =new Config("spacesAlpha", 0x11, undefined, 0x00, 0xFF);
    const spacesActiveAlpha =new Config("spacesActiveAlpha", 0x33, undefined, 0x00, 0xFF);
    const spacesErrorAlpha =new Config("spacesErrorAlpha", 0x88, undefined, 0x00, 0xFF);
    const symbolAlpha =new Config("symbolAlpha", 0x44, undefined, 0x00, 0xFF);
    const tokenAlpha =new Config("tokenAlpha", 0x33, undefined, 0x00, 0xFF);
    const tokenActiveAlpha =new Config("tokenActiveAlpha", 0x66, undefined, 0x00, 0xFF);

    const isDecorated: { [fileName: string]: boolean } = { };
    const isOverTheLimit: { [fileName: string]: boolean } = { };
    const isLimitNoticed: { [fileName: string]: boolean } = { };
    let isPausedAll: boolean = false;
    let profilerOutputChannel: vscode.OutputChannel | undefined = undefined;
    const getProfilerOutputChannel = () => profilerOutputChannel ?
        profilerOutputChannel:
        (profilerOutputChannel = vscode.window.createOutputChannel("Background Phi Colors Profiler"));
    let mapCache = new Cache((object: {[key:string]: string }) => object ? objctToMap(object): new Map());

    interface DecorationParam
    {
        name: string;
        base: phiColors.Hsla;
        hue: number;
        alpha: number;
        overviewRulerLane?: vscode.OverviewRulerLane;
        isWholeLine?: boolean;
    }
    interface DecorationEntry
    {
        range?: vscode.Range;
        startPosition: number;
        length: number;
        decorationParam: DecorationParam;
    }
    let hslaCache = new Cache((color: string) => phiColors.rgbaToHsla(phiColors.rgbaFromStyle(color)));
    export const makeHueDecoration =
    (
        name: string,
        lang: string,
        color: Config<string | null>,
        hue: string | number,
        alpha: Config<number>,
        overviewRulerLane?: vscode.OverviewRulerLane,
        isWholeLine?: boolean
    ) =>
    (
        {
            name,
            base: hslaCache.get
            (
                "number" === typeof hue ?
                    color.get(lang) || baseColor.get(lang):
                    hue
            ),
            hue: "number" === typeof hue ? hue: 0,
            alpha: alpha.get(lang),
            overviewRulerLane: overviewRulerLane,
            isWholeLine,
        }
    );

    const makeIndentErrorDecorationParam = (lang: string) =>
    (
        {
            name: "indenet:error",
            base: hslaCache.get(spaceErrorColor.get(lang)),
            hue: 0,
            alpha: spacesErrorAlpha.get(lang),
            overviewRulerColor: showIndentErrorInOverviewRulerLane.get(lang) ? vscode.OverviewRulerLane.Left: undefined,
        }
    );
    const makeTrailingSpacesErrorDecorationParam = (lang: string) =>
    (
        {
            name: "trailing-spaces",
            base: hslaCache.get(spaceErrorColor.get(lang)),
            hue: 0,
            alpha: spacesErrorAlpha.get(lang),
            overviewRulerColor: showTrailingSpacesErrorInOverviewRulerLane.get(lang) ? vscode.OverviewRulerLane.Right: undefined,
        }
    );
    let decorations: { [decorationParamJson: string]: { decorator: vscode.TextEditorDecorationType, rangesOrOptions: vscode.Range[] } } = { };

    export const initialize = (context: vscode.ExtensionContext): void =>
    {
        context.subscriptions.push
        (
            //  コマンドの登録
            vscode.commands.registerCommand
            (
                `${applicationKey}.activeScopeEditor`,
                () => vscode.workspace.getConfiguration(applicationKey).update("activeScope", "editor", true)
            ),
            vscode.commands.registerCommand
            (
                `${applicationKey}.activeScopeDocument`,
                () => vscode.workspace.getConfiguration(applicationKey).update("activeScope", "document", true)
            ),
            vscode.commands.registerCommand
            (
                `${applicationKey}.activeScopeWindow`,
                () => vscode.workspace.getConfiguration(applicationKey).update("activeScope", "window", true)
            ),
            vscode.commands.registerCommand(`${applicationKey}.overTheLimig`, () => activeTextEditor(overTheLimit)),
            vscode.commands.registerCommand(`${applicationKey}.pause`, () => activeTextEditor(pause)),
            vscode.commands.registerCommand
            (
                `${applicationKey}.pauseAll`, () =>
                {
                    isPausedAll = !isPausedAll;
                    editorDecorationCache.forEach(i => i.isPaused = undefined);
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
        const currentEditorDecorationCache = editorDecorationCache.get(textEditor);
        if (currentEditorDecorationCache)
        {
            currentEditorDecorationCache.isPaused =
                undefined === currentEditorDecorationCache.isPaused ?
                    !isPausedAll:
                    !currentEditorDecorationCache.isPaused;
            if (!currentEditorDecorationCache.isPaused)
            {
                delayUpdateDecoration(textEditor);
            }
        }
    };

    const isIndentInfoNeed = (lang: string) =>
    {
        const showActive = 0 <= ["smart", "full"].indexOf(indentMode.get(lang));
        const showRegular = 0 <= ["light", "full"].indexOf(indentMode.get(lang));
        return showActive || showRegular || lineEnabled.get(lang);
    };

    const windowDecorationCache =
    {
        strongTokens: <string[]>[],
    };

    class DocumentDecorationCacheEntry
    {
        isDefaultIndentCharactorSpace: boolean = false;
        indentUnit: string = "";
        indentUnitSize: number = 0;
        indentLevelMap: { cursor: number, length: number }[][] = [[]];
        indents: { index: number, text: string }[] = []; // これをここに持っておくのはメモリの消費量的には避けたいところだが、どうせタブ切り替えの度に必要になり、削ったところであまり意味のあるメモリ節約にならないのでキャッシュしておく。
        strongTokens: string[] = [];

        public constructor(lang: string, text: string, tabSize: number)
        {
            Profiler.profile
            (
                "DocumentDecorationCacheEntry.constructor",
                () =>
                {
                    if (isIndentInfoNeed(lang))
                    {
                        let totalSpaces = 0;
                        let totalTabs = 0;
                        const indentSizeDistribution:{ [key: number]: number } = { };
                        this.indents = getIndents(text);
                        this.indents.forEach
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
                        );
                        this.isDefaultIndentCharactorSpace = totalTabs *tabSize <= totalSpaces;
                        this.indentUnit = getIndentUnit(indentSizeDistribution, tabSize, this.isDefaultIndentCharactorSpace);
                        this.indentUnitSize = getIndentSize(this.indentUnit, tabSize);
                    }
                }
            );
        }
    }
    const documentDecorationCache = new Map<vscode.TextDocument, DocumentDecorationCacheEntry>();

    class EditorDecorationCacheEntry
    {
        tabSize: number = 0;
        indentIndex: number | undefined = 0;
        selection: vscode.Selection;
        line: vscode.TextLine | undefined;
        strongTokens: string[] = [];
        isPaused: boolean | undefined;

        public constructor
        (
            textEditor: vscode.TextEditor,
            tabSize: number,
            currentDocumentDecorationCache: DocumentDecorationCacheEntry,
            previousEditorDecorationCache? :EditorDecorationCacheEntry
        )
        {
            this.selection = textEditor.selection;
            this.line = textEditor.document.lineAt(textEditor.selection.active.line);
            this.tabSize = tabSize;
            const isActiveTextEditor = vscode.window.activeTextEditor === textEditor;
            if (isIndentInfoNeed(textEditor.document.languageId) && (isActiveTextEditor || "editor" === activeScope.get("")))
            {
                const currentIndentSize = getIndentSize
                    (
                        this.line
                            .text
                            .substr(0, textEditor.selection.active.character)
                            .replace(/[^ \t]+.*$/, ""
                        ),
                        tabSize
                    );

                this.indentIndex = Math.floor(currentIndentSize /currentDocumentDecorationCache.indentUnitSize);
            }
            else
            {
                this.indentIndex = undefined;
                this.line = undefined;
            }
            if (previousEditorDecorationCache)
            {
                this.isPaused = previousEditorDecorationCache.isPaused;
            }
        }

        getLineNumber = () => undefined !== this.line ? this.line.lineNumber: undefined;
    }
    const editorDecorationCache = new Map<vscode.TextEditor, EditorDecorationCacheEntry>();

    export const clearAllDecorationCache = (): void =>
    {
        windowDecorationCache.strongTokens = [];
        documentDecorationCache.clear();
        editorDecorationCache.clear();
    };
    export const clearDecorationCache = (document?: vscode.TextDocument): void =>
    {
        if (document)
        {
            documentDecorationCache.delete(document);
            for(const textEditor of editorDecorationCache.keys())
            {
                if (document === textEditor.document)
                {
                    editorDecorationCache.delete(textEditor);
                }
            }
        }
        else
        {
            for(const textEditor of editorDecorationCache.keys())
            {
                if (vscode.window.visibleTextEditors.indexOf(textEditor) < 0)
                {
                    editorDecorationCache.delete(textEditor);
                }
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
            spaceBaseColor,
            spaceErrorColor,
            symbolBaseColor,
            symbolColorMap,
            tokenBaseColor,
            tokenColorMap,
            indentMode,
            lineEnabled,
            tokenMode,
            activeScope,
            indentErrorEnabled,
            trailingSpacesErrorEnabled,
            bodySpacesEnabled,
            trailingSpacesEnabled,
            symbolEnabled,
            showIndentErrorInOverviewRulerLane,
            showActiveTokenInOverviewRulerLane,
            showTrailingSpacesErrorInOverviewRulerLane,
            spacesAlpha,
            spacesActiveAlpha,
            spacesErrorAlpha,
            symbolAlpha,
            tokenAlpha,
            tokenActiveAlpha,
        ]
        .forEach(i => i.clear());

        mapCache.clear();

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

    export const onDidChangeActiveTextEditor = (): void =>
    {
        clearDecorationCache();
        activeTextEditor(delayUpdateDecoration);
    };

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

    const updateDecoration = (textEditor: vscode.TextEditor) => Profiler.profile
    (
        "updateDecoration",
        () =>
        {
            const lang = textEditor.document.languageId;
            const text = textEditor.document.getText();
            const isActiveTextEditor = vscode.window.activeTextEditor === textEditor;
            const previousEditorDecorationCache = editorDecorationCache.get(textEditor);
            const isPaused = previousEditorDecorationCache &&
                (undefined === previousEditorDecorationCache.isPaused ? isPausedAll: previousEditorDecorationCache.isPaused);
            const isEnabled = enabled.get(lang) && (textEditor.viewColumn || enabledPanels.get(lang));

            //  clear
            Profiler.profile("updateDecoration.clear", () => Object.keys(decorations).forEach(i => decorations[i].rangesOrOptions = []));
    
            if (isEnabled && !isPaused)
            {
                if (text.length <= fileSizeLimit.get(lang) || isOverTheLimit[textEditor.document.fileName])
                {
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
                    const currentDocumentDecorationCache = documentDecorationCache.get(textEditor.document) || new DocumentDecorationCacheEntry(lang, text, tabSize);
                    const currentEditorDecorationCache = new EditorDecorationCacheEntry(textEditor, tabSize, currentDocumentDecorationCache, previousEditorDecorationCache);

                    let entry: DecorationEntry[] = [];

                    //  update
                    entry = entry.concat
                    (
                        updateIndentDecoration
                        (
                            lang,
                            text,
                            textEditor,
                            currentDocumentDecorationCache,
                            currentEditorDecorationCache,
                            previousEditorDecorationCache
                        )
                    );
                    if (lineEnabled.get(lang))
                    {
                        entry = entry.concat
                        (
                            updateLineDecoration
                            (
                                lang,
                                text,
                                textEditor,
                                currentDocumentDecorationCache,
                                currentEditorDecorationCache,
                                previousEditorDecorationCache
                            )
                        );
                    }
                    if ("none" !== tokenMode.get(lang))
                    {
                        const showActive = 0 <= ["smart", "full"].indexOf(tokenMode.get(lang));
                        const showRegular = 0 <= ["light", "full"].indexOf(tokenMode.get(lang));
                        if (showActive)
                        {
                            if (isActiveTextEditor || "editor" === activeScope.get(""))
                            {
                                currentEditorDecorationCache.strongTokens = regExpExecToArray
                                (
                                    /\w+/gm,
                                    textEditor.document
                                        .lineAt(textEditor.selection.active.line).text
                                )
                                .map(i => i[0]);
                                switch(activeScope.get(""))
                                {
                                case "editor":
                                    //currentEditorDecorationCache.strongTokens = currentEditorDecorationCache.strongTokens;
                                    break;
                                case "document":
                                    if (!isCompatibleArray(currentEditorDecorationCache.strongTokens, currentDocumentDecorationCache.strongTokens))
                                    {
                                        currentDocumentDecorationCache.strongTokens = currentEditorDecorationCache.strongTokens;
                                        vscode.window.visibleTextEditors.filter(i => textEditor !== i && textEditor.document === i.document).forEach(i => delayUpdateDecoration(i));
                                    }
                                    break;
                                case "window":
                                    if (!isCompatibleArray(currentEditorDecorationCache.strongTokens, windowDecorationCache.strongTokens))
                                    {
                                        windowDecorationCache.strongTokens = currentEditorDecorationCache.strongTokens;
                                        vscode.window.visibleTextEditors.filter(i => textEditor !== i).forEach(i => delayUpdateDecoration(i));
                                    }
                                    break;
                                }
                            }
                            else
                            {
                                switch(activeScope.get(""))
                                {
                                case "editor":
                                    //currentEditorDecorationCache.strongTokens = currentEditorDecorationCache.strongTokens;
                                    break;
                                case "document":
                                    currentEditorDecorationCache.strongTokens = currentDocumentDecorationCache.strongTokens;
                                    break;
                                case "window":
                                    currentEditorDecorationCache.strongTokens = windowDecorationCache.strongTokens;
                                    break;
                                }
                            }
                        }
                        else
                        {
                            currentEditorDecorationCache.strongTokens = [];
                        }
                        
                        if
                        (
                            !previousEditorDecorationCache ||
                            (
                                showActive &&
                                !isCompatibleArray(currentEditorDecorationCache.strongTokens, previousEditorDecorationCache.strongTokens)
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
                                    mapCache.get(tokenColorMap.get(lang)),
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
                                                        tokenBaseColor,
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
                                                            tokenBaseColor,
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
                        entry = entry.concat(updateSymbolsDecoration(lang, text, textEditor, tabSize, mapCache.get(symbolColorMap.get(lang))));
                    }
                    if (!previousEditorDecorationCache && bodySpacesEnabled.get(lang))
                    {
                        entry = entry.concat(updateBodySpacesDecoration(lang, text, textEditor, tabSize));
                    }
                    if (!previousEditorDecorationCache && trailingSpacesEnabled.get(lang))
                    {
                        entry = entry.concat(updateTrailSpacesDecoration(lang, text, textEditor, tabSize, trailingSpacesErrorEnabled.get(lang)));
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
                                    .filter(i => !previousEditorDecorationCache || 0 <= currentDecorations.indexOf(i))
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
            if (!isEnabled)
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
                    entry.decorationParam.isWholeLine
                ),
                rangesOrOptions: []
            };
        }
        if (0 <= entry.length)
        {
            decorations[key].rangesOrOptions.push
            (
                entry.range ||
                makeRange
                (
                    textEditor,
                    entry.startPosition,
                    entry.length
                )
            );
        }
    };

    export const getIndents = (text: string)=> Profiler.profile
    (
        "getIndents",
        () =>
        regExpExecToArray
        (
            /^([ \t]+)([^\r\n]*)$/gm,
            text
        )
        .map
        (
            match =>
            (
                {
                    index: match.index,
                    text: match[1]
                }
            )
        )
    );

    export const updateIndentDecoration =
    (
        lang: string,
        text: string,
        textEditor: vscode.TextEditor,
        currentDocumentDecorationCache: DocumentDecorationCacheEntry,
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
                const addIndentDecoration = (cursor: number, length: number, indent: number): DecorationEntry =>
                {
                    return {
                        startPosition: cursor,
                        length,
                        decorationParam: makeHueDecoration
                        (
                            `indent:${indent}`,
                            lang,
                            spaceBaseColor,
                            indent,
                            (showActive && currentEditorDecorationCache.indentIndex === indent) ? spacesActiveAlpha: spacesAlpha
                        )
                    };
                };
                if (previousEditorDecorationCache)
                {
                    if (showActive && previousEditorDecorationCache.indentIndex !== currentEditorDecorationCache.indentIndex)
                    {
                        if (undefined !== previousEditorDecorationCache.indentIndex)
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
                                        spaceBaseColor,
                                        previousEditorDecorationCache.indentIndex,
                                        spacesActiveAlpha
                                    )
                                }
                            );
                        }
                        if (undefined !== currentEditorDecorationCache.indentIndex && currentDocumentDecorationCache.indentLevelMap[currentEditorDecorationCache.indentIndex])
                        {
                            const indentIndex = currentEditorDecorationCache.indentIndex;
                            result = result.concat
                            (
                                currentDocumentDecorationCache.indentLevelMap[currentEditorDecorationCache.indentIndex]
                                    .map(i => addIndentDecoration(i.cursor, i.length, indentIndex))
                            );
                        }
                        if (showRegular)
                        {
                            if (undefined !== previousEditorDecorationCache.indentIndex && currentDocumentDecorationCache.indentLevelMap[previousEditorDecorationCache.indentIndex])
                            {
                                const indentIndex = previousEditorDecorationCache.indentIndex;
                                result = result.concat
                                (
                                    currentDocumentDecorationCache.indentLevelMap[previousEditorDecorationCache.indentIndex]
                                        .map(i => addIndentDecoration(i.cursor, i.length, indentIndex))
                                );
                            }
                            if (undefined !== currentEditorDecorationCache.indentIndex)
                            {
                                result.push
                                (
                                    {
                                        startPosition: -1,
                                        length: -1,
                                        decorationParam: makeHueDecoration
                                        (
                                            `indent:${currentEditorDecorationCache.indentIndex}`,
                                            lang,
                                            spaceBaseColor,
                                            currentEditorDecorationCache.indentIndex,
                                            spacesAlpha
                                        )
                                    }
                                );
                            }
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
                            const showIndentError = indentErrorEnabled.get(lang);
                            const addErrorIndentDecoration = (cursor: number, length: number, indent: number): DecorationEntry =>
                            (
                                {
                                    startPosition: cursor,
                                    length,
                                    decorationParam: makeIndentErrorDecorationParam(lang)
                                }
                            );
                            const addIndentLevelMap = (cursor: number, length: number, indent: number) =>
                            {
                                if (undefined === currentDocumentDecorationCache.indentLevelMap[indent])
                                {
                                    currentDocumentDecorationCache.indentLevelMap[indent] = [];
                                }
                                currentDocumentDecorationCache.indentLevelMap[indent].push({ cursor, length });
                            };
                            currentDocumentDecorationCache.indents.forEach
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
                                            if (getIndentSize(text, currentEditorDecorationCache.tabSize) < currentDocumentDecorationCache.indentUnitSize)
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
                                                    const indentCount = Math.ceil(getIndentSize(text.substr(0, spaces +1), currentEditorDecorationCache.tabSize) /currentDocumentDecorationCache.indentUnitSize) -1;
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
    export const updateLineDecoration =
    (
        lang: string,
        text: string,
        textEditor: vscode.TextEditor,
        currentDocumentDecorationCache: DocumentDecorationCacheEntry,
        currentEditorDecorationCache: EditorDecorationCacheEntry,
        previousEditorDecorationCache: EditorDecorationCacheEntry | undefined
    ): DecorationEntry[] => Profiler.profile
    (
        "updateLineDecoration", () =>
        {
            let result: DecorationEntry[] = [];
            if
            (
                !previousEditorDecorationCache ||
                previousEditorDecorationCache.getLineNumber() !== currentEditorDecorationCache.getLineNumber() ||
                currentEditorDecorationCache.indentIndex !== previousEditorDecorationCache.indentIndex
            )
            {
                if (undefined !== currentEditorDecorationCache.line && undefined !== currentEditorDecorationCache.indentIndex)
                {
                    result.push
                    (
                        {
                            range: currentEditorDecorationCache.line.range,
                            startPosition: 0,
                            length: 0,
                            decorationParam: makeHueDecoration
                            (
                                `line`,
                                lang,
                                spaceBaseColor,
                                currentEditorDecorationCache.indentIndex,
                                spacesActiveAlpha,
                                undefined,
                                true
                            )
                        }
                    );
                }
                if (previousEditorDecorationCache && currentEditorDecorationCache.indentIndex !== previousEditorDecorationCache.indentIndex && undefined !== previousEditorDecorationCache.indentIndex)
                {
                    result.push
                    (
                        {
                            startPosition: -1,
                            length: -1,
                            decorationParam: makeHueDecoration
                            (
                                `line`,
                                lang,
                                spaceBaseColor,
                                previousEditorDecorationCache.indentIndex,
                                spacesActiveAlpha,
                                undefined,
                                true
                            )
                        }
                    );
                }
            }
            return result;
        }
    );

    export const regExpExecToArray = (regexp: RegExp, text: string) => Profiler.profile
    (
        `regExpExecToArray(/${regexp.source}/${regexp.flags})`,
        () =>
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
        }
    );

    export const updateSymbolsDecoration =
    (
        lang: string,
        text: string,
        textEditor: vscode.TextEditor,
        tabSize: number,
        symbolColorMap: Map<string, string>
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
                    index: match.index,
                    token: match[0],
                    specificColor: symbolColorMap.get(match[0])
                }
            )
        )
        .filter(i => null !== i.specificColor)
        .map
        (
            i =>
            (
                {
                    startPosition: i.index,
                    length: i.token.length,
                    decorationParam: makeHueDecoration
                    (
                        "symbols",
                        lang,
                        symbolBaseColor,
                        i.specificColor ||
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
                        )[i.token],
                        symbolAlpha
                    )
                }
            )
        )
    );
    export const hash = (source: string): number =>
        source.split("").map(i => i.codePointAt(0) || 0).reduce((a, b) => (a *173 +b +((a & 0x5555) >>> 5)) & 8191)
        %34; // ← 通常、こういうところの数字は素数にすることが望ましいがここについては https://wraith13.github.io/phi-ratio-coloring/phi-ratio-coloring.htm で類似色の出てくる周期をベース(8,13,21,...)に調整すること。
    export const updateTokesDecoration =
    (
        lang: string,
        text: string,
        textEditor: vscode.TextEditor,
        tabSize: number,
        showRegular: boolean,
        strongTokens: string[],
        tokenColorMap: Map<string, string>,
        previousStrongTokens?: string[],
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
                    isActive: 0 <= strongTokens.indexOf(match[0]),
                    specificColor: tokenColorMap.get(match[0])
                }
            )
        )
        .filter(i => (showRegular || i.isActive) && null !== i.specificColor)
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
                        tokenBaseColor,
                        i.specificColor || hash(i.token),
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
                            spaceBaseColor,
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
                        makeHueDecoration
                        (
                            "trailing-spaces",
                            lang,
                            spaceBaseColor,
                            match[2].length,
                            spacesAlpha
                        )
                }
            )
        )
    );

    export const createTextEditorDecorationType =
    (
        backgroundColor: string,
        overviewRulerLane?: vscode.OverviewRulerLane,
        isWholeLine?: boolean
    ) => vscode.window.createTextEditorDecorationType
    (
        {
            backgroundColor: backgroundColor,
            overviewRulerColor: undefined !== overviewRulerLane ? backgroundColor: undefined,
            overviewRulerLane: overviewRulerLane,
            isWholeLine,
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

    // spaces indent
	// tab indent
  	// spaces and tab indent

    //    body spaces

    // trailing spaces        

