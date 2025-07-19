/**
 * Team Rocket Coordinates Application
 * Handles fetching and displaying Team Rocket invasion data
 */

// Character mapping for invasion types
const characterMap = {
    "bug": ["6", "7"],
    "dark": ["10", "11"],
    "dragon": ["12", "13"],
    "fairy": ["14", "15"],
    "fighting": ["16", "17"],
    "fire": ["18", "19"],
    "flying": ["20", "21"],
    "grass": ["22", "23"],
    "ground": ["24", "25"],
    "ice": ["26", "27"],
    "steel": ["28", "29"],
    "normal": ["30", "31"],
    "poison": ["32", "33"],
    "psychic": ["34", "35"],
    "rock": ["36", "37"],
    "water": ["38", "39"],
    "cliff": ["41"],
    "arlo": ["42"],
    "sierra": ["43"],
    "giovanni": ["44"],
    "ghost": ["47", "48"],
    "electric": ["49", "50"]
};

// API endpoints for different locations
const apiEndpoints = {
    nyc: "https://map.pokego.me/api/rocket/nyc",
    van: "https://map.pokego.me/api/rocket/van",
    syd: "https://map.pokego.me/api/rocket/syd",
    london: "https://map.pokego.me/api/rocket/london",
    sg: "https://map.pokego.me/api/rocket/sg"
};

// Location display names
const locationNames = {
    nyc: "New York City",
    van: "Vancouver", 
    syd: "Sydney",
    london: "London",
    sg: "Singapore"
};

// Global state
let currentData = [];
let updateInterval = null;

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
    setupEventListeners();
    startTimerUpdates();
});

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Form submission
    const form = document.getElementById("rocket-filter-form");
    form.addEventListener("submit", async (e) => {
        e.preventDefault();
        await searchRocketInvasions();
    });

    // Pokemon type selection change - show type image
    document.getElementById("pokemon-type").addEventListener("change", (e) => {
        const selectedType = e.target.value;
        if (selectedType) {
            showTypeImage(selectedType);
        } else {
            hideTypeImage();
        }
    });
}

/**
 * Show type image based on selected pokemon type
 */
function showTypeImage(pokemonType) {
    const typeCard = document.getElementById("type-card");
    const typeImage = document.getElementById("type-image");
    const typeName = document.getElementById("type-name");
    
    const formattedType = pokemonType.toLowerCase();
    const imageUrl = `https://raw.githubusercontent.com/pgcoordinates/pokeresources/legend/docs/${formattedType}.png`;
    
    typeImage.src = imageUrl;
    typeImage.alt = `${pokemonType} type`;
    typeName.textContent = pokemonType.charAt(0).toUpperCase() + pokemonType.slice(1) + " Type";
    
    typeCard.style.display = "block";
}

/**
 * Hide type image
 */
function hideTypeImage() {
    document.getElementById("type-card").style.display = "none";
}

/**
 * Search for Team Rocket invasions
 */
async function searchRocketInvasions() {
    const location = document.getElementById("location").value;
    const pokemonType = document.getElementById("pokemon-type").value;

    if (!location || !pokemonType) {
        showError("Please select both location and invasion type.");
        return;
    }

    // Show loading state
    showLoading();

    try {
        // Fetch data from the selected location
        const response = await fetch(apiEndpoints[location]);
        
        if (!response.ok) {
            throw new Error(`Failed to fetch data: ${response.status}`);
        }

        const data = await response.json();
        
        if (!data.pokestops || !data.pokestops.invasions || !Array.isArray(data.pokestops.invasions)) {
            throw new Error("Invalid data format received");
        }

        // Filter invasions by character type
        const rocketData = data.pokestops.invasions.filter(invasion => 
            characterMap[pokemonType].includes(String(invasion.character))
        );

        if (rocketData.length === 0) {
            showNoResults(locationNames[location], pokemonType);
            return;
        }

        // Sort by invasion_end in descending order and get the last 10 results
        const sortedData = rocketData
            .sort((a, b) => b.invasion_end - a.invasion_end)
            .slice(0, 10);

        // Store current data for timer updates
        currentData = sortedData.map(invasion => ({
            ...invasion,
            location: locationNames[location],
            type: pokemonType
        }));

        // Display results
        displayResults(currentData);

    } catch (error) {
        console.error("Error fetching rocket data:", error);
        showError(`Failed to fetch invasion data: ${error.message}`);
    }
}

/**
 * Display the invasion results
 */
function displayResults(invasions) {
    const resultsContainer = document.getElementById("results-container");
    const invasionResults = document.getElementById("invasion-results");
    const invasionCount = document.getElementById("invasion-count");

    // Hide other states
    hideAllStates();

    // Update count
    invasionCount.textContent = `${invasions.length} found`;

    // Clear previous results
    invasionResults.innerHTML = "";

    // Populate table
    invasions.forEach((invasion, index) => {
        const row = createInvasionRow(invasion, index);
        invasionResults.appendChild(row);
    });

    // Show results
    resultsContainer.style.display = "block";
}

/**
 * Create a table row for an invasion
 */
function createInvasionRow(invasion, index) {
    const row = document.createElement("tr");
    
    const coordinates = `${invasion.lat},${invasion.lng}`;
    const timeRemaining = getTimeRemaining(invasion.invasion_end);
    const typeDisplay = invasion.type.charAt(0).toUpperCase() + invasion.type.slice(1);
    
    row.innerHTML = `
        <td>
            <div>
                <div class="fw-bold">${invasion.name || 'Unknown Pokestop'}</div>
                <small class="text-muted">${invasion.location}</small>
            </div>
        </td>
        <td>
            <div class="d-flex align-items-center">
                <img src="https://raw.githubusercontent.com/pgcoordinates/pokeresources/legend/docs/${invasion.type.toLowerCase()}.png" 
                     alt="${typeDisplay}" 
                     class="me-2"
                     style="width: 30px; height: 30px; object-fit: contain;"
                     onerror="this.style.display='none'">
                <span>${typeDisplay}</span>
            </div>
        </td>
        <td>
            <code class="text-info">${coordinates}</code>
        </td>
        <td>
            <span class="timer ${getTimerClass(timeRemaining.minutes)}" 
                  data-end-time="${invasion.invasion_end}">
                ${timeRemaining.display}
            </span>
        </td>
        <td>
            <div class="btn-group btn-group-sm">
                <button class="btn btn-outline-primary" 
                        onclick="copyCoordinates('${coordinates}')"
                        title="Copy coordinates">
                    <i class="fas fa-copy"></i>
                </button>
                <button class="btn btn-outline-success" 
                        onclick="openGoogleMaps('${invasion.lat}', '${invasion.lng}')"
                        title="Open in Google Maps">
                    <i class="fas fa-map-marked-alt"></i>
                </button>
            </div>
        </td>
    `;
    
    return row;
}

/**
 * Get time remaining until invasion ends
 */
function getTimeRemaining(invasionEnd) {
    const now = Math.floor(Date.now() / 1000);
    const remaining = invasionEnd - now;
    
    if (remaining <= 0) {
        return { minutes: 0, display: "Expired" };
    }
    
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    
    return {
        minutes: minutes,
        display: `${minutes}m ${seconds}s`
    };
}

/**
 * Get CSS class for timer based on minutes remaining
 */
function getTimerClass(minutes) {
    if (minutes > 15) return "timer-green";
    if (minutes > 10) return "timer-white";
    if (minutes > 5) return "timer-yellow";
    return "timer-red";
}

/**
 * Copy coordinates to clipboard
 */
async function copyCoordinates(coordinates) {
    try {
        await navigator.clipboard.writeText(coordinates);
        showNotification("Coordinates copied to clipboard!", "success");
    } catch (err) {
        console.error("Failed to copy coordinates:", err);
        showNotification("Failed to copy coordinates", "error");
    }
}

/**
 * Open coordinates in Google Maps
 */
function openGoogleMaps(lat, lng) {
    const url = `https://www.google.com/maps?q=${lat},${lng}`;
    window.open(url, "_blank");
}

/**
 * Start timer updates for invasion countdowns
 */
function startTimerUpdates() {
    // Update timers every second
    updateInterval = setInterval(() => {
        const timers = document.querySelectorAll(".timer[data-end-time]");
        timers.forEach(timer => {
            const endTime = parseInt(timer.dataset.endTime);
            const timeRemaining = getTimeRemaining(endTime);
            
            timer.textContent = timeRemaining.display;
            timer.className = `timer ${getTimerClass(timeRemaining.minutes)}`;
            
            // If expired, mark the row
            if (timeRemaining.minutes === 0) {
                const row = timer.closest("tr");
                if (row) {
                    row.classList.add("table-secondary");
                    row.style.opacity = "0.6";
                }
            }
        });
    }, 1000);
}

/**
 * Show loading state
 */
function showLoading() {
    hideAllStates();
    document.getElementById("loading-spinner").style.display = "block";
}

/**
 * Show error message
 */
function showError(message) {
    hideAllStates();
    document.getElementById("error-text").textContent = message;
    document.getElementById("error-message").style.display = "block";
    document.getElementById("invasion-count").textContent = "0 found";
}

/**
 * Show no results message
 */
function showNoResults(location, type) {
    hideAllStates();
    const emptyResults = document.getElementById("empty-results");
    emptyResults.innerHTML = `
        <i class="fas fa-search fa-3x mb-3 text-secondary"></i>
        <p class="lead">No ${type} invasions found</p>
        <p class="text-muted">No Team Rocket invasions of type "${type}" were found in ${location}.</p>
        <p class="text-muted">Try a different type or location, or check back later.</p>
    `;
    emptyResults.style.display = "block";
    document.getElementById("invasion-count").textContent = "0 found";
}

/**
 * Hide all state containers
 */
function hideAllStates() {
    document.getElementById("loading-spinner").style.display = "none";
    document.getElementById("empty-results").style.display = "none";
    document.getElementById("error-message").style.display = "none";
    document.getElementById("results-container").style.display = "none";
}

/**
 * Show notification toast
 */
function showNotification(message, type = 'info') {
    // Map types to Bootstrap classes
    const typeClasses = {
        success: 'bg-success',
        error: 'bg-danger',
        info: 'bg-info',
        warning: 'bg-warning'
    };
    
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector('.toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toastElement = document.createElement('div');
    toastElement.className = `toast ${typeClasses[type] || 'bg-secondary'} text-white`;
    toastElement.setAttribute('role', 'alert');
    toastElement.setAttribute('aria-live', 'assertive');
    toastElement.setAttribute('aria-atomic', 'true');
    
    toastElement.innerHTML = `
        <div class="toast-header">
            <strong class="me-auto">Pokemon GO Coordinates</strong>
            <button type="button" class="btn-close" data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
        <div class="toast-body">
            ${message}
        </div>
    `;
    
    toastContainer.appendChild(toastElement);
    
    // Initialize and show toast
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    
    // Remove from DOM after hiding
    toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
    });
}

// Clean up interval on page unload
window.addEventListener('beforeunload', () => {
    if (updateInterval) {
        clearInterval(updateInterval);
    }
});