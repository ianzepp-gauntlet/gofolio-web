import { env } from '$env/dynamic/private';
import type { PageServerLoad } from './$types';
import type { BenchmarkResponse, MarketDataOfMarketsResponse } from '$lib/types/api';

const API_URL = env.GOFOLIO_API_URL ?? 'http://localhost:3333';

export const load: PageServerLoad = async ({ locals, parent }) => {
	const token = locals.token!;
	const parentData = await parent();
	const hasFearAndGreedPermission =
		parentData.info?.globalPermissions?.includes('enableFearAndGreedIndex') ?? false;
	const fearAndGreedDays = 365;

	try {
		const headers = {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${token}`
		};
		const benchmarksPromise = fetch(`${API_URL}/api/v1/benchmarks`, {
			headers
		});

		const fearAndGreedPromise = hasFearAndGreedPermission
			? fetch(`${API_URL}/api/v1/market-data/markets?includeHistoricalData=${fearAndGreedDays}`, {
					headers
				})
			: Promise.resolve(null);

		const [benchmarksRes, fearAndGreedRes] = await Promise.all([benchmarksPromise, fearAndGreedPromise]);

		if (!benchmarksRes.ok) {
			return {
				benchmarks: [],
				hasFearAndGreedPermission,
				fearAndGreedDays,
				fearAndGreed: null
			};
		}

		const benchmarksData: BenchmarkResponse = await benchmarksRes.json();
		let fearAndGreed: MarketDataOfMarketsResponse['fearAndGreedIndex'] | null = null;

		if (fearAndGreedRes?.ok) {
			const fearAndGreedData: MarketDataOfMarketsResponse = await fearAndGreedRes.json();
			fearAndGreed = fearAndGreedData.fearAndGreedIndex ?? null;
		}

		return {
			benchmarks: benchmarksData.benchmarks,
			hasFearAndGreedPermission,
			fearAndGreedDays,
			fearAndGreed
		};
	} catch {
		return {
			benchmarks: [],
			hasFearAndGreedPermission,
			fearAndGreedDays,
			fearAndGreed: null
		};
	}
};
