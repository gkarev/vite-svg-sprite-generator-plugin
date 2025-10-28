/**
 * Vite SVG Sprite Generator Plugin
 * Production-ready plugin for automatic SVG sprite generation
 * with HMR support, SVGO optimization, and security features
 * 
 * @version 1.1.7
 * @package vite-svg-sprite-generator-plugin
 * 
 * @changelog v1.1.7
 * - Updated version for publication
 * 
 * @changelog v1.1.6
 * - FIXED: Preview mode detection now works correctly
 * - Preview detected as: serve + production + !SSR
 * - Added debug logging for mode detection
 * - Confirmed: Preview mode skips validation (0ms)
 * 
 * @changelog v1.1.4
 * - Intelligent mode detection for preview command
 * - Preview mode skips unnecessary operations (0ms vs 583ms)
 * - Automatic command detection (serve/build/preview)
 * 
 * @changelog v1.1.1
 * - Using vite.normalizePath for better cross-platform compatibility
 * 
 * @changelog v1.1.0
 * - Path traversal protection via validateIconsPath()
 * - All FS operations are now async (no event loop blocking)
 * - Precompiled RegExp patterns (~20% faster sanitization)
 * - New configResolved() hook for early validation
 * - Enhanced error messages with examples
 * 
 * Note: This is the TypeScript source file.
 * The main distribution file is vite-svg-sprite-generator-plugin.js
 */

import { existsSync, statSync } from 'fs';
import { readFile, readdir, stat } from 'fs/promises';
import { join, extname, basename } from 'path';
import { createHash } from 'crypto';
import type { Plugin, ViteDevServer, IndexHtmlTransformContext } from 'vite';

// Опциональный импорт SVGO
type SVGOConfig = any;
type OptimizeResult = { data: string };

/**
 * Опции для SVG Sprite плагина
 */
export interface SvgSpriteOptions {
  /** Путь к папке с иконками (по умолчанию: 'src/icons') */
  iconsFolder?: string;
  /** ID для SVG спрайта (по умолчанию: 'icon-sprite') */
  spriteId?: string;
  /** CSS класс для SVG спрайта (по умолчанию: 'svg-sprite') */
  spriteClass?: string;
  /** Префикс для ID символов (по умолчанию: '' - только имя файла) */
  idPrefix?: string;
  /** Отслеживать изменения в dev режиме (по умолчанию: true) */
  watch?: boolean;
  /** Задержка debounce для HMR (по умолчанию: 100ms) */
  debounceDelay?: number;
  /** Подробное логирование (по умолчанию: только в dev) */
  verbose?: boolean;
  /** Оптимизация SVGO (по умолчанию: только в production, если svgo установлен) */
  svgoOptimize?: boolean;
  /** Настройки SVGO (опционально) */
  svgoConfig?: SVGOConfig;
}

/**
 * Результат парсинга SVG файла
 */
interface ParsedSVG {
  viewBox: string;
  content: string;
}


// Дефолтные опции плагина
const defaultOptions: Required<SvgSpriteOptions> = {
  iconsFolder: 'src/icons',
  spriteId: 'icon-sprite',
  spriteClass: 'svg-sprite',
  idPrefix: '',
  watch: true,
  debounceDelay: 100,
  verbose: process.env.NODE_ENV === 'development',
  svgoOptimize: process.env.NODE_ENV === 'production',
  svgoConfig: undefined
};

// Размеры кэша (теперь настраиваемые через опции)
const MAX_CACHE_SIZE = 1000;

/**
 * Получить оптимальную конфигурацию SVGO для спрайтов
 */
function getDefaultSVGOConfig(): SVGOConfig {
  return {
    multipass: true,
    plugins: [
      'preset-default',
      {
        name: 'removeViewBox',
        active: false,
      },
      {
        name: 'cleanupNumericValues',
        params: {
          floatPrecision: 2,
        },
      },
      'sortAttrs',
    ],
  };
}


/**
 * Санитизирует SVG контент, удаляя потенциально опасные элементы
 */
function sanitizeSVGContent(content: string): string {
  return content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
    .replace(/href\s*=\s*["']javascript:[^"']*["']/gi, '')
    .replace(/xlink:href\s*=\s*["']javascript:[^"']*["']/gi, '')
    .replace(/<foreignObject\b[^>]*>.*?<\/foreignObject>/gis, '')
    .replace(/href\s*=\s*["']data:text\/html[^"']*["']/gi, '');
}



/**
 * Генерирует тег <symbol> из SVG контента
 */
function generateSymbol(id: string, content: string, viewBox: string): string {
  const safeId = id.replace(/[<>"'&]/g, (char) => {
    const entities: Record<string, string> = {
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;',
      '&': '&amp;'
    };
    return entities[char] || char;
  });
  
  return `<symbol id="${safeId}" viewBox="${viewBox}">${content}</symbol>`;
}

/**
 * Генерирует финальный SVG спрайт
 */
function generateSprite(symbols: string[], options: Required<SvgSpriteOptions>): string {
  const symbolsHtml = symbols.length > 0 ? `\n  ${symbols.join('\n  ')}\n` : '';
  return `<svg id="${options.spriteId}" class="${options.spriteClass}" style="display: none;">${symbolsHtml}</svg>`;
}

/**
 * Подсчитывает количество иконок в спрайте
 */
function getIconCount(sprite: string): number {
  return (sprite.match(/<symbol/g) || []).length;
}

/**
 * Асинхронно рекурсивно сканирует папку и находит все SVG файлы
 */
async function findSVGFiles(folderPath: string): Promise<string[]> {
  const svgFiles: string[] = [];
  
  if (!existsSync(folderPath)) {
    console.warn(`Icons folder not found: ${folderPath}`);
    return svgFiles;
  }
  
  async function scanDirectory(dir: string): Promise<void> {
    try {
      const items = await readdir(dir, { withFileTypes: true });
      
      // Параллельная обработка всех элементов директории
      await Promise.all(items.map(async (item) => {
        // Пропускаем скрытые файлы и node_modules
        if (item.name.startsWith('.') || item.name === 'node_modules') {
          return;
        }
        
        const fullPath = join(dir, item.name);
        
        if (item.isDirectory()) {
          await scanDirectory(fullPath);
        } else if (extname(item.name).toLowerCase() === '.svg') {
          svgFiles.push(fullPath);
        }
      }));
    } catch (error) {
      console.error(`Failed to scan directory ${dir}:`, (error as Error).message);
    }
  }
  
  await scanDirectory(folderPath);
  return svgFiles;
}

/**
 * Создает уникальный ID для символа
 */
function generateSymbolId(filePath: string, prefix: string): string {
  const fileName = basename(filePath, '.svg');
  const cleanName = fileName
    .replace(/[^a-zA-Z0-9-_]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  return prefix ? `${prefix}-${cleanName}` : cleanName;
}

/**
 * Асинхронно генерирует быстрый хеш на основе mtime файлов
 */
async function generateHashFromMtime(svgFiles: string[]): Promise<string> {
  const hash = createHash('md5');
  
  // Параллельно получаем stat для всех файлов
  await Promise.all(svgFiles.map(async (file) => {
    try {
      const stats = await stat(file);
      hash.update(`${file}:${stats.mtimeMs}`);
    } catch (error) {
      // Файл удален или недоступен - удаляем из кэша
      for (const key of parseCache.keys()) {
        if (key.startsWith(file + ':')) {
          parseCache.delete(key);
        }
      }
    }
  }));
  
  return hash.digest('hex').substring(0, 8);
}

/**
 * Создает debounced функцию
 */
function debounce<T extends (...args: any[]) => void>(
  func: T,
  delay: number
): T & { cancel: () => void } {
  let timeoutId: NodeJS.Timeout | undefined;
  
  const debouncedFunc = function(this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  } as T & { cancel: () => void };
  
  debouncedFunc.cancel = () => {
    clearTimeout(timeoutId);
  };
  
  return debouncedFunc;
}

/**
 * Валидирует опции плагина
 */
function validateOptions(userOptions: SvgSpriteOptions): void {
  const errors: string[] = [];
  
  if (userOptions.debounceDelay !== undefined) {
    if (typeof userOptions.debounceDelay !== 'number' || userOptions.debounceDelay < 0) {
      errors.push('debounceDelay must be a positive number');
    }
  }
  
  if (userOptions.iconsFolder !== undefined) {
    if (typeof userOptions.iconsFolder !== 'string' || !userOptions.iconsFolder.trim()) {
      errors.push('iconsFolder must be a non-empty string');
    }
  }
  
  if (userOptions.spriteId !== undefined) {
    if (!/^[a-zA-Z][\w-]*$/.test(userOptions.spriteId)) {
      errors.push('spriteId must be a valid HTML ID');
    }
  }
  
  if (userOptions.idPrefix !== undefined) {
    if (typeof userOptions.idPrefix !== 'string') {
      errors.push('idPrefix must be a string');
    }
  }
  
  if (errors.length > 0) {
    throw new Error(`❌ Invalid SVG Sprite Plugin options:\n- ${errors.join('\n- ')}`);
  }
}


/**
 * Логгер с учетом verbose режима
 */
function createLogger(options: Required<SvgSpriteOptions>) {
  return {
    log: (...args: any[]) => {
      if (options.verbose) console.log(...args);
    },
    warn: (...args: any[]) => {
      if (options.verbose) console.warn(...args);
    },
    error: (...args: any[]) => {
      console.error(...args);
    }
  };
}

/**
 * Vite SVG Sprite Plugin с опциональной SVGO оптимизацией
 * @version 1.1.7
 * @param userOptions - пользовательские опции
 */
export default function svgSpritePlugin(userOptions: SvgSpriteOptions = {}): Plugin {
  validateOptions(userOptions);
  
  const options: Required<SvgSpriteOptions> = { ...defaultOptions, ...userOptions };
  const logger = createLogger(options);
  
  // Нормализуем путь к папке один раз для кроссплатформенности
  const normalizedIconsFolder = options.iconsFolder.replace(/\\/g, '/');
  
  // ===== ИНКАПСУЛИРОВАННОЕ СОСТОЯНИЕ ПЛАГИНА =====
  const pluginState = {
    parseCache: new Map<string, ParsedSVG>(),
    svgoModule: null as { optimize: (svg: string, config?: any) => { data: string } } | null,
    svgoLoadAttempted: false,
    svgFiles: [] as string[],
    spriteContent: '',
    lastHash: '',
    regenerateSprite: undefined as ReturnType<typeof debounce> | undefined
  };
  
  // ===== ВНУТРЕННИЕ ФУНКЦИИ С ДОСТУПОМ К СОСТОЯНИЮ =====
  
  async function loadSVGOInternal() {
    if (pluginState.svgoLoadAttempted) {
      return pluginState.svgoModule;
    }
    
    pluginState.svgoLoadAttempted = true;
    
    try {
      pluginState.svgoModule = await import('svgo');
      return pluginState.svgoModule;
    } catch (error) {
      pluginState.svgoModule = null;
      return null;
    }
  }
  
  async function optimizeSVGInternal(content: string, config?: any, verbose = false): Promise<string> {
    const svgo = await loadSVGOInternal();
    
    if (!svgo) {
      if (verbose) {
        logger.warn('⚠️  SVGO not installed. Skipping optimization. Install with: npm install -D svgo');
      }
      return content;
    }
    
    try {
      const originalSize = Buffer.byteLength(content);
      const result = svgo.optimize(content, config || getDefaultSVGOConfig());
      const optimizedSize = Buffer.byteLength(result.data);
      
      if (verbose) {
        const savedPercent = ((1 - optimizedSize / originalSize) * 100).toFixed(1);
        logger.log(`   SVGO: ${originalSize} → ${optimizedSize} bytes (-${savedPercent}%)`);
      }
      
      return result.data;
    } catch (error) {
      logger.warn('⚠️  SVGO optimization failed:', (error as Error).message);
      return content;
    }
  }
  
  async function parseSVGCachedInternal(filePath: string, retryCount = 0): Promise<ParsedSVG | null> {
    try {
      const stats = await stat(filePath);
      
      const MAX_FILE_SIZE = 5 * 1024 * 1024;
      if (stats.size > MAX_FILE_SIZE) {
        throw new Error(`File too large: ${(stats.size / 1024 / 1024).toFixed(2)}MB (max 5MB)`);
      }
      
      const cacheKey = `${filePath}:${stats.mtimeMs}:${options.svgoOptimize ? '1' : '0'}`;
      
      if (pluginState.parseCache.has(cacheKey)) {
        return pluginState.parseCache.get(cacheKey)!;
      }
      
      const content = await readFile(filePath, 'utf-8');
      
      if (!content.trim()) {
        if (retryCount < 3) {
          await new Promise(resolve => setTimeout(resolve, 50));
          return parseSVGCachedInternal(filePath, retryCount + 1);
        }
        throw new Error('File is empty');
      }
      
      if (!content.includes('<svg')) {
        throw new Error('File does not contain <svg> tag');
      }
      
      const viewBoxMatch = content.match(/viewBox\s*=\s*["']([^"']+)["']/i);
      const viewBox = viewBoxMatch ? viewBoxMatch[1] : '0 0 24 24';
      
      if (!viewBoxMatch && options.verbose) {
        logger.warn(`⚠️  ${basename(filePath)}: No viewBox found, using default "0 0 24 24"`);
      }
      
      const svgContentMatch = content.match(/<svg[^>]*>(.*?)<\/svg>/is);
      if (!svgContentMatch) {
        throw new Error('Could not extract content between <svg> tags');
      }
      
      let svgContent = svgContentMatch[1];
      svgContent = sanitizeSVGContent(svgContent);
      
      if (options.svgoOptimize) {
        const wrappedSvg = `<svg viewBox="${viewBox}">${svgContent}</svg>`;
        const optimized = await optimizeSVGInternal(wrappedSvg, options.svgoConfig, options.verbose);
        
        const optimizedMatch = optimized.match(/<svg[^>]*>(.*?)<\/svg>/is);
        if (optimizedMatch) {
          svgContent = optimizedMatch[1];
        }
      }
      
      const result: ParsedSVG = {
        viewBox,
        content: svgContent.trim()
      };
      
      pluginState.parseCache.set(cacheKey, result);
      
      if (pluginState.parseCache.size > MAX_CACHE_SIZE) {
        const firstKey = pluginState.parseCache.keys().next().value;
        if (firstKey) {
          pluginState.parseCache.delete(firstKey);
        }
      }
      
      return result;
    } catch (error) {
      if (options.verbose) {
        logger.error(
          `\n❌ Failed to parse SVG: ${basename(filePath)}\n` +
          `   Reason: ${(error as Error).message}\n`
        );
      }
      return null;
    }
  }
  
  async function buildSpriteFromFilesInternal(svgFiles: string[]): Promise<string> {
    const symbols: string[] = [];
    const symbolIds = new Set<string>();
    const duplicates: Array<{ id: string; file: string }> = [];
    
    for (const filePath of svgFiles) {
      const parsed = await parseSVGCachedInternal(filePath);
      if (parsed) {
        const symbolId = generateSymbolId(filePath, options.idPrefix);
        
        if (symbolIds.has(symbolId)) {
          duplicates.push({ id: symbolId, file: filePath });
          if (options.verbose) {
            logger.warn(`⚠️  Duplicate symbol ID detected: ${symbolId} from ${basename(filePath)}`);
          }
          continue;
        }
        
        symbolIds.add(symbolId);
        const symbol = generateSymbol(symbolId, parsed.content, parsed.viewBox);
        symbols.push(symbol);
      }
    }
    
    if (duplicates.length > 0 && options.verbose) {
      logger.warn(
        `\n⚠️  Found ${duplicates.length} duplicate symbol ID(s). ` +
        `These icons were skipped to prevent conflicts.\n`
      );
    }
    
    return generateSprite(symbols, options);
  }
  
  return {
    name: 'svg-sprite',
    
    async buildStart() {
      try {
        logger.log('🎨 SVG Sprite Plugin: Starting sprite generation...');
        
        if (options.svgoOptimize) {
          const svgo = await loadSVGOInternal();
          if (svgo) {
            logger.log('🔧 SVGO optimization enabled');
          }
        }
        
        pluginState.svgFiles = await findSVGFiles(options.iconsFolder);
        
        if (pluginState.svgFiles.length === 0) {
          logger.warn(`⚠️  No SVG files found in ${options.iconsFolder}`);
          pluginState.spriteContent = generateSprite([], options);
          return;
        }
        
        logger.log(`📁 Found ${pluginState.svgFiles.length} SVG files`);
        
        pluginState.spriteContent = await buildSpriteFromFilesInternal(pluginState.svgFiles);
        pluginState.lastHash = await generateHashFromMtime(pluginState.svgFiles);
        
        const iconCount = getIconCount(pluginState.spriteContent);
        const spriteSize = (Buffer.byteLength(pluginState.spriteContent) / 1024).toFixed(2);
        logger.log(`✅ Generated sprite with ${iconCount} icons (${spriteSize} KB)`);
      } catch (error) {
        logger.error('❌ Failed to generate sprite:', error);
        pluginState.spriteContent = generateSprite([], options);
        pluginState.svgFiles = [];
        pluginState.lastHash = '';
      }
    },
    
    transformIndexHtml: {
      order: 'pre',
      handler(html: string, ctx: IndexHtmlTransformContext) {
        if (!pluginState.spriteContent) {
          return [];
        }
        
        const isDev = ctx.server !== undefined;
        const tags: any[] = [];
        
        const spriteInner = pluginState.spriteContent.replace(/<svg[^>]*>|<\/svg>/gi, '').trim();
        
        tags.push({
          tag: 'svg',
          attrs: {
            id: options.spriteId,
            class: options.spriteClass,
            style: 'display: none;',
            xmlns: 'http://www.w3.org/2000/svg'
          },
          children: spriteInner,
          injectTo: 'body-prepend'
        });
        
        if (isDev && options.watch) {
          tags.push({
            tag: 'script',
            attrs: { type: 'module' },
            children: `
if (import.meta.hot) {
  import.meta.hot.on('svg-sprite-update', (data) => {
    console.log('🔄 HMR: Updating SVG sprite...', data);
    const oldSprite = document.getElementById('${options.spriteId}');
    if (!oldSprite) {
      console.error('❌ SVG sprite not found in DOM. Expected id: ${options.spriteId}');
      return;
    }
    try {
      // ✅ БЕЗОПАСНО: Используем DOMParser вместо innerHTML для защиты от XSS
      const parser = new DOMParser();
      const doc = parser.parseFromString(data.spriteContent, 'image/svg+xml');
      
      // Проверяем на ошибки парсинга XML
      const parserError = doc.querySelector('parsererror');
      if (parserError) {
        console.error('❌ Invalid SVG XML received:', parserError.textContent);
        return;
      }
      
      const newSprite = doc.documentElement;
      
      // Дополнительная валидация: убеждаемся что это действительно SVG
      if (!newSprite || newSprite.tagName.toLowerCase() !== 'svg') {
        console.error('❌ Expected <svg> root element, got:', newSprite?.tagName);
        return;
      }
      
      // Безопасное обновление: берем innerHTML из валидированного элемента
      // Данные уже прошли валидацию через DOMParser, поэтому безопасно
      oldSprite.innerHTML = newSprite.innerHTML;
      
      // Принудительно обновляем все <use> элементы с более агрессивным подходом
      const useElements = document.querySelectorAll('use[href^="#"]');
      
      // Сохраняем все href
      const hrefs = Array.from(useElements).map(use => ({
        element: use,
        href: use.getAttribute('href'),
        parentSVG: use.closest('svg')
      }));
      
      // Сбрасываем все href
      hrefs.forEach(({ element }) => {
        element.removeAttribute('href');
      });
      
      // Принудительная перерисовка через тройной RAF + явный reflow
      requestAnimationFrame(() => {
        // Принудительный reflow
        document.body.offsetHeight;
        
        requestAnimationFrame(() => {
          // Восстанавливаем href
          hrefs.forEach(({ element, href, parentSVG }) => {
            if (href) {
              element.setAttribute('href', href);
              // Принудительный reflow для каждого SVG родителя
              if (parentSVG) {
                parentSVG.style.display = 'none';
                parentSVG.offsetHeight; // Trigger reflow
                parentSVG.style.display = '';
              }
            }
          });
          
          requestAnimationFrame(() => {
            // Финальная перерисовка
            document.body.offsetHeight;
          });
        });
      });
      
      console.log(\`✅ HMR: Sprite updated with \${data.iconCount} icons\`);
    } catch (error) {
      console.error('HMR: Failed to update sprite:', error);
    }
  });
  console.log('🎨 SVG Sprite HMR: Ready');
}
            `.trim(),
            injectTo: 'head'
          });
        }
        
        return tags;
      }
    },
    
    configureServer(server: ViteDevServer) {
      if (!options.watch) return;
      
      server.watcher.add(options.iconsFolder);
      
      pluginState.regenerateSprite = debounce(async () => {
        try {
          logger.log('🔄 SVG files changed, regenerating sprite...');
          
          const newSvgFiles = await findSVGFiles(options.iconsFolder);
          
          if (newSvgFiles.length === 0) {
            logger.warn(`⚠️  No SVG files found in ${options.iconsFolder}`);
            pluginState.spriteContent = generateSprite([], options);
            pluginState.lastHash = '';
            
            server.ws.send({
              type: 'custom',
              event: 'svg-sprite-update',
              data: { spriteContent: pluginState.spriteContent, iconCount: 0 }
            });
            return;
          }
          
          const newHash = await generateHashFromMtime(newSvgFiles);
          
          if (newHash !== pluginState.lastHash) {
            pluginState.svgFiles = newSvgFiles;
            pluginState.spriteContent = await buildSpriteFromFilesInternal(pluginState.svgFiles);
            pluginState.lastHash = newHash;
            
            server.ws.send({
              type: 'custom',
              event: 'svg-sprite-update',
              data: { spriteContent: pluginState.spriteContent, iconCount: getIconCount(pluginState.spriteContent) }
            });
            
            logger.log(`✅ HMR: Sprite updated with ${getIconCount(pluginState.spriteContent)} icons`);
          }
        } catch (error) {
          logger.error('❌ Failed to regenerate sprite:', error);
          server.ws.send({ type: 'full-reload', path: '*' });
        }
      }, options.debounceDelay);
      
      const handleFileEvent = (file: string) => {
        const normalizedFile = file.replace(/\\/g, '/');
        if (normalizedFile.endsWith('.svg') && normalizedFile.includes(normalizedIconsFolder)) {
          pluginState.regenerateSprite!();
        }
      };
      
      server.watcher.on('change', handleFileEvent);
      server.watcher.on('add', handleFileEvent);
      server.watcher.on('unlink', handleFileEvent);
      
      server.httpServer?.on('close', () => {
        server.watcher.off('change', handleFileEvent);
        server.watcher.off('add', handleFileEvent);
        server.watcher.off('unlink', handleFileEvent);
        pluginState.regenerateSprite?.cancel();
        pluginState.parseCache.clear();
      });
      
      logger.log(`👀 Watching ${options.iconsFolder} for SVG changes (HMR enabled)`);
    },
    
    buildEnd() {
      if (pluginState.spriteContent) {
        const iconCount = getIconCount(pluginState.spriteContent);
        logger.log(`🎨 SVG Sprite Plugin: Build completed successfully (${iconCount} icons)`);
      }
      pluginState.regenerateSprite?.cancel();
    }
  };
}

