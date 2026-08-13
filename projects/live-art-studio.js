const canvas = document.getElementById("artCanvas");
const ctx = canvas.getContext("2d");

const gridSelect = document.getElementById("gridSize");
const pencilButton = document.getElementById("pencil");
const eraserButton = document.getElementById("eraser");
const clearButton = document.getElementById("clearCanvas");
const toggleGridButton = document.getElementById("toggleGrid");
let showGrid = true;
const importInput = document.getElementById("importCanvas");
const resolutionText = document.getElementById("resolution");
const pixelPosition = document.getElementById("pixelPosition");

const materials = document.querySelectorAll(".material");
const deployButton = document.getElementById("deployArt");
const message = document.getElementById("message");

let gridSize = 40;
let currentTool = "pencil";
let currentColor = "#17447F";
let pixels = [];
let drawing = false;

function createPixelData() {
    pixels = Array.from(
        { length: gridSize },
        () => Array(gridSize).fill(null)
    );
}

function drawCanvas() {
    const scale = canvas.width / gridSize;

    // Clear the actual artwork.
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;

    // Draw only the stored material colors.
    for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
            const pixel = pixels[y][x];

            if (!pixel) continue;

            ctx.fillStyle = pixel;

            ctx.fillRect(
                Math.floor(x * scale),
                Math.floor(y * scale),
                Math.ceil(scale),
                Math.ceil(scale)
            );
        }
    }

    /*
     * GRID OVERLAY
     * The grid is only a visual guide.
     * It is NOT stored in pixels and is NOT used by import/deploy.
     *
     * Use a very light line so it doesn't noticeably alter the artwork.
     */
    if (showGrid) {
        const gridOpacity =
            gridSize <= 75 ? 0.075 :
            gridSize <= 150 ? 0.05 :
            0.03;

        ctx.save();
        ctx.beginPath();
        ctx.strokeStyle = `rgba(0, 0, 0, ${gridOpacity})`;
        ctx.lineWidth = 1;

        for (let i = 0; i <= gridSize; i++) {
            const p = Math.round(i * scale) + 0.5;

            ctx.moveTo(p, 0);
            ctx.lineTo(p, canvas.height);

            ctx.moveTo(0, p);
            ctx.lineTo(canvas.width, p);
        }

        ctx.stroke();
        ctx.restore();
    }

    resolutionText.textContent =
        `${gridSize} × ${gridSize} pixels`;
}

function getPixel(event) {
    const rect = canvas.getBoundingClientRect();

    const x = Math.floor(
        ((event.clientX - rect.left) / rect.width) * gridSize
    );

    const y = Math.floor(
        ((event.clientY - rect.top) / rect.height) * gridSize
    );

    if (x < 0 || y < 0 || x >= gridSize || y >= gridSize) {
        return null;
    }

    return { x, y };
}

function paint(event) {
    const position = getPixel(event);

    if (!position) return;

    const { x, y } = position;

    pixels[y][x] =
        currentTool === "eraser"
            ? null
            : currentColor;

    pixelPosition.textContent =
        `Pixel: ${x}, ${y}`;

    drawCanvas();
}

canvas.addEventListener("pointerdown", event => {
    drawing = true;
    canvas.setPointerCapture(event.pointerId);
    paint(event);
});

canvas.addEventListener("pointermove", event => {
    if (drawing) paint(event);
});

canvas.addEventListener("pointerup", () => {
    drawing = false;
});

canvas.addEventListener("pointercancel", () => {
    drawing = false;
});

pencilButton.addEventListener("click", () => {
    currentTool = "pencil";

    pencilButton.classList.add("active");
    eraserButton.classList.remove("active");
});

eraserButton.addEventListener("click", () => {
    currentTool = "eraser";

    eraserButton.classList.add("active");
    pencilButton.classList.remove("active");
});

materials.forEach(material => {
    material.addEventListener("click", () => {
        materials.forEach(m => m.classList.remove("selected"));

        material.classList.add("selected");

        currentColor =
            material.dataset.color;

        currentTool = "pencil";

        pencilButton.classList.add("active");
        eraserButton.classList.remove("active");
    });
});

clearButton.addEventListener("click", () => {
    const confirmed = window.confirm("Clear the entire canvas?");
    if (!confirmed) return;

    createPixelData();
    pixelPosition.textContent = "Pixel: —";
    drawCanvas();
    showMessage("Canvas cleared");
});

toggleGridButton.addEventListener("click", () => {
    showGrid = !showGrid;
    toggleGridButton.textContent = showGrid ? "Grid: On" : "Grid: Off";
    drawCanvas();
});

gridSelect.addEventListener("change", () => {
    gridSize = Number(gridSelect.value);

    createPixelData();
    drawCanvas();
});

const MATERIAL_COLORS = [
    "#17447F",
    "#00C800",
    "#00C8C8",
    "#C800C8",
    "#6D6E65",
    "#FF0800",
    "#498FE0",
    "#BC0000",
    "#000000"
];

function hexToRgb(hex) {
    return {
        r: parseInt(hex.slice(1, 3), 16),
        g: parseInt(hex.slice(3, 5), 16),
        b: parseInt(hex.slice(5, 7), 16)
    };
}

const MATERIAL_RGB = MATERIAL_COLORS.map(hex => ({
    hex,
    rgb: hexToRgb(hex)
}));

function nearestMaterialColor(r, g, b) {
    let nearest = MATERIAL_RGB[0];
    let bestDistance = Infinity;

    for (const material of MATERIAL_RGB) {
        const dr = r - material.rgb.r;
        const dg = g - material.rgb.g;
        const db = b - material.rgb.b;
        const distance = dr * dr + dg * dg + db * db;

        if (distance < bestDistance) {
            bestDistance = distance;
            nearest = material;
        }
    }

    return nearest.hex;
}

importInput.addEventListener("change", event => {
    const file = event.target.files[0];
    if (!file) return;

    const image = new Image();

    image.onload = () => {
        const temp = document.createElement("canvas");
        temp.width = gridSize;
        temp.height = gridSize;

        const tempCtx = temp.getContext("2d");
        tempCtx.imageSmoothingEnabled = false;

        tempCtx.drawImage(image, 0, 0, gridSize, gridSize);

        const imageData = tempCtx.getImageData(
            0, 0, gridSize, gridSize
        );

        createPixelData();

        for (let y = 0; y < gridSize; y++) {
            for (let x = 0; x < gridSize; x++) {
                const i = (y * gridSize + x) * 4;
                const r = imageData.data[i];
                const g = imageData.data[i + 1];
                const b = imageData.data[i + 2];
                const a = imageData.data[i + 3];

                pixels[y][x] = a > 10
                    ? nearestMaterialColor(r, g, b)
                    : null;
            }
        }

        drawCanvas();
        showMessage(
            `Imported and converted to ${gridSize} × ${gridSize} materials`
        );

        URL.revokeObjectURL(image.src);
    };

    image.src = URL.createObjectURL(file);
    importInput.value = "";
});

const FIXED_BASE64 = `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`;

deployButton.addEventListener("click", async () => {
    const filledPixels =
        pixels.flat().filter(pixel => pixel !== null).length;

    try {
        await navigator.clipboard.writeText(FIXED_BASE64);

        console.log(FIXED_BASE64);

        showMessage(
            `${filledPixels} pixels • Base64 copied`
        );
    } catch (error) {
        console.error(error);

        showMessage(
            `${filledPixels} pixels • Copy failed`
        );
    }
});

function showMessage(text) {
    message.textContent = text;
    message.classList.add("show");

    clearTimeout(showMessage.timer);

    showMessage.timer = setTimeout(
        () => message.classList.remove("show"),
        1800
    );
}

window.getLiveArtData = () => ({
    width: gridSize,
    height: gridSize,
    pixels: pixels.map(row => [...row])
});

createPixelData();
drawCanvas();
