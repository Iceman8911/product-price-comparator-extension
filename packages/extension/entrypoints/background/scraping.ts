import {
	clone,
	fixCaughtErrorType,
	type UrlSchema,
} from "@shopping-optimizer/shared";
import {
	extensionSettingsStorageItem,
	getCachedProductDataForSite,
} from "@/shared/storage";
import type { ProductDataSchema } from "../../../shared/src/models/product";

type PartiallyProcessedProductResults = {
	/** Successfully extracted products */
	products: ProductDataSchema[];
	/** Urls for sites where the products could not properly be extracted */
	pendingUrls: UrlSchema[];
};

const DEFAULT_PARTIALLY_PROCESSED_RESULTS = {
	pendingUrls: [],
	products: [],
} as const satisfies PartiallyProcessedProductResults;

export async function extractProductDataFromUrls(
	...urls: ReadonlyArray<UrlSchema>
): Promise<ProductDataSchema[]> {
	try {
		const { enableAi: shouldEnableAi } =
			await extensionSettingsStorageItem.getValue();

		const cachedProducts = await Promise.all(
			urls.map(async (url) => {
				const cachedValue = await getCachedProductDataForSite(url).getValue();

				return { url, val: cachedValue };
			}),
		);

		const partiallyProcessedProductResults: PartiallyProcessedProductResults =
			clone(DEFAULT_PARTIALLY_PROCESSED_RESULTS);

		for (const { url, val: possibleProduct } of cachedProducts) {
			if (possibleProduct) {
				partiallyProcessedProductResults.products.push(possibleProduct);
			} else {
				partiallyProcessedProductResults.pendingUrls.push(url);
			}
		}

		return partiallyProcessedProductResults.products;
	} catch (e) {
		console.error(
			"Background script failed to extract product data from url:",
			urls,
			"with error:",
			fixCaughtErrorType(e),
		);

		return [];
	}
}
