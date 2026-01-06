import SearchIcon from "lucide-solid/icons/search";
import type { SetStoreFunction } from "solid-js/store";
import { extractProductDataFromUrls } from "@/entrypoints/background/scraping";
import { getSearchResults } from "@/shared/search";
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
				engines: ["bing", "duckduckgo"],
				limit: 5,
				text: props.mainProductName,
			});

			const sitesToTryScraping = productSearchResults.map((res) => res.url);

			const scrapedProductData = await extractProductDataFromUrls(
				...sitesToTryScraping,
			);

			props.setAltProducts(
				scrapedProductData.filter(Boolean) as ProductDataSchema[],
			);
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
		<section>
			<h2 class="mb-2 font-semibold text-base"> Alternatives</h2>

			<For each={props.products}>
				{(product) => <PopupProductCard product={product} />}
			</For>
		</section>
	);
}
