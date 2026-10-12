# Proposed Architecture #

```mermaid
graph TD;
	Slash-Commands-->Services;
	Events-->Services;
	Services<-->DB[(Storage SQLite)];
	Scripts;
	Test;
```
