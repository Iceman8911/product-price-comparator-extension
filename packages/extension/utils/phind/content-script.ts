import type {
	PhindAiQueryRestArgs,
	sendQueryToPhindAi,
} from "@shopping-optimizer/shared";
import { MessageType } from "@/shared/constants";
import { sendWindowMessage } from "@/shared/messaging/content-script";

/** Since injected scripts can't directly use extension apis */
export async function sendQueryToPhindAiFromInjectedScriptViaContentScript(
	...args: PhindAiQueryRestArgs
): ReturnType<typeof sendQueryToPhindAi> {
	return sendWindowMessage(
		MessageType.SEND_PROMPT_TO_PHIND_AI_VIA_BACKGROUND_WORKER,
		args,
	);
}
