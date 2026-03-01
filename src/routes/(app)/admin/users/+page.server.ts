import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { AdminUserItem } from '$lib/types/api';

const API_URL = env.GOFOLIO_API_URL ?? 'http://localhost:3333';

export const load: PageServerLoad = async ({ locals, url }) => {
	const token = locals.token!;
	const skip = url.searchParams.get('skip') ?? '0';
	const take = url.searchParams.get('take') ?? '50';

	try {
		const res = await fetch(`${API_URL}/api/v1/admin/user?skip=${skip}&take=${take}`, {
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (!res.ok) return { users: [], skip: +skip, take: +take };

		const users: AdminUserItem[] = await res.json();
		return { users, skip: +skip, take: +take };
	} catch {
		return { users: [], skip: +skip, take: +take };
	}
};

export const actions: Actions = {
	deleteUser: async ({ request, locals }) => {
		const token = locals.token;
		if (!token) return fail(401, { error: 'Not authenticated.' });

		const fd = await request.formData();
		const userId = fd.get('userId') as string;
		if (!userId) return fail(400, { error: 'User ID is required.' });

		const res = await fetch(`${API_URL}/api/v1/admin/user/${userId}`, {
			method: 'DELETE',
			headers: { Authorization: `Bearer ${token}` }
		});

		if (!res.ok) return fail(res.status, { error: 'Failed to delete user.' });
		return { success: true };
	},
	generateToken: async ({ request, locals }) => {
		const token = locals.token;
		if (!token) return fail(401, { error: 'Not authenticated.' });

		const fd = await request.formData();
		const userId = fd.get('userId') as string;
		if (!userId) return fail(400, { error: 'User ID is required.' });

		const res = await fetch(`${API_URL}/api/v1/admin/user/${userId}/access-token`, {
			method: 'PUT',
			headers: { Authorization: `Bearer ${token}` }
		});

		if (!res.ok) return fail(res.status, { error: 'Failed to generate token.' });

		const result = await res.json();
		return { success: true, accessToken: result.accessToken };
	}
};
