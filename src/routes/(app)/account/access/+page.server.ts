import { env } from '$env/dynamic/private';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { AccessItem } from '$lib/types/api';

const API_URL = env.GOFOLIO_API_URL ?? 'http://localhost:3333';

export const load: PageServerLoad = async ({ parent, locals }) => {
	const { user, info } = await parent();
	const token = locals.token!;

	try {
		const res = await fetch(`${API_URL}/api/v1/access`, {
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		const accesses: AccessItem[] = res.ok ? await res.json() : [];
		return { user, info, accesses };
	} catch {
		return { user, info, accesses: [] as AccessItem[] };
	}
};

export const actions: Actions = {
	createAccess: async ({ request, locals }) => {
		const token = locals.token;
		if (!token) return fail(401, { error: 'Not authenticated.' });

		const fd = await request.formData();
		const alias = fd.get('alias') as string;
		const type = fd.get('type') as string;
		const granteeUserId = fd.get('granteeUserId') as string;
		const permissions = fd.get('permissions') as string;

		const body: Record<string, unknown> = {
			alias: alias?.trim() || null,
			type
		};
		if (type === 'PRIVATE' && granteeUserId?.trim()) {
			body.granteeUserId = granteeUserId.trim();
		}
		if (permissions) {
			body.permissions = [permissions];
		}

		const res = await fetch(`${API_URL}/api/v1/access`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify(body)
		});

		if (!res.ok) return fail(res.status, { error: 'Failed to create access.' });
		redirect(303, '/account/access');
	},
	deleteAccess: async ({ request, locals }) => {
		const token = locals.token;
		if (!token) return fail(401, { error: 'Not authenticated.' });

		const fd = await request.formData();
		const id = fd.get('id') as string;
		if (!id) return fail(400, { error: 'Access ID is required.' });

		const res = await fetch(`${API_URL}/api/v1/access/${id}`, {
			method: 'DELETE',
			headers: { Authorization: `Bearer ${token}` }
		});

		if (!res.ok) return fail(res.status, { error: 'Failed to delete access.' });
		redirect(303, '/account/access');
	},
	updateAccess: async ({ request, locals }) => {
		const token = locals.token;
		if (!token) return fail(401, { error: 'Not authenticated.' });

		const fd = await request.formData();
		const id = fd.get('id') as string;
		const alias = fd.get('alias') as string;

		if (!id) return fail(400, { error: 'Access ID is required.' });

		const res = await fetch(`${API_URL}/api/v1/access/${id}`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({ alias: alias?.trim() || null })
		});

		if (!res.ok) return fail(res.status, { error: 'Failed to update access.' });
		redirect(303, '/account/access');
	},
	generateToken: async ({ locals }) => {
		const token = locals.token;
		if (!token) return fail(401, { error: 'Not authenticated.' });

		const res = await fetch(`${API_URL}/api/v1/user/access-token`, {
			method: 'POST',
			headers: { Authorization: `Bearer ${token}` }
		});

		if (!res.ok) return fail(res.status, { error: 'Failed to generate token.' });

		const result = await res.json();
		return { accessToken: result.accessToken };
	}
};
