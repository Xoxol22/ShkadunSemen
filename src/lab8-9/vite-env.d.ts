// Типы переменных окружения Vite для ключа OpenWeather и интервала обновления.
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_OPENWEATHER_API_KEY?: string
  readonly VITE_WEATHER_REFRESH_MS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

