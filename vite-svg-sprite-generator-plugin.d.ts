/**
 * Vite SVG Sprite Plugin - TypeScript Definitions (Production-Ready)
 * @version 1.3.0 - Aligned with Vite best practices
 */

import type { Plugin } from 'vite';

// HMR Custom Events Type Definitions
import 'vite/types/customEvent.d.ts';

declare module 'vite/types/customEvent.d.ts' {
  interface CustomEventMap {
    /**
     * Custom HMR event for SVG sprite updates
     * Fired when icons are added/removed/modified in dev mode
     */
    'svg-sprite-update': {
      /** Complete SVG sprite content */
      spriteContent: string;
      /** Number of icons in the sprite */
      iconCount: number;
    };
  }
}

/**
 * Опции плагина SVG Sprite
 */
export interface SvgSpriteOptions {
  /**
   * Папка с SVG иконками
   * @default 'src/icons'
   * @example 'assets/icons'
   */
  iconsFolder?: string;

  /**
   * ID элемента спрайта в DOM
   * @default 'sprite-id'
   * @example 'my-sprite'
   */
  spriteId?: string;

  /**
   * CSS класс спрайта
   * @default 'sprite-class'
   * @example 'custom-sprite'
   */
  spriteClass?: string;

  /**
   * Префикс для ID символов
   * @default '' (empty string - uses only filename)
   * @example 'icon' will generate 'icon-home', 'icon-user'
   * @example '' will generate 'home', 'user'
   */
  idPrefix?: string;

  /**
   * Включить отслеживание изменений в dev-режиме
   * @default true
   */
  watch?: boolean;

  /**
   * Задержка debounce для множественных изменений (мс)
   * @default 100
   */
  debounceDelay?: number;

  /**
   * Подробное логирование
   * @default true (когда NODE_ENV === 'development'), false в остальных случаях
   */
  verbose?: boolean;

  /**
   * Оптимизация SVG с помощью SVGO
   * @default true (когда NODE_ENV === 'production'), false в остальных случаях
   */
  svgoOptimize?: boolean;

  /**
   * Кастомная конфигурация SVGO
   * @default оптимальные настройки для спрайтов
   */
  svgoConfig?: any;

  /**
   * Конвертировать цвета заливки и обводки в currentColor
   * Позволяет управлять цветом иконок через CSS
   * @default true
   * @example
   * // С currentColor: true
   * // <path fill="#000" /> → <path fill="currentColor" />
   * // Теперь можно: .icon { color: red; }
   */
  currentColor?: boolean;

  /**
   * Tree-shaking: включать только используемые иконки
   * Сканирует HTML/JS/TS файлы проекта и находит все <use href="#iconId">
   * Работает ТОЛЬКО в production режиме (vite build)
   * В dev режиме включены все иконки для удобства разработки
   * @default false
   * @example
   * ```ts
   * // vite.config.ts
   * svgSpritePlugin({
   *   iconsFolder: 'src/icons',
   *   treeShaking: true, // Включить tree-shaking
   *   verbose: true      // Показать статистику
   * })
   * 
   * // index.html (только эти иконки попадут в спрайт)
   * <svg><use href="#home"></use></svg>
   * <svg><use href="#user"></use></svg>
   * ```
   */
  treeShaking?: boolean;

  /**
   * Расширения файлов для сканирования при tree-shaking
   * @default ['.html', '.js', '.ts', '.jsx', '.tsx', '.vue', '.svelte']
   * @example ['.html', '.js', '.ts'] // Сканировать только эти типы файлов
   */
  scanExtensions?: string[];
}

/**
 * Vite плагин для генерации SVG спрайтов
 * 
 * @example
 * ```ts
 * import { defineConfig } from 'vite';
 * import svgSpritePlugin from 'vite-svg-sprite-generator-plugin';
 * 
 * export default defineConfig({
 *   plugins: [
 *     svgSpritePlugin({
 *       iconsFolder: 'src/icons',
 *       spriteId: 'icon-sprite',
 *       verbose: true,
 *       svgoOptimize: true
 *     })
 *   ]
 * });
 * ```
 */
export default function svgSpritePlugin(options?: SvgSpriteOptions): Plugin;

