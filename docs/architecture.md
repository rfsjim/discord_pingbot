# Proposed Architecture #

```mermaid
graph td;
	SlashCommands-->Services;
	Events-->Services;
	Services<-->Storage;
	Scripts;
	Test;
```
