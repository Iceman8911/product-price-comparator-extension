/** biome-ignore-all lint/style/useLiteralEnumMembers: <I like it:p> */

import { UrlSchema } from "@shopping-optimizer/shared";
import * as v from "valibot";
import { getActiveTab } from "@/utils/tabs";

export enum ExtensionData {
	NAME = "Shopping Optimizer",
	VERSION = "0.0.1",
	ID = `${NAME} - Iceman8911`,

	GLOBAL_NAMESPACE = `__${ID}`,
	GLOBAL_NAMESPACE_SETTINGS = `${GLOBAL_NAMESPACE}_settings`,
}

export const DUMMY_TAB_URL = v.parse(UrlSchema, "https://foo.bar");

export const getActiveTabUrl = async () => {
	try {
		return (await getActiveTab())?.url ?? DUMMY_TAB_URL;
	} catch {
		return v.parse(UrlSchema, location.href);
	}
};

export enum StorageKey {
	SETTINGS = "sync:settings",

	CACHED_PRODUCT_DATA_FOR_SITE_PREFIX = "session:cachedProduct-",
}

export enum MessageType {
	/** For use in non-background scripts, bar injected scripts */
	SEND_PROMPT_TO_PHIND_AI_VIA_BACKGROUND_WORKER = "1",
	/** Popup sends to content script, content script sends to injected script. Injected script returns results to content script which returns to popup */
	EXTRACT_PRODUCT_DATA_FROM_INJECTED_SITE = "2",

	FETCH_ALT_PRODUCT_DATA_FROM_SEARCH_QUERY_VIA_BACKGROUND_WORKER = "3",
}
