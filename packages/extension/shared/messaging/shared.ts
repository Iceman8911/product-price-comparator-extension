import { MessageType } from "../constants";

export type MessagingProtocolMap = {
	[MessageType.SEND_PROMPT_TO_PHIND_AI_VIA_BACKGROUND_WORKER](
		data: Parameters<typeof sendQueryToPhindAiViaBackgroundWorker>,
	): ReturnType<typeof sendQueryToPhindAiViaBackgroundWorker>;
};
