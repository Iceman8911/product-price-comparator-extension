import {
	fixCaughtErrorType,
	NOT_AVAILABLE,
	SCRAPED_PRODUCT_DATA_CLEANER,
} from "@shopping-optimizer/shared";
import * as v from "valibot";
import { ProductDataSchema } from "../../../../../shared/src/models/product";

/** Either scrapes or sniffs js globals or smth */
export type ProductDataExtractor = (
	// biome-ignore lint/suspicious/noExplicitAny: <To cover sites that add extra props to the window object>
	siteContext: (Window & Record<string, any>) | Document,
) => ProductDataSchema | null;

export function createDocumentScraperProductDataExtractor(
	productDataCallback: (documentArg: Document) => {
		[key in keyof ProductDataSchema]: string | undefined;
	},
): ProductDataExtractor {
	const documentScraperExtractor: ProductDataExtractor = (ctx) => {
		const documentArg = ctx instanceof Document ? ctx : ctx.document;

		const { currency, imgSrc, name, price, rating, store, url } =
			productDataCallback(documentArg);

		if (!currency || !name || !price || !rating || !imgSrc || !url) {
			console.warn(
				"Undefined data in one of the variables:",
				currency,
				name,
				price,
				rating,
				imgSrc,
				url,
			);

			return null;
		}

		const productData = {
			currency: SCRAPED_PRODUCT_DATA_CLEANER.currency(currency),
			imgSrc: SCRAPED_PRODUCT_DATA_CLEANER.imgSrc(imgSrc),
			name: SCRAPED_PRODUCT_DATA_CLEANER.name(name),
			price: SCRAPED_PRODUCT_DATA_CLEANER.price(price),
			rating: SCRAPED_PRODUCT_DATA_CLEANER.rating(rating),
			store: store ?? NOT_AVAILABLE,
			url: SCRAPED_PRODUCT_DATA_CLEANER.url(url),
		} as const satisfies ProductDataSchema;

		return v.parse(ProductDataSchema, productData);
	};

	return documentScraperExtractor;
}

export function createCombinedProductDataExtractor(
	storeName: string,
	windowGlobalExtractor: ProductDataExtractor,
	documentScraperExtractor: ProductDataExtractor,
): ProductDataExtractor {
	const combinedExtractor: ProductDataExtractor = (ctx) => {
		try {
			return windowGlobalExtractor(ctx) ?? documentScraperExtractor(ctx);
		} catch (e) {
			console.warn(
				storeName,
				"window global or document scraper data extraction failed with error:",
				fixCaughtErrorType(e),
			);

			try {
				return documentScraperExtractor(ctx);
			} catch (e) {
				console.warn(
					storeName,
					" document scraper data extraction failed with error:",
					fixCaughtErrorType(e),
					".Falling back to `null",
				);

				return null;
			}
		}
	};

	return combinedExtractor;
}

/** From Grok and cleaned up cus I'm lazy */
export function extractCurrencyFromJsonString(json: string): string | null {
	// Match: non-digit/non-space/non-separator char(s) followed by number >=1000
	// Captures the prefix (currency symbol) in group 1
	// Handles: ₦60000, $1,000.00, €1.234,56, etc.
	const regex = /([^\d\s.,])(?:\s*)(?:\d{1,3}(?:[.,]\d{3})*(?:\.\d+)?)/g;

	let match: RegExpExecArray | null = regex.exec(json);
	while (match !== null) {
		const prefix = match[1];

		if (!prefix) {
			match = regex.exec(json);
			continue;
		}

		// Extract the raw number part after the prefix
		const numberPart = match[0]
			.slice(prefix.length)
			.replace(/\s/g, "")
			.replace(/,/g, "");
		const num = parseFloat(numberPart);

		if (!Number.isNaN(num) && num >= 1000) {
			return prefix;
		}

		match = regex.exec(json);
	}

	return null;
}
