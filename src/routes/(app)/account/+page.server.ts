import { env } from '$env/dynamic/private';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const API_URL = env.GOFOLIO_API_URL ?? 'http://localhost:3333';

export const load: PageServerLoad = async ({ parent }) => {
	const { user, info } = await parent();
	return { user, info };
};

export const actions: Actions = {
	updateSettings: async ({ request, locals }) => {
		const token = locals.token;
		if (!token) return fail(401, { action: 'updateSettings', error: 'Not authenticated.' });

		const data = await request.formData();
		const baseCurrency = data.get('baseCurrency') as string;
		const locale = data.get('locale') as string;
		const dateRange = data.get('dateRange') as string;
		const colorScheme = data.get('colorScheme') as string;
		const viewMode = data.get('viewMode') as string;
		const isRestrictedView = data.get('isRestrictedView') === 'on';

		const payload = {
			baseCurrency,
			locale,
			dateRange,
			colorScheme,
			viewMode,
			isRestrictedView
		};

		const res = await fetch(`${API_URL}/api/v1/user/setting`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify(payload)
		});

		if (!res.ok) {
			return fail(res.status, { action: 'updateSettings', error: 'Unable to update user settings.' });
		}

		redirect(303, '/account');
	},
	deleteAccount: async ({ request, locals }) => {
		const token = locals.token;
		if (!token) return fail(401, { action: 'deleteAccount', error: 'Not authenticated.' });

		const data = await request.formData();
		const securityToken = data.get('securityToken') as string;
		if (!securityToken) return fail(400, { action: 'deleteAccount', error: 'Security token is required.' });

		const res = await fetch(`${API_URL}/api/v1/user`, {
			method: 'DELETE',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
				'X-Security-Token': securityToken
			}
		});

		if (!res.ok) {
			return fail(res.status, { action: 'deleteAccount', error: 'Failed to delete account. Check your security token.' });
		}

		redirect(303, '/auth');
	}
};
