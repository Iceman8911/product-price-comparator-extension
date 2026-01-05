import { MessageType } from "@/shared/constants";
import {
	onWindowMessage,
	sendWindowMessage,
} from "@/shared/messaging/content-script";
import { onExtensionMessage } from "@/shared/messaging/extension";
import { sendQueryToPhindAiViaBackgroundWorker } from "@/utils/phind/backgound-script";

function registerPhindAiMessageResponderFromInjectedScript() {
	onWindowMessage(
		MessageType.SEND_PROMPT_TO_PHIND_AI_VIA_BACKGROUND_WORKER_USING_CONTENT_SCRIPT,
		async ({ data: queryArgs }) =>
			sendQueryToPhindAiViaBackgroundWorker(...queryArgs),
	);
}

function triggerProductDetectionFromPopupHandler() {
	onExtensionMessage(MessageType.EXTRACT_PRODUCT_DATA_FROM_INJECTED_SITE, () =>
		sendWindowMessage(MessageType.EXTRACT_PRODUCT_DATA_FROM_INJECTED_SITE),
	);
}

function injectProductDataExtractorScript() {
	window.addEventListener(
		"load",
		async () => {
			registerPhindAiMessageResponderFromInjectedScript();
			await injectScript("/extract-product-data-from-window.js", {
				keepInDom: true,
			});
		},
		{ once: true },
	);
}

export default defineContentScript({
	async main() {
		injectProductDataExtractorScript();
		triggerProductDetectionFromPopupHandler();
	},
	matches: ["<all_urls>"],
	runAt: "document_start",
});
