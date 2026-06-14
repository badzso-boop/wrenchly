interface DailyForecast {
  date: string
  tempMin: number
  tempMax: number
  precipitationMm: number
}

interface WeatherTriggerConfig {
  condition: 'temp_above' | 'frost_warning' | 'no_rain_48h' | 'last_frost_passed'
  value?: number
  days?: number
}

export class WeatherService {
  async getDailyForecast(lat: number, lon: number, days = 14): Promise<DailyForecast[]> {
    const url = new URL('https://api.open-meteo.com/v1/forecast')
    url.searchParams.set('latitude', lat.toString())
    url.searchParams.set('longitude', lon.toString())
    url.searchParams.set('daily', 'temperature_2m_max,temperature_2m_min,precipitation_sum')
    url.searchParams.set('forecast_days', days.toString())
    url.searchParams.set('timezone', 'auto')

    const res = await fetch(url.toString(), { next: { revalidate: 21600 } })
    if (!res.ok) throw new Error(`Open-Meteo error: ${res.status}`)
    const data = (await res.json()) as {
      daily: {
        time: string[]
        temperature_2m_min: number[]
        temperature_2m_max: number[]
        precipitation_sum: number[]
      }
    }

    return data.daily.time.map((date, i) => ({
      date,
      tempMin: data.daily.temperature_2m_min[i] ?? 0,
      tempMax: data.daily.temperature_2m_max[i] ?? 0,
      precipitationMm: data.daily.precipitation_sum[i] ?? 0,
    }))
  }

  evaluateCondition(
    config: WeatherTriggerConfig,
    forecast: DailyForecast[]
  ): { triggered: boolean; reason: string } {
    switch (config.condition) {
      case 'temp_above': {
        const window = forecast.slice(0, config.days ?? 7)
        const threshold = config.value ?? 15
        const allAbove = window.every((d) => d.tempMin > threshold)
        return {
          triggered: allAbove,
          reason: `Min temp above ${threshold}°C for ${config.days ?? 7} days`,
        }
      }
      case 'frost_warning': {
        const next2 = forecast.slice(0, 2)
        const frostExpected = next2.some((d) => d.tempMin < 2)
        return { triggered: frostExpected, reason: 'Frost expected in next 48h' }
      }
      case 'no_rain_48h': {
        const last2 = forecast.slice(0, 2)
        const noRain = last2.every((d) => d.precipitationMm < 1)
        return { triggered: noRain, reason: 'No rain in last 48h' }
      }
      case 'last_frost_passed': {
        const noFrostAhead = forecast.every((d) => d.tempMin > 2)
        return { triggered: noFrostAhead, reason: 'Last frost has passed' }
      }
      default:
        return { triggered: false, reason: 'Unknown condition' }
    }
  }
}
