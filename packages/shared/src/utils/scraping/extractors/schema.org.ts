// For compliant shopping sites that implement schema.org

import Defuddle from "defuddle";
import * as v from "valibot";
import { PRODUCT_RATING_RANGE } from "../../../constants";
import { ProductDataSchema } from "../../../models/product";
import { UrlSchema } from "../../../models/shared";
import { SCRAPED_PRODUCT_DATA_CLEANER } from "../cleaning";
import type { ProductDataExtractor } from "./shared";

const ProductTypeLiteral = "Product";
const ProductGroupTypeLiteral = "ProductGroup";

const getSchemaOrgTypeSchema = <StringLiteral extends string>(
	type: StringLiteral,
) =>
	v.union([
		v.literal(type),
		v.pipe(
			v.array(v.string()),
			v.check((arr) => arr.some((typeInArr) => typeInArr === type)),
		),
	]);

const ParsedProductTypeSchema = getSchemaOrgTypeSchema(ProductTypeLiteral);

const ParsedProductGroupTypeSchema = getSchemaOrgTypeSchema(
	ProductGroupTypeLiteral,
);

const ParsedSingleOfferSchema = v.looseObject({
	/** "5970.00" */
	price: v.string(),
	/** "NGN" */
	priceCurrency: v.string(),
});

const ParsedProductOfferSchema = v.union([
	ParsedSingleOfferSchema,
	v.array(ParsedSingleOfferSchema),
]);

const ParsedImageSchema = v.union([
	v.string(),
	v.array(v.string()),
	v.looseObject({ contentUrl: v.array(v.string()) }),
	v.looseObject({ url: v.string() }),
]);

const ParsedVariantSchema = v.looseObject({
	"@type": v.literal(ProductTypeLiteral),
	image: ParsedImageSchema,
	name: v.optional(v.string()),
	/** This is the most important one here */
	offers: ParsedProductOfferSchema,
});

const SharedPropsBetweenProductAndProductGroupSchema = v.looseObject({
	aggregateRating: v.nullish(
		v.looseObject({
			/** "4.1" */
			ratingValue: v.union([v.string(), v.number()]),
		}),
	),

	/** Can be prepended to the name for better info */
	brand: v.nullish(v.union([v.looseObject({ name: v.string() }), v.string()])),

	/** Image url */
	image: ParsedImageSchema,

	name: v.string(),

	/** Site url */
	url: v.nullish(UrlSchema),
});

const ParsedProductSchema = v.looseObject({
	...SharedPropsBetweenProductAndProductGroupSchema.entries,

	"@type": ParsedProductTypeSchema,

	/** Rarely absent  */
	offers: v.optional(ParsedProductOfferSchema),

	/** Rarely present unless `offers` is unavailable: "5970.00" */
	price: v.optional(v.string()),
	/** Rarely present unless `offers` is unavailable:  "NGN" */
	priceCurrency: v.optional(v.string()),
});

const ParsedProductGroupSchema = v.looseObject({
	...SharedPropsBetweenProductAndProductGroupSchema.entries,
	"@type": ParsedProductGroupTypeSchema,
	hasVariant: v.array(ParsedVariantSchema),
});

const ParsedProductOrProductGroupSchema = v.union([
	ParsedProductGroupSchema,
	ParsedProductSchema,
]);
type ParsedProductOrProductGroupSchema = v.InferOutput<
	typeof ParsedProductOrProductGroupSchema
>;

const JsonSchema = v.union([
	v.record(v.string(), v.unknown()),
	v.array(v.unknown()),
]);
type JsonSchema = v.InferOutput<typeof JsonSchema>;

/** A schema object representing a product; i.e `@type: "Product"` */
function findSchemaObjectWithProductData(
	json: JsonSchema,
): ParsedProductOrProductGroupSchema | null {
	if (Array.isArray(json)) {
		for (const value of json) {
			if (v.is(ParsedProductOrProductGroupSchema, value)) return value;

			if (v.is(JsonSchema, value)) {
				const res = findSchemaObjectWithProductData(value);

				if (res) return res;
			}
		}
	} else {
		if (v.is(ParsedProductOrProductGroupSchema, json)) return json;

		for (const key in json) {
			const value = json[key];

			if (v.is(JsonSchema, value)) {
				const res = findSchemaObjectWithProductData(value);

				if (res) return res;
			}
		}
	}

	return null;
}

const getProductDataFromScrapedSchemaOrgData = (arg: {
	brand?: string | undefined;
	currency: string;
	image: ParsedProductOrProductGroupSchema["image"];
	backupImage: string;
	name: string;
	backupName: string;
	price: string;
	rating: string;
	store: string;
	url: string;
}): ProductDataSchema => {
	const {
		backupImage,
		backupName,
		brand,
		currency,
		image,
		name,
		price,
		rating,
		store,
		url,
	} = arg;

	const extractedProductData: ProductDataSchema = {
		currency: SCRAPED_PRODUCT_DATA_CLEANER.currency(currency),
		imgSrc: SCRAPED_PRODUCT_DATA_CLEANER.imgSrc(
			Array.isArray(image)
				? (image[0] ?? backupImage)
				: typeof image === "string"
					? image
					: "url" in image
						? `${image.url}`
						: (image.contentUrl[0] ?? backupImage),
		),
		name: SCRAPED_PRODUCT_DATA_CLEANER.name(
			brand &&
				name &&
				!name.startsWith(brand) &&
				!brand.toLowerCase().includes("null")
				? `${brand} ${name}`
				: name
					? name
					: backupName,
		),
		price: SCRAPED_PRODUCT_DATA_CLEANER.price(price),
		rating: SCRAPED_PRODUCT_DATA_CLEANER.rating(rating),
		store: SCRAPED_PRODUCT_DATA_CLEANER.store(store),
		url: SCRAPED_PRODUCT_DATA_CLEANER.url(url),
	};

	return v.parse(ProductDataSchema, extractedProductData);
};

export const schemaOrgProductDataExtractor: ProductDataExtractor = (
	ctx,
	ctxUrl = ctx.location.href,
) => {
	const documentArg = ctx instanceof Document ? ctx : ctx.document;

	const { schemaOrgData, image, site, author, title } = new Defuddle(
		documentArg.cloneNode(true) as Document,
	).parse();

	// No schemaOrgData so there's not much use going further
	if (!schemaOrgData) return null;

	const possibleParsedProduct = findSchemaObjectWithProductData(schemaOrgData);

	if (v.is(ParsedProductSchema, possibleParsedProduct)) {
		const {
			aggregateRating,
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

		return getProductDataFromScrapedSchemaOrgData({
			backupImage: image,
			backupName: title,
			brand: parsedBrand,
			currency: schemaCurrency,
			image: schemaImage,
			name: schemaName,
			price: schemaPrice,
			rating: `${aggregateRating?.ratingValue ?? PRODUCT_RATING_RANGE.MIN}`,
			store: site ?? author,
			url: schemaDocumentUrl ?? ctxUrl,
		});
	} else if (v.is(ParsedProductGroupSchema, possibleParsedProduct)) {
		const {
			aggregateRating,
			brand: schemaBrand,
			image: schemaImage,
			name: schemaName,
			url: schemaDocumentUrl,
			hasVariant: schemaVariants,
		} = possibleParsedProduct;

		const parsedBrand =
			typeof schemaBrand === "string" ? schemaBrand : schemaBrand?.name;

		const offers = schemaVariants[0]?.offers ?? [];

		const schemaCurrency = Array.isArray(offers)
			? offers[0]?.priceCurrency
			: offers?.priceCurrency;
		const schemaPrice = Array.isArray(offers)
			? offers[0]?.price
			: offers?.price;

		if (!schemaPrice || !schemaCurrency) return null;

		return getProductDataFromScrapedSchemaOrgData({
			backupImage: image,
			backupName: title,
			brand: parsedBrand,
			currency: schemaCurrency,
			image: schemaImage,
			name: schemaName,
			price: schemaPrice,
			rating: `${aggregateRating?.ratingValue ?? PRODUCT_RATING_RANGE.MIN}`,
			store: site ?? author,
			url: schemaDocumentUrl ?? ctxUrl,
		});
	}

	return null;
};
