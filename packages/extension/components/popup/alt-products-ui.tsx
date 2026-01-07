import {
	isLikelyShoppingUrl,
	type UrlSchema,
} from "@shopping-optimizer/shared";
import SearchIcon from "lucide-solid/icons/search";
import type { SetStoreFunction } from "solid-js/store";
import { extractProductDataFromUrls } from "@/shared/scraping";
import { getSearchResults } from "@/shared/search";
import { getCachedProductDataForSite } from "@/shared/storage";
import type { ProductDataSchema } from "../../../shared/src/models/product";
import { PopupProductCard } from "./PopupProductCard";

type PopupAltProductSearchButtonProps = {
	mainProductName: string;
	setAltProducts: SetStoreFunction<ProductDataSchema[]>;
};

export function PopupAltProductSearchButton(
	props: PopupAltProductSearchButtonProps,
) {
	const [isSearchingForAlts, setIsSearchingForAlts] = createSignal(false);

	const handleBtnClick = async () => {
		setIsSearchingForAlts(true);

		try {
			const productSearchResults = await getSearchResults({
				engines: ["duckduckgo"],
				limit: 15,
				text: `Shopping for ${props.mainProductName}`,
			});

			const sitesToTryScraping = productSearchResults.reduce<UrlSchema[]>(
				(validUrls, { url }) => {
					if (isLikelyShoppingUrl(url)) {
						validUrls.push(url);
					}

					return validUrls;
				},
				[],
			);

			const scrapedProductData = await extractProductDataFromUrls(
				...sitesToTryScraping,
			);
			const filteredProducts = scrapedProductData.filter(
				(data) => data.name !== props.mainProductName,
			);

			props.setAltProducts(filteredProducts);

			// Cache product data
			setTimeout(() => {
				for (const product of filteredProducts) {
					getCachedProductDataForSite(product.url).setValue(product);
				}
			}, 1000);
		} catch (e) {
			console.error("Alt product searching failed with:", e);
		}

		setIsSearchingForAlts(false);
	};

	return (
		<BaseButton
			aria-label="Search for alternative products"
			class="btn-circle btn-primary"
			disabled={isSearchingForAlts()}
			onClick={handleBtnClick}
		>
			<Show
				fallback={<div class="loading loading-spinner"></div>}
				when={!isSearchingForAlts()}
			>
				<SearchIcon />
			</Show>
		</BaseButton>
	);
}

type PopupAltProductsProps = { products: ReadonlyArray<ProductDataSchema> };

/** Displays the detected product info, and allows the user to search for similar ones  */
export function PopupAltProducts(props: PopupAltProductsProps) {
	return (
		<section class="flex grow flex-col contain-size">
			<h2 class="mb-2 font-semibold text-base"> Alternatives</h2>

			<div class="flex grow flex-col gap-4 overflow-auto contain-size">
				<For each={props.products}>
					{(product) => <PopupProductCard product={product} />}
				</For>
			</div>
		</section>
	);
}
