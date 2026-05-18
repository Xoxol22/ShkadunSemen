// Общие TypeScript-типы ответов OpenWeather (прогноз, геокодинг, загрязнение воздуха).
export type WeatherCondition = {
	id: number;
	main: string;
	description: string;
	icon: string;
};

export type ForecastMain = {
	temp: number;
	temp_min: number;
	temp_max: number;
	feels_like: number;
	humidity: number;
	pressure: number;
};

export type ForecastWind = {
	speed: number;
};

export type ForecastClouds = {
	all: number;
};

export type ForecastListItem = {
	dt: number; // unix seconds
	main: ForecastMain;
	weather: WeatherCondition[];
	wind: ForecastWind;
	clouds: ForecastClouds;
};

export type FiveDayForecastResponse = {
	city: {
		name: string;
		country?: string;
	};
	list: ForecastListItem[];
};

export type GeocodeResult = {
	name: string;
	country?: string;
	lat: number;
	lon: number;
};

export type AirPollutionListItem = {
	main: {
		aqi: number;
	};
	components: Partial<Record<AirPollutantKey, number>>;
	dt: number;
};

export type AirPollutionResponse = {
	coord: { lat: number; lon: number };
	list: AirPollutionListItem[];
};

export type AirPollutantKey =
	| 'co'
	| 'no'
	| 'no2'
	| 'o3'
	| 'so2'
	| 'pm2_5'
	| 'pm10'
	| 'nh3';
