# Инструкция: Создание изображений через нейросеть для «Голоса Пустыни»

> У тебя есть всего **3 изображения**. Эта инструкция поможет создать их так, чтобы они одинаково хорошо смотрелись на десктопе, в мобильном Safari и в Telegram Web App.

---

## Принцип: 3 изображения = 3 роли

| № | Роль | Где используется | Соотношение |
|---|------|-----------------|-------------|
| **1** | **Hero / обложка** | Стартовый экран, OG-image, превью | **1:1** (квадрат) |
| **2** | **Иконка-эмблема** | PWA иконка, favicon, аватар бота | **1:1** (квадрат, минимальный) |
| **3** | **Фоновая текстура** | Фон карточек / разделов (subtle) | **2:1** (широкий) |

### Почему так:
- **Квадрат 1:1** универсально работает везде: десктоп, мобильный, Telegram preview, OG-image
- **Иконка 1:1** — обязательное требование PWA (192px, 512px) и Telegram
- **Фон 2:1** — масштабируется без обрезки на любом экране

---

## Изображение 1: Hero / обложка (стартовый экран)

### Промпт для нейросети (Midjourney / DALL-E / Stable Diffusion)

```
A lone monk silhouette walking through endless desert dunes at golden hour,
minimalist zen aesthetic, warm amber and deep indigo sky, soft sand texture,
dramatic long shadows, spiritual atmosphere, vast emptiness, single figure
on a dune ridge, sun low on horizon, sand particles in air, cinematic wide shot,
muted pastel colors with warm highlights, meditation, solitude. Style: Japanese
woodblock print meets minimal photography. No text. No watermark.

--ar 1:1 --style raw --quality 2 --v 6
```

**Важно:** промпт указывает `muted pastel colors` — это соответствует текущей мягкой палитре игры (chroma 0.015–0.04). Избегай насыщенных цветов.

### Технические требования
- **Размер**: 1024×1024 px (или больше, потом уменьшим)
- **Формат**: PNG (с прозрачностью) или JPG (без прозрачности)
- **Вес**: до 500 KB после оптимизации
- **Имя файла**: `hero.png`

### Как использовать в коде:
```tsx
// Стартовый экран (page.tsx → StartScreen)
<div className="relative w-full max-w-sm aspect-square mx-auto">
  <img src="/images/hero.png" alt="" className="w-full h-full object-cover rounded-2xl opacity-90" />
  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent rounded-2xl" />
</div>
```

---

## Изображение 2: Иконка-эмблема (PWA + бот + favicon)

### Промпт

```
Minimalist app icon, desert dune silhouette with sun/moon, soft muted amber
gradient on deep night-blue background, simple geometric shapes, flat design,
centered composition, no text, zen aesthetic, spiritual, single sun disc,
layered dunes. Style: modern app icon, clean, scalable, pastel colors.
Must read well at 32px.

--ar 1:1 --style raw --v 6
```

### Технические требования
- **Размер**: 1024×1024 px (исходный), потом генерируем 192px + 512px
- **Формат**: PNG (без прозрачности для maskable)
- **Вес**: до 200 KB
- **Имя файла**: `icon-source.png`

### Как генерировать финальные размеры:
```bash
# Используй sharp или Pillow для генерации:
# icon-192.png (192×192) — PWA, Telegram
# icon-512.png (512×512) — PWA, Apple Touch
# favicon-32.png (32×32) — browser tab
# apple-touch-icon.png (180×180) — iOS home screen
```

### Важно для maskable иконки:
- **Safe zone**: контент в центре 80% (края могут обрезаться)
- **Без текста** (будет нечитаем на 32px)
- **Контрастный фон** (не прозрачный)
- **Мягкие цвета** — соответствуют палитре игры (amber на indigo, chroma ≤0.06)

---

## Изображение 3: Фоновая текстура (subtle pattern)

### Промпт

```
Seamless desert sand texture, subtle dune patterns, very muted and low contrast,
warm pastel ochre tones, minimal, almost abstract, soft gradients, no objects,
no figures, just texture. Background for meditation app, should be barely visible
behind content. Style: minimal, calm, zen, pastel.

--ar 2:1 --style raw --v 6
```

### Технические требования
- **Размер**: 2048×1024 px (широкий)
- **Формат**: JPG (допустимы артефакты, меньше вес)
- **Вес**: до 150 KB (можно агрессивно сжать — текстура прощает)
- **Имя файла**: `bg-texture.jpg`
- **Opacity в коде**: 0.03–0.06 (еле видимый)

### Как использовать:
```tsx
// Фон всего приложения (layout.tsx)
<div className="fixed inset-0 -z-10">
  <img src="/images/bg-texture.jpg" alt="" className="w-full h-full object-cover opacity-[0.04]" />
</div>
```

---

## Оптимизация: после генерации

### Шаг 1: Уменьшить размер (Pillow / sharp)

```python
# scripts/optimize_images.py
from PIL import Image
import os

# Hero: 1024×1024 → 768×768 (достаточно для retina)
img = Image.open("hero-source.png")
img = img.resize((768, 768), Image.LANCZOS)
img.save("public/images/hero.png", "PNG", optimize=True)

# Icon: генерируем все размеры из одного источника
img = Image.open("icon-source.png")
for size, name in [(192, "icon-192.png"), (512, "icon-512.png"), (180, "apple-touch-icon.png"), (32, "favicon-32.png")]:
    copy = img.resize((size, size), Image.LANCZOS)
    copy.save(f"public/icons/{name}", "PNG", optimize=True)

# Background: 2048×1024 → 1440×720, JPG качество 60
bg = Image.open("bg-source.png")
bg = bg.resize((1440, 720), Image.LANCZOS)
bg.save("public/images/bg-texture.jpg", "JPEG", quality=60, optimize=True)
```

### Шаг 2: Проверить вес

```bash
# Целевые веса:
# hero.png      ≤ 500 KB
# icon-192.png  ≤ 30 KB
# icon-512.png  ≤ 100 KB
# bg-texture.jpg ≤ 150 KB
```

### Шаг 3: Responsive srcset (для hero)

```tsx
// Используй Next.js Image для автоматической оптимизации
import Image from 'next/image';

<Image
  src="/images/hero.png"
  alt=""
  width={768}
  height={768}
  priority
  sizes="(max-width: 768px) 100vw, 768px"
  className="rounded-2xl"
/>
```

---

## Куда положить файлы

```
public/
├── images/
│   ├── hero.png           # Стартовый экран
│   └── bg-texture.jpg     # Фон (subtle)
├── icons/
│   ├── icon-192.png       # PWA + Telegram
│   ├── icon-512.png       # PWA + Apple
│   ├── apple-touch-icon.png
│   ├── favicon-32.png
│   └── icon.svg           # Векторная версия (опционально)
```

---

## Как обновить manifest.json и layout.tsx

### manifest.json
```json
{
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

### layout.tsx (metadata)
```typescript
export const metadata = {
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
  openGraph: {
    images: ['/images/hero.png'],
  },
};
```

---

## Чек-лист перед деплоем

- [ ] Hero.png: 768×768, ≤500 KB, квадрат
- [ ] Icon-192.png: 192×192, ≤30 KB, без прозрачности
- [ ] Icon-512.png: 512×512, ≤100 KB, без прозрачности
- [ ] Bg-texture.jpg: 1440×720, ≤150 KB, JPG quality 60
- [ ] Все иконки читаемы на 32px (проверь в favicon)
- [ ] Hero работает в светлой и тёмной теме (overlay gradient)
- [ ] Фон текстуры opacity 0.03–0.06 (еле видимый)
- [ ] manifest.json указывает на новые иконки
- [ ] layout.tsx metadata обновлена
- [ ] OG-image (hero.png) — для красивого превью в соцсетях
- [ ] Цвета изображений соответствуют мягкой палитре игры (pastel, chroma ≤0.06)

---

## Адаптивность: как одно изображение работает везде

### Принцип: квадрат 1:1 + object-cover

```tsx
// Hero на стартовом экране — один код, работает везде:
<div className="w-full max-w-sm aspect-square mx-auto">
  <img
    src="/images/hero.png"
    alt=""
    className="w-full h-full object-cover rounded-2xl"
  />
</div>
```

| Платформа | Поведение |
|-----------|----------|
| **Десктоп** | `max-w-sm` (384px) квадрат по центру |
| **Мобильный Safari** | `w-full` (100% ширины) квадрат |
| **Telegram Web App** | То же, что мобильный |
| **OG-image** | Квадрат 1:1 — идеален для превью |

### Фон: 2:1 + object-cover

```tsx
// Фоновая текстура — масштабируется без обрезки:
<img
  src="/images/bg-texture.jpg"
  className="fixed inset-0 w-full h-full object-cover opacity-[0.04] -z-10"
/>
```

---

## Палитра игры (для согласования изображений)

Текущая палитра — **мягкая, пастельная** (chroma 0.015–0.04):

| Фаза | Background | Primary | Accent |
|------|------------|---------|--------|
| **Day** | soft sand (0.97 0.015 70) | muted amber (0.62 0.06 55) | pastel (0.82 0.04 65) |
| **Dusk** | muted amber (0.48 0.04 45) | soft amber (0.78 0.06 60) | muted (0.72 0.06 55) |
| **Night** | soft indigo (0.18 0.015 270) | muted blue (0.68 0.05 250) | soft purple (0.55 0.05 280) |
| **Dawn** | soft rose (0.91 0.02 30) | muted rose (0.62 0.06 30) | pastel (0.78 0.04 35) |

**Изображения должны использовать эту палитру** — мягкие, ненасыщенные тона. Избегай ярких/кислотных цветов.

---

## Альтернатива: если нейросеть недоступна

Если нет доступа к Midjourney/DALL-E, сгенерируй иконку через Python (как сделано сейчас):

```bash
python scripts/gen_icons.py
```

Этот скрипт создаёт процедурную иконку (солнце + дюны) — не такую красивую, как нейросеть, но рабочую.

---

## Итог: 3 файла, которые нужны

1. **`/public/images/hero.png`** — 768×768, стартовый экран + OG-image
2. **`/public/icons/icon-512.png`** — 512×512, PWA + Apple + favicon (из неё генерируются 192 и 32)
3. **`/public/images/bg-texture.jpg`** — 1440×720, subtle фон

Всё остальное (192px, 32px, apple-touch) — генерируется из `icon-512.png` через скрипт оптимизации.

**После создания изображений** положи их в `public/images/` и `public/icons/`, обнови `layout.tsx` и `manifest.json`, закоммить и задеплой. Веб-версия, мобильный Safari и Telegram Web App будут показывать одну и ту же графику.
