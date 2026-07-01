export interface WeatherDisplay {
  condition: string;
  icon: string;
}

/** WMO weather code → 한국어 라벨 + 이모지 (Open-Meteo) */
export function weatherCodeToDisplay(code: number): WeatherDisplay {
  if (code === 0) return { condition: '맑음', icon: '☀️' };
  if (code <= 3) return { condition: '구름', icon: '⛅' };
  if (code <= 48) return { condition: '안개', icon: '🌫️' };
  if (code <= 55) return { condition: '이슬비', icon: '🌦️' };
  if (code <= 65) return { condition: '비', icon: '🌧️' };
  if (code <= 77) return { condition: '눈', icon: '❄️' };
  if (code <= 82) return { condition: '소나기', icon: '🌦️' };
  if (code <= 86) return { condition: '눈', icon: '🌨️' };
  return { condition: '천둥번개', icon: '⛈️' };
}
