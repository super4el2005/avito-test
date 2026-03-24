Инструкция по запуску проекта в `dev` и `prod` с разными AI-провайдерами (`ollama` / `gigachat`).

## Требования

- `Node.js` + `pnpm`
- Для режима `ollama`: установленный и доступный в PATH `ollama`

Установка зависимостей:

```bash
pnpm install
```
## Production запуск
http://localhost:3000
### Prod (по умолчанию: GigaChat)
```bash
pnpm prod
```
или
```bash
pnpm run prod
```
или
```bash
pnpm run prod:gigachat
```
### Prod (Ollama)
```bash
pnpm run prod:ollama
```

## Dev запуск

### Dev (по умолчанию: GigaChat)

```bash
pnpm dev
```
или
```bash
pnpm run dev
```
или
```bash
pnpm run dev:gigachat
```

### Dev (Ollama)
```bash
pnpm run dev:ollama
```

## Настройка GigaChat

GigaChat вызывается через backend-прокси (`/ai/gigachat/chat`), чтобы избежать браузерных TLS/CORS проблем.

Опционально можно передать ключ через переменную окружения backend:

```bash
GIGACHAT_AUTH_KEY=<base64(client_id:client_secret)>
```

Если переменная не задана, используется ключ, зашитый в коде.

Для окружений с проблемным TLS-сертификатом можно использовать:

```bash
GIGACHAT_INSECURE_TLS=1
```

По умолчанию в текущей конфигурации этот режим включен для локальной разработки.


## Обоснование стека

- `pnpm workspace` + монорепозиторий (`apps/*`, `packages/*`) упрощает переиспользование кода и единое управление зависимостями.
- `TanStack Query` отвечает за серверное состояние, кэширование и предсказуемую работу с API.
- `Mantine` закрывает базовые UI-задачи (компоненты/хуки/формы), ускоряя разработку без потери читаемости.
- `ESLint` + локальные архитектурные ограничения удерживают границы слоев и консистентность кода.

## Архитектура фронтенда (`apps/frontend/app`)

- `shared` — универсальные функции и утилиты, которые **не знают о домене** и могут быть использованы в любом проекте.
- `domain` — бизнес-логика и доменные сущности; может использовать `shared`.
- `routes` — слой оркестрации: собирает страницу из `domain` + `shared`, связывает данные, UI и навигацию.

Зависимости между слоями:

- `shared` -> не импортирует `domain` и `routes`
- `domain` -> может импортировать `shared`
- `routes` -> может импортировать `domain` и `shared`

## Ключевые ESLint-правила

- Именование файлов в `app/domain` и `app/shared`: `lower kebab-case` (например, `use-ad-edit-ai.ts`) или одно слово в нижнем регистре (например, `index.ts`).
- Сортировка импортов и экспортов через `eslint-plugin-simple-import-sort` для стабильного и читаемого порядка.
- Для route-файлов default export функции должен быть анонимным (`export default function () {}`).
- Для `app/shared/**/*` запрещены импорты из `app/domain` (`~/domain`, `~/domain/*` и относительные пути до `domain`) для сохранения архитектурной независимости `shared`.
