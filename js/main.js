document.addEventListener('DOMContentLoaded', async () => {
    // Wait for Pokemon data to load
    await POKEMON_DATA.init();

    const canvas = document.getElementById('previewCanvas');
    const generator = new ImageGenerator(canvas);
    const generateBtn = document.getElementById('generateBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const errorMessage = document.getElementById('errorMessage');
    const previewContainer = document.getElementById('previewContainer');

    function setupPokemonInputs(containerId) {
        const container = document.getElementById(containerId);

        // Handle Enter key and input events
        container.addEventListener('keydown', (event) => {
            if (!(event.target instanceof HTMLInputElement)) return;
            const input = event.target;
            if (event.key === 'Enter' && input.value.trim()) {
                event.preventDefault();
                const addBtn = container.querySelector('.add-btn');
                addNewInputBox(container, addBtn);
            }
        });

        // Handle suggestions
        container.addEventListener('input', (event) => {
            if (!(event.target instanceof HTMLInputElement)) return;
            const input = event.target;
            const inputGroup = input.closest('.pokemon-input-group');
            showSuggestions(input.value.trim().toLowerCase(), inputGroup);
        });

        // Close suggestions on click outside
        document.addEventListener('click', (event) => {
            const suggestionsDropdowns = document.querySelectorAll('.suggestions-dropdown');
            suggestionsDropdowns.forEach(dropdown => {
                if (!dropdown.contains(event.target)) {
                    dropdown.classList.remove('show');
                }
            });
        });

        // Handle Add button
        const addBtn = container.querySelector('.add-btn');
        addBtn.addEventListener('click', () => {
            addNewInputBox(container, addBtn);
        });

        // Handle Remove and Shiny buttons using event delegation
        container.addEventListener('click', (event) => {
            const target = event.target;
            const clickedElement = target.closest('.remove-btn, .shiny-btn');
            if (!clickedElement) return;

            if (clickedElement.classList.contains('remove-btn')) {
                const inputGroup = clickedElement.closest('.pokemon-input-group');
                if (container.querySelectorAll('.pokemon-input-group').length > 1) {
                    inputGroup.remove();
                }
            } else if (clickedElement.classList.contains('shiny-btn')) {
                clickedElement.classList.toggle('active');
                updateShinyButtonState(clickedElement);
            }
        });
    }

    function updateShinyButtonState(button) {
        if (button.classList.contains('active')) {
            button.style.backgroundColor = 'var(--bs-warning)';
        } else {
            button.style.backgroundColor = 'transparent';
        }
    }

    function showSuggestions(query, inputGroup) {
        let dropdown = inputGroup.querySelector('.suggestions-dropdown');
        if (!dropdown) {
            dropdown = document.createElement('div');
            dropdown.className = 'suggestions-dropdown';
            inputGroup.appendChild(dropdown);
        }

        if (!query) {
            dropdown.classList.remove('show');
            return;
        }

        const suggestions = Object.keys(POKEMON_DATA.nameToId)
            .filter(name => name.toLowerCase().startsWith(query.toLowerCase()))
            .sort()
            .slice(0, 10);

        if (suggestions.length === 0) {
            dropdown.innerHTML = '<div class="suggestion-item text-muted">No matches found</div>';
            dropdown.classList.add('show');
            return;
        }

        dropdown.innerHTML = suggestions
            .map((name, index) => `<div class="suggestion-item" data-index="${index}">${name}</div>`)
            .join('');

        dropdown.classList.add('show');

        // Handle suggestion selection
        const suggestionItems = dropdown.querySelectorAll('.suggestion-item');
        let selectedIndex = -1;

        // Handle keyboard navigation
        inputGroup.querySelector('.pokemon-input').addEventListener('keydown', (e) => {
            if (!dropdown.classList.contains('show')) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    selectedIndex = Math.min(selectedIndex + 1, suggestionItems.length - 1);
                    updateSelection();
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    selectedIndex = Math.max(selectedIndex - 1, 0);
                    updateSelection();
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (selectedIndex >= 0 && suggestionItems[selectedIndex]) {
                        const input = inputGroup.querySelector('.pokemon-input');
                        input.value = suggestionItems[selectedIndex].textContent;
                        dropdown.classList.remove('show');
                    }
                    break;
                case 'Escape':
                    dropdown.classList.remove('show');
                    break;
            }
        });

        function updateSelection() {
            suggestionItems.forEach((item, index) => {
                item.classList.toggle('selected', index === selectedIndex);
            });
            if (selectedIndex >= 0) {
                suggestionItems[selectedIndex].scrollIntoView({ block: 'nearest' });
            }
        }

        // Handle mouse selection
        suggestionItems.forEach(item => {
            item.addEventListener('click', () => {
                const input = inputGroup.querySelector('.pokemon-input');
                input.value = item.textContent;
                dropdown.classList.remove('show');
            });

            item.addEventListener('mouseover', () => {
                selectedIndex = parseInt(item.dataset.index);
                updateSelection();
            });
        });
    }

    function addNewInputBox(container, addBtn) {
        const newGroup = document.createElement('div');
        newGroup.className = 'input-group pokemon-input-group';
        newGroup.innerHTML = `
            <input type="text" class="form-control pokemon-input" placeholder="Enter Pokémon name">
            <button class="btn btn-outline-warning shiny-btn" type="button">
                <img src="./static/shiny.png" alt="Shiny" class="shiny-icon">
            </button>
            <button class="btn btn-outline-danger remove-btn" type="button">
                <i class="fas fa-minus"></i>
            </button>
        `;
        container.insertBefore(newGroup, addBtn);
        newGroup.querySelector('input').focus();
    }

    function collectPokemonNames(containerId) {
        const container = document.getElementById(containerId);
        return Array.from(container.querySelectorAll('.pokemon-input-group')).map(group => {
            const input = group.querySelector('input');
            const isShiny = group.querySelector('.shiny-btn').classList.contains('active');
            const name = input.value.trim();
            return name ? (isShiny ? `shiny ${name}` : name) : '';
        }).filter(value => value);
    }

    generateBtn.addEventListener('click', async () => {
        const lookingFor = collectPokemonNames('lookingForContainer');
        const forTrade = collectPokemonNames('forTradeContainer');

        // Show "DM Me" if either section is empty
        const lookingForText = lookingFor.length ? lookingFor.join(', ') : 'DM Me';
        const forTradeText = forTrade.length ? forTrade.join(', ') : 'DM Me';

        // Validate Pokemon names without the "shiny" prefix
        const allPokemon = [...lookingFor, ...forTrade]
            .filter(p => p !== 'DM Me')
            .map(p => p.toLowerCase().trim().replace(/^shiny\s+/, '')); // Remove "shiny" prefix for validation

        const invalidPokemon = allPokemon.filter(p => !POKEMON_DATA.getPokemonId(p));
        if (invalidPokemon.length > 0) {
            showError(`Invalid Pokemon name(s): ${invalidPokemon.join(', ')}`);
            return;
        }

        try {
            showLoading(true);
            await generator.generateImage(lookingForText, forTradeText);
            showPreview();
        } catch (error) {
            console.error('Generation error:', error);
            showError('Error generating image. Please check your input and try again.');
        } finally {
            showLoading(false);
        }
    });

    downloadBtn.addEventListener('click', () => {
        const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
        const link = document.createElement('a');
        link.download = `pokemon-trading-list-${timestamp}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    });

    const shareBtn = document.getElementById('shareBtn');
    shareBtn.addEventListener('click', async () => {
        try {
            // First convert canvas to blob
            const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
            const file = new File([blob], 'pokemon-trading-list.png', { type: 'image/png' });

            if (navigator.share) {
                await navigator.share({
                    title: 'My Pokémon GO Trading List',
                    text: 'Check out my Pokémon GO trading list!',
                    files: [file]
                });
            } else {
                // Fallback for browsers that don't support Web Share API
                const downloadLink = document.createElement('a');
                downloadLink.href = canvas.toDataURL('image/png');
                downloadLink.download = 'pokemon-trading-list.png';
                downloadLink.click();
                alert('Your browser doesn\'t support sharing. The image has been downloaded instead.');
            }
        } catch (error) {
            console.error('Error sharing:', error);
            alert('Unable to share. Please try downloading the image instead.');
        }
    });

    function showLoading(show) {
        loadingIndicator.classList.toggle('d-none', !show);
        generateBtn.disabled = show;
        if (show) {
            errorMessage.classList.add('d-none');
            previewContainer.classList.add('d-none');
            document.getElementById('toolDescription').classList.add('d-none');
        }
    }

    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.classList.remove('d-none');
        previewContainer.classList.add('d-none');
        setTimeout(() => {
            errorMessage.classList.add('d-none');
        }, 5000);
    }

    function showPreview() {
        previewContainer.classList.remove('d-none');
        errorMessage.classList.add('d-none');
        document.getElementById('toolDescription').classList.remove('d-none');
        canvas.scrollIntoView({ behavior: 'smooth' });
    }

    // Setup input handlers for both containers
    setupPokemonInputs('lookingForContainer');
    setupPokemonInputs('forTradeContainer');
});