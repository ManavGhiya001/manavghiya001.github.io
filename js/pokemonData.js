const POKEMON_DATA = {
    // Base URL for Pokemon sprites
    spriteBaseUrl: "https://raw.githubusercontent.com/ManavGhiya001/pokemons/master/UICONS_OS/pokemon/",

    // Map of Pokemon names to their IDs
    nameToId: {},

    // Initialize the name to ID mapping
    async init() {
        try {
            const response = await fetch('./pokemon_name_to_pokemon_id.json');
            this.nameToId = await response.json();
            console.log('Pokemon data loaded successfully');
        } catch (error) {
            console.error('Error loading Pokemon data:', error);
        }
    },

    // Function to get Pokemon ID from name
    getPokemonId(name) {
        name = name.toLowerCase().trim();
        const id = this.nameToId[name];
        if (!id) {
            console.warn(`Pokemon not found: ${name}`);
        }
        return id;
    },

    // Function to generate sprite URL
    getSpriteUrl(pokemonId, isShiny = false) {
        const shinySuffix = isShiny ? "_s" : "";
        const url = `${this.spriteBaseUrl}${pokemonId}${shinySuffix}.png`;
        console.log(`Generated sprite URL: ${url}`);
        return url;
    }
};

// Initialize the Pokemon data when the script loads
POKEMON_DATA.init();