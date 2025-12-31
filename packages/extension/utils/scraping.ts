const PERIOD_OR_COMMA_REGEX = /,|\./;

export function cleanNumberString(numberString: string): number {
	return Number(numberString.replaceAll(PERIOD_OR_COMMA_REGEX, ""));
}
