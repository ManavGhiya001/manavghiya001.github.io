class ImageGenerator {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.backgroundColor = "#040f13";
        this.gridBackgroundColor = "#ece0be";
        this.POKEMON_SIZE = 128;
        this.GRID_PADDING = 20;
        this.COLUMNS = 5;
        this.ROW_HEIGHT = 169;
        this.SPACING = 40; // Consistent spacing between all elements
        this.RIGHT_MARGIN = 30; // Additional right margin for Pokemon sprites
    }

    async loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = () => resolve(img);
            img.onerror = (e) =>
                reject(new Error(`Failed to load image: ${src}`));
            img.src = src;
        });
    }

    roundRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(
            x + width,
            y + height,
            x + width - radius,
            y + height,
        );
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }

    calculateGridDimensions(pokemonList) {
        const rows = Math.ceil(pokemonList.length / this.COLUMNS);
        const gridHeight = rows * this.ROW_HEIGHT;
        return { rows, gridHeight };
    }

    async drawPokemonList(pokemonList, startY) {
        if (pokemonList.length === 0) return startY;

        const { gridHeight } = this.calculateGridDimensions(pokemonList);
        const totalGridHeight = gridHeight + this.GRID_PADDING * 2;

        this.ctx.fillStyle = this.gridBackgroundColor;
        this.roundRect(
            this.ctx,
            10,
            startY,
            this.canvas.width - 20 - this.RIGHT_MARGIN, // Adjusted width
            totalGridHeight,
            20,
        );
        this.ctx.fill();

        let x = 10 + this.GRID_PADDING;
        let y = startY + this.GRID_PADDING;
        let col = 0;

        const spriteSpacing =
            (this.canvas.width -
                20 -
                this.GRID_PADDING * 2 -
                this.RIGHT_MARGIN) /
            this.COLUMNS;

        for (const pokemon of pokemonList) {
            if (col >= this.COLUMNS) {
                col = 0;
                x = 10 + this.GRID_PADDING;
                y += this.ROW_HEIGHT;
            }

            try {
                if (pokemon === "DM Me") {
                    this.ctx.font = "bold 24px Arial";
                    this.ctx.fillStyle = "#FF0000";
                    this.ctx.fillText("DM Me", x + 25, y + 75);
                } else {
                    const { name, isShiny } = this.parsePokemonString(pokemon);
                    const pokemonId = POKEMON_DATA.getPokemonId(name);

                    if (pokemonId) {
                        const spriteUrl = POKEMON_DATA.getSpriteUrl(
                            pokemonId,
                            isShiny,
                        );
                        const spriteImg = await this.loadImage(spriteUrl);
                        this.ctx.drawImage(
                            spriteImg,
                            x,
                            y,
                            this.POKEMON_SIZE,
                            this.POKEMON_SIZE,
                        );

                        if (isShiny) {
                            const shinyIcon =
                                await this.loadImage("./static/shiny.png");
                            this.ctx.drawImage(
                                shinyIcon,
                                x + this.POKEMON_SIZE - 36,
                                y + 5,
                                36,
                                36,
                            );
                        }
                    }
                }
            } catch (error) {
                console.error("Error drawing Pokémon:", pokemon, error);
            }

            col++;
            x += spriteSpacing;
        }

        return startY + totalGridHeight;
    }

    parsePokemonString(pokemonString) {
        const parts = pokemonString.split(" ");
        let name = parts[0];
        let isShiny = false;

        if (parts[0] === "shiny") {
            isShiny = true;
            name = parts.slice(1).join(" ");
        }

        return { name, isShiny };
    }

    async generateImage(lookingFor, forTrade) {
        try {
            const lfList = lookingFor
                .split(",")
                .map((p) => p.trim())
                .filter((p) => p);
            const ftList = forTrade
                .split(",")
                .map((p) => p.trim())
                .filter((p) => p);

            const { gridHeight: lfGridHeight } =
                this.calculateGridDimensions(lfList);
            const { gridHeight: ftGridHeight } =
                this.calculateGridDimensions(ftList);

            // Calculate height by adding up all elements and spacing
            const totalHeight =
                120 + // ptradelist.png height
                this.SPACING + // Space
                50 + // lf.png height
                this.SPACING + // Space
                (lfGridHeight + this.GRID_PADDING * 2) + // Looking For grid
                this.SPACING + // Space
                50 + // ft.png height
                this.SPACING + // Space
                (ftGridHeight + this.GRID_PADDING * 2) + // For Trade grid
                this.SPACING + // Space before footer
                40 + // Footer height (single line)
                this.SPACING; // Final bottom space

            // Set canvas dimensions
            this.canvas.width = 716;
            this.canvas.height = totalHeight;

            // Clear canvas
            this.ctx.fillStyle = this.backgroundColor;
            this.ctx.fillRect(0, 0, this.canvas.width, totalHeight);

            let currentY = 0;

            // 1. Draw ptradelist.png at top
            const headerImg = await this.loadImage("./static/ptradelist.png");
            this.ctx.drawImage(headerImg, 110, -0, 600, 100);
            currentY = 120;
            const titleIcon = await this.loadImage("./static/pokeball.png");
            // Set title icon height same as ptradelist.png height (100px)
            const iconSize = 100;
            // Position icon on the left side of ptradelist.png
            this.ctx.drawImage(titleIcon, 10, -0, iconSize, iconSize);
            // 2. Draw lf.png
            currentY += this.SPACING;
            const lfImg = await this.loadImage("./static/lf.png");
            this.ctx.drawImage(lfImg, 10, currentY, 200, 50);
            currentY += 50;

            // 3. Draw Looking For grid
            currentY += this.SPACING;
            currentY = await this.drawPokemonList(lfList, currentY);

            // 4. Draw ft.png
            currentY += this.SPACING;
            const ftImg = await this.loadImage("./static/ft.png");
            this.ctx.drawImage(ftImg, 10, currentY, 200, 50);
            currentY += 50;

            // 5. Draw For Trade grid
            currentY += this.SPACING;
            currentY = await this.drawPokemonList(ftList, currentY);

            // 6. Draw footer text (only "Generate Your Own Trading Lists")
            currentY += this.SPACING;
            this.ctx.font = "bold 22px Arial";
            this.ctx.fillStyle = "#F7CD40";
            this.ctx.fillText("Generate Your Own Trading Lists:", 20, currentY);
            this.ctx.fillStyle = "#FF2B56";
            this.ctx.fillText("discord.gg/pogocoordinates", 405, currentY);
        } catch (error) {
            console.error("Error in generateImage:", error);
            throw error;
        }
    }
}
