# HexCMS Studio Theme System

This document provides detailed information about the theme system architecture, implementation, and customization options.

## Overview

HexCMS Studio uses a CSS custom property (CSS variables) based theme system. Themes are applied via the `data-theme` attribute on the root HTML element and controlled by the `ThemeToggle` component.

## Theme Architecture

### How It Works

1. **Theme Storage**: The selected theme is stored in `localStorage` under the key `hexcms-theme`
2. **Theme Application**: The `data-theme` attribute is set on the `<html>` element
3. **CSS Variables**: Each theme defines a set of CSS custom properties
4. **Tailwind Integration**: Tailwind's `@theme` directive maps CSS variables to utility classes

### File Structure

```
src/
├── app/
│   └── globals.css          # Theme variable definitions
├── components/
│   └── ThemeToggle/
│       └── index.tsx        # Theme switcher component
```

## Theme Definitions

### Light Theme (Default)

```css
:root,
[data-theme="light"] {
  --background: #ffffff;      /* Pure white */
  --foreground: #171717;      /* Near black */
  --muted: #f4f4f5;           /* Light gray */
  --muted-foreground: #71717a; /* Medium gray */
  --border: #e4e4e7;          /* Light border */
  --accent: #3b82f6;          /* Blue */
  --accent-foreground: #ffffff;
}
```

### Dark Theme

```css
[data-theme="dark"],
.dark {
  --background: #18181b;      /* Dark zinc */
  --foreground: #fafafa;      /* Off-white */
  --muted: #27272a;           /* Darker zinc */
  --muted-foreground: #a1a1aa; /* Light gray */
  --border: #3f3f46;          /* Dark border */
  --accent: #3b82f6;          /* Blue */
  --accent-foreground: #ffffff;
}
```

### Midnight Theme

A deeper, blue-tinted dark theme using Tailwind's slate color palette:

```css
[data-theme="midnight"] {
  --background: #0f172a;      /* Slate 900 */
  --foreground: #e2e8f0;      /* Slate 200 */
  --muted: #1e293b;           /* Slate 800 */
  --muted-foreground: #94a3b8; /* Slate 400 */
  --border: #334155;          /* Slate 700 */
  --accent: #6366f1;          /* Indigo */
  --accent-foreground: #ffffff;
}
```

### Sepia Theme

A warm, paper-like theme optimized for reading:

```css
[data-theme="sepia"] {
  --background: #faf8f1;      /* Warm white */
  --foreground: #3d2e1c;      /* Dark brown */
  --muted: #ebe4d3;           /* Warm cream */
  --muted-foreground: #6b5d4d; /* Medium brown */
  --border: #c9bfad;          /* Warm border */
  --accent: #b45309;          /* Amber */
  --accent-foreground: #ffffff;
}
```

## Tailwind Integration

### Theme Mapping

The `@theme inline` directive in `globals.css` maps CSS variables to Tailwind utility classes:

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-border: var(--border);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
}
```

### Using Theme Colors

Use the semantic color classes in your components:

```tsx
// Backgrounds
<div className="bg-background">Main content area</div>
<div className="bg-muted">Secondary/card background</div>

// Text
<p className="text-foreground">Primary text</p>
<p className="text-muted-foreground">Secondary text</p>

// Borders
<div className="border border-border">Bordered element</div>

// Accents
<button className="bg-accent text-accent-foreground">Action Button</button>
```

## Zinc Color Overrides

For components using Tailwind's zinc color scale (e.g., `bg-zinc-100`, `text-zinc-700`), each theme provides override values to maintain consistency:

```css
[data-theme="midnight"] {
  --tw-zinc-50: #f8fafc;
  --tw-zinc-100: #f1f5f9;
  --tw-zinc-200: #e2e8f0;
  --tw-zinc-300: #cbd5e1;
  --tw-zinc-400: #94a3b8;
  --tw-zinc-500: #64748b;
  --tw-zinc-600: #475569;
  --tw-zinc-700: #334155;
  --tw-zinc-800: #1e293b;
  --tw-zinc-900: #0f172a;
}
```

## Typography (Prose) Styling

The Tailwind Typography plugin (`@tailwindcss/typography`) uses its own color variables. These are overridden for all themes to ensure consistent text rendering:

```css
.prose,
.prose-zinc {
  --tw-prose-body: var(--foreground) !important;
  --tw-prose-headings: var(--foreground) !important;
  --tw-prose-lead: var(--muted-foreground) !important;
  --tw-prose-links: var(--accent) !important;
  --tw-prose-bold: var(--foreground) !important;
  --tw-prose-counters: var(--muted-foreground) !important;
  --tw-prose-bullets: var(--muted-foreground) !important;
  --tw-prose-hr: var(--border) !important;
  --tw-prose-quotes: var(--foreground) !important;
  --tw-prose-quote-borders: var(--border) !important;
  --tw-prose-captions: var(--muted-foreground) !important;
  --tw-prose-code: var(--foreground) !important;
  --tw-prose-pre-code: var(--foreground) !important;
  --tw-prose-pre-bg: var(--muted) !important;
  --tw-prose-th-borders: var(--border) !important;
  --tw-prose-td-borders: var(--border) !important;
  color: var(--foreground) !important;
}
```

## TipTap Editor Styling

The TipTap WYSIWYG editor uses ProseMirror under the hood. Text colors are explicitly set:

```css
.ProseMirror {
  color: var(--foreground) !important;
}

.ProseMirror h1,
.ProseMirror h2,
.ProseMirror h3,
.ProseMirror p,
.ProseMirror li,
.ProseMirror strong {
  color: var(--foreground) !important;
}
```

## ThemeToggle Component

The `ThemeToggle` component manages theme selection:

```tsx
const themes = [
  { id: "light", label: "Light", icon: "☀️" },
  { id: "dark", label: "Dark", icon: "🌙" },
  { id: "midnight", label: "Midnight", icon: "🌌" },
  { id: "sepia", label: "Sepia", icon: "📜" },
  { id: "system", label: "System", icon: "💻" },
];
```

### System Theme

The "System" option follows the user's OS preference using `prefers-color-scheme`:

```css
@media (prefers-color-scheme: dark) {
  :root:not([data-theme]) {
    --background: #18181b;
    --foreground: #fafafa;
    /* ... dark theme values */
  }
}
```

## Transitions

Smooth theme transitions are applied globally:

```css
*,
*::before,
*::after {
  transition-property: background-color, border-color;
  transition-duration: 0.15s;
  transition-timing-function: ease;
}
```

### Preventing Flash on Load

A `.no-transitions` class disables transitions during initial page load to prevent visual flicker:

```css
.no-transitions *,
.no-transitions *::before,
.no-transitions *::after {
  transition: none !important;
}
```

## Creating a New Theme

### Step 1: Define Theme Variables

Add your theme definition in `globals.css`:

```css
[data-theme="ocean"] {
  --background: #0a1628;
  --foreground: #e0f2fe;
  --muted: #1e3a5f;
  --muted-foreground: #7dd3fc;
  --border: #2563eb;
  --accent: #0ea5e9;
  --accent-foreground: #ffffff;
}
```

### Step 2: Add Zinc Overrides

```css
[data-theme="ocean"] {
  --tw-zinc-50: #f0f9ff;
  --tw-zinc-100: #e0f2fe;
  --tw-zinc-200: #bae6fd;
  --tw-zinc-300: #7dd3fc;
  --tw-zinc-400: #38bdf8;
  --tw-zinc-500: #0ea5e9;
  --tw-zinc-600: #0284c7;
  --tw-zinc-700: #0369a1;
  --tw-zinc-800: #075985;
  --tw-zinc-900: #0c4a6e;
}
```

### Step 3: Register the Theme

Update `ThemeToggle/index.tsx`:

```tsx
const themes = [
  // ... existing themes
  { id: "ocean", label: "Ocean", icon: "🌊" },
];
```

## Best Practices

### DO

- Use semantic color classes (`bg-background`, `text-foreground`) instead of raw colors
- Test all themes when adding new UI elements
- Ensure sufficient contrast ratios for accessibility
- Use `border-border` for consistent border styling

### DON'T

- Don't use hardcoded colors (e.g., `bg-white`, `text-black`)
- Don't use `dark:` prefixes - use the semantic classes instead
- Don't forget to test the Sepia theme (it has different warm tones)

## Troubleshooting

### Text Not Visible in Dark Themes

Ensure you're using `text-foreground` or `text-muted-foreground` instead of hardcoded colors.

### Borders Not Visible

Use `border-border` class and ensure sufficient contrast in your theme's `--border` value.

### Prose Content Wrong Color

The prose styling uses `!important` to override Tailwind Typography defaults. If text is still wrong, check that your element has the `.prose` class.

### Theme Not Persisting

Check that `localStorage` is available and the `hexcms-theme` key is being set correctly.
