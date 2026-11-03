import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeAll, describe, expect, it, vi } from 'vitest';
import type { Rating } from '@/main/model';
import RatingComponent from './RatingComponent';

vi.mock('react-i18next', () => ({
	useTranslation: () => ({
		t: (key: string) => key,
	}),
}));

beforeAll(() => {
	// jsdom does not implement modal dialogs
	HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
		this.open = true;
	};
});

const RATING: Rating = {
	encouragedPresent: [{ componentName: 'vegetables', points: 12.5 }],
	limitedPresent: [{ componentName: 'red meat', points: 25 }],
};

describe('RatingComponent', () => {
	it('shows the score, BASE raised by the encouraged points and lowered by the limited ones', () => {
		render(<RatingComponent rating={RATING} max={100} />);

		// 50 + 12.5 - 25 = 37.5
		expect(screen.getByText('38')).toBeTruthy();
		expect(screen.getByRole('progressbar').getAttribute('value')).toBe('38');
		expect(screen.getByRole('progressbar').getAttribute('max')).toBe('100');
	});

	it.each([
		[{ encouragedPresent: [], limitedPresent: [{ componentName: 'sodium', points: 11 }] }, 'progress-error'],
		[{ encouragedPresent: [], limitedPresent: [{ componentName: 'sodium', points: 10 }] }, 'progress-warning'],
		[{ encouragedPresent: [{ componentName: 'fiber', points: 9 }], limitedPresent: [] }, 'progress-warning'],
		[{ encouragedPresent: [{ componentName: 'fiber', points: 10 }], limitedPresent: [] }, 'progress-success'],
	])('colours the bar by how far the score is from BASE: %j', (rating, className) => {
		render(<RatingComponent rating={rating} max={100} />);

		expect(screen.getByRole('progressbar').classList.contains(className)).toBe(true);
	});

	it('lists the present components with the points each adds or subtracts when tapped', () => {
		render(<RatingComponent rating={RATING} max={100} />);

		fireEvent.click(screen.getByRole('button', { name: 'main.RatingComponent.score' }));

		const dialog = screen.getByRole('dialog');
		expect(within(dialog).getByText('vegetables')).toBeTruthy();
		expect(within(dialog).getByText('+13')).toBeTruthy();
		expect(within(dialog).getByText('red meat')).toBeTruthy();
		expect(within(dialog).getByText('−25')).toBeTruthy();
	});

	it('says so when a type has no present component', () => {
		render(<RatingComponent rating={{ encouragedPresent: [], limitedPresent: [] }} max={100} />);

		fireEvent.click(screen.getByRole('button', { name: 'main.RatingComponent.score' }));

		expect(within(screen.getByRole('dialog')).getAllByText('main.RatingComponent.none')).toHaveLength(2);
	});

	it('also opens the details from the keyboard', () => {
		render(<RatingComponent rating={RATING} max={100} />);

		fireEvent.keyDown(screen.getByRole('button', { name: 'main.RatingComponent.score' }), { key: 'Enter' });

		expect(within(screen.getByRole('dialog')).getByText('vegetables')).toBeTruthy();
	});
});
