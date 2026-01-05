const RATING_START_COUNT = 5;

const DUMMY_RATING_LENGTH_ARRAY = Array(RATING_START_COUNT);

type BaseRatingProps = {
	/** Should be unique to prevent conflicts with other ratings on the page */
	name: string;
	class?: string;
	containerClass?: string;
	/** 0 to 5 */
	ratingLevel: number;

	readonly?: boolean;
};

export function BaseRating(props: BaseRatingProps) {
	const containerClass = () => props.containerClass ?? "";
	const starClass = () => props.class ?? "";

	return (
		<div class={`rating ${containerClass()}`}>
			<input
				aria-label="clear"
				class="rating-hidden"
				name={props.name}
				type="radio"
			/>
			<Index each={DUMMY_RATING_LENGTH_ARRAY}>
				{(_, idx) => {
					return (
						<input
							aria-label={`${idx + 1} star`}
							checked={props.ratingLevel === idx + 1}
							class={`mask mask-star-2 bg-orange-400 ${props.readonly ? "pointer-events-none" : ""} ${starClass()}`}
							disabled={props.readonly}
							name={props.name}
							type="radio"
						/>
					);
				}}
			</Index>
		</div>
	);
}
