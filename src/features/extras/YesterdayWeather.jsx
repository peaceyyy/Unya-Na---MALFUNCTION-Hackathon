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

function classifyWeather(code, highTemp) {
  if (code >= 95) {
    return {
      kind: 'storm',
      label: 'Thunderstorms',
      gradient: 'linear-gradient(135deg, #1E3A8A 0%, #3730A3 55%, #5B21B6 100%)',
      note: 'You probably should not have walked home in that yesterday.',
    };
  }
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) {
    return {
      kind: 'rain',
      label: code >= 80 ? 'Passing Showers' : 'Rainy',
      gradient: 'linear-gradient(135deg, #1D4ED8 0%, #3730A3 60%, #4338CA 100%)',
      note: 'You could have brought an umbrella yesterday. Too late now.',
    };
  }
  if (code >= 51 && code <= 57) {
    return {
      kind: 'rain',
      label: 'Light Drizzle',
      gradient: 'linear-gradient(135deg, #2563EB 0%, #4338CA 100%)',
      note: 'Light drizzle yesterday. Just enough to ruin your shoes.',
    };
  }
  if (code === 3 || code === 45 || code === 48) {
    return {
      kind: 'cloudy',
      label: code === 3 ? 'Overcast' : 'Misty',
      gradient: 'linear-gradient(135deg, #3B5BDB 0%, #4F46E5 100%)',
      note:
        highTemp <= 25
          ? 'Peak bed-weather yesterday. Hope you skipped 7:30 AM class.'
          : 'Great overcast sky yesterday for staring out the window.',
    };
  }
  if (code === 0 || code === 1) {
    return {
      kind: 'clear',
      label: code === 0 ? 'Clear Sky' : 'Mostly Sunny',
      gradient: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 55%, #6366F1 100%)',
      note:
        highTemp >= 34
          ? 'Init kaayo yesterday. A mini fan would have been nice.'
          : 'Great weather yesterday for all the errands you postponed.',
    };
  }
  return {
    kind: 'partly-cloudy',
    label: 'Partly Cloudy',
    gradient: 'linear-gradient(135deg, #2563EB 0%, #3B82F6 58%, #4F46E5 100%)',
    note:
      highTemp >= 34
        ? 'Init kaayo yesterday. You could have stayed indoors anyway.'
        : 'A great day to have worn sunscreen yesterday.',
  };
}

function WeatherGraphic({ kind }) {
  if (kind === 'clear') {
    return (
      <svg width="64" height="56" viewBox="0 0 64 56" fill="none" aria-hidden="true" className="shrink-0">
        <g stroke="#FDE68A" strokeWidth="2.4" strokeLinecap="round">
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
      <svg width="68" height="56" viewBox="0 0 68 56" fill="none" aria-hidden="true" className="shrink-0">
        <path
          d="M42 21C42 16.582 45.582 13 50 13C53.92 13 57.18 15.82 57.86 19.55C61.15 20.05 63.68 22.88 63.68 26.32C63.68 30.1 60.62 33.16 56.84 33.16H41.4C37.94 33.16 35.14 30.36 35.14 26.9C35.14 23.8 37.4 21.23 40.36 20.73"
          fill="#DBEAFE"
          opacity="0.85"
        />
        <path
          d="M15 44H47C51.97 44 56 39.97 56 35C56 30.34 52.46 26.51 47.92 26.05C46.4 20.2 41.09 15.88 34.76 15.88C27.63 15.88 21.8 21.4 21.3 28.4C20.88 28.3 20.43 28.25 19.98 28.25C15.02 28.25 11 32.27 11 37.23C11 40.97 13.03 44 16.77 44H15Z"
          fill="#FFFFFF"
        />
      </svg>
    );
  }

  if (kind === 'rain' || kind === 'storm') {
    return (
      <svg width="68" height="56" viewBox="0 0 68 56" fill="none" aria-hidden="true" className="shrink-0">
        <path
          d="M16 36H48C52.418 36 56 32.418 56 28C56 23.86 52.854 20.454 48.822 20.042C47.47 14.844 42.748 11 37.125 11C30.786 11 25.6 15.906 25.156 22.13C24.778 22.044 24.384 22 23.98 22C19.573 22 16 25.573 16 29.98C16 33.304 18.696 36 22.02 36H16Z"
          fill="#F8FAFC"
        />
        {kind === 'storm' ? (
          <path
            d="M35 37L29.5 46H34.5L32.5 53L40.5 43H35.5L38 37H35Z"
            fill="#FDE047"
          />
        ) : (
          <g stroke="#BAE6FD" strokeWidth="2.4" strokeLinecap="round">
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
    <svg width="68" height="56" viewBox="0 0 68 56" fill="none" aria-hidden="true" className="shrink-0">
      <g stroke="#FDE68A" strokeWidth="2.2" strokeLinecap="round" opacity="0.9">
        <line x1="26" y1="4" x2="26" y2="8.5" />
        <line x1="12.5" y1="9.5" x2="15.5" y2="12.5" />
        <line x1="39.5" y1="9.5" x2="36.5" y2="12.5" />
        <line x1="7" y1="22" x2="11.5" y2="22" />
      </g>
      <circle cx="26" cy="22" r="10.5" fill="#FBBF24" />
      <circle cx="26" cy="22" r="8" fill="#FDE047" />
      <path
        d="M44 26C44 22.134 47.134 19 51 19C54.44 19 57.3 21.48 57.89 24.75C60.78 25.19 63 27.68 63 30.7C63 34.01 60.31 36.7 57 36.7H43.5C40.46 36.7 38 34.24 38 31.2C38 28.48 39.98 26.22 42.58 25.78"
        fill="#E0EAFF"
        opacity="0.85"
      />
      <path
        d="M21 47H49C53.418 47 57 43.418 57 39C57 34.86 53.854 31.454 49.822 31.042C48.47 25.844 43.748 22 38.125 22C31.786 22 26.6 26.906 26.156 33.13C25.778 33.044 25.384 33 24.98 33C20.573 33 17 36.573 17 40.98C17 44.304 19.696 47 23.02 47H21Z"
        fill="#FFFFFF"
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

  const visual = classifyWeather(weather.weatherCode, weather.high);
  const yesterdayLabel = formatYesterdayLabel(weather.dateIso);

  return (
    <section
      aria-label="Yesterday's Weather"
      className="w-full rounded-2xl p-5 text-white shadow-[0_8px_24px_-12px_rgba(37,99,235,0.45)] transition-all"
      style={{ background: visual.gradient }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-white/20 px-2 py-0.5 text-xs font-semibold tracking-wide">
              Yesterday · {yesterdayLabel}
            </span>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <h2 className="font-display text-lg font-bold leading-tight truncate">
              {weather.city}
            </h2>
            <button
              type="button"
              onClick={requestLocation}
              disabled={status === 'locating'}
              className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-0.5 text-xs font-medium text-white/95 transition-colors hover:bg-white/25 disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white shrink-0"
              title="Use your current location for yesterday's weather"
            >
              <svg
                className="h-3 w-3"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{status === 'locating' ? 'Locating...' : 'Near me'}</span>
            </button>
          </div>

          <p className="text-xs text-white/85" aria-live="polite">
            {visual.label}
            {status === 'denied' ? ' · Defaulting to Cebu City' : ''}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <WeatherGraphic kind={visual.kind} />
          <div className="text-right">
            <div className="text-4xl font-bold leading-none tracking-tight tnum">
              {weather.temp}°
            </div>
            <div className="mt-1 text-xs text-white/85 tnum">
              H:{weather.high}° L:{weather.low}°
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 space-y-2 border-t border-white/20 pt-3 text-xs text-white/90">
        <div className="flex items-center gap-3.5 tnum">
          <span>Feels {weather.feelsLike}°</span>
          <span>Rain {weather.rainChance}%</span>
          <span>{weather.precipMm} mm</span>
        </div>
        <p className="text-white/85 leading-relaxed">
          {visual.note}
        </p>
      </div>
    </section>
  );
}
