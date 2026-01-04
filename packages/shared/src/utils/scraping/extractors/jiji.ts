/** biome-ignore-all lint/complexity/useLiteralKeys: <TS prefers "computed" key indexes> */
import * as v from "valibot";
import { PRODUCT_RATING_RANGE } from "../../../constants";
import { ProductDataSchema } from "../../../models/product";
import { UrlSchema } from "../../../models/shared";
import { SCRAPED_PRODUCT_DATA_CLEANER } from "../cleaning";
import {
	createCombinedProductDataExtractor,
	createDocumentScraperProductDataExtractor,
	type ProductDataExtractor,
} from "./shared";

const STORE_NAME = "Jiji";

const SPACE_SEPERATOR = " ";

const JijiProductSchema = v.looseObject({
	/** Primary Image */
	og_image_url: UrlSchema,
	og_product_data: v.array(
		v.object({
			/**
			 * Content value corresponding to the property above.
			 * For price:amount this is the raw numeric string we clean later.
			 * For price:currency this is the ISO code (almost always "NGN" on jiji.ng).
			 */
			content: v.string(),
			/**
			 * Property name (examples):
			 * - "product:brand"          → brand or category name
			 * - "product:availability"   → usually "in stock"
			 * - "product:price:amount"   → price as string, e.g. "10000.00"
			 * - "product:price:currency" → currency code, e.g. "NGN"
			 * - "product:condition"      → e.g. "brand new" or "used"
			 */
			property: v.picklist([
				"product:brand",
				"product:availability",
				"product:price:amount",
				"product:price:currency",
				"product:condition",
			]),
		}),
	),
	/** Product name */
	og_title: v.string(),
});

const windowGlobalExtractor: ProductDataExtractor = (window) => {
	/** Should have a single key like `advert-item-dLNJCtqZV24v3qoyHp3OegUR` */
	const windowData = window["useNuxtApp"]().payload.data;

	//@ts-expect-error Still not done getting the value :p
	const rawProductData = Object.values(windowData).find(Boolean).advert.seo;

	const { og_title, og_image_url, og_product_data } = v.parse(
		JijiProductSchema,
		rawProductData,
	);

	const possiblePrice = og_product_data.find(
		(data) => data.property === "product:price:amount",
	)?.content;
	const possibleCurrency = og_product_data.find(
		(data) => data.property === "product:price:currency",
	)?.content;

	if (!possibleCurrency || !possiblePrice) return null;

	const productData = {
		currency: possibleCurrency,
		imgSrc: og_image_url,
		name: og_title,
		price: SCRAPED_PRODUCT_DATA_CLEANER.price(possiblePrice),
		/** Jiji doesn't expose ratings anywhere */
		rating: PRODUCT_RATING_RANGE.MIN,
		store: STORE_NAME,
		url: window.location.href,
	} as const satisfies ProductDataSchema;

	return v.parse(ProductDataSchema, productData);
};

const documentScraperExtractor = createDocumentScraperProductDataExtractor(
	(document) => {
		const name = document.querySelector("h1")?.textContent;
		/** '₦ 18,000' */
		const [currency, price] = (
			document.querySelector("[class*=qa-advert-price-view-value]")
				?.textContent ?? ""
		).split(SPACE_SEPERATOR);
		const imgSrc = (
			document.querySelector("img[data-nuxt-pic]") as
				| HTMLImageElement
				| undefined
		)?.src;

		return {
			currency,
			imgSrc,
			name,
			price,
			/** Jiji doesn't expose ratings anywhere */
			rating: `${PRODUCT_RATING_RANGE.MIN}`,
			store: STORE_NAME,
			url: document.location.href,
		};
	},
);

export const jijiProductDataExtractor = createCombinedProductDataExtractor(
	STORE_NAME,
	windowGlobalExtractor,
	documentScraperExtractor,
);
