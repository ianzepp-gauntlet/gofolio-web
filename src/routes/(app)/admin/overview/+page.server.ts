import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { AdminData } from '$lib/types/api';

const API_URL = env.GOFOLIO_API_URL ?? 'http://localhost:3333';

export const load: PageServerLoad = async ({ locals }) => {
	const token = locals.token!;

	try {
		const res = await fetch(`${API_URL}/api/v1/admin`, {
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (!res.ok) {
			return { admin: null };
		}

		const admin: AdminData = await res.json();
		return { admin };
	} catch {
		return { admin: null };
	}
};

export const actions: Actions = {
	putSetting: async ({ request, locals }) => {
		const token = locals.token;
		if (!token) return fail(401, { error: 'Not authenticated.' });

		const data = await request.formData();
		const key = data.get('key') as string;
		const value = data.get('value') as string;

		if (!key) return fail(400, { error: 'Setting key is required.' });

		const res = await fetch(`${API_URL}/api/v1/admin/settings/${key}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({ value })
		});

		if (!res.ok) return fail(res.status, { error: 'Failed to update setting.' });
		return { success: true };
	},
	flushCache: async ({ locals }) => {
		const token = locals.token;
		if (!token) return fail(401, { error: 'Not authenticated.' });

		const res = await fetch(`${API_URL}/api/v1/cache/flush`, {
			headers: { Authorization: `Bearer ${token}` }
		});

		if (!res.ok) return fail(res.status, { error: 'Failed to flush cache.' });
		return { success: true };
	},
	gather: async ({ locals }) => {
		const token = locals.token;
		if (!token) return fail(401, { error: 'Not authenticated.' });

		const res = await fetch(`${API_URL}/api/v1/admin/gather`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${token}` }
		});

		if (!res.ok) return fail(res.status, { error: 'Failed to trigger data gathering.' });
		return { success: true };
	}
};
