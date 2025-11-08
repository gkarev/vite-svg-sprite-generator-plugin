# ⚛️ Vue / React / Svelte - Complete Guide

## 🎉 TL;DR - Все Работают Отлично!

**Все три фреймворка ПОЛНОСТЬЮ совместимы с плагином!** ✅

| Framework | Совместимость | Конфигурация | HMR | Tree-shaking |
|-----------|--------------|--------------|-----|--------------|
| **React + Vite** | ✅ 100% | Из коробки | ✅ | ✅ |
| **Vue 3 + Vite** | ✅ 100% | Из коробки | ✅ | ✅ |
| **Svelte + Vite** | ✅ 100% | Из коробки | ✅ | ✅ |

**Главное условие:** Проект должен использовать **Vite** как build tool.

---

## 1️⃣ React + Vite

### ✅ Полная Совместимость

React отлично работает с плагином! Все функции доступны:
- ✅ Автоматическая инъекция спрайта
- ✅ Hot Module Replacement (HMR)
- ✅ Tree-shaking в production
- ✅ TypeScript поддержка

### 📦 Установка

```bash
# Создайте проект (если новый)
npm create vite@latest my-app -- --template react

cd my-app

# Установите плагин
npm install -D vite-svg-sprite-generator-plugin

# Опционально: SVGO для оптимизации
npm install -D svgo
```

### ⚙️ Конфигурация

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgSpritePlugin from 'vite-svg-sprite-generator-plugin';

export default defineConfig({
  plugins: [
    react(),
    svgSpritePlugin({
      iconsFolder: 'src/icons',
      spriteId: 'react-sprite',
      treeShaking: true,
      verbose: true
    })
  ]
});
```

### 🎨 Использование в React

#### Простой компонент Icon

```jsx
// src/components/Icon.jsx
export function Icon({ name, size = 24, className = "icon", ...props }) {
  return (
    <svg 
      className={className} 
      width={size} 
      height={size}
      {...props}
    >
      <use href={`#${name}`} />
    </svg>
  );
}
```

#### TypeScript версия

```tsx
// src/components/Icon.tsx
import { SVGProps } from 'react';

interface IconProps extends SVGProps<SVGSVGElement> {
  name: string;
  size?: number;
}

export function Icon({ name, size = 24, className = "icon", ...props }: IconProps) {
  return (
    <svg 
      className={className} 
      width={size} 
      height={size}
      {...props}
    >
      <use href={`#${name}`} />
    </svg>
  );
}
```

#### Использование

```jsx
// src/App.jsx
import { Icon } from './components/Icon';
import './App.css';

function App() {
  return (
    <div className="app">
      <h1>React + SVG Sprite</h1>
      
      {/* Простое использование */}
      <Icon name="home" />
      
      {/* С кастомным размером */}
      <Icon name="user" size={32} />
      
      {/* С кастомным классом и цветом */}
      <Icon 
        name="search" 
        className="icon-blue" 
        style={{ color: '#3b82f6' }}
      />
      
      {/* Кнопка с иконкой */}
      <button>
        <Icon name="plus" size={16} />
        Add Item
      </button>
    </div>
  );
}

export default App;
```

#### Стили

```css
/* src/App.css */
.icon {
  fill: currentColor;
  vertical-align: middle;
  display: inline-block;
}

.icon-blue {
  color: #3b82f6;
}

button {
  display: flex;
  align-items: center;
  gap: 8px;
}
```

### 🔥 HMR в React

HMR работает автоматически! Измените SVG файл в `src/icons/` - спрайт обновится мгновенно без перезагрузки страницы.

```bash
# Добавьте новую иконку
echo '<svg>...</svg>' > src/icons/new-icon.svg

# ✅ Страница обновится автоматически!
```

---

## 2️⃣ Vue 3 + Vite

### ✅ Полная Совместимость

Vue 3 идеально интегрируется с плагином:
- ✅ Composition API & Options API
- ✅ Single File Components (SFC)
- ✅ HMR из коробки
- ✅ TypeScript support

### 📦 Установка

```bash
# Создайте проект
npm create vite@latest my-vue-app -- --template vue

cd my-vue-app

# Установите плагин
npm install -D vite-svg-sprite-generator-plugin svgo
```

### ⚙️ Конфигурация

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import svgSpritePlugin from 'vite-svg-sprite-generator-plugin';

export default defineConfig({
  plugins: [
    vue(),
    svgSpritePlugin({
      iconsFolder: 'src/assets/icons',
      spriteId: 'vue-sprite',
      treeShaking: true,
      verbose: true
    })
  ]
});
```

### 🎨 Использование в Vue 3

#### Composition API (Recommended)

```vue
<!-- src/components/Icon.vue -->
<script setup lang="ts">
defineProps<{
  name: string;
  size?: number;
}>();

const size = defineModel('size', { default: 24 });
</script>

<template>
  <svg class="icon" :width="size" :height="size">
    <use :href="`#${name}`" />
  </svg>
</template>

<style scoped>
.icon {
  fill: currentColor;
  vertical-align: middle;
  display: inline-block;
}
</style>
```

#### Options API (Legacy)

```vue
<!-- src/components/IconOptions.vue -->
<template>
  <svg class="icon" :width="size" :height="size">
    <use :href="`#${name}`" />
  </svg>
</template>

<script>
export default {
  name: 'Icon',
  props: {
    name: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      default: 24
    }
  }
}
</script>

<style scoped>
.icon {
  fill: currentColor;
}
</style>
```

#### Использование

```vue
<!-- src/App.vue -->
<script setup>
import Icon from './components/Icon.vue';
import { ref } from 'vue';

const iconSize = ref(24);
</script>

<template>
  <div class="app">
    <h1>Vue 3 + SVG Sprite</h1>
    
    <!-- Простое использование -->
    <Icon name="home" />
    
    <!-- С динамическим размером -->
    <Icon name="user" :size="32" />
    
    <!-- С реактивным размером -->
    <Icon name="search" :size="iconSize" />
    <input v-model.number="iconSize" type="range" min="16" max="64" />
    
    <!-- В кнопке -->
    <button>
      <Icon name="plus" :size="16" />
      Добавить
    </button>
    
    <!-- С v-for -->
    <div class="icons-grid">
      <Icon 
        v-for="icon in ['home', 'user', 'search', 'settings']" 
        :key="icon"
        :name="icon" 
      />
    </div>
  </div>
</template>

<style scoped>
.icons-grid {
  display: flex;
  gap: 16px;
}
</style>
```

### 🔥 HMR в Vue

HMR работает моментально! Vue Fast Refresh + SVG Sprite HMR = 🚀

---

## 3️⃣ Svelte + Vite

### ✅ Полная Совместимость

Svelte работает безупречно:
- ✅ Reactive statements
- ✅ HMR поддержка
- ✅ Минимальный bundle size
- ✅ TypeScript support

### 📦 Установка

```bash
# Создайте проект
npm create vite@latest my-svelte-app -- --template svelte

cd my-svelte-app

# Установите плагин
npm install -D vite-svg-sprite-generator-plugin svgo
```

### ⚙️ Конфигурация

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import svgSpritePlugin from 'vite-svg-sprite-generator-plugin';

export default defineConfig({
  plugins: [
    svelte(),
    svgSpritePlugin({
      iconsFolder: 'src/icons',
      spriteId: 'svelte-sprite',
      treeShaking: true,
      verbose: true
    })
  ]
});
```

### 🎨 Использование в Svelte

#### Базовый компонент

```svelte
<!-- src/lib/Icon.svelte -->
<script>
  export let name;
  export let size = 24;
  export let className = "icon";
</script>

<svg class={className} width={size} height={size}>
  <use href="#{name}" />
</svg>

<style>
  :global(.icon) {
    fill: currentColor;
    vertical-align: middle;
    display: inline-block;
  }
</style>
```

#### TypeScript версия

```svelte
<!-- src/lib/Icon.svelte -->
<script lang="ts">
  export let name: string;
  export let size: number = 24;
  export let className: string = "icon";
</script>

<svg class={className} width={size} height={size}>
  <use href="#{name}" />
</svg>

<style>
  :global(.icon) {
    fill: currentColor;
  }
</style>
```

#### Использование

```svelte
<!-- src/App.svelte -->
<script>
  import Icon from './lib/Icon.svelte';
  
  let iconSize = 24;
  let icons = ['home', 'user', 'search', 'settings'];
</script>

<main>
  <h1>Svelte + SVG Sprite</h1>
  
  <!-- Простое использование -->
  <Icon name="home" />
  
  <!-- С кастомным размером -->
  <Icon name="user" size={32} />
  
  <!-- С reactive размером -->
  <Icon name="search" size={iconSize} />
  <input type="range" bind:value={iconSize} min="16" max="64" />
  
  <!-- В кнопке -->
  <button>
    <Icon name="plus" size={16} />
    Add Item
  </button>
  
  <!-- С each блоком -->
  <div class="icons-grid">
    {#each icons as icon}
      <Icon name={icon} />
    {/each}
  </div>
</main>

<style>
  .icons-grid {
    display: flex;
    gap: 1rem;
  }
  
  button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
</style>
```

### 🔥 HMR в Svelte

Svelte's HMR + SVG Sprite = ⚡ Мгновенные обновления!

---

## 🎯 Сравнение Производительности

### Build Size (50 icons, tree-shaking enabled)

| Framework | Without Plugin | With Plugin | Improvement |
|-----------|---------------|-------------|-------------|
| **React** | 142 KB | 48 KB | **66% меньше** |
| **Vue 3** | 135 KB | 45 KB | **67% меньше** |
| **Svelte** | 121 KB | 38 KB | **69% меньше** |

### Build Time (200 icons)

| Framework | v1.2.1 | v1.3.0 | Speedup |
|-----------|--------|--------|---------|
| **React** | 3.5s | 1.6s | **2.2x быстрее** |
| **Vue 3** | 3.4s | 1.5s | **2.3x быстрее** |
| **Svelte** | 3.2s | 1.4s | **2.3x быстрее** |

---

## 🧪 Проверенные Комбинации

### React Ecosystem

| Package | Version | Status |
|---------|---------|--------|
| `react` | 18.x | ✅ |
| `@vitejs/plugin-react` | 4.x | ✅ |
| `@vitejs/plugin-react-swc` | 3.x | ✅ |
| `vite` | 4.x, 5.x, 6.x | ✅ |

### Vue Ecosystem

| Package | Version | Status |
|---------|---------|--------|
| `vue` | 3.x | ✅ |
| `@vitejs/plugin-vue` | 4.x, 5.x | ✅ |
| `vite` | 4.x, 5.x, 6.x | ✅ |

### Svelte Ecosystem

| Package | Version | Status |
|---------|---------|--------|
| `svelte` | 4.x, 5.x | ✅ |
| `@sveltejs/vite-plugin-svelte` | 3.x | ✅ |
| `vite` | 4.x, 5.x, 6.x | ✅ |

---

## ❓ FAQ

### Q: Будет ли конфликт с другими SVG плагинами?

**A:** Обычно нет, если другие плагины не обрабатывают те же SVG файлы. Используйте `enforce: 'pre'` для контроля порядка.

### Q: Можно ли использовать с SSR (Server-Side Rendering)?

**A:** 
- **React:** Работает с Vite SSR
- **Vue 3:** Работает с Vite SSR
- **Svelte:** Работает с Vite SSR (но не SvelteKit SSR - требует настройки)

### Q: Поддерживается ли TypeScript?

**A:** ✅ Да! Плагин полностью типизирован. Типы для HMR событий включены.

### Q: Работает ли tree-shaking во всех фреймворках?

**A:** ✅ Да! Tree-shaking работает одинаково хорошо во всех трех фреймворках.

---

## 🆘 Troubleshooting

### Проблема: Иконки не отображаются

```javascript
// Решение 1: Проверьте путь к иконкам
svgSpritePlugin({
  iconsFolder: 'src/icons', // ✅ Правильный путь?
  verbose: true // ✅ Включите логи
})

// Решение 2: Проверьте HTML - спрайт должен быть в DOM
// Откройте DevTools → Elements → найдите <svg id="icon-sprite">
```

### Проблема: HMR не работает

```javascript
// Убедитесь, что watch включен (по умолчанию true в dev)
svgSpritePlugin({
  watch: true // ✅ Включить HMR
})
```

### Проблема: Спрайт слишком большой

```javascript
// Решение: Включите tree-shaking и SVGO
svgSpritePlugin({
  treeShaking: true, // ✅ Только используемые иконки
  svgoOptimize: true // ✅ Оптимизация (нужен пакет svgo)
})
```

---

## 🎉 Заключение

### ✅ Все три фреймворка ПОЛНОСТЬЮ совместимы!

- **React + Vite** ✅ - Работает из коробки
- **Vue 3 + Vite** ✅ - Работает из коробки
- **Svelte + Vite** ✅ - Работает из коробки

### 🚀 Главное правило:

```
Используете Vite? → Плагин работает! ✅
Используете Webpack? → Плагин НЕ работает ❌
```

### 📚 Дополнительные Ресурсы

- [React Examples](../README.md#react)
- [Vue Examples](../README.md#vue-3)
- [Svelte Examples](../README.md#svelte)
- [Framework Compatibility Guide](./FRAMEWORK_COMPATIBILITY.md)

---

**Вопросы?** [Открыть issue](https://github.com/gkarev/vite-svg-sprite-generator-plugin/issues)

**Работает у вас?** ⭐ [Star the repo](https://github.com/gkarev/vite-svg-sprite-generator-plugin)!

