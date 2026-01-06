import type { ProductDataSchema } from "../../../shared/src/models/product";
import { PopupProductCard } from "./PopupProductCard";

type PopupMainProductProps = { mainProduct: ProductDataSchema };

/** Displays the detected product info, and allows the user to search for similar ones  */
export default function PopupMainProduct(props: PopupMainProductProps) {
	return (
		<section>
			<h2 class="mb-2 font-semibold text-base"> Main Product</h2>
			<PopupProductCard product={props.mainProduct} />
		</section>
	);
}
