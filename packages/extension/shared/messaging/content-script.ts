import type { PhindAiQueryRestArgs } from "@bandwidth-saver/shared";
import { defineWindowMessaging } from "@webext-core/messaging/page";
import type { sendQueryToPhindAiViaBackgroundWorker } from "@/utils/phind/backgound-script";
import { ExtensionData, MessageType } from "../constants";

type MessagingProtocolMap = {
	[MessageType.SEND_PROMPT_TO_PHIND_AI_VIA_BACKGROUND_WORKER_USING_CONTENT_SCRIPT](
		data: PhindAiQueryRestArgs,
	): ReturnType<typeof sendQueryToPhindAiViaBackgroundWorker>;
};

export const { onMessage: onWindowMessage, sendMessage: sendWindowMessage } =
	defineWindowMessaging<MessagingProtocolMap>({
		namespace: ExtensionData.ID,
	});
