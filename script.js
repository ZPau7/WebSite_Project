let currentCITY = 'Busan'; //City by default
// ------------------------------------------------------- API OPENWEATHER -------------------------------------------------------------------------
const API_KEY = '44e41eeffeda3b22eca673b0e45c963b';
 
// ------------------------ Function to fetch data from the API WEATHER ------------------------
async function fetchData() {

    console.log('fetchData() appelée avec la ville:', currentCITY); // Debug
    //making a url to get the weather data, with the city name and the API key
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${currentCITY}&appid=${API_KEY}&units=metric`;

    //start of the try block
    try { 
        const response = await fetch(url); //await is used to wait for the response from the fetch function
        const data = await response.json(); //await is used to wait for the response to be converted to JSON

        // Extracting the data from the API
        const temperature = data.main.temp;
        const humidity = data.main.humidity;
        const windSpeed = data.wind.speed;
        const sunrise = new Date(data.sys.sunrise* 1000).toLocaleTimeString(); //convert seconds to milliseconds
        const sunset = new Date(data.sys.sunset* 1000).toLocaleTimeString(); //convert seconds to milliseconds

        // Get the weather icon
        const weatherIcon = data.weather[0].icon; //icon is the first element of the weather array

        // Rain
        const rain = data.rain ? data.rain['1h'] : 0; //if there is rain, get the rain intensity, otherwise 0

        // Update the HTML elements with the data retrieved from the API
        document.getElementById('tempValue').textContent = `${temperature} °C`;
        document.getElementById('humidityValue').textContent = `${humidity} %`;
        document.getElementById('sunriseValue').textContent = `${sunrise}`;
        document.getElementById('sunsetValue').textContent = `${sunset}`;
        document.getElementById('windValue').textContent = `${windSpeed} m/s`;
        document.getElementById('rainValue').textContent = `${rain} mm`;

        // Update the weather icon by changing the src of the img element
        document.querySelector('.weather-icon img').src = `https://openweathermap.org/img/wn/${weatherIcon}@2x.png`;

    } catch (error) {
        console.error('Error getting data:', error);
        //alert('Error getting data.');
    }
}


//------------------------------------------------------ FUNCTION API GEOCODING -------------------------------------------------------------------------------
async function getCoordinates() {
    console.log('getCoordinates - currentCity:', currentCITY);  // Debug
    //making a url to get the coordinates of the city, with the city name and the API key
    const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${currentCITY}&limit=1&appid=${API_KEY}`;

    //start of the try block
    try {
        const response = await fetch(geoUrl); //await is used to wait for the response from the fetch function  
        const data = await response.json(); //await is used to wait for the response to be converted to JSON

        //if the city is found, return the coordinates
        if (data.length > 0) {
            return {
                lat: data[0].lat, 
                lon: data[0].lon 
            };
        }
        //if the city is not found, throw an error
        throw new Error("City not found");
    } catch (error) {
        console.error("Error getting coordinates:", error);
        throw error;
    }
}

//---------------------------------------------------------- FUNCTION API AIR QUALITY ---------------------------------------------------------------
async function fetchAirQualityData() {
    console.log('fetchAirQualityData - currentCity:', currentCITY);  // Debug
    //start of the try block
    try {
        // Get coordinates
        const coords = await getCoordinates(); //await is used to wait for the coordinates to be retrieved
        
        // making a url to get the air quality data, with the coordinates and the API key
        // we can't get the air quality data with the city name because the API doesn't support it
        const url2 = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}`;
        const response = await fetch(url2);
        const data = await response.json();

        // Check if data is available
        //list is a array which contains the air quality data, data.list[0] is the most recent data
        if (!data.list || !data.list[0]) { //if the list is empty or the first element is empty, throw an error
            throw new Error("Data not available");
        }

        const airQuality = data.list[0].components; //level of air pollutants (PM2.5, PM10, NO2, NH3, SO2, CO)
        const aqi = data.list[0].main.aqi; //air quality index (1: Good, 2: Fair, 3: Moderate, 4: Poor, 5: Very Poor)

        // Update the HTML elements with the data retrieved from the API
        //if the data is not available, display 0
        document.getElementById('PM2_5Value').textContent = `${airQuality.pm2_5||0} µg/m³`;
        document.getElementById('PM10Value').textContent = `${airQuality.pm10||0} µg/m³`;
        document.getElementById('NOxValue').textContent = `${airQuality.no2||0} µg/m³`;
        document.getElementById('NH3Value').textContent = `${airQuality.nh3||0} µg/m³`;
        document.getElementById('SO2Value').textContent = `${airQuality.so2||0} µg/m³`;
        document.getElementById('COValue').textContent = `${airQuality.co||0} µg/m³`;

        //update the AQI status
        updateAQIStatus(aqi);
    } catch (error) {
        console.error('Erreur de récupération des données:', error);
        //alert('Erreur lors de la récupération des données de qualité d\'air.');
    }   
}

//----------------------------------------------------------------- FUNCTION UPDATE AQI STATUS -----------------------------------------------------------------
function updateAQIStatus(aqi) {
    //select the HTML element which contains the AQI status
    const aqiElement = document.querySelector('.air-index');
    
    // Remove all existing aqi classes
    aqiElement.classList.remove('aqi-1', 'aqi-2', 'aqi-3', 'aqi-4', 'aqi-5');
    
    // Update the AQI status
    // 12345 are the AQI values get from the API
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

// ----------------------------------------------------------- Function to fetch data from the API FORECAST ------------------------------------------------------------
async function getFiveDayForecast() {
    try {
        // Get the coordinates of the city
        const coords = await getCoordinates();
        
        // making a url to get the 5 days forecast, with the coordinates and the API key
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}&units=metric`;
        const response = await fetch(forecastUrl);
        const data = await response.json();

        // Filter to have only one forecast per day
        // Api return 3h forecast, we need to have only one forecast per day
        const dailyForecasts = {};
        
        data.list.forEach(forecast => {
            const date = new Date(forecast.dt * 1000); //convert seconds to milliseconds
            const day = date.toISOString().split('T')[0]; //get the date without the time
            
            if (!dailyForecasts[day]) { //if the day is not in the dailyForecasts object, add it
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

//----------------------------------------------------------------- Data Visualization Page ---------------------------------------------------------------------------------

//-------------------------------------------- FUNCTION CREATE CHART ---------------------------------------------------------------
let tempHumidityChart = null;
let pollutantsLevelChart = null;
let pollutantsDistributionChart = null;

// Graphique température/humidité
function createTempHumidityChart(weatherData) {

    const ctx = document.getElementById('tempHumidityTrendChart').getContext('2d');
    // Destroy the existing chart if it exists
    if (tempHumidityChart) {
        tempHumidityChart.destroy();
    }

    const next24Hours = weatherData.list.slice(0, 8); // Prochaines 24h (8 points de 3h)
    
    const labels = next24Hours.map(item => 
        new Date(item.dt * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    );
    const temperatures = next24Hours.map(item => item.main.temp);
    const humidity = next24Hours.map(item => item.main.humidity);

    tempHumidityChart = new Chart(ctx, {
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

//----------------------------------------------------- FUNCTION CREATE POLLUTANTS LEVEL CHART ---------------------------------------------------------------
function createPollutantsLevelChart(pollutionData) {
    const ctx = document.getElementById('pollutantsLevelChart').getContext('2d');

    if (pollutantsLevelChart) {
        pollutantsLevelChart.destroy();
    }

    const components = pollutionData.list[0].components;

    pollutantsLevelChart = new Chart(ctx, {
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

//-------------------------------------------------------- FUNCTION CREATE POLLUTANTS DISTRIBUTION CHART ---------------------------------------------------------------
function createPollutantsDistributionChart(pollutionData) {
    const ctx = document.getElementById('pollutantsDistributionChart').getContext('2d');

    if (pollutantsDistributionChart) {
        pollutantsDistributionChart.destroy();
    }

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

    pollutantsDistributionChart = new Chart(ctx, {
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

//------------------------------------------------------------ FUNCTION CREATE CHART ---------------------------------------------------------------    
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

//---------------------------------------------------------------- GRAPHICAL EVOLUTION PAGE -------------------------------------------------------------------
let tempChart = null;
let humidityChart = null;
let aqiChart = null;
let windChart = null;

function createTemperatureChart(labels, data) {
    const ctx = document.getElementById('tempChart').getContext('2d');
    
    // Destroy graph if existed
    if (tempChart) {
        tempChart.destroy();
    }
    
    tempChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temperature (°C)',
                data: data.map((value, index) => ({
                    x: labels[index],
                    y: value
                })),
                borderColor: '#FF6384',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day',
                        displayFormats: {
                            day: 'MMM D'
                        }
                    }
                }
            }
        }
    });
}

function createHumidityChart(labels, data) {
    const ctx = document.getElementById('humidityChart').getContext('2d');
    
    if (humidityChart) {
        humidityChart.destroy();
    }
    
    humidityChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Humidity (%)',
                data: data.map((value, index) => ({
                    x: labels[index],
                    y: value
                })),
                borderColor: '#36A2EB',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day',
                        displayFormats: {
                            day: 'MMM D'
                        }
                    }
                }
            }
        }
    });
}

function createWindSpeedChart(labels, data) {
    const ctx = document.getElementById('windSpeed').getContext('2d');
    
    if (windChart) {
        windChart.destroy();
    }
    
    windChart = new Chart(ctx, {
        type: 'line',
        data: {
            datasets: [{
                label: 'Wind Speed (m/s)',
                data: data.map((value, index) => ({
                    x: labels[index],
                    y: value
                })),
                borderColor: '#FFCE56',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day',
                        displayFormats: {
                            day: 'MMM D'
                        }
                    }
                }
            }
        }
    });
}


async function createAQIChart(coords) {
    const ctx = document.getElementById('aqiChart').getContext('2d');
    
    // Destroy the graph if it's already existed
    if (aqiChart) {
        aqiChart.destroy();
    }
    
    try {
        const airQualityUrl = `https://api.openweathermap.org/data/2.5/air_pollution/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}`;
        const response = await fetch(airQualityUrl);
        const data = await response.json();
        
        const timestamps = data.list.map(item => new Date(item.dt * 1000));
        const aqi = data.list.map(item => item.main.aqi);

        aqiChart = new Chart(ctx, {
            type: 'line',
            data: {
                datasets: [{
                    label: 'Air Quality Index',
                    data: aqi.map((value, index) => ({
                        x: timestamps[index],
                        y: value
                    })),
                    borderColor: '#4BC0C0',
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                scales: {
                    x: {
                        type: 'time',
                        time: {
                            unit: 'day',
                            displayFormats: {
                                day: 'MMM D'
                            }
                        }
                    },
                    y: {
                        min: 1,
                        max: 5,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Erreur lors de la création du graphique AQI:', error);
    }
}


// Fonction DESTROY
function destroyAllCharts() {
    if (tempChart) tempChart.destroy();
    if (humidityChart) humidityChart.destroy();
    if (aqiChart) aqiChart.destroy();
    if (windChart) windChart.destroy();
}


async function createEvolutionCharts() {
    try {
        // Détruire les graphiques existants avant d'en créer de nouveaux
        destroyAllCharts();
        
        const coords = await getCoordinates();
        const forecastUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${coords.lat}&lon=${coords.lon}&appid=${API_KEY}&units=metric`;
        const response = await fetch(forecastUrl);
        const data = await response.json();

        const timestamps = data.list.map(item => new Date(item.dt * 1000));
        const temperatures = data.list.map(item => item.main.temp);
        const humidity = data.list.map(item => item.main.humidity);
        const windSpeed = data.list.map(item => item.wind.speed);

        createTemperatureChart(timestamps, temperatures);
        createHumidityChart(timestamps, humidity);
        createWindSpeedChart(timestamps, windSpeed);
        await createAQIChart(coords);
    } catch (error) {
        console.error('Error creation of graph:', error);
    }
}

//-------------------------------------------- Function to update all data ---------------------------------------------------------------
async function updateAllData() {
    try {
        await fetchData();
        await fetchAirQualityData();
        await getFiveDayForecast();
        await createCharts();
        await createEvolutionCharts();
    } catch (error) {
        console.error('Error updating data:', error);
    }
}

// ---------------------------------------------------------- DOM CONTENT LOADED ---------------------------------------------------------------

document.addEventListener('DOMContentLoaded', function() {
    // ------------------------------ NAVIGATION -----------------------------
    const navLinks = document.querySelectorAll('.nav-link');
    const pages = document.querySelectorAll('.page');

    navLinks.forEach(link => { //for each link in the navLinks array
        link.addEventListener('click', (e) => {
            e.preventDefault(); //prevent the default action of the link (in this case, the link is not followed)

            // Remove the active class from all links
            navLinks.forEach(l => l.classList.remove('active')); 
            // Add the active class to the clicked link
            link.classList.add('active');

            // Display the corresponding page
            pages.forEach(page => page.style.display = 'none'); //hide all pages
            const pageId = link.getAttribute('data-page'); //get the data-page attribute of the clicked link
            document.getElementById(pageId).style.display = 'block'; //display the corresponding page

           
        });
    //------------------------- Function to update the city -------------------------
    function updateCity() {
        const newCity = cityInput.value.trim();
        if(newCity !== '') {
            currentCITY = newCity;
            console.log('Current City:',  currentCITY); //Check if the city is updated
            // Update data
            updateAllData();
            // Update the city name
            document.getElementById('cityName').textContent = currentCITY;
        }
    }
    
    // ------------------------------ Search button -----------------------------
    const searchBtn = document.getElementById('searchBtn');
    const cityInput = document.getElementById('city_input');

    // When clicking on the search button
    searchBtn.addEventListener('click', updateCity);

    // When pressing Enter
    cityInput.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') {
            updateCity();
        }
    });
    });

    
    const periodBtns = document.querySelectorAll('.period-btn');
    periodBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            periodBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            createEvolutionCharts(btn.dataset.period);
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
    createEvolutionCharts();
    updateAllData();


    
});

//-------------------------------------------- Get User current location -------------------------------------------------------------

document.getElementById("locationBtn").addEventListener("click", async()=>{
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            console.log('Position actuelle:', latitude, longitude);
            
          
            const response = await fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&appid=${API_KEY}`);
            const data = await response.json();
            if (data.length > 0) {
                currentCITY = data[0].name;   // Update the currentCITY with the user city
                console.log('Current city:', currentCITY);
                
                // update data display and graph
                await updateAllData();
                document.getElementById('cityName').textContent = currentCITY; 
            }
        }, (error) => {
            console.error('Error of localisation:', error);
        });
    } else {
        console.error('The geolocalisation n\'is not support by this navigator.');
    }
});



//---------------------------------- UPDATE DATA EVERY 5 MINUTES ---------------------------------------------------
setInterval(updateAllData, 300000);

