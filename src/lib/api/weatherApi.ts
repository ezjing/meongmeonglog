import { weatherCodeToDisplay } from '@/lib/utils/weatherCode';

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

export async function fetchCurrentWeather(
  latitude: number,
  longitude: number,
): Promise<WeatherInfo> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,weather_code',
    timezone: 'auto',
  });

  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${params.toString()}`);

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

  return {
    condition,
    temp: Math.round(temp),
    icon,
  };
}
