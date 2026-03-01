import { env } from '$env/dynamic/private';
import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const API_URL = env.GOFOLIO_API_URL ?? 'http://localhost:3333';

export const load: PageServerLoad = async ({ parent }) => {
	const { user, info } = await parent();
	return { user, info };
};

export const actions: Actions = {
	redeemCoupon: async ({ request, locals }) => {
		const token = locals.token;
		if (!token) return fail(401, { error: 'Not authenticated.' });

		const fd = await request.formData();
		const couponCode = fd.get('couponCode') as string;
		if (!couponCode?.trim()) return fail(400, { error: 'Coupon code is required.' });

		const res = await fetch(`${API_URL}/api/v1/subscription/redeem-coupon`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`
			},
			body: JSON.stringify({ couponCode: couponCode.trim() })
		});

		if (!res.ok) return fail(res.status, { error: 'Failed to redeem coupon.' });
		return { success: true };
	}
};
