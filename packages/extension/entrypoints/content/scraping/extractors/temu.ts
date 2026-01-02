/** biome-ignore-all lint/complexity/useLiteralKeys: <TS prefers "computed" key indexes> */

import {
	SCRAPED_PRODUCT_DATA_CLEANER,
	UrlSchema,
} from "@bandwidth-saver/shared";
import * as v from "valibot";
import {
	ProductDataRatingSchema,
	ProductDataSchema,
} from "../../../../../shared/src/models/product";
import {
	createCombinedProductDataExtractor,
	type ProductDataExtractor,
} from "./shared";

const STORE_NAME = "Temu";
const SPACE_SEPERATOR = " ";

const TemuProductSchema = v.looseObject({
	goods: v.looseObject({
		goodsName: v.string(),
		hdThumbUrl: UrlSchema,

		/** Only contains data from the current sale and will be be price of the cheapest option available */
		salePriceRich: v.looseTuple([
			v.looseObject({
				/** Currency */
				text: v.string(),
			}),
			v.looseObject({
				/** Price */
				text: v.string(),
			}),
		]),
	}),
	review: v.looseObject({ reviewScore: ProductDataRatingSchema }),
});

const windowGlobalExtractor: ProductDataExtractor = (window) => {
	const {
		goods: {
			goodsName,
			hdThumbUrl,
			salePriceRich: [{ text: currency }, { text: price }],
		},
		review: { reviewScore },
	} = v.parse(TemuProductSchema, window["rawData"].store);

	const productData = {
		currency,
		imgSrc: hdThumbUrl,
		name: goodsName,
		price: SCRAPED_PRODUCT_DATA_CLEANER.price(price),
		rating: reviewScore,
		store: STORE_NAME,
	} as const satisfies ProductDataSchema;

	return v.parse(ProductDataSchema, productData);
};

const documentScraperExtractor: ProductDataExtractor = ({ document }) => {
	const scrapedName = document.querySelector("h1")?.textContent;
	const [_, scrapedCurrency, scrapedPrice] = Array.from(
		document.querySelectorAll(
			"#goods_price span[data-type='0'][aria-hidden=true]",
		),
	).map((a) => a.textContent);
	/** '4.7 out of five stars' */
	const [scrapedRating] =
		document
			.querySelector(`[aria-label*='out of five stars']`)
			?.ariaLabel?.split(SPACE_SEPERATOR) ?? "";
	const scrapedImgUrl = (
		document.querySelector(`img[aria-label="Goods Image"]`) as
			| HTMLImageElement
			| undefined
	)?.src;

	if (
		!scrapedCurrency ||
		!scrapedName ||
		!scrapedPrice ||
		!scrapedRating ||
		!scrapedImgUrl
	) {
		console.warn(
			"Undefined data in one of the variables:",
			scrapedCurrency,
			scrapedName,
			scrapedPrice,
			scrapedRating,
			scrapedImgUrl,
		);

		return null;
	}

	const productData = {
		currency: SCRAPED_PRODUCT_DATA_CLEANER.currency(scrapedCurrency),
		imgSrc: SCRAPED_PRODUCT_DATA_CLEANER.imgSrc(scrapedImgUrl),
		name: SCRAPED_PRODUCT_DATA_CLEANER.name(scrapedName),
		price: SCRAPED_PRODUCT_DATA_CLEANER.price(scrapedPrice),
		rating: SCRAPED_PRODUCT_DATA_CLEANER.rating(scrapedRating),
		store: STORE_NAME,
	} as const satisfies ProductDataSchema;

	return v.parse(ProductDataSchema, productData);
};

export const temuProductDataExtractor = createCombinedProductDataExtractor(
	STORE_NAME,
	windowGlobalExtractor,
	documentScraperExtractor,
);
