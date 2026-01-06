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

async function extractProductDataFromHtmlStrings(
	enableAi: boolean,
	...siteHtmlStrings: ReadonlyArray<string>
): Promise<ExtractedProductResults> {
	try {
		const siteDocuments = siteHtmlStrings.map((htmlString) =>
			domParser.parseFromString(htmlString, "text/html"),
		);

		return Promise.all(
			siteDocuments.map((siteDocument) =>
				extractProductDataFromDocumentOrWindow([
					siteDocument,
					enableAi
						? (...queries) =>
								sendQueryToPhindAi(
									...queries.map((query) => ({ query, search: false })),
								)
						: undefined,
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
		const shouldEnableAiPromise = extensionSettingsStorageItem
			.getValue()
			.then((settings) => settings.enableAi);

		const siteHtmlsPromise = Promise.allSettled(
			urls.map((url) => fetch(url).then((res) => res.text())),
		).then((settledResults) =>
			settledResults.reduce<string[]>((successfulResults, settledResult) => {
				if (settledResult.status === "fulfilled")
					successfulResults.push(settledResult.value);

				return successfulResults;
			}, []),
		);

		const [shouldEnableAi, siteHtmls] = await Promise.all([
			shouldEnableAiPromise,
			siteHtmlsPromise,
		]);

		return extractProductDataFromHtmlStrings(shouldEnableAi, ...siteHtmls);
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
