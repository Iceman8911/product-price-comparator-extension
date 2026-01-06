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

const windowGlobalExtractor: ProductDataExtractor = (ctx) => {
	if (!(ctx instanceof Window)) return null;

	const {
		goods: {
			goodsName,
			hdThumbUrl,
			salePriceRich: [{ text: currency }, { text: price }],
		},
		review: { reviewScore },
	} = v.parse(TemuProductSchema, ctx["rawData"].store);

	const productData = {
		currency,
		imgSrc: hdThumbUrl,
		name: goodsName,
		price: SCRAPED_PRODUCT_DATA_CLEANER.price(price),
		rating: reviewScore,
		store: STORE_NAME,
		url: ctx.location.href,
	} as const satisfies ProductDataSchema;

	return v.parse(ProductDataSchema, productData);
};

const documentScraperExtractor = createDocumentScraperProductDataExtractor(
	(documentArg) => {
		const name = documentArg.querySelector("h1")?.textContent;
		const [_, currency, price] = Array.from(
			documentArg.querySelectorAll(
				"#goods_price span[data-type='0'][aria-hidden=true]",
			),
		).map((a) => a.textContent);
		/** '4.7 out of five stars' */
		const [rating] =
			documentArg
				.querySelector(`[aria-label*='out of five stars']`)
				?.ariaLabel?.split(SPACE_SEPERATOR) ?? "";
		const imgSrc = (
			documentArg.querySelector(`img[aria-label="Goods Image"]`) as
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
			url: documentArg.location.href,
		};
	},
);

export const temuProductDataExtractor = createCombinedProductDataExtractor(
	STORE_NAME,
	windowGlobalExtractor,
	documentScraperExtractor,
);
