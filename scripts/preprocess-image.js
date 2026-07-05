const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SOURCE_IMAGE = path.resolve(__dirname, '..', 'OIP-C.webp');
const OUTPUT_DIR = path.resolve(__dirname, '..', 'src', 'renderer', 'assets');

// Ensure output directory exists
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

console.log('Starting image preprocessing...');
console.log('Source:', SOURCE_IMAGE);
console.log('Output:', OUTPUT_DIR);

// Check if Python is available
try {
  execSync('python --version', { stdio: 'pipe' });
  console.log('Python found');
} catch {
  console.error('Python not found. Creating fallback sprite...');
  createFallbackSprite();
  return;
}

// Check if Pillow is available
try {
  execSync('python -c "import PIL"', { stdio: 'pipe' });
  console.log('Pillow found');
} catch {
  console.error('Pillow not installed. Installing...');
  execSync('pip install Pillow', { stdio: 'inherit' });
}

// Write Python script to a file with proper encoding
const pythonScriptPath = path.join(OUTPUT_DIR, '..', '_preprocess_temp.py');
const pythonScript = `
from PIL import Image, ImageFilter
import numpy as np
import sys

source_path = r"""${SOURCE_IMAGE}"""
output_path = r"""${path.join(OUTPUT_DIR, 'pet-sprite.png')}"""

print(f"Opening: {source_path}")

try:
    img = Image.open(source_path).convert("RGBA")
    w, h = img.size
    print(f"Source image: {w}x{h}")

    arr = np.array(img)
    print(f"Array shape: {arr.shape}, dtype: {arr.dtype}")

    # Sample background from corners
    c1 = arr[0:30, 0:30].reshape(-1, 4).mean(axis=0)
    c2 = arr[0:30, -30:].reshape(-1, 4).mean(axis=0)
    c3 = arr[-30:, 0:30].reshape(-1, 4).mean(axis=0)
    c4 = arr[-30:, -30:].reshape(-1, 4).mean(axis=0)
    bg_color = np.array([c1, c2, c3, c4]).mean(axis=0)
    print(f"Background color: RGB={bg_color[:3].astype(int)}, Alpha={bg_color[3]:.0f}")

    # Compute distance from background (RGB only)
    bg_rgb = bg_color[:3].astype(np.float64)
    img_rgb = arr[:, :, :3].astype(np.float64)
    rgb_diff = np.abs(img_rgb - bg_rgb)
    distance = np.sqrt((rgb_diff ** 2).sum(axis=2))

    # Create alpha mask: pixels far from background are opaque
    alpha = np.zeros((h, w), dtype=np.uint8)
    mask_bool = distance > 30
    alpha[mask_bool] = 255

    ratio = alpha.sum() / 255 / (h*w) * 100
    print(f"Opaque pixels: {alpha.sum() / 255:.0f}, total: {h*w}, ratio: {ratio:.1f}%")

    # Smooth edges for anti-aliasing
    alpha_img = Image.fromarray(alpha, mode='L')
    alpha_img = alpha_img.filter(ImageFilter.GaussianBlur(radius=3))
    alpha = np.array(alpha_img).astype(np.uint8)

    # Apply alpha
    alpha_pil = Image.fromarray(alpha, mode='L')
    result = img.copy()
    result.putalpha(alpha_pil)

    # Crop to tightest bounding box of visible content
    mask = alpha > 10
    if mask.any():
        rows = np.any(mask, axis=1)
        cols = np.any(mask, axis=0)
        y_indices = np.where(rows)[0]
        x_indices = np.where(cols)[0]
        y_min = int(y_indices[0])
        y_max = int(y_indices[-1])
        x_min = int(x_indices[0])
        x_max = int(x_indices[-1])

        pad = 10
        y_min = max(0, y_min - pad)
        y_max = min(h, y_max + pad)
        x_min = max(0, x_min - pad)
        x_max = min(w, x_max + pad)

        result = result.crop((x_min, y_min, x_max, y_max))
        print(f"Cropped to: {result.size}")
    else:
        print("Warning: No content found, using full image")

    result.save(output_path, 'PNG')
    print(f"Saved: {output_path} ({result.size[0]}x{result.size[1]})")

except Exception as e:
    import traceback
    traceback.print_exc()
    sys.exit(1)
`;

fs.writeFileSync(pythonScriptPath, pythonScript, 'utf-8');

try {
  execSync(`python "${pythonScriptPath}"`, { stdio: 'inherit' });
  console.log('Image preprocessing complete!');
} catch (err) {
  console.error('Preprocessing failed, creating fallback...');
  createFallbackSprite();
} finally {
  // Clean up temp file
  try { fs.unlinkSync(pythonScriptPath); } catch {}
}

function createFallbackSprite() {
  console.log('Creating fallback sprite...');
  const outputPng = path.join(OUTPUT_DIR, 'pet-sprite.png');
  const pythonScript = `
from PIL import Image
img = Image.new("RGBA", (200, 220), (0, 0, 0, 0))
img.save("${outputPng.replace(/"/g, '\\"')}")
print("Fallback sprite created (200x220 transparent PNG)")
`;
  try {
    execSync(`python -c "${pythonScript.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });
  } catch {
    // Last resort: minimal valid PNG (1x1 transparent pixel)
    const png = Buffer.from(
      '89504e470d0a1a0a0000000d4948445200000001000000010806000000' +
      '1f15c4890000000a49444154789c62600000000200016b338b4e00000000' +
      '49454e44ae426082', 'hex'
    );
    fs.writeFileSync(outputPng, png);
    console.log('Minimal fallback sprite created');
  }
}
