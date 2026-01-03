/** The collection of sites I personally optimised for, those not included will fall back to a generic catch-all approach.
 */
export enum SupportedSitePatterns {
	JUMIA = "https://*.jumia.*/*",
	KONGA = "https://*.konga.com/*",
	JIJI = "https://jiji.ng/*",
	TAKEALOT = "https://*.takealot.com/*",
	KILIMALL = "https://*.kilimall.co.ke/*",
	ZANDO = "https://*.zando.co.za/*",
	SUPERBALIST = "https://*.superbalist.com/*",
	BOB_SHOP = "https://*.bobshop.co.za/*",
	PAYPORTE = "https://*.payporte.com/*",
	KARA = "https://*.kara.com.ng/*",
	SLOT = "https://*.slot.ng/*",

	AMAZON_GLOBAL = "https://*.amazon.com/*",
	AMAZON_ZA = "https://*.amazon.co.za/*",
	TEMU = "https://*.temu.com/*",
	ALIEXPRESS = "https://*.aliexpress.com/*",
	SHEIN = "https://*.shein.com/*",
	EBAY = "https://*.ebay.com/*",
	WALMART = "https://*.walmart.com/*",
	SHOPEE = "https://*.shopee.com/*",
	ETSY = "https://*.etsy.com/*",
	ALIBABA = "https://*.alibaba.com/*",
}

export enum PRODUCT_RATING_RANGE {
	MIN = 0,
	MAX = 5,
}

export const NOT_AVAILABLE = "N/A";
