import { sendQueryToPhindAi } from "@bandwidth-saver/shared";
import { MessageType } from "@/shared/constants";
import { onExtensionMessage } from "@/shared/messaging/extension";

function sendPromptToPhindAiHandler() {
	onExtensionMessage(
		MessageType.SEND_PROMPT_TO_PHIND_AI_VIA_BACKGROUND_WORKER,
		async ({ data: queryArgs }) => sendQueryToPhindAi(...queryArgs),
	);
}

export default defineBackground(async () => {
	sendPromptToPhindAiHandler();
});
