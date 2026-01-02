/** biome-ignore-all lint/complexity/useLiteralKeys: <TS prefers "computed" key indexes> */

import {
	fixCaughtErrorType,
	SCRAPED_PRODUCT_DATA_CLEANER,
} from "@bandwidth-saver/shared";
import { getCurrency } from "locale-currency";
import * as v from "valibot";
import {
	ProductDataRatingSchema,
	ProductDataSchema,
} from "../../../../../shared/src/models/product";
import { getUserLanguage } from "../../shared";
import type { ProductDataExtractor } from "./shared";

const STORE_NAME = "Konga";

const KONGA_CLOUDINARY_OPTIMIZER_IMAGE_PREFIX =
	"https://www-konga-com-res.cloudinary.com/image/upload/f_auto,fl_lossy,dpr_auto,q_auto,w_3840/media/catalog/product";

const KongaProductSchema = v.looseObject({
	/** Just the ending price of the actual url, e.g "/Z/H/_1693385527.png" */
	image_thumbnail: v.string(),
	name: v.string(),
	price: v.number(),
	product_rating: v.looseObject({
		quality: v.looseObject({
			average: ProductDataRatingSchema,
		}),
	}),
});

const windowGlobalExtractor: ProductDataExtractor = (window) => {
	const { name, price, product_rating, image_thumbnail } = v.parse(
		KongaProductSchema,
		window["__NEXT_DATA__"].props.initialProps.pageProps.data.product,
	);

	const productData = {
		currency: getCurrency(getUserLanguage()) ?? "",
		imgSrc: `${KONGA_CLOUDINARY_OPTIMIZER_IMAGE_PREFIX}${image_thumbnail}`,
		name,
		price,
		rating: product_rating.quality.average,
		store: STORE_NAME,
	} as const satisfies ProductDataSchema;

	return v.parse(ProductDataSchema, productData);
};

const documentScraperExtractor: ProductDataExtractor = ({ document }) => {
	const scrapedCurrency = document.querySelector(
		"[class*=priceBoxPrice] span",
	)?.textContent;
	const scrapedName = document.querySelector(
		"[class*=productName]",
	)?.textContent;
	const scrapedPrice = document.querySelector(
		"[class*=priceBoxPrice] div",
	)?.textContent;
	const scrapedRating = document.querySelector(
		"[class*=customerReview_] p",
	)?.textContent;
	const scrapedImgUrl = (
		document.querySelector("img[class*=asset_imageContain]") as
			| HTMLImageElement
			| undefined
	)?.src;

	if (
		!scrapedCurrency ||
		!scrapedName ||
		!scrapedPrice ||
		!scrapedRating ||
		!scrapedImgUrl
	) {
		console.warn(
			"Undefined data in one of the variables:",
			scrapedCurrency,
			scrapedName,
			scrapedPrice,
			scrapedRating,
			scrapedImgUrl,
		);

		return null;
	}

	const productData = {
		currency: SCRAPED_PRODUCT_DATA_CLEANER.currency(scrapedCurrency),
		imgSrc: SCRAPED_PRODUCT_DATA_CLEANER.imgSrc(scrapedImgUrl),
		name: SCRAPED_PRODUCT_DATA_CLEANER.name(scrapedName),
		price: SCRAPED_PRODUCT_DATA_CLEANER.price(scrapedPrice),
		rating: SCRAPED_PRODUCT_DATA_CLEANER.rating(scrapedRating),
		store: STORE_NAME,
	} as const satisfies ProductDataSchema;

	return v.parse(ProductDataSchema, productData);
};

export const kongaProductDataExtractor: ProductDataExtractor = (window) => {
	try {
		return windowGlobalExtractor(window);
	} catch (e) {
		console.warn("Konga extraction failed with error:", fixCaughtErrorType(e));

		try {
			return documentScraperExtractor(window);
		} catch (e) {
			console.warn(
				"Konga scraper extraction failed with error:",
				fixCaughtErrorType(e),
			);

			return null;
		}
	}
};
