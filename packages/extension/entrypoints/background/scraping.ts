import {
	clone,
	fixCaughtErrorType,
	ProductDataSchema,
	type UrlSchema,
} from "@shopping-optimizer/shared";
import * as v from "valibot";
import type { PartialExtensionSettingsSchema } from "@/models/storage";
import { ExtensionData } from "@/shared/constants";
import { requestForPermissionsIfDisabled } from "@/shared/permissions";
import {
	extensionSettingsStorageItem,
	getCachedProductDataForSite,
} from "@/shared/storage";

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

const EXTRACTION_TIMEOUT = 30000;

async function* createTabsFromUrlsInBatches(
	tabProps: ReadonlyArray<Browser.tabs.CreateProperties>,
): AsyncGenerator<ReadonlyArray<Readonly<Browser.tabs.Tab>>> {
	const clonedTabProps = [...tabProps];
	/** 1~3 tabs */
	const getBatchSize = () => Math.max(Math.round(Math.random() * 3), 1);

	let batch: Browser.tabs.CreateProperties[] = [];

	while (clonedTabProps.length) {
		const batchSize = getBatchSize();

		batch = clonedTabProps.splice(0, batchSize);

		const createdTabs = await Promise.all(
			batch.map((data) =>
				browser.tabs.create(data).then(async (tab) => {
					await browser.tabs.update(tab.id, { autoDiscardable: false });

					return tab;
				}),
			),
		);

		yield createdTabs;
	}

	return [];
}

export async function extractProductDataFromTab(
	tab: Browser.tabs.Tab,
	shouldEnableAi: boolean,
): Promise<PartiallyProcessedProductResults> {
	const partiallyProcessedProductResults: PartiallyProcessedProductResults =
		clone(DEFAULT_PARTIALLY_PROCESSED_RESULTS);

	if (!tab.id) {
		console.error(
			"Tab:",
			JSON.stringify(tab),
			"is missing it's id.\n\nProduct Extraction failed.",
		);
		return partiallyProcessedProductResults;
	}

	const executeScript = browser.scripting.executeScript;
	await executeScript({
		args: [shouldEnableAi, ExtensionData.GLOBAL_NAMESPACE_SETTINGS],
		func: (
			enableAi: boolean,
			globalNamespace: ExtensionData.GLOBAL_NAMESPACE_SETTINGS,
		) => {
			const settings: PartialExtensionSettingsSchema = { enableAi };

			//@ts-expect-error Mutating the global namespace of the target tab's window since scripts executed by this function cannot have arguments given to them
			globalThis[globalNamespace] = settings;
		},
		target: { tabId: tab.id },
		world: "MAIN",
	});

	const results = await executeScript({
		files: ["/extract-product-data-via-scripting.js"],
		target: { tabId: tab.id },
		world: "MAIN",
	});

	console.log("Here!", results);

	const scrapingResult = results[0]?.result;

	const parsed = v.safeParse(ProductDataSchema, scrapingResult);

	if (parsed.success) {
		partiallyProcessedProductResults.products.push(parsed.output);
	} else if (tab.url) {
		partiallyProcessedProductResults.pendingUrls.push(tab.url);
	}

	return partiallyProcessedProductResults;
}

async function extractProductDataFromTabsAndCloseThem(
	tabs: ReadonlyArray<Readonly<Browser.tabs.Tab>>,
	shouldEnableAi: boolean,
): Promise<PartiallyProcessedProductResults> {
	const partiallyProcessedProductResults: PartiallyProcessedProductResults =
		clone(DEFAULT_PARTIALLY_PROCESSED_RESULTS);

	for (const tab of tabs) {
		const tabId = tab.id;

		if (tabId == null) continue;

		const getTab = browser.tabs.get;

		try {
			const onUpdated = browser.tabs.onUpdated;

			await new Promise<void>((resolve, reject) => {
				const timeoutId = setTimeout(async () => {
					onUpdated.removeListener(listener);
					reject(
						`Product data extraction for tab: ${JSON.stringify(await getTab(tab.id ?? 0))}\n\nTimed out after ${EXTRACTION_TIMEOUT} ms`,
					);
				}, EXTRACTION_TIMEOUT);

				const listener: Parameters<typeof onUpdated.addListener>[0] = async (
					eventTabId,
					{ status },
					eventTab,
				) => {
					try {
						if (eventTabId !== tabId || status !== "complete") return;

						clearTimeout(timeoutId);

						onUpdated.removeListener(listener);

						console.log("Tab:", JSON.stringify(eventTab), "is ready!");

						const { pendingUrls, products } = await extractProductDataFromTab(
							eventTab,
							shouldEnableAi,
						);

						partiallyProcessedProductResults.pendingUrls.push(...pendingUrls);
						partiallyProcessedProductResults.products.push(...products);

						resolve();
					} catch (e) {
						reject(
							`Product Data extraction failed on tab: ${JSON.stringify(eventTab)} with error: ${fixCaughtErrorType(e)}`,
						);
					}
				};

				onUpdated.addListener(listener);

				browser.tabs.get(tabId).then((tab) => {
					const status: typeof tab.status = "complete";

					if (tab.status === status) {
						listener(tabId, { status }, tab);
					}
				});
			});
		} catch (e) {
			if (tab.url) partiallyProcessedProductResults.pendingUrls.push(tab.url);

			console.error(
				"Product data extraction failed for tab:",
				{ id: tabId, url: tab.url },
				fixCaughtErrorType(e),
			);
		} finally {
			browser.tabs.remove(tabId);
		}
	}

	console.log(
		"After extracting product data from tabs and closing them, the data is:",
		partiallyProcessedProductResults,
	);

	return partiallyProcessedProductResults;
}

async function extractProductDataFromUrlsByLoadingTabsInHiddenWindow(
	shouldEnableAi: boolean,
	...urls: ReadonlyArray<UrlSchema>
): Promise<PartiallyProcessedProductResults> {
	const clonedUrls = [...urls];

	const unsuccessfulResult = { pendingUrls: clonedUrls, products: [] };

	if (
		!(await requestForPermissionsIfDisabled({
			origins: ["<all_urls>"],
			permissions: ["tabs", "scripting"],
		}))
	)
		return unsuccessfulResult;

	const hiddenWindow = await browser.windows.create({
		focused: false,
		state: "minimized",
	});

	const hiddenWindowId = hiddenWindow?.id;

	if (hiddenWindowId == null) return unsuccessfulResult;

	const extractedProductDataFromTabs: PartiallyProcessedProductResults[] = [];

	for await (const tabBatch of createTabsFromUrlsInBatches(
		clonedUrls.map((url) => ({ active: false, url, windowId: hiddenWindowId })),
	)) {
		extractedProductDataFromTabs.push(
			await extractProductDataFromTabsAndCloseThem(tabBatch, shouldEnableAi),
		);
	}

	const partiallyProcessedProductResults =
		extractedProductDataFromTabs.reduce<PartiallyProcessedProductResults>(
			(totalResults, { pendingUrls, products }) => {
				totalResults.pendingUrls.push(...pendingUrls);
				totalResults.products.push(...products);

				return totalResults;
			},
			clone(DEFAULT_PARTIALLY_PROCESSED_RESULTS),
		);

	await browser.windows.remove(hiddenWindowId);

	console.log(
		"After extracting product data from all tabs and closing the window, the data is:",
		partiallyProcessedProductResults,
	);

	return partiallyProcessedProductResults;
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

		const partiallyProcessedProductsFromLoadedTabs =
			await extractProductDataFromUrlsByLoadingTabsInHiddenWindow(
				shouldEnableAi,
				...partiallyProcessedProductResults.pendingUrls,
			);

		return partiallyProcessedProductResults.products.concat(
			partiallyProcessedProductsFromLoadedTabs.products,
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
