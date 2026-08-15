# Branding

## The symbol

The VORA mark is three converging strokes read as an abstract **V** — scattered inputs resolving into one clear direction, echoing the product's core idea ("VORA turns work chaos into a clear, actionable flow"). It's deliberately not a robot, brain, chatbot bubble, calendar, gear, or generic checkmark — the master prompt's §6 explicitly calls those out as things to avoid, since they're the default AI-product cliché and communicate nothing specific to VORA.

The symbol is designed to work independently of the wordmark — recognizable at favicon size (16×16) with no text attached.

## Source files

```
assets/brand/
├── symbol.svg                    # the mark alone
├── icon-dark.svg                 # mark on a dark surface (primary)
├── icon-light.svg                # mark on a light surface
├── icon-mono.svg                 # single-color/monochrome variant
├── adaptive-foreground.svg       # Android adaptive icon foreground layer
└── adaptive-background.svg       # Android adaptive icon background layer
```

All source assets are SVG. Regenerate the raster derivatives after editing any source file:

```bash
rsvg-convert -w 512 -h 512 assets/brand/icon-dark.svg -o public/icons/icon-512.png
```

## Derived assets

```
public/icons/
├── favicon-16x16.png, favicon-32x32.png, favicon-48x48.png
├── apple-touch-icon.png
├── icon-192.png, icon-512.png, icon-512-maskable.png
├── icon-mono-512.png
├── android-adaptive-foreground.png, android-adaptive-background.png
├── splash-icon.png
```

Every one of these is rasterized from the same `assets/brand/*.svg` source files — the web favicon/PWA icon and the mobile app icon/splash/Android-adaptive-icon are the **same brand asset at different sizes and formats**, not separately designed logos. This satisfies §7 of the master prompt directly: *"The web favicon and mobile app icon MUST visually belong to the same brand."*

## Wordmark

"**Vora**" — title case, never "VORA" in all caps. This was a deliberate correction during development: the product name is stylized as `Vora` in UI text (nav sidebar, mobile header, app title), reserving all-caps `VORA` only for this documentation and prose references to the product/company. Rendered in real **Roboto Bold** on both platforms (web: self-hosted via `@nuxtjs/google-fonts`, not a CDN link, for privacy/offline-friendliness; mobile: `@expo-google-fonts/roboto`) — never the OS/browser system-font fallback, which was a real bug found and fixed mid-project (the web app had declared `Roboto` in `tailwind.config.ts` for the entire session without ever actually loading a font file).

## Color tokens

Source of truth: [`tailwind.config.ts`](../tailwind.config.ts). Derived directly from the existing `portfolio-andrea` codebase's brand values (its neon-green accent, ink/paper grayscale, Roboto typeface) rather than inventing a new palette — per §8 of the master prompt: *"First identify the actual neon green used by portfolio-andrea. Use that as the basis for VORA's primary accent."*

```ts
primary:  #39FF14  (hover #2db30d, active #279c0b, muted #c9ffb8, glow rgba(57,255,20,.35))
ink:      #0a0a0a  (10-step scale, dark UI base)
paper:    #fafaf7  (light UI base)
surface:  #ffffff  (elevated #fafaf7, glass rgba(255,255,255,.6))
success:  #22c55e
warning:  #f59e0b
danger:   #ef4444
info:     #3b82f6
```

Dark mode is the primary/default surface (`darkMode: 'class'` in Tailwind config); light mode swaps `ink`/`paper` roles. Both modes share the same `primary` accent — the neon green is the one constant across every theme and platform, since it's the brand's most recognizable signal.

## Spacing — 4px grid

Also centralized in `tailwind.config.ts`, as the dominant (not absolute) rule for margin/padding/gap across the whole app:

```ts
spacing: {
  1: '4px', 2: '8px', 3: '12px', 4: '16px', 5: '20px', 6: '24px',
  7: '28px', 8: '32px', 10: '40px', 12: '48px', 14: '56px',
  16: '64px', 20: '80px', 24: '96px',
}
```

See §80–83 of the master prompt for the full rationale (hierarchical spacing: related elements get small gaps, distinct sections get large ones).

## Typography scale

```ts
fontSize: {
  display, h1, h2, h3, h4, 'body-lg', body, 'body-sm', caption, label
}
```

Each with its own `line-height`/`letter-spacing` pairing — see `tailwind.config.ts` for exact values. Font weights are restricted to Regular/Medium/Semibold/Bold (§86 of the master prompt) — Regular for body text, Medium for labels, Semibold for secondary headings, Bold reserved for primary hierarchy only.

## Breakpoints

```ts
screens: { xs: '375px', sm: '430px', tablet: '768px', lg: '1024px', xl: '1280px', '2xl': '1440px', wide: '1920px' }
```

Centralized once in `tailwind.config.ts` — never redefined ad hoc in a component. See §79 of the master prompt.

## Configuring the brand name

`APP_NAME`/`APP_DESCRIPTION`/`APP_URL` are **not** hardcoded across the codebase — they're centralized as `NUXT_PUBLIC_APP_NAME`/`NUXT_PUBLIC_APP_URL` in `.env` (see [ENVIRONMENT.md](./ENVIRONMENT.md)), read via `runtimeConfig.public` in `nuxt.config.ts` and used in `<title>`, meta tags, and the manifest. Changing the deployed brand name doesn't require touching component code.
