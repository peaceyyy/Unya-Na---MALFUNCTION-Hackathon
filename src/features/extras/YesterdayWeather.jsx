import React, { useState, useEffect, useCallback } from 'react';

const DEFAULT_COORDS = {
  lat: 10.3157,
  lon: 123.8854,
  city: 'Cebu City',
};

const FALLBACK_WEATHER = {
  city: 'Cebu City',
  temp: 31,
  high: 33,
  low: 26,
  feelsLike: 35,
  rainChance: 20,
  precipMm: 0.4,
  weatherCode: 2,
  dateIso: null,
};

function getYesterdayDate() {
  return new Date(Date.now() - 86400000);
}

function formatYesterdayLabel(dateIso) {
  const date = dateIso ? new Date(`${dateIso}T12:00:00`) : getYesterdayDate();
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

function classifyWeather(code) {
  if (code >= 95) {
    return {
      kind: 'storm',
      label: 'Thunderstorms',
    };
  }
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return {
      kind: 'rain',
      label: code >= 80 ? 'Passing showers' : 'Rain',
    };
  }
  if (code >= 51 && code <= 57) {
    return {
      kind: 'rain',
      label: 'Light drizzle',
    };
  }
  if (code === 3 || code === 45 || code === 48) {
    return {
      kind: 'cloudy',
      label: code === 3 ? 'Overcast' : 'Misty',
    };
  }
  if (code === 0 || code === 1) {
    return {
      kind: 'clear',
      label: code === 0 ? 'Clear sky' : 'Mostly sunny',
    };
  }
  return {
    kind: 'partly-cloudy',
    label: 'Partly cloudy',
  };
}

function WeatherGraphic({ kind }) {
  if (kind === 'clear') {
    return (
      <svg viewBox="0 0 64 56" fill="none" aria-hidden="true" className="w-12 shrink-0 text-accent">
        <g stroke="#B7791F" strokeWidth="2.4" strokeLinecap="round">
          <line x1="32" y1="6" x2="32" y2="12" />
          <line x1="32" y1="44" x2="32" y2="50" />
          <line x1="10" y1="28" x2="16" y2="28" />
          <line x1="48" y1="28" x2="54" y2="28" />
          <line x1="16.5" y1="12.5" x2="20.7" y2="16.7" />
          <line x1="43.3" y1="39.3" x2="47.5" y2="43.5" />
          <line x1="47.5" y1="12.5" x2="43.3" y2="16.7" />
          <line x1="20.7" y1="39.3" x2="16.5" y2="43.5" />
        </g>
        <circle cx="32" cy="28" r="12" fill="#FBBF24" />
        <circle cx="32" cy="28" r="9" fill="#FDE047" />
      </svg>
    );
  }

  if (kind === 'cloudy') {
    return (
      <svg viewBox="0 0 68 56" fill="none" aria-hidden="true" className="w-12 shrink-0 text-accent">
        <path
          d="M42 21C42 16.582 45.582 13 50 13C53.92 13 57.18 15.82 57.86 19.55C61.15 20.05 63.68 22.88 63.68 26.32C63.68 30.1 60.62 33.16 56.84 33.16H41.4C37.94 33.16 35.14 30.36 35.14 26.9C35.14 23.8 37.4 21.23 40.36 20.73"
          fill="currentColor"
          opacity="0.25"
        />
        <path
          d="M15 44H47C51.97 44 56 39.97 56 35C56 30.34 52.46 26.51 47.92 26.05C46.4 20.2 41.09 15.88 34.76 15.88C27.63 15.88 21.8 21.4 21.3 28.4C20.88 28.3 20.43 28.25 19.98 28.25C15.02 28.25 11 32.27 11 37.23C11 40.97 13.03 44 16.77 44H15Z"
          fill="currentColor"
        />
      </svg>
    );
  }

  if (kind === 'rain' || kind === 'storm') {
    return (
      <svg viewBox="0 0 68 56" fill="none" aria-hidden="true" className="w-12 shrink-0 text-accent">
        <path
          d="M16 36H48C52.418 36 56 32.418 56 28C56 23.86 52.854 20.454 48.822 20.042C47.47 14.844 42.748 11 37.125 11C30.786 11 25.6 15.906 25.156 22.13C24.778 22.044 24.384 22 23.98 22C19.573 22 16 25.573 16 29.98C16 33.304 18.696 36 22.02 36H16Z"
          fill="currentColor"
        />
        {kind === 'storm' ? (
          <path
            d="M35 37L29.5 46H34.5L32.5 53L40.5 43H35.5L38 37H35Z"
            fill="#B7791F"
          />
        ) : (
          <g stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
            <line x1="25" y1="41" x2="22" y2="49" />
            <line x1="35" y1="41" x2="32" y2="49" />
            <line x1="45" y1="41" x2="42" y2="49" />
          </g>
        )}
      </svg>
    );
  }

  // Default: partly-cloudy (sun peeking behind clouds)
  return (
    <svg viewBox="0 0 68 56" fill="none" aria-hidden="true" className="w-12 shrink-0 text-accent">
      <g stroke="#B7791F" strokeWidth="2.2" strokeLinecap="round">
        <line x1="26" y1="4" x2="26" y2="8.5" />
        <line x1="12.5" y1="9.5" x2="15.5" y2="12.5" />
        <line x1="39.5" y1="9.5" x2="36.5" y2="12.5" />
        <line x1="7" y1="22" x2="11.5" y2="22" />
      </g>
      <circle cx="26" cy="22" r="10.5" fill="#FBBF24" />
      <circle cx="26" cy="22" r="8" fill="#FDE047" />
      <path
        d="M44 26C44 22.134 47.134 19 51 19C54.44 19 57.3 21.48 57.89 24.75C60.78 25.19 63 27.68 63 30.7C63 34.01 60.31 36.7 57 36.7H43.5C40.46 36.7 38 34.24 38 31.2C38 28.48 39.98 26.22 42.58 25.78"
        fill="currentColor"
        opacity="0.25"
      />
      <path
        d="M21 47H49C53.418 47 57 43.418 57 39C57 34.86 53.854 31.454 49.822 31.042C48.47 25.844 43.748 22 38.125 22C31.786 22 26.6 26.906 26.156 33.13C25.778 33.044 25.384 33 24.98 33C20.573 33 17 36.573 17 40.98C17 44.304 19.696 47 23.02 47H21Z"
        fill="currentColor"
      />
    </svg>
  );
}

async function fetchYesterdayWeather(lat, lon, fallbackCity) {
  const yesterdayKey = getYesterdayDate().toISOString().slice(0, 10);
  const cacheKey = `unya_yesterday_weather:${yesterdayKey}:${lat.toFixed(2)},${lon.toFixed(2)}`;

  try {
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch {
    // Ignore sessionStorage errors
  }

  const weatherUrl =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&past_days=1&forecast_days=1` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,apparent_temperature_max,precipitation_probability_max,precipitation_sum` +
    `&timezone=auto`;

  const geoUrl =
    `https://api.bigdatacloud.net/data/reverse-geocode-client` +
    `?latitude=${lat}&longitude=${lon}&localityLanguage=en`;

  const [weatherRes, geoData] = await Promise.all([
    fetch(weatherUrl),
    fetch(geoUrl)
      .then((res) => (res.ok ? res.json() : null))
      .catch(() => null),
  ]);

  if (!weatherRes.ok) {
    throw new Error('Weather API request failed');
  }

  const data = await weatherRes.json();
  const daily = data?.daily;
  if (!daily || !Array.isArray(daily.time) || daily.time.length === 0) {
    throw new Error('Incomplete weather response');
  }

  const high = Math.round(daily.temperature_2m_max?.[0] ?? FALLBACK_WEATHER.high);
  const low = Math.round(daily.temperature_2m_min?.[0] ?? FALLBACK_WEATHER.low);
  const feelsLike = Math.round(daily.apparent_temperature_max?.[0] ?? high);
  const rainChance = Math.round(daily.precipitation_probability_max?.[0] ?? 0);
  const precipMm = Number((daily.precipitation_sum?.[0] ?? 0).toFixed(1));
  const weatherCode = daily.weather_code?.[0] ?? 2;
  const dateIso = daily.time[0];

  const resolvedCity =
    geoData?.city ||
    geoData?.locality ||
    geoData?.principalSubdivision ||
    fallbackCity ||
    'Near You';

  const result = {
    city: resolvedCity,
    temp: Math.round((high + low) / 2),
    high,
    low,
    feelsLike,
    rainChance,
    precipMm,
    weatherCode,
    dateIso,
  };

  try {
    sessionStorage.setItem(cacheKey, JSON.stringify(result));
  } catch {
    // Ignore storage quota errors
  }

  return result;
}

export default function YesterdayWeather() {
  const [weather, setWeather] = useState(FALLBACK_WEATHER);
  const [status, setStatus] = useState('idle'); // 'idle' | 'locating' | 'live' | 'denied' | 'offline'

  const loadForCoords = useCallback(async (lat, lon, fallbackCity, nextStatus = 'live') => {
    try {
      const liveData = await fetchYesterdayWeather(lat, lon, fallbackCity);
      setWeather(liveData);
      setStatus(nextStatus);
    } catch {
      setStatus('offline');
    }
  }, []);

  const requestLocation = useCallback(() => {
    if (!('geolocation' in navigator)) {
      loadForCoords(DEFAULT_COORDS.lat, DEFAULT_COORDS.lon, DEFAULT_COORDS.city, 'denied');
      return;
    }

    setStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        loadForCoords(pos.coords.latitude, pos.coords.longitude, 'Near You', 'live');
      },
      () => {
        loadForCoords(DEFAULT_COORDS.lat, DEFAULT_COORDS.lon, DEFAULT_COORDS.city, 'denied');
      },
      { timeout: 6000, maximumAge: 600000 }
    );
  }, [loadForCoords]);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  const visual = classifyWeather(weather.weatherCode);
  const yesterdayLabel = formatYesterdayLabel(weather.dateIso);

  return (
    <section
      aria-label="Yesterday's Weather"
      className="shrink-0 space-y-4 rounded-xl border border-border bg-surface p-4 text-ink sm:p-5"
    >
      <header className="space-y-1">
        <p className="text-xs font-medium text-ink-muted">Yesterday · {yesterdayLabel}</p>
        <h2 className="text-xl font-semibold leading-tight tracking-tight [overflow-wrap:anywhere]">
          {weather.city}
        </h2>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex items-center gap-2.5">
          <WeatherGraphic kind={visual.kind} />
          <p className="text-sm font-medium text-ink-secondary">{visual.label}</p>
        </div>
        <div className="text-right">
          <p className="text-3xl font-semibold leading-none tracking-tight tnum">{weather.temp}°</p>
          <p className="mt-1 text-xs text-ink-secondary tnum">High {weather.high}° · Low {weather.low}°</p>
        </div>
      </div>

      <dl className="grid grid-cols-3 gap-2 border-t border-border pt-3 tnum">
        <div>
          <dt className="text-xs text-ink-muted">Feels like</dt>
          <dd className="mt-0.5 text-sm font-semibold">{weather.feelsLike}°</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">Rain chance</dt>
          <dd className="mt-0.5 text-sm font-semibold">{weather.rainChance}%</dd>
        </div>
        <div>
          <dt className="text-xs text-ink-muted">Precipitation</dt>
          <dd className="mt-0.5 text-sm font-semibold">{weather.precipMm} mm</dd>
        </div>
      </dl>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <button
          type="button"
          onClick={requestLocation}
          disabled={status === 'locating'}
          className="inline-flex min-h-8 items-center gap-1.5 rounded-md border border-border px-2.5 py-1 text-xs font-medium text-ink hover:border-border-strong hover:bg-surface-subtle disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent motion-safe:transition-colors"
        >
          <svg className="size-3.5 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M19 10c0 5-7 10-7 10S5 15 5 10a7 7 0 0 1 14 0Z" />
            <circle cx="12" cy="10" r="2" />
          </svg>
          {status === 'locating' ? 'Locating…' : 'Use my location'}
        </button>
        <p className="text-xs text-ink-muted" aria-live="polite">
          {status === 'denied' && 'Using default location'}
          {status === 'offline' && 'Live weather unavailable'}
        </p>
      </div>
    </section>
  );
}
