import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { TbInfoSquareRounded } from 'react-icons/tb';
import type { Rating, RatingContribution } from '@/main/model';
import { BASE, ratingScore } from '@/main/reducers/calculateRating';

export interface RatingComponentProps {
	rating: Rating;
	max: number;
}

/** How far from the neutral BASE the score has to be before the bar changes colour. */
const BAND_WIDTH = 10;

function progressColourOf(score: number): string {
	if (score < BASE - BAND_WIDTH) return 'progress-error';
	if (score < BASE + BAND_WIDTH) return 'progress-warning';
	return 'progress-success';
}

const RatingComponent: React.FC<RatingComponentProps> = (props: RatingComponentProps) => {
	const { t } = useTranslation();
	const dialogRef = useRef<HTMLDialogElement>(null);
	const score = ratingScore(props.rating);
	const { encouragedPresent, limitedPresent } = props.rating;

	const openDetails = () => dialogRef.current?.showModal();

	const renderComponents = (contributions: RatingContribution[], sign: string) =>
		contributions.length ? (
			contributions.map((contribution) => (
				<li key={contribution.componentName} className="flex justify-between gap-4">
					<span className="capitalize">{contribution.componentName}</span>
					<span className="tabular-nums">
						{sign}
						{Math.round(contribution.points)}
					</span>
				</li>
			))
		) : (
			<li className="opacity-60">{t('main.RatingComponent.none')}</li>
		);

	return (
		<div className="flex items-center gap-3">
			<h2 className="my-0">{t('main.RatingComponent.rating')}</h2>
			<div
				className="flex max-w-[260px] flex-1 cursor-pointer items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4"
				role="button"
				tabIndex={0}
				aria-label={t('main.RatingComponent.score', { score, max: props.max })}
				onClick={openDetails}
				onKeyDown={(event) => {
					if (event.key === 'Enter' || event.key === ' ') {
						event.preventDefault();
						openDetails();
					}
				}}
			>
				<progress className={`progress h-3 flex-1 ${progressColourOf(score)}`} value={score} max={props.max} />
				<span className="min-w-[2.5ch] text-right font-semibold tabular-nums">{score}</span>
				<TbInfoSquareRounded className="size-5 shrink-0 opacity-60" aria-hidden="true" />
			</div>
			<dialog ref={dialogRef} className="modal">
				<div className="modal-box">
					<h3 className="mt-0">{t('main.RatingComponent.detailsTitle')}</h3>
					<h4>{t('main.RatingComponent.encouragedPresent')}</h4>
					<ul className="space-y-1">{renderComponents(encouragedPresent, '+')}</ul>
					<h4 className="mt-6">{t('main.RatingComponent.limitedPresent')}</h4>
					<ul className="space-y-1">{renderComponents(limitedPresent, '−')}</ul>
					<form method="dialog" className="modal-action">
						<button className="btn btn-sm">{t('main.RatingComponent.OK')}</button>
					</form>
				</div>
				<form method="dialog" className="modal-backdrop">
					<button aria-hidden="true" tabIndex={-1} />
				</form>
			</dialog>
		</div>
	);
};

export default RatingComponent;
