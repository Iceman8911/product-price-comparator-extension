import type { ProductDataSchema } from "./models/product";

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
