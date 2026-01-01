/** biome-ignore-all lint/complexity/useLiteralKeys: <TS prefers "computed" key indexes> */

import { fixCaughtErrorType } from "@bandwidth-saver/shared";
import { getCurrency } from "locale-currency";
import * as v from "valibot";
import {
	ProductDataRatingSchema,
	ProductDataSchema,
} from "../../../../../shared/src/models/product";
import { getUserLanguage } from "../../shared";
import type { ProductDataExtractor } from "./shared";

const KongaProductSchema = v.looseObject({
	name: v.string(),
	price: v.number(),
	product_rating: v.looseObject({
		quality: v.looseObject({
			average: ProductDataRatingSchema,
		}),
	}),
});

export const kongaProductDataExtractor: ProductDataExtractor = (window) => {
	try {
		const { name, price, product_rating } = v.parse(
			KongaProductSchema,
			window["__NEXT_DATA__"].props.initialProps.pageProps.data.product,
		);

		const productData = {
			currency: getCurrency(getUserLanguage()) ?? "",
			name,
			price,
			rating: product_rating.quality.average,
			store: "Konga",
		} as const satisfies ProductDataSchema;

		return v.parse(ProductDataSchema, productData);
	} catch (e) {
		console.warn("Konga extraction failed with error:", fixCaughtErrorType(e));

		return null;
	}
};
