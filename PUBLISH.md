# 📦 Инструкция по публикации в NPM

## ✅ Предварительная подготовка

Перед публикацией убедитесь, что:

1. **Установлен Node.js и npm**
   ```bash
   node --version  # v14.18.0 или выше
   npm --version
   ```

2. **Есть аккаунт на npmjs.com**
   - Зарегистрируйтесь на https://www.npmjs.com/signup
   - Подтвердите email

3. **Выполнен вход в npm**
   ```bash
   npm login
   ```

## 🔍 Проверка перед публикацией

### 1. Проверьте версию в package.json

Текущая версия: **1.1.1**

Для новой публикации измените версию:
```bash
npm version patch  # 1.1.1 → 1.1.2
npm version minor  # 1.1.1 → 1.2.0
npm version major  # 1.1.1 → 2.0.0
```

### 2. Проверьте содержимое пакета

Посмотрите, что будет опубликовано:
```bash
npm pack --dry-run
```

Или создайте тестовый архив:
```bash
npm pack
```

Это создаст файл `vite-svg-sprite-generator-plugin-1.1.1.tgz`

### 3. Проверьте файлы в package.json

В `package.json` указаны файлы для публикации:
```json
"files": [
  "vite-svg-sprite-generator-plugin.js",
  "vite-svg-sprite-generator-plugin.ts",
  "vite-svg-sprite-generator-plugin.d.ts",
  "README.md",
  "LICENSE",
  "CHANGELOG.md"
]
```

### 4. Локальное тестирование

Установите пакет локально в тестовом проекте:
```bash
# В папке vite-svg-sprite-generator-pluginnpm pack

# В тестовом проекте
npm install ../path/to/vite-svg-sprite-generator-plugin-1.1.1.tgz
```

## 🚀 Публикация

### Публикация в основной реестр NPM

```bash
# Убедитесь, что вы в папке vite-svg-sprite-generator-plugincd vite-svg-sprite-generator-plugin
# Публикация
npm publish
```

### Публикация с тегом (например, beta)

```bash
npm publish --tag beta
```

### Публикация как публичный пакет (если scope)

Если имя пакета начинается с `@scope/`:
```bash
npm publish --access public
```

## ✅ После публикации

1. **Проверьте публикацию**
   - Откройте https://www.npmjs.com/package/vite-svg-sprite-generator-plugin
   - Убедитесь, что версия обновилась

2. **Проверьте установку**
   ```bash
   npm install vite-svg-sprite-generator-plugin
   ```

3. **Создайте Git тег**
   ```bash
   git tag v1.1.1
   git push origin v1.1.1
   ```

4. **Обновите CHANGELOG.md** для следующей версии

## 🔄 Обновление пакета

Для публикации новой версии:

1. Внесите изменения в код
2. Обновите CHANGELOG.md
3. Обновите версию:
   ```bash
   npm version patch  # или minor/major
   ```
4. Опубликуйте:
   ```bash
   npm publish
   ```
5. Создайте Git тег:
   ```bash
   git push --tags
   ```

## 🚨 Отмена публикации

**⚠️ Внимание:** Отменить публикацию можно только в течение 72 часов!

```bash
npm unpublish vite-svg-sprite-generator-plugin@1.1.1
```

Для удаления всех версий (использовать с осторожностью):
```bash
npm unpublish vite-svg-sprite-generator-plugin --force
```

## 📊 Статистика пакета

Посмотреть статистику загрузок:
```bash
npm info vite-svg-sprite-generator-plugin
```

## 🔐 Безопасность

### 2FA (Двухфакторная аутентификация)

Рекомендуется включить 2FA для публикации:

1. Включите 2FA на npmjs.com в настройках
2. При публикации введите одноразовый код:
   ```bash
   npm publish --otp=123456
   ```

### Просмотр токенов

```bash
npm token list
```

## 📝 Чек-лист перед публикацией

- [ ] Версия обновлена в package.json
- [ ] CHANGELOG.md актуализирован
- [ ] README.md проверен и актуален
- [ ] Код протестирован локально
- [ ] `npm pack --dry-run` показывает корректные файлы
- [ ] Выполнен `npm login`
- [ ] Git коммиты сделаны
- [ ] Готов к публикации

## 🎉 Готово!

После публикации ваш плагин будет доступен всем через:

```bash
npm install vite-svg-sprite-generator-plugin
```

## 📞 Поддержка

Если возникли проблемы:
- [NPM Support](https://www.npmjs.com/support)
- [NPM Documentation](https://docs.npmjs.com/)
- [Package Documentation](https://github.com/german-schneck/vite-svg-sprite-generator-plugin)

