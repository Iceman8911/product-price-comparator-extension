import * as v from "valibot";
import PlaceholderImg from "../../assets/placeholder.webp";
import { PRODUCT_RATING_RANGE } from "../../constants";
import {
	ProductDataRatingSchema,
	type ProductDataSchema,
} from "../../models/product";
import { UrlSchema } from "../../models/shared";

function genericCleaner(str: string): string {
	return str.trim();
}

/** For cleaning stuff like "1,234,566" */
function cleanPriceString(priceStr: string): number {
	return Number(
		genericCleaner(priceStr)
			// Remove spaces
			.replace(/\s+/g, "")
			// Remove thousands separators (commas or periods) only if followed by 3 digits
			.replace(/(?<=\d)[,.](?=\d{3}\b)/g, "")
			// Normalize decimal separator: replace comma with dot if it's the decimal
			.replace(/,(\d{1,2})$/, ".$1"),
	);
}

const RATING_SEPERATOR = "/";
/** For cleaning stuff like "4.4/5", as well as "3.5" */
function cleanRatingString(ratingStr: string): ProductDataRatingSchema {
	const [
		numerator = PRODUCT_RATING_RANGE.MIN,
		denominator = PRODUCT_RATING_RANGE.MAX,
	] = genericCleaner(ratingStr).split(RATING_SEPERATOR).map(Number);

	const actualRating = (numerator / denominator) * PRODUCT_RATING_RANGE.MAX;

	return v.parse(ProductDataRatingSchema, actualRating);
}

function cleanUrlString(imgSrc: string): UrlSchema {
	try {
		let urlToClean = genericCleaner(imgSrc);

		// Protocol-relative url
		if (urlToClean.startsWith("//")) {
			urlToClean = `https:${urlToClean}`;
		}

		return v.parse(UrlSchema, urlToClean);
	} catch {
		console.warn(
			"Image source string,",
			imgSrc,
			"could not be parsed properly",
		);

		return PlaceholderImg;
	}
}

/** For cleaning and extracting proper data from scraped strings */
export const SCRAPED_PRODUCT_DATA_CLEANER = {
	currency: genericCleaner,
	imgSrc: cleanUrlString,
	name: genericCleaner,
	price: cleanPriceString,
	rating: cleanRatingString,
	store: genericCleaner,
	url: cleanUrlString,
} as const satisfies {
	[key in keyof ProductDataSchema]: (strToClean: string) => unknown;
};
