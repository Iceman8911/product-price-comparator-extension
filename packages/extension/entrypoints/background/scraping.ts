import {
	clone,
	extractProductDataFromDocumentOrWindow,
	fixCaughtErrorType,
	sendQueryToPhindAi,
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

const domParser = new DOMParser();

async function extractProductDataFromUrlsViaSimpleDomParsing(
	enableAi: boolean,
	...urls: ReadonlyArray<UrlSchema>
): Promise<PartiallyProcessedProductResults> {
	try {
		const siteDocumentsAndUrls = await Promise.allSettled(
			urls.map((url) =>
				fetch(url)
					.then((res) => res.text())
					.then((html) => ({
						doc: domParser.parseFromString(html, "text/html"),
						url,
					})),
			),
		).then((settledResults) =>
			settledResults.reduce<{ doc: Document; url: UrlSchema }[]>(
				(successfulResults, settledResult) => {
					if (settledResult.status === "fulfilled")
						successfulResults.push(settledResult.value);

					return successfulResults;
				},
				[],
			),
		);

		const partiallyProcessedProductResults: PartiallyProcessedProductResults =
			clone(DEFAULT_PARTIALLY_PROCESSED_RESULTS);

		const productDataExtractionPromises: Promise<void>[] = [];

		for (const { doc, url } of siteDocumentsAndUrls) {
			const promise = extractProductDataFromDocumentOrWindow([
				doc,
				enableAi
					? (...queries) =>
							sendQueryToPhindAi(
								...queries.map((query) => ({ query, search: false })),
							)
					: undefined,
				url,
			]).then((possibleProduct) => {
				if (possibleProduct)
					partiallyProcessedProductResults.products.push(possibleProduct);
				else partiallyProcessedProductResults.pendingUrls.push(url);
			});

			productDataExtractionPromises.push(promise);
		}

		await Promise.all(productDataExtractionPromises);

		return partiallyProcessedProductResults;
	} catch (e) {
		console.error(
			"Background script failed to extract product data from html with error:",
			fixCaughtErrorType(e),
		);

		return clone(DEFAULT_PARTIALLY_PROCESSED_RESULTS);
	}
}

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

		const extractedProductsViaHtmlParsing =
			await extractProductDataFromUrlsViaSimpleDomParsing(
				shouldEnableAi,
				...partiallyProcessedProductResults.pendingUrls,
			);

		return partiallyProcessedProductResults.products.concat(
			extractedProductsViaHtmlParsing.products,
		);
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
