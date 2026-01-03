import {
	fixCaughtErrorType,
	SCRAPED_PRODUCT_DATA_CLEANER,
} from "@bandwidth-saver/shared";
import * as v from "valibot";
import { ProductDataSchema } from "../../../../../shared/src/models/product";

/** Either scrapes or sniffs js globals or smth */
export type ProductDataExtractor = (
	// biome-ignore lint/suspicious/noExplicitAny: <To cover sites that add extra props to the window object>
	siteWindow: Window & Record<string, any>,
) => ProductDataSchema | null;

type GetStringFromDocumentScraping = (document: Document) => string | undefined;
type ProductDataDocumentScraperCallbacks = {
	[key in `get${Capitalize<
		keyof Omit<ProductDataSchema, "store">
	>}`]: GetStringFromDocumentScraping;
};

export function createDocumentScraperProductDataExtractor(
	arg: { storeName: string } & ProductDataDocumentScraperCallbacks,
): ProductDataExtractor {
	const { getCurrency, getImgSrc, getName, getPrice, getRating, storeName } =
		arg;

	const documentScraperExtractor: ProductDataExtractor = ({ document }) => {
		const scrapedName = getName(document);
		const scrapedCurrency = getCurrency(document);
		const scrapedPrice = getPrice(document);
		const scrapedRating = getRating(document);
		const scrapedImgSrc = getImgSrc(document);

		if (
			!scrapedCurrency ||
			!scrapedName ||
			!scrapedPrice ||
			!scrapedRating ||
			!scrapedImgSrc
		) {
			console.warn(
				"Undefined data in one of the variables:",
				scrapedCurrency,
				scrapedName,
				scrapedPrice,
				scrapedRating,
				scrapedImgSrc,
			);

			return null;
		}

		const productData = {
			currency: SCRAPED_PRODUCT_DATA_CLEANER.currency(scrapedCurrency),
			imgSrc: SCRAPED_PRODUCT_DATA_CLEANER.imgSrc(scrapedImgSrc),
			name: SCRAPED_PRODUCT_DATA_CLEANER.name(scrapedName),
			price: SCRAPED_PRODUCT_DATA_CLEANER.price(scrapedPrice),
			rating: SCRAPED_PRODUCT_DATA_CLEANER.rating(scrapedRating),
			store: storeName,
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
