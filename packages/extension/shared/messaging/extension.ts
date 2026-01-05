import { defineExtensionMessaging } from "@webext-core/messaging";
import type { sendQueryToPhindAiViaBackgroundWorker } from "@/utils/phind/backgound-script";
import { MessageType } from "../constants";

type MessagingProtocolMap = {
	[MessageType.SEND_PROMPT_TO_PHIND_AI_VIA_BACKGROUND_WORKER](
		data: Parameters<typeof sendQueryToPhindAiViaBackgroundWorker>,
	): ReturnType<typeof sendQueryToPhindAiViaBackgroundWorker>;
};

export const {
	onMessage: onExtensionMessage,
	sendMessage: sendExtensionMessage,
} = defineExtensionMessaging<MessagingProtocolMap>();
