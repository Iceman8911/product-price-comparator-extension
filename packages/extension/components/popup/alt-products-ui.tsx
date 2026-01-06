import type { ProductDataSchema } from "../../../shared/src/models/product";
import { PopupProductCard } from "./PopupProductCard";

type PopupAltProductsProps = { products: ReadonlyArray<ProductDataSchema> };

/** Displays the detected product info, and allows the user to search for similar ones  */
export default function PopupAltProducts(props: PopupAltProductsProps) {
	return (
		<section>
			<h2 class="mb-2 font-semibold text-base"> Alternatives</h2>

			<For each={props.products}>
				{(product) => <PopupProductCard product={product} />}
			</For>
		</section>
	);
}
