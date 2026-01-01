// Some shopping sites have the currently viewed product's data somewhere within a global
/** biome-ignore-all lint/complexity/useLiteralKeys: <TS prefers "computed" key indexes> */

import {
	SCRAPED_PRODUCT_DATA_CLEANER,
	SupportedSitePatterns,
} from "@bandwidth-saver/shared";
import * as v from "valibot";
import {
	ProductDataRatingSchema,
	ProductDataSchema,
} from "../../../../shared/src/models/product";

/** Either scrapes or sniffs js globals or smth */
type ProductDataExtractor = (
	// biome-ignore lint/suspicious/noExplicitAny: <To cover sites that add extra props to the window object>
	siteWindow: Window & Record<string, any>,
) => ProductDataSchema | null;

const SPACE_SEPERATOR = " ";

const JumiaProductSchema = v.looseObject({
	/** This includes the brand and name, e.g "XIAOMI REDMI A5 -  6.88   4GB RAM/128GB ROM  -- BLACK" instead of "REDMI A5 -  6.88   4GB RAM/128GB ROM  -- BLACK" */
	displayName: v.string(),
	prices: v.looseObject({
		/** "₦ 104,871" */
		price: v.string(),
	}),
	rating: v.looseObject({
		average: ProductDataRatingSchema,
	}),
});

const jumiaExtractor: ProductDataExtractor = (window) => {
	try {
		const { displayName, prices, rating } = v.parse(
			JumiaProductSchema,
			window["__STORE__"].products[0],
		);

		const [currency, dirtyPrice] = prices.price.split(SPACE_SEPERATOR);

		if (!currency || !dirtyPrice) return null;

		const productData = {
			currency,
			name: displayName,
			price: SCRAPED_PRODUCT_DATA_CLEANER.price(dirtyPrice),
			rating: rating.average,
			store: "Jumia",
		} as const satisfies ProductDataSchema;

		return v.parse(ProductDataSchema, productData);
	} catch (e) {
		console.warn("Jumia extraction failed with error:", e);

		return null;
	}
};

const SUPPORTED_SITE_PRODUCT_DATA_EXTRACTOR = {
	[SupportedSitePatterns.JUMIA]: jumiaExtractor,
} as const satisfies {
	[key in SupportedSitePatterns]?: ProductDataExtractor;
};

export default SUPPORTED_SITE_PRODUCT_DATA_EXTRACTOR;
