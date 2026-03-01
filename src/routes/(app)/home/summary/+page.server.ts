import { env } from '$env/dynamic/private';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions } from './$types';
import type { PageServerLoad } from './$types';
import type { PortfolioDetails } from '$lib/types/api';

const API_URL = env.GOFOLIO_API_URL ?? 'http://localhost:3333';

export const load: PageServerLoad = async ({ locals }) => {
	const token = locals.token!;

	try {
		const res = await fetch(`${API_URL}/api/v1/portfolio/details`, {
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			}
		});

		if (!res.ok) {
			return { summary: null };
		}

		const data: PortfolioDetails = await res.json();
		return { summary: data.summary ?? null };
	} catch {
		return { summary: null };
	}
};

export const actions: Actions = {
	emergencyFund: async ({ request, locals }) => {
		const token = locals.token;
		if (!token) {
			return fail(401, { action: 'emergencyFund', error: 'Not authenticated.' });
		}

		const data = await request.formData();
		const emergencyFundRaw = data.get('emergencyFund');
		const emergencyFund = Number(emergencyFundRaw);

		if (!Number.isFinite(emergencyFund) || emergencyFund < 0) {
			return fail(400, {
				action: 'emergencyFund',
				error: 'Emergency fund amount must be a non-negative number.'
			});
		}

		const res = await fetch(`${API_URL}/api/v1/user/setting`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({ emergencyFund })
		});

		if (!res.ok) {
			return fail(res.status, {
				action: 'emergencyFund',
				error: 'Unable to update emergency fund setting.'
			});
		}

		redirect(303, '/home/summary');
	}
};
