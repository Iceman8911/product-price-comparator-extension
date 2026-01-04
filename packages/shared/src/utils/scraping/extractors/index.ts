// Some shopping sites have the currently viewed product's data somewhere within a global

import { SupportedSitePatterns } from "@bandwidth-saver/shared";
import { MatchPattern } from "@webext-core/match-patterns";
import type { ProductDataSchema } from "../../../models/product";
import { llmProductDataExtractor } from "./fallback";
import { jumiaProductDataExtractor } from "./jumia";
import { kongaProductDataExtractor } from "./konga";
import { schemaOrgProductDataExtractor } from "./schema.org";
import type { ProductDataExtractor } from "./shared";
import { temuProductDataExtractor } from "./temu";

const SUPPORTED_SITE_PRODUCT_DATA_EXTRACTOR = {
	[SupportedSitePatterns.JUMIA]: jumiaProductDataExtractor,
	[SupportedSitePatterns.KONGA]: kongaProductDataExtractor,
	[SupportedSitePatterns.TEMU]: temuProductDataExtractor,
} as const satisfies {
	[key in SupportedSitePatterns]?: ProductDataExtractor;
};

const SUPPORTED_SITE_PRODUCT_DATA_MATCH_PATTERNS_AND_EXTRACTORS =
	Object.entries(SUPPORTED_SITE_PRODUCT_DATA_EXTRACTOR).map(
		(entry) => [new MatchPattern(entry[0]), entry[1]] as const,
	);

const backupProductDataExtractor = ([window, llmQuerier]: Parameters<
	typeof llmProductDataExtractor
>) => {
	return (
		schemaOrgProductDataExtractor(window) ??
		llmProductDataExtractor(window, llmQuerier)
	);
};

/** All encompassing product extractor */
export const extractProductDataFromWindow = async ([
	window,
	llmQuerier,
]: Parameters<
	typeof llmProductDataExtractor
>): Promise<ProductDataSchema | null> => {
	const siteUrl = window.location.href;

	const matchingSupportedExtractor =
		SUPPORTED_SITE_PRODUCT_DATA_MATCH_PATTERNS_AND_EXTRACTORS.find(
			([matchPattern]) => {
				return matchPattern.includes(siteUrl);
			},
		);

	if (matchingSupportedExtractor) {
		return (
			matchingSupportedExtractor[1](window) ??
			backupProductDataExtractor([window, llmQuerier])
		);
	}

	return backupProductDataExtractor([window, llmQuerier]);
};
