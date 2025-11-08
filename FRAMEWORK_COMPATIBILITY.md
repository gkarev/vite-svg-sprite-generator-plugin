# 🔌 Framework Compatibility Guide

## Overview

This plugin is a **Vite-specific plugin** and works only with projects that use Vite as their build tool.

---

## ✅ Fully Compatible Frameworks

### 1. **Vanilla Vite Projects**
```javascript
// vite.config.js
import { defineConfig } from 'vite';
import svgSpritePlugin from 'vite-svg-sprite-generator-plugin';

export default defineConfig({
  plugins: [svgSpritePlugin()]
});
```
**Status:** ✅ **Fully Supported**

---

### 2. **React + Vite**
```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgSpritePlugin from 'vite-svg-sprite-generator-plugin';

export default defineConfig({
  plugins: [
    react(),
    svgSpritePlugin()
  ]
});
```
**Status:** ✅ **Fully Supported**

---

### 3. **Vue 3 + Vite**
```javascript
// vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import svgSpritePlugin from 'vite-svg-sprite-generator-plugin';

export default defineConfig({
  plugins: [
    vue(),
    svgSpritePlugin()
  ]
});
```
**Status:** ✅ **Fully Supported**

---

### 4. **Svelte + Vite**
```javascript
// vite.config.js
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import svgSpritePlugin from 'vite-svg-sprite-generator-plugin';

export default defineConfig({
  plugins: [
    svelte(),
    svgSpritePlugin()
  ]
});
```
**Status:** ✅ **Fully Supported**

---

## ⚠️ Partially Compatible Frameworks

### 5. **Nuxt 3** (SSR/SSG)

**Status:** ⚠️ **Partially Supported with Limitations**

Nuxt 3 uses Vite, but has SSR-specific challenges:

#### ✅ Works:
- Client-side rendering
- Static generation (`nuxt generate`)
- Dev mode HMR

#### ❌ Potential Issues:

**1. SSR Hydration Mismatch**
```javascript
// Problem: Server renders without sprite, client expects it
// Solution: Ensure sprite is in HTML template before hydration
```

**2. `transformIndexHtml` Hook Limitations**
Nuxt generates HTML on the server, not during Vite's build process.

#### 🔧 Nuxt 3 Configuration

```javascript
// nuxt.config.ts
export default defineNuxtConfig({
  vite: {
    plugins: [
      // Import as ES module
      (await import('vite-svg-sprite-generator-plugin')).default({
        iconsFolder: 'assets/icons',
        spriteId: 'nuxt-icon-sprite',
        // Disable tree-shaking in SSR mode (or it might break)
        treeShaking: false,
        verbose: true
      })
    ]
  }
})
```

#### 🚨 Known Issues:

1. **Sprite injection in SSR:** The plugin injects sprite via `transformIndexHtml`, which might not work in SSR mode. You may need to manually include sprite in `app.vue` or layout.

2. **HMR in SSR:** Hot Module Replacement works only on client side.

#### ✅ Recommended Approach for Nuxt 3:

**Option A: Manual Sprite Inclusion**
```vue
<!-- app.vue or layouts/default.vue -->
<template>
  <div>
    <!-- Manually include sprite (generated during build) -->
    <div v-html="spriteContent" style="display: none;"></div>
    <NuxtPage />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const spriteContent = ref('');

onMounted(async () => {
  // Load sprite on client side
  const response = await fetch('/__sprite.svg'); // if served as static
  spriteContent.value = await response.text();
});
</script>
```

**Option B: Use in Static Generation Only**
```javascript
// nuxt.config.ts
export default defineNuxtConfig({
  ssr: false, // Disable SSR - use as SPA
  vite: {
    plugins: [
      (await import('vite-svg-sprite-generator-plugin')).default()
    ]
  }
})
```

---

## ❌ Incompatible Frameworks

### 6. **Next.js**

**Status:** ❌ **Not Compatible**

**Why:** Next.js uses **Webpack** (or **Turbopack**), not Vite.

**Alternatives for Next.js:**
1. `svg-sprite-loader` (Webpack plugin)
2. `next-svg-sprite-plugin`
3. Custom build scripts with `svg-sprite` npm package

---

### 7. **Create React App (CRA)**

**Status:** ❌ **Not Compatible**

**Why:** CRA uses Webpack.

**Solution:** Migrate to Vite with `vite-react` or use Webpack alternatives.

---

### 8. **Nuxt 2**

**Status:** ❌ **Not Compatible**

**Why:** Nuxt 2 uses Webpack.

**Solution:** Upgrade to Nuxt 3 or use Webpack sprite plugins.

---

## 🎯 SSR/SSG Considerations

### Challenges with SSR

This plugin was designed for **Client-Side Rendering (CSR)** and **Static Site Generation (SSG)**. SSR introduces challenges:

1. **HTML Injection Timing:** `transformIndexHtml` runs at build time, not at request time (SSR)
2. **Hydration:** Server-rendered HTML must match client HTML exactly
3. **HMR:** Only works on client side

### Best Practices for SSR Frameworks

#### ✅ DO:
- Use with **SSG** (Static Site Generation) mode
- Pre-render pages with sprite included
- Disable tree-shaking in SSR mode
- Test hydration carefully

#### ❌ DON'T:
- Rely on HMR in SSR mode
- Use tree-shaking with dynamic SSR pages
- Expect sprite injection to work at request time

---

## 🧪 Testing Compatibility

### Quick Test for Your Framework

```javascript
// vite.config.js (or framework's Vite config)
import svgSpritePlugin from 'vite-svg-sprite-generator-plugin';

export default {
  plugins: [
    svgSpritePlugin({
      iconsFolder: 'src/icons',
      verbose: true, // Enable logs to see if plugin runs
      watch: true
    })
  ]
}
```

Run `npm run dev` and check console for:
```
✅ SVG Sprite Generator: Starting...
✅ Generated sprite with X icons
```

If you see these logs → Plugin is working! ✅

---

## 📊 Compatibility Matrix

| Framework | Build Tool | Status | Notes |
|-----------|------------|--------|-------|
| **Vite** | Vite | ✅ Full | Primary target |
| **React + Vite** | Vite | ✅ Full | Recommended |
| **Vue 3 + Vite** | Vite | ✅ Full | Recommended |
| **Svelte + Vite** | Vite | ✅ Full | Recommended |
| **Nuxt 3 (SPA)** | Vite | ✅ Full | Set `ssr: false` |
| **Nuxt 3 (SSR)** | Vite | ⚠️ Partial | Manual sprite inclusion needed |
| **Nuxt 3 (SSG)** | Vite | ✅ Full | Works with `nuxt generate` |
| **Astro** | Vite | ✅ Full* | Needs testing |
| **SvelteKit** | Vite | ⚠️ Partial | SSR limitations apply |
| **SolidJS + Vite** | Vite | ✅ Full* | Should work, needs testing |
| **Next.js** | Webpack/Turbopack | ❌ No | Use Webpack plugins |
| **CRA** | Webpack | ❌ No | Migrate to Vite or use Webpack plugins |
| **Nuxt 2** | Webpack | ❌ No | Upgrade to Nuxt 3 |
| **Gatsby** | Webpack | ❌ No | Use Webpack plugins |

\* = Should work in theory, but not extensively tested

---

## 🔧 Framework-Specific Troubleshooting

### Nuxt 3 Issues

**Problem:** Sprite not appearing in SSR pages
```javascript
// Solution 1: Disable SSR
export default defineNuxtConfig({
  ssr: false
})

// Solution 2: Use client-only component
<ClientOnly>
  <svg><use href="#icon" /></svg>
</ClientOnly>
```

**Problem:** HMR not working
```javascript
// This is expected - HMR works only on client side in SSR
// For dev, consider using SPA mode
```

---

## 🆘 Need Help?

If your framework uses Vite but isn't listed here:

1. ✅ Try adding the plugin to `vite.config.js`
2. ✅ Enable `verbose: true` to see logs
3. ✅ Check if `transformIndexHtml` hook is supported
4. ✅ Test with simple icons first
5. ❌ If it doesn't work, [open an issue](https://github.com/gkarev/vite-svg-sprite-generator-plugin/issues)

---

## 📚 Related Documentation

- [Vite Plugin API](https://vitejs.dev/guide/api-plugin.html)
- [Nuxt 3 Vite Configuration](https://nuxt.com/docs/api/configuration/nuxt-config#vite)
- [SvelteKit Vite Plugins](https://kit.svelte.dev/docs/configuration#vite)
- [Astro Vite Integration](https://docs.astro.build/en/guides/integrations-guide/)

---

**Last Updated:** 2025-11-08  
**Plugin Version:** 1.3.0

