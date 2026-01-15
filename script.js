const apiKey = "dd15ac98773b33129a41808bde240222"; 
const apiBase = "https://api.openweathermap.org/data/2.5/";

const cityInput = document.getElementById("cityInput");
const searchBtn = document.getElementById("searchBtn");

// --- MAIN FETCH ---
async function fetchWeather(city) {
    try {
        const res = await fetch(`${apiBase}weather?q=${city}&units=metric&appid=${apiKey}`);
        if(res.status === 404) { alert("City not found"); return; }
        const data = await res.json();
        
        updateUI(data);
        setWeatherEffects(data.weather[0].main); // Trigger Animation
        fetchAQI(data.coord.lat, data.coord.lon);
        fetchForecast(city);

    } catch (err) { console.error(err); }
}

async function fetchAQI(lat, lon) {
    const res = await fetch(`${apiBase}air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`);
    const data = await res.json();
    updateAQIGauge(data.list[0].main.aqi);
}

async function fetchForecast(city) {
    const res = await fetch(`${apiBase}forecast?q=${city}&units=metric&appid=${apiKey}`);
    const data = await res.json();
    processForecast(data);
}

// --- ATMOSPHERE & ANIMATION ---
function setWeatherEffects(condition) {
    const bg = document.getElementById("weather-effect-container");
    bg.innerHTML = ""; // Clear existing

    // 1. Dynamic Background Color
    if(condition.includes("Rain")) {
        bg.style.background = "linear-gradient(135deg, #203a43, #2c5364)"; // Dark Rain
        createRain(bg);
    } else if(condition.includes("Cloud")) {
        bg.style.background = "linear-gradient(135deg, #304352, #d7d2cc)"; // Grey Cloud
        createClouds(bg);
    } else if(condition.includes("Clear")) {
        bg.style.background = "linear-gradient(135deg, #2980b9, #6dd5fa)"; // Sunny Blue
        createSun(bg);
    } else {
        bg.style.background = "linear-gradient(135deg, #1e3c72, #2a5298)"; // Default Night/Blue
    }
}

function createRain(container) {
    for(let i=0; i<50; i++){
        let drop = document.createElement("div");
        drop.classList.add("rain-drop");
        drop.style.left = Math.random() * 100 + "%";
        drop.style.animationDuration = Math.random() * 0.5 + 0.5 + "s";
        drop.style.animationDelay = Math.random() * 2 + "s";
        container.appendChild(drop);
    }
}

function createClouds(container) {
    let cloud = document.createElement("div");
    cloud.classList.add("cloud-anim");
    cloud.style.top = "15%";
    container.appendChild(cloud);
}

function createSun(container) {
    let sun = document.createElement("div");
    sun.classList.add("sun-ray");
    container.appendChild(sun);
}

// --- UPDATE UI ---
function updateUI(data) {
    document.getElementById("cityName").innerText = `${data.name}, ${data.sys.country}`;
    document.getElementById("temp").innerText = Math.round(data.main.temp) + "°";
    document.getElementById("weatherDesc").innerText = data.weather[0].description;
    document.getElementById("mainIcon").src = `https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png`;
    
    document.getElementById("windSpeed").innerText = data.wind.speed;
    document.getElementById("windDir").innerText = getCompass(data.wind.deg);
    document.getElementById("compass").style.transform = `rotate(${data.wind.deg}deg)`;
    
    document.getElementById("humidity").innerText = data.main.humidity;
    document.getElementById("humidBar").style.width = `${data.main.humidity}%`;
    
    document.getElementById("visibility").innerText = (data.visibility / 1000).toFixed(1);
    document.getElementById("visText").innerText = data.visibility > 9000 ? "Excellent" : "Hazy";
    
    document.getElementById("sunrise").innerText = new Date(data.sys.sunrise*1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});
    document.getElementById("sunset").innerText = new Date(data.sys.sunset*1000).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'});

    const now = new Date();
    document.getElementById("currentDate").innerText = now.toLocaleDateString('en-US', {weekday:'long', month:'short', day:'numeric'});
    
    // Fake UV for Demo (API limit)
    const uv = Math.round(Math.random() * 10);
    updateUVRing(uv);
}

function updateAQIGauge(aqi) {
    const texts = {1:"Excellent", 2:"Good", 3:"Moderate", 4:"Poor", 5:"Hazardous"};
    const descs = {
        1: "Air quality is satisfactory.",
        2: "Air quality is acceptable.",
        3: "Members of sensitive groups may experience health effects.",
        4: "Everyone may begin to experience health effects.",
        5: "Health warnings of emergency conditions."
    };
    
    document.getElementById("aqiVal").innerText = aqi;
    document.getElementById("aqiStatus").innerText = texts[aqi];
    document.getElementById("aqiDesc").innerText = descs[aqi];

    // Needle Rotation Logic
    // Range: 180deg (left/0) to 360deg (right/max)
    // Scale 1-5. 
    // 1 = 180 + 36 = 216
    // 5 = 180 + 180 = 360
    const angle = 180 + (aqi * 36);
    document.getElementById("aqiNeedle").style.transform = `rotate(${angle}deg)`;
}

function updateUVRing(uv) {
    document.getElementById("uvVal").innerText = uv;
    const offset = 100 - (uv * 10);
    document.getElementById("uvRing").style.strokeDasharray = `${uv*10}, 100`;
    let color = "#00b894";
    if(uv > 5) color = "#e74c3c";
    else if(uv > 2) color = "#f1c40f";
    document.getElementById("uvRing").style.stroke = color;
}

function processForecast(data) {
    // 1. Hourly (Next 8)
    const hBox = document.getElementById("hourlyBox");
    hBox.innerHTML = "";
    data.list.slice(0, 8).forEach(item => {
        hBox.innerHTML += `
            <div class="hour-card">
                <p style="font-size:0.8rem; opacity:0.7">${new Date(item.dt*1000).toLocaleTimeString([],{hour:'2-digit'})}</p>
                <img src="https://openweathermap.org/img/wn/${item.weather[0].icon}.png">
                <b>${Math.round(item.main.temp)}°</b>
            </div>
        `;
    });

    // 2. Daily (Aggregated)
    const dGrid = document.getElementById("dailyGrid");
    dGrid.innerHTML = "";
    
    // Simple filter for 12:00 PM items to approximate daily
    const daily = data.list.filter(item => item.dt_txt.includes("12:00:00"));
    
    daily.forEach(day => {
        dGrid.innerHTML += `
            <div class="daily-row">
                <span>${new Date(day.dt*1000).toLocaleDateString('en-US',{weekday:'short'})}</span>
                <div style="display:flex; align-items:center; gap:5px;">
                    <img src="https://openweathermap.org/img/wn/${day.weather[0].icon}.png" width="30">
                    <b>${Math.round(day.main.temp)}°</b>
                </div>
            </div>
        `;
    });
}

function getCompass(deg) { const arr=["N","NE","E","SE","S","SW","W","NW"]; return arr[Math.round((deg/45))%8]; }

setInterval(() => {
    document.getElementById("clock").innerText = new Date().toLocaleTimeString();
}, 1000);

searchBtn.addEventListener("click", () => fetchWeather(cityInput.value));
cityInput.addEventListener("keypress", (e) => { if(e.key==="Enter") fetchWeather(cityInput.value)});

// Init
fetchWeather("New York");