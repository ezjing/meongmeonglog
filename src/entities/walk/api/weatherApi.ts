import type { WalkWeatherPayload } from './walkApi';
import { weatherCodeToDisplay } from '../lib/weatherCode';

export interface WeatherInfo {
  condition: string;
  temp: number;
  icon: string;
}

interface OpenMeteoResponse {
  current?: {
    temperature_2m?: number;
    weather_code?: number;
  };
}

/** 기본 호스트가 응답하지 않는 네트워크가 있어, 같은 현재 날씨를 주는 다른 호스트도 같이 요청한다 */
const WEATHER_ENDPOINTS = [
  'https://api.open-meteo.com/v1/forecast',
  'https://previous-runs-api.open-meteo.com/v1/forecast',
];
const WEATHER_TIMEOUT_MS = 8_000;

async function requestWeather(endpoint: string, params: string): Promise<WeatherInfo> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WEATHER_TIMEOUT_MS);

  try {
    const response = await fetch(`${endpoint}?${params}`, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`weather_fetch_failed: ${response.status}`);
    }

    const data = (await response.json()) as OpenMeteoResponse;
    const temp = data.current?.temperature_2m;
    const code = data.current?.weather_code;
    if (temp == null || code == null) {
      throw new Error('weather_data_missing');
    }

    const { condition, icon } = weatherCodeToDisplay(code);
    return { condition, temp: Math.round(temp), icon };
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchCurrentWeather(
  latitude: number,
  longitude: number,
): Promise<WeatherInfo> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,weather_code',
    timezone: 'auto',
  }).toString();

  try {
    return await Promise.any(WEATHER_ENDPOINTS.map((endpoint) => requestWeather(endpoint, params)));
  } catch {
    throw new Error('weather_fetch_failed');
  }
}

export function toWalkWeatherPayload(weather: WeatherInfo): WalkWeatherPayload {
  return {
    weatherCondition: weather.condition,
    weatherTemp: weather.temp,
    weatherIcon: weather.icon,
  };
}
