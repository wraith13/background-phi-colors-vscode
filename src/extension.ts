import * as vscode from 'vscode';
import { phiColors } from 'phi-colors';

export module BackgroundPhiColors
{
    const applicationKey = "background-phi-colors";
    class Cache<keyT, valueT>
    {
        cache: {[key: string]: valueT} = { };
        public constructor(public loader: (key: keyT) => valueT)
        {

        }

        public get = (key: keyT): valueT => this.getCore(key, JSON.stringify(key));
        private getCore = (key: keyT, keyJson: string): valueT => undefined === this.cache[keyJson] ?
            (this.cache[keyJson] = this.loader(key)):
            this.cache[keyJson];
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
    
    const delay = new Config("delay", 250, 50, 1500);
    const baseColor = new Config("baseColor", "#CC6666");
    const spacesAlpha =new Config("spacesAlpha", 0x11, 0x00, 0xFF);
    const spacesActiveAlpha =new Config("spacesActiveAlpha", 0x33, 0x00, 0xFF);
    const spacesErrorAlpha =new Config("spacesErrorAlpha", 0x88, 0x00, 0xFF);
    const symbolAlpha =new Config("symbolAlpha", 0x44, 0x00, 0xFF);
    const tokenAlpha =new Config("tokenAlpha", 0x33, 0x00, 0xFF);
    const tokenActiveAlpha =new Config("tokenActiveAlpha", 0x66, 0x00, 0xFF);

    //let baseColorHsla: phiColors.Hsla;
    interface DecorationParam
    {
        base: phiColors.Hsla;
        hue: number;
        alpha: number;
        overviewRulerLane?: vscode.OverviewRulerLane;
    }
    //let indentErrorDecorationParam: DecorationParam;
    //let trailingSpacesErrorDecorationParam: DecorationParam;
    const makeIndentErrorDecorationParam = (lang: string) => makeHueDecoration(lang, -1, spacesErrorAlpha, vscode.OverviewRulerLane.Left);
    const makeTrailingSpacesErrorDecorationParam = (lang: string) => makeHueDecoration(lang, -1, spacesErrorAlpha, vscode.OverviewRulerLane.Right);
    let decorations: { [decorationParamJson: string]: { decorator: vscode.TextEditorDecorationType, rangesOrOptions: vscode.Range[] } } = { };

    export const getTicks = () => new Date().getTime();

    export const initialize = (context: vscode.ExtensionContext): void =>
    {
        context.subscriptions.push
        (
            //  コマンドの登録
            vscode.commands.registerCommand(`${applicationKey}.helloWorld`, async () => await vscode.window.showInformationMessage('Hello World!')),

            //  イベントリスナーの登録
            vscode.workspace.onDidChangeConfiguration(() => onDidChangeConfiguration()),
            vscode.window.onDidChangeActiveTextEditor(() => onDidChangeActiveTextEditor()),
            vscode.workspace.onDidChangeTextDocument(() => onDidChangeTextDocument()),
            vscode.window.onDidChangeTextEditorSelection(() => onDidChangeTextEditorSelection()),
        );

        vscode.window.visibleTextEditors.forEach(i => updateDecoration(i));
    };

    export const onDidChangeConfiguration = (): void =>
    {
        [
            delay,
            baseColor,
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
    };

    export const onDidChangeActiveTextEditor = (): void =>
    {
        const activeTextEditor = vscode.window.activeTextEditor;
        if (activeTextEditor)
        {
            updateDecoration(activeTextEditor);
        }
    };
    let lastUpdateStamp = 0;
    export const onDidChangeTextDocument = (): void =>
    {
        const activeTextEditor = vscode.window.activeTextEditor;
        if (activeTextEditor)
        {
            const updateStamp = getTicks();
            lastUpdateStamp = updateStamp;
            setTimeout
            (
                () =>
                {
                    if (lastUpdateStamp === updateStamp)
                    {
                        updateDecoration(activeTextEditor);
                    }
                },
                delay.get(activeTextEditor.document.languageId)
            );
        }
    };
    export const onDidChangeTextEditorSelection = onDidChangeTextDocument;

    export const gcd = (a: number, b: number) : number => b ? gcd(b, a % b): a;

    export const getIndentSize = (text: string, tabSize: number): number =>
        text.replace(/\t/g, (s, offset) => s.repeat(tabSize -(offset %tabSize))).length;

    export const getIndentUnit =
    (
        indentSizeDistribution:{ [key: number]: number },
        tabSize: number,
        isDefaultIndentCharactorSpace: boolean
    ): string =>
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
    };
    
    const makeRange = (textEditor: vscode.TextEditor, startPosition: number, length: number) => new vscode.Range
    (
        textEditor.document.positionAt(startPosition),
        textEditor.document.positionAt(startPosition +length)
    );

    const updateDecoration = (textEditor: vscode.TextEditor) =>
    {
        const lang = textEditor.document.languageId;
        const text = textEditor.document.getText();
        const tabSize = undefined === textEditor.options.tabSize ?
            4:
            (
                "number" === typeof textEditor.options.tabSize ?
                    textEditor.options.tabSize:
                    parseInt(textEditor.options.tabSize)
            );

        //  clear
        Object.keys(decorations).forEach(i => decorations[i].rangesOrOptions = []);

        //  update
        updateIndentDecoration
        (
            lang,
            text,
            textEditor,
            tabSize,
            getIndentSize
            (
                textEditor.document
                    .lineAt(textEditor.selection.active.line)
                    .text
                    .substr(0, textEditor.selection.active.character)
                    .replace(/[^ \t]+.*$/, ""
                ),
                tabSize
            )
        );
        updateSymbolsDecoration(lang, text, textEditor, tabSize);
        updateTokesDecoration
        (
            lang,
            text,
            textEditor,
            tabSize,
            regExpExecToArray
            (
                /\w+/gm,
                textEditor.document
                    .lineAt(textEditor.selection.active.line).text)
                    .map(i => i[0]
            )
        );
        updateBodySpacesDecoration(lang, text, textEditor, tabSize);
        updateTrailSpacesDecoration(lang, text, textEditor, tabSize);

        //  apply
        Object.keys(decorations).map(i => decorations[i]).forEach
        (
            i => textEditor.setDecorations(i.decorator, i.rangesOrOptions)
        );
    };
    let hslaCache = new Cache((color: string) => phiColors.rgbaToHsla(phiColors.rgbaFromStyle(color)));
    export const makeHueDecoration =
    (
        lang: string,
        hue: number,
        alpha: Config<number>,
        overviewRulerLane?: vscode.OverviewRulerLane
    ) =>
    (
        {
            base:  hslaCache.get(baseColor.get(lang)),
            hue: hue +1,
            alpha: alpha.get(lang),
            overviewRulerLane: overviewRulerLane,
        }
    );
    export const addDecoration = (textEditor: vscode.TextEditor, startPosition: number, length: number, decorationParam: DecorationParam) =>
    {
        const key = JSON.stringify(decorationParam);
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
                                    decorationParam.base,
                                    decorationParam.hue,
                                    0,
                                    0,
                                    0
                                )
                            )
                    )
                    +((0x100 +decorationParam.alpha).toString(16)).substr(1),
                    decorationParam.overviewRulerLane,
                ),
                rangesOrOptions: []
            };
        }
        decorations[key].rangesOrOptions.push
        (
            makeRange
            (
                textEditor,
                startPosition,
                length
            )
        );
    };
    export const updateIndentDecoration = (lang: string, text: string, textEditor: vscode.TextEditor, tabSize: number, currentIndentSize: number) =>
    {
        const indents: { index: number, text: string, body: string }[] = [];
        let totalSpaces = 0;
        let totalTabs = 0;
        const indentSizeDistribution:{ [key: number]: number } = { };
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
                        text: match[1],
                        body: match[2]
                    }
                );
                const length = match[1].length;
                const tabs = match[1].replace(/ /g, "").length;
                const spaces = length -tabs;
                totalSpaces += spaces;
                totalTabs += tabs;
                const indentSize = getIndentSize(match[1], tabSize);
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
        const isDefaultIndentCharactorSpace = totalTabs *tabSize <= totalSpaces;
        const indentUnit = getIndentUnit(indentSizeDistribution, tabSize, isDefaultIndentCharactorSpace);
        const indentUnitSize = getIndentSize(indentUnit, tabSize);
        const currentIndentIndex = Math.floor(currentIndentSize /indentUnitSize);
        //console.log(`indentSizeDistribution: ${JSON.stringify(indentSizeDistribution)}`);
        //console.log(`indentUnit: ${JSON.stringify(indentUnit)}`);

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
                    if (text.startsWith(indentUnit))
                    {
                        addDecoration
                        (
                            textEditor,
                            cursor,
                            length = indentUnit.length,
                            makeHueDecoration(lang, i, (currentIndentIndex === i) ? spacesActiveAlpha: spacesAlpha)
                        );
                        text = text.substr(indentUnit.length);
                    }
                    else
                    {
                        if (getIndentSize(text, tabSize) < indentUnitSize)
                        {
                            addDecoration
                            (
                                textEditor,
                                cursor,
                                length = text.length,
                                makeIndentErrorDecorationParam(lang)
                            );
                            text = "";
                        }
                        else
                        {
                            if (isDefaultIndentCharactorSpace)
                            {
                                const spaces = text.length -text.replace(/^ +/, "").length;
                                if (0 < spaces)
                                {
                                    addDecoration
                                    (
                                        textEditor,
                                        cursor,
                                        length = spaces,
                                        makeHueDecoration(lang, i, (currentIndentIndex === i) ? spacesActiveAlpha: spacesAlpha)
                                    );
                                    cursor += length;
                                }
                                addDecoration
                                (
                                    textEditor,
                                    cursor,
                                    length = 1,
                                    makeIndentErrorDecorationParam(lang)
                                );
                                const indentCount = Math.ceil(getIndentSize(text.substr(0, spaces +1), tabSize) /indentUnitSize) -1;
                                i += indentCount;
                                text = text.substr(spaces +1);
                            }
                            else
                            {
                                const spaces = text.length -text.replace(/$ +/, "").length;
                                addDecoration
                                (
                                    textEditor,
                                    cursor,
                                    length = spaces,
                                    makeIndentErrorDecorationParam(lang)
                                );
                                const indentCount = Math.ceil(spaces /indentUnitSize) -1;
                                i += indentCount;
                                text = text.substr(spaces);
                            }
                        }
                    }
                }
            }
        );
    };
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
    ) => regExpExecToArray
    (
        /[\!\.\,\:\;\(\)\[\]\{\}\<\>\"\'\`\#\$\%\&\=\-\+\*\@\\\/\|\?\^\~"]/gm,
        text
    )
    .forEach
    (
        match => addDecoration
        (
            textEditor,
            match.index,
            match[0].length,
            makeHueDecoration
            (
                lang,
                (
                    <{[key: string]: number}>
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
        strongTokens: string[]
    ) => regExpExecToArray
    (
        /\w+/gm,
        text
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
    .forEach
    (
        i => addDecoration
        (
            textEditor,
            i.index,
            i.token.length,
            makeHueDecoration
            (
                lang,
                hash(i.token),
                i.isActive ? tokenActiveAlpha: tokenAlpha,
                i.isActive ? vscode.OverviewRulerLane.Center: undefined,
            )
        )
    );
    export const updateBodySpacesDecoration =
    (
        lang: string,
        text: string,
        textEditor: vscode.TextEditor,
        tabSize: number
    ) => regExpExecToArray
    (
        /^([ \t]*)([^ \t\r\n]+)([^\r\n]+)([^ \t\r\n]+)([ \t]*)$/gm,
        text
    )
    .forEach
    (
        prematch => regExpExecToArray
        (
            / {2,}|\t+/gm,
            prematch[3]
        )
        .forEach
        (
            match => addDecoration
            (
                textEditor,
                prematch.index +prematch[1].length +prematch[2].length +match.index,
                match[0].length,
                makeHueDecoration
                (
                    lang,
                    match[0].startsWith("\t") ?
                        //  tabs
                        ((match[0].length *tabSize) -((prematch[1].length +prematch[2].length +match.index) %tabSize)) -1:
                        //  spaces
                        match[0].length -1,
                    spacesAlpha
                )
            )
        )
    );
    export const updateTrailSpacesDecoration =
    (
        lang: string,
        text: string,
        textEditor: vscode.TextEditor,
        tabSize: number
    ) => regExpExecToArray
    (
        /^([^\r\n]*[^ \t\r\n]+)([ \t]+)$/gm,
        text
    )
    .forEach
    (
        match => addDecoration
        (
            textEditor,
            match.index +match[1].length,
            match[2].length,
            makeTrailingSpacesErrorDecorationParam(lang)
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