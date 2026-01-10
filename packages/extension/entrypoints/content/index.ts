import { isLikelyShoppingUrl } from "@shopping-optimizer/shared";
import { MessageType } from "@/shared/constants";
import { onWindowMessage } from "@/shared/messaging/content-script";
import { sendQueryToPhindAiViaBackgroundWorker } from "@/utils/phind/backgound-script";

function registerPhindAiMessageResponderFromInjectedScript() {
	onWindowMessage(
		MessageType.SEND_PROMPT_TO_PHIND_AI_VIA_BACKGROUND_WORKER,
		async ({ data: queryArgs }) =>
			sendQueryToPhindAiViaBackgroundWorker(...queryArgs),
	);
}

export default defineContentScript({
	main() {
		// Since I can't specify the sites to match to, and attaching handlers to all pages is wasteful
		if (!isLikelyShoppingUrl(window.location.href)) return;

		registerPhindAiMessageResponderFromInjectedScript();
	},
	matches: ["<all_urls>"],
	runAt: "document_start",
});
