// Обёртки над OpenWeather API: геокодинг города, прогноз 5 дней/3 часа и загрязнение воздуха.
import type {
  AirPollutionResponse,
  FiveDayForecastResponse,
  GeocodeResult,
  ForecastListItem,
  WeatherCondition,
} from "../types"

const GEO_API = "https://api.openweathermap.org/geo/1.0/direct"
const FORECAST_API = "https://api.openweathermap.org/data/2.5/forecast"
const AIR_POLLUTION_API = "https://api.openweathermap.org/data/2.5/air_pollution"

function requestWithTimeout<T>(
  url: string,
  timeoutMs: number,
  signal?: AbortSignal,
): Promise<T> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  const combinedSignal = signal
    ? ((): AbortSignal => {
        // If caller provided a signal, we "race" it with our timeout.
        const anyController = new AbortController()
        const onAbort = () => anyController.abort()
        if (signal.aborted) {
          anyController.abort()
        } else {
          signal.addEventListener("abort", onAbort, { once: true })
          controller.signal.addEventListener("abort", onAbort, { once: true })
        }
        return anyController.signal
      })()
    : controller.signal

  return fetch(url, { signal: combinedSignal })
    .then(async (res) => {
      if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(
          `OpenWeather error: ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`,
        )
      }
      return (res.json() as Promise<T>)
    })
    .finally(() => clearTimeout(timeoutId))
}

function buildUrl(baseUrl: string, params: Record<string, string | number | undefined>) {
  const url = new URL(baseUrl)
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined) continue
    url.searchParams.set(k, String(v))
  }
  return url.toString()
}

export async function geocodeCity(
  apiKey: string,
  city: string,
  signal?: AbortSignal,
): Promise<GeocodeResult | null> {
  const url = buildUrl(GEO_API, {
    q: city,
    limit: 1,
    appid: apiKey,
    lang: "ru",
  })

  const timeoutMs = 10_000
  const data = await requestWithTimeout<Array<any>>(url, timeoutMs, signal)
  const first = data?.[0]
  if (!first) return null

  const result: GeocodeResult = {
    name: String(first.name ?? city),
    lat: Number(first.lat),
    lon: Number(first.lon),
  }
  if (first.country) {
    result.country = String(first.country)
  }
  return result
}

export async function fetchForecast(
  apiKey: string,
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<FiveDayForecastResponse> {
  const url = buildUrl(FORECAST_API, {
    lat,
    lon,
    appid: apiKey,
    units: "metric",
    lang: "ru",
    cnt: 40, // 40 * 3 hours ~= 5 days
  })

  const timeoutMs = 12_000
  const raw = await requestWithTimeout<any>(url, timeoutMs, signal)

  const list: ForecastListItem[] = Array.isArray(raw?.list)
    ? (raw.list as any[]).map((item) => {
        const weather: WeatherCondition[] = Array.isArray(item.weather)
          ? item.weather.map((w: any) => ({
              id: Number(w.id),
              main: String(w.main ?? ""),
              description: String(w.description ?? ""),
              icon: String(w.icon ?? ""),
            }))
          : []

        return {
          dt: Number(item.dt),
          main: {
            temp: Number(item.main?.temp),
            temp_min: Number(item.main?.temp_min),
            temp_max: Number(item.main?.temp_max),
            feels_like: Number(item.main?.feels_like),
            humidity: Number(item.main?.humidity),
            pressure: Number(item.main?.pressure),
          },
          weather,
          wind: { speed: Number(item.wind?.speed ?? 0) },
          clouds: { all: Number(item.clouds?.all ?? 0) },
        }
      })
    : []

  return {
    city: {
      name: String(raw?.city?.name ?? ""),
      ...(raw?.city?.country ? { country: String(raw.city.country) } : {}),
    },
    list,
  }
}

export async function fetchAirPollution(
  apiKey: string,
  lat: number,
  lon: number,
  signal?: AbortSignal,
): Promise<AirPollutionResponse> {
  const url = buildUrl(AIR_POLLUTION_API, {
    lat,
    lon,
    appid: apiKey,
  })

  const timeoutMs = 10_000
  const raw = await requestWithTimeout<any>(url, timeoutMs, signal)

  const list: any[] = Array.isArray(raw?.list) ? raw.list : []
  const parsed = list.map((item) => ({
    main: {
      aqi: Number(item?.main?.aqi ?? 0),
    },
    components: item?.components ?? {},
    dt: Number(item?.dt ?? 0),
  }))

  return {
    coord: { lat: Number(raw?.coord?.lat ?? lat), lon: Number(raw?.coord?.lon ?? lon) },
    list: parsed,
  }
}

