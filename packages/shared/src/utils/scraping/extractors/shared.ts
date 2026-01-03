import {
	fixCaughtErrorType,
	NOT_AVAILABLE,
	SCRAPED_PRODUCT_DATA_CLEANER,
} from "@bandwidth-saver/shared";
import * as v from "valibot";
import { ProductDataSchema } from "../../../../../shared/src/models/product";

/** Either scrapes or sniffs js globals or smth */
export type ProductDataExtractor = (
	// biome-ignore lint/suspicious/noExplicitAny: <To cover sites that add extra props to the window object>
	siteWindow: Window & Record<string, any>,
) => ProductDataSchema | null;

export function createDocumentScraperProductDataExtractor(
	productDataCallback: (document: Document) => {
		[key in keyof ProductDataSchema]: string | undefined;
	},
): ProductDataExtractor {
	const documentScraperExtractor: ProductDataExtractor = ({ document }) => {
		const { currency, imgSrc, name, price, rating, store } =
			productDataCallback(document);

		if (!currency || !name || !price || !rating || !imgSrc) {
			console.warn(
				"Undefined data in one of the variables:",
				currency,
				name,
				price,
				rating,
				imgSrc,
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
	const combinedExtractor: ProductDataExtractor = (window) => {
		try {
			return windowGlobalExtractor(window) ?? documentScraperExtractor(window);
		} catch (e) {
			console.warn(
				storeName,
				"window global or document scraper data extraction failed with error:",
				fixCaughtErrorType(e),
			);

			try {
				return documentScraperExtractor(window);
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
