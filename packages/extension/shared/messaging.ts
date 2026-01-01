import type { sendQueryToPhindAi } from "@bandwidth-saver/shared";
import { defineExtensionMessaging } from "@webext-core/messaging";
import { MessageType } from "./constants";

interface ProtocolMap {
	[MessageType.SEND_SHOPPING_SITE_DOM_CONTENT_TO_BACKGROUND](
		data: Parameters<typeof sendQueryToPhindAi>,
	): void;
}

export const { onMessage, sendMessage } =
	defineExtensionMessaging<ProtocolMap>();
