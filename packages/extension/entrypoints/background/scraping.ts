import {
	extractProductDataFromDocumentOrWindow,
	fixCaughtErrorType,
	sendQueryToPhindAi,
	type UrlSchema,
} from "@shopping-optimizer/shared";
import { extensionSettingsStorageItem } from "@/shared/storage";
import type { ProductDataSchema } from "../../../shared/src/models/product";

type ExtractedProductResults = (ProductDataSchema | null)[];

const domParser = new DOMParser();

async function extractProductDataFromUrlsViaSimpleDomParsing(
	enableAi: boolean,
	...urls: ReadonlyArray<UrlSchema>
): Promise<ExtractedProductResults> {
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

		return Promise.all(
			siteDocumentsAndUrls.map(({ doc, url }) =>
				extractProductDataFromDocumentOrWindow([
					doc,
					enableAi
						? (...queries) =>
								sendQueryToPhindAi(
									...queries.map((query) => ({ query, search: false })),
								)
						: undefined,
					url,
				]),
			),
		);
	} catch (e) {
		console.error(
			"Background script failed to extract product data from html with error:",
			fixCaughtErrorType(e),
		);

		return [];
	}
}

export async function extractProductDataFromUrls(
	...urls: ReadonlyArray<UrlSchema>
): Promise<ExtractedProductResults> {
	try {
		const { enableAi: shouldEnableAi } =
			await extensionSettingsStorageItem.getValue();

		return extractProductDataFromUrlsViaSimpleDomParsing(
			shouldEnableAi,
			...urls,
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
