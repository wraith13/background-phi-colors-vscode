import * as vscode from 'vscode';
import * as Profiler from "./lib/profiler";
import { Cache } from "./lib/cache";
import * as Config from "./lib/config";
import * as Locale from "./lib/locale";
import { phiColors } from 'phi-colors';
const getTicks = () => new Date().getTime();
const roundCenti = (value : number) : number => Math.round(value *100) /100;
const percentToDisplayString = (value : number, locales?: string | string[]) : string =>`${roundCenti(value).toLocaleString(locales, { style: "percent" })}`;
const isCompatibleArray = <valueT>(a: valueT[], b:valueT[]) =>
    !a.some(i => b.indexOf(i) < 0) &&
    !b.some(i => a.indexOf(i) < 0);
const objctToMap = <valueT>(object: {[key:string]: valueT }) => new Map<string, valueT>(Object.keys(object).map(key => [key, object[key]]));
export module BackgroundPhiColors
{
    const applicationKey = "backgroundPhiColors";
    const colorValidator = (value: string): boolean => /^#[0-9A-Fa-f]{6}$/.test(value);
    const colorOrNullValidator = (value: string | null): boolean => null === value || colorValidator(value);
    const colorMapValidator = (value: {[key: string]: string}): boolean =>
        undefined !== value &&
        null !== value &&
        !Object.keys(value).some(key => !colorOrNullValidator(value[key]));
    const indentModeObject = Object.freeze({ "none": "none", "light": "light", "smart": "smart", "full": "full", });
    const tokenModeObject = Object.freeze ({ "none": "none", "light": "light", "smart": "smart", "full": "full", });
    const activeScopeObject = Object.freeze ({ "editor": "editor", "document": "document", "window": "window", });
    const laneObject = Object.freeze
    ({
        "none": undefined,
        "left": vscode.OverviewRulerLane.Left,
        "center": vscode.OverviewRulerLane.Center,
        "right": vscode.OverviewRulerLane.Right,
        "full": vscode.OverviewRulerLane.Full,
    });
    const indentObject = Object.freeze
    ({
        "auto": null,
        "tab": "\t",
        "1 space": " ",
        "2 spaces": "  ",
        "3 spaces": "   ",
        "4 spaces": "    ",
        "5 spaces": "     ",
        "6 spaces": "      ",
        "7 spaces": "       ",
        "8 spaces": "        ",
    });
    const overTheLimitMessageShowModeObject = Object.freeze
    ({
        "none": (rate: number) => false,
        "until 16x": (rate: number) => rate <= 16,
        "until 256x": (rate: number) => rate <= 256,
        "always": (rate: number) => true,
    });
    const clipByVisibleRangeObject = Object.freeze
    ({
        "none": (rate: number) => false,
        "smart": (rate: number) => 1 <= rate,
        "always": (rate: number) => true,
    });
    const enabled = new Config.Entry<boolean>("backgroundPhiColors.enabled");
    const enabledPanels = new Config.Entry<boolean>("backgroundPhiColors.enabledPanels");
    const enabledReflectAppearanceFrequencyInOpacity = new Config.Entry<boolean>("backgroundPhiColors.enabledReflectAppearanceFrequencyInOpacity");
    const fileSizeLimit = new Config.Entry<number>("backgroundPhiColors.fileSizeLimit");
    const basicDelay = new Config.Entry<number>("backgroundPhiColors.basicDelay");
    const additionalDelay = new Config.Entry<number>("backgroundPhiColors.additionalDelay");
    const clipDelay = new Config.Entry<number>("backgroundPhiColors.clipDelay");
    const baseColor = new Config.Entry("backgroundPhiColors.baseColor", colorValidator);
    const spaceBaseColor = new Config.Entry("backgroundPhiColors.spaceBaseColor", colorOrNullValidator);
    const spaceErrorColor = new Config.Entry("backgroundPhiColors.spaceErrorColor", colorValidator);
    const symbolBaseColor = new Config.Entry("backgroundPhiColors.symbolBaseColor", colorOrNullValidator);
    const symbolColorMap = new Config.Entry("backgroundPhiColors.symbolColorMap", colorMapValidator);
    const tokenBaseColor = new Config.Entry("backgroundPhiColors.tokenBaseColor", colorOrNullValidator);
    const tokenColorMap = new Config.Entry("backgroundPhiColors.tokenColorMap", colorMapValidator);
    const indentMode = new Config.MapEntry("backgroundPhiColors.indentMode", indentModeObject);
    const lineEnabled = new Config.Entry<boolean>("backgroundPhiColors.lineEnabled");
    const blankLinesEnabled = new Config.Entry<boolean>("backgroundPhiColors.blankLinesEnabled");
    const tokenMode = new Config.MapEntry("backgroundPhiColors.tokenMode", tokenModeObject);
    const activeScope = new Config.MapEntry("backgroundPhiColors.activeScope", activeScopeObject);
    const indentErrorEnabled = new Config.Entry<boolean>("backgroundPhiColors.indentErrorEnabled");
    const trailingSpacesErrorEnabled = new Config.Entry<boolean>("backgroundPhiColors.trailingSpacesErrorEnabled");
    const bodySpacesEnabled = new Config.Entry<boolean>("backgroundPhiColors.bodySpacesEnabled");
    const trailingSpacesEnabled = new Config.Entry<boolean>("backgroundPhiColors.trailingSpacesEnabled");
    const symbolEnabled = new Config.Entry<boolean>("backgroundPhiColors.symbolEnabled");
    const indentErrorInOverviewRulerLane = new Config.MapEntry("backgroundPhiColors.indentErrorInOverviewRulerLane", laneObject);
    const activeTokenInOverviewRulerLane = new Config.MapEntry("backgroundPhiColors.activeTokenInOverviewRulerLane", laneObject);
    const trailingSpacesErrorInOverviewRulerLane = new Config.MapEntry("backgroundPhiColors.trailingSpacesErrorInOverviewRulerLane", laneObject);
    const blankLinesInOverviewRulerLane = new Config.MapEntry("backgroundPhiColors.blankLinesInOverviewRulerLane", laneObject);
    const spacesAlpha = new Config.Entry<number>("backgroundPhiColors.spacesAlpha");
    const spacesActiveAlpha = new Config.Entry<number>("backgroundPhiColors.spacesActiveAlpha");
    const spacesErrorAlpha = new Config.Entry<number>("backgroundPhiColors.spacesErrorAlpha");
    const blankLinesAlpha = new Config.Entry<number>("backgroundPhiColors.blankLinesAlpha");
    const symbolAlpha = new Config.Entry<number>("backgroundPhiColors.symbolAlpha");
    const tokenAlpha = new Config.Entry<number>("backgroundPhiColors.tokenAlpha");
    const tokenActiveAlpha = new Config.Entry<number>("backgroundPhiColors.tokenActiveAlpha");
    const indentConfig = new Config.MapEntry("backgroundPhiColors.indent", indentObject);
    const enabledProfile = new Config.Entry<boolean>("backgroundPhiColors.enabledProfile");
    const overTheLimitMessageShowMode = new Config.MapEntry("backgroundPhiColors.overTheLimitMessageShowMode", overTheLimitMessageShowModeObject);
    const clipByVisibleRange = new Config.MapEntry("backgroundPhiColors.clipByVisibleRange", clipByVisibleRangeObject);
    const isDecorated: { [fileName: string]: boolean } = { };
    const isOverTheLimit: { [fileName: string]: boolean } = { };
    const isLimitNoticed: { [fileName: string]: boolean } = { };
    let isMutedAll: boolean | undefined = undefined;
    let isPausedAll: boolean = false;
    let profilerOutputChannel: vscode.OutputChannel | undefined = undefined;
    const getProfilerOutputChannel = () => profilerOutputChannel ?
        profilerOutputChannel:
        (profilerOutputChannel = vscode.window.createOutputChannel("Background Phi Colors Profiler"));
    let mapCache = new Cache((object: {[key:string]: string }) => object ? objctToMap(object): new Map());
    let lastActiveTextEditor: vscode.TextEditor | undefined = undefined;
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
        color: Config.Entry<string | null>,
        hue: string | number,
        alpha: Config.Entry<number>,
        overviewRulerLane?: vscode.OverviewRulerLane,
        isWholeLine?: boolean
    ): DecorationParam =>
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
    const makeIndentErrorDecorationParam = (lang: string): DecorationParam =>
    ({
        name: "indenet:error",
        base: hslaCache.get(spaceErrorColor.get(lang)),
        hue: 0,
        alpha: spacesErrorAlpha.get(lang),
        overviewRulerLane: indentErrorInOverviewRulerLane.get(lang),
    });
    const makeTrailingSpacesErrorDecorationParam = (lang: string): DecorationParam =>
    ({
        name: "trailing-spaces",
        base: hslaCache.get(spaceErrorColor.get(lang)),
        hue: 0,
        alpha: spacesErrorAlpha.get(lang),
        overviewRulerLane: trailingSpacesErrorInOverviewRulerLane.get(lang),
    });
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
            vscode.commands.registerCommand(`${applicationKey}.toggleMute`, () => activeTextEditor(toggleMute)),
            vscode.commands.registerCommand
            (
                `${applicationKey}.toggleMuteAll`, () =>
                {
                    isMutedAll = !isMutedAll;
                    editorDecorationCache.forEach(i => i.isMuted = undefined);
                    isPausedAll = false;
                    editorDecorationCache.forEach(i => i.isPaused = undefined);
                    updateAllDecoration();
                }
            ),
            vscode.commands.registerCommand(`${applicationKey}.togglePause`, () => activeTextEditor(togglePause)),
            vscode.commands.registerCommand
            (
                `${applicationKey}.togglePauseAll`, () =>
                {
                    isPausedAll = !isPausedAll;
                    editorDecorationCache.forEach(i => i.isPaused = undefined);
                    updateAllDecoration();
                }
            ),
            vscode.commands.registerCommand(`${applicationKey}.overTheLimig`, () => activeTextEditor(overTheLimit)),
            vscode.commands.registerCommand
            (
                `${applicationKey}.startProfile`, () =>
                {
                    const outputChannel = getProfilerOutputChannel();
                    outputChannel.show();
                    if (Profiler.getIsProfiling())
                    {
                        outputChannel.appendLine(Locale.map("🚫 You have already started the profile."));
                    }
                    else
                    {
                        outputChannel.appendLine(`${Locale.map("⏱ Start Profile!")} - ${new Date()}`);
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
                        outputChannel.appendLine(`${Locale.map("🏁 Stop Profile!")} - ${new Date()}`);
                        outputChannel.appendLine(Locale.map("📊 Profile Report"));
                        const total = Profiler.getReport().map(i => i.ticks).reduce((p, c) => p +c);
                        outputChannel.appendLine(`- Total: ${total.toLocaleString()}ms ( ${percentToDisplayString(1)} )`);
                        Profiler.getReport().forEach(i => outputChannel.appendLine(`- ${i.name}: ${i.ticks.toLocaleString()}ms ( ${percentToDisplayString(i.ticks / total)} )`));
                    }
                    else
                    {
                        outputChannel.appendLine(Locale.map("🚫 Profile has not been started."));
                    }
                }
            ),
            vscode.commands.registerCommand
            (
                `${applicationKey}.reportProfile`, () =>
                {
                    const outputChannel = getProfilerOutputChannel();
                    outputChannel.show();
                    if (Profiler.getIsProfiling())
                    {
                        outputChannel.appendLine(`${Locale.map("📊 Profile Report")} - ${new Date()}`);
                        const overall = Profiler.getOverall();
                        const total = Profiler.getReport().map(i => i.ticks).reduce((p, c) => p +c);
                        outputChannel.appendLine(Locale.map("⚖ Overview"));
                        outputChannel.appendLine(`- Overall: ${overall.toLocaleString()}ms ( ${percentToDisplayString(1)} )`);
                        outputChannel.appendLine(`- Busy: ${total.toLocaleString()}ms ( ${percentToDisplayString(total / overall)} )`);
                        outputChannel.appendLine(Locale.map("🔬 Busy Details"));
                        outputChannel.appendLine(`- Total: ${total.toLocaleString()}ms ( ${percentToDisplayString(1)} )`);
                        Profiler.getReport().forEach(i => outputChannel.appendLine(`- ${i.name}: ${i.ticks.toLocaleString()}ms ( ${percentToDisplayString(i.ticks / total)} )`));
                        outputChannel.appendLine("");
                    }
                    else
                    {
                        outputChannel.appendLine(Locale.map("🚫 Profile has not been started."));
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
            vscode.window.onDidChangeTextEditorVisibleRanges(() => onDidChangeTextEditorVisibleRanges())
        );
        startOrStopProfile();
        updateAllDecoration();
    };
    const startOrStopProfile = () =>
    {
        if (Profiler.getIsProfiling() !== enabledProfile.get(""))
        {
            if (enabledProfile.get(""))
            {
                Profiler.start();
            }
            else
            {
                Profiler.stop();
            }
        }
    };
    const valueThen = <valueT>(value: valueT | undefined, f: (value: valueT) => void) =>
    {
        if (value)
        {
            f(value);
        }
    };
    const activeTextEditor = (f: (textEditor: vscode.TextEditor) => void) => valueThen(vscode.window.activeTextEditor, f);
    export const toggleMute = (textEditor: vscode.TextEditor) =>
    {
        const currentEditorDecorationCache = editorDecorationCache.get(textEditor);
        if (currentEditorDecorationCache)
        {
            currentEditorDecorationCache.isMuted =
                undefined === currentEditorDecorationCache.isMuted ?
                    !isMutedAll:
                    !currentEditorDecorationCache.isMuted;
            currentEditorDecorationCache.isPaused = undefined;
            delayUpdateDecoration(textEditor);
        }
    };
    export const togglePause = (textEditor: vscode.TextEditor) =>
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
    export const overTheLimit = (textEditor: vscode.TextEditor) =>
    {
        isOverTheLimit[textEditor.document.fileName] = true;
        vscode.window.visibleTextEditors.filter(i => i.document === textEditor.document).forEach(i => delayUpdateDecoration(i));
    };
    const getDocumentTextLength = (document: vscode.TextDocument) => document.offsetAt
    (
        document.lineAt(document.lineCount - 1).range.end
    );
    const isClip = (lang: string, textLength: number) => clipByVisibleRange.get(lang)(textLength / Math.max(fileSizeLimit.get(lang), 1024));
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
                        const indentSizeDistribution:{ [key: number]: number } = { };
                        this.indents = getIndents(text);
                        const indentUnitConfig = indentConfig.get(lang);
                        if (null === indentUnitConfig)
                        {
                            let totalSpaces = 0;
                            let totalTabs = 0;
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
                        }
                        else
                        {
                            this.indentUnit = indentUnitConfig;
                            this.isDefaultIndentCharactorSpace = /^ +$/.test(indentUnitConfig);
                        }
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
        isMuted: boolean | undefined;
        isPaused: boolean | undefined;
        isCleared: boolean = false;
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
            const isActiveTextEditor = lastActiveTextEditor === textEditor;
            if (isIndentInfoNeed(textEditor.document.languageId) && (isActiveTextEditor || "editor" === activeScope.get("")))
            {
                const currentIndentSize = getIndentSize
                    (
                        this.line
                            .text
                            .substr(0, textEditor.selection.active.character)
                            .replace(/[^ \t]+.*$/, ""),
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
                this.isMuted = previousEditorDecorationCache.isMuted;
                this.isPaused = previousEditorDecorationCache.isPaused;
                //this.isCleared = previousEditorDecorationCache.isCleared; このフラグをリセットするべきタイミングがちょうどこの constructor が呼ばれるタイミングなので、これは引き継がない。
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
            enabledReflectAppearanceFrequencyInOpacity,
            fileSizeLimit,
            basicDelay,
            additionalDelay,
            clipDelay,
            baseColor,
            spaceBaseColor,
            spaceErrorColor,
            symbolBaseColor,
            symbolColorMap,
            tokenBaseColor,
            tokenColorMap,
            indentMode,
            lineEnabled,
            blankLinesEnabled,
            tokenMode,
            activeScope,
            indentErrorEnabled,
            trailingSpacesErrorEnabled,
            bodySpacesEnabled,
            trailingSpacesEnabled,
            symbolEnabled,
            indentErrorInOverviewRulerLane,
            activeTokenInOverviewRulerLane,
            trailingSpacesErrorInOverviewRulerLane,
            blankLinesInOverviewRulerLane,
            spacesAlpha,
            spacesActiveAlpha,
            spacesErrorAlpha,
            blankLinesAlpha,
            symbolAlpha,
            tokenAlpha,
            tokenActiveAlpha,
            indentConfig,
            enabledProfile,
            overTheLimitMessageShowMode,
            clipByVisibleRange,
        ]
        .forEach(i => i.clear());
        mapCache.clear();
        Object.keys(decorations).forEach(i => decorations[i].decorator.dispose());
        decorations = { };
        clearAllDecorationCache();
        startOrStopProfile();
        updateAllDecoration();
    };
    const lastUpdateStamp = new Map<vscode.TextEditor, number>();
    export const delayUpdateDecoration = (textEditor: vscode.TextEditor): void =>
    {
        const updateStamp = getTicks();
        lastUpdateStamp.set(textEditor, updateStamp);
        const textLength = getDocumentTextLength(textEditor.document);
        const logUnit = 16 *1024;
        const logRate = Math.pow(Math.max(textLength, logUnit) / logUnit, 1.0 / 2.0);
        const lang = textEditor.document.languageId;
        const delay = isClip(lang, textLength) ?
                clipDelay.get(lang):
                logRate *
                (
                    basicDelay.get(lang) +
                    (
                        undefined === documentDecorationCache.get(textEditor.document) ?
                            additionalDelay.get(lang):
                            0
                    )
                );
        //console.log(`document: ${textEditor.document.fileName}, textLength: ${textLength}, logRate: ${logRate}, delay: ${delay}`);
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
            delay
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
                .some(i => 0 <= ["smart", "full"].indexOf(i)) ||
                lineEnabled.get(lang)
            )
            {
                delayUpdateDecoration(textEditor);
            }
        }
    );
    export const onDidChangeTextEditorVisibleRanges = ()=> activeTextEditor
    (
        textEditor =>
        {
            if
            (
                isClip(textEditor.document.languageId, getDocumentTextLength(textEditor.document))
            )
            {
                //clearDecorationCache(textEditor.document);
                delayUpdateDecoration(textEditor);
            }
        }
    );
    export const gcd = (a: number, b: number) : number => b ? gcd(b, a % b): a;
    export const getIndentSize = (text: string, tabSize: number): number =>
    {
        let delta = 0;
        return text.replace
        (
            /\t/g,
            (s, offset) =>
            {
                const length = tabSize -((offset +delta) %tabSize);
                delta += (length -1);
                return s.repeat(length);
            }
        ).length;
    };
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
            const textLength = getDocumentTextLength(textEditor.document);
            const clip = isClip(lang, textLength);
            const previousEditorDecorationCache = !clip ? editorDecorationCache.get(textEditor): undefined;
            const isMuted = previousEditorDecorationCache && undefined !== previousEditorDecorationCache.isMuted ?
                previousEditorDecorationCache.isMuted:
                isMutedAll;
            const isPaused = previousEditorDecorationCache &&
                (undefined === previousEditorDecorationCache.isPaused ? isPausedAll: previousEditorDecorationCache.isPaused);
            const isCleared = previousEditorDecorationCache && previousEditorDecorationCache.isCleared;
            const isEnabled = undefined !== isMuted ?
                !isMuted:
                (enabled.get(lang) && (textEditor.viewColumn || enabledPanels.get(lang)));
            if (isEnabled && vscode.window.activeTextEditor === textEditor)
            {
                lastActiveTextEditor = vscode.window.activeTextEditor;
            }
            const isActiveTextEditor = lastActiveTextEditor === textEditor;
            //  clear
            Profiler.profile("updateDecoration.clear", () => Object.keys(decorations).forEach(i => decorations[i].rangesOrOptions = []));
            if (isEnabled && (!isPaused || isCleared))
            {
                if (isClip || textLength <= fileSizeLimit.get(lang) || isOverTheLimit[textEditor.document.fileName])
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
                    const currentDocumentDecorationCache =
                        (!clip && documentDecorationCache.get(textEditor.document)) ||
                        new DocumentDecorationCacheEntry
                        (
                            lang,
                            !clip ?
                                textEditor.document.getText():
                                textEditor.document.getText
                                (
                                    new vscode.Range
                                    (
                                        textEditor.visibleRanges
                                            .map(i => i.start)
                                            .reduce
                                            (
                                                (a, b) => a.compareTo(b) < 0 ? a: b,
                                                textEditor.document.lineAt(0).range.start
                                            ),
                                        textEditor.visibleRanges
                                            .map(i => i.end)
                                            .reduce
                                            (
                                                (a, b) => a.compareTo(b) < 0 ? b: a,
                                                textEditor.document.lineAt(textEditor.document.lineCount - 1).range.end
                                            )
                                    )
                                ),
                            tabSize
                        );
                    const currentEditorDecorationCache = new EditorDecorationCacheEntry(textEditor, tabSize, currentDocumentDecorationCache, previousEditorDecorationCache);
                    const validPreviousEditorDecorationCache = isCleared ? undefined: previousEditorDecorationCache;
                    let entry: DecorationEntry[] = [];
                    //  update
                    if (lineEnabled.get(lang))
                    {
                        entry = entry.concat
                        (
                            updateLineDecoration
                            (
                                lang,
                                //text,
                                textEditor,
                                currentDocumentDecorationCache,
                                currentEditorDecorationCache,
                                validPreviousEditorDecorationCache
                            )
                        );
                    }
                    entry = entry.concat
                    (
                        updateIndentDecoration
                        (
                            lang,
                            //text,
                            textEditor,
                            currentDocumentDecorationCache,
                            currentEditorDecorationCache,
                            validPreviousEditorDecorationCache
                        )
                    );
                    const showActive = 0 <= ["smart", "full"].indexOf(tokenMode.get(lang));
                    const showRegular = 0 <= ["light", "full"].indexOf(tokenMode.get(lang));
                    if ("none" !== tokenMode.get(lang))
                    {
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
                            !validPreviousEditorDecorationCache ||
                            (
                                showActive &&
                                !isCompatibleArray(currentEditorDecorationCache.strongTokens, validPreviousEditorDecorationCache.strongTokens)
                            )
                        )
                        {
                            if (validPreviousEditorDecorationCache)
                            {
                                entry = entry.concat
                                (
                                    validPreviousEditorDecorationCache.strongTokens
                                        .filter(i => currentEditorDecorationCache.strongTokens.indexOf(i) < 0)
                                        .map
                                        (
                                            i =>
                                            ({
                                                startPosition: -1,
                                                length: -1,
                                                decorationParam: makeHueDecoration
                                                (
                                                    `token:${i}`,
                                                    lang,
                                                    tokenBaseColor,
                                                    hash(i),
                                                    tokenActiveAlpha,
                                                    activeTokenInOverviewRulerLane.get(lang),
                                                )
                                            })
                                        )
                                );
                                if (showRegular)
                                {
                                    entry = entry.concat
                                    (
                                        currentEditorDecorationCache.strongTokens
                                            .filter(i => validPreviousEditorDecorationCache.strongTokens.indexOf(i) < 0)
                                            .map
                                            (
                                                i =>
                                                ({
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
                                                })
                                            )
                                    );
                                }
                            }
                        }
                    }
                    (clip ? textEditor.visibleRanges: [makeRange(textEditor, 0, textLength)]).forEach
                    (
                        range =>
                        {
                            const offset = textEditor.document.offsetAt(range.start);
                            const text = textEditor.document.getText(range);
                            if ("none" !== tokenMode.get(lang))
                            {
                                if
                                (
                                    !validPreviousEditorDecorationCache ||
                                    (
                                        showActive &&
                                        !isCompatibleArray(currentEditorDecorationCache.strongTokens, validPreviousEditorDecorationCache.strongTokens)
                                    )
                                )
                                {
                                    entry = entry.concat
                                    (
                                        updateTokesDecoration
                                        (
                                            lang,
                                            offset,
                                            text,
                                            textEditor,
                                            tabSize,
                                            showRegular,
                                            currentEditorDecorationCache.strongTokens,
                                            mapCache.get(tokenColorMap.get(lang)),
                                            undefined !== validPreviousEditorDecorationCache ? validPreviousEditorDecorationCache.strongTokens: undefined
                                        )
                                    );
                                }
                            }
                            if (!validPreviousEditorDecorationCache && symbolEnabled.get(lang))
                            {
                                entry = entry.concat(updateSymbolsDecoration(lang, offset, text, textEditor, tabSize, mapCache.get(symbolColorMap.get(lang))));
                            }
                            if (!validPreviousEditorDecorationCache && bodySpacesEnabled.get(lang))
                            {
                                entry = entry.concat(updateBodySpacesDecoration(lang, offset, text, textEditor, tabSize));
                            }
                            if (!validPreviousEditorDecorationCache && trailingSpacesEnabled.get(lang))
                            {
                                entry = entry.concat(updateTrailSpacesDecoration(lang, offset, text, textEditor, tabSize, trailingSpacesErrorEnabled.get(lang)));
                            }
                            if (!validPreviousEditorDecorationCache && blankLinesEnabled.get(lang))
                            {
                                entry = entry.concat(updateBlankLinesDecoration(lang, offset, text, textEditor));
                            }
                        }
                    );
                    //  apply
                    Profiler.profile
                    (
                        "updateDecoration.apply(regular)", () =>
                        {
                            if (clip)
                            {
                                entry.forEach(i => i.decorationParam.overviewRulerLane = undefined);
                            }
                            entry
                                .filter
                                (
                                    i =>
                                        !clip ||
                                        i.startPosition < 0 ||
                                        textEditor.visibleRanges.some
                                        (
                                            range => range.contains
                                            (
                                                i.range ||
                                                makeRange(textEditor, i.startPosition, i.length)
                                            )
                                        )
                                )
                                .forEach(i => addDecoration(textEditor, i));
                            const isToDecorate = 0 < entry.length; //Object.keys(decorations).some(i => 0 < decorations[i].rangesOrOptions.length);
                            if (isDecorated[textEditor.document.fileName] || isToDecorate)
                            {
                                const currentDecorations = entry.map(i => JSON.stringify(i.decorationParam));
                                Object.keys(decorations)
                                    .filter(i => !validPreviousEditorDecorationCache || 0 <= currentDecorations.indexOf(i))
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
                    if
                    (
                        overTheLimitMessageShowMode.get(lang)(textLength / Math.max(fileSizeLimit.get(lang), 1024)) && // ここの Math.max は基本的に要らないんだけど、万が一にも fileSizeLimit が 0 になってゼロ除算を発生させない為の保険
                        !isLimitNoticed[textEditor.document.fileName]
                    )
                    {
                        isLimitNoticed[textEditor.document.fileName] = true;
                        vscode.window.showWarningMessage
                        (
                            Locale.map("%1 is too large! Background Phi Colors has been disabled. But you can over the limit!").replace("%1", textEditor.document.fileName),
                            Locale.map("Close"),
                            Locale.map("Over the limit")
                        ).then
                        (
                            i =>
                            {
                                if (Locale.map("Over the limit") === i)
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
                if (previousEditorDecorationCache)
                {
                    previousEditorDecorationCache.isCleared = true;
                }
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
            ({
                index: match.index,
                text: match[1]
            })
        )
    );
    export const updateIndentDecoration =
    (
        lang: string,
        //text: string,
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
                            ({
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
                            });
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
                                ({
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
                                });
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
                            ({
                                startPosition: cursor,
                                length,
                                decorationParam: makeIndentErrorDecorationParam(lang)
                            });
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
                                                    const spaces = Math.min(text.length -text.replace(/^ +/, "").length, currentDocumentDecorationCache.indentUnitSize);
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
        //text: string,
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
                    ({
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
                    });
                }
                if (previousEditorDecorationCache && currentEditorDecorationCache.indentIndex !== previousEditorDecorationCache.indentIndex && undefined !== previousEditorDecorationCache.indentIndex)
                {
                    result.push
                    ({
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
                    });
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
        offset: number,
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
            ({
                index: match.index,
                token: match[0],
                specificColor: symbolColorMap.get(match[0])
            })
        )
        .filter(i => null !== i.specificColor)
        .map
        (
            i =>
            ({
                startPosition: offset +i.index,
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
            })
        )
    );
    export const hash = (source: string): number =>
        source.split("").map(i => i.codePointAt(0) || 0).reduce((a, b) => (a *173 +b +((a & 0x5555) >>> 5)) & 8191)
        %34; // ← 通常、こういうところの数字は素数にすることが望ましいがここについては https://wraith13.github.io/phi-ratio-coloring/phi-ratio-coloring.htm で類似色の出てくる周期をベース(8,13,21,...)に調整すること。
    export const updateTokesDecoration =
    (
        lang: string,
        offset: number,
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
            ({
                index: match.index,
                token: match[0],
                isActive: 0 <= strongTokens.indexOf(match[0]),
                specificColor: tokenColorMap.get(match[0])
            })
        )
        .filter(i => (showRegular || i.isActive) && null !== i.specificColor)
        .map
        (
            i =>
            ({
                startPosition: offset +i.index,
                length: i.token.length,
                decorationParam: makeHueDecoration
                (
                    `token:${i.token}`,
                    lang,
                    tokenBaseColor,
                    i.specificColor || hash(i.token),
                    i.isActive ? tokenActiveAlpha: tokenAlpha,
                    i.isActive ? activeTokenInOverviewRulerLane.get(lang): undefined,
                )
            })
        )
    );
    export const updateBodySpacesDecoration =
    (
        lang: string,
        offset: number,
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
                ({
                    startPosition: offset +prematch.index +prematch[1].length +prematch[2].length +match.index,
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
                })
            )
        )
        .reduce((a, b) => a.concat(b), [])
    );
    export const updateTrailSpacesDecoration =
    (
        lang: string,
        offset: number,
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
            ({
                startPosition: offset +match.index +match[1].length,
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
            })
        )
    );
    export const updateBlankLinesDecoration =
    (
        lang: string,
        offset: number,
        text: string,
        textEditor: vscode.TextEditor
    ): DecorationEntry[] => Profiler.profile
    (
        "updateBlankLinesDecoration", () =>
        regExpExecToArray
        (
            /(^|\n)([ \t\n]*)\n([^\n]|$)/g,
            text.replace(/\r\n/g, " \n").replace(/\r/g, "\n")
        )
        .map
        (
            match =>
            ({
                startPosition: offset +match.index +match[1].length,
                length: match[2].length,
                decorationParam: makeHueDecoration
                (
                    "blank-lines",
                    lang,
                    spaceBaseColor,
                    match[2].replace(/[^\n]+/g, "").length,
                    blankLinesAlpha,
                    blankLinesInOverviewRulerLane.get("lang"),
                    true
                )
            })
        )
    );
    export const createTextEditorDecorationType =
    (
        backgroundColor: string,
        overviewRulerLane?: vscode.OverviewRulerLane,
        isWholeLine?: boolean
    ) => vscode.window.createTextEditorDecorationType
    ({
        backgroundColor: backgroundColor,
        overviewRulerColor: undefined !== overviewRulerLane ? backgroundColor: undefined,
        overviewRulerLane: overviewRulerLane,
        isWholeLine,
    });
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
