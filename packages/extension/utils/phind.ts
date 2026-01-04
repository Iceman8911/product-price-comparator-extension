import type { sendQueryToPhindAi } from "@bandwidth-saver/shared";
import { MessageType } from "@/shared/constants";
import { sendExtensionMessage } from "@/shared/messaging";

/** Since content scripts and the like are limited by CSP */
export async function sendQueryToPhindAiViaBackgroundWorker(
	...args: Parameters<typeof sendQueryToPhindAi>
): ReturnType<typeof sendQueryToPhindAi> {
	return sendExtensionMessage(
		MessageType.SEND_PROMPT_TO_PHIND_AI_VIA_BACKGROUND_WORKER,
		args,
	);
}
