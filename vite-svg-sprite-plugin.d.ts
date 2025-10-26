/**
 * Vite SVG Sprite Plugin - TypeScript Definitions (Production-Ready)
 * @version 3.1.0 - SVGO optimization integration
 */

import type { Plugin } from 'vite';

/**
 * Опции плагина SVG Sprite
 */
export interface SvgSpritePluginOptions {
  /**
   * Папка с SVG иконками
   * @default 'src/icons'
   * @example 'assets/icons'
   */
  iconsFolder?: string;

  /**
   * ID элемента спрайта в DOM
   * @default 'icon-sprite'
   * @example 'my-sprite'
   */
  spriteId?: string;

  /**
   * CSS класс спрайта
   * @default 'svg-sprite'
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
   * Оптимизировать SVG (будущая функция)
   * @default true
   */
  optimize?: boolean;

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
   * @default true в development, false в production
   */
  verbose?: boolean;

  /**
   * Оптимизация SVG с помощью SVGO
   * @default true в production, false в development
   */
  svgoOptimize?: boolean;

  /**
   * Кастомная конфигурация SVGO
   * @default оптимальные настройки для спрайтов
   */
  svgoConfig?: any;
}

/**
 * Информация об иконке в спрайте
 */
export interface SpriteIcon {
  /** Уникальный ID символа */
  id: string;
  /** Относительный путь к файлу */
  file: string;
}

/**
 * Vite плагин для генерации SVG спрайтов
 * 
 * @example
 * ```ts
 * import { defineConfig } from 'vite';
 * import svgSpritePlugin from './vite-svg-sprite-plugin';
 * 
 * export default defineConfig({
 *   plugins: [
 *     svgSpritePlugin({
 *       iconsFolder: 'src/icons',
 *       spriteId: 'icon-sprite',
 *       verbose: true
 *     })
 *   ]
 * });
 * ```
 */
export default function svgSpritePlugin(options?: SvgSpritePluginOptions): Plugin;

/**
 * Виртуальный модуль для программного доступа к спрайту
 * 
 * @example
 * ```ts
 * import { getIconHref, icons, useIcon } from 'virtual:svg-sprite';
 * 
 * // Получить href для иконки
 * const href = getIconHref('home'); // '#icon-home'
 * 
 * // Список всех доступных иконок
 * console.log(icons); // [{ id: 'icon-home', file: 'src/icons/home.svg' }, ...]
 * 
 * // Создать SVG элемент
 * const svg = useIcon('home', { width: 24, height: 24 });
 * ```
 */
declare module 'virtual:svg-sprite' {
  /**
   * ID спрайта в DOM
   */
  export const spriteId: string;

  /**
   * Список всех доступных иконок
   */
  export const icons: SpriteIcon[];

  /**
   * Получить href для использования в <use>
   * @param name Имя иконки (без префикса)
   * @returns href строка, например '#icon-home'
   * 
   * @example
   * ```ts
   * const href = getIconHref('home');
   * // '<svg><use href="#icon-home"></use></svg>'
   * ```
   */
  export function getIconHref(name: string): string;

  /**
   * Создать SVG элемент с иконкой
   * @param name Имя иконки (без префикса)
   * @param attrs Атрибуты для SVG элемента
   * @returns HTML строка с SVG элементом
   * 
   * @example
   * ```ts
   * const svg = useIcon('home', { 
   *   width: 24, 
   *   height: 24,
   *   fill: 'currentColor'
   * });
   * document.body.innerHTML += svg;
   * ```
   */
  export function useIcon(
    name: string,
    attrs?: Record<string, string | number>
  ): string;
}

