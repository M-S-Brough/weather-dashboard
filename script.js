// Insert your API Key here
const API_KEY = "";

// Convert wind degree to compass direction
function getWindDirection(deg) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  return directions[Math.round(deg / 45) % 8];
}

// Convert UNIX timestamp to readable HH:MM
function formatTime(unix) {
  const date = new Date(unix * 1000);
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Main search logic used in both button and history
async function handleSearch(city) {
  const resultDiv = document.getElementById("weatherResult");
  const spinner = document.getElementById("spinner");

  if (!city) return alert("Please enter a city name.");

  spinner.style.display = "flex";
  resultDiv.innerHTML = "";

  try {
    // Current weather
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=metric`
    );
    if (!response.ok) throw new Error("City not found");
    const data = await response.json();

    // 5-day forecast
    const forecastResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
    );
    if (!forecastResponse.ok) throw new Error("Forecast not found");
    const forecastData = await forecastResponse.json();

    setBackground(data.weather[0].main);
    updateSearchHistory(city);

    spinner.style.display = "none";

    // Display current weather
    resultDiv.innerHTML = `
      <h2>${data.name}, ${data.sys.country}</h2>
      <p>🌡️ Temp: ${data.main.temp}°C</p>
      <p>🤗 Feels Like: ${data.main.feels_like}°C</p>
      <p>🔺 Max: ${data.main.temp_max}°C | 🔻 Min: ${data.main.temp_min}°C</p>
      <p>
        <img 
          src="http://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png" 
          alt="${data.weather[0].description}" 
          style="vertical-align: middle;"
        />
        ${data.weather[0].description}
      </p>
      <p>💧 Humidity: ${data.main.humidity}%</p>
      <p>🌬️ Wind: ${data.wind.speed} m/s, ${getWindDirection(data.wind.deg)}</p>
      <p>🗺️ Coordinates: [${data.coord.lat}, ${data.coord.lon}]</p>
      <p>🌅 Sunrise: ${formatTime(data.sys.sunrise)}</p>
      <p>🌇 Sunset: ${formatTime(data.sys.sunset)}</p>
    `;

    displayForecast(forecastData, resultDiv);
  } catch (error) {
    spinner.style.display = "none";
    resultDiv.innerHTML = `<p style="color:red;">${error.message}</p>`;
  }
}

// Button: Get Weather
document.getElementById("getWeatherBtn").addEventListener("click", () => {
  const input = document.getElementById("cityInput");
  const city = input.value.trim();
  handleSearch(city);
  input.value = ""; // Clear after search
});

// Display 5-day forecast
function displayForecast(forecastData, container) {
  const forecastDiv = document.createElement("div");
  forecastDiv.className = "forecast";
  forecastDiv.innerHTML =
    "<h3>5-Day Forecast</h3><div class='forecast-cards'></div>";

  const dailyForecast = {};
  forecastData.list.forEach((entry) => {
    const [date, time] = entry.dt_txt.split(" ");
    if (time === "12:00:00" && !dailyForecast[date]) {
      dailyForecast[date] = entry;
    }
  });

  Object.values(dailyForecast)
    .slice(0, 5)
    .forEach((entry) => {
      const card = document.createElement("div");
      card.className = "forecast-card";
      card.innerHTML = `
        <strong>${new Date(entry.dt * 1000).toLocaleDateString("en-GB", {
          weekday: "short",
          month: "short",
          day: "numeric",
        })}</strong>
        <img src="http://openweathermap.org/img/wn/${
          entry.weather[0].icon
        }.png" />
        <p>${entry.main.temp.toFixed(1)}°C</p>
      `;
      forecastDiv.querySelector(".forecast-cards").appendChild(card);
    });

  container.appendChild(forecastDiv);
}

// Set background image
function setBackground(condition) {
  const body = document.body;
  const backgrounds = {
    Clear:
      "https://images.unsplash.com/photo-1591131059786-9149237f62b4?q=80&w=1935&auto=format&fit=crop",
    Clouds:
      "https://images.unsplash.com/photo-1501630834273-4b5604d2ee31?q=80&w=2070&auto=format&fit=crop",
    Rain: "https://images.unsplash.com/photo-1603321544554-f416a9a11fcf?q=80&w=2070&auto=format&fit=crop",
    Snow: "https://images.unsplash.com/photo-1543453369-d2fb3955367f?q=80&w=1994&auto=format&fit=crop",
    Thunderstorm:
      "https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?q=80&w=2071&auto=format&fit=crop",
    Drizzle:
      "https://images.unsplash.com/photo-1556485689-33e55ab56127?q=80&w=2070&auto=format&fit=crop",
    Mist: "https://images.unsplash.com/photo-1566818392111-1d5b125d6c4c?q=80&w=1935&auto=format&fit=crop",
    Fog: "https://images.unsplash.com/photo-1621407442008-c2911cf3ef82?q=80&w=1965&auto=format&fit=crop",
  };

  body.style.backgroundImage = `url('${
    backgrounds[condition] || backgrounds.Clear
  }')`;
  body.style.backgroundSize = "cover";
  body.style.backgroundPosition = "center";
  body.style.backgroundRepeat = "no-repeat";
  body.style.transition = "background-image 1s ease-in-out";
}

// Save to localStorage
function updateSearchHistory(city) {
  const history = JSON.parse(localStorage.getItem("weatherHistory")) || [];

  if (!history.some((c) => c.toLowerCase() === city.toLowerCase())) {
    history.unshift(city);
    localStorage.setItem("weatherHistory", JSON.stringify(history.slice(0, 6)));
    renderSearchHistory();
  }
}

// Render past search buttons
function renderSearchHistory() {
  const container = document.getElementById("searchHistory");
  const history = JSON.parse(localStorage.getItem("weatherHistory")) || [];

  container.innerHTML = "";

  history.forEach((city) => {
    const btn = document.createElement("button");
    btn.textContent = city;

    btn.addEventListener("click", () => {
      handleSearch(city);
      document.getElementById("cityInput").value = "";
    });

    container.appendChild(btn);
  });
}

// Clear history
document.getElementById("clearHistoryBtn").addEventListener("click", () => {
  if (confirm("Are you sure you want to clear your search history?")) {
    localStorage.removeItem("weatherHistory");
    renderSearchHistory();
  }
});

// Load history on page load
renderSearchHistory();
