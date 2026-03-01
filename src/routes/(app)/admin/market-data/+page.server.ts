import { env } from '$env/dynamic/private';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { AdminMarketDataResponse } from '$lib/types/api';

const API_URL = env.GOFOLIO_API_URL ?? 'http://localhost:3333';

export const load: PageServerLoad = async ({ locals, url }) => {
	const token = locals.token!;
	const skip = url.searchParams.get('skip') ?? '0';
	const take = url.searchParams.get('take') ?? '50';
	const assetSubClass = url.searchParams.get('assetSubClass') ?? '';

	try {
		const params = new URLSearchParams({ skip, take });
		if (assetSubClass) params.set('filters', JSON.stringify([{ id: assetSubClass, type: 'ASSET_SUB_CLASS' }]));

		const res = await fetch(`${API_URL}/api/v1/admin/market-data?${params}`, {
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (!res.ok) return { marketData: [], count: 0, skip: +skip, take: +take, assetSubClass };

		const data: AdminMarketDataResponse = await res.json();
		return {
			marketData: data.marketData,
			count: data.count,
			skip: +skip,
			take: +take,
			assetSubClass
		};
	} catch {
		return { marketData: [], count: 0, skip: +skip, take: +take, assetSubClass };
	}
};

export const actions: Actions = {
	createProfile: async ({ request, locals }) => {
		const token = locals.token;
		if (!token) return fail(401, { error: 'Not authenticated.' });

		const fd = await request.formData();
		const dataSource = fd.get('dataSource') as string;
		const symbol = fd.get('symbol') as string;

		if (!dataSource || !symbol) return fail(400, { error: 'Data source and symbol are required.' });

		const res = await fetch(`${API_URL}/api/v1/admin/profile-data/${dataSource}/${symbol}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (!res.ok) return fail(res.status, { error: 'Failed to create asset profile.' });
		redirect(303, '/admin/market-data');
	},
	deleteProfile: async ({ request, locals }) => {
		const token = locals.token;
		if (!token) return fail(401, { error: 'Not authenticated.' });

		const fd = await request.formData();
		const dataSource = fd.get('dataSource') as string;
		const symbol = fd.get('symbol') as string;

		if (!dataSource || !symbol) return fail(400, { error: 'Data source and symbol are required.' });

		const res = await fetch(`${API_URL}/api/v1/admin/profile-data/${dataSource}/${symbol}`, {
			method: 'DELETE',
			headers: { Authorization: `Bearer ${token}` }
		});

		if (!res.ok) return fail(res.status, { error: 'Failed to delete asset profile.' });
		redirect(303, '/admin/market-data');
	},
	gatherRecent: async ({ locals }) => {
		const token = locals.token;
		if (!token) return fail(401, { error: 'Not authenticated.' });

		const res = await fetch(`${API_URL}/api/v1/admin/gather`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${token}` }
		});

		if (!res.ok) return fail(res.status, { error: 'Failed to gather data.' });
		return { success: true };
	},
	gatherMax: async ({ locals }) => {
		const token = locals.token;
		if (!token) return fail(401, { error: 'Not authenticated.' });

		const res = await fetch(`${API_URL}/api/v1/admin/gather/max`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${token}` }
		});

		if (!res.ok) return fail(res.status, { error: 'Failed to gather all data.' });
		return { success: true };
	},
	gatherProfileData: async ({ locals }) => {
		const token = locals.token;
		if (!token) return fail(401, { error: 'Not authenticated.' });

		const res = await fetch(`${API_URL}/api/v1/admin/gather/profile-data`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${token}` }
		});

		if (!res.ok) return fail(res.status, { error: 'Failed to gather profile data.' });
		return { success: true };
	}
};
