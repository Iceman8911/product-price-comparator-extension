import { defineWindowMessaging } from "@webext-core/messaging/page";
import { EXTENSION_ID } from "../constants";
import type { MessagingProtocolMap } from "./shared";

export const { onMessage: onWindowMessage, sendMessage: sendWindowMessage } =
	defineWindowMessaging<MessagingProtocolMap>({
		namespace: EXTENSION_ID,
	});
