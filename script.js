let currentCITY = 'Busan';
// ------------------------------------------- API OPENWEATHER -------------------------------------------------------
const API_KEY = '44e41eeffeda3b22eca673b0e45c963b';
 


// ------------------------ Function to fetch data from the API WEATHER ------------------------
async function fetchData() {
    console.log('fetchData() appelée avec la ville:', currentCITY); // Debug
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${currentCITY}&appid=${API_KEY}&units=metric`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        // Temperature and Humidity Sunrise and Sunset
        const temperature = data.main.temp;
        const humidity = data.main.humidity;
        const windSpeed = data.wind.speed;
        const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString();
        const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString();

        // Get the weather icon
        const weatherIcon = data.weather[0].icon;

        // Rain
        const rain = data.rain ? data.rain['1h'] : 0;

        // Update the user interface
        document.getElementById('tempValue').textContent = `${temperature} °C`;
        document.getElementById('humidityValue').textContent = `${humidity} %`;
        document.getElementById('sunriseValue').textContent = `${sunrise}`;
        document.getElementById('sunsetValue').textContent = `${sunset}`;
        document.getElementById('windValue').textContent = `${windSpeed} m/s`;
        document.getElementById('rainValue').textContent = `${rain} mm`;

        // Update the weather icon
        document.querySelector('.weather-icon img').src = `https://openweathermap.org/img/wn/${weatherIcon}@2x.png`;
    } catch (error) {
        console.error('Error getting data:', error);
        //alert('Error getting data.');
    }
}


//------------------------------------------- FUNCTION API GEOCODING ---------------------------------------------------------------
async function getCoordinates() {
    console.log('getCoordinates - currentCity:', currentCITY);  // Debug
    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${currentCITY}&limit=1&appid=${API_KEY}`;
    try {
        const response = await fetch(geoUrl);
        const data = await response.json();
        if (data.length > 0) {
            return {
                lat: data[0].lat,
                lon: data[0].lon
            };
        }
        throw new Error("City not found");
    } catch (error) {
        console.error("Error getting coordinates:", error);
        throw error;
    }
}

//------------------------------------------- FUNCTION API AIR QUALITY ---------------------------------------------------------------
async function fetchAirQualityData() {
    try {
        console.log('fetchAirQualityData - currentCity:', currentCITY);  // Debug
        // Get coordinates
        const coords = await getCoordinates();
        
        // Use coordinates to get air quality data
        const url2 = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}`;
        const response = await fetch(url2);
        const data = await response.json();

        // Check if data is available
        if (!data.list || !data.list[0]) {
            throw new Error("Data not available");
        }

        const airQuality = data.list[0].components;
        const aqi = data.list[0].main.aqi;
       
        document.getElementById('PM2_5Value').textContent = `${airQuality.pm2_5||0} µg/m³`;
        document.getElementById('PM10Value').textContent = `${airQuality.pm10||0} µg/m³`;
        document.getElementById('NOxValue').textContent = `${airQuality.no2||0} µg/m³`;
        document.getElementById('NH3Value').textContent = `${airQuality.nh3||0} µg/m³`;
        document.getElementById('SO2Value').textContent = `${airQuality.so2||0} µg/m³`;
        document.getElementById('COValue').textContent = `${airQuality.co||0} µg/m³`;
         
        updateAQIStatus(aqi);
    } catch (error) {
        console.error('Erreur de récupération des données:', error);
        //alert('Erreur lors de la récupération des données de qualité d\'air.');
    }   
}

//------------------------------------------- FUNCTION UPDATE AQI STATUS ---------------------------------------------------------------
function updateAQIStatus(aqi) {
    const aqiElement = document.querySelector('.air-index');
    
    // Remove all existing aqi classes
    aqiElement.classList.remove('aqi-1', 'aqi-2', 'aqi-3', 'aqi-4', 'aqi-5');
    
    // Update the AQI status
    switch(aqi) {
        case 1://GOOD
            aqiElement.textContent = "Good";
            aqiElement.classList.add('aqi-1');
            break;
        case 2://FAIR
            aqiElement.textContent = "Fair";
            aqiElement.classList.add('aqi-2');
            break;
        case 3://MODERATE
            aqiElement.textContent = "Moderate";
            aqiElement.classList.add('aqi-3');
            break;
        case 4://POOR
            aqiElement.textContent = "Poor";
            aqiElement.classList.add('aqi-4');
            break;
        case 5://VERY POOR
            aqiElement.textContent = "Very Poor";
            aqiElement.classList.add('aqi-5');
            break;
        default:
            aqiElement.textContent = "Unknown";
    }
}

// ------------------------------------ Function to fetch data from the API FORECAST ------------------------------------
async function getFiveDayForecast() {
    try {
        // Get the coordinates of the city
        const coords = await getCoordinates();
        
        // Call the API for the 5 days forecast
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}&units=metric`;
        const response = await fetch(forecastUrl);
        const data = await response.json();

        // Filter to have only one forecast per day
        const dailyForecasts = {};
        
        data.list.forEach(forecast => {
            const date = new Date(forecast.dt * 1000);
            const day = date.toISOString().split('T')[0];
            
            if (!dailyForecasts[day]) {
                dailyForecasts[day] = {
                    date: date,
                    temp: Math.round(forecast.main.temp),
                    description: forecast.weather[0].description,
                    icon: forecast.weather[0].icon
                };
            }
        });

        // Convert the object into an array and take the first 5 days
        const forecasts = Object.values(dailyForecasts).slice(0, 5);
        
        // Select all the forecast-item elements
        const forecastItems = document.querySelectorAll('.forecast-item');
        
        // Update each element with the new data
        forecasts.forEach((forecast, index) => {
            if (forecastItems[index]) {
                const dayName = forecast.date.toLocaleDateString('en-US', { weekday: 'short' });
                const dayDate = forecast.date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });
                
                // Update the image and the temperature
                const iconWrapper = forecastItems[index].querySelector('.icon-wrapper');
                iconWrapper.querySelector('img').src = `https://openweathermap.org/img/wn/${forecast.icon}@2x.png`;
                iconWrapper.querySelector('span').textContent = `${forecast.temp}°C`;
                
                // Update the day and the date
                const paragraphs = forecastItems[index].querySelectorAll('p');
                paragraphs[0].textContent = dayName;
                paragraphs[1].textContent = dayDate;
            }
        });

    } catch (error) {
        console.error('Error getting the forecast:', error);
    }
}

//-------------------------------------------- FUNCTION CREATE CHART ---------------------------------------------------------------
// Graphique température/humidité
function createTempHumidityChart(weatherData) {
    // Destroy the existing chart if it exists
    if (window.tempHumidityChart) {
        window.tempHumidityChart.destroy();
    }
    const ctx = document.getElementById('tempHumidityTrendChart').getContext('2d');
    
    const next24Hours = weatherData.list.slice(0, 8); // Prochaines 24h (8 points de 3h)
    
    const labels = next24Hours.map(item => 
        new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
    const temperatures = next24Hours.map(item => item.main.temp);
    const humidity = next24Hours.map(item => item.main.humidity);

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperature (°C)',
                data: temperatures,
                borderColor: '#FF6384',
                tension: 0.4,
                yAxisID: 'y'
            }, {
                label: 'Humidity (%)',
                data: humidity,
                borderColor: '#36A2EB',
                tension: 0.4,
                yAxisID: 'y1'
            }]
        },
        options: {
            responsive: true,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                y: {
                    type: 'linear',
                    position: 'left',
                },
                y1: {
                    type: 'linear',
                    position: 'right',
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

//-------------------------------------------- FUNCTION CREATE POLLUTANTS LEVEL CHART ---------------------------------------------------------------
function createPollutantsLevelChart(pollutionData) {
    const ctx = document.getElementById('pollutantsLevelChart').getContext('2d');
    const components = pollutionData.list[0].components;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['PM2.5', 'PM10', 'NO2', 'NH3', 'SO2', 'CO'],
            datasets: [{
                label: 'Pollutant Levels (µg/m³)',
                data: [
                    components.pm2_5,
                    components.pm10,
                    components.no2,
                    components.nh3,
                    components.so2,
                    components.co
                ],
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', 
                    '#4BC0C0', '#9966FF', '#FF9F40'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

//-------------------------------------------- FUNCTION CREATE POLLUTANTS DISTRIBUTION CHART ---------------------------------------------------------------
function createPollutantsDistributionChart(pollutionData) {
    const ctx = document.getElementById('pollutantsDistributionChart').getContext('2d');
    const components = pollutionData.list[0].components;
    
    const total = Object.values(components).reduce((a, b) => a + b, 0);
    const data = {
        pm2_5: (components.pm2_5 / total) * 100,
        pm10: (components.pm10 / total) * 100,
        no2: (components.no2 / total) * 100,
        nh3: (components.nh3 / total) * 100,
        so2: (components.so2 / total) * 100,
        co: (components.co / total) * 100
    };

    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['PM2.5', 'PM10', 'NO2', 'NH3', 'SO2', 'CO'],
            datasets: [{
                data: Object.values(data),
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', 
                    '#4BC0C0', '#9966FF', '#FF9F40'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.raw.toFixed(1)}%`;
                        }
                    }
                }
            }
        }
    });
}
//-------------------------------------------- FUNCTION CREATE CHART ---------------------------------------------------------------    
async function createCharts() {
    
    try {
        // Récupérer les coordonnées de la ville actuelle
        const coords = await getCoordinates();
        
        // Récupérer les données de pollution
        const airQualityUrl = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}`;
        const airQualityResponse = await fetch(airQualityUrl);
        const airQualityData = await airQualityResponse.json();

        // Récupérer l'historique météo sur 24h
        const now = Math.floor(Date.now() / 1000);
        const weatherHistoryUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}&units=metric`;
        const weatherResponse = await fetch(weatherHistoryUrl);
        const weatherData = await weatherResponse.json();

        // Créer le graphique température/humidité
        createTempHumidityChart(weatherData);
        // Créer le graphique des polluants
        createPollutantsLevelChart(airQualityData);
        // Créer le graphique de distribution
        createPollutantsDistributionChart(airQualityData);

    } catch (error) {
        console.error('Error creating charts:', error);
    }
}


// ---------------------------------------------------------- DOM CONTENT LOADED ---------------------------------------------------------------

document.addEventListener('DOMContentLoaded', function() {
    // ------------------------------ NAVIGATION -----------------------------
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();

            // Activer le lien sélectionné
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            // Afficher la page correspondante
            pages.forEach(page => page.style.display = 'none');
            const pageId = link.getAttribute('data-page');
            document.getElementById(pageId).style.display = 'block';

            // Réinitialiser les graphiques selon la page AFAIRE
        });
    
    // ------------------------------ Search button -----------------------------
    const searchBtn = document.getElementById('searchBtn');
    const cityInput = document.getElementById('city_input');

    //------------------------- Function to update the city -------------------------
    function updateCity() {
        const newCity = cityInput.value.trim();
        if(newCity !== '') {
            currentCITY = newCity;
            console.log('Current City:',  currentCITY); //Check if the city is updated
            // Update data
            fetchData();
            fetchAirQualityData(); 
            getFiveDayForecast(); 
            createCharts(); 
            // Update the city name
            document.getElementById('cityName').textContent = currentCITY;
        }
    }

    // When clicking on the search button
    searchBtn.addEventListener('click', updateCity);

    // When pressing Enter
    cityInput.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') {
            updateCity();
        }
    });
    });

    // Gestion des boutons de période
    const periodBtns = document.querySelectorAll('.period-btn');
    periodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            periodBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            //initCharts(btn.dataset.period);
        });
    });
    // --------------------- Get today's date ---------------------
    // Get today's date
    const today = new Date();
    
    // Extract the day, month and year
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0'); // Months start at 0
    const year = today.getFullYear();

    // Format the date
    const dateString = `${day}/${month}/${year}`;
    
    // Display the date
    document.getElementById('date').textContent = dateString;
    // Initial call
    fetchData();
    fetchAirQualityData();
    getFiveDayForecast();
    createCharts();


    
});



//------------------------------------------- EXECUTION ---------------------------------------------------------------


// Update data every 5 minutes
setInterval(fetchData, 300000);
setInterval(fetchAirQualityData, 300000);
setInterval(getFiveDayForecast, 300000);
setInterval(createCharts, 300000);

