# Background Phi Colors README

[![Visual Studio Marketplace](https://vsmarketplacebadge.apphb.com/version/wraith13.background-phi-colors.svg) ![installs](https://vsmarketplacebadge.apphb.com/installs/wraith13.background-phi-colors.svg) ![rating](https://vsmarketplacebadge.apphb.com/rating/wraith13.background-phi-colors.svg)](https://marketplace.visualstudio.com/items?itemName=wraith13.background-phi-colors) [🇯🇵 Japanese / 日本語](https://qiita.com/wraith13/items/5da436536d6a98bd8924)

This extension colors the background in various ways. It is too ambitious and may be very annoying.

This extension just colors the background of all text files. However, this always means that the search will be fully automatic. It will improve code recognition. Unfortunately, this extension is probably not for everyone, and the ratings will vary widely depending on the person. But for those who like it, it will be a very powerful extension.

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

### Current line

![Current line](https://github.com/wraith13/background-phi-colors-vscode/raw/master/images/screenshot/current.line.png)

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

* `Background Phi Colors: Active Scrope: Editor` : sets active scope to editor. ( Each editor is highlighted independently. )
* `Background Phi Colors: Active Scrope: Document` : sets active scope to document. ( Highlight are shared in the same document editors. )
* `Background Phi Colors: Active Scrope: Window` : sets active scope to window. ( Highlight are shared in the all editors. )
* `Background Phi Colors: Toggle Mute` : disables background coloring for the text editor in focus. Execute this command again to enable. This command overrides the `backgroundPhiColors.enabled` setting.
* `Background Phi Colors: Toggle Mute All` : disables background coloring for all text editors. Execute this command again to enable. This command overrides the `backgroundPhiColors.enabled` setting.
* `Background Phi Colors: Toggle Pause` : keeps the current highlighting of the focused text editor even as you move the cursor. Execute this command again not to keep.
* `Background Phi Colors: Toggle Pause All` : keeps the current highlighting of all text editors as you move the cursor. Execute this command again not to keep.
* `Background Phi Colors: Over the Limit` : forces it to work if this extension stopped by the file size limit. ⚠ Keep in mind that VS Code may become extremely heavy depending on the machine performance and text files. If it gets too heavy, please quit or kill VS Code once.
* `Background Phi Colors: Report Profile` : report a profile.

## Extension Settings

This extension contributes the following settings by [`settings.json`](https://code.visualstudio.com/docs/customization/userandworkspace#_creating-user-and-workspace-settings)( Mac: <kbd>Command</kbd>+<kbd>,</kbd>, Windows / Linux: <kbd>File</kbd> -> <kbd>Preferences</kbd> -> <kbd>User Settings</kbd> ):

* `backgroundPhiColors.enabled`: enables that colors background.
* `backgroundPhiColors.enabledPanels`: enables that colors background in output panels.
* `backgroundPhiColors.fileSizeLimit`: does not working for files that exceed this size.
* `backgroundPhiColors.basicDelay`: delay from event occurrence to coloring.
* `backgroundPhiColors.additionalDelay`: addtional delay from update event occurrence to coloring.
* `backgroundPhiColors.baseColor`: background colors are automatically generated by rotating the hue by 1 / phi all around based on this color. ( #RRGGBB )
* `backgroundPhiColors.spaceBaseColor`: space background colors are automatically generated by rotating the hue by 1 / phi all around based on this color. If this value is null `backgroundPhiColors.baseColor` will be used instead. ( #RRGGBB )
* `backgroundPhiColors.spaceErrorColor`: error space background color. ( #RRGGBB )
* `backgroundPhiColors.symbolBaseColor`: symbol background colors are automatically generated by rotating the hue by 1 / phi all around based on this color. If this value is null `backgroundPhiColors.baseColor` will be used instead. ( #RRGGBB )
* `backgroundPhiColors.symbolColorMap`: you can specify the background color for each symbol.
* `backgroundPhiColors.tokenBaseColor`: token background colors are automatically generated by rotating the hue by 1 / phi all around based on this color. If this value is null `backgroundPhiColors.baseColor` will be used instead. ( #RRGGBB )
* `backgroundPhiColors.tokenColorMap`: you can specify the background color for each token.
* `backgroundPhiColors.indentMode`: `none`: does not color indents, `light`: colors indents statically, `smart`: colors the current indent, `full`: light + smart,
* `backgroundPhiColors.lineEnabled`: colors the current line.
* `backgroundPhiColors.tokenMode`: `none`: does not color tokens, `light`: colors all tokens statically, `smart`:colors the tokens contained in the current line, `full`: light + smart,
* `backgroundPhiColors.activeScope`: `editor`: each editor is highlighted independently, `document`: highlight are shared in the same document editors, `window`: highlight are shared in the all editors,
* `backgroundPhiColors.indentErrorEnabled`: colors indent errors
* `backgroundPhiColors.traillingSpacesErrorEnabled`: colors trailing spaces errors
* `backgroundPhiColors.bodySpacesEnabled`: colors two or more consecutive spaces background except for the indent and trailing.
* `backgroundPhiColors.traillingSpacesEnabled`: colors trailing spaces.
* `backgroundPhiColors.symbolEnabled`: colors symbol background.
* `backgroundPhiColors.indentErrorInOverviewRulerLane`: overview ruler lane of indent errors.
* `backgroundPhiColors.activeTokenInOverviewRulerLane`: overview ruler lane of active tokens.
* `backgroundPhiColors.trailingSpacesErrorInOverviewRulerLane`: overview ruler lane of trailing sspaces errors.
* `backgroundPhiColors.spacesAlpha`: Spaces background color opacity. ( 0 - 255)
* `backgroundPhiColors.spacesActiveAlpha`: active spaces background color opacity. ( 0 - 255)
* `backgroundPhiColors.spacesErrorAlpha`: error Spaces background color opacity. ( 0 - 255)
* `backgroundPhiColors.symbolAlpha`: symbols background color opacity. ( 0 - 255)
* `backgroundPhiColors.tokenAlpha`: tokens background color opacity. ( 0 - 255)
* `backgroundPhiColors.tokenActiveAlpha`: active tokens background color opacity. ( 0 - 255)
* `backgroundPhiColors.indent`: indent unit.
* `backgroundPhiColors.enabledProfile`: enables that self-profiler.

### setting example

```json
"backgroundPhiColors.tokenColorMap":
{
    "if": null,
    "else": null,
    "wraith13": "#0000FF"
}
```

### Language specific settings

All settings of Background Phi Colors except `backgroundPhiColors.activeScope` can be language specific.

see <https://code.visualstudio.com/docs/getstarted/settings#_language-specific-editor-settings>.

## Keyboard shortcut Settings

In default, Background Phi Colors's commands doesn't apply keyboard shortcuts. Althogh,
you can apply keyboard shortcuts by [`keybindings.json`](https://code.visualstudio.com/docs/customization/keybindings#_customizing-shortcuts)
( Mac: <kbd>Code</kbd> -> <kbd>Preferences</kbd> -> <kbd>Keyboard Shortcuts</kbd>, Windows / Linux: <kbd>File</kbd> -> <kbd>Preferences</kbd> -> <kbd>Keyboard Shortcuts</kbd>).

Command name on `keybindings.json` is diffarent from on Command Pallete. See below table.

|on Command Pallete|on keybindings.json|
|-|-|
|`Background Phi Colors: Active Scope: Editor`|`backgroundPhiColors.activeScopeEditor`|
|`Background Phi Colors: Active Scope: Document`|`backgroundPhiColors.activeScopeDocument`|
|`Background Phi Colors: Active Scope: Window`|`backgroundPhiColors.activeScopeWindow`|
|`Background Phi Colors: Toggle Mute`|`backgroundPhiColors.toggleMute`|
|`Background Phi Colors: Toggle Mute All`|`backgroundPhiColors.toggleMuteAll`|
|`Background Phi Colors: Toggle Pause`|`backgroundPhiColors.togglePause`|
|`Background Phi Colors: Toggle Pause All`|`backgroundPhiColors.togglePauseAll`|
|`Background Phi Colors: Over the Limit`|`backgroundPhiColors.overTheLimig`|
|`Background Phi Colors: Report Profile`|`backgroundPhiColors.reportProfile`|

## Release Notes

see ChangLog on [marketplace](https://marketplace.visualstudio.com/items/wraith13.background-phi-colors/changelog) or [github](https://github.com/wraith13/background-phi-colors/blob/master/CHANGELOG.md)

## Support

[GitHub Issues](https://github.com/wraith13/background-phi-colors-vscode/issues)

## License

[Boost Software License](https://github.com/wraith13/background-phi-colors-vscode/blob/master/LICENSE_1_0.txt)
