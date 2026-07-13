"""Optimize 3 uploaded images for the site."""
from PIL import Image, ImageOps
import os

SRC = "/home/z/my-project/upload"
OUT_IMAGES = "/home/z/my-project/public/images"
OUT_ICONS = "/home/z/my-project/public/icons"
os.makedirs(OUT_IMAGES, exist_ok=True)
os.makedirs(OUT_ICONS, exist_ok=True)

# ====== 1. IMG_8121.png → icon (PWA + favicon + apple-touch) ======
print("=== Icon (IMG_8121) ===")
img = Image.open(f"{SRC}/IMG_8121.png").convert("RGB")
print(f"  source: {img.size}")

# Generate all required sizes
for size, name in [
    (512, "icon-512.png"),
    (192, "icon-192.png"),
    (180, "apple-touch-icon.png"),
    (32, "favicon-32.png"),
]:
    copy = img.resize((size, size), Image.LANCZOS)
    path = f"{OUT_ICONS}/{name}"
    copy.save(path, "PNG", optimize=True)
    print(f"  {name}: {size}×{size}, {os.path.getsize(path) // 1024} KB")

# ====== 2. IMG_8122.png → background texture (2:1, JPG) ======
print("\n=== Background (IMG_8122) ===")
bg = Image.open(f"{SRC}/IMG_8122.png").convert("RGB")
print(f"  source: {bg.size}")
# Resize to 1440×720 for web
bg = bg.resize((1440, 720), Image.LANCZOS)
path = f"{OUT_IMAGES}/bg-texture.jpg"
bg.save(path, "JPEG", quality=65, optimize=True)
print(f"  bg-texture.jpg: 1440×720, {os.path.getsize(path) // 1024} KB")

# ====== 3. IMG_8120.png → hero (768×768, PNG) ======
print("\n=== Hero (IMG_8120) ===")
hero = Image.open(f"{SRC}/IMG_8120.png").convert("RGB")
print(f"  source: {hero.size}")
# Resize to 768×768
hero = hero.resize((768, 768), Image.LANCZOS)
path = f"{OUT_IMAGES}/hero.png"
hero.save(path, "PNG", optimize=True)
print(f"  hero.png: 768×768, {os.path.getsize(path) // 1024} KB")

# Also create an OG-image (1200×630 is standard, but we use square 1200×1200)
hero_og = Image.open(f"{SRC}/IMG_8120.png").convert("RGB")
hero_og = hero_og.resize((1200, 1200), Image.LANCZOS)
path_og = f"{OUT_IMAGES}/og-image.png"
hero_og.save(path_og, "PNG", optimize=True)
print(f"  og-image.png: 1200×1200, {os.path.getsize(path_og) // 1024} KB")

print("\n✅ All images optimized and saved")
