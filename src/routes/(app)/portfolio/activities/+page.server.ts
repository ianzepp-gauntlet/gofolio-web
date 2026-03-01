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

	const params = new URLSearchParams({
		range,
		skip: String((page - 1) * take),
		take: String(take),
		sortColumn,
		sortDirection
	});

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
				sortDirection
			};
		}

		const data: ActivitiesResponse = await res.json();
		return {
			activities: data.activities ?? [],
			totalItems: data.count ?? 0,
			page,
			take,
			sortColumn,
			sortDirection
		};
	} catch {
		return {
			activities: [],
			totalItems: 0,
			page,
			take,
			sortColumn,
			sortDirection
		};
	}
};

export const actions: Actions = {
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
	}
};
