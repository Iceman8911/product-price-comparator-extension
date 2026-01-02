/** biome-ignore-all lint/complexity/useLiteralKeys: <TS prefers "computed" key indexes> */

import {
	fixCaughtErrorType,
	SCRAPED_PRODUCT_DATA_CLEANER,
} from "@bandwidth-saver/shared";
import { getCurrency } from "locale-currency";
import * as v from "valibot";
import {
	ProductDataRatingSchema,
	ProductDataSchema,
} from "../../../../../shared/src/models/product";
import { getUserLanguage } from "../../shared";
import type { ProductDataExtractor } from "./shared";

const STORE_NAME = "Konga";

const KongaProductSchema = v.looseObject({
	name: v.string(),
	price: v.number(),
	product_rating: v.looseObject({
		quality: v.looseObject({
			average: ProductDataRatingSchema,
		}),
	}),
});

const windowGlobalExtractor: ProductDataExtractor = (window) => {
	const { name, price, product_rating } = v.parse(
		KongaProductSchema,
		window["__NEXT_DATA__"].props.initialProps.pageProps.data.product,
	);

	const productData = {
		currency: getCurrency(getUserLanguage()) ?? "",
		name,
		price,
		rating: product_rating.quality.average,
		store: STORE_NAME,
	} as const satisfies ProductDataSchema;

	return v.parse(ProductDataSchema, productData);
};

const documentScraperExtractor: ProductDataExtractor = ({ document }) => {
	const scrapedCurrency = document.querySelector(
		"[class*=priceBoxPrice] span",
	)?.textContent;
	const scrapedName = document.querySelector(
		"[class*=productName]",
	)?.textContent;
	const scrapedPrice = document.querySelector(
		"[class*=priceBoxPrice] div",
	)?.textContent;
	const scrapedRating = document.querySelector(
		"[class*=customerReview_] p",
	)?.textContent;

	if (!scrapedCurrency || !scrapedName || !scrapedPrice || !scrapedRating) {
		console.warn(
			"Undefined data in one of the variables:",
			scrapedCurrency,
			scrapedName,
			scrapedPrice,
			scrapedRating,
		);

		return null;
	}

	const productData = {
		currency: SCRAPED_PRODUCT_DATA_CLEANER.currency(scrapedCurrency),
		name: SCRAPED_PRODUCT_DATA_CLEANER.name(scrapedName),
		price: SCRAPED_PRODUCT_DATA_CLEANER.price(scrapedPrice),
		rating: SCRAPED_PRODUCT_DATA_CLEANER.rating(scrapedRating),
		store: STORE_NAME,
	} as const satisfies ProductDataSchema;

	return v.parse(ProductDataSchema, productData);
};

export const kongaProductDataExtractor: ProductDataExtractor = (window) => {
	try {
		return windowGlobalExtractor(window);
	} catch (e) {
		console.warn("Konga extraction failed with error:", fixCaughtErrorType(e));

		try {
			return documentScraperExtractor(window);
		} catch (e) {
			console.warn(
				"Konga scraper extraction failed with error:",
				fixCaughtErrorType(e),
			);

			return null;
		}
	}
};
