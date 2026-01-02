import { fixCaughtErrorType } from "@bandwidth-saver/shared";
import type { ProductDataSchema } from "../../../../../shared/src/models/product";

/** Either scrapes or sniffs js globals or smth */
export type ProductDataExtractor = (
	// biome-ignore lint/suspicious/noExplicitAny: <To cover sites that add extra props to the window object>
	siteWindow: Window & Record<string, any>,
) => ProductDataSchema | null;

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
