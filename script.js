
const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");

async function searchWeather() {

    const city = cityInput.value.trim();

    if (city === "") {
        document.getElementById("description").textContent =
            "Please enter a city";
        return;
    }

    try {

        const locationResponse = await fetch(
            `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
        );

        const locationData = await locationResponse.json();

        if (!locationData.results) {
            document.getElementById("cityName").textContent = "Not found";
            document.getElementById("temperature").textContent = "--°C";
            document.getElementById("description").textContent =
                "City not found ❌";
            return;
        }

        const location = locationData.results[0];

        const latitude = location.latitude;
        const longitude = location.longitude;

        const weatherResponse = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
            `&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m` +
            `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum` +
            `&timezone=auto`
        );

        const weatherData = await weatherResponse.json();

        const current = weatherData.current;

        document.getElementById("cityName").textContent =
            location.name;

        document.getElementById("temperature").textContent =
            Math.round(current.temperature_2m) + "°C";

        document.getElementById("feelsLike").textContent =
            Math.round(current.apparent_temperature) + "°C";

        document.getElementById("humidity").textContent =
            current.relative_humidity_2m + "%";

        document.getElementById("wind").textContent =
            Math.round(current.wind_speed_10m) + " km/h";

        document.getElementById("rain").textContent =
            current.precipitation + " mm";


        const weather = getWeatherInfo(current.weather_code);

        document.getElementById("weatherIcon").textContent =
            weather.icon;

        document.getElementById("description").textContent =
            weather.description;


        // Change background depending on weather
        changeBackground(current.weather_code);


        // Show 7-day forecast
        showForecast(weatherData.daily);

    } catch (error) {

        console.error(error);

        document.getElementById("description").textContent =
            "Something went wrong ❌";
    }
}


// Weather information
function getWeatherInfo(code) {

    if (code === 0) {
        return {
            description: "Clear sky",
            icon: "☀️"
        };
    }

    if (code === 1 || code === 2) {
        return {
            description: "Partly cloudy",
            icon: "🌤️"
        };
    }

    if (code === 3) {
        return {
            description: "Cloudy",
            icon: "☁️"
        };
    }

    if (code >= 45 && code <= 48) {
        return {
            description: "Foggy",
            icon: "🌫️"
        };
    }

    if (code >= 51 && code <= 67) {
        return {
            description: "Rain",
            icon: "🌧️"
        };
    }

    if (code >= 71 && code <= 77) {
        return {
            description: "Snow",
            icon: "❄️"
        };
    }

    if (code >= 80 && code <= 82) {
        return {
            description: "Rain showers",
            icon: "🌦️"
        };
    }

    if (code >= 95) {
        return {
            description: "Thunderstorm",
            icon: "⛈️"
        };
    }

    return {
        description: "Unknown weather",
        icon: "🌤️"
    };
}


// Change background
function changeBackground(code) {

    const background = document.querySelector(".background");

    if (code === 0) {

        background.style.background =
            "linear-gradient(135deg, #56ccf2, #f2c94c)";

    } else if (code <= 3) {

        background.style.background =
            "linear-gradient(135deg, #78909c, #b0bec5)";

    } else if (code >= 51 && code <= 67) {

        background.style.background =
            "linear-gradient(135deg, #314755, #26a0da)";

    } else if (code >= 80 && code <= 82) {

        background.style.background =
            "linear-gradient(135deg, #3a6073, #16222a)";

    } else if (code >= 95) {

        background.style.background =
            "linear-gradient(135deg, #141e30, #243b55)";

    } else {

        background.style.background =
            "linear-gradient(135deg, #4facfe, #00f2fe)";
    }
}


// 7-day forecast
function showForecast(daily) {

    const forecast = document.getElementById("forecast");

    forecast.innerHTML = "";

    for (let i = 0; i < 7; i++) {

        const date = new Date(daily.time[i]);

        const day = date.toLocaleDateString("en-US", {
            weekday: "short"
        });

        const weather =
            getWeatherInfo(daily.weather_code[i]);

        const card =
            document.createElement("div");

        card.className = "forecast-card";

        card.innerHTML = `
            <div class="forecast-day">${day}</div>

            <div class="forecast-icon">
                ${weather.icon}
            </div>

            <div class="forecast-temp">
                ${Math.round(daily.temperature_2m_max[i])}° /
                ${Math.round(daily.temperature_2m_min[i])}°
            </div>

            <div class="forecast-rain">
                🌧️ ${daily.precipitation_sum[i]} mm
            </div>
        `;

        forecast.appendChild(card);
    }
}


// Search button
searchBtn.addEventListener("click", searchWeather);


// Enter key
cityInput.addEventListener("keydown", function(event) {

    if (event.key === "Enter") {
        searchWeather();
    }

});


