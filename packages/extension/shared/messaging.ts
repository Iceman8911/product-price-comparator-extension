import { defineExtensionMessaging } from "@webext-core/messaging";
import { defineWindowMessaging } from "@webext-core/messaging/page";
import type { sendQueryToPhindAiViaBackgroundWorker } from "@/utils/phind";
import { EXTENSION_ID, MessageType } from "./constants";

interface ProtocolMap {
	[MessageType.SEND_PROMPT_TO_PHIND_AI_VIA_BACKGROUND_WORKER](
		data: Parameters<typeof sendQueryToPhindAiViaBackgroundWorker>,
	): ReturnType<typeof sendQueryToPhindAiViaBackgroundWorker>;
}

export const { onMessage, sendMessage } =
	defineExtensionMessaging<ProtocolMap>();

export const { onMessage: onWindowMessage, sendMessage: sendWindowMessage } =
	defineWindowMessaging<ProtocolMap>({
		namespace: EXTENSION_ID,
	});
