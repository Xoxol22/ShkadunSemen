## Лаба 8-9 — Прогноз погоды (OpenWeather)

### Что реализовано

- Прогноз на несколько дней вперёд (OpenWeather 5 day / 3 hour forecast)
- Выбор города по названию (Geocoding API)
- Автообновление каждые 3 часа (можно менять через `VITE_WEATHER_REFRESH_MS`)
- Иконки погоды + фон, зависящий от условий
- Информация о загрязнении воздуха (Air Pollution API)
- Тесты с моками запросов (без реальных запросов в сеть) в `services/openWeather.test.ts`

### Как запустить

1) Установите зависимости:

```bash
npm ci
```

2) Создайте `.env.local` в корне (если нет) и добавьте:

```bash
VITE_OPENWEATHER_API_KEY=ВАШ_КЛЮЧ
VITE_WEATHER_REFRESH_MS=10800000
```

Важно: если вы запускаете Vite с корнем `src/8-9lab` (например `vite src/8-9lab` или `npm run dev:8-9lab`),
то `.env.local` должен лежать именно в `src/8-9lab/.env.local`.

3) Запуск:

```bash
npm run dev:8-9lab
```

### Как запустить тесты

```bash
npm test
```

