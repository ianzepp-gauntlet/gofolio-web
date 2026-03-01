import { env } from '$env/dynamic/private';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import type { PageServerLoad } from './$types';
import type { WatchlistResponse } from '$lib/types/api';

const API_URL = env.GOFOLIO_API_URL ?? 'http://localhost:3333';

export const load: PageServerLoad = async ({ locals }) => {
	const token = locals.token!;

	try {
		const res = await fetch(`${API_URL}/api/v1/watchlist`, {
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (!res.ok) {
			return { watchlist: [] };
		}

		const data: WatchlistResponse = await res.json();
		return { watchlist: data.watchlist };
	} catch {
		return { watchlist: [] };
	}
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		const token = locals.token;
		if (!token) {
			return fail(401, { action: 'create', error: 'Not authenticated.' });
		}

		const data = await request.formData();
		const dataSource = data.get('dataSource');
		const symbol = data.get('symbol');

		if (typeof dataSource !== 'string' || !dataSource.trim()) {
			return fail(400, { action: 'create', error: 'Data source is required.' });
		}

		if (typeof symbol !== 'string' || !symbol.trim()) {
			return fail(400, { action: 'create', error: 'Symbol is required.' });
		}

		const res = await fetch(`${API_URL}/api/v1/watchlist`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({
				dataSource: dataSource.trim(),
				symbol: symbol.trim().toUpperCase()
			})
		});

		if (!res.ok) {
			return fail(res.status, { action: 'create', error: 'Unable to add watchlist item.' });
		}

		redirect(303, '/home/watchlist');
	},
	delete: async ({ request, locals }) => {
		const token = locals.token;
		if (!token) {
			return fail(401, { action: 'delete', error: 'Not authenticated.' });
		}

		const data = await request.formData();
		const dataSource = data.get('dataSource');
		const symbol = data.get('symbol');

		if (typeof dataSource !== 'string' || !dataSource.trim()) {
			return fail(400, { action: 'delete', error: 'Data source is required.' });
		}

		if (typeof symbol !== 'string' || !symbol.trim()) {
			return fail(400, { action: 'delete', error: 'Symbol is required.' });
		}

		const res = await fetch(`${API_URL}/api/v1/watchlist/${dataSource}/${symbol}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (!res.ok) {
			return fail(res.status, { action: 'delete', error: 'Unable to delete watchlist item.' });
		}

		redirect(303, '/home/watchlist');
	}
};
