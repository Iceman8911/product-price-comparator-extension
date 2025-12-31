import * as v from "valibot";
import { PRODUCT_RATING_RANGE } from "../constants";

export const ProductDataRatingSchema = v.pipe(
	v.number(),
	v.minValue(PRODUCT_RATING_RANGE.MIN),
	v.maxValue(PRODUCT_RATING_RANGE.MAX),
);
export type ProductDataRatingSchema = v.InferOutput<
	typeof ProductDataRatingSchema
>;

export const ProductDataSchema = v.object({
	/** "$" */
	currency: v.string(),
	name: v.string(),
	/** Effective price.
	 *
	 * May be the original or discounted price, but this will be the actual cost of the product the user will pay at that moment.
	 */
	price: v.number(),
	rating: ProductDataRatingSchema,
	/** "Konga", "Jumia", "Temu", "Ebay", etc */
	store: v.string(),
});
export type ProductDataSchema = v.InferOutput<typeof ProductDataSchema>;
