import 'node:sqlite';

declare module 'node:sqlite' {
	export { DatabaseSync as Database };
}
