// For compliant shopping sites that implement schema.org

import WebAutoExtractor from "@marbec/web-auto-extractor";
import Defuddle from "defuddle";
import * as v from "valibot";
import PlaceholderImage from "../../../assets/placeholder.webp";
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

const NumberOrNumericStringSchema = v.union([v.string(), v.number()]);

const ParsedSingleOfferSchema = v.looseObject({
	/** "5970.00" */
	price: NumberOrNumericStringSchema,
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
			ratingValue: NumberOrNumericStringSchema,
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
	price: v.optional(NumberOrNumericStringSchema),
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

const webAutoExtractor = new WebAutoExtractor({});

export const schemaOrgProductDataExtractor: ProductDataExtractor = (
	ctx,
	ctxUrl = ctx.location.href,
) => {
	const documentArg = ctx instanceof Document ? ctx : ctx.document;

	const clonedDocument = documentArg.cloneNode(true) as Document;

	const {
		schemaOrgData: defuddleSchemaOrgData,
		image,
		site,
		author,
		title,
	} = new Defuddle(clonedDocument, { url: ctxUrl }).parse();

	const webAutoExtractorData = webAutoExtractor.parse(
		clonedDocument.documentElement.outerHTML,
	);

	// Some sites without schema.org / microdata metadata may have the info in their metatags, like:
	/**
 * {
     "X-UA-Compatible": [
         "IE=edge,chrome=1",
         "ie=edge"
     ],
     "viewport": [
         "width=device-width,initial-scale=1"
     ],
     "theme-color": [
         ""
     ],
     "title": [
         "ORANGE MARMALEDE GEURTS 450G\n– GBN Farms"
     ],
     "description": [
         "Fruit, sugar, a gelling agent and an acidulant. Those are the four key ingredients of jam. We use these ingredients at the optimal ratio. We are able to prepare the jam within a short space of time by cooking it in a vacuum kettle without a stirring mechanism. That way, the jam retains its optimal flavor and structure."
     ],
     "og:site_name": [
         "GBN Farms"
     ],
     "og:url": [
         "https://www.gbnfarms.com/products/orange-marmalede-geurts-450g"
     ],
     "og:title": [
         "ORANGE MARMALEDE GEURTS 450G"
     ],
     "og:type": [
         "product"
     ],
     "og:description": [
         "Fruit, sugar, a gelling agent and an acidulant. Those are the four key ingredients of jam. We use these ingredients at the optimal ratio. We are able to prepare the jam within a short space of time by cooking it in a vacuum kettle without a stirring mechanism. That way, the jam retains its optimal flavor and structure."
     ],
     "og:price:amount": [
         "1,700.00"
     ],
     "og:price:currency": [
         "NGN"
     ],
     "og:image": [
         "http://www.gbnfarms.com/cdn/shop/products/nmW3cYS4hq_1200x1200.jpg?v=1621887766"
     ],
     "og:image:secure_url": [
         "https://www.gbnfarms.com/cdn/shop/products/nmW3cYS4hq_1200x1200.jpg?v=1621887766"
     ],
     "twitter:site": [
         "@shopify"
     ],
     "twitter:card": [
         "summary_large_image"
     ],
     "twitter:title": [
         "ORANGE MARMALEDE GEURTS 450G"
     ],
     "twitter:description": [
         "Fruit, sugar, a gelling agent and an acidulant. Those are the four key ingredients of jam. We use these ingredients at the optimal ratio. We are able to prepare the jam within a short space of time by cooking it in a vacuum kettle without a stirring mechanism. That way, the jam retains its optimal flavor and structure."
     ],
     "shopify-digital-wallet": [
         "/47227797670/digital_wallets/dialog"
     ]
 }
 */
	const { metatags } = webAutoExtractorData;

	const possibleProductDataFromMetatags: Partial<ProductDataSchema> = {
		imgSrc: PlaceholderImage,
		rating: PRODUCT_RATING_RANGE.MIN,
	};

	for (const tag in metatags) {
		const value = metatags[tag]?.[0];

		switch (tag) {
			case "og:title":
				possibleProductDataFromMetatags.name = value;
				break;
			case "og:url":
				possibleProductDataFromMetatags.url = value;
				break;
			case "og:site_name":
				possibleProductDataFromMetatags.store = value;
				break;
			case "og:price:currency":
				possibleProductDataFromMetatags.currency = value;
				break;
			case "og:price:amount":
				possibleProductDataFromMetatags.price =
					SCRAPED_PRODUCT_DATA_CLEANER.price(value ?? "");
				break;
			case "og:rating":
				possibleProductDataFromMetatags.rating =
					SCRAPED_PRODUCT_DATA_CLEANER.rating(value ?? "");
				break;
			case "og:image":
				possibleProductDataFromMetatags.imgSrc = value;
				break;
		}
	}

	if (v.is(ProductDataSchema, possibleProductDataFromMetatags)) {
		return possibleProductDataFromMetatags as ProductDataSchema;
	}

	// No schemaOrgData so there's not much use going further
	if (!defuddleSchemaOrgData && !webAutoExtractorData.microdata) return null;

	const possibleParsedProduct =
		findSchemaObjectWithProductData(defuddleSchemaOrgData) ??
		findSchemaObjectWithProductData(webAutoExtractorData.microdata);

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
			price: `${schemaPrice}`,
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
			price: `${schemaPrice}`,
			rating: `${aggregateRating?.ratingValue ?? PRODUCT_RATING_RANGE.MIN}`,
			store: site ?? author,
			url: schemaDocumentUrl ?? ctxUrl,
		});
	}

	return null;
};
