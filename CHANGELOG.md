# Change Log

All notable changes to the "Background Phi Colors" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## 2.1.1 - 2020-??-??

### Fixed

- Added missing Japanese translation.

## 2.1.0 - 2019-11-03

### Added

- `backgroundPhiColors.overTheLimitMessageShowMode` setting.

### Changed

- Slightly improved performance.

## 2.0.0 - 2019-07-09

### Added

- `backgroundPhiColors.enabledProfile` setting.
- `backgroundPhiColors.reportProfile` command.

### Changed

- Improved profile report.

### Removed

- `backgroundPhiColors.startProfile` command.
- `backgroundPhiColors.stopProfile` command.

## 1.0.1 - 2019-06-10

### Fixed

- Fixed an issue that [WS-2018-0588](https://github.com/unshiftio/querystringify/pull/19).

## 1.0.0 - 2019-05-05

### Added

- 🎊 General availability release of Background Phi Colors. 🎉
- `indent` setting.
- support 🇯🇵 Japanese.

### Changed

- Changed `background-phi-colors.` prefix of all commands and all settings to `backgroundPhiColors.`.
- Changed default value of `activeScope` setting from "editor" to "window".
- Changed stop profile message.
- Changed `Mute` command title to `Toggle Mute`.
- Changed `Mute All` command title to `Toggle Mute All`.
- Changed `Pause` command title to `Toggle Pause`.
- Changed `Pause All` command title to `Toggle Pause All`.
- Merged `showIndentErrorInOverviewRuler` setting into `indentErrorInOverviewRulerLane` setting.
- Merged `showActiveTokenInOverviewRuler` setting into `activeTokenInOverviewRulerLane` setting.
- Merged `showTrailingSpacesErrorInOverviewRuler` setting into `trailingSpacesErrorInOverviewRulerLane` setting.
- Changed to keep the active editor until the next valid editor is focused.

### Fixed

- Fixed an issue that `background-phi-colors.overTheLimit` command is not effective immediately for all editors.
- Fixed an issue that the background color was not updated when the cursor moved when only the `lineEnabled` setting was true.

## 0.9.0 - 2019-04-15

### Added

- `Mute` command and `Mute All` command.
- `background-phi-colors.indentErrorInOverviewRulerLane` setting.
- `background-phi-colors.activeTokenInOverviewRulerLane` setting.
- `background-phi-colors.trailingSpacesErrorInOverviewRulerLane` setting.

### Changed

- Changed `background-phi-colors.showIndentErrorInOverviewRulerLane` setting name to `background-phi-colors.showIndentErrorInOverviewRuler`.
- Changed `background-phi-colors.showActiveTokenInOverviewRulerLane` setting name to `background-phi-colors.showActiveTokenInOverviewRuler`.
- Changed `background-phi-colors.showTrailingSpacesErrorInOverviewRulerLane` setting name to `background-phi-colors.showTrailingSpacesErrorInOverviewRuler`.

## 0.8.0 - 2019-04-11

### Changed

- Changed the behavior of `Pause` command and `Pause All` command.

### Fixed

- Fixed an issue that disastrous situation around indent by tab character.
- Fixed some issues that indentation error and trailing space not displayed on overview ruler.

## 0.7.0 - 2019-04-08

### Fixed

- Fixed a misspell that `trailling` to `trailing`
- Fixed an issue that `background-phi-colors.enabled` setting does not work properly.

## 0.6.0 - 2019-04-07

### Added

- Active Scope
- settings validator for enum.

### Changed

- Improved token color hash function.

### Fixed

- Fixed an issue that does not work correctly with lines containing "toString", "hasOwnProperty", etc.

## 0.5.0 - 2019-04-02

### Added

- `background-phi-colors.spaceErrorColor` setting.
- `background-phi-colors.spaceBaseColor` setting.
- `background-phi-colors.symbolBaseColor` setting.
- `background-phi-colors.symbolColorMap` setting.
- `background-phi-colors.tokenBaseColor` setting.
- `background-phi-colors.tokenColorMap` setting.
- settings validator.
- regExpExecToArray() as profiling item.

### Changed

- Renewal of extension icon.
- default value of `background-phi-colors.baseColor` setting, and setting mean. ( In default value it does not change in totally. )

### Fixed

- Fixed an issue that setting value min/max does not function properly on TypeScript.

## 0.4.0 - 2019-03-26

### Added

- `background-phi-colors.lineEnabled` setting.

### Fixed

- Fixed a memory leak issue.

## 0.3.1 - 2019-03-25

### Fixed

- Fixed an issue that does not work properly at deepest indent.
- Fixed an issue that does not work properly without indent.
- Fixed an issue that caused excessive coloring to remain when editing text.
- Fixed an issue with unnecessary warning messages in debug console.

## 0.3.0 - 2019-03-25

### Added

- `background-phi-colors.enabledPanels` setting.
- `background-phi-colors.basicDelay` setting.
- `background-phi-colors.additionalDelay` setting.

### Removed

- `background-phi-colors.delay` setting.

### Changed

- Improved performance about 100 times! 💪💪💪

## 0.2.0 - 2019-03-20

### Added

- Embedded self-profiler.

## 0.1.3 - 2019-03-18

### Fixed

- Fixed Background Phi Colors`s URLs in package.json.

## 0.1.2 - 2019-03-18

### Fixed

- Fixed image URLs in README.

## 0.1.1 - 2019-03-18

- Retry publish because images problem in README.

## 0.1.0 - 2019-03-18

### Added

- Initial release of Background Phi Colors.

## [Unreleased]

## 0.0.0 - 2019-01-17

### Added

- Start this project.
