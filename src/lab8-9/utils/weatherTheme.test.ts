// Тесты утилит темы: проверяют выбор темы по погоде и подписи AQI.
import { describe, expect, it } from "vitest"
import type { ForecastListItem } from "../types"
import { getAqiLabel, getThemeForForecastItem } from "./weatherTheme"

function makeItem(conditionId: number, icon: string, windSpeed: number): ForecastListItem {
  return {
    dt: 0,
    main: {
      temp: 10,
      temp_min: 8,
      temp_max: 12,
      feels_like: 10,
      humidity: 50,
      pressure: 760,
    },
    weather: [
      {
        id: conditionId,
        main: "Clear",
        description: "test",
        icon,
      },
    ],
    wind: { speed: windSpeed },
    clouds: { all: 0 },
  }
}

describe("getAqiLabel", () => {
  it("возвращает корректную подпись для AQI=1", () => {
    expect(getAqiLabel(1).label).toBe("Хорошо")
  })

  it("возвращает корректную подпись для AQI=3", () => {
    expect(getAqiLabel(3).label).toBe("Умеренно")
  })
})

describe("getThemeForForecastItem", () => {
  it("clear day -> kind=clear, isNight=false", () => {
    const theme = getThemeForForecastItem(makeItem(800, "01d", 1))
    expect(theme.kind).toBe("clear")
    expect(theme.isNight).toBe(false)
  })

  it("clear night -> kind=nightClear, isNight=true", () => {
    const theme = getThemeForForecastItem(makeItem(800, "01n", 1))
    expect(theme.kind).toBe("nightClear")
    expect(theme.isNight).toBe(true)
  })

  it("rain -> kind=rain", () => {
    const theme = getThemeForForecastItem(makeItem(501, "10d", 2))
    expect(theme.kind).toBe("rain")
  })

  it("strong wind -> kind=wind", () => {
    const theme = getThemeForForecastItem(makeItem(800, "01d", 12))
    expect(theme.kind).toBe("wind")
    expect(theme.isNight).toBe(true)
  })
})

