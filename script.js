// =========================
// Element references
// =========================
var searchCity        = $("#search-city");
var currentCity       = $("#current-city");
var currentTemperature = $("#temperature");
var currentHumidty    = $("#humidity");
var currentWSpeed     = $("#wind-speed");
var sCity             = [];


// =========================
// Weather icon helper
// =========================
function getWeatherIcon(code) {
    if (code === 0) return "☀️";          // Clear sky
    if (code <= 3)  return "⛅";          // Mainly clear / cloudy
    if (code <= 48) return "🌫️";         // Fog / mist
    if (code <= 67) return "🌧️";         // Drizzle / rain
    if (code <= 77) return "❄️";         // Snow
    if (code <= 99) return "⛈️";         // Thunderstorm
    return "🌍";                          // Fallback icon
}


// =========================
// Search handler
// =========================
function displayWeather(event) {
    event.preventDefault();

    var city = searchCity.val().trim();
    if (city !== "") {
        getCoordinates(city);
        searchCity.val("");
    }
}


// =========================
// 1. Get coordinates + set city and date
// =========================
function getCoordinates(city) {
    var geoURL = `https://geocoding-api.open-meteo.com/v1/search?name=${city}&count=1`;

    $.getJSON(geoURL, function (data) {
        if (!data.results || data.results.length === 0) {
            alert("City not found");
            return;
        }

        var res = data.results[0];

        // Update current city name
        currentCity.text(`${res.name}, ${res.country}`);

        // Set current date (e.g., Monday, March 25)
        var now = new Date();
        $("#current-date").text(
            now.toLocaleDateString("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric"
            })
        );

        // Save to history and fetch data
        saveCity(res.name);
        getWeather(res.latitude, res.longitude);
        getAirQuality(res.latitude, res.longitude);
    });
}


// =========================
// 2. Get Air Quality (AQI)
// =========================
function getAirQuality(lat, lon) {
    var url =
        `https://air-quality-api.open-meteo.com/v1/air-quality` +
        `?latitude=${lat}&longitude=${lon}&current=us_aqi`;

    $.getJSON(url, function (data) {
        if (!data.current || typeof data.current.us_aqi === "undefined") {
            $("#aqi-value").text("N/A");
            return;
        }

        var aqi = data.current.us_aqi;

        // Simple AQI color mapping: Good / Moderate / Unhealthy+
        var color =
            aqi <= 50  ? "#27ae60" :   // Green
            aqi <= 100 ? "#e67e22" :   // Orange
                         "#c0392b";    // Red

        $("#aqi-value").html(
            `<span class="aqi-badge" style="background:${color}">${aqi}</span>`
        );
    });
}


// =========================
// 3. Get weather + 5-day forecast
// =========================
function getWeather(lat, lon) {
    var url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${lat}&longitude=${lon}` +
        `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code` +
        `&daily=temperature_2m_max,temperature_2m_min,weather_code` +
        `&timezone=auto`;

    $.getJSON(url, function (data) {
        // Current weather
        currentTemperature.text(Math.round(data.current.temperature_2m) + "°C");
        currentHumidty.text(data.current.relative_humidity_2m + "%");
        currentWSpeed.text(data.current.wind_speed_10m + " km/h");

        // 5-day forecast
        for (var i = 0; i < 5; i++) {
            var dateObj = new Date(data.daily.time[i]);
            var dateStr = dateObj.toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric"
            });

            $("#fDate" + i).text(dateStr);
            $("#fImg" + i).text(getWeatherIcon(data.daily.weather_code[i]));
            $("#fTemp" + i).text(
                Math.round(data.daily.temperature_2m_max[i]) +
                "° / " +
                Math.round(data.daily.temperature_2m_min[i]) +
                "°"
            );
        }
    });
}


// =========================
// 4. Search history helpers
// =========================
function saveCity(city) {
    sCity = JSON.parse(localStorage.getItem("cities")) || [];

    if (!sCity.includes(city)) {
        sCity.push(city);
        localStorage.setItem("cities", JSON.stringify(sCity));
        renderHistory();
    }
}


// Render the recent cities list
function renderHistory() {
    var list = $(".city-list");
    list.empty();

    sCity.forEach(function (city) {
        var li = $("<li>").text(city);
        li.on("click", function () {
            getCoordinates(city);
        });
        list.prepend(li);
    });
}


// Load history on page load and show last searched city
function loadHistory() {
    sCity = JSON.parse(localStorage.getItem("cities")) || [];
    renderHistory();

    if (sCity.length > 0) {
        getCoordinates(sCity[sCity.length - 1]);
    }
}


// =========================
// 5. Event bindings
// =========================
$("#clear-history").on("click", function () {
    localStorage.removeItem("cities");
    sCity = [];
    renderHistory();
});

$("#search-button").on("click", displayWeather);

$("#search-city").on("keydown", function (e) {
    if (e.key === "Enter") {
        displayWeather(e);
    }
});

$(window).on("load", loadHistory);