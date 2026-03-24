Инструкция по запуску проекта в `dev` и `prod` с разными AI-провайдерами (`ollama` / `gigachat`).

## Требования

- `Node.js` + `pnpm`
- Для режима `ollama`: установленный и доступный в PATH `ollama`

Установка зависимостей:

```bash
pnpm install
```

## Быстрый старт

### Dev (по умолчанию: GigaChat)

```bash
pnpm dev
или
```
```bash
pnpm run dev
```

Эквивалентно:

```bash
pnpm run dev:gigachat
```

### Dev (Ollama)
```bash
pnpm run dev:ollama
```

## Production запуск

### Prod (по умолчанию: GigaChat)

```bash
pnpm run prod
```

Эквивалентно:

```bash
pnpm run prod:gigachat
```
### Dev (Ollama)
```bash
pnpm run prod:ollama
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
