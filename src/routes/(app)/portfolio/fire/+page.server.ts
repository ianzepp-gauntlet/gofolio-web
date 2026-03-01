import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const API_URL = env.GOFOLIO_API_URL ?? 'http://localhost:3333';

export const load: PageServerLoad = async ({ parent }) => {
	const { user } = await parent();
	return { user };
};

export const actions: Actions = {
	updateFireSettings: async ({ request, locals }) => {
		const token = locals.token;
		if (!token) return fail(401, { error: 'Not authenticated.' });

		const fd = await request.formData();
		const annualInterestRate = fd.get('annualInterestRate');
		const safeWithdrawalRate = fd.get('safeWithdrawalRate');
		const savingsRate = fd.get('savingsRate');
		const retirementDate = fd.get('retirementDate');
		const projectedTotalAmount = fd.get('projectedTotalAmount');

		const payload: Record<string, unknown> = {};
		if (annualInterestRate) payload.annualInterestRate = +annualInterestRate;
		if (safeWithdrawalRate) payload.safeWithdrawalRate = +safeWithdrawalRate;
		if (savingsRate) payload.savingsRate = +savingsRate;
		if (retirementDate) payload.retirementDate = retirementDate;
		if (projectedTotalAmount) payload.projectedTotalAmount = +projectedTotalAmount;

		const res = await fetch(`${API_URL}/api/v1/user/setting`, {
			method: 'PUT',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify(payload)
		});

		if (!res.ok) return fail(res.status, { error: 'Failed to update FIRE settings.' });
		return { success: true };
	}
};
