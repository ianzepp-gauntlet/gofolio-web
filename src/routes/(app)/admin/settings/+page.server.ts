import { env } from '$env/dynamic/private';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { AdminData, PlatformItem, TagItem } from '$lib/types/api';

const API_URL = env.GOFOLIO_API_URL ?? 'http://localhost:3333';

export const load: PageServerLoad = async ({ locals }) => {
	const token = locals.token!;
	const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

	const [adminRes, platformsRes, tagsRes] = await Promise.all([
		fetch(`${API_URL}/api/v1/admin`, { headers }).catch(() => null),
		fetch(`${API_URL}/api/v1/platform`, { headers }).catch(() => null),
		fetch(`${API_URL}/api/v1/tag`, { headers }).catch(() => null)
	]);

	const admin: AdminData | null = adminRes?.ok ? await adminRes.json() : null;
	const platforms: PlatformItem[] = platformsRes?.ok ? await platformsRes.json() : [];
	const tags: TagItem[] = tagsRes?.ok ? await tagsRes.json() : [];

	return { admin, platforms, tags };
};

export const actions: Actions = {
	createPlatform: async ({ request, locals }) => {
		const token = locals.token;
		if (!token) return fail(401, { error: 'Not authenticated.' });

		const fd = await request.formData();
		const name = fd.get('name') as string;
		const url = fd.get('url') as string;

		if (!name?.trim()) return fail(400, { error: 'Platform name is required.' });

		const res = await fetch(`${API_URL}/api/v1/platform`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
			body: JSON.stringify({ name: name.trim(), url: url?.trim() || null })
		});

		if (!res.ok) return fail(res.status, { error: 'Failed to create platform.' });
		redirect(303, '/admin/settings');
	},
	deletePlatform: async ({ request, locals }) => {
		const token = locals.token;
		if (!token) return fail(401, { error: 'Not authenticated.' });

		const fd = await request.formData();
		const id = fd.get('id') as string;
		if (!id) return fail(400, { error: 'Platform ID is required.' });

		const res = await fetch(`${API_URL}/api/v1/platform/${id}`, {
			method: 'DELETE',
			headers: { Authorization: `Bearer ${token}` }
		});

		if (!res.ok) return fail(res.status, { error: 'Failed to delete platform.' });
		redirect(303, '/admin/settings');
	},
	createTag: async ({ request, locals }) => {
		const token = locals.token;
		if (!token) return fail(401, { error: 'Not authenticated.' });

		const fd = await request.formData();
		const name = fd.get('name') as string;
		if (!name?.trim()) return fail(400, { error: 'Tag name is required.' });

		const res = await fetch(`${API_URL}/api/v1/tag`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
			body: JSON.stringify({ name: name.trim() })
		});

		if (!res.ok) return fail(res.status, { error: 'Failed to create tag.' });
		redirect(303, '/admin/settings');
	},
	deleteTag: async ({ request, locals }) => {
		const token = locals.token;
		if (!token) return fail(401, { error: 'Not authenticated.' });

		const fd = await request.formData();
		const id = fd.get('id') as string;
		if (!id) return fail(400, { error: 'Tag ID is required.' });

		const res = await fetch(`${API_URL}/api/v1/tag/${id}`, {
			method: 'DELETE',
			headers: { Authorization: `Bearer ${token}` }
		});

		if (!res.ok) return fail(res.status, { error: 'Failed to delete tag.' });
		redirect(303, '/admin/settings');
	}
};
