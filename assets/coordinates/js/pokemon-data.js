/**
 * Pokemon Data Module
 * Handles loading and caching of Pokemon name/ID data
 */

// Global Pokemon data cache
let pokemonNameMap = new Map();
let pokemonIdMap = new Map();
let pokemonSelectInitialized = false;

/**
 * Initialize Pokemon data by fetching from GitHub
 */
async function initializePokemonData() {
  try {
    // Fetch Pokemon name to ID map
    const nameToIdResponse = await fetch('https://raw.githubusercontent.com/ManavGhiya/pokemon-info/refs/heads/main/pokemon_name_to_pokemon_id.json');
    if (!nameToIdResponse.ok) throw new Error('Failed to fetch Pokemon name data');
    const nameToIdData = await nameToIdResponse.json();
    
    // Fetch move ID to name map
    const moveIdResponse = await fetch('https://raw.githubusercontent.com/ManavGhiya/pokemon-info/refs/heads/main/pokemon_move_id_to_name.json');
    if (!moveIdResponse.ok) throw new Error('Failed to fetch move data');
    const moveIdData = await moveIdResponse.json();
    
    // Process and store Pokemon data
    for (const [name, id] of Object.entries(nameToIdData)) {
      pokemonNameMap.set(name.toLowerCase(), id);
      pokemonIdMap.set(parseInt(id), name); // Ensure ID is stored as integer
    }
    
    // Debug output to see if data is loaded correctly
    console.log(`Loaded ${pokemonIdMap.size} Pokemon names`);
    
    // Print some sample pokemon names for debugging
    for (let i = 1; i <= 10; i++) {
      console.log(`Pokemon #${i}: ${pokemonIdMap.get(i) || 'Not found'}`);
    }
    
    // Populate Pokemon select dropdown
    populatePokemonSelect();
    
    console.log('Pokemon data initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize Pokemon data:', error);
    showError('Failed to load Pokémon data. Please try again later.');
    return false;
  }
}

/**
 * Populate the Pokemon dropdown with checkboxes for all Pokemon
 */
function populatePokemonSelect() {
  if (pokemonSelectInitialized) return;
  
  const pokemonListContainer = document.getElementById('pokemon-list-container');
  const selectAllCheckbox = document.getElementById('select-all-pokemon');
  const pokemonSearch = document.getElementById('pokemon-search');
  const selectedPokemonText = document.getElementById('selected-pokemon-text');
  const selectedPokemonCount = document.getElementById('selected-pokemon-count');
  const pokemonDropdown = document.getElementById('pokemon-dropdown');
  
  if (!pokemonListContainer) return;
  
  // Sort Pokemon by ID
  const sortedPokemon = Array.from(pokemonIdMap.entries()).sort((a, b) => a[0] - b[0]);
  
  // Selected Pokemon IDs set
  const selectedPokemonIds = new Set();
  
  // Group Pokemon by generations to improve organization
  const generations = [
    { name: "Kanto (Gen 1)", range: [1, 151] },
    { name: "Johto (Gen 2)", range: [152, 251] },
    { name: "Hoenn (Gen 3)", range: [252, 386] },
    { name: "Sinnoh (Gen 4)", range: [387, 493] },
    { name: "Unova (Gen 5)", range: [494, 649] },
    { name: "Kalos (Gen 6)", range: [650, 721] },
    { name: "Alola (Gen 7)", range: [722, 809] },
    { name: "Galar (Gen 8)", range: [810, 898] },
    { name: "Paldea (Gen 9)", range: [899, 1010] }
  ];
  
  // Clear existing content
  pokemonListContainer.innerHTML = '';
  
  // Add generation headers and Pokemon within each generation
  generations.forEach(gen => {
    // Create generation header
    const genHeader = document.createElement('div');
    genHeader.className = 'dropdown-header gen-header';
    genHeader.textContent = gen.name;
    pokemonListContainer.appendChild(genHeader);
    
    // Filter Pokemon for this generation
    const genPokemon = sortedPokemon.filter(([id]) => 
      id >= gen.range[0] && id <= gen.range[1]
    );
    
    // Create container for this generation's Pokemon
    const genContainer = document.createElement('div');
    genContainer.className = 'generation-container';
    genContainer.dataset.generation = gen.name.toLowerCase().replace(/\s+\(gen \d+\)/g, '');
    
    // Add Pokemon checkboxes for this generation
    genPokemon.forEach(([id, name]) => {
      const checkboxDiv = document.createElement('div');
      checkboxDiv.className = 'form-check pokemon-item';
      checkboxDiv.dataset.id = id;
      checkboxDiv.dataset.name = name.toLowerCase();
      
      const checkbox = document.createElement('input');
      checkbox.className = 'form-check-input pokemon-checkbox';
      checkbox.type = 'checkbox';
      checkbox.id = `pokemon-${id}`;
      checkbox.value = id;
      checkbox.setAttribute('data-pokemon-id', id); // Add data attribute for debugging
      checkbox.checked = false; // initially unchecked
      
      const label = document.createElement('label');
      label.className = 'form-check-label d-flex justify-content-between align-items-center';
      label.htmlFor = `pokemon-${id}`;
      
      const nameSpan = document.createElement('span');
      nameSpan.textContent = name;
      
      const idBadge = document.createElement('span');
      idBadge.className = 'badge bg-secondary pokemon-id-badge';
      idBadge.textContent = `#${id}`;
      
      label.appendChild(nameSpan);
      label.appendChild(idBadge);
      
      checkboxDiv.appendChild(checkbox);
      checkboxDiv.appendChild(label);
      genContainer.appendChild(checkboxDiv);
      
      // Add event listener to update the UI when a checkbox is changed
      checkbox.addEventListener('change', () => {
        const numericId = parseInt(id);
        console.log(`Checkbox for Pokemon #${numericId} (${name}) changed to ${checkbox.checked}`);
        
        if (checkbox.checked) {
          selectedPokemonIds.add(numericId);
          console.log(`Added ${numericId} to selected IDs. New size: ${selectedPokemonIds.size}`);
          selectAllCheckbox.checked = selectedPokemonIds.size === sortedPokemon.length;
        } else {
          selectedPokemonIds.delete(numericId);
          console.log(`Removed ${numericId} from selected IDs. New size: ${selectedPokemonIds.size}`);
          selectAllCheckbox.checked = false;
        }
        updateSelectedPokemonUI();
      });
    });
    
    // Add generation container to the list
    if (genPokemon.length > 0) {
      pokemonListContainer.appendChild(genContainer);
      
      // Add divider after each generation (except the last one)
      if (gen.name !== generations[generations.length - 1].name) {
        const divider = document.createElement('div');
        divider.className = 'dropdown-divider';
        pokemonListContainer.appendChild(divider);
      }
    }
  });
  
  // Add quick selection buttons
  const quickSelectDiv = document.createElement('div');
  quickSelectDiv.className = 'quick-select-buttons d-flex flex-wrap justify-content-between mb-2 mt-2';
  
  const selectAllBtn = document.createElement('button');
  selectAllBtn.className = 'btn btn-sm btn-outline-primary me-1 mb-1';
  selectAllBtn.type = 'button';
  selectAllBtn.textContent = 'Select All';
  selectAllBtn.addEventListener('click', () => {
    selectAllCheckbox.checked = true;
    const checkboxes = document.querySelectorAll('.pokemon-checkbox');
    checkboxes.forEach(cb => {
      cb.checked = true;
      selectedPokemonIds.add(parseInt(cb.value));
    });
    updateSelectedPokemonUI();
  });
  
  const clearAllBtn = document.createElement('button');
  clearAllBtn.className = 'btn btn-sm btn-outline-secondary me-1 mb-1';
  clearAllBtn.type = 'button';
  clearAllBtn.textContent = 'Clear All';
  clearAllBtn.addEventListener('click', () => {
    selectAllCheckbox.checked = false;
    const checkboxes = document.querySelectorAll('.pokemon-checkbox');
    checkboxes.forEach(cb => {
      cb.checked = false;
    });
    selectedPokemonIds.clear();
    updateSelectedPokemonUI();
  });
  
  quickSelectDiv.appendChild(selectAllBtn);
  quickSelectDiv.appendChild(clearAllBtn);
  
  // Insert quick select buttons after the search box
  const searchContainer = pokemonSearch.parentElement.parentElement;
  searchContainer.parentElement.insertBefore(quickSelectDiv, searchContainer.nextSibling);
  
  // Add event listener for "Select All" checkbox
  selectAllCheckbox.addEventListener('change', () => {
    console.log(`Select All changed to: ${selectAllCheckbox.checked}`);
    
    const checkboxes = document.querySelectorAll('.pokemon-checkbox');
    
    // Clear the set first
    selectedPokemonIds.clear();
    
    // Update all checkboxes and the selected IDs set
    checkboxes.forEach(cb => {
      cb.checked = selectAllCheckbox.checked;
      
      if (selectAllCheckbox.checked) {
        const id = parseInt(cb.value);
        selectedPokemonIds.add(id);
      }
    });
    
    console.log(`After Select All changed, selected IDs count: ${selectedPokemonIds.size}`);
    updateSelectedPokemonUI();
  });
  
  // Add event listener for the search input
  pokemonSearch.addEventListener('input', () => {
    const searchTerm = pokemonSearch.value.toLowerCase().trim();
    const pokemonItems = document.querySelectorAll('.pokemon-item');
    const genContainers = document.querySelectorAll('.generation-container');
    const genHeaders = document.querySelectorAll('.gen-header');
    const dividers = document.querySelectorAll('.dropdown-divider');
    
    // If search term is empty, show all headers and dividers
    if (searchTerm === '') {
      genHeaders.forEach(header => header.style.display = 'block');
      dividers.forEach(divider => divider.style.display = 'block');
      genContainers.forEach(container => container.style.display = 'block');
      pokemonItems.forEach(item => item.style.display = 'block');
      return;
    }
    
    // Hide all headers and dividers initially
    genHeaders.forEach(header => header.style.display = 'none');
    dividers.forEach(divider => divider.style.display = 'none');
    
    // Track which generations have matches
    const genWithMatches = new Set();
    
    // Filter Pokemon items
    pokemonItems.forEach(item => {
      const pokemonName = item.dataset.name;
      const pokemonId = item.dataset.id;
      const matches = 
        pokemonName.includes(searchTerm) || 
        pokemonId.includes(searchTerm);
      
      item.style.display = matches ? 'block' : 'none';
      
      // If this Pokemon matches, mark its generation as having matches
      if (matches) {
        const genContainer = item.closest('.generation-container');
        if (genContainer) {
          genWithMatches.add(genContainer.dataset.generation);
        }
      }
    });
    
    // Show only generations with matches
    genContainers.forEach(container => {
      const hasMatches = Array.from(container.querySelectorAll('.pokemon-item'))
        .some(item => item.style.display !== 'none');
      container.style.display = hasMatches ? 'block' : 'none';
      
      // Show header for this generation if it has matches
      if (hasMatches) {
        const genIndex = Array.from(genContainers).indexOf(container);
        if (genIndex >= 0 && genIndex < genHeaders.length) {
          genHeaders[genIndex].style.display = 'block';
        }
      }
    });
  });
  
  // Function to update the selected Pokemon UI
  function updateSelectedPokemonUI() {
    const count = selectedPokemonIds.size;
    selectedPokemonCount.textContent = count;
    
    if (count === 0 || count === sortedPokemon.length) {
      selectedPokemonText.textContent = 'All Pokémon';
    } else if (count === 1) {
      const id = [...selectedPokemonIds][0];
      selectedPokemonText.textContent = `${getPokemonNameById(id)}`;
    } else {
      selectedPokemonText.textContent = `${count} Pokémon`;
    }
  }
  
  // Initialize with "All" selected
  console.log("Initializing selection with 'All' selected");
  selectAllCheckbox.checked = true;
  
  // Clear any existing selections first
  selectedPokemonIds.clear();
  
  const checkboxes = document.querySelectorAll('.pokemon-checkbox');
  console.log(`Found ${checkboxes.length} Pokémon checkboxes`);
  
  checkboxes.forEach(cb => {
    cb.checked = true;
    const id = parseInt(cb.value);
    selectedPokemonIds.add(id);
  });
  
  console.log(`After initialization, selected IDs count: ${selectedPokemonIds.size}`);
  updateSelectedPokemonUI();
  
  // Make dropdown wider on larger screens
  const mediaQuery = window.matchMedia('(min-width: 576px)');
  if (mediaQuery.matches) {
    const dropdownMenu = pokemonDropdown.querySelector('.dropdown-menu');
    dropdownMenu.classList.add('dropdown-menu-lg');
  }
  
  // Expose selected Pokemon IDs for the filter function
  window.getSelectedPokemonIds = () => {
    // Debug output for troubleshooting
    console.log(`Selected Pokemon Count: ${selectedPokemonIds.size}, Total Pokemon: ${sortedPokemon.length}`);
    
    if (selectedPokemonIds.size === 0 || selectedPokemonIds.size === sortedPokemon.length) {
      return 'all';
    }
    
    const selectedIds = [...selectedPokemonIds];
    console.log('Selected IDs:', selectedIds);
    return selectedIds;
  };
  
  // Expose Pokemon selection management functions for saved filters
  window.selectedPokemonIds = selectedPokemonIds;
  window.updateSelectedPokemonUI = updateSelectedPokemonUI;
  
  pokemonSelectInitialized = true;
}

// Cache for Pokemon names to avoid repeated lookups
const pokemonNameCache = {};

/**
 * Get Pokemon name by ID
 * @param {number} id - Pokemon ID
 * @returns {string} - Pokemon name or ID with # prefix if not found
 */
function getPokemonNameById(id) {
  if (!id) return 'Unknown';
  
  const numericId = parseInt(id);
  
  // Check cache first
  if (pokemonNameCache[numericId]) {
    return pokemonNameCache[numericId];
  }
  
  let name = pokemonIdMap.get(numericId);
  
  if (!name) {
    console.warn(`No name found for Pokemon ID: ${numericId}`);
    pokemonNameCache[numericId] = `#${numericId}`;
    return pokemonNameCache[numericId];
  }
  
  // Capitalize the first letter of the name
  name = name.charAt(0).toUpperCase() + name.slice(1);
  
  // Store in cache for next time
  pokemonNameCache[numericId] = name;
  return name;
}

/**
 * Get Pokemon ID by name
 * @param {string} name - Pokemon name
 * @returns {number} - Pokemon ID or null if not found
 */
function getPokemonIdByName(name) {
  return pokemonNameMap.get(name.toLowerCase()) || null;
}

/**
 * Get move name by ID
 * @param {number} moveId - Move ID
 * @returns {string} - Move name or "Unknown Move" if not found
 */
function getMoveNameById(moveId) {
  // This would be implemented if we had the move data
  // For now, return placeholder
  return `Move #${moveId}`;
}