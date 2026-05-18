// Главный UI лабораторной: выбор города, прогноз (почасовой/на дни), автообновление и виджет AQI.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { fetchAirPollution, fetchForecast, geocodeCity } from './services/openWeather';
import type {
	AirPollutionResponse,
	ForecastListItem,
	GeocodeResult,
	FiveDayForecastResponse,
} from './types';
import {
	getAqiLabel,
	getThemeForForecastItem,
	getWeatherIconUrl,
	type Theme,
} from './utils/weatherTheme';

type CoordsState = {
	coords: { lat: number; lon: number };
	label: string;
};

const DEFAULT_CITY = 'Moscow';
const THREE_HOURS_MS = 3 * 60 * 60 * 1000;

function formatTimeHHMM(unixSeconds: number) {
	const d = new Date(unixSeconds * 1000);
	const hh = String(d.getHours()).padStart(2, '0');
	const mm = String(d.getMinutes()).padStart(2, '0');
	return `${hh}:${mm}`;
}

function pressureHpaToMmHg(hpa: number) {
	// OpenWeather returns pressure in hPa.
	return Math.round(hpa * 0.75006);
}

function formatWeekdayRu(d: Date) {
	const days = [
		'Воскресенье',
		'Понедельник',
		'Вторник',
		'Среда',
		'Четверг',
		'Пятница',
		'Суббота',
	];
	return days[d.getDay()];
}

function dayKeyLocal(d: Date) {
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

function getClosestForecastIndex(items: ForecastListItem[], targetSeconds: number) {
	if (items.length === 0) return 0;
	let bestIdx = 0;
	let bestDiff = Number.POSITIVE_INFINITY;
	for (let i = 0; i < items.length; i++) {
		const it = items[i];
		if (!it) continue;
		const diff = Math.abs(it.dt - targetSeconds);
		if (diff < bestDiff) {
			bestDiff = diff;
			bestIdx = i;
		}
	}
	return bestIdx;
}

type DaySummary = {
	key: string;
	date: Date;
	minTemp: number;
	maxTemp: number;
	icon: string;
	weatherMain: string;
};

function buildDaySummaries(
	forecast: FiveDayForecastResponse | null | undefined,
): DaySummary[] {
	const items = forecast?.list ?? [];
	if (items.length === 0) return [];

	const map = new Map<string, { date: Date; items: ForecastListItem[] }>();

	for (const it of items) {
		const d = new Date(it.dt * 1000);
		const key = dayKeyLocal(d);
		const prev = map.get(key);
		if (!prev) map.set(key, { date: d, items: [it] });
		else prev.items.push(it);
	}

	const keys = Array.from(map.keys()).sort((a, b) => Date.parse(a) - Date.parse(b));
	const summaries: DaySummary[] = keys.map((key) => {
		const bucket = map.get(key)!;
		if (bucket.items.length === 0) {
			return {
				key,
				date: bucket.date,
				minTemp: 0,
				maxTemp: 0,
				icon: '01d',
				weatherMain: '',
			};
		}
		const tempsMin = bucket.items.map((x) => x.main.temp_min);
		const tempsMax = bucket.items.map((x) => x.main.temp_max);
		const minTemp = Math.min(...tempsMin);
		const maxTemp = Math.max(...tempsMax);

		// Pick icon from the item with the highest temp_max
		let representative = bucket.items[0]!;
		for (const curr of bucket.items) {
			if (curr.main.temp_max > representative.main.temp_max) representative = curr;
		}

		const w = representative.weather[0];
		return {
			key,
			date: bucket.date,
			minTemp,
			maxTemp,
			icon: w?.icon ?? '01d',
			weatherMain: w?.main ?? '',
		};
	});

	// Show "several" days: today + next 4
	return summaries.slice(0, 5);
}

function WeatherIcon({
	iconCode,
	alt,
	size = 44,
}: {
	iconCode: string;
	alt: string;
	size?: number;
}) {
	return (
		<img
			src={getWeatherIconUrl(iconCode)}
			alt={alt}
			width={size}
			height={size}
			style={{
				display: 'block',
				filter: 'drop-shadow(0 4px 10px rgba(0,0,0,0.25))',
			}}
		/>
	);
}

function CitySelector({
	value,
	onChange,
	onSubmit,
	loading,
	error,
	placeholder,
}: {
	value: string;
	placeholder: string;
	onChange: (v: string) => void;
	onSubmit: () => void;
	loading: boolean;
	error: string | null;
}) {
	return (
		<section style={{ width: '100%', maxWidth: 420, margin: '0 auto 18px' }}>
			<div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
				<input
					value={value}
					placeholder={placeholder}
					onChange={(e) => onChange(e.target.value)}
					style={{
						flex: 1,
						padding: '12px 14px',
						borderRadius: 12,
						border: '1px solid rgba(255,255,255,0.28)',
						outline: 'none',
						background: 'rgba(255,255,255,0.14)',
						color: '#fff',
						fontSize: 16,
					}}
				/>
				<button
					onClick={onSubmit}
					disabled={loading}
					style={{
						padding: '12px 16px',
						borderRadius: 12,
						border: 'none',
						background: loading
							? 'rgba(255,255,255,0.35)'
							: 'rgba(255,255,255,0.18)',
						color: '#fff',
						cursor: loading ? 'not-allowed' : 'pointer',
						fontWeight: 700,
					}}
				>
					{loading ? '...' : 'Показать'}
				</button>
			</div>
			{error && (
				<p style={{ margin: '10px 0 0', color: 'rgba(255,255,255,0.9)' }}>
					{error}
				</p>
			)}
		</section>
	);
}

function ForecastPanel({
	theme,
	cityLabel,
	nowItem,
	hourlyItems,
	daySummaries,
}: {
	theme: Theme;
	cityLabel: string;
	nowItem: ForecastListItem | null;
	hourlyItems: ForecastListItem[];
	daySummaries: DaySummary[];
}) {
	const nowDate = nowItem ? new Date(nowItem.dt * 1000) : null;

	return (
		<section style={{ width: '100%', maxWidth: 420, margin: '0 auto' }}>
			<div
				style={{
					background: theme.cardBackground,
					borderRadius: 20,
					padding: 18,
					border: '1px solid rgba(255,255,255,0.18)',
					boxShadow: '0 18px 40px rgba(0,0,0,0.22)',
					backdropFilter: 'blur(6px)',
				}}
			>
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'flex-start',
						gap: 12,
					}}
				>
					<div>
						<div style={{ fontWeight: 800, fontSize: 18, color: theme.text }}>
							{cityLabel}
						</div>
						<div style={{ marginTop: 6, color: theme.mutedText }}>
							{nowDate
								? `${formatWeekdayRu(nowDate)}, ${nowDate.getDate()}.${nowDate.getMonth() + 1}`
								: ''}
						</div>
					</div>
					{nowItem && (
						<div style={{ textAlign: 'right' }}>
							<div
								style={{
									color: theme.text,
									fontWeight: 900,
									fontSize: 44,
									lineHeight: 1,
								}}
							>
								{Math.round(nowItem.main.temp)}°
							</div>
							<div style={{ marginTop: 8 }}>
								<WeatherIcon
									iconCode={nowItem.weather[0]?.icon ?? '01d'}
									alt="Сейчас"
									size={52}
								/>
							</div>
						</div>
					)}
				</div>

				<div
					style={{
						marginTop: 14,
						display: 'flex',
						gap: 10,
						alignItems: 'center',
					}}
				>
					<div style={{ flex: 1, minWidth: 0 }}>
						<div
							style={{
								color: theme.mutedText,
								fontSize: 14,
								fontWeight: 700,
							}}
						>
							На ближайшие часы
						</div>
						<div style={{ display: 'flex', gap: 12, marginTop: 10 }}>
							{hourlyItems.map((it) => (
								<div
									key={it.dt}
									style={{ width: 72, textAlign: 'center' }}
								>
									<div
										style={{
											color: theme.mutedText,
											fontSize: 13,
											fontWeight: 700,
										}}
									>
										{formatTimeHHMM(it.dt)}
									</div>
									<div style={{ marginTop: 6 }}>
										<WeatherIcon
											iconCode={it.weather[0]?.icon ?? '01d'}
											alt="Погода"
											size={30}
										/>
									</div>
									<div
										style={{
											color: theme.text,
											fontWeight: 900,
											marginTop: 4,
										}}
									>
										{Math.round(it.main.temp)}°
									</div>
								</div>
							))}
						</div>
					</div>
				</div>

				{nowItem && (
					<div
						style={{
							marginTop: 16,
							display: 'grid',
							gridTemplateColumns: '1fr 1fr',
							gap: 10,
						}}
					>
						<Metric
							label="Влажность"
							value={`${nowItem.main.humidity}%`}
							theme={theme}
						/>
						<Metric
							label="Ветер"
							value={`${Math.round(nowItem.wind.speed)} м/с`}
							theme={theme}
						/>
						<Metric
							label="Давление"
							value={`${pressureHpaToMmHg(nowItem.main.pressure)} мм рт.ст.`}
							theme={theme}
						/>
						<Metric
							label="Облачность"
							value={`${nowItem.clouds.all}%`}
							theme={theme}
						/>
					</div>
				)}

				<div
					style={{
						marginTop: 16,
						borderTop: '1px solid rgba(255,255,255,0.18)',
						paddingTop: 14,
					}}
				>
					<div style={{ color: theme.text, fontWeight: 900, marginBottom: 12 }}>
						Прогноз на дни
					</div>
					<div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
						{daySummaries.map((d) => (
							<div
								key={d.key}
								style={{
									display: 'flex',
									justifyContent: 'space-between',
									alignItems: 'center',
									background: 'rgba(255,255,255,0.10)',
									border: '1px solid rgba(255,255,255,0.12)',
									borderRadius: 14,
									padding: '10px 12px',
								}}
							>
								<div style={{ color: theme.text, fontWeight: 900 }}>
									{formatWeekdayRu(d.date)}, {d.date.getDate()}.
									{d.date.getMonth() + 1}
								</div>
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: 10,
									}}
								>
									<WeatherIcon iconCode={d.icon} alt="День" size={34} />
									<div style={{ textAlign: 'right' }}>
										<div
											style={{
												color: theme.mutedText,
												fontSize: 13,
												fontWeight: 700,
											}}
										>
											min {Math.round(d.minTemp)}°
										</div>
										<div
											style={{ color: theme.text, fontWeight: 900 }}
										>
											{Math.round(d.maxTemp)}°
										</div>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}

function Metric({ label, value, theme }: { label: string; value: string; theme: Theme }) {
	return (
		<div
			style={{
				background: 'rgba(255,255,255,0.08)',
				borderRadius: 14,
				padding: '10px 12px',
			}}
		>
			<div style={{ color: theme.mutedText, fontWeight: 700, fontSize: 13 }}>
				{label}
			</div>
			<div style={{ color: theme.text, fontWeight: 900, marginTop: 6 }}>
				{value}
			</div>
		</div>
	);
}

function AirPollutionWidget({
	theme,
	air,
}: {
	theme: Theme;
	air: AirPollutionResponse | null;
}) {
	const first = air?.list?.[0] ?? null;
	const aqi = first?.main?.aqi ?? 0;
	const aqiUi = getAqiLabel(aqi);

	const components = first?.components ?? {};
	const componentOrder: Array<{ key: keyof typeof components; label: string }> = [
		{ key: 'pm2_5' as any, label: 'PM2.5' },
		{ key: 'pm10' as any, label: 'PM10' },
		{ key: 'no2' as any, label: 'NO2' },
		{ key: 'o3' as any, label: 'O3' },
	];

	const shown = componentOrder
		.map((c) => {
			const v = (components as any)?.[c.key];
			if (typeof v !== 'number') return null;
			return { label: c.label, value: v };
		})
		.filter(Boolean) as Array<{ label: string; value: number }>;

	return (
		<section style={{ width: '100%', maxWidth: 420, margin: '18px auto 0' }}>
			<div
				style={{
					background: theme.cardBackground,
					borderRadius: 20,
					padding: 16,
					border: '1px solid rgba(255,255,255,0.18)',
					boxShadow: '0 18px 40px rgba(0,0,0,0.22)',
					backdropFilter: 'blur(6px)',
				}}
			>
				<div
					style={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						gap: 12,
					}}
				>
					<div>
						<div style={{ color: theme.text, fontWeight: 900, fontSize: 18 }}>
							Загрязнение воздуха
						</div>
						<div
							style={{
								marginTop: 6,
								color: theme.mutedText,
								fontWeight: 700,
							}}
						>
							AQI: {aqi} - {aqiUi.label}
						</div>
					</div>
					<div
						style={{
							color: theme.accent,
							fontWeight: 900,
							fontSize: 46,
							lineHeight: 1,
						}}
					>
						{aqi}
					</div>
				</div>

				<div style={{ marginTop: 14 }}>
					{shown.length === 0 ? (
						<div style={{ color: theme.mutedText, fontWeight: 700 }}>
							Поля загрязнения недоступны
						</div>
					) : (
						<div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
							{shown.map((x) => (
								<div
									key={x.label}
									style={{
										background: 'rgba(255,255,255,0.10)',
										border: '1px solid rgba(255,255,255,0.12)',
										borderRadius: 14,
										padding: '10px 12px',
									}}
								>
									<div
										style={{
											color: theme.mutedText,
											fontWeight: 800,
											fontSize: 12,
										}}
									>
										{x.label}
									</div>
									<div
										style={{
											color: theme.text,
											fontWeight: 900,
											marginTop: 6,
										}}
									>
										{x.value}
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</section>
	);
}

export default function Lab8_9() {
	const [apiKey] = useState<string>(() => {
		const meta = document.querySelector('meta[name="openweather-api-key"]');
		const value = meta?.getAttribute('content')?.trim();
		if (!value || value.startsWith('%VITE_')) return '';
		return value;
	});

	const refreshMs = useMemo(() => {
		const meta = document.querySelector('meta[name="weather-refresh-ms"]');
		const raw = meta?.getAttribute('content')?.trim();
		const parsed = raw ? Number(raw) : NaN;
		return Number.isFinite(parsed) && parsed > 0 ? parsed : THREE_HOURS_MS;
	}, []);

	const [cityInput, setCityInput] = useState(DEFAULT_CITY);
	const [coords, setCoords] = useState<CoordsState | null>(null);
	const [loadingGeo, setLoadingGeo] = useState(false);
	const [errorGeo, setErrorGeo] = useState<string | null>(null);

	const [forecast, setForecast] = useState<FiveDayForecastResponse | null>(null);
	const [air, setAir] = useState<AirPollutionResponse | null>(null);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const loadAllRef = useRef<(() => Promise<void>) | null>(null);
	const intervalIdRef = useRef<number | null>(null);

	const theme = useMemo(() => {
		const nowItem = (() => {
			const items = forecast?.list ?? [];
			if (!items.length) return null;
			const idx = getClosestForecastIndex(items, Date.now() / 1000);
			return items[idx] ?? null;
		})();
		return getThemeForForecastItem(nowItem);
	}, [forecast]);

	const derived = useMemo(() => {
		const items = forecast?.list ?? [];
		const nowIdx = getClosestForecastIndex(items, Date.now() / 1000);
		const nowItem = items[nowIdx] ?? null;
		const hourlyItems = nowItem ? items.slice(nowIdx, nowIdx + 4) : [];
		const daySummaries = buildDaySummaries(forecast);
		return { nowItem, hourlyItems, daySummaries };
	}, [forecast]);

	async function handlePickCity() {
		setErrorGeo(null);
		setLoadingGeo(true);
		try {
			if (!apiKey) throw new Error('API key не задан. Проверьте `.env.local`');

			const controller = new AbortController();
			const geo = await geocodeCity(apiKey, cityInput.trim(), controller.signal);
			if (!geo) {
				setErrorGeo('Город не найден. Попробуйте другое название.');
				return;
			}
			setCoords({
				coords: { lat: geo.lat, lon: geo.lon },
				label: `${geo.name}${geo.country ? ', ' + geo.country : ''}`,
			});
			setForecast(null);
			setAir(null);
		} catch (e) {
			setErrorGeo(e instanceof Error ? e.message : 'Ошибка геокодинга');
		} finally {
			setLoadingGeo(false);
		}
	}

	useEffect(() => {
		// Initial load: try default city
		void (async () => {
			setCoords({ coords: { lat: 55.7558, lon: 37.6173 }, label: DEFAULT_CITY });
		})();
	}, []);

	useEffect(() => {
		if (!coords) return;
		if (!apiKey) return;

		let cancelled = false;

		const loadAll = async () => {
			if (cancelled) return;
			try {
				setError(null);
				setLoading(true);
				const controller = new AbortController();
				const [f, a] = await Promise.all([
					fetchForecast(
						apiKey,
						coords.coords.lat,
						coords.coords.lon,
						controller.signal,
					),
					fetchAirPollution(
						apiKey,
						coords.coords.lat,
						coords.coords.lon,
						controller.signal,
					),
				]);
				if (cancelled) return;
				setForecast(f);
				setAir(a);
			} catch (e) {
				if (cancelled) return;
				setError(e instanceof Error ? e.message : 'Ошибка загрузки прогноза');
			} finally {
				if (!cancelled) setLoading(false);
			}
		};

		loadAllRef.current = loadAll;

		// First run
		void loadAll();

		if (intervalIdRef.current) window.clearInterval(intervalIdRef.current);
		intervalIdRef.current = window.setInterval(() => {
			void (async () => {
				// Silent refresh: don't destroy UI, just update.
				try {
					const controller = new AbortController();
					const [f, a] = await Promise.all([
						fetchForecast(
							apiKey,
							coords.coords.lat,
							coords.coords.lon,
							controller.signal,
						),
						fetchAirPollution(
							apiKey,
							coords.coords.lat,
							coords.coords.lon,
							controller.signal,
						),
					]);
					if (!cancelled) {
						setForecast(f);
						setAir(a);
					}
				} catch {
					// Ignore silent refresh errors.
				}
			})();
		}, refreshMs);

		return () => {
			cancelled = true;
			if (intervalIdRef.current) window.clearInterval(intervalIdRef.current);
			intervalIdRef.current = null;
		};
	}, [apiKey, coords, refreshMs]);

	return (
		<div
			style={{
				minHeight: '100vh',
				background: theme.background,
				transition: 'background 400ms ease',
			}}
		>
			<CitySelector
				value={cityInput}
				placeholder="Введите город, например Moscow"
				onChange={setCityInput}
				onSubmit={() => void handlePickCity()}
				loading={loadingGeo}
				error={errorGeo}
			/>

			<div style={{ color: theme.text, textAlign: 'center', padding: '0 16px' }}>
				{!coords && (
					<p style={{ color: theme.mutedText, fontWeight: 700 }}>
						Выберите город
					</p>
				)}
				{loading && (
					<p
						style={{
							color: theme.mutedText,
							fontWeight: 700,
							margin: '8px 0 0',
						}}
					>
						Загрузка прогноза...
					</p>
				)}
				{error && (
					<p style={{ color: '#ffb3b3', fontWeight: 800, margin: '8px 0 0' }}>
						{error}
					</p>
				)}
				<button
					onClick={() => void loadAllRef.current?.()}
					disabled={!apiKey || loading}
					style={{
						marginTop: 10,
						padding: '10px 14px',
						borderRadius: 12,
						border: '1px solid rgba(255,255,255,0.24)',
						background: 'rgba(255,255,255,0.12)',
						color: '#fff',
						cursor: !apiKey || loading ? 'not-allowed' : 'pointer',
						fontWeight: 900,
					}}
				>
					Обновить сейчас
				</button>
			</div>

			<div style={{ marginTop: 16 }}>
				<ForecastPanel
					theme={theme}
					cityLabel={coords?.label ?? DEFAULT_CITY}
					nowItem={derived.nowItem}
					hourlyItems={derived.hourlyItems}
					daySummaries={derived.daySummaries}
				/>
			</div>

			<AirPollutionWidget theme={theme} air={air} />

			{!apiKey && (
				<section
					style={{
						maxWidth: 520,
						margin: '18px auto',
						padding: '0 16px',
						color: '#fff',
					}}
				>
					<div
						style={{
							background: 'rgba(255,255,255,0.12)',
							border: '1px solid rgba(255,255,255,0.18)',
							borderRadius: 16,
							padding: 14,
						}}
					>
						<div style={{ fontWeight: 900, fontSize: 18 }}>
							Нужен API ключ OpenWeather
						</div>
						<div
							style={{
								marginTop: 8,
								color: 'rgba(255,255,255,0.9)',
								fontWeight: 700,
							}}
						>
							Добавьте `VITE_OPENWEATHER_API_KEY` в `.env.local`.
						</div>
					</div>
				</section>
			)}
		</div>
	);
}
