# Pokemon GO Coordinates - Multi-Tool Platform

## Overview
A comprehensive Pokemon GO multi-tool platform offering coordinates tracking, trading tools, Discord community pages, and various utilities for trainers. Built with Flask backend and modern frontend technologies with dark theme UI.

## Project Architecture
- **Backend**: Flask (Python) serving static files
- **Frontend**: HTML5 + Bootstrap 5 (dark theme) + vanilla JavaScript
- **Styling**: Custom CSS with Pokemon-themed colors and animations
- **APIs**: PokéMap API integration for live data
- **Assets**: Static images for trading tools and UI elements
- **Location Support**: NYC, Sydney, London, Singapore, Vancouver

## Core Features
1. **Pokemon GO Coordinates**: Main IV finder for finding Pokemon with specific requirements
2. **Team Rocket Coordinates**: Find active Team Rocket invasions by location and type
3. **Trading List Generator**: Create visual trading lists with Pokemon images
4. **Community Pages**: Discord server invitations and community resources
5. **Utility Tools**: Coordinate copying, shiny rate viewing, and various services

## Page Structure
### Main Tools
- `index.html` - Pokemon GO Coordinates (IV Finder)
- `rocket-grunt-coordinates.html` - Team Rocket invasion finder
- `trade.html` - Pokemon GO Trading List Generator
- `coords/index.html` - Simple coordinate copying tool

### Community & Discord Pages
- `100iv-pvp.html` - Discord server for 100% IV raids and PvP
- `pokemon-go-united-states.html` - US Pokemon GO Discord community
- `pokemon-showdown-discord.html` - Pokemon Showdown Discord
- `pokemon-tcg-pocket-trading-discord.html` - TCG Pocket trading
- `pokemongocommunity.html` - General Pokemon GO community
- `pokemon-champions.html` - Pokemon Champions Discord

### Service & Tool Pages
- `shinyrates.html` - Shiny rate viewer and calculator
- `duomon.html` - DuoMon service page
- `ianygo.html` / `ianygo-anyto.html` - iAnyGo GPS spoofing tools
- `itools.html` - iTools service page
- `ugphone.html` - UGPhone service page
- `aerilate.html` - Aerilate Discord server
- `appeals.html` - Appeals process page
- `notify.html` - Notification services
- `pokehub.html` - PokeHub community
- `pogoservices.html` - Pokemon GO services
- `primalkaran.html` - PrimalKaran services
- `manav.html` - Manav services
- `megacom.html` - MegaCom services
- `shiny-sniper.html` - Shiny sniping services
- `coordinates.html` - Coordinates services

### Assets & Static Files
- `static/` - Trading tool images (pokeball.png, shiny.png, trade icons)
- `css/styles.css` - Custom styling for trading tools
- `js/main.js` - Trading list generator logic
- `js/imageGenerator.js` - Image generation utilities
- `js/pokemonData.js` - Pokemon data management
- `pokemon_name_to_pokemon_id.json` - Pokemon database

## Recent Changes
- **2025-07-19**: Major platform expansion - Added comprehensive Pokemon GO toolset
  - **Team Rocket Coordinates**: rocket-grunt-coordinates.html with live invasion tracking
  - **Trading List Generator**: trade.html with image generation for Pokemon trading
  - **Community Hub**: 10+ Discord server invitation pages for various Pokemon communities
  - **Utility Tools**: Coordinate copying, shiny rates, GPS spoofing service pages
  - **Service Integration**: iAnyGo, iTools, UGPhone, and other Pokemon GO service pages
  - **Asset Library**: Static images for trading tools (pokeball, shiny icons, trade graphics)
  - **JavaScript Modules**: Image generation, Pokemon data management, trading list logic
  - **Styling System**: Custom CSS for trading tools with dark theme consistency
  - **Database**: Pokemon name-to-ID mapping JSON for trading tools
  - **Cross-Navigation**: Integrated navigation between all tools and services
  - **SEO Optimization**: Meta tags and descriptions for all community pages
  - **Rebranding**: Complete transition from "IV Finder" to "Pokemon GO Coordinates" platform

## User Preferences
- Dark theme interface preferred
- Responsive design for mobile and desktop
- Pokémon-themed visual elements and animations
- Real-time data updates with visual feedback

## Technical Stack
- Flask: Web framework
- Bootstrap 5: UI framework
- Font Awesome: Icons
- Custom CSS: Pokémon-themed styling
- Vanilla JS: Dynamic functionality
