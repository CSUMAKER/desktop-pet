const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SOURCE_IMAGE = path.resolve(__dirname, '..', 'OIP-C.webp');
const OUTPUT_PATH = path.resolve(__dirname, '..', 'src', 'renderer', 'assets', 'pet-sprite.png');

console.log('Generating pixel-art style pet image...');

// Check if Python is available
try {
  execSync('python --version', { stdio: 'pipe' });
} catch {
  console.error('Python not found.');
  process.exit(1);
}

try {
  execSync('python -c "import PIL"', { stdio: 'pipe' });
} catch {
  console.log('Installing Pillow...');
  execSync('pip install Pillow', { stdio: 'inherit' });
}

// Write Python script to temp file to avoid quoting issues
const tmpPy = path.join(__dirname, '_gen_pixel.py');
const pythonScript = `
from PIL import Image
import numpy as np

source_path = r"${SOURCE_IMAGE}"
output_path = r"${OUTPUT_PATH}"

img = Image.open(source_path).convert("RGBA")
w, h = img.size
print(f"Source: {w}x{h}")

# Reduce resolution for pixel art
pixel_size = 4
pw = max(1, w // pixel_size)
ph = max(1, h // pixel_size)

# Downscale with nearest neighbor
small = img.resize((pw, ph), Image.NEAREST)

arr = np.array(small)
r, g, b, a = arr[:, :, 0], arr[:, :, 1], arr[:, :, 2], arr[:, :, 3]

# Quantize to 4-bit palette (16 levels per channel)
quant = lambda ch: ((ch >> 4) << 4).astype(np.uint8)
r_q = quant(r)
g_q = quant(g)
b_q = quant(b)

# Clean alpha: strictly 0 or 255
a_clean = np.where(a > 128, 255, 0).astype(np.uint8)

# Reassemble
result_arr = np.stack([r_q, g_q, b_q, a_clean], axis=-1)
result = Image.fromarray(result_arr, mode="RGBA")

# Upscale for visibility
scale = 3
final_size = (pw * scale, ph * scale)
final = result.resize(final_size, Image.NEAREST)

# Ensure clean alpha
pixels = final.load()
for y in range(final.size[1]):
    for x in range(final.size[0]):
        px = pixels[x, y]
        if px[3] == 0:
            pixels[x, y] = (0, 0, 0, 0)

final.save(output_path, "PNG")
print(f"Saved: {final.size[0]}x{final.size[1]} -> {output_path}")
`;

fs.writeFileSync(tmpPy, pythonScript, 'utf-8');
try {
  execSync(`python "${tmpPy}"`, { stdio: 'inherit' });
  console.log('Pixel art generation complete!');
} finally {
  try { fs.unlinkSync(tmpPy); } catch {}
}
