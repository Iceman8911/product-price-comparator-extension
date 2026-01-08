import { MessageType } from "@/shared/constants";
import {
	onWindowMessage,
	sendWindowMessage,
} from "@/shared/messaging/content-script";
import {
	onExtensionMessage,
	sendExtensionMessage,
} from "@/shared/messaging/extension";
import { sendQueryToPhindAiViaBackgroundWorker } from "@/utils/phind/backgound-script";

function registerPhindAiMessageResponderFromInjectedScript() {
	onWindowMessage(
		MessageType.SEND_PROMPT_TO_PHIND_AI_VIA_BACKGROUND_WORKER,
		async ({ data: queryArgs }) =>
			sendQueryToPhindAiViaBackgroundWorker(...queryArgs),
	);
}

function triggerProductDetectionFromPopupHandler() {
	onExtensionMessage(
		MessageType.EXTRACT_PRODUCT_DATA_FROM_INJECTED_SITE,
		({ data: shouldEnableAi }) =>
			sendWindowMessage(
				MessageType.EXTRACT_PRODUCT_DATA_FROM_INJECTED_SITE,
				shouldEnableAi,
			),
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

function broadcastReadyState() {
	sendExtensionMessage(MessageType.CONTENT_SCRIPT_READY, true);
}

export default defineContentScript({
	async main() {
		injectProductDataExtractorScript();
		triggerProductDetectionFromPopupHandler();
		broadcastReadyState();
	},
	matches: ["<all_urls>"],
	runAt: "document_start",
});
