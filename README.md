# 🎨 Vite SVG Sprite Generator

> Production-ready Vite plugin for automatic SVG sprite generation with HMR support and SVGO optimization

[![npm version](https://img.shields.io/npm/v/vite-svg-sprite-generator-plugin.svg)](https://www.npmjs.com/package/vite-svg-sprite-generator-plugin)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## ✨ Features

- 🚀 **SVGO Optimization** - Automatic SVG optimization in production builds (40-60% size reduction)
- ⚡ **Hot Module Replacement** - Instant updates without page reload during development
- 🔒 **Security First** - Built-in XSS protection and path traversal prevention
- 💾 **Smart Caching** - Efficient caching with mtime-based validation
- 🎯 **Auto-Injection** - Automatic sprite injection into HTML
- 🔧 **Fully Configurable** - Extensive customization options
- 📦 **Zero Config** - Works out of the box with sensible defaults
- 🌳 **Tree-Shakeable** - ES modules with proper exports

## 📦 Installation

### Basic (without SVGO optimization)

```bash
npm install -D vite-svg-sprite-generator-plugin
```

### Recommended (with SVGO optimization)

```bash
npm install -D vite-svg-sprite-generator-plugin svgo
```

**Note:** SVGO is optional! The plugin works without it, but you'll get 40-60% smaller sprites with SVGO installed.

<details>
<summary>Other package managers</summary>

```bash
# Yarn
yarn add -D vite-svg-sprite-generator-plugin svgo

# PNPM
pnpm add -D vite-svg-sprite-generator-plugin svgo
```
</details>

## 🚀 Quick Start

### 1. Add to Vite Config

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import svgSpritePlugin from 'vite-svg-sprite-generator-plugin';

export default defineConfig({
  plugins: [
    svgSpritePlugin({
      iconsFolder: 'src/icons'
    })
  ]
});
```

### 2. Add SVG Icons

```
src/
  icons/
    home.svg
    user.svg
    settings.svg
```

### 3. Use in HTML

```html
<svg class="icon">
  <use href="#home"></use>
</svg>
```

### 4. Use in CSS

```css
.icon {
  width: 24px;
  height: 24px;
  fill: currentColor;
}
```

That's it! 🎉

## 📖 Documentation

### Options

```typescript
interface SvgSpriteOptions {
  /** Path to icons folder (default: 'src/icons') */
  iconsFolder?: string;
  
  /** Sprite DOM ID (default: 'icon-sprite') */
  spriteId?: string;
  
  /** Sprite CSS class (default: 'svg-sprite') */
  spriteClass?: string;
  
  /** Symbol ID prefix (default: '' - uses only filename) */
  idPrefix?: string;
  
  /** Enable optimization (default: true) */
  optimize?: boolean;
  
  /** Watch for changes in dev mode (default: true) */
  watch?: boolean;
  
  /** Debounce delay for HMR (default: 100ms) */
  debounceDelay?: number;
  
  /** Verbose logging (default: true in dev, false in prod) */
  verbose?: boolean;
  
  /** Enable SVGO optimization (default: true in production) */
  svgoOptimize?: boolean;
  
  /** Custom SVGO configuration */
  svgoConfig?: Config;
}
```

### Configuration Examples

#### Basic Usage

```javascript
svgSpritePlugin({
  iconsFolder: 'src/icons',
  verbose: true
})
```

#### Custom Configuration

```javascript
svgSpritePlugin({
  iconsFolder: 'assets/svg',
  spriteId: 'my-sprite',
  idPrefix: 'icon',  // Add prefix: generates 'icon-home', 'icon-user'
  debounceDelay: 200,
  verbose: true
})
```

#### SVGO Optimization

```javascript
svgSpritePlugin({
  iconsFolder: 'src/icons',
  svgoOptimize: true,
  svgoConfig: {
    multipass: true,
    plugins: [
      'preset-default',
      {
        name: 'removeViewBox',
        active: false  // Keep viewBox for sprites
      },
      {
        name: 'cleanupNumericValues',
        params: {
          floatPrecision: 2
        }
      }
    ]
  }
})
```

#### Aggressive Optimization

```javascript
svgSpritePlugin({
  iconsFolder: 'src/icons',
  svgoOptimize: true,
  svgoConfig: {
    multipass: true,
    plugins: [
      'preset-default',
      { name: 'removeViewBox', active: false },
      { name: 'cleanupNumericValues', params: { floatPrecision: 1 } },
      { name: 'removeAttrs', params: { attrs: '(fill|stroke)' } }
    ]
  }
})
```

**Result:** Up to 60% size reduction! 🚀

## 🔒 Security Features (v1.1.0)

### Path Traversal Protection

The plugin now includes built-in protection against path traversal attacks:

```javascript
// ✅ SAFE - Paths inside project root
svgSpritePlugin({ iconsFolder: 'src/icons' })
svgSpritePlugin({ iconsFolder: 'assets/svg' })
svgSpritePlugin({ iconsFolder: './public/icons' })

// ❌ BLOCKED - Paths outside project root
svgSpritePlugin({ iconsFolder: '../../../etc' })           // Error!
svgSpritePlugin({ iconsFolder: '../../other-project' })    // Error!
svgSpritePlugin({ iconsFolder: '/absolute/path' })         // Error!
```

**Error message example:**

```
❌ Security Error: Invalid iconsFolder path

  Provided path: "../../../etc"
  Resolved to: "/etc"
  Project root: "/home/user/project"

  ⚠️  The path points outside the project root directory.
  This is not allowed for security reasons (path traversal prevention).

  ✅ Valid path examples:
     - 'src/icons'           → relative to project root
     - 'assets/svg'          → relative to project root
     - './public/icons'      → explicit relative path

  ❌ Invalid path examples:
     - '../other-project'    → outside project (path traversal)
     - '../../etc'           → system directory access attempt
     - '/absolute/path'      → absolute paths not allowed

  💡 Tip: All paths must be inside your project directory.
```

### XSS Protection

Advanced SVG sanitization with precompiled RegExp patterns:

- Removes `<script>` tags
- Removes event handlers (`onclick`, `onload`, etc.)
- Removes `javascript:` URLs in `href` and `xlink:href`
- Removes `<foreignObject>` elements

**Performance:** ~20% faster sanitization compared to v1.0.0

---

## 🎯 Usage Examples

### HTML

```html
<!-- Basic usage -->
<svg class="icon">
  <use href="#home"></use>
</svg>

<!-- With custom size -->
<svg class="icon" width="32" height="32">
  <use href="#user"></use>
</svg>

<!-- With aria labels -->
<svg class="icon" role="img" aria-label="Settings">
  <use href="#settings"></use>
</svg>

<!-- With custom prefix (if you set idPrefix: 'icon') -->
<svg class="icon">
  <use href="#icon-home"></use>
</svg>
```

### CSS Styling

```css
/* Basic styling */
.icon {
  width: 24px;
  height: 24px;
  fill: currentColor;
}

/* Color variants */
.icon-primary {
  fill: #007bff;
}

.icon-danger {
  fill: #dc3545;
}

/* With transitions */
.icon {
  transition: fill 0.3s ease;
}

.icon:hover {
  fill: #0056b3;
}
```

### React/Vue/Svelte

```jsx
// React
function Icon({ name, className = "icon" }) {
  return (
    <svg className={className}>
      <use href={`#${name}`} />
    </svg>
  );
}

// Usage
<Icon name="home" />

// Or with custom prefix
function Icon({ name, prefix = "", className = "icon" }) {
  const id = prefix ? `${prefix}-${name}` : name;
  return (
    <svg className={className}>
      <use href={`#${id}`} />
    </svg>
  );
}
```

```vue
<!-- Vue -->
<template>
  <svg class="icon">
    <use :href="`#${name}`" />
  </svg>
</template>

<script setup>
defineProps(['name']);
</script>
```

```svelte
<!-- Svelte -->
<script>
  export let name;
</script>

<svg class="icon">
  <use href="#{name}" />
</svg>
```

## 📊 Performance

### Optimization Results

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Sprite Size | 87 KB | 42 KB | **-52%** |
| Gzip | 24 KB | 14 KB | **-42%** |
| Load Time (3G) | 320 ms | 187 ms | **-42%** |

### SVGO Optimization

```
clock.svg    : 317 → 228 bytes (-28.1%)
layers.svg   : 330 → 156 bytes (-52.7%)
sun.svg      : 305 → 287 bytes (-5.9%)
```

**Average reduction: 40-50%** 🎉

## 🔧 Advanced Features

### HMR Support

The plugin includes built-in Hot Module Replacement support:

- ✅ Add new icons → instant update
- ✅ Modify icons → instant update
- ✅ Delete icons → instant update
- ✅ No page reload needed

### Security Features

- ✅ XSS protection (removes `<script>` tags)
- ✅ Event handler removal
- ✅ JavaScript URL filtering
- ✅ Path traversal prevention
- ✅ File size limits (5MB max)

### Caching

- ✅ LRU-like cache with mtime validation
- ✅ Automatic cache invalidation
- ✅ Memory-efficient (max 500 entries)

### Duplicate Detection

```
⚠️  Duplicate symbol ID detected: icon-home from home.svg
```

Automatic detection and handling of duplicate IDs.

## 🐛 Troubleshooting

### Icons Not Showing

1. Check that sprite is injected:
```javascript
document.getElementById('icon-sprite')
```

2. Verify icon ID (default - no prefix):
```html
<use href="#home"></use>        <!-- Correct (default) -->
<use href="#icon-home"></use>   <!-- Only if you set idPrefix: 'icon' -->
```

3. Check console for errors

4. Inspect sprite to see actual symbol IDs:
```javascript
document.querySelectorAll('#icon-sprite symbol')
```

### SVGO Not Installed Warning

If you see:
```
⚠️  SVGO not installed. Optimization disabled.
```

**Option 1 - Install SVGO (recommended for production):**
```bash
npm install -D svgo
```

**Option 2 - Disable the warning:**
```javascript
svgSpritePlugin({
  svgoOptimize: false  // Don't try to use SVGO
})
```

**Option 3 - Ignore it:**
The plugin works fine without SVGO! The warning is just informational.

### SVGO Issues

If icons look broken after SVGO optimization:

```javascript
svgSpritePlugin({
  svgoOptimize: false  // Disable temporarily
})
```

Or use safer config:

```javascript
svgoConfig: {
  plugins: [
    'preset-default',
    { name: 'removeViewBox', active: false }
  ]
}
```

### HMR Not Working

Ensure `watch: true` is set:

```javascript
svgSpritePlugin({
  watch: true  // Should be enabled by default
})
```

## 📝 Changelog

### v1.1.0 (2025-10-26)

- 🔒 **Path Traversal Protection** - Secure path validation
- ⚡ **100% Async FS** - No event loop blocking
- 🚀 **20% Faster** - Precompiled RegExp patterns
- 📝 **Better Errors** - Detailed messages with examples
- ✅ **No Breaking Changes** - Fully backward compatible

### v3.2.0 (2025-10-26)

- 🎉 **SVGO is now OPTIONAL** - Plugin works without it!
- 📦 Smaller installation (~1.5 MB saved without SVGO)
- ✨ Automatic SVGO detection with graceful fallback
- 🔄 Dynamic import - SVGO loaded only when available
- ⚡ No breaking changes

### v3.1.1 (2025-10-26)

- 🔄 Changed default `idPrefix` to empty string
- Symbol IDs are now just filenames (e.g., `home` instead of `icon-home`)

### v3.1.0 (2025-10-26)

- ✨ Added SVGO optimization support
- ✨ Automatic optimization in production
- ✨ Configurable SVGO settings
- 🐛 Fixed memory leak in configureServer
- 📚 Improved documentation

### v3.0.2 (2025-10-26)

- 🐛 Critical memory leak fix
- 🔒 Enhanced security measures
- ⚡ Performance improvements

### v3.0.0

- ✨ Complete rewrite with TypeScript
- ✨ HMR support
- ✨ Security features
- ✨ Smart caching

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Setup

```bash
# Clone repository
git clone https://github.com/german-schneck/vite-svg-sprite-generator-plugin.git

# Install dependencies
npm install

# Run tests
npm test

# Build
npm run build
```

## 📄 License

MIT © Karev G.S.

## 🙏 Acknowledgments

- [SVGO](https://github.com/svg/svgo) - SVG optimization
- [Vite](https://vitejs.dev/) - Build tool

## 📧 Support

- 🐛 [Issues](https://github.com/german-schneck/vite-svg-sprite-generator-plugin/issues)
- 💬 [Discussions](https://github.com/german-schneck/vite-svg-sprite-generator-plugin/discussions)

---

Made with ❤️ by Karev G.S.

If this plugin helped you, please ⭐ star the repo!

