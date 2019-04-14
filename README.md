# Background Phi Colors README

[![Visual Studio Marketplace](https://vsmarketplacebadge.apphb.com/version/wraith13.background-phi-colors.svg) ![installs](https://vsmarketplacebadge.apphb.com/installs/wraith13.background-phi-colors.svg) ![rating](https://vsmarketplacebadge.apphb.com/rating/wraith13.background-phi-colors.svg)](https://marketplace.visualstudio.com/items?itemName=wraith13.background-phi-colors)

This extension colors the background in various ways.

⚠ This extension is still PREVIEW version!

This extension is too ambitious and may be very annoying.

![demo](https://github.com/wraith13/background-phi-colors-vscode/raw/master/images/screenshot/demo.gif)

## Features

This extension colors the background in follow ways.

- indent level
- error indent
- current line
- tokens
- symbols ( this is disabled by default )
- spaces in body
- trailing spaces

### Indent: light

![indent light](https://github.com/wraith13/background-phi-colors-vscode/raw/master/images/screenshot/indent.light.png)

### Indent: smart

![indent smart](https://github.com/wraith13/background-phi-colors-vscode/raw/master/images/screenshot/indent.smart.png)

### Indent: full

![indent full](https://github.com/wraith13/background-phi-colors-vscode/raw/master/images/screenshot/indent.full.png)

### Token: light

![token light](https://github.com/wraith13/background-phi-colors-vscode/raw/master/images/screenshot/token.light.png)

### Token: smart

![token smart](https://github.com/wraith13/background-phi-colors-vscode/raw/master/images/screenshot/token.smart.png)

### Token: full

![token full](https://github.com/wraith13/background-phi-colors-vscode/raw/master/images/screenshot/token.full.png)

### Symbols

![symbols](https://github.com/wraith13/background-phi-colors-vscode/raw/master/images/screenshot/symbols.png)

### Spaces

![spaces](https://github.com/wraith13/background-phi-colors-vscode/raw/master/images/screenshot/spaces.png)

## Tutorial

### 0. ⬇️ Install Background Phi Colors

Show extension side bar within VS Code(Mac:<kbd>Command</kbd>+<kbd>Shift</kbd>+<kbd>X</kbd>, Windows and Linux: <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>X</kbd>), type `background-phi-colors` and press <kbd>Enter</kbd> and click <kbd>Install</kbd>. Restart VS Code when installation is completed.

### 1. 🌈 Colors background

Open a text file. And move cursor. The background color changes automatically.

### 2. 🔧 Next step

You can change [settings](#extension-settings) by `settings.json`. And you can apply [keyboard shortcuts](#keyboard-shortcut-settings) by `keybindings.json`.

Enjoy!

## Commands

Launch Command Palette(Mac:<kbd>F1</kbd> or <kbd>Shift</kbd>+<kbd>Command</kbd>+<kbd>P</kbd>, Windows and Linux: <kbd>F1</kbd> or <kbd>Shift</kbd>+<kbd>Ctrl</kbd>+<kbd>P</kbd>)

* `Background Phi Colors: Active Scrope: Editor` : TBD
* `Background Phi Colors: Active Scrope: Document` : TBD
* `Background Phi Colors: Active Scrope: Window` : TBD
* `Background Phi Colors: Mute` : TBD
* `Background Phi Colors: Mute All` : TBD
* `Background Phi Colors: Pause` : TBD
* `Background Phi Colors: Pause All` : TBD
* `Background Phi Colors: Over the Limit` : TBD
* `Background Phi Colors: Start Profile` : TBD
* `Background Phi Colors: Stop Profile` : TBD

## Extension Settings

This extension contributes the following settings by [`settings.json`](https://code.visualstudio.com/docs/customization/userandworkspace#_creating-user-and-workspace-settings)( Mac: <kbd>Command</kbd>+<kbd>,</kbd>, Windows / Linux: <kbd>File</kbd> -> <kbd>Preferences</kbd> -> <kbd>User Settings</kbd> ):

* `background-phi-colors.enabled`: TBD
* `background-phi-colors.enabledPanels`: TBD
* `background-phi-colors.fileSizeLimit`: TBD
* `background-phi-colors.basicDelay`: TBD
* `background-phi-colors.additionalDelay`: TBD
* `background-phi-colors.baseColor`: TBD
* `background-phi-colors.spaceBaseColor`: TBD
* `background-phi-colors.spaceErrorColor`: TBD
* `background-phi-colors.symbolBaseColor`: TBD
* `background-phi-colors.symbolColorMap`: TBD
* `background-phi-colors.tokenBaseColor`: TBD
* `background-phi-colors.tokenColorMap`: TBD
* `background-phi-colors.indentMode`: TBD
* `background-phi-colors.lineEnabled`: TBD
* `background-phi-colors.tokenMode`: TBD
* `background-phi-colors.activeScope`: TBD
* `background-phi-colors.indentErrorEnabled`: TBD
* `background-phi-colors.traillingSpacesErrorEnabled`: TBD
* `background-phi-colors.bodySpacesEnabled`: TBD
* `background-phi-colors.traillingSpacesEnabled`: TBD
* `background-phi-colors.symbolEnabled`: TBD
* `background-phi-colors.showIndentErrorInOverviewRuler`: TBD
* `background-phi-colors.showActiveTokenInOverviewRuler`: TBD
* `background-phi-colors.showTraillingSpacesErrorInOverviewRuler`: TBD
* `background-phi-colors.spacesAlpha`: TBD
* `background-phi-colors.spacesActiveAlpha`: TBD
* `background-phi-colors.spacesErrorAlpha`: TBD
* `background-phi-colors.symbolAlpha`: TBD
* `background-phi-colors.tokenAlpha`: TBD
* `background-phi-colors.tokenActiveAlpha`: TBD

## Keyboard shortcut Settings

In default, Background Phi Colors's commands doesn't apply keyboard shortcuts. Althogh,
you can apply keyboard shortcuts by [`keybindings.json`](https://code.visualstudio.com/docs/customization/keybindings#_customizing-shortcuts)
( Mac: <kbd>Code</kbd> -> <kbd>Preferences</kbd> -> <kbd>Keyboard Shortcuts</kbd>, Windows / Linux: <kbd>File</kbd> -> <kbd>Preferences</kbd> -> <kbd>Keyboard Shortcuts</kbd>).

Command name on `keybindings.json` is diffarent from on Command Pallete. See below table.

|on Command Pallete|on keybindings.json|
|-|-|
|`Background Phi Colors: Active Scope: Editor`|`background-phi-colors.activeScopeEditor`|
|`Background Phi Colors: Active Scope: Document`|`background-phi-colors.activeScopeDocument`|
|`Background Phi Colors: Active Scope: Window`|`background-phi-colors.activeScopeWindow`|
|`Background Phi Colors: Over the Limit`|`background-phi-colors.overTheLimig`|
|`Background Phi Colors: Pause`|`background-phi-colors.pause`|
|`Background Phi Colors: Pause All`|`background-phi-colors.pauseAll`|
|`Background Phi Colors: Start Profile`|`background-phi-colors.startProfile`|
|`Background Phi Colors: Stop Profile`|`background-phi-colors.stopProfile`|

## Release Notes

see ChangLog on [marketplace](https://marketplace.visualstudio.com/items/wraith13.background-phi-colors/changelog) or [github](https://github.com/wraith13/background-phi-colors/blob/master/CHANGELOG.md)

## Support

[GitHub Issues](https://github.com/wraith13/background-phi-colors-vscode/issues)

## License

[Boost Software License](https://github.com/wraith13/background-phi-colors-vscode/blob/master/LICENSE_1_0.txt)
