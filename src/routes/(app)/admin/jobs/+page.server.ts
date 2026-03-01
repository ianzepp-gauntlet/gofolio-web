import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import type { AdminJob } from '$lib/types/api';

const API_URL = env.GOFOLIO_API_URL ?? 'http://localhost:3333';

export const load: PageServerLoad = async ({ locals, url }) => {
	const token = locals.token!;
	const status = url.searchParams.get('status') ?? '';

	try {
		const query = status ? `?status=${status}` : '';
		const res = await fetch(`${API_URL}/api/v1/admin/queue/job${query}`, {
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (!res.ok) return { jobs: [], status };

		const jobs: AdminJob[] = await res.json();
		return { jobs, status };
	} catch {
		return { jobs: [], status };
	}
};

export const actions: Actions = {
	deleteJob: async ({ request, locals }) => {
		const token = locals.token;
		if (!token) return fail(401, { error: 'Not authenticated.' });

		const data = await request.formData();
		const jobId = data.get('jobId') as string;
		if (!jobId) return fail(400, { error: 'Job ID is required.' });

		const res = await fetch(`${API_URL}/api/v1/admin/queue/job/${jobId}`, {
			method: 'DELETE',
			headers: { Authorization: `Bearer ${token}` }
		});

		if (!res.ok) return fail(res.status, { error: 'Failed to delete job.' });
		return { success: true };
	},
	executeJob: async ({ request, locals }) => {
		const token = locals.token;
		if (!token) return fail(401, { error: 'Not authenticated.' });

		const data = await request.formData();
		const jobId = data.get('jobId') as string;
		if (!jobId) return fail(400, { error: 'Job ID is required.' });

		const res = await fetch(`${API_URL}/api/v1/admin/queue/job/${jobId}/execute`, {
			headers: { Authorization: `Bearer ${token}` }
		});

		if (!res.ok) return fail(res.status, { error: 'Failed to execute job.' });
		return { success: true };
	},
	deleteAll: async ({ request, locals }) => {
		const token = locals.token;
		if (!token) return fail(401, { error: 'Not authenticated.' });

		const data = await request.formData();
		const status = data.get('status') as string;
		const query = status ? `?status=${status}` : '';

		const res = await fetch(`${API_URL}/api/v1/admin/queue/job${query}`, {
			method: 'DELETE',
			headers: { Authorization: `Bearer ${token}` }
		});

		if (!res.ok) return fail(res.status, { error: 'Failed to delete jobs.' });
		return { success: true };
	}
};
