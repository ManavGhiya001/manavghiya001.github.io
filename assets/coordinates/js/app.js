/**
 * Pokémon GO Coordinates Application
 * Main application logic
 */

// Global state
const appState = {
  pokemonData: [],
  filteredData: [],
  locations: {
    nyc: "New York City",
    syd: "Sydney",
    london: "London",
    sg: "Singapore",
    van: "Vancouver",
  },
  selectedLocation: "all",
  currentFilters: {},
  currentSort: { type: "despawn", direction: "desc" }, // Default sorting by despawn time (latest first)
  loading: false,
  error: null,
  debuggedPokemonCount: 0, // Counter for debugging
};

// Initialize the application
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Initialize Pokemon Data
    await initializePokemonData();

    // Set up event listeners
    setupEventListeners();

    // Set up level input validation
    const levelInput = document.getElementById("min-level");
    levelInput.addEventListener("change", () => {
      // Ensure the value is within valid range
      let value = parseInt(levelInput.value);
      if (isNaN(value)) value = 1;
      if (value < 1) value = 1;
      if (value > 35) value = 35;

      // Update the input
      levelInput.value = value;
    });

    // Set up CP input validation
    const cpInput = document.getElementById("min-cp");
    cpInput.addEventListener("change", () => {
      // Ensure the value is within valid range
      let value = parseInt(cpInput.value);
      if (isNaN(value)) value = 0;
      if (value < 0) value = 0;
      if (value > 5000) value = 5000;

      // Update the input
      cpInput.value = value;
    });

    // Display initial message instead of auto-searching
    document.getElementById("empty-results").innerHTML = `
      <i class="fas fa-search fa-3x mb-3 text-secondary"></i>
      <p class="lead">Welcome to Pokémon GO Coordinates!</p>
      <p class="text-muted">Configure your search options and click the Search button to find Pokémon.</p>
    `;
    document.getElementById("empty-results").style.display = "block";
    document.getElementById("pokemon-table").style.display = "none";
    document.getElementById("pokemon-count").textContent = "0 found";
  } catch (error) {
    console.error("Failed to initialize app:", error);
    showError("Failed to initialize the application. Please try again later.");
  }
});

/**
 * Set up event listeners for the application
 */
function setupEventListeners() {
  // Form submission
  const filterForm = document.getElementById("pokemon-filter-form");
  filterForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    await searchPokemon();
  });

  // Location selection change
  document.getElementById("location").addEventListener("change", (e) => {
    appState.selectedLocation = e.target.value;
  });

  // IV Filter type toggle
  document.getElementById("iv-filter-raw").addEventListener("change", () => {
    document.getElementById("raw-iv-inputs").style.display = "flex";
    document.getElementById("min-iv-input").style.display = "none";
  });

  document.getElementById("iv-filter-min").addEventListener("change", () => {
    document.getElementById("raw-iv-inputs").style.display = "none";
    document.getElementById("min-iv-input").style.display = "flex";
  });

  // Set up sort icons
  document.querySelectorAll(".sort-icon").forEach((icon) => {
    icon.addEventListener("click", () => {
      const sortType = icon.dataset.sort;

      // If same column is clicked again, toggle direction
      if (appState.currentSort && appState.currentSort.type === sortType) {
        appState.currentSort.direction =
          appState.currentSort.direction === "asc" ? "desc" : "asc";
      } else {
        // New sort column, default to descending for most (ascending for level/cp)
        const defaultDirection =
          sortType === "level" || sortType === "cp" ? "desc" : "asc";
        appState.currentSort = { type: sortType, direction: defaultDirection };
      }

      // Update icons
      updateSortIcons();

      // Resort and redisplay
      if (appState.filteredData.length > 0) {
        sortPokemons(appState.filteredData);
        displayResults(appState.filteredData, false); // Don't resort again in displayResults
      }
    });
  });

  // Set up copy coords event delegation
  document.getElementById("pokemon-results").addEventListener("click", (e) => {
    const button = e.target.closest(".copy-coords-btn");
    if (button) {
      const coords = button.dataset.coords;
      navigator.clipboard
        .writeText(coords)
        .then(() => {
          // Change button text/appearance temporarily
          const originalHTML = button.innerHTML;
          button.innerHTML = '<i class="fas fa-check"></i>';
          button.classList.add("btn-success");
          button.classList.remove("btn-outline-secondary");

          // Show notification
          showNotification("Coordinates copied to clipboard!", "success");

          // Reset after a moment
          setTimeout(() => {
            button.innerHTML = originalHTML;
            button.classList.remove("btn-success");
            button.classList.add("btn-outline-secondary");
          }, 1500);
        })
        .catch((err) => {
          console.error("Failed to copy coordinates:", err);
          showNotification("Failed to copy coordinates", "error");
        });
    }
  });
}

/**
 * Update sort icons based on current sort state
 */
function updateSortIcons() {
  document.querySelectorAll(".sort-icon").forEach((icon) => {
    // Reset all icons
    icon.innerHTML = '<i class="fas fa-sort"></i>';
    icon.classList.remove("active");

    // Apply active state if this is the current sort
    if (
      appState.currentSort &&
      icon.dataset.sort === appState.currentSort.type
    ) {
      icon.classList.add("active");

      if (appState.currentSort.direction === "asc") {
        icon.innerHTML = '<i class="fas fa-sort-up"></i>';
      } else {
        icon.innerHTML = '<i class="fas fa-sort-down"></i>';
      }
    }
  });
}

/**
 * Sort pokemons based on current sort settings
 * @param {Array} pokemons - Array of pokemon objects
 */
function sortPokemons(pokemons) {
  if (!appState.currentSort) {
    // Default sort by despawn time (latest first)
    pokemons.sort((a, b) => b.despawn - a.despawn);
    return;
  }

  const { type, direction } = appState.currentSort;
  const modifier = direction === "asc" ? 1 : -1;

  // Secondary sort by despawn time for tie-breaking
  const secondarySort = (a, b) => b.despawn - a.despawn;

  switch (type) {
    case "pokemon":
      pokemons.sort((a, b) => {
        const nameA = getPokemonNameById(a.pokemon_id) || "";
        const nameB = getPokemonNameById(b.pokemon_id) || "";
        const result = nameA.localeCompare(nameB) * modifier;
        // If names are the same, use despawn time as secondary sort
        return result !== 0 ? result : secondarySort(a, b);
      });
      break;

    case "iv":
      pokemons.sort((a, b) => {
        // Calculate IV percentages
        const ivA =
          a.attack !== -1
            ? ((a.attack + a.defence + a.stamina) / 45) * 100
            : -1;
        const ivB =
          b.attack !== -1
            ? ((b.attack + b.defence + b.stamina) / 45) * 100
            : -1;

        // If both have unknown IVs, sort by despawn time
        if (ivA === -1 && ivB === -1) return secondarySort(a, b);

        // Unknown values should always be at the bottom regardless of sort direction
        if (ivA === -1) return 1; // Always put unknown values at the end
        if (ivB === -1) return -1; // Always put unknown values at the end

        const result = (ivA - ivB) * modifier;
        return result !== 0 ? result : secondarySort(a, b);
      });
      break;

    case "level":
      pokemons.sort((a, b) => {
        // If both have unknown levels, sort by despawn time
        if (a.level === -1 && b.level === -1) return secondarySort(a, b);

        // Unknown values should always be at the bottom regardless of sort direction
        if (a.level === -1) return 1; // Always put unknown values at the end
        if (b.level === -1) return -1; // Always put unknown values at the end

        const result = (a.level - b.level) * modifier;
        return result !== 0 ? result : secondarySort(a, b);
      });
      break;

    case "cp":
      pokemons.sort((a, b) => {
        // If both have unknown CP, sort by despawn time
        if (a.cp === -1 && b.cp === -1) return secondarySort(a, b);

        // Unknown values should always be at the bottom regardless of sort direction
        if (a.cp === -1) return 1; // Always put unknown values at the end
        if (b.cp === -1) return -1; // Always put unknown values at the end

        const result = (a.cp - b.cp) * modifier;
        return result !== 0 ? result : secondarySort(a, b);
      });
      break;

    case "despawn":
      pokemons.sort((a, b) => (a.despawn - b.despawn) * modifier);
      break;

    default:
      // Default to despawn time
      pokemons.sort((a, b) => b.despawn - a.despawn);
  }
}

/**
 * Search for Pokemon based on current filters
 */
async function searchPokemon() {
  try {
    // Show loading state
    setLoadingState(true);
    hideError();

    // Collect filter values
    const selectedPokemon = window.getSelectedPokemonIds();
    console.log(
      "Selected Pokemon for search:",
      typeof selectedPokemon,
      selectedPokemon,
    );

    const filters = {
      location: document.getElementById("location").value,
      selectedPokemon: selectedPokemon, // Gets either 'all' or an array of IDs
      useMinIvPercentage: document.getElementById("iv-filter-min").checked,
      minIvPercentage:
        parseInt(document.getElementById("min-iv-percentage").value) || 0,
      minAttack: parseInt(document.getElementById("min-attack").value) || 0,
      minDefense: parseInt(document.getElementById("min-defense").value) || 0,
      minStamina: parseInt(document.getElementById("min-stamina").value) || 0,
      minLevel: parseInt(document.getElementById("min-level").value) || 1,
      minCP: parseInt(document.getElementById("min-cp").value) || 0,
      showPerfect: document.getElementById("show-perfect").checked,
      pokemonSize: document.getElementById("pokemon-size").value, // Add size filter
    };

    // Save current filters
    appState.currentFilters = filters;

    // Check if at least one filter is configured
    const hasActiveFilter = 
      filters.minIvPercentage > 0 || 
      filters.minAttack > 0 || 
      filters.minDefense > 0 || 
      filters.minStamina > 0 || 
      filters.minLevel > 1 || 
      filters.minCP > 0 || 
      filters.showPerfect ||
      (filters.pokemonSize && filters.pokemonSize !== 'any') ||
      (Array.isArray(filters.selectedPokemon) && filters.selectedPokemon.length > 0 && filters.selectedPokemon.length < 1010); // Selected specific Pokémon (not all)

    if (!hasActiveFilter) {
      setLoadingState(false);
      showError("Please configure at least one filter before searching.");
      return;
    }

    // Determine which locations to search
    let locationsToSearch = [];
    if (filters.location === "all") {
      locationsToSearch = Object.keys(appState.locations);
    } else {
      locationsToSearch = [filters.location];
    }

    // Show notification for multiple locations
    if (locationsToSearch.length > 1) {
      showNotification(
        `Searching ${locationsToSearch.length} locations. This may take a moment...`,
        "info",
      );
    }

    // Fetch data from all required locations
    const fetchPromises = locationsToSearch.map((loc) => fetchPokemonData(loc));

    // Use Promise.allSettled to handle partial failures
    const results = await Promise.allSettled(fetchPromises);

    // Combine results from all locations
    let allPokemons = [];
    let failedLocations = [];

    results.forEach((result, index) => {
      if (
        result.status === "fulfilled" &&
        result.value &&
        result.value.pokemons
      ) {
        // Add location info to each pokemon
        const location = locationsToSearch[index];
        const pokemonsWithLocation = result.value.pokemons.map((pokemon) => ({
          ...pokemon,
          location,
        }));
        allPokemons = [...allPokemons, ...pokemonsWithLocation];
      } else {
        // Track failed locations
        failedLocations.push(appState.locations[locationsToSearch[index]]);
      }
    });

    // Notify about any failed locations
    if (failedLocations.length > 0) {
      const failedLocationsList = failedLocations.join(", ");
      showNotification(
        `Could not fetch data from: ${failedLocationsList}`,
        "warning",
      );
    }

    // Apply filters
    const filteredPokemons = filterPokemons(allPokemons, filters);

    // Update state
    appState.pokemonData = allPokemons;
    appState.filteredData = filteredPokemons;

    // Display results
    displayResults(filteredPokemons);

    // Show total count notification if successful
    if (allPokemons.length > 0) {
      showNotification(
        `Found ${filteredPokemons.length} of ${allPokemons.length} total Pokémon matching your criteria.`,
        "success",
      );
    }
  } catch (error) {
    console.error("Search failed:", error);
    showError("Failed to search for Pokémon. Please try again later.");
  } finally {
    setLoadingState(false);
  }
}

/**
 * Fetch Pokemon data from the specified location
 * Tries primary API, falls back to secondary if primary fails
 * @param {string} location - Location code (nyc, syd, etc.)
 * @returns {Promise<Object>} - Pokemon data response
 */
async function fetchPokemonData(location) {
  const primaryURL = `https://map.pokego.me/api/coords/${location}`;
  const fallbackURL = `https://pokecoords-js.onrender.com/api/coords/${location}`;

  try {
    let response = await fetch(primaryURL);
    if (!response.ok) {
      throw new Error(`Primary API error: ${response.statusText}`);
    }
    return await response.json();
  } catch (primaryError) {
    console.warn(`Primary fetch failed for ${location}, trying fallback...`, primaryError);

    try {
      let fallbackResponse = await fetch(fallbackURL);
      if (!fallbackResponse.ok) {
        if (fallbackResponse.status === 429) {
          throw new Error("Rate limit exceeded. Please try again in a minute.");
        }
        throw new Error(`Fallback API error: ${fallbackResponse.statusText}`);
      }
      return await fallbackResponse.json();
    } catch (fallbackError) {
      console.error(`Both fetch attempts failed for ${location}:`, fallbackError);
      throw fallbackError;
    }
  }
}

/**
 * Filter pokemons based on user-selected criteria
 * @param {Array} pokemons - Array of pokemon objects
 * @param {Object} filters - Filter criteria
 * @returns {Array} - Filtered pokemon array
 */
function filterPokemons(pokemons, filters) {
  return pokemons.filter((pokemon) => {
    // Skip Pokemon with less than 1 minute left
    const timeLeft = calculateTimeLeft(pokemon.despawn);
    if (timeLeft.minutes < 1) return false;
    // Filter by Pokemon ID if specified
    if (filters.selectedPokemon !== "all") {
      // Check if the pokemon's ID is in the array of selected IDs
      const pokemonId = parseInt(pokemon.pokemon_id);

      // Convert array-like object to actual array if needed
      let selectedPokemonArray = filters.selectedPokemon;
      if (
        typeof selectedPokemonArray !== "string" &&
        !Array.isArray(selectedPokemonArray)
      ) {
        selectedPokemonArray = Array.from(selectedPokemonArray);
      }

      // Check if this Pokemon ID is in the selected list
      const isSelected =
        Array.isArray(selectedPokemonArray) &&
        selectedPokemonArray.includes(pokemonId);

      // Debug output for all Pokemon (limited to first 20)
      if (appState.debuggedPokemonCount < 20) {
        console.log(
          `Pokemon #${appState.debuggedPokemonCount++}: ID ${pokemonId}, Name: ${getPokemonNameById(pokemonId)}, Is Selected: ${isSelected}`,
        );
      }

      if (!isSelected) {
        return false;
      }
    }

    // Check if IV data is available
    const hasIvData =
      pokemon.attack !== -1 && pokemon.defence !== -1 && pokemon.stamina !== -1;

    // Apply IV filters only if we're actively filtering by IVs
    const isFilteringByIv =
      (filters.useMinIvPercentage && filters.minIvPercentage > 0) ||
      (!filters.useMinIvPercentage &&
        (filters.minAttack > 0 ||
          filters.minDefense > 0 ||
          filters.minStamina > 0)) ||
      filters.showPerfect;

    // If we're filtering by IV but this Pokemon has no IV data, exclude it
    if (isFilteringByIv && !hasIvData) {
      return false;
    }

    // If Pokemon has IV data, apply IV filters
    if (hasIvData) {
      // Use the appropriate IV filtering method based on the user's selection
      if (filters.useMinIvPercentage && filters.minIvPercentage > 0) {
        // Calculate IV percentage and filter by minimum percentage
        const ivPercentage =
          ((pokemon.attack + pokemon.defence + pokemon.stamina) / 45) * 100;
        if (ivPercentage < filters.minIvPercentage) return false;
      } else {
        // Filter by individual IV values - exact match if they are set
        if (filters.minAttack > 0 && pokemon.attack !== filters.minAttack)
          return false;
        if (filters.minDefense > 0 && pokemon.defence !== filters.minDefense)
          return false;
        if (filters.minStamina > 0 && pokemon.stamina !== filters.minStamina)
          return false;
      }

      // Filter by perfect IV
      if (
        filters.showPerfect &&
        (pokemon.attack !== 15 ||
          pokemon.defence !== 15 ||
          pokemon.stamina !== 15)
      ) {
        return false;
      }
    }

    // Apply level filter only if we're actively filtering by level
    if (filters.minLevel > 1) {
      // If level data is unavailable and we're filtering by level, exclude
      if (pokemon.level === -1) return false;

      // Filter by level
      if (pokemon.level < filters.minLevel) return false;
    }

    // Apply CP filter only if we're actively filtering by CP
    if (filters.minCP > 0) {
      // If CP data is unavailable and we're filtering by CP, exclude
      if (pokemon.cp === -1) return false;

      // Filter by CP
      if (pokemon.cp < filters.minCP) return false;
    }
    
    // Apply size filter if a specific size is selected
    if (filters.pokemonSize && filters.pokemonSize !== 'any') {
      // Handle combined size options
      if (filters.pokemonSize === 'xl_xxl') {
        // Keep only XL (4) and XXL (5) sized Pokémon
        if (pokemon.size === undefined || (pokemon.size !== 4 && pokemon.size !== 5)) {
          return false;
        }
      } else if (filters.pokemonSize === 'xs_xxs') {
        // Keep only XS (2) and XXS (1) sized Pokémon
        if (pokemon.size === undefined || (pokemon.size !== 2 && pokemon.size !== 1)) {
          return false;
        }
      } else {
        // Standard single size filter
        // If the pokemon doesn't have a size property or it doesn't match the selected size
        if (pokemon.size === undefined || pokemon.size !== parseInt(filters.pokemonSize)) {
          return false;
        }
      }
    }

    return true;
  });
}

/**
 * Display results in the UI
 * @param {Array} pokemons - Array of filtered pokemon objects
 * @param {boolean} [shouldSort=true] - Whether to sort the pokemons before displaying
 */
function displayResults(pokemons, shouldSort = true) {
  const resultsContainer = document.getElementById("pokemon-results");
  const emptyResults = document.getElementById("empty-results");
  const pokemonCount = document.getElementById("pokemon-count");

  // Clear previous results
  resultsContainer.innerHTML = "";

  // Update pokemon count
  pokemonCount.textContent = `${pokemons.length} found`;

  // Show empty state if no results
  if (pokemons.length === 0) {
    // Use the saved filters from appState
    const filters = appState.currentFilters || {};

    // Create or update the empty state with filter information
    emptyResults.innerHTML = `
      <i class="fas fa-search fa-3x mb-3 text-secondary"></i>
      <p class="lead">No Pokémon found with these filters.</p>
      <div id="applied-filters" class="card mx-auto my-3" style="max-width: 400px;">
        <div class="card-header">
          Applied Filters
        </div>
        <ul class="list-group list-group-flush">
          <li class="list-group-item d-flex justify-content-between">
            <span>Location:</span>
            <span class="fw-bold">${filters.location === "all" ? "All Locations" : filters.location ? appState.locations[filters.location] : "Not specified"}</span>
          </li>
          <li class="list-group-item d-flex justify-content-between">
            <span>Pokémon:</span>
            <span class="fw-bold">${
              !filters.selectedPokemon
                ? "Not specified"
                : filters.selectedPokemon === "all"
                  ? "All Pokémon"
                  : Array.isArray(filters.selectedPokemon)
                    ? `${filters.selectedPokemon.length} Pokémon selected`
                    : "Unknown selection"
            }</span>
          </li>
          <li class="list-group-item d-flex justify-content-between">
            <span>IV Filter:</span>
            <span class="fw-bold">${
              !filters.useMinIvPercentage
                ? filters.minAttack || filters.minDefense || filters.minStamina
                  ? `ATK ≥ ${filters.minAttack || 0}, DEF ≥ ${filters.minDefense || 0}, STA ≥ ${filters.minStamina || 0}`
                  : "Not specified"
                : `Min ${filters.minIvPercentage || 0}%`
            }</span>
          </li>
          <li class="list-group-item d-flex justify-content-between">
            <span>Level:</span>
            <span class="fw-bold">Min Level ${filters.minLevel || 1}</span>
          </li>
          <li class="list-group-item d-flex justify-content-between">
            <span>CP:</span>
            <span class="fw-bold">Min CP ${filters.minCP || 0}</span>
          </li>
          <li class="list-group-item d-flex justify-content-between">
            <span>Size:</span>
            <span class="fw-bold">${
              !filters.pokemonSize || filters.pokemonSize === 'any' 
                ? 'Any' 
                : filters.pokemonSize === '5'
                  ? 'XXL Only'
                  : filters.pokemonSize === '4'
                    ? 'XL Only'
                    : filters.pokemonSize === 'xl_xxl'
                      ? 'XL & XXL'
                      : filters.pokemonSize === '3'
                        ? 'Normal Only'
                        : filters.pokemonSize === '2'
                          ? 'XS Only'
                          : filters.pokemonSize === '1'
                            ? 'XXS Only'
                            : filters.pokemonSize === 'xs_xxs'
                              ? 'XS & XXS'
                              : 'Unknown'
            }</span>
          </li>
        </ul>
      </div>
      <p class="text-muted">Try adjusting your search criteria.</p>
    `;

    emptyResults.style.display = "block";
    document.getElementById("pokemon-table").style.display = "none";
    return;
  }

  // Hide empty state, show table
  emptyResults.style.display = "none";
  document.getElementById("pokemon-table").style.display = "table";

  // Sort pokemons if requested
  if (shouldSort) {
    sortPokemons(pokemons);
  }

  // Set default sort in appState if not already set
  if (!appState.currentSort) {
    appState.currentSort = { type: "despawn", direction: "desc" };
    updateSortIcons();
  }

  // Create and append each pokemon row
  pokemons.forEach((pokemon) => {
    const row = createPokemonRow(pokemon);
    resultsContainer.appendChild(row);
  });
}

/**
 * Create a table row for a Pokemon
 * @param {Object} pokemon - Pokemon data object
 * @returns {HTMLElement} - Table row element
 */
function createPokemonRow(pokemon) {
  const row = document.createElement("tr");

  // Get pokemon name from ID
  const pokemonName =
    getPokemonNameById(pokemon.pokemon_id) || `#${pokemon.pokemon_id}`;
  const isShiny = pokemon.shiny === 1;
  const isPerfect =
    pokemon.attack === 15 && pokemon.defence === 15 && pokemon.stamina === 15;

  // Calculate IV percentage if available
  let ivPercentage = "?";
  if (
    pokemon.attack !== -1 &&
    pokemon.defence !== -1 &&
    pokemon.stamina !== -1
  ) {
    ivPercentage = Math.round(
      ((pokemon.attack + pokemon.defence + pokemon.stamina) / 45) * 100,
    );
  }

  // Create despawn timer
  const timeLeft = calculateTimeLeft(pokemon.despawn);
  
  // Determine color class based on remaining time
  let timeLeftClass = "";
  if (timeLeft.minutes > 15) {
    timeLeftClass = "timer-green";  // > 15 minutes - green
  } else if (timeLeft.minutes >= 10) {
    timeLeftClass = "timer-white";  // 10-15 minutes - white
  } else if (timeLeft.minutes >= 5) {
    timeLeftClass = "timer-yellow"; // 5-10 minutes - yellow
  } else {
    timeLeftClass = "timer-red";    // 1-5 minutes - red
  }

  // Row content
  row.innerHTML = `
    <td>
      <div class="pokemon-info">
        <img src="https://raw.githubusercontent.com/ManavGhiya001/pokemons/master/UICONS_OS/pokemon/${pokemon.pokemon_id}.png" 
             alt="${pokemonName}"
             class="pokemon-sprite me-2"
             onerror="this.onerror=null; this.src='https://raw.githubusercontent.com/ManavGhiya/pokemon-info/refs/heads/main/unknown.png'">
        <div>
          <div class="pokemon-name">${pokemonName} ${isShiny ? '<i class="fas fa-star shiny-icon" title="Shiny"></i>' : ""} <span class="${timeLeftClass}">(${timeLeft.minutes}m)</span></div>
          <div class="d-flex flex-wrap mt-1">
            <span class="badge bg-secondary location-badge me-1">
              <i class="fas fa-map-pin me-1"></i>${getLocationName(pokemon.location)}
            </span>
            ${pokemon.attack === -1 ? '<span class="badge bg-warning text-dark stats-badge me-1" title="Stats Unknown">Stats Unknown</span>' : ""}
            ${pokemon.size ? 
              `<span class="badge ${
                pokemon.size === 5 ? 'bg-purple' : 
                pokemon.size === 4 ? 'bg-info' : 
                pokemon.size === 3 ? 'bg-secondary' : 
                pokemon.size === 2 ? 'bg-primary' : 'bg-dark'
              } size-badge me-1">
                ${pokemon.size === 5 ? 'XXL' : 
                  pokemon.size === 4 ? 'XL' : 
                  pokemon.size === 3 ? 'Normal' : 
                  pokemon.size === 2 ? 'XS' : 'XXS'}
              </span>` : ""}
          </div>
          <div class="d-flex mt-1">
            <a href="https://www.google.com/maps?q=${pokemon.lat},${pokemon.lng}" target="_blank" class="btn btn-sm btn-outline-secondary map-button me-2">
              <i class="fas fa-map-marker-alt"></i>
            </a>
            <button class="btn btn-sm btn-outline-secondary copy-coords-btn" 
                    data-coords="${pokemon.lat},${pokemon.lng}"
                    title="Copy Coordinates">
              Coords <i class="fas fa-copy"></i>
            </button>
          </div>
        </div>
      </div>
    </td>
    <td>
      ${
        isPerfect
          ? `<span class="badge perfect-iv">100% IV</span>`
          : `<div>
          ${
            pokemon.attack !== -1
              ? `${ivPercentage}%
            <div class="small">
              <div class="d-flex justify-content-between">
                <span>ATK</span><span>${pokemon.attack}/15</span>
              </div>
              <div class="progress iv-bar">
                <div class="progress-bar iv-atk" style="width: ${(pokemon.attack / 15) * 100}%"></div>
              </div>
              <div class="d-flex justify-content-between">
                <span>DEF</span><span>${pokemon.defence}/15</span>
              </div>
              <div class="progress iv-bar">
                <div class="progress-bar iv-def" style="width: ${(pokemon.defence / 15) * 100}%"></div>
              </div>
              <div class="d-flex justify-content-between">
                <span>STA</span><span>${pokemon.stamina}/15</span>
              </div>
              <div class="progress iv-bar">
                <div class="progress-bar iv-sta" style="width: ${(pokemon.stamina / 15) * 100}%"></div>
              </div>
            </div>`
              : `<span class="text-muted">Unknown</span>
             <div class="small text-muted">Stats not available for this spawn</div>`
          }
        </div>`
      }
    </td>
    <td>
      ${
        pokemon.level !== -1
          ? `<span class="badge bg-info level-badge">${pokemon.level}</span>`
          : `<span class="text-muted">?</span>`
      }
    </td>
    <td>
      ${
        pokemon.cp !== -1
          ? `<span class="badge bg-primary cp-badge">${pokemon.cp}</span>`
          : `<span class="text-muted">?</span>`
      }
    </td>
  `;

  return row;
}

/**
 * Set the loading state of the UI
 * @param {boolean} isLoading - Whether the app is in loading state
 */
function setLoadingState(isLoading) {
  const loadingContainer = document.getElementById("loading-container");
  const pokemonTable = document.getElementById("pokemon-table");
  const emptyResults = document.getElementById("empty-results");

  appState.loading = isLoading;

  if (isLoading) {
    loadingContainer.style.display = "block";
    pokemonTable.style.display = "none";
    emptyResults.style.display = "none";
  } else {
    loadingContainer.style.display = "none";
  }
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
  const errorContainer = document.getElementById("error-container");
  const errorMessage = document.getElementById("error-message");

  errorMessage.textContent = message;
  errorContainer.style.display = "block";

  appState.error = message;
}

/**
 * Hide error message
 */
function hideError() {
  const errorContainer = document.getElementById("error-container");
  errorContainer.style.display = "none";
  appState.error = null;
}

/**
 * Get a user-friendly location name from location code
 * @param {string} locationCode - Location code (nyc, syd, etc.)
 * @returns {string} - User-friendly location name
 */
function getLocationName(locationCode) {
  const locationNames = {
    nyc: "New York",
    syd: "Sydney",
    london: "London",
    sg: "Singapore",
    van: "Vancouver",
    // Add more location mappings as needed
  };

  return locationNames[locationCode] || locationCode.toUpperCase();
}

/**
 * Calculate time left before pokemon despawns
 * @param {number} despawnTimestamp - Unix timestamp when pokemon despawns
 * @returns {Object} - Object with minutes left
 */
function calculateTimeLeft(despawnTimestamp) {
  const now = Math.floor(Date.now() / 1000);
  const secondsLeft = despawnTimestamp - now;

  if (secondsLeft <= 0) {
    return { minutes: 0 };
  }

  // Convert all time to minutes
  const totalMinutes = Math.floor(secondsLeft / 60);
  
  return { minutes: totalMinutes };
}
