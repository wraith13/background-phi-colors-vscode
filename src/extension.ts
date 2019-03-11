import * as vscode from 'vscode';
import { phiColors } from 'phi-colors';

export module BackgroundPhiColors
{
    const applicationKey = "background-phi-colors";
    interface Property<valueT>
    {
        name: string;
        minValue?: valueT;
        maxValue?: valueT;
        defaultValue?: valueT;
        value: valueT;
    }
    const delay =
    {
        name: "delay",
        minValue: 50,
        maxValue: 1500,
        defaultValue: 250,
        value: 250,
    };
    let lastUpdateStamp = 0;
    const baseColor =
    {
        name: "baseColor",
        defaultValue: "#CC666666",
        value: "#CC666666",
    };
    let baseColorHsla: phiColors.Hsla;
    let errorDecoration: { decorator: vscode.TextEditorDecorationType, rangesOrOptions: vscode.Range[] };
    let decorations: { decorator: vscode.TextEditorDecorationType, rangesOrOptions: vscode.Range[] }[] = [];

    export const getConfiguration = <type = vscode.WorkspaceConfiguration>(key?: string | Property<type>, section: string = applicationKey): type =>
    {
        if (!key || "string" === typeof key)
        {
            const rawKey = undefined === key ? undefined: key.split(".").reverse()[0];
            const rawSection = undefined === key || rawKey === key ? section: `${section}.${key.replace(/(.*)\.[^\.]+/, "$1")}`;
            const configuration = vscode.workspace.getConfiguration(rawSection);
            return rawKey ?
            configuration[rawKey]:
            configuration;
        }
        else
        {
            let result: type = getConfiguration<type>(key.name);
            if (undefined === result)
            {
                if (undefined !== key.defaultValue)
                {
                    result = key.defaultValue;
                }
            }
            else
            if (undefined !== key.minValue && result < key.minValue)
            {
                result = key.minValue;
            }
            else
            if (undefined !== key.maxValue && key.maxValue < result)
            {
                result = key.maxValue;
            }
            key.value = result;
            return result;
        }
    };

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
        );

        onDidChangeConfiguration();
    };

    export const onDidChangeConfiguration = (): void =>
    {
        getConfiguration(delay);
        getConfiguration(baseColor);
        baseColorHsla = phiColors.rgbaToHsla(phiColors.rgbaFromStyle(baseColor.value));
        decorations.forEach(i => i.decorator.dispose());
        if (errorDecoration)
        {
            errorDecoration.decorator.dispose();
        }
        decorations = [];
        errorDecoration =
        {
            decorator: createTextEditorDecorationType(baseColorHsla, 0),
            rangesOrOptions: []
        };

        vscode.window.visibleTextEditors.forEach(i => updateDecoration(i));
    };

    export const onDidChangeActiveTextEditor = (): void =>
    {
        const activeTextEditor = vscode.window.activeTextEditor;
        if (activeTextEditor)
        {
            updateDecoration(activeTextEditor);
        }
    };
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
                delay.value
            );
        }
    };

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
        const text = textEditor.document.getText();
        const tabSize = undefined === textEditor.options.tabSize ?
            4:
            (
                "number" === typeof textEditor.options.tabSize ?
                    textEditor.options.tabSize:
                    parseInt(textEditor.options.tabSize)
            );

        //  clear
        decorations.forEach(i => i.rangesOrOptions = []);
        errorDecoration.rangesOrOptions = [];

        //  update
        updateIndentDecoration(text, textEditor, tabSize);
        updateSymbolsDecoration(text, textEditor, tabSize);
        updateBodySpacesDecoration(text, textEditor, tabSize);
        updateTrailSpacesDecoration(text, textEditor, tabSize);

        //  apply
        decorations.forEach
        (
            i => textEditor.setDecorations(i.decorator, i.rangesOrOptions)
        );
        textEditor.setDecorations(errorDecoration.decorator, errorDecoration.rangesOrOptions);
    };
    export const addDecoration = (textEditor: vscode.TextEditor, startPosition: number, length: number, hue: number) =>
    {
        while(decorations.length <= hue)
        {
            decorations.push
            (
                {
                    decorator: createTextEditorDecorationType(baseColorHsla, hue +1, -2),
                    rangesOrOptions: []
                }
            );
        }
        decorations[hue].rangesOrOptions.push
        (
            makeRange
            (
                textEditor,
                startPosition,
                length
            )
        );
    };
    export const updateIndentDecoration = (text: string, textEditor: vscode.TextEditor, tabSize: number) =>
    {
        const indents: { index: number, text: string, body: string }[] = [];
        let totalSpaces = 0;
        let totalTabs = 0;
        const indentSizeDistribution:{ [key: number]: number } = { };
        regExpExecForEach
        (
            /^([ \t]+)([^\r\n]*)$/gm,
            text,
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
                            i
                        );
                        text = text.substr(indentUnit.length);
                    }
                    else
                    {
                        if (getIndentSize(text, tabSize) < indentUnitSize)
                        {
                            errorDecoration.rangesOrOptions.push
                            (
                                makeRange
                                (
                                    textEditor,
                                    cursor,
                                    length = text.length
                                )
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
                                        i
                                    );
                                    cursor += length;
                                }
                                errorDecoration.rangesOrOptions.push
                                (
                                    makeRange
                                    (
                                        textEditor,
                                        cursor,
                                        length = 1
                                    )
                                );
                                const indentCount = Math.ceil(getIndentSize(text.substr(0, spaces +1), tabSize) /indentUnitSize) -1;
                                i += indentCount;
                                text = text.substr(spaces +1);
                            }
                            else
                            {
                                const spaces = text.length -text.replace(/$ +/, "").length;
                                errorDecoration.rangesOrOptions.push
                                (
                                    makeRange
                                    (
                                        textEditor,
                                        cursor,
                                        length = spaces
                                    )
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
    export const regExpExecForEach = (regexp: RegExp, text: string, matchFunction: (match: RegExpExecArray) => void) =>
    {
        while(true)
        {
            const match = regexp.exec(text);
            if (null === match)
            {
                break;
            }
            matchFunction(match);
        }
    };
    export const updateSymbolsDecoration = (text: string, textEditor: vscode.TextEditor, tabSize: number) => regExpExecForEach
    (
        /[\!\.\,\:\;\(\)\[\]\{\}]/gm,
        text,
        match => addDecoration
        (
            textEditor,
            match.index,
            match[0].length,
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
                }
            )[match[0]]
        )
    );
    export const updateBodySpacesDecoration = (text: string, textEditor: vscode.TextEditor, tabSize: number) => regExpExecForEach
    (
        /^([ \t]*)([^ \t\r\n]+)([^\r\n]+)([^ \t\r\n]+)([ \t]*)$/gm,
        text,
        prematch => regExpExecForEach
        (
            / {2,}|\t+/gm,
            prematch[3],
            match => addDecoration
            (
                textEditor,
                prematch.index +prematch[1].length +prematch[2].length +match.index,
                match[0].length,
                match[0].startsWith("\t") ?
                    //  tabs
                    ((match[0].length *tabSize) -((prematch[1].length +prematch[2].length +match.index) %tabSize)) -1:
                    //  spaces
                    match[0].length -1
            )
        )
    );
    export const updateTrailSpacesDecoration = (text: string, textEditor: vscode.TextEditor, tabSize: number) => regExpExecForEach
    (
        /^([^\r\n]*[^ \t\r\n]+)([ \t]+)$/gm,
        text,
        match => errorDecoration.rangesOrOptions.push
        (
            makeRange
            (
                textEditor,
                match.index +match[1].length,
                match[2].length
            )
        )
    );

    export const createTextEditorDecorationType = (base: phiColors.Hsla, hue: number, alpha: number = 0.0): vscode.TextEditorDecorationType =>
        vscode.window.createTextEditorDecorationType
        (
            {
                backgroundColor: phiColors.rgbaForStyle
                (
                        phiColors.hslaToRgba
                        (
                            phiColors.generate
                            (
                                base,
                                hue,
                                0,
                                0,
                                alpha
                            )
                        )
                ),
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