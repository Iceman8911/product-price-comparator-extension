import { defineExtensionMessaging } from "@webext-core/messaging";
import type { sendQueryToPhindAiViaBackgroundWorker } from "@/utils/phind";
import { MessageType } from "./constants";

interface ProtocolMap {
	[MessageType.SEND_PROMPT_TO_PHIND_AI_VIA_BACKGROUND_WORKER](
		data: Parameters<typeof sendQueryToPhindAiViaBackgroundWorker>,
	): ReturnType<typeof sendQueryToPhindAiViaBackgroundWorker>;
}

export const { onMessage, sendMessage } =
	defineExtensionMessaging<ProtocolMap>();
