/** biome-ignore-all lint/complexity/useLiteralKeys: <TS prefers "computed" key indexes> */
import {
	SCRAPED_PRODUCT_DATA_CLEANER,
	UrlSchema,
} from "@shopping-optimizer/shared";
import * as v from "valibot";
import {
	ProductDataRatingSchema,
	ProductDataSchema,
} from "../../../../../shared/src/models/product";
import {
	createCombinedProductDataExtractor,
	createDocumentScraperProductDataExtractor,
	type ProductDataExtractor,
} from "./shared";

const SPACE_SEPERATOR = " ";
const STORE_NAME = "Jumia";

const JumiaProductSchema = v.looseObject({
	/** This includes the brand and name, e.g "XIAOMI REDMI A5 -  6.88   4GB RAM/128GB ROM  -- BLACK" instead of "REDMI A5 -  6.88   4GB RAM/128GB ROM  -- BLACK" */
	displayName: v.string(),
	image: UrlSchema,
	prices: v.looseObject({
		/** "₦ 104,871" */
		price: v.string(),
	}),
	rating: v.looseObject({
		average: ProductDataRatingSchema,
	}),
});

const windowDataExtractor: ProductDataExtractor = (window) => {
	const { displayName, prices, rating, image } = v.parse(
		JumiaProductSchema,
		window["__STORE__"].products[0],
	);

	const [currency, dirtyPrice] = prices.price.split(SPACE_SEPERATOR);

	if (!currency || !dirtyPrice) return null;

	const productData = {
		currency,
		imgSrc: image,
		name: displayName,
		price: SCRAPED_PRODUCT_DATA_CLEANER.price(dirtyPrice),
		rating: rating.average,
		store: STORE_NAME,
		url: window.location.href,
	} as const satisfies ProductDataSchema;

	return v.parse(ProductDataSchema, productData);
};

const documentScraperExtractor = createDocumentScraperProductDataExtractor(
	(document) => {
		/** There's a lot of useful data attributes on this :D */
		const hiddenDataElement = document.querySelector("#wishlist");

		const scrapedNameFromForm = `${hiddenDataElement?.getAttribute("data-ga4-item_brand") ?? ""}${SPACE_SEPERATOR}${hiddenDataElement?.getAttribute("data-ga4-item_name") ?? ""}`;
		const name =
			scrapedNameFromForm !== SPACE_SEPERATOR
				? scrapedNameFromForm
				: document.querySelector("h1")?.textContent;

		/** "$ 12,466" */
		const [currency, price] =
			document
				.querySelector("[data-price]")
				?.textContent.split(SPACE_SEPERATOR) ?? "";
		/** '4.8 out of 5' */
		const [rating] =
			(
				hiddenDataElement?.getAttribute("data-gtm-dimension27") ??
				document.querySelector(".stars")?.textContent
			)?.split(SPACE_SEPERATOR) ?? "";

		const imgSrc =
			hiddenDataElement?.getAttribute("data-moengage-product_image") ??
			(
				document.querySelector("img[alt^=product_image_name]") as
					| HTMLImageElement
					| undefined
			)?.src;

		return {
			currency,
			imgSrc,
			name,
			price,
			rating,
			store: STORE_NAME,
			url: document.location.href,
		};
	},
);

export const jumiaProductDataExtractor = createCombinedProductDataExtractor(
	STORE_NAME,
	windowDataExtractor,
	documentScraperExtractor,
);
