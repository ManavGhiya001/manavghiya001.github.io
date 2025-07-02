/**
 * Saved Filters Module
 * Handles saving, loading, and managing user filter preferences in browser cache
 */

const SAVED_FILTERS_KEY = 'pokemon_saved_filters';

/**
 * Get all saved filters from localStorage
 * @returns {Object} - Object containing all saved filters
 */
function getSavedFilters() {
    try {
        const saved = localStorage.getItem(SAVED_FILTERS_KEY);
        return saved ? JSON.parse(saved) : {};
    } catch (error) {
        console.error('Error loading saved filters:', error);
        return {};
    }
}

/**
 * Save filters to localStorage
 * @param {Object} filters - Filters object to save
 */
function setSavedFilters(filters) {
    try {
        localStorage.setItem(SAVED_FILTERS_KEY, JSON.stringify(filters));
    } catch (error) {
        console.error('Error saving filters:', error);
        showNotification('Failed to save filters to browser storage', 'error');
    }
}

/**
 * Get current filter values from the form, only including non-default values
 * @returns {Object} - Current filter configuration
 */
function getCurrentFilters() {
    const filters = {};
    
    // Location (only if not 'all')
    const location = document.getElementById('location').value;
    if (location !== 'all') {
        filters.location = location;
    }
    
    // Pokemon selection (only if not all pokemon selected)
    const selectedPokemon = window.getSelectedPokemonIds();
    if (Array.isArray(selectedPokemon) && selectedPokemon.length > 0 && selectedPokemon.length < 1010) {
        filters.selectedPokemon = selectedPokemon;
    }
    
    // IV Filter type
    const useMinIvPercentage = document.getElementById('iv-filter-min').checked;
    if (!useMinIvPercentage) {
        filters.useMinIvPercentage = false;
    }
    
    // Min IV Percentage (only if > 0)
    const minIvPercentage = parseInt(document.getElementById('min-iv-percentage').value) || 0;
    if (minIvPercentage > 0) {
        filters.minIvPercentage = minIvPercentage;
    }
    
    // Raw IV values (only if > 0)
    const minAttack = parseInt(document.getElementById('min-attack').value) || 0;
    if (minAttack > 0) {
        filters.minAttack = minAttack;
    }
    
    const minDefense = parseInt(document.getElementById('min-defense').value) || 0;
    if (minDefense > 0) {
        filters.minDefense = minDefense;
    }
    
    const minStamina = parseInt(document.getElementById('min-stamina').value) || 0;
    if (minStamina > 0) {
        filters.minStamina = minStamina;
    }
    
    // Level (only if > 1)
    const minLevel = parseInt(document.getElementById('min-level').value) || 1;
    if (minLevel > 1) {
        filters.minLevel = minLevel;
    }
    
    // CP (only if > 0)
    const minCP = parseInt(document.getElementById('min-cp').value) || 0;
    if (minCP > 0) {
        filters.minCP = minCP;
    }
    
    // Perfect IV checkbox
    const showPerfect = document.getElementById('show-perfect').checked;
    if (showPerfect) {
        filters.showPerfect = true;
    }
    
    // Pokemon size (only if not 'any')
    const pokemonSize = document.getElementById('pokemon-size').value;
    if (pokemonSize !== 'any') {
        filters.pokemonSize = pokemonSize;
    }
    
    return filters;
}

/**
 * Apply saved filters to the form
 * @param {Object} filters - Filter configuration to apply
 */
function applyFilters(filters) {
    try {
        // Reset form to defaults first
        resetFormToDefaults();
        
        // Apply location
        if (filters.location) {
            const locationSelect = document.getElementById('location');
            if (locationSelect.querySelector(`option[value="${filters.location}"]`)) {
                locationSelect.value = filters.location;
            }
        }
        
        // Apply Pokemon selection
        if (filters.selectedPokemon && Array.isArray(filters.selectedPokemon)) {
            // Clear all selections first
            const selectAllCheckbox = document.getElementById('select-all-pokemon');
            const checkboxes = document.querySelectorAll('.pokemon-checkbox');
            
            selectAllCheckbox.checked = false;
            checkboxes.forEach(cb => cb.checked = false);
            
            // Clear the selected IDs set
            if (window.selectedPokemonIds) {
                window.selectedPokemonIds.clear();
            }
            
            // Select specific Pokemon
            filters.selectedPokemon.forEach(pokemonId => {
                const checkbox = document.querySelector(`.pokemon-checkbox[value="${pokemonId}"]`);
                if (checkbox) {
                    checkbox.checked = true;
                    if (window.selectedPokemonIds) {
                        window.selectedPokemonIds.add(pokemonId);
                    }
                }
            });
            
            // Update UI
            if (window.updateSelectedPokemonUI) {
                window.updateSelectedPokemonUI();
            }
        }
        
        // Apply IV filter type
        if (filters.useMinIvPercentage === false) {
            document.getElementById('iv-filter-raw').checked = true;
            document.getElementById('iv-filter-min').checked = false;
            document.getElementById('raw-iv-inputs').style.display = 'flex';
            document.getElementById('min-iv-input').style.display = 'none';
        } else {
            document.getElementById('iv-filter-min').checked = true;
            document.getElementById('iv-filter-raw').checked = false;
            document.getElementById('raw-iv-inputs').style.display = 'none';
            document.getElementById('min-iv-input').style.display = 'flex';
        }
        
        // Apply IV values
        if (filters.minIvPercentage) {
            document.getElementById('min-iv-percentage').value = filters.minIvPercentage;
        }
        
        if (filters.minAttack) {
            document.getElementById('min-attack').value = filters.minAttack;
        }
        
        if (filters.minDefense) {
            document.getElementById('min-defense').value = filters.minDefense;
        }
        
        if (filters.minStamina) {
            document.getElementById('min-stamina').value = filters.minStamina;
        }
        
        // Apply level and CP
        if (filters.minLevel) {
            document.getElementById('min-level').value = filters.minLevel;
        }
        
        if (filters.minCP) {
            document.getElementById('min-cp').value = filters.minCP;
        }
        
        // Apply perfect IV checkbox
        if (filters.showPerfect) {
            document.getElementById('show-perfect').checked = true;
        }
        
        // Apply Pokemon size
        if (filters.pokemonSize) {
            const sizeSelect = document.getElementById('pokemon-size');
            if (sizeSelect.querySelector(`option[value="${filters.pokemonSize}"]`)) {
                sizeSelect.value = filters.pokemonSize;
            }
        }
        
    } catch (error) {
        console.error('Error applying filters:', error);
        showNotification('Some filter settings could not be applied due to changes in the website', 'warning');
    }
}

/**
 * Reset form to default values
 */
function resetFormToDefaults() {
    // Location to 'all'
    document.getElementById('location').value = 'all';
    
    // Pokemon selection to all
    const selectAllCheckbox = document.getElementById('select-all-pokemon');
    const checkboxes = document.querySelectorAll('.pokemon-checkbox');
    selectAllCheckbox.checked = true;
    checkboxes.forEach(cb => cb.checked = true);
    
    if (window.selectedPokemonIds) {
        window.selectedPokemonIds.clear();
        checkboxes.forEach(cb => {
            window.selectedPokemonIds.add(parseInt(cb.value));
        });
    }
    
    if (window.updateSelectedPokemonUI) {
        window.updateSelectedPokemonUI();
    }
    
    // IV filter to min percentage
    document.getElementById('iv-filter-min').checked = true;
    document.getElementById('iv-filter-raw').checked = false;
    document.getElementById('raw-iv-inputs').style.display = 'none';
    document.getElementById('min-iv-input').style.display = 'flex';
    
    // Clear all numeric inputs
    document.getElementById('min-iv-percentage').value = '';
    document.getElementById('min-attack').value = '';
    document.getElementById('min-defense').value = '';
    document.getElementById('min-stamina').value = '';
    document.getElementById('min-level').value = '1';
    document.getElementById('min-cp').value = '0';
    
    // Uncheck perfect IV
    document.getElementById('show-perfect').checked = false;
    
    // Size to 'any'
    document.getElementById('pokemon-size').value = 'any';
}

/**
 * Show save filter dialog
 */
function showSaveFilterDialog() {
    const currentFilters = getCurrentFilters();
    
    // Check if there are any non-default filters to save
    if (Object.keys(currentFilters).length === 0) {
        showNotification('No custom filters to save. Please configure some filters first.', 'warning');
        return;
    }
    
    const filterName = prompt('Enter a name for this filter:');
    if (!filterName || filterName.trim() === '') {
        return;
    }
    
    const savedFilters = getSavedFilters();
    savedFilters[filterName.trim()] = currentFilters;
    setSavedFilters(savedFilters);
    
    showNotification(`Filter "${filterName.trim()}" has been saved successfully!`, 'success');
}

/**
 * Show apply filter dialog
 */
function showApplyFilterDialog() {
    const savedFilters = getSavedFilters();
    const filterNames = Object.keys(savedFilters);
    
    if (filterNames.length === 0) {
        showNotification('No saved filters found. Save a filter first to use this feature.', 'info');
        return;
    }
    
    // Create a simple select dialog
    let options = '';
    filterNames.forEach(name => {
        options += `<option value="${name}">${name}</option>`;
    });
    
    const selectHtml = `
        <div class="mb-3">
            <label for="filter-select" class="form-label">Select a filter to apply:</label>
            <select class="form-select" id="filter-select">
                ${options}
            </select>
        </div>
    `;
    
    // Create a modal-like dialog using browser's confirm (simplified for now)
    const selectedFilter = prompt(`Select a filter to apply:\n\n${filterNames.map((name, index) => `${index + 1}. ${name}`).join('\n')}\n\nEnter the number of the filter you want to apply:`);
    
    if (!selectedFilter) return;
    
    const filterIndex = parseInt(selectedFilter) - 1;
    if (filterIndex >= 0 && filterIndex < filterNames.length) {
        const filterName = filterNames[filterIndex];
        applyFilters(savedFilters[filterName]);
        showNotification(`Filter "${filterName}" has been applied successfully!`, 'success');
    } else {
        showNotification('Invalid selection. Please try again.', 'error');
    }
}

/**
 * Show delete filter dialog
 */
function showDeleteFilterDialog() {
    const savedFilters = getSavedFilters();
    const filterNames = Object.keys(savedFilters);
    
    if (filterNames.length === 0) {
        showNotification('No saved filters found.', 'info');
        return;
    }
    
    // Add "Clear All" option
    const options = ['Clear All', ...filterNames];
    const selectedOption = prompt(`Select a filter to delete:\n\n${options.map((name, index) => `${index + 1}. ${name}`).join('\n')}\n\nEnter the number of the option:`);
    
    if (!selectedOption) return;
    
    const optionIndex = parseInt(selectedOption) - 1;
    if (optionIndex === 0) {
        // Clear all filters
        if (confirm('Are you sure you want to delete all saved filters? This cannot be undone.')) {
            localStorage.removeItem(SAVED_FILTERS_KEY);
            showNotification('All saved filters have been deleted.', 'success');
        }
    } else if (optionIndex > 0 && optionIndex <= filterNames.length) {
        // Delete specific filter
        const filterName = filterNames[optionIndex - 1];
        if (confirm(`Are you sure you want to delete the filter "${filterName}"?`)) {
            delete savedFilters[filterName];
            setSavedFilters(savedFilters);
            showNotification(`Filter "${filterName}" has been deleted.`, 'success');
        }
    } else {
        showNotification('Invalid selection. Please try again.', 'error');
    }
}

/**
 * Export all saved filters as a JSON file
 */
function exportFilters() {
    const savedFilters = getSavedFilters();
    const filterNames = Object.keys(savedFilters);
    
    if (filterNames.length === 0) {
        showNotification('No saved filters to export.', 'info');
        return;
    }
    
    // Create export data with metadata
    const exportData = {
        source: 'pokemon-go-coordinates-website',
        version: '1.0',
        exportDate: new Date().toISOString(),
        filters: savedFilters
    };
    
    try {
        // Create blob and download
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        // Create download link
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `pokemon-filters-${new Date().toISOString().split('T')[0]}.json`;
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up object URL
        URL.revokeObjectURL(link.href);
        
        showNotification(`Exported ${filterNames.length} saved filters successfully!`, 'success');
    } catch (error) {
        console.error('Error exporting filters:', error);
        showNotification('Failed to export filters. Please try again.', 'error');
    }
}

/**
 * Import filters from a JSON file
 */
function importFilters() {
    const fileInput = document.getElementById('import-file-input');
    fileInput.click();
}

/**
 * Handle file selection for import
 * @param {Event} event - File input change event
 */
function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Reset file input
    event.target.value = '';
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importData = JSON.parse(e.target.result);
            
            // Validate the imported data
            if (!validateImportData(importData)) {
                showNotification('Invalid file format. This file was not downloaded from this website.', 'error');
                return;
            }
            
            // Get the filters from the import data
            const importedFilters = importData.filters || {};
            const filterCount = Object.keys(importedFilters).length;
            
            if (filterCount === 0) {
                showNotification('No filters found in the imported file.', 'info');
                return;
            }
            
            // Confirm replacement
            const currentFilters = getSavedFilters();
            const currentCount = Object.keys(currentFilters).length;
            
            let confirmMessage = `Import ${filterCount} filters from file?`;
            if (currentCount > 0) {
                confirmMessage += `\n\nThis will replace your current ${currentCount} saved filters.`;
            }
            
            if (confirm(confirmMessage)) {
                // Replace all current filters with imported ones
                setSavedFilters(importedFilters);
                showNotification(`Successfully imported ${filterCount} filters!`, 'success');
            }
            
        } catch (error) {
            console.error('Error importing filters:', error);
            showNotification('Invalid JSON file. Please make sure you selected the correct file.', 'error');
        }
    };
    
    reader.onerror = function() {
        showNotification('Error reading file. Please try again.', 'error');
    };
    
    reader.readAsText(file);
}

/**
 * Validate imported data structure
 * @param {Object} data - Imported data to validate
 * @returns {boolean} - Whether the data is valid
 */
function validateImportData(data) {
    // Check if it has the required structure
    if (!data || typeof data !== 'object') {
        return false;
    }
    
    // Check for required metadata
    if (data.source !== 'pokemon-go-coordinates-website') {
        return false;
    }
    
    // Check if filters exist and is an object
    if (!data.filters || typeof data.filters !== 'object') {
        return false;
    }
    
    // Basic validation of filter structure
    for (const filterName in data.filters) {
        const filter = data.filters[filterName];
        if (!filter || typeof filter !== 'object') {
            return false;
        }
    }
    
    return true;
}

/**
 * Initialize saved filters functionality
 */
function initializeSavedFilters() {
    // Add event listeners for saved filter buttons
    document.getElementById('save-filter-btn').addEventListener('click', (e) => {
        e.preventDefault();
        showSaveFilterDialog();
    });
    
    document.getElementById('apply-filter-btn').addEventListener('click', (e) => {
        e.preventDefault();
        showApplyFilterDialog();
    });
    
    document.getElementById('delete-filter-btn').addEventListener('click', (e) => {
        e.preventDefault();
        showDeleteFilterDialog();
    });
    
    document.getElementById('export-filters-btn').addEventListener('click', (e) => {
        e.preventDefault();
        exportFilters();
    });
    
    document.getElementById('import-filters-btn').addEventListener('click', (e) => {
        e.preventDefault();
        importFilters();
    });
    
    // Add event listener for file input
    document.getElementById('import-file-input').addEventListener('change', handleFileImport);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeSavedFilters);