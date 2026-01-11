import { UrlSchema } from "@shopping-optimizer/shared";
import * as v from "valibot";
import { DUMMY_TAB_URL } from "@/shared/constants";
import { getCachedProductDataForSite } from "@/shared/storage";
import type { ProductDataSchema } from "../../../shared/src/models/product";
import {
	PopupAltProductSearchButton,
	PopupAltProducts,
} from "./alt-products-ui";
import NoProductDetectedOnCurrentSiteYetUi from "./default-no-product-ui";
import PopupMainProduct from "./main-product-ui";

export default function PopupUi() {
	const [tabs] = createResource(() =>
		browser.tabs.query({
			active: true,
			currentWindow: true,
		}),
	);

	const activeTab = createMemo(() => tabs()?.[0]);

	const activeTabUrl = () =>
		v.parse(UrlSchema, activeTab()?.url ?? DUMMY_TAB_URL);

	const cachedProductDataStorageItem = createMemo(() =>
		getCachedProductDataForSite(activeTabUrl()),
	);

	const [cachedProductData, { refetch: refetchCachedProductData }] =
		createResource(() => cachedProductDataStorageItem().getValue());

	const [mainProduct, setMainProduct] = createSignal<
		ProductDataSchema | undefined | null
	>(cachedProductData());

	const [altProducts, setAltProducts] = createStore<ProductDataSchema[]>([]);

	createEffect(
		on(mainProduct, async (mainProduct) => {
			if (!mainProduct) return;

			await cachedProductDataStorageItem().setValue(mainProduct);

			await refetchCachedProductData();
		}),
	);

	return (
		<div class="glass grid size-full place-items-center rounded-box bg-base-200 p-4">
			<Show
				fallback={
					<NoProductDetectedOnCurrentSiteYetUi
						activeTab={activeTab()}
						setMainProduct={setMainProduct}
					/>
				}
				when={mainProduct()}
			>
				{(product) => (
					<div class="flex h-full flex-col gap-4">
						<div>
							<PopupMainProduct mainProduct={product()} />

							<div class="divider"></div>
						</div>

						<Show
							fallback={
								<div class="flex flex-col items-center justify-center gap-4">
									<p class="text-base">Search for alternatives?</p>
									<PopupAltProductSearchButton
										mainProductName={product().name}
										setAltProducts={setAltProducts}
									/>
								</div>
							}
							when={altProducts.length}
						>
							<PopupAltProducts products={altProducts} />
						</Show>
					</div>
				)}
			</Show>
		</div>
	);
}
