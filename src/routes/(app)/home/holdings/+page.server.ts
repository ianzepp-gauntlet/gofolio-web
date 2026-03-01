import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';
import type { PortfolioHoldingsResponse } from '$lib/types/api';

const API_URL = env.GOFOLIO_API_URL ?? 'http://localhost:3333';

export const load: PageServerLoad = async ({ locals, parent, url }) => {
	const { user } = await parent();
	const range = url.searchParams.get('range') ?? user.settings.dateRange ?? 'max';
	const holdingType = url.searchParams.get('holdingType') === 'CLOSED' ? 'CLOSED' : 'ACTIVE';
	const token = locals.token!;
	const params = new URLSearchParams({ range });
	if (holdingType === 'CLOSED') {
		params.set('holdingType', 'CLOSED');
	}

	try {
		const res = await fetch(`${API_URL}/api/v1/portfolio/holdings?${params.toString()}`, {
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (!res.ok) {
			return { holdings: [], range, holdingType };
		}

		const data: PortfolioHoldingsResponse = await res.json();
		return { holdings: data.holdings, range, holdingType };
	} catch {
		return { holdings: [], range, holdingType };
	}
};
