const PERIOD_OR_COMMA_REGEX = /,|\./;

export function cleanPriceString(priceStr: string): number {
	return Number(priceStr.replaceAll(PERIOD_OR_COMMA_REGEX, ""));
}
