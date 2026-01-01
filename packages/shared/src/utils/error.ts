export function fixCaughtErrorType(error: unknown): Error {
	return error instanceof Error ? error : Error(String(error));
}
