/** biome-ignore-all lint/style/useLiteralEnumMembers: <I like it:p> */

import { UrlSchema } from "@bandwidth-saver/shared";
import * as v from "valibot";

export enum ExtensionData {
	NAME = "Product Price Comparator",
	VERSION = "0.0.1",
	ID = `${NAME} - Iceman8911`,
}

export const DUMMY_TAB_URL = v.parse(UrlSchema, "https://foo.bar");

export const getActiveTabUrl = async () => {
	try {
		return (await getActiveTabOrigin()) ?? DUMMY_TAB_URL;
	} catch {
		return v.parse(UrlSchema, location.href);
	}
};

// export const StorageKey = {
// 	/** Default settings for customizing compression */
// 	DEFAULT_SETTINGS_COMPRESSION: "local:compression",

// 	/** Other default generic settings beyond the other classifications */
// 	DEFAULT_SETTINGS_GENERAL: "local:general",

// 	/** Default settings for the remote proxy that requests will be redirected to */
// 	DEFAULT_SETTINGS_PROXY: "local:proxy",

// 	SCHEMA_VERSION: "local:schemaVersion",

// 	/** Site-specific settings for customizing compression */
// 	SITE_SPECIFIC_SETTINGS_COMPRESSION_PREFIX: "local:siteScopeCompression-",

// 	/** Site-specific settings toggles scoped to a site */
// 	SITE_SPECIFIC_SETTINGS_GENERAL_PREFIX: "local:siteScopeGeneral-",

// 	/** Site-specific settings for the remote proxy that requests will be redirected to */
// 	SITE_SPECIFIC_SETTINGS_PROXY_PREFIX: "local:siteScopeProxy-",

// 	/** Device-specific statistics per site */
// 	SITE_SPECIFIC_STATISTICS_PREFIX: "local:siteScopeStatistics-",

// 	/** Device-specific global statistics */
// 	STATISTICS: "local:statistics",
// } as const satisfies Record<string, StorageItemKey>;
// export type StorageKey = ObjectToEnum<typeof StorageKey>;

// export type SiteSpecificStorageKey =
// 	| typeof StorageKey.SITE_SPECIFIC_SETTINGS_COMPRESSION_PREFIX
// 	| typeof StorageKey.SITE_SPECIFIC_SETTINGS_GENERAL_PREFIX
// 	| typeof StorageKey.SITE_SPECIFIC_SETTINGS_PROXY_PREFIX
// 	| typeof StorageKey.SITE_SPECIFIC_STATISTICS_PREFIX;

// export const UPDATE_INTERVAL_IN_MS = 1000 * 60 * 60;

export enum MessageType {
	/** For use in non-background scripts, bar injected scripts */
	SEND_PROMPT_TO_PHIND_AI_VIA_BACKGROUND_WORKER = "1",

	/** For use in injected scripts */
	SEND_PROMPT_TO_PHIND_AI_VIA_BACKGROUND_WORKER_USING_CONTENT_SCRIPT = "2",
}
