/** biome-ignore-all lint/style/useLiteralEnumMembers: <I like it:p> */

import { type ObjectToEnum, UrlSchema } from "@bandwidth-saver/shared";
import * as v from "valibot";
import type { ProductDataSchema } from "@/models/product";

export enum ExtensionData {
	NAME = "Bandwidth Saver and Monitor",
	VERSION = 1,
}

export const DUMMY_TAB_URL = v.parse(UrlSchema, "https://foo.bar");

export const getActiveTabUrl = async () => {
	try {
		return (await getActiveTabOrigin()) ?? DUMMY_TAB_URL;
	} catch {
		return v.parse(UrlSchema, location.href);
	}
};

export const MessageType = {
	/** Sends the bandwidth used from content scripts to the background */
	MONITOR_BANDWIDTH_WITH_PERFORMANCE_API: "1",
	/** Check if the url returns a valid response code */
	VALIDATE_URL: "0",

	// MONITOR_BANDWIDTH_WITH_WEB_REQUEST = "2",
} as const;
export type MessageType = ObjectToEnum<typeof MessageType>;

export const StorageKey = {
	/** Default settings for customizing compression */
	DEFAULT_SETTINGS_COMPRESSION: "local:compression",

	/** Other default generic settings beyond the other classifications */
	DEFAULT_SETTINGS_GENERAL: "local:general",

	/** Default settings for the remote proxy that requests will be redirected to */
	DEFAULT_SETTINGS_PROXY: "local:proxy",

	SCHEMA_VERSION: "local:schemaVersion",

	/** Site-specific settings for customizing compression */
	SITE_SPECIFIC_SETTINGS_COMPRESSION_PREFIX: "local:siteScopeCompression-",

	/** Site-specific settings toggles scoped to a site */
	SITE_SPECIFIC_SETTINGS_GENERAL_PREFIX: "local:siteScopeGeneral-",

	/** Site-specific settings for the remote proxy that requests will be redirected to */
	SITE_SPECIFIC_SETTINGS_PROXY_PREFIX: "local:siteScopeProxy-",

	/** Device-specific statistics per site */
	SITE_SPECIFIC_STATISTICS_PREFIX: "local:siteScopeStatistics-",

	/** Device-specific global statistics */
	STATISTICS: "local:statistics",
} as const satisfies Record<string, StorageItemKey>;
export type StorageKey = ObjectToEnum<typeof StorageKey>;

export type SiteSpecificStorageKey =
	| typeof StorageKey.SITE_SPECIFIC_SETTINGS_COMPRESSION_PREFIX
	| typeof StorageKey.SITE_SPECIFIC_SETTINGS_GENERAL_PREFIX
	| typeof StorageKey.SITE_SPECIFIC_SETTINGS_PROXY_PREFIX
	| typeof StorageKey.SITE_SPECIFIC_STATISTICS_PREFIX;

export const UPDATE_INTERVAL_IN_MS = 1000 * 60 * 60;

/** The collection of sites I personally optimised for, those not included will fall back to a generic catch-all approach */
export enum SupportedSiteDomains {
	KONGA = "www.konga.com",
	JUMIA = "www.jumia.com",
	TEMU = "www.temu.com",
	JIJI = "www.jumia.com.ng",
}
/** Calling `textContent` on the result of these queries should result in the string version of the value we're looking for */
export const PRODUCT_SITE_SCRAPING_QUERY_SELECTOR = {
	[SupportedSiteDomains.KONGA]: {
		currency: "[class*=priceBoxPrice] span",
		name: "[class*=productName]",
		/** "1,323,453" */
		price: "[class*=priceBoxPrice] div",
		/** "4.4/5" */
		rating: "[class*=customerReview_] p",
	},
} as const satisfies {
	[key in SupportedSiteDomains]?: { [key in keyof ProductDataSchema]: string };
};

export enum PRODUCT_RATING_RANGE {
	MIN = 1,
	MAX = 5,
}
