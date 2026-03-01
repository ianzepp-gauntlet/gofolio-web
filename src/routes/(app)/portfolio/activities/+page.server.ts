import { env } from '$env/dynamic/private';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { ActivitiesResponse } from '$lib/types/api';

const API_URL = env.GOFOLIO_API_URL ?? 'http://localhost:3333';

export const load: PageServerLoad = async ({ locals, parent, url }) => {
	const token = locals.token!;
	const { user } = await parent();
	const range = user.settings.dateRange ?? 'max';
	const page = Math.max(1, Number(url.searchParams.get('page') ?? 1));
	const take = Math.max(1, Number(url.searchParams.get('take') ?? 25));
	const sortColumn = url.searchParams.get('sortColumn') ?? 'date';
	const sortDirection = url.searchParams.get('sortDirection') === 'asc' ? 'asc' : 'desc';
	const query = url.searchParams.get('query')?.trim() ?? '';
	const accounts = url.searchParams.get('accounts')?.trim() ?? '';

	const params = new URLSearchParams({
		range,
		skip: String((page - 1) * take),
		take: String(take),
		sortColumn,
		sortDirection
	});

	if (query) {
		params.set('query', query);
	}

	if (accounts) {
		params.set('accounts', accounts);
	}

	try {
		const res = await fetch(`${API_URL}/api/v1/order?${params.toString()}`, {
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (!res.ok) {
			return {
				activities: [],
				totalItems: 0,
				page,
				take,
				sortColumn,
				sortDirection,
				query,
				accounts
			};
		}

		const data: ActivitiesResponse = await res.json();
		return {
			activities: data.activities ?? [],
			totalItems: data.count ?? 0,
			page,
			take,
			sortColumn,
			sortDirection,
			query,
			accounts
		};
	} catch {
		return {
			activities: [],
			totalItems: 0,
			page,
			take,
			sortColumn,
			sortDirection,
			query,
			accounts
		};
	}
};

export const actions: Actions = {
	createActivity: async ({ request, locals, url }) => {
		const token = locals.token;
		if (!token) {
			return fail(401, { action: 'createActivity', error: 'Not authenticated.' });
		}

		const data = await request.formData();
		const date = data.get('date');
		const type = data.get('type');
		const symbol = data.get('symbol');
		const dataSource = data.get('dataSource');
		const currency = data.get('currency');
		const quantity = Number(data.get('quantity') ?? 0);
		const unitPrice = Number(data.get('unitPrice') ?? 0);
		const fee = Number(data.get('fee') ?? 0);
		const accountId = data.get('accountId');
		const comment = data.get('comment');

		if (
			typeof date !== 'string' ||
			typeof type !== 'string' ||
			typeof symbol !== 'string' ||
			typeof dataSource !== 'string' ||
			typeof currency !== 'string'
		) {
			return fail(400, { action: 'createActivity', error: 'Missing required fields.' });
		}

		const payload = {
			accountId: typeof accountId === 'string' && accountId ? accountId : undefined,
			comment: typeof comment === 'string' && comment ? comment : undefined,
			currency,
			dataSource,
			date: new Date(date).toISOString(),
			fee,
			quantity,
			symbol: symbol.toUpperCase(),
			type,
			unitPrice
		};

		const res = await fetch(`${API_URL}/api/v1/order`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify(payload)
		});

		if (!res.ok) {
			return fail(res.status, { action: 'createActivity', error: 'Unable to create activity.' });
		}

		const query = url.searchParams.toString();
		redirect(303, `/portfolio/activities${query ? `?${query}` : ''}`);
	},
	updateActivity: async ({ request, locals, url }) => {
		const token = locals.token;
		if (!token) {
			return fail(401, { action: 'updateActivity', error: 'Not authenticated.' });
		}

		const data = await request.formData();
		const id = data.get('id');
		const date = data.get('date');
		const type = data.get('type');
		const symbol = data.get('symbol');
		const dataSource = data.get('dataSource');
		const currency = data.get('currency');
		const quantity = Number(data.get('quantity') ?? 0);
		const unitPrice = Number(data.get('unitPrice') ?? 0);
		const fee = Number(data.get('fee') ?? 0);
		const accountId = data.get('accountId');
		const comment = data.get('comment');

		if (
			typeof id !== 'string' ||
			typeof date !== 'string' ||
			typeof type !== 'string' ||
			typeof symbol !== 'string' ||
			typeof dataSource !== 'string' ||
			typeof currency !== 'string'
		) {
			return fail(400, { action: 'updateActivity', error: 'Missing required fields.' });
		}

		const payload = {
			id,
			accountId: typeof accountId === 'string' && accountId ? accountId : undefined,
			comment: typeof comment === 'string' && comment ? comment : undefined,
			currency,
			dataSource,
			date: new Date(date).toISOString(),
			fee,
			quantity,
			symbol: symbol.toUpperCase(),
			type,
			unitPrice
		};

		const res = await fetch(`${API_URL}/api/v1/order/${id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify(payload)
		});

		if (!res.ok) {
			return fail(res.status, { action: 'updateActivity', error: 'Unable to update activity.' });
		}

		const query = url.searchParams.toString();
		redirect(303, `/portfolio/activities${query ? `?${query}` : ''}`);
	},
	deleteActivity: async ({ request, locals, url }) => {
		const token = locals.token;
		if (!token) {
			return fail(401, { action: 'deleteActivity', error: 'Not authenticated.' });
		}

		const data = await request.formData();
		const activityId = data.get('activityId');
		if (typeof activityId !== 'string' || !activityId.trim()) {
			return fail(400, { action: 'deleteActivity', error: 'Activity id is required.' });
		}

		const res = await fetch(`${API_URL}/api/v1/order/${activityId}`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (!res.ok) {
			return fail(res.status, { action: 'deleteActivity', error: 'Unable to delete activity.' });
		}

		const query = url.searchParams.toString();
		redirect(303, `/portfolio/activities${query ? `?${query}` : ''}`);
	},
	bulkDelete: async ({ request, locals, url }) => {
		const token = locals.token;
		if (!token) {
			return fail(401, { action: 'bulkDelete', error: 'Not authenticated.' });
		}

		const data = await request.formData();
		const ids = (data.get('activityIds') as string | null)?.split(',').filter(Boolean) ?? [];
		if (ids.length === 0) {
			return fail(400, { action: 'bulkDelete', error: 'No activities selected.' });
		}

		const errors: string[] = [];
		for (const id of ids) {
			const res = await fetch(`${API_URL}/api/v1/order/${id}`, {
				method: 'DELETE',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${token}`
				}
			});
			if (!res.ok) {
				errors.push(id);
			}
		}

		if (errors.length > 0) {
			return fail(500, {
				action: 'bulkDelete',
				error: `Failed to delete ${errors.length} of ${ids.length} activities.`
			});
		}

		const query = url.searchParams.toString();
		redirect(303, `/portfolio/activities${query ? `?${query}` : ''}`);
	}
};
