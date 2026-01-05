import {
	getRandomUUID,
	PlaceholderImage,
	UrlSchema,
} from "@bandwidth-saver/shared";
import SearchIcon from "lucide-solid/icons/search";
import type { Setter } from "solid-js";
import * as v from "valibot";
import { DUMMY_TAB_URL, MessageType } from "@/shared/constants";
import { sendExtensionMessage } from "@/shared/messaging/extension";
import { getCachedProductDataForSite } from "@/shared/storage";
import type { ProductDataSchema } from "../../../shared/src/models/product";
import { BaseRating } from "../rating";

type DetectProductOnCurrentSiteButtonProps = {
	setMainProduct: Setter<ProductDataSchema | undefined | null>;
	activeTab: {
		url: UrlSchema;
		id: number;
	};
};

function DetectProductOnCurrentSiteButton(
	props: DetectProductOnCurrentSiteButtonProps,
) {
	const [isDetectingProduct, setIsDetectingProduct] = createSignal(false);

	const handleBtnClick = async () => {
		const cachedProductData = await getCachedProductDataForSite(
			props.activeTab.url,
		).getValue();

		if (cachedProductData) {
			props.setMainProduct(cachedProductData);
			return;
		}

		setIsDetectingProduct(true);

		const possibleProductData = await sendExtensionMessage(
			MessageType.EXTRACT_PRODUCT_DATA_FROM_INJECTED_SITE,
			undefined,
			props.activeTab.id,
		);

		props.setMainProduct(possibleProductData);

		setIsDetectingProduct(false);
	};

	return (
		<BaseButton
			aria-label="Detect Product on Current Site"
			class="btn-circle btn-primary size-14"
			disabled={isDetectingProduct()}
			onClick={handleBtnClick}
		>
			<Show
				fallback={<div class="loading loading-spinner size-8"></div>}
				when={!isDetectingProduct()}
			>
				<SearchIcon class="size-8" />
			</Show>
		</BaseButton>
	);
}

type NoProductDetectedOnCurrentSiteYetUiProps =
	DetectProductOnCurrentSiteButtonProps & {};

function NoProductDetectedOnCurrentSiteYetUi(
	props: NoProductDetectedOnCurrentSiteYetUiProps,
) {
	return (
		<div class="flex flex-col items-center justify-center gap-8">
			<h2 class="text-center text-base">
				Seems like no product has been autodetected. Click the button below to
				begin manual detection.
			</h2>
			<DetectProductOnCurrentSiteButton {...props} />
		</div>
	);
}

function ProductCard(props: { product: ProductDataSchema }) {
	return (
		<div class="card card-side bg-base-300 shadow-sm">
			<figure>
				<img
					alt="Main Product"
					class="object-cover"
					src={props.product.imgSrc ?? PlaceholderImage.default}
				/>
			</figure>

			<div class="card-body py-2">
				<h2 class="card-title w-70 overflow-clip overflow-x-auto whitespace-nowrap text-primary">
					{props.product.name}
				</h2>
				<p class="text-base">
					{props.product.currency} {props.product.price}
				</p>
				<div class="flex items-center justify-start gap-4">
					<BaseRating
						name={`Rating for ${props.product.name}- ${getRandomUUID()}`}
						ratingLevel={props.product.rating}
					/>

					<div>
						(<span class="text-info">{props.product.rating}</span> on{" "}
						<span class="text-secondary">{props.product.store}</span>)
					</div>
				</div>
			</div>
		</div>
	);
}

type MainProductDetectedOnCurrentSiteProps = { mainProduct: ProductDataSchema };

/** Displays the detected product info, and allows the user to search for similar ones  */
function MainProductDetectedOnCurrentSite(
	props: MainProductDetectedOnCurrentSiteProps,
) {
	return (
		<div class="flex h-full flex-col gap-4">
			<ProductCard product={props.mainProduct} />
		</div>
	);
}

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
