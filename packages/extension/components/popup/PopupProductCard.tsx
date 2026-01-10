import { getRandomUUID, PlaceholderImage } from "@shopping-optimizer/shared";
import type { ProductDataSchema } from "../../../shared/src/models/product";

export function PopupProductCard(props: { product: ProductDataSchema }) {
	return (
		<div class="card card-side h-30 bg-base-300 shadow-sm">
			<figure>
				<img
					alt="Main Product"
					class="object-cover"
					onError={({ currentTarget }) => {
						currentTarget.src = PlaceholderImage.default;
					}}
					src={props.product.imgSrc ?? PlaceholderImage.default}
				/>
			</figure>

			<div class="card-body py-2">
				<h3 class="card-title w-70 overflow-clip overflow-x-auto whitespace-nowrap text-primary">
					{props.product.name}
				</h3>
				<div class="flex items-center justify-between text-base">
					<p class="text-accent">
						{props.product.currency} {props.product.price.toLocaleString()}
					</p>

					<a class="link-info link" href={props.product.url} target="_blank">
						Visit Site?
					</a>
				</div>
				<div class="flex items-center justify-start gap-4">
					<BaseRating
						name={`Rating for ${props.product.name}- ${getRandomUUID()}`}
						ratingLevel={Math.round(props.product.rating)}
						readonly={true}
					/>

					<div class="truncate">
						(<span class="text-info">{props.product.rating}</span> on{" "}
						<span class="inline-block max-w-[10ch] text-secondary">
							{props.product.store}
						</span>
						)
					</div>
				</div>
			</div>
		</div>
	);
}
