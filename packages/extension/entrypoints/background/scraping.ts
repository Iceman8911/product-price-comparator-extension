import {
	clone,
	fixCaughtErrorType,
	type UrlSchema,
} from "@shopping-optimizer/shared";
import pLimit from "p-limit";
import { MessageType } from "@/shared/constants";
import {
	onExtensionMessage,
	sendExtensionMessage,
} from "@/shared/messaging/extension";
import { requestForPermissionsIfDisabled } from "@/shared/permissions";
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

const TAB_PRODUCT_EXTRACTION_WAIT_PERIOD_IN_MS = 10000;

const BATCH_LIMITER = pLimit(4);

async function createTabAndExtractProductData(arg: {
	url: UrlSchema;
	windowId: number;
	enableAi: boolean;
}): Promise<ProductDataSchema | null> {
	const { enableAi: shouldEnableAi, url, windowId } = arg;

	const { id: tabId } = await browser.tabs.create({
		active: false,
		url,
		windowId,
	});

	return new Promise<ProductDataSchema | null>((res, rej) => {
		const removeListener = onExtensionMessage(
			MessageType.CONTENT_SCRIPT_READY,
			({ sender }) => {
				const senderTabInfo: Browser.tabs.Tab | undefined = sender.tab;

				if (!senderTabInfo || senderTabInfo.id !== tabId) {
					console.warn(
						"Not the tab the background script explicitly spawned.",
						"Expected tab id:",
						tabId,
						"Got id:",
						senderTabInfo?.id,
						"Ignoring...",
					);

					return;
				}

				removeListener();
				res(
					sendExtensionMessage(
						MessageType.EXTRACT_PRODUCT_DATA_FROM_INJECTED_SITE,
						shouldEnableAi,
						tabId,
					),
				);
			},
		);

		// So the promise will end at some point
		setTimeout(() => {
			removeListener();
			rej("Product data extraction timed out");
		}, TAB_PRODUCT_EXTRACTION_WAIT_PERIOD_IN_MS);
	});
}

async function extractProductDataFromUrlsByLoadingTabsInHiddenWindow(
	shouldEnableAi: boolean,
	...urls: ReadonlyArray<UrlSchema>
): Promise<PartiallyProcessedProductResults> {
	const clonedUrls = [...urls];

	const unsuccessfulResult = { pendingUrls: clonedUrls, products: [] };

	if (
		!requestForPermissionsIfDisabled({
			origins: ["<all_urls>"],
			permissions: ["tabs"],
		})
	)
		return unsuccessfulResult;

	const hiddenWindow = await browser.windows.create({
		focused: false,
		state: "minimized",
		url: clonedUrls,
	});

	const hiddenWindowId = hiddenWindow?.id;

	if (hiddenWindowId == null) return unsuccessfulResult;

	const partiallyProcessedProductResults: PartiallyProcessedProductResults =
		clone(DEFAULT_PARTIALLY_PROCESSED_RESULTS);

	const urlProcessingMapper = async (url: UrlSchema) => {
		const possibleProductData = await createTabAndExtractProductData({
			enableAi: shouldEnableAi,
			url,
			windowId: hiddenWindowId,
		});

		if (possibleProductData) {
			partiallyProcessedProductResults.products.push(possibleProductData);
		} else {
			partiallyProcessedProductResults.pendingUrls.push(url);
		}

		return;
	};

	const processingPromises: Promise<void>[] = urls.map((url) =>
		BATCH_LIMITER(() => urlProcessingMapper(url)),
	);

	await Promise.all(processingPromises);

	await browser.windows.remove(hiddenWindowId);

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
