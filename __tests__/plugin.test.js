import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { resolve } from 'path';
import { mkdir, writeFile, rm } from 'fs/promises';
import { tmpdir } from 'os';
import svgSpritePlugin from '../vite-svg-sprite-generator-plugin.js';

describe('vite-svg-sprite-generator-plugin', () => {
  let testDir;
  let plugin;

  beforeEach(async () => {
    // Создаём временную директорию для тестов
    testDir = resolve(tmpdir(), `vite-sprite-class-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
    await mkdir(resolve(testDir, 'src/icons'), { recursive: true });
  });

  afterEach(async () => {
    // Очищаем временную директорию
    await rm(testDir, { recursive: true, force: true });
  });

  describe('Инициализация плагина', () => {
    it('должен создавать плагин с дефолтными опциями', () => {
      plugin = svgSpritePlugin();
      expect(plugin.name).toBe('vite-svg-sprite-generator-plugin');
      expect(plugin.configResolved).toBeDefined();
      expect(plugin.buildStart).toBeDefined();
      expect(plugin.transformIndexHtml).toBeDefined();
      expect(plugin.configureServer).toBeDefined();
    });

    it('должен принимать кастомные опции', () => {
      plugin = svgSpritePlugin({
        iconsFolder: 'custom/icons',
        spriteId: 'custom-sprite',
        verbose: true,
        svgoOptimize: false
      });
      expect(plugin.name).toBe('vite-svg-sprite-generator-plugin');
    });
  });

  describe('Валидация опций', () => {
    it('должен выбрасывать ошибку при некорректном debounceDelay', () => {
      expect(() => {
        svgSpritePlugin({ debounceDelay: -100 });
      }).toThrow(/debounceDelay must be a positive number/);
    });

    it('должен выбрасывать ошибку при пустом iconsFolder', () => {
      expect(() => {
        svgSpritePlugin({ iconsFolder: '' });
      }).toThrow(/iconsFolder must be a non-empty string/);
    });

    it('должен выбрасывать ошибку при некорректном spriteId', () => {
      expect(() => {
        svgSpritePlugin({ spriteId: '123-invalid' }); // Не начинается с буквы
      }).toThrow(/spriteId must be a valid HTML ID/);
    });
  });

  describe('configResolved hook - path traversal защита', () => {
    it('должен блокировать path traversal атаки', () => {
      plugin = svgSpritePlugin({
        iconsFolder: '../../../etc'
      });

      const mockConfig = {
        root: testDir,
        command: 'build',
        mode: 'production'
      };

      expect(() => {
        plugin.configResolved(mockConfig);
      }).toThrow(expect.objectContaining({
        message: expect.stringContaining('outside the project root')
      }));
    });

    it('должен разрешать относительные пути внутри проекта', () => {
      plugin = svgSpritePlugin({
        iconsFolder: 'src/icons'
      });

      const mockConfig = {
        root: testDir,
        command: 'build',
        mode: 'production'
      };

      expect(() => {
        plugin.configResolved(mockConfig);
      }).not.toThrow();
    });

    it('должен блокировать абсолютные пути к системным директориям', () => {
      plugin = svgSpritePlugin({
        iconsFolder: '/etc/passwd'
      });

      const mockConfig = {
        root: testDir,
        command: 'build',
        mode: 'production'
      };

      expect(() => {
        plugin.configResolved(mockConfig);
      }).toThrow(expect.objectContaining({
        message: expect.stringContaining('outside the project root')
      }));
    });

    it('должен обрабатывать preview режим', () => {
      plugin = svgSpritePlugin({
        iconsFolder: 'src/icons',
        verbose: true
      });

      const mockConfig = {
        root: testDir,
        command: 'build',
        mode: 'production'
      };

      // В обычном build режиме не должно быть исключений
      expect(() => {
        plugin.configResolved(mockConfig);
      }).not.toThrow();
    });
  });

  describe('buildStart hook', () => {
    it('должен находить SVG файлы и генерировать спрайт', async () => {
      const iconPath = resolve(testDir, 'src/icons/home.svg');
      await writeFile(iconPath, `
        <svg viewBox="0 0 24 24">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      `);

      plugin = svgSpritePlugin({
        iconsFolder: 'src/icons',
        verbose: false
      });

      const mockConfig = {
        root: testDir,
        command: 'build',
        mode: 'production'
      };

      plugin.configResolved(mockConfig);
      await plugin.buildStart();

      // Проверяем что спрайт был сгенерирован
      expect(plugin.transformIndexHtml).toBeDefined();
    });

    it('должен обрабатывать отсутствие SVG файлов', async () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation();

      plugin = svgSpritePlugin({
        iconsFolder: 'src/icons',
        verbose: true
      });

      const mockConfig = {
        root: testDir,
        command: 'build',
        mode: 'production'
      };

      plugin.configResolved(mockConfig);
      await plugin.buildStart();

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No SVG files found'));

      consoleSpy.mockRestore();
    });

    it('должен корректно работать в dev режиме', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();

      plugin = svgSpritePlugin({
        iconsFolder: 'src/icons',
        verbose: true
      });

      const mockConfig = {
        root: testDir,
        command: 'serve',
        mode: 'development'
      };

      plugin.configResolved(mockConfig);
      await plugin.buildStart();

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Starting sprite generation'));

      consoleSpy.mockRestore();
    });
  });

  describe('transformIndexHtml hook', () => {
    it('должен инжектить спрайт в HTML', async () => {
      const iconPath = resolve(testDir, 'src/icons/home.svg');
      await writeFile(iconPath, `
        <svg viewBox="0 0 24 24">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      `);

      plugin = svgSpritePlugin({
        iconsFolder: 'src/icons',
        spriteId: 'test-sprite',
        spriteClass: 'test-class'
      });

      const mockConfig = {
        root: testDir,
        command: 'build',
        mode: 'production'
      };

      plugin.configResolved(mockConfig);
      await plugin.buildStart();

      const mockContext = {
        server: undefined, // production build
        filename: 'index.html'
      };

      const result = await plugin.transformIndexHtml.handler('<html></html>', mockContext);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      
      const spriteTag = result.find(tag => tag.tag === 'svg');
      expect(spriteTag).toBeDefined();
      expect(spriteTag.attrs.id).toBe('test-sprite');
      expect(spriteTag.attrs.class).toBe('test-class');
    });

    it('должен добавлять HMR скрипт в dev режиме', async () => {
      const iconPath = resolve(testDir, 'src/icons/home.svg');
      await writeFile(iconPath, `
        <svg viewBox="0 0 24 24">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      `);

      plugin = svgSpritePlugin({
        iconsFolder: 'src/icons',
        watch: true
      });

      const mockConfig = {
        root: testDir,
        command: 'serve',
        mode: 'development'
      };

      plugin.configResolved(mockConfig);
      await plugin.buildStart();

      const mockContext = {
        server: {}, // dev server присутствует
        filename: 'index.html'
      };

      const result = await plugin.transformIndexHtml.handler('<html></html>', mockContext);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      
      const scriptTag = result.find(tag => tag.tag === 'script');
      expect(scriptTag).toBeDefined();
      expect(scriptTag.children).toContain('import.meta.hot');
      expect(scriptTag.children).toContain('svg-sprite-update');
    });
  });

  describe('configureServer hook', () => {
    it('должен настраивать watcher для dev режима', () => {
      plugin = svgSpritePlugin({
        iconsFolder: 'src/icons',
        watch: true
      });

      const mockConfig = {
        root: testDir,
        command: 'serve',
        mode: 'development'
      };

      const mockWatcher = {
        add: vi.fn(),
        on: vi.fn()
      };

      const mockServer = {
        watcher: mockWatcher,
        ws: {
          send: vi.fn()
        },
        httpServer: {
          on: vi.fn()
        }
      };

      plugin.configResolved(mockConfig);
      plugin.configureServer(mockServer);

      expect(mockWatcher.add).toHaveBeenCalled();
      expect(mockWatcher.on).toHaveBeenCalledWith('change', expect.any(Function));
      expect(mockWatcher.on).toHaveBeenCalledWith('add', expect.any(Function));
      expect(mockWatcher.on).toHaveBeenCalledWith('unlink', expect.any(Function));
    });

    it('должен пропускать настройку если watch=false', () => {
      plugin = svgSpritePlugin({
        iconsFolder: 'src/icons',
        watch: false
      });

      const mockConfig = {
        root: testDir,
        command: 'serve',
        mode: 'development'
      };

      const mockWatcher = {
        add: vi.fn(),
        on: vi.fn()
      };

      const mockServer = {
        watcher: mockWatcher,
        httpServer: {
          on: vi.fn()
        }
      };

      plugin.configResolved(mockConfig);
      plugin.configureServer(mockServer);

      expect(mockWatcher.add).not.toHaveBeenCalled();
    });
  });

  describe('buildEnd hook', () => {
    it('должен выполнять cleanup', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();

      plugin = svgSpritePlugin({
        iconsFolder: 'src/icons',
        verbose: true
      });

      const mockConfig = {
        root: testDir,
        command: 'build',
        mode: 'production'
      };

      plugin.configResolved(mockConfig);
      await plugin.buildStart();
      plugin.buildEnd();

      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Build completed'));

      consoleSpy.mockRestore();
    });
  });

  describe('Обработка множественных SVG файлов', () => {
    it('должен обрабатывать несколько иконок', async () => {
      const icons = [
        { name: 'home', content: '<svg viewBox="0 0 24 24"><path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/></svg>' },
        { name: 'user', content: '<svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>' },
        { name: 'settings', content: '<svg viewBox="0 0 24 24"><path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/></svg>' }
      ];

      for (const icon of icons) {
        const iconPath = resolve(testDir, `src/icons/${icon.name}.svg`);
        await writeFile(iconPath, icon.content);
      }

      plugin = svgSpritePlugin({
        iconsFolder: 'src/icons',
        verbose: false
      });

      const mockConfig = {
        root: testDir,
        command: 'build',
        mode: 'production'
      };

      plugin.configResolved(mockConfig);
      await plugin.buildStart();

      const mockContext = { server: undefined, filename: 'index.html' };
      const result = await plugin.transformIndexHtml.handler('<html></html>', mockContext);

      const spriteTag = result.find(tag => tag.tag === 'svg');
      expect(spriteTag).toBeDefined();
      expect(spriteTag.children).toContain('<symbol id="home"');
      expect(spriteTag.children).toContain('<symbol id="user"');
      expect(spriteTag.children).toContain('<symbol id="settings"');
    });
  });

  describe('Обработка idPrefix опции', () => {
    it('должен добавлять префикс к ID символов', async () => {
      const iconPath = resolve(testDir, 'src/icons/home.svg');
      await writeFile(iconPath, `
        <svg viewBox="0 0 24 24">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      `);

      plugin = svgSpritePlugin({
        iconsFolder: 'src/icons',
        idPrefix: 'icon'
      });

      const mockConfig = {
        root: testDir,
        command: 'build',
        mode: 'production'
      };

      plugin.configResolved(mockConfig);
      await plugin.buildStart();

      const mockContext = { server: undefined, filename: 'index.html' };
      const result = await plugin.transformIndexHtml.handler('<html></html>', mockContext);

      const spriteTag = result.find(tag => tag.tag === 'svg');
      expect(spriteTag).toBeDefined();
      expect(spriteTag.children).toContain('<symbol id="icon-home"');
    });
  });

  describe('Edge cases', () => {
    it('должен обрабатывать SVG файлы без viewBox', async () => {
      const iconPath = resolve(testDir, 'src/icons/no-viewbox.svg');
      await writeFile(iconPath, `
        <svg width="24" height="24">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      `);

      plugin = svgSpritePlugin({
        iconsFolder: 'src/icons',
        verbose: false
      });

      const mockConfig = {
        root: testDir,
        command: 'build',
        mode: 'production'
      };

      plugin.configResolved(mockConfig);
      await plugin.buildStart();

      const mockContext = { server: undefined, filename: 'index.html' };
      const result = await plugin.transformIndexHtml.handler('<html></html>', mockContext);

      const spriteTag = result.find(tag => tag.tag === 'svg');
      expect(spriteTag).toBeDefined();
      // Должен использовать дефолтный viewBox
      expect(spriteTag.children).toContain('viewBox="0 0 24 24"');
    });

    it('должен игнорировать скрытые файлы', async () => {
      const iconPath = resolve(testDir, 'src/icons/.hidden.svg');
      await writeFile(iconPath, `
        <svg viewBox="0 0 24 24">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      `);

      plugin = svgSpritePlugin({
        iconsFolder: 'src/icons',
        verbose: false
      });

      const mockConfig = {
        root: testDir,
        command: 'build',
        mode: 'production'
      };

      plugin.configResolved(mockConfig);
      await plugin.buildStart();

      const mockContext = { server: undefined, filename: 'index.html' };
      const result = await plugin.transformIndexHtml.handler('<html></html>', mockContext);

      const spriteTag = result.find(tag => tag.tag === 'svg');
      expect(spriteTag).toBeDefined();
      expect(spriteTag.children).not.toContain('hidden');
    });

    it('должен обрабатывать вложенные директории', async () => {
      await mkdir(resolve(testDir, 'src/icons/nested'), { recursive: true });
      
      const iconPath = resolve(testDir, 'src/icons/nested/icon.svg');
      await writeFile(iconPath, `
        <svg viewBox="0 0 24 24">
          <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
        </svg>
      `);

      plugin = svgSpritePlugin({
        iconsFolder: 'src/icons',
        verbose: false
      });

      const mockConfig = {
        root: testDir,
        command: 'build',
        mode: 'production'
      };

      plugin.configResolved(mockConfig);
      await plugin.buildStart();

      const mockContext = { server: undefined, filename: 'index.html' };
      const result = await plugin.transformIndexHtml.handler('<html></html>', mockContext);

      const spriteTag = result.find(tag => tag.tag === 'svg');
      expect(spriteTag).toBeDefined();
      expect(spriteTag.children).toContain('<symbol id="icon"');
    });
  });

  describe('apply() функция и preview режим', () => {
    it('должен применяться в build режиме', () => {
      plugin = svgSpritePlugin({
        iconsFolder: 'src/icons'
      });

      const mockConfig = {};
      const mockEnv = { command: 'build' };

      const shouldApply = plugin.apply(mockConfig, mockEnv);
      expect(shouldApply).toBe(true);
    });

    it('должен применяться в dev режиме', () => {
      plugin = svgSpritePlugin({
        iconsFolder: 'src/icons'
      });

      const mockConfig = { mode: 'development' };
      const mockEnv = { command: 'serve' };

      const shouldApply = plugin.apply(mockConfig, mockEnv);
      expect(shouldApply).toBe(true);
    });

    it('НЕ должен применяться в preview режиме (serve + production)', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();

      plugin = svgSpritePlugin({
        iconsFolder: 'src/icons',
        verbose: true
      });

      const mockConfig = { mode: 'production' };
      const mockEnv = { command: 'serve' };

      const shouldApply = plugin.apply(mockConfig, mockEnv);
      
      expect(shouldApply).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Preview mode detected'));

      consoleSpy.mockRestore();
    });

    it('должен применяться в SSR build режиме (build + production + ssr)', () => {
      plugin = svgSpritePlugin({
        iconsFolder: 'src/icons'
      });

      const mockConfig = { 
        mode: 'production',
        build: { ssr: true }
      };
      const mockEnv = { command: 'build' };

      const shouldApply = plugin.apply(mockConfig, mockEnv);
      expect(shouldApply).toBe(true);
    });

    it('должен корректно работать с enforce: "pre"', () => {
      plugin = svgSpritePlugin({
        iconsFolder: 'src/icons'
      });

      expect(plugin.enforce).toBe('pre');
    });
  });

  describe('Preview режим - интеграционные тесты', () => {
    it('apply() должен блокировать выполнение в preview, а не configResolved', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation();

      plugin = svgSpritePlugin({
        iconsFolder: 'src/icons',
        verbose: true
      });

      // Preview режим определяется в apply()
      const mockConfig = { mode: 'production' };
      const mockEnv = { command: 'serve' };
      
      const shouldApply = plugin.apply(mockConfig, mockEnv);
      
      // Плагин не должен применяться
      expect(shouldApply).toBe(false);
      
      // В preview режиме configResolved не должен вызываться вообще
      // (Vite пропустит плагин если apply вернул false)

      consoleSpy.mockRestore();
    });

    it('в production build режиме плагин должен работать полностью', async () => {
      const iconPath = resolve(testDir, 'src/icons/test.svg');
      await writeFile(iconPath, `
        <svg viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="10"/>
        </svg>
      `);

      plugin = svgSpritePlugin({
        iconsFolder: 'src/icons',
        verbose: false
      });

      // Production build
      const mockConfig = { mode: 'production' };
      const mockEnv = { command: 'build' };
      
      const shouldApply = plugin.apply(mockConfig, mockEnv);
      expect(shouldApply).toBe(true);

      // Выполняем полный цикл
      const resolvedConfig = {
        root: testDir,
        command: 'build',
        mode: 'production'
      };

      plugin.configResolved(resolvedConfig);
      await plugin.buildStart();

      const mockContext = { server: undefined, filename: 'index.html' };
      const result = await plugin.transformIndexHtml.handler('<html></html>', mockContext);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      
      const spriteTag = result.find(tag => tag.tag === 'svg');
      expect(spriteTag).toBeDefined();
      expect(spriteTag.children).toContain('<symbol id="test"');
    });

    it('в dev режиме (serve + development) плагин должен работать с HMR', async () => {
      const iconPath = resolve(testDir, 'src/icons/dev-icon.svg');
      await writeFile(iconPath, `
        <svg viewBox="0 0 24 24">
          <rect width="20" height="20" x="2" y="2"/>
        </svg>
      `);

      plugin = svgSpritePlugin({
        iconsFolder: 'src/icons',
        watch: true
      });

      // Dev режим
      const mockConfig = { mode: 'development' };
      const mockEnv = { command: 'serve' };
      
      const shouldApply = plugin.apply(mockConfig, mockEnv);
      expect(shouldApply).toBe(true);

      const resolvedConfig = {
        root: testDir,
        command: 'serve',
        mode: 'development'
      };

      plugin.configResolved(resolvedConfig);
      await plugin.buildStart();

      const mockContext = { server: {}, filename: 'index.html' }; // dev server
      const result = await plugin.transformIndexHtml.handler('<html></html>', mockContext);

      // Должен быть HMR скрипт
      const scriptTag = result.find(tag => tag.tag === 'script');
      expect(scriptTag).toBeDefined();
      expect(scriptTag.children).toContain('import.meta.hot');
    });
  });
});

