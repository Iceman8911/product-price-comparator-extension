import { getRandomUUID, PlaceholderImage } from "@shopping-optimizer/shared";
import type { ProductDataSchema } from "../../../shared/src/models/product";

export function PopupProductCard(props: { product: ProductDataSchema }) {
	return (
		<div class="grid h-28 grid-cols-[20%_1fr] grid-rows-[1.5fr_1fr_1fr] gap-x-4">
			<figure class="row-span-3">
				<img
					alt="Main Product"
					class="size-full rounded-box object-cover shadow-lg"
					onError={({ currentTarget }) => {
						currentTarget.src = PlaceholderImage.default;
					}}
					src={props.product.imgSrc ?? PlaceholderImage.default}
				/>
			</figure>

			<h3 class="overflow-auto font-semibold text-base text-primary text-shadow-lg">
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

			<div class="flex items-center justify-start gap-4 text-base">
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
	);
}
