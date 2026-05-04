// Выбор темы/градиента под погоду и утилиты (иконки OpenWeather, подписи AQI).
import type { ForecastListItem } from "../types"

export type ThemeKind =
  | "clear"
  | "nightClear"
  | "rain"
  | "storm"
  | "snow"
  | "fog"
  | "cloudy"
  | "wind"

export type Theme = {
  kind: ThemeKind
  background: string
  cardBackground: string
  text: string
  mutedText: string
  accent: string
  isNight: boolean
}

function isNightByIcon(icon: string | undefined) {
  return typeof icon === "string" && icon.toLowerCase().endsWith("n")
}

function classifyWeather(conditionId: number, main: string) {
  if (conditionId >= 200 && conditionId < 233) return "storm" as const
  if (conditionId >= 500 && conditionId < 532) return "rain" as const
  if (conditionId >= 300 && conditionId < 322) return "rain" as const
  if (conditionId >= 600 && conditionId < 623) return "snow" as const
  if (conditionId >= 701 && conditionId < 782) return "fog" as const
  if (conditionId === 800) return "clear" as const
  if (conditionId >= 801 && conditionId <= 804) return "cloudy" as const
  if (/thunder/i.test(main)) return "storm" as const
  if (/rain/i.test(main)) return "rain" as const
  if (/snow/i.test(main)) return "snow" as const
  if (/fog/i.test(main)) return "fog" as const
  return "cloudy" as const
}

export function getThemeForForecastItem(item: ForecastListItem | null): Theme {
  const conditionId = item?.weather?.[0]?.id
  const main = item?.weather?.[0]?.main ?? ""
  const icon = item?.weather?.[0]?.icon
  const windSpeed = item?.wind?.speed ?? 0

  const night = isNightByIcon(icon)

  // Strong wind background even if "clear" etc.
  if (windSpeed >= 12 && (conditionId === undefined || conditionId < 300 || conditionId === 800)) {
    return {
      kind: "wind",
      background: "linear-gradient(180deg, #0b1f44 0%, #102a5b 45%, #0a1634 100%)",
      cardBackground: "rgba(15, 25, 55, 0.72)",
      text: "#eaf2ff",
      mutedText: "rgba(234, 242, 255, 0.75)",
      accent: "#70b7ff",
      isNight: true,
    }
  }

  const classified = conditionId !== undefined ? classifyWeather(conditionId, main) : "cloudy"

  const dayTheme: Record<ThemeKind, Theme> = {
    clear: {
      kind: "clear",
      background: "linear-gradient(180deg, #5db7ff 0%, #3f7cff 55%, #2f5fe8 100%)",
      cardBackground: "rgba(80, 145, 255, 0.65)",
      text: "#eaffff",
      mutedText: "rgba(234, 255, 255, 0.72)",
      accent: "#ffe066",
      isNight: false,
    },
    rain: {
      kind: "rain",
      background: "linear-gradient(180deg, #2a4bb8 0%, #1f3d7a 50%, #152952 100%)",
      cardBackground: "rgba(41, 74, 179, 0.48)",
      text: "#eef6ff",
      mutedText: "rgba(238, 246, 255, 0.72)",
      accent: "#8bd7ff",
      isNight: false,
    },
    storm: {
      kind: "storm",
      background: "linear-gradient(180deg, #1a2b4f 0%, #0f1b37 50%, #070d1f 100%)",
      cardBackground: "rgba(16, 28, 62, 0.62)",
      text: "#f1f5ff",
      mutedText: "rgba(241, 245, 255, 0.72)",
      accent: "#9a7dff",
      isNight: true,
    },
    snow: {
      kind: "snow",
      background: "linear-gradient(180deg, #bfe7ff 0%, #7fc8ff 55%, #4da9ff 100%)",
      cardBackground: "rgba(185, 240, 255, 0.55)",
      text: "#05243a",
      mutedText: "rgba(5, 36, 58, 0.7)",
      accent: "#ffffff",
      isNight: false,
    },
    fog: {
      kind: "fog",
      background: "linear-gradient(180deg, #c7d0dd 0%, #aab6c6 55%, #6f7c90 100%)",
      cardBackground: "rgba(185, 196, 214, 0.5)",
      text: "#0c1d2c",
      mutedText: "rgba(12, 29, 44, 0.7)",
      accent: "#3b82f6",
      isNight: false,
    },
    cloudy: {
      kind: "cloudy",
      background: "linear-gradient(180deg, #6b7aa5 0%, #424d74 55%, #2e3554 100%)",
      cardBackground: "rgba(78, 90, 142, 0.56)",
      text: "#eaf0ff",
      mutedText: "rgba(234, 240, 255, 0.72)",
      accent: "#b7d1ff",
      isNight: false,
    },
    nightClear: {
      kind: "nightClear",
      background: "linear-gradient(180deg, #0a0f2c 0%, #0b163f 50%, #070a1e 100%)",
      cardBackground: "rgba(12, 18, 45, 0.65)",
      text: "#eaf2ff",
      mutedText: "rgba(234, 242, 255, 0.72)",
      accent: "#ffe066",
      isNight: true,
    },
    wind: {
      kind: "wind",
      background: "linear-gradient(180deg, #0b1f44 0%, #102a5b 45%, #0a1634 100%)",
      cardBackground: "rgba(15, 25, 55, 0.72)",
      text: "#eaf2ff",
      mutedText: "rgba(234, 242, 255, 0.75)",
      accent: "#70b7ff",
      isNight: true,
    },
  }

  if (classified === "clear") {
    return night ? dayTheme.nightClear : dayTheme.clear
  }

  // Night variant: keep same scheme but slightly darker.
  if (night && classified !== "storm") {
    const base = dayTheme[classified] ?? dayTheme.cloudy
    return {
      ...base,
      background: base.background.replace("#5db7ff", "#0a163f"),
      isNight: true,
    }
  }

  return dayTheme[classified] ?? dayTheme.cloudy
}

export function getWeatherIconUrl(iconCode: string) {
  // OpenWeather icon identifier, e.g. "01d", "10n"
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`
}

export function getAqiLabel(aqi: number) {
  const safe = Number.isFinite(aqi) ? aqi : 0
  if (safe <= 1) return { label: "Хорошо", kind: "good" as const }
  if (safe === 2) return { label: "Удовлетворительно", kind: "fair" as const }
  if (safe === 3) return { label: "Умеренно", kind: "moderate" as const }
  if (safe === 4) return { label: "Плохо", kind: "poor" as const }
  return { label: "Очень плохо", kind: "veryPoor" as const }
}

