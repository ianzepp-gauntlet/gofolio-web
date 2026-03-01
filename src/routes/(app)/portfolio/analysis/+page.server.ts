import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';
import type { InvestmentItem, DividendItem } from '$lib/types/api';

const API_URL = env.GOFOLIO_API_URL ?? 'http://localhost:3333';

export const load: PageServerLoad = async ({ locals, parent, url }) => {
	const token = locals.token!;
	const { user } = await parent();
	const range = user.settings.dateRange ?? 'max';
	const groupBy = url.searchParams.get('groupBy') === 'year' ? 'year' : 'month';
	const headers = {
		'Content-Type': 'application/json',
		Authorization: `Bearer ${token}`
	};

	const [investmentsRes, dividendsRes] = await Promise.all([
		fetch(`${API_URL}/api/v1/portfolio/investments?range=${range}&groupBy=${groupBy}`, { headers }).catch(() => null),
		fetch(`${API_URL}/api/v1/portfolio/dividends?range=${range}&groupBy=${groupBy}`, { headers }).catch(() => null)
	]);

	const investments: InvestmentItem[] = investmentsRes?.ok ? await investmentsRes.json() : [];
	const dividends: DividendItem[] = dividendsRes?.ok ? await dividendsRes.json() : [];

	return { investments, dividends, groupBy };
};
