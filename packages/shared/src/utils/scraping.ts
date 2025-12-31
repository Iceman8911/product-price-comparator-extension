import * as v from "valibot";
import { PRODUCT_RATING_RANGE } from "../constants";
import { ProductDataRatingSchema } from "../models/product";

const PERIOD_OR_COMMA_REGEX = /,|\./;

/** For cleaning stuff like "1,234,566" */
export function cleanPriceString(priceStr: string): number {
	return Number(priceStr.replaceAll(PERIOD_OR_COMMA_REGEX, ""));
}

const RATING_SEPERATOR = "/";
/** For cleaning stuff like "4.4/5", as well as "3.5" */
export function cleanRatingString(ratingStr: string): ProductDataRatingSchema {
	const [
		numerator = PRODUCT_RATING_RANGE.MIN,
		denominator = PRODUCT_RATING_RANGE.MAX,
	] = ratingStr.split(RATING_SEPERATOR).map(Number);

	const actualRating = (numerator / denominator) * PRODUCT_RATING_RANGE.MAX;

	return v.parse(ProductDataRatingSchema, actualRating);
}
