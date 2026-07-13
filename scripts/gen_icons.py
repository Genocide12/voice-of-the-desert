"""Generate PWA icons (192, 512, favicon SVG) for Voice of the Desert."""
from PIL import Image, ImageDraw, ImageFilter
import os

OUT = "/home/z/my-project/public/icons"
os.makedirs(OUT, exist_ok=True)


def make_icon(size: int, path: str):
    """Draw a desert icon: warm circle (sun) over sand dunes silhouette."""
    img = Image.new("RGBA", (size, size), (26, 26, 46, 255))
    draw = ImageDraw.Draw(img)
    for y in range(size):
        ratio = y / size
        r = int(42 + (245 - 42) * ratio * 0.5)
        g = int(30 + (230 - 30) * ratio * 0.5)
        b = int(60 + (200 - 60) * ratio * 0.5)
        draw.line([(0, y), (size, y)], fill=(r, g, b, 255))
    cx, cy = size // 2, int(size * 0.38)
    r = int(size * 0.18)
    for i in range(8, 0, -1):
        alpha = int(20 * (i / 8))
        draw.ellipse(
            [cx - r - i * 3, cy - r - i * 3, cx + r + i * 3, cy + r + i * 3],
            fill=(245, 200, 100, alpha),
        )
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(245, 215, 130, 255))
    dune_color = (60, 35, 25, 255)
    points_back = [(0, size)]
    steps = 12
    for i in range(steps + 1):
        x = (i / steps) * size
        y = size * 0.65 + (size * 0.08) * (1 if i % 2 == 0 else -1) * ((i * 7) % 5) / 5
        points_back.append((x, y))
    points_back.append((size, size))
    draw.polygon(points_back, fill=(80, 50, 30, 255))
    points_front = [(0, size)]
    for i in range(steps + 1):
        x = (i / steps) * size
        y = size * 0.78 + (size * 0.06) * (1 if i % 3 == 0 else -1) * ((i * 11) % 7) / 7
        points_front.append((x, y))
    points_front.append((size, size))
    draw.polygon(points_front, fill=dune_color)
    import random
    random.seed(42)
    for _ in range(int(size / 16)):
        sx = random.randint(0, size)
        sy = random.randint(0, int(size * 0.5))
        sr = random.choice([1, 1, 2])
        draw.ellipse([sx - sr, sy - sr, sx + sr, sy + sr], fill=(255, 255, 220, 180))
    img = img.filter(ImageFilter.SMOOTH_MORE)
    img.save(path, "PNG", optimize=True)
    print(f"  wrote {path}")


print("Generating PWA icons...")
make_icon(192, f"{OUT}/icon-192.png")
make_icon(512, f"{OUT}/icon-512.png")
make_icon(180, f"{OUT}/apple-touch-icon.png")
make_icon(32, f"{OUT}/favicon-32.png")

svg = """<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#2a1e3c"/>
      <stop offset="1" stop-color="#5a3a20"/>
    </linearGradient>
    <radialGradient id="sun" cx="0.5" cy="0.38" r="0.18">
      <stop offset="0" stop-color="#f5d782"/>
      <stop offset="1" stop-color="#d8a040"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" fill="url(#bg)"/>
  <circle cx="256" cy="200" r="80" fill="url(#sun)"/>
  <circle cx="256" cy="200" r="120" fill="#f5c864" opacity="0.15"/>
  <path d="M0,360 Q128,340 256,360 T512,360 L512,512 L0,512 Z" fill="#6a3e22"/>
  <path d="M0,420 Q128,400 256,420 T512,420 L512,512 L0,512 Z" fill="#3c2818"/>
  <g fill="#fff" opacity="0.6">
    <circle cx="80" cy="80" r="1.5"/>
    <circle cx="180" cy="60" r="1"/>
    <circle cx="380" cy="100" r="1.5"/>
    <circle cx="440" cy="50" r="1"/>
    <circle cx="120" cy="140" r="1"/>
    <circle cx="320" cy="80" r="1"/>
  </g>
</svg>
"""
with open(f"{OUT}/icon.svg", "w", encoding="utf-8") as f:
    f.write(svg)
print(f"  wrote {OUT}/icon.svg")
print("Done.")
