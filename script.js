/* =========================
   Weather Teller – improved for Indian cities
   ========================= */
const cityInput   = document.getElementById("cityInput");
const searchBtn   = document.getElementById("searchBtn");
const cityNameEl  = document.getElementById("cityName");
const weatherIcon = document.getElementById("weatherIcon");
const tempEl      = document.getElementById("temperature");
const descEl      = document.getElementById("description");
const feelsLikeEl = document.getElementById("feelsLike");
const humidityEl  = document.getElementById("humidity");
const windEl      = document.getElementById("wind");
const rainEl      = document.getElementById("rain");
const forecastEl  = document.getElementById("forecast");

/* ---------- UI helpers ---------- */
function setLoading(isLoading) {
  searchBtn.disabled = isLoading;
  searchBtn.innerHTML = isLoading
    ? '<span class="spinner"></span> Searching…'
    : 'Search';
}
function showError(msg) {
  descEl.textContent = msg;
  descEl.style.color = "#d32f2f";
}
function clearError() {
  descEl.textContent = "";
  descEl.style.color = "";
}
function resetCard() {
  cityNameEl.textContent = "City";
  weatherIcon.textContent = "🌤️";
  tempEl.textContent = "--°C";
  feelsLikeEl.textContent = "--°C";
  humidityEl.textContent = "--%";
  windEl.textContent = "-- km/h";
  rainEl.textContent = "-- mm";
  forecastEl.innerHTML = "";
}

/* ---------- Core logic ---------- */
// Simple debounce (300 ms) – prevents rapid successive calls
function debounce(fn, delay) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), delay);
  };
}

// Convert weather code → emoji + description (same as before, kept for clarity)
function getWeatherInfo(code) {
  if (code === 0) return { description: "Clear sky", icon: "☀️" };
  if (code === 1 || code === 2) return { description: "Partly cloudy", icon: "🌤️" };
  if (code === 3) return { description: "Cloudy", icon: "☁️" };
  if (code >= 45 && code <= 48) return { description: "Foggy", icon: "🌫️" };
  if (code >= 51 && code <= 67) return { description: "Rain", icon: "🌧️" };
  if (code >= 71 && code <= 77) return { description: "Snow", icon: "❄️" };
  if (code >= 80 && code <= 82) return { description: "Rain showers", icon: "🌦️" };
  if (code >= 95) return { description: "Thunderstorm", icon: "⛈️" };
  return { description: "Unknown weather", icon: "🌤️" };
}

// Change the animated gradient background according to weather code
function changeBackground(code) {
  const bg = document.querySelector(".background");
  if (code === 0) {
    bg.style.background = "linear-gradient(135deg, #56ccf2, #f2c94c)";
  } else if (code <= 3) {
    bg.style.background = "linear-gradient(135deg, #78909c, #b0bec5)";
  } else if (code >= 51 && code <= 67) {
    bg.style.background = "linear-gradient(135deg, #314755, #26a0da)";
  } else if (code >= 80 && code <= 82) {
    bg.style.background = "linear-gradient(135deg, #3a6073, #16222a)";
  } else if (code >= 95) {
    bg.style.background = "linear-gradient(135deg, #141e30, #243b55)";
  } else {
    bg.style.background = "linear-gradient(135deg, #4facfe, #00f2fe)";
  }
}

// Render the 7‑day forecast cards
function showForecast(daily) {
  forecastEl.innerHTML = ""; // clear previous
  for (let i = 0; i < 7; i++) {
    const date = new Date(daily.time[i]);
    const day  = date.toLocaleDateString("en-US", { weekday: "short" });
    const weather = getWeatherInfo(daily.weather_code[i]);

    const card = document.createElement("div");
    card.className = "forecast-card";
    card.innerHTML = `
      <div class="forecast-day">${day}</div>
      <div class="forecast-icon">${weather.icon}</div>
      <div class="forecast-temp">
        ${Math.round(daily.temperature_2m_max[i])}° /
        ${Math.round(daily.temperature_2m_min[i])}°
      </div>
      <div class="forecast-rain">🌧️ ${daily.precipitation_sum[i]} mm</div>
    `;
    forecastEl.appendChild(card);
  }
}

// Main search routine -------------------------------------------------
async function searchWeather() {
  clearError();
  setLoading(true);
  resetCard();

  const city = cityInput.value.trim();
  if (!city) {
    showError("Please enter a city name");
    setLoading(false);
    return;
  }

  try {
    // 1️⃣ Geocode – ask for a handful of results
    const geoResp = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
        city
      )}&count=5&language=en&format=json`
    );
    const geoData = await geoResp.json();

    if (!geoData.results || geoData.results.length === 0) {
      throw new Error("No locations found");
    }

    // 2️⃣ Prefer an Indian result (country_code === "IN")
    let location = geoData.results.find(r => r.country_code === "IN");
    if (!location) location = geoData.results[0]; // fallback

    // 3️⃣ Fetch weather data
    const weatherResp = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}` +
        `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m` +
        `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum` +
        `&timezone=auto`
    );
    const weatherData = await weatherResp.json();

    // 4️⃣ Populate UI
    const cur = weatherData.current;
    cityNameEl.textContent = `${location.name}, ${location.country}`;
    weatherIcon.textContent = getWeatherInfo(cur.weather_code).icon;
    tempEl.textContent = `${Math.round(cur.temperature_2m)}°C`;
    feelsLikeEl.textContent = `${Math.round(cur.apparent_temperature)}°C`;
    humidityEl.textContent = `${cur.relative_humidity_2m}%`;
    windEl.textContent = `${Math.round(cur.wind_speed_10m)} km/h`;
    rainEl.textContent = `${cur.precipitation} mm`;

    // description (human‑readable)
    descEl.textContent = getWeatherInfo(cur.weather_code).description;
    descEl.style.color = "";

    // background gradient
    changeBackground(cur.weather_code);

    // 5‑day forecast
    showForecast(weatherData.daily);
  } catch (err) {
    console.error(err);
    showError("Something went wrong ❌ – try another spelling or a nearby city");
  } finally {
    setLoading(false);
  }
}

/* ---------- Event wiring ---------- */
searchBtn.addEventListener("click", searchWeather);
cityInput.addEventListener("keydown", e => {
  if (e.key === "Enter") searchWeather();
});
/* Optional: live search with debounce (uncomment if you want instant results)
cityInput.addEventListener("input", debounce(() => {
  if (cityInput.value.length > 2) searchWeather();
}, 300));
*/


