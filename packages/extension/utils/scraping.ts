const PERIOD_OR_COMMA_REGEX = /,|\./;

/** For cleaning stuff like "1,234,566" */
export function cleanPriceString(priceStr: string): number {
	return Number(priceStr.replaceAll(PERIOD_OR_COMMA_REGEX, ""));
}
