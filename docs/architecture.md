# Proposed Architecture

## Application Architecture

```mermaid
graph TD;
	Commands[/"Slash Commands driven by users"/] --> Services;
	Events>Events asynchronous notifications from Discord] --> Services;
	Services <--> DB[("Storage (SQLite)")];
```

## Development & Administration
```mermaid
graph TD;
	Scripts ~~~ Test;
```
