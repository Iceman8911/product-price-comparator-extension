/** biome-ignore-all lint/complexity/useLiteralKeys: <TS prefers "computed" key indexes> */
import * as v from "valibot";
import {
	ProductDataRatingSchema,
	ProductDataSchema,
} from "../../../../../shared/src/models/product";
import { NOT_AVAILABLE } from "../../../constants";
import {
	createCombinedProductDataExtractor,
	createDocumentScraperProductDataExtractor,
	extractCurrencyFromJsonString,
	type ProductDataExtractor,
} from "./shared";

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
	const windowData = window["__NEXT_DATA__"];

	const { name, price, product_rating, image_thumbnail } = v.parse(
		KongaProductSchema,
		windowData.props.initialProps.pageProps.data.product,
	);

	const productData = {
		currency:
			extractCurrencyFromJsonString(JSON.stringify(windowData)) ??
			NOT_AVAILABLE,
		imgSrc: `${KONGA_CLOUDINARY_OPTIMIZER_IMAGE_PREFIX}${image_thumbnail}`,
		name,
		price,
		rating: product_rating.quality.average,
		store: STORE_NAME,
		url: window.location.href,
	} as const satisfies ProductDataSchema;

	return v.parse(ProductDataSchema, productData);
};

const documentScraperExtractor = createDocumentScraperProductDataExtractor(
	(document) => {
		const currency = document.querySelector(
			"[class*=priceBoxPrice] span",
		)?.textContent;
		const name = document.querySelector("[class*=productName]")?.textContent;
		const price = document.querySelector(
			"[class*=priceBoxPrice] div",
		)?.textContent;
		const rating = document.querySelector(
			"[class*=customerReview_] p",
		)?.textContent;
		const imgSrc = (
			document.querySelector("img[class*=asset_imageContain]") as
				| HTMLImageElement
				| undefined
		)?.src;

		return {
			currency,
			imgSrc,
			name,
			price,
			rating,
			store: STORE_NAME,
			url: document.location.href,
		};
	},
);

export const kongaProductDataExtractor = createCombinedProductDataExtractor(
	STORE_NAME,
	windowGlobalExtractor,
	documentScraperExtractor,
);
