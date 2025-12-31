import * as v from "valibot";

const MINIMUM_RATING = 1;
const MAXIMUM_RATING = 5;

export const ProductDataRatingSchema = v.pipe(
	v.number(),
	v.toMinValue(MINIMUM_RATING),
	v.toMaxValue(MAXIMUM_RATING),
	v.brand("product-rating"),
);
export type ProductDataRatingSchema = v.InferOutput<
	typeof ProductDataRatingSchema
>;

export const ProductDataSchema = v.object({
	/** "Naira", "Dollars", "Euros" */
	currency: v.string(),
	name: v.string(),
	/** Effective price.
	 *
	 * May be the original or discounted price, but this will be the actual cost of the product the user will pay at that moment.
	 */
	price: v.number(),
	rating: ProductDataRatingSchema,
});
export type ProductDataSchema = v.InferOutput<typeof ProductDataSchema>;
