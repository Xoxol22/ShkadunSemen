// Тесты с моками fetch: проверяют парсинг ответов OpenWeather без реальных запросов.
import { describe, expect, it, vi } from 'vitest';
import { fetchAirPollution, fetchForecast, geocodeCity } from './openWeather';

function mockFetchOnce(payload: unknown, ok = true) {
	const json = vi.fn().mockResolvedValue(payload);
	const text = vi.fn().mockResolvedValue(JSON.stringify(payload));
	const res = {
		ok,
		status: ok ? 200 : 500,
		statusText: ok ? 'OK' : 'FAIL',
		json,
		text,
	} as any;
	(globalThis as any).fetch = vi.fn().mockResolvedValue(res);
	return { json, text, res };
}

describe('OpenWeather service (mocks)', () => {
	it('geocodeCity returns first city result', async () => {
		mockFetchOnce([{ name: 'Moscow', country: 'RU', lat: 55.7, lon: 37.6 }]);
		const result = await geocodeCity('KEY', 'Moscow');
		expect(result).toEqual({ name: 'Moscow', country: 'RU', lat: 55.7, lon: 37.6 });
	});

	it('fetchForecast parses list items', async () => {
		mockFetchOnce({
			city: { name: 'Moscow', country: 'RU' },
			list: [
				{
					dt: 123,
					main: {
						temp: 1,
						temp_min: 0,
						temp_max: 2,
						feels_like: 0,
						humidity: 80,
						pressure: 1013,
					},
					weather: [
						{ id: 800, main: 'Clear', description: 'clear sky', icon: '01d' },
					],
					wind: { speed: 3 },
					clouds: { all: 0 },
				},
			],
		});
		const f = await fetchForecast('KEY', 55.7, 37.6);
		expect(f.city.name).toBe('Moscow');
		expect(f.list).toHaveLength(1);
		expect(f.list[0]?.weather[0]?.icon).toBe('01d');
	});

	it('fetchAirPollution parses AQI', async () => {
		mockFetchOnce({
			coord: { lat: 55.7, lon: 37.6 },
			list: [{ main: { aqi: 2 }, components: { pm2_5: 3.1 }, dt: 999 }],
		});
		const a = await fetchAirPollution('KEY', 55.7, 37.6);
		expect(a.list[0]?.main.aqi).toBe(2);
		expect(a.list[0]?.components.pm2_5).toBe(3.1);
	});
});
