import { UrlSchema } from "@shopping-optimizer/shared";
import * as v from "valibot";
import { DUMMY_TAB_URL } from "@/shared/constants";
import { getCachedProductDataForSite } from "@/shared/storage";
import type { ProductDataSchema } from "../../../shared/src/models/product";
import NoProductDetectedOnCurrentSiteYetUi from "./default-no-product-ui";
import MainProductDetectedOnCurrentSite from "./main-product-ui";

export default function PopupUi() {
	const [tabs] = createResource(() =>
		browser.tabs.query({
			active: true,
			currentWindow: true,
		}),
	);

	const activeTab = createMemo(() => tabs()?.[0]);

	const activeTabId = () => activeTab()?.id ?? Number.MAX_SAFE_INTEGER;

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
						activeTab={{ id: activeTabId(), url: activeTabUrl() }}
						setMainProduct={setMainProduct}
					/>
				}
				when={mainProduct()}
			>
				{(product) => (
					<MainProductDetectedOnCurrentSite mainProduct={product()} />
				)}
			</Show>
		</div>
	);
}
