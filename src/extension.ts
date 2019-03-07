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
    export const getTicks = ()=> new Date().getTime();

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