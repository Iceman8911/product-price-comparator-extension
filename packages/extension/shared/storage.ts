import type { UrlSchema } from "@shopping-optimizer/shared";
import type { ProductDataSchema } from "../../shared/src/models/product";
import { StorageKey } from "./constants";

export const getCachedProductDataForSite = (siteUrl: UrlSchema) => {
	const key =
		`${StorageKey.CACHED_PRODUCT_DATA_FOR_SITE_PREFIX}${siteUrl}` as const;

	return storage.defineItem<ProductDataSchema>(key);
};

// export const defaultGeneralSettingsStorageItem = storage.defineItem(
// 	DEFAULT_SETTINGS_GENERAL,
// 	{
// 		fallback: clone(STORAGE_DEFAULTS[DEFAULT_SETTINGS_GENERAL]),
// 		init: () => clone(STORAGE_DEFAULTS[DEFAULT_SETTINGS_GENERAL]),
// 	},
// );

// export const defaultCompressionSettingsStorageItem = storage.defineItem(
// 	DEFAULT_SETTINGS_COMPRESSION,
// 	{
// 		fallback: clone(STORAGE_DEFAULTS[DEFAULT_SETTINGS_COMPRESSION]),
// 		init: () => clone(STORAGE_DEFAULTS[DEFAULT_SETTINGS_COMPRESSION]),
// 	},
// );

// export const defaultProxySettingsStorageItem = storage.defineItem(
// 	DEFAULT_SETTINGS_PROXY,
// 	{
// 		fallback: clone(STORAGE_DEFAULTS[DEFAULT_SETTINGS_PROXY]),
// 		init: () => clone(STORAGE_DEFAULTS[DEFAULT_SETTINGS_PROXY]),
// 	},
// );

// export const statisticsStorageItem = storage.defineItem(STATISTICS, {
// 	fallback: clone(STORAGE_DEFAULTS[STATISTICS]),
// 	init: () => clone(STORAGE_DEFAULTS[STATISTICS]),
// });

// const CACHE_SIZE = 100;

// const siteSpecificStatisticsStorageItemCache =
// 	lru<
// 		WxtStorageItem<
// 			(typeof STORAGE_DEFAULTS)[typeof SITE_SPECIFIC_STATISTICS_PREFIX],
// 			Record<string, unknown>
// 		>
// 	>(CACHE_SIZE);

// const siteSpecificGeneralSettingsStorageItemCache =
// 	lru<
// 		WxtStorageItem<
// 			(typeof STORAGE_DEFAULTS)[typeof DEFAULT_SETTINGS_GENERAL],
// 			Record<string, unknown>
// 		>
// 	>(CACHE_SIZE);

// const siteSpecificCompressionSettingsStorageItemCache =
// 	lru<
// 		WxtStorageItem<
// 			(typeof STORAGE_DEFAULTS)[typeof DEFAULT_SETTINGS_COMPRESSION],
// 			Record<string, unknown>
// 		>
// 	>(CACHE_SIZE);

// const siteSpecificProxySettingsStorageItemCache =
// 	lru<
// 		WxtStorageItem<
// 			(typeof STORAGE_DEFAULTS)[typeof DEFAULT_SETTINGS_PROXY],
// 			Record<string, unknown>
// 		>
// 	>(CACHE_SIZE);

// export const getSiteSpecificStatisticsStorageItem = (url: UrlSchema) => {
// 	const key =
// 		`${SITE_SPECIFIC_STATISTICS_PREFIX}${getUrlSchemaOrigin(url)}` as const;

// 	const possibleCachedStorageItem =
// 		siteSpecificStatisticsStorageItemCache.get(key);

// 	if (possibleCachedStorageItem) return possibleCachedStorageItem;

// 	const storageItem = storage.defineItem(key, {
// 		fallback: clone(STORAGE_DEFAULTS[SITE_SPECIFIC_STATISTICS_PREFIX]),
// 		init: () => clone(STORAGE_DEFAULTS[SITE_SPECIFIC_STATISTICS_PREFIX]),
// 	});

// 	siteSpecificStatisticsStorageItemCache.set(key, storageItem);

// 	return storageItem;
// };

// export const getSiteSpecificGeneralSettingsStorageItem = (url: UrlSchema) => {
// 	const key =
// 		`${SITE_SPECIFIC_SETTINGS_GENERAL_PREFIX}${getUrlSchemaOrigin(url)}` as const;

// 	const possibleCachedStorageItem =
// 		siteSpecificGeneralSettingsStorageItemCache.get(key);

// 	if (possibleCachedStorageItem) return possibleCachedStorageItem;

// 	const storageItem = storage.defineItem(key, {
// 		fallback: clone(STORAGE_DEFAULTS[DEFAULT_SETTINGS_GENERAL]),
// 		init: defaultGeneralSettingsStorageItem.getValue,
// 	});

// 	siteSpecificGeneralSettingsStorageItemCache.set(key, storageItem);

// 	return storageItem;
// };

// export const getSiteSpecificCompressionSettingsStorageItem = (
// 	url: UrlSchema,
// ) => {
// 	const key =
// 		`${SITE_SPECIFIC_SETTINGS_COMPRESSION_PREFIX}${getUrlSchemaOrigin(url)}` as const;

// 	const possibleCachedStorageItem =
// 		siteSpecificCompressionSettingsStorageItemCache.get(key);

// 	if (possibleCachedStorageItem) return possibleCachedStorageItem;

// 	const storageItem = storage.defineItem(key, {
// 		fallback: clone(STORAGE_DEFAULTS[DEFAULT_SETTINGS_COMPRESSION]),
// 		init: defaultCompressionSettingsStorageItem.getValue,
// 	});

// 	siteSpecificCompressionSettingsStorageItemCache.set(key, storageItem);

// 	return storageItem;
// };

// export const getSiteSpecificProxySettingsStorageItem = (url: UrlSchema) => {
// 	const key =
// 		`${SITE_SPECIFIC_SETTINGS_PROXY_PREFIX}${getUrlSchemaOrigin(url)}` as const;

// 	const possibleCachedStorageItem =
// 		siteSpecificProxySettingsStorageItemCache.get(key);

// 	if (possibleCachedStorageItem) return possibleCachedStorageItem;

// 	const storageItem = storage.defineItem(key, {
// 		fallback: clone(STORAGE_DEFAULTS[DEFAULT_SETTINGS_PROXY]),
// 		init: defaultProxySettingsStorageItem.getValue,
// 	});

// 	siteSpecificProxySettingsStorageItemCache.set(key, storageItem);

// 	return storageItem;
// };
