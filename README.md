# 🎨 Vite SVG Sprite Generator Plugin

> Production-ready Vite plugin for automatic SVG sprite generation with HMR, tree-shaking, and SVGO optimization

[![npm version](https://img.shields.io/npm/v/vite-svg-sprite-generator-plugin.svg)](https://www.npmjs.com/package/vite-svg-sprite-generator-plugin)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vite](https://img.shields.io/badge/Vite-4%20%7C%205%20%7C%206%20%7C%207-646CFF?logo=vite)](https://vitejs.dev/)

## Features

- **2-3x faster builds** - Parallel SVG processing (v1.3.0+)
- **Tree-shaking** - Remove unused icons (up to 84% reduction)
- **HMR** - Instant icon updates without page reload
- **SVGO optimization** - 40-60% smaller sprites
- **Security** - XSS & path traversal protection
- **Zero config** - Works out of the box
- **Framework agnostic** - React, Vue, Svelte, any Vite project
- **Multi-page support** - Works with [vite-multi-page-html-generator-plugin](https://www.npmjs.com/package/vite-multi-page-html-generator-plugin)

## Installation

```bash
npm install -D vite-svg-sprite-generator-plugin

# Optional: SVGO for optimization (recommended)
npm install -D svgo
```

## Quick Start

### 1. Configure Vite

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import svgSpritePlugin from 'vite-svg-sprite-generator-plugin';

export default defineConfig({
  plugins: [svgSpritePlugin()]
});
```

### 2. Add SVG Icons

```
src/
  icons/
    home.svg
    user.svg
    search.svg
```

### 3. Use Icons

```html
<svg class="icon">
  <use href="#home" />
</svg>
```

```css
.icon {
  width: 24px;
  height: 24px;
  fill: currentColor;
}
```

## Configuration

```typescript
interface SvgSpriteOptions {
  iconsFolder?: string;        // Default: 'src/icons'
  spriteId?: string;           // Default: 'sprite-id'
  spriteClass?: string;        // Default: 'sprite-class'
  idPrefix?: string;           // Default: ''
  watch?: boolean;             // Default: true (dev)
  debounceDelay?: number;      // Default: 100ms
  verbose?: boolean;           // Default: true (dev)
  svgoOptimize?: boolean;      // Default: true (production)
  svgoConfig?: object;         // Custom SVGO config
  currentColor?: boolean;      // Default: true
  treeShaking?: boolean;       // Default: false
  scanExtensions?: string[];   // Default: ['.html', '.js', '.ts', '.jsx', '.tsx', '.vue', '.svelte']
}
```

### Basic Example

```javascript
svgSpritePlugin({
  iconsFolder: 'src/icons',
  treeShaking: true,
  verbose: true
})
```

### Production Optimized

```javascript
svgSpritePlugin({
  iconsFolder: 'src/icons',
  treeShaking: true,      // Remove unused icons
  svgoOptimize: true,     // Optimize SVG
  currentColor: true      // CSS color control
})
```

## Framework Support

| Framework | Status | Notes |
|-----------|--------|-------|
| **Vite + React** | ✅ Full | [Examples](./VUE_REACT_SVELTE_GUIDE.md#react) |
| **Vite + Vue 3** | ✅ Full | [Examples](./VUE_REACT_SVELTE_GUIDE.md#vue-3) |
| **Vite + Svelte** | ✅ Full | [Examples](./VUE_REACT_SVELTE_GUIDE.md#svelte) |
| **Nuxt 3 (SPA)** | ✅ Full | Set `ssr: false` |
| **Nuxt 3 (SSR)** | ⚠️ Partial | [SSR Guide](./FRAMEWORK_COMPATIBILITY.md#nuxt-3-ssr) |
| **SvelteKit** | ⚠️ Partial | SSR limitations |
| **Next.js** | ❌ No | Uses Webpack, not Vite |
| **Create React App** | ❌ No | Uses Webpack, not Vite |

> **Rule of thumb:** Works with Vite ✅ | Doesn't work with Webpack ❌

### React Example

```jsx
export function Icon({ name, size = 24 }) {
  return (
    <svg width={size} height={size}>
      <use href={`#${name}`} />
    </svg>
  );
}

// Usage
<Icon name="home" />
```

See [complete framework examples](./VUE_REACT_SVELTE_GUIDE.md).

## Key Features

### Tree-Shaking

Remove unused icons from production builds:

```javascript
svgSpritePlugin({
  treeShaking: true  // Enable tree-shaking
})
```

**How it works:**
1. Scans codebase for `<use href="#iconId">`
2. Finds used icons in HTML/JS/TS/JSX/TSX/Vue/Svelte
3. Removes unused icons from production
4. Keeps all icons in dev for better DX

**Results:**
```
50 total icons → 8 used (42 removed, 84% reduction)
Bundle: 45.2 KB → 7.8 KB
```

**Per-page optimization:** In multi-page apps, each HTML page gets only its icons.

### Hot Module Replacement

Changes to SVG files trigger instant updates without page reload:

```
🔄 SVG files changed, regenerating sprite...
✅ HMR: Sprite updated with 10 icons
```

### Security

Automatic protection against:
- **XSS attacks** - Removes `<script>`, event handlers, `javascript:` URLs
- **Path traversal** - Validates icon folder paths
- **Malicious content** - Sanitizes all SVG before injection

### Multi-Page Projects

Works seamlessly with [vite-multi-page-html-generator-plugin](https://www.npmjs.com/package/vite-multi-page-html-generator-plugin):

```javascript
export default defineConfig({
  plugins: [
    multiPagePlugin({
      pagesDir: 'src/pages'
    }),
    svgSpritePlugin({
      treeShaking: true  // Each page gets only its icons
    })
  ]
});
```

## Performance

### Build Time (v1.3.0)

| Icons | v1.2.1 | v1.3.0 | Speedup |
|-------|--------|--------|---------|
| 50    | 850ms  | 420ms  | 2.0x ⚡ |
| 100   | 1.7s   | 810ms  | 2.1x ⚡ |
| 200   | 3.4s   | 1.5s   | 2.3x ⚡ |

### Bundle Size (with tree-shaking)

```
Project: 50 icons total, 8 used

Before: 45.2 KB (all icons)
After:  7.8 KB  (used only)
Saving: 37.4 KB (83% reduction)
```

### SVGO Optimization

```
Average reduction: 40-60%
Example:
  clock.svg: 317 → 228 bytes (-28%)
  layers.svg: 330 → 156 bytes (-53%)
```

## How It Works

The plugin automatically injects the sprite into your HTML:

```html
<body>
  <!-- Injected automatically -->
  <svg id="sprite-id" style="display: none;">
    <symbol id="home" viewBox="0 0 24 24">...</symbol>
    <symbol id="user" viewBox="0 0 24 24">...</symbol>
  </svg>
  
  <!-- Your app -->
  <div id="app"></div>
</body>
```

**Benefits:**
- No separate file requests
- Instant rendering
- Single HTTP request
- Works with SSR/SSG

## Advanced

### Vite Integration

Uses official Vite APIs:
- `enforce: 'pre'` - Run before core plugins
- `apply()` - Conditional execution
- `createFilter()` - Standard file filtering
- HMR API - Hot module replacement

### Plugin Hooks

```javascript
{
  configResolved() {     // Validate paths
  buildStart() {         // Generate sprite
  transformIndexHtml() { // Inject into HTML
  configureServer() {    // Setup HMR
  buildEnd() {           // Cleanup
}
```

### Optimizations

- Parallel SVG processing
- mtime-based caching
- Debounced HMR
- Tree-shaking
- SVGO compression

## Compatibility

- **Vite:** 4.x, 5.x, 6.x, 7.x
- **Node.js:** 14.18.0+
- **TypeScript:** Full support
- **OS:** Windows, macOS, Linux

## Links

- [npm Package](https://www.npmjs.com/package/vite-svg-sprite-generator-plugin)
- [GitHub Repository](https://github.com/gkarev/vite-svg-sprite-generator-plugin)
- [Issues](https://github.com/gkarev/vite-svg-sprite-generator-plugin/issues)
- [Changelog](./CHANGELOG.md)

## Documentation

- [Framework Examples (React/Vue/Svelte)](./VUE_REACT_SVELTE_GUIDE.md)
- [Framework Compatibility (Next.js/Nuxt/etc)](./FRAMEWORK_COMPATIBILITY.md)
- [Tree-Shaking Guide](./TREE_SHAKING_GUIDE.md)

## Related Plugins

- [vite-multi-page-html-generator-plugin](https://www.npmjs.com/package/vite-multi-page-html-generator-plugin) - Multi-page static site generator

## License

MIT © [Karev G.S.](https://github.com/gkarev)

---

**Made with ❤️ for the Vite ecosystem**
