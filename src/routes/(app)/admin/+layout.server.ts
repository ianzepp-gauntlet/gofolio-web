import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ parent }) => {
	const { user, info } = await parent();

	if (!user.permissions.includes('accessAdminControl')) {
		redirect(302, '/home');
	}

	return { user, info };
};
