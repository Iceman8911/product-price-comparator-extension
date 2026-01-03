// For compliant shopping sites that implement schema.org

import Defuddle from "defuddle";
import * as v from "valibot";
import { PRODUCT_RATING_RANGE } from "../../../constants";
import { ProductDataSchema } from "../../../models/product";
import { UrlSchema } from "../../../models/shared";
import { SCRAPED_PRODUCT_DATA_CLEANER } from "../cleaning";
import type { ProductDataExtractor } from "./shared";

const ExpectedProductTypeLiteral = "Product";

const ParsedProductTypeSchema = v.union([
	v.literal(ExpectedProductTypeLiteral),
	v.pipe(
		v.array(v.string()),
		v.check((arr) => arr.some((type) => type === ExpectedProductTypeLiteral)),
	),
]);

const ParsedProductOfferSchema = v.looseObject({
	/** "5970.00" */
	price: v.string(),
	/** "NGN" */
	priceCurrency: v.string(),
});

const ParsedProductSchema = v.looseObject({
	"@type": ParsedProductTypeSchema,

	aggregateRating: v.looseObject({
		/** "4.1" */
		ratingValue: v.union([v.string(), v.number()]),
	}),

	/** Can be prepended to the name for better info */
	brand: v.nullable(v.union([v.looseObject({ name: v.string() }), v.string()])),

	/** Image url */
	image: v.union([
		v.string(),
		v.array(v.string()),
		v.looseObject({ contentUrl: v.array(v.string()) }),
		v.looseObject({ url: v.string() }),
	]),

	name: v.string(),

	/** Rarely absent  */
	offers: v.optional(
		v.union([ParsedProductOfferSchema, v.array(ParsedProductOfferSchema)]),
	),

	/** Rarely present unless `offers` is unavailable: "5970.00" */
	price: v.optional(v.string()),
	/** Rarely present unless `offers` is unavailable:  "NGN" */
	priceCurrency: v.optional(v.string()),

	/** Site url */
	url: v.nullable(UrlSchema),
});
type ParsedProductSchema = v.InferOutput<typeof ParsedProductSchema>;

const JsonSchema = v.union([
	v.record(v.string(), v.unknown()),
	v.array(v.unknown()),
]);
type JsonSchema = v.InferOutput<typeof JsonSchema>;

/** A schema object representing a product; i.e `@type: "Product"` */
function findSchemaObjectWithProductType(
	json: JsonSchema,
): ParsedProductSchema | null {
	if (Array.isArray(json)) {
		for (const value of json) {
			if (v.is(JsonSchema, value))
				return findSchemaObjectWithProductType(value);
		}
	} else {
		for (const key in json) {
			const value = json[key];

			if (key === "@type" && v.is(ParsedProductTypeSchema, value))
				return v.parse(ParsedProductSchema, json);

			if (v.is(JsonSchema, value))
				return findSchemaObjectWithProductType(value);
		}
	}

	return null;
}

export const schemaOrgProductDataExtractor: ProductDataExtractor = async ({
	document,
}) => {
	const { schemaOrgData, image, site, author, title } = new Defuddle(
		document.cloneNode(true) as Document,
	).parse();

	// No schemaOrgData so there's not much use going further
	if (!schemaOrgData) return null;

	const possibleParsedProduct = findSchemaObjectWithProductType(schemaOrgData);

	if (!possibleParsedProduct) return null;

	const {
		aggregateRating: { ratingValue: schemaRating },
		brand: schemaBrand,
		image: schemaImage,
		name: schemaName,
		offers,
		url: schemaDocumentUrl,
		price,
		priceCurrency,
	} = possibleParsedProduct;

	const parsedBrand =
		typeof schemaBrand === "string" ? schemaBrand : schemaBrand?.name;

	const schemaCurrency = Array.isArray(offers)
		? offers[0]?.priceCurrency
		: (offers?.priceCurrency ?? priceCurrency);
	const schemaPrice = Array.isArray(offers)
		? offers[0]?.price
		: (offers?.price ?? price);

	if (!schemaPrice || !schemaCurrency) return null;

	const extractedProductData: ProductDataSchema = {
		currency: SCRAPED_PRODUCT_DATA_CLEANER.currency(schemaCurrency),
		imgSrc: SCRAPED_PRODUCT_DATA_CLEANER.imgSrc(
			Array.isArray(schemaImage)
				? (schemaImage[0] ?? image)
				: typeof schemaImage === "string"
					? schemaImage
					: "url" in schemaImage
						? `${schemaImage.url}`
						: (schemaImage.contentUrl[0] ?? image),
		),
		name: SCRAPED_PRODUCT_DATA_CLEANER.name(
			parsedBrand && schemaName
				? `${parsedBrand} ${schemaName}`
				: schemaName
					? schemaName
					: title,
		),
		price: SCRAPED_PRODUCT_DATA_CLEANER.price(schemaPrice),
		rating: SCRAPED_PRODUCT_DATA_CLEANER.rating(
			`${schemaRating ?? PRODUCT_RATING_RANGE.MIN}`,
		),
		store: site ?? author,
		url: SCRAPED_PRODUCT_DATA_CLEANER.url(
			schemaDocumentUrl ?? document.location.href,
		),
	};

	return v.parse(ProductDataSchema, extractedProductData);
};
