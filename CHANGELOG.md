# Changelog

All notable changes to the Discord Ping Bot will be documented in this file.


## 1.0.0 - 2026-10-24



### Added


- Cooldown timers on protected ping responses



## 0.12.0 - 2026-10-24



### Added


- Schema Version Control

- Custom Cooldowns Custom Messages Cust Message Visibility Preference Options Scaffolding

- Update API to include getters for preference changes Custom Message Message Visability. Update Ping Monitoring Return as boolean. Update Preferences Test

- Get Custom Cooldown

- Handle Custom Messages and Visibility



### Changed


- Updated dependency packages and dev dependencies

- Extend strict type checking to tests and scripts



### Fixed


- Update Message Create to include correct handling of reply on messages

- Adjust start process guards

- Update logic for replies and mentioned users as incorrectly tagging replies without mentions as protected

- Update Types for functions in line with TypeScript strict mode



## 0.10.0 - 2026-10-17



### Added


- Add Ping-Preferences Scaffolding

- Add persistent storage of enable ping preference

- Add getPingMonitoring for current member monitoring status

- Monitoring Service Message Creation Monitoring filtering for enabled users

- Event Create Monitoring only responds to mentioned users who have enabled monitoring functions with ping preferences



### Changed


- Ignore databases



## 0.9.4 - 2026-10-14



### Changed


- Prepare environment for unit testing

- Update Node Package

- Update build yml to latest actions



## 0.9.1 - 2026-10-13



### Added


- Initial setup for SQLite Database Persistance

- Alternative Response Randomiser

- Add Database and Table Creation



### Changed


- Update NodeJS to 26.11.1



### Fixed


- Mermaid Syntax

- Mermaid Syntax

- Mermaid Syntax

- Mermaid Syntax

- Graph Layout

- Graph Layout

- Graph Layout

- Graph Layout

- Graph Layout

- Graph Layout

- Graph Layout

- Mermaid Architecture Final

- Mermaid Architecture Final

- Add Database Graceful Shutdown



## 0.6.1 - 2026-10-11



### Added


- Graceful Shutdown



### Fixed


- Corrected routes for deployCommand, ensured errors are not swallowed adjusted deploycommand folder structure to correctly reflect script location and updated entry script in package.json



## 0.5.0 - 2026-10-11



### Added


- Environment validation at startup

- Ignores @everyone, @here, role mentions, and reply pings, sends gentle reminder response to other mentions



### Changed


- Update folder structure with js files in src folder

- More development scripts out of src replace config with env variables

- Tidy up CLI toolkit



## 0.3.0 - 2026-10-10



### Added


- Add event handler for messages to read metadata of message



### Changed


- Remove not required message import



## 0.2.2 - 2026-10-10



### Fixed


- Update typos in delete all commands script



## 0.2.0 - 2026-10-09



### Added


- Utility scripts and event handling framework



### Changed


- Update License

- Update Node Package Settings



## 0.1.0 - 2026-10-08



### Added


- Initial Framework for Discord Bot


