# Proposed Architecture #

```mermaid
graph TD;
	SlashCommands-->Services;
	Events-->Services;
	Services<-->Storage;
	Scripts;
	Test;
```
