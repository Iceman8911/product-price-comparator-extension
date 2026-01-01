// Some shopping sites have the currently viewed product's data somewhere within a global

import { SupportedSitePatterns } from "@bandwidth-saver/shared";
import { jumiaProductDataExtractor } from "./jumia";
import { kongaProductDataExtractor } from "./konga";
import type { ProductDataExtractor } from "./shared";

const SUPPORTED_SITE_PRODUCT_DATA_EXTRACTOR = {
	[SupportedSitePatterns.JUMIA]: jumiaProductDataExtractor,
	[SupportedSitePatterns.KONGA]: kongaProductDataExtractor,
} as const satisfies {
	[key in SupportedSitePatterns]?: ProductDataExtractor;
};

export default SUPPORTED_SITE_PRODUCT_DATA_EXTRACTOR;
