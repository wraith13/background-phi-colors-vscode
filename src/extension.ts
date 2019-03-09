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
        defaultValue: "#FF666644",
        value: "#FF666644",
    };
    const hueCount =
    {
        name: "humCount",
        minValue: 3,
        maxValue: 47,
        defaultValue: 13,
        value: 13,
    };
    let decorations : { decorator: vscode.TextEditorDecorationType, rangesOrOptions: vscode.Range[] }[] = [];

    export const getConfiguration = <type = vscode.WorkspaceConfiguration>(key? : string | Property<type>, section : string = applicationKey) : type =>
    {
        if (!key || "string" === typeof key)
        {
            const rawKey = undefined === key ? undefined: key.split(".").reverse()[0];
            const rawSection = undefined === key || rawKey === key ? section: `${section}.${key.replace(/(.*)\.[^\.]+/, "$1")}`;
            const configuration = vscode.workspace.getConfiguration(rawSection);
            return rawKey ?
            configuration[rawKey] :
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

    export const initialize = (context : vscode.ExtensionContext): void =>
    {
        context.subscriptions.push
        (
            //  コマンドの登録
            vscode.commands.registerCommand(`${applicationKey}.helloWorld`, async () => await vscode.window.showInformationMessage('Hello World!')),

            //  イベントリスナーの登録
            vscode.window.onDidChangeActiveTextEditor(() => updateDecoration()),
            vscode.workspace.onDidChangeTextDocument(() => updateDecoration()),
            vscode.workspace.onDidChangeConfiguration(() => onDidChangeConfiguration()),
        );

        onDidChangeConfiguration();
    };

    export const onDidChangeConfiguration = (): void =>
    {
        getConfiguration(delay);
        getConfiguration(baseColor);
        getConfiguration(hueCount);
        const baseColorHsla = phiColors.rgbaToHsla(phiColors.rgbaFromStyle(baseColor.value));
        decorations.forEach(i => i.decorator.dispose());
        decorations = [];
        decorations.push
        (
            {
                decorator: createTextEditorDecorationType(baseColorHsla, 0, 1),
                rangesOrOptions: []
            }
        );
        for(let i = 1; i <= hueCount.value; ++i)
        {
            decorations.push
            (
                {
                    decorator: createTextEditorDecorationType(baseColorHsla, i),
                    rangesOrOptions: []
                }
            );
        }
        updateDecoration();
    };

    export const updateDecoration = (): void =>
    {
        const updateStamp = getTicks();
        lastUpdateStamp = updateStamp;
        setTimeout
        (
            () =>
            {
                if (lastUpdateStamp === updateStamp)
                {
                    delayedUpdateDecoration();
                }
            },
            delay.value
        );
    };
    const delayedUpdateDecoration = () =>
    {
        const activeTextEditor = vscode.window.activeTextEditor;
        if (activeTextEditor)
        {
            const text = activeTextEditor.document.getText();
            const tabSize = undefined === activeTextEditor.options.tabSize ?
                4:
                (
                    "number" === typeof activeTextEditor.options.tabSize ?
                        activeTextEditor.options.tabSize:
                        parseInt(activeTextEditor.options.tabSize)
                );

            //  clear
            decorations.forEach(i => i.rangesOrOptions = []);

            //  indent
            const indents : { index: number, text: string }[] = [];
            const indentRegexp = /^([ \t]+)([^\r\n]*)$/gm;
            let totalSpaces = 0;
            while(true)
            {
                const match = indentRegexp.exec(text);
                if (null === match)
                {
                    break;
                }
                let hueIndex = 0;
                for(let i = 0; i < match[1].length; ++i)
                {
                    if (hueCount.value <= hueIndex)
                    {
                        hueIndex = 0;
                    }
                    decorations[hueIndex +1].rangesOrOptions.push
                    (
                        new vscode.Range
                        (
                            activeTextEditor.document.positionAt(match.index +i),
                            activeTextEditor.document.positionAt(match.index +i +1)
                        )
                    );
                    ++hueIndex;
                }
            }

            //  trail
            const trailRegexp = /^([^\r\n]*[^ \t\r\n]+)([ \t]+)$/gm;
            while(true)
            {
                const match = trailRegexp.exec(text);
                if (null === match)
                {
                    break;
                }
                console.log(`match: ${JSON.stringify(match)}`);
                decorations[0].rangesOrOptions.push
                (
                    new vscode.Range
                    (
                        activeTextEditor.document.positionAt(match.index +match[1].length),
                        activeTextEditor.document.positionAt(match.index +match[1].length +match[2].length)
                    )
                );
            }

            //  apply
            decorations.forEach
            (
                i => activeTextEditor.setDecorations(i.decorator, i.rangesOrOptions)
            );
        }
    };
    export const createTextEditorDecorationType = (base: phiColors.Hsla, hue: number, alpha : number = 0.0): vscode.TextEditorDecorationType =>
        vscode.window.createTextEditorDecorationType({backgroundColor: phiColors.rgbaForStyle(phiColors.hslaToRgba(phiColors.generate(base, hue, 0, 0, alpha)))});
}

export function activate(context: vscode.ExtensionContext) : void
{
    BackgroundPhiColors.initialize(context);
}

export function deactivate() : void
{
}