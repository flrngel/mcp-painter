import { PNG } from 'pngjs';

interface Color {
    r: number;
    g: number;
    b: number;
    a: number;
}

interface Pixel extends Color {} // Pixel is currently same as Color, can be extended if needed

class Canvas {
    width: number;
    height: number;
    pixels: Pixel[][];

    constructor(width: number, height: number) {
        if (typeof width !== 'number' || width <= 0 || typeof height !== 'number' || height <= 0) {
            throw new Error("Canvas dimensions must be positive numbers.");
        }
        this.width = width;
        this.height = height;
        this.pixels = [];
        for (let y = 0; y < height; y++) {
            this.pixels[y] = [];
            for (let x = 0; x < width; x++) {
                // Default to white background
                this.pixels[y][x] = { r: 255, g: 255, b: 255, a: 255 };
            }
        }
    }

    fillRectangle(x: number, y: number, width: number, height: number, color: Color): void {
        if (!this.isValidCoordinate(x, y) || !this.isValidCoordinate(x + width - 1, y + height - 1)) {
            throw new Error("Rectangle coordinates are out of canvas bounds.");
        }
        if (typeof width !== 'number' || width <= 0 || typeof height !== 'number' || height <= 0) {
            throw new Error("Rectangle dimensions must be positive numbers.");
        }
        if (!this.isValidColor(color)) {
            throw new Error("Invalid color format. Color should be an object with {r, g, b, a} values (0-255 for r, g, b and 0-255 for a).");
        }

        for (let rectY = y; rectY < y + height; rectY++) {
            for (let rectX = x; rectX < x + width; rectX++) {
                this.pixels[rectY][rectX] = { ...color }; // Spread to avoid modifying the original color object
            }
        }
    }

    getCanvasData(): Pixel[][] { // Renamed from getCanvas to getCanvasData for clarity
        return this.pixels;
    }

    async getCanvasPngBase64(): Promise<string> {
        const png = new PNG({
            width: this.width,
            height: this.height,
            bitDepth: 8,
            colorType: 6, // truecolor with alpha
            inputColorType: 6,
        });

        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const pixel = this.pixels[y][x];
                const idx = (y * this.width + x) << 2; // Faster than * 4
                png.data[idx] = pixel.r;
                png.data[idx + 1] = pixel.g;
                png.data[idx + 2] = pixel.b;
                png.data[idx + 3] = pixel.a;
            }
        }

        return new Promise<string>((resolve, reject) => {
            const chunks: Buffer[] = [];
            png.pack()
                .on('data', function(chunk) {
                    chunks.push(chunk);
                })
                .on('end', function() {
                    const pngBuffer = Buffer.concat(chunks);
                    const base64String = pngBuffer.toString('base64');
                    resolve(base64String);
                })
                .on('error', function(error) {
                    reject(error);
                });
        });
    }


    isValidCoordinate(x: number, y: number): boolean {
        return x >= 0 && x < this.width && y >= 0 && y < this.height;
    }

    isValidColor(color: any): color is Color {
        if (!color || typeof color !== 'object') return false;
        const { r, g, b, a } = color as Color; // Type assertion
        if (typeof r !== 'number' || typeof g !== 'number' || typeof b !== 'number' || typeof a !== 'number') return false;
        return r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255 && a >= 0 && a <= 255;
    }
}

function generateCanvas(width: number, height: number): Canvas {
    return new Canvas(width, height);
}

function fillRectangle(canvas: Canvas, x: number, y: number, width: number, height: number, color: Color): void {
    if (!(canvas instanceof Canvas)) {
        throw new Error("Invalid canvas object provided.");
    }
    canvas.fillRectangle(x, y, width, height, color);
}

function getCanvasPngBase64(canvas: Canvas): Promise<string> {
    if (!(canvas instanceof Canvas)) {
        throw new Error("Invalid canvas object provided.");
    }
    return canvas.getCanvasPngBase64();
}

function getCanvasData(canvas: Canvas): Pixel[][] { // Exporting getCanvasData instead of getCanvas
    if (!(canvas instanceof Canvas)) {
        throw new Error("Invalid canvas object provided.");
    }
    return canvas.getCanvasData();
}


export {
    generateCanvas,
    fillRectangle,
    getCanvasPngBase64,
    getCanvasData, // Exporting getCanvasData
    Canvas, // Export Canvas class if needed elsewhere
    Color, // Export Color interface if needed elsewhere
};