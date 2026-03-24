import Fastify from 'fastify';
import cors from '@fastify/cors';

import items from 'data/items.json' with { type: 'json' };
import { treeifyError, ZodError } from 'zod';
import { doesItemNeedRevision, getMissingItemParams } from './src/utils.ts';
import { Item, ItemsGetInQuerySchema, ItemUpdateInSchema } from '@ads/shared';

const ITEMS = items as Item[];
const GIGACHAT_MODEL = 'GigaChat-2';
const GIGACHAT_SCOPE = 'GIGACHAT_API_PERS';
const GIGACHAT_INSECURE_TLS = (process.env.GIGACHAT_INSECURE_TLS ?? '1') === '1';
const GIGACHAT_AUTH_KEY =
  process.env.GIGACHAT_AUTH_KEY ??
  'MDE5ZDIwMmMtZjI3MS03NmY2LTg4MDgtZjcxM2I3MTNjOWM5OmUxNDVmZjk2LTVmMzgtNDQ1Mi04NDA5LThlNDliMTgxZDI4ZQ==';

let gigachatAccessToken: { token: string; expiresAt: number } | null = null;

if (GIGACHAT_INSECURE_TLS) {
  // Local/dev workaround for environments with untrusted corporate/self-signed certificates.
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

async function getGigaChatAccessToken(): Promise<string> {
  const now = Date.now();
  if (gigachatAccessToken && gigachatAccessToken.expiresAt > now + 30_000) {
    return gigachatAccessToken.token;
  }

  const body = new URLSearchParams({ scope: GIGACHAT_SCOPE });
  const tokenResponse = await fetch('https://ngw.devices.sberbank.ru:9443/api/v2/oauth', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${GIGACHAT_AUTH_KEY}`,
      RqUID: crypto.randomUUID(),
    },
    body,
  });

  const tokenPayload = (await tokenResponse.json()) as {
    access_token?: string;
    expires_at?: number;
    message?: string;
  };

  if (!tokenResponse.ok) {
    throw new Error(tokenPayload.message ?? `GigaChat OAuth failed with status ${tokenResponse.status}`);
  }

  if (typeof tokenPayload.access_token !== 'string' || !tokenPayload.access_token) {
    throw new Error('GigaChat OAuth response does not contain access_token');
  }

  const expiresAt = Number(tokenPayload.expires_at ?? 0);
  gigachatAccessToken = {
    token: tokenPayload.access_token,
    expiresAt: Number.isFinite(expiresAt) && expiresAt > 0 ? expiresAt : now + 25 * 60_000,
  };

  return gigachatAccessToken.token;
}

const fastify = Fastify({
  logger: true,
});

await fastify.register((await import('@fastify/middie')).default);
await fastify.register(cors, {
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});

// Искуственная задержка ответов, чтобы можно было протестировать состояния загрузки
fastify.use((_, __, next) =>
  new Promise(res => setTimeout(res, 300 + Math.random() * 700)).then(next),
);

interface ItemGetRequest extends Fastify.RequestGenericInterface {
  Params: {
    id: string;
  };
}

fastify.get<ItemGetRequest>('/items/:id', (request, reply) => {
  const itemId = Number(request.params.id);

  if (!Number.isFinite(itemId)) {
    reply
      .status(400)
      .send({ success: false, error: 'Item ID path param should be a number' });
    return;
  }

  const item = ITEMS.find(item => item.id === itemId);

  if (!item) {
    reply
      .status(404)
      .send({ success: false, error: "Item with requested id doesn't exist" });
    return;
  }

  return {
    ...item,
    needsRevision: doesItemNeedRevision(item),
    missingParams: getMissingItemParams(item),
  };
});

interface ItemsGetRequest extends Fastify.RequestGenericInterface {
  Querystring: {
    q?: string;
    limit?: string;
    skip?: string;
    categories?: string;
    needsRevision?: string;
  };
}

fastify.get<ItemsGetRequest>('/items', request => {
  const {
    q,
    limit,
    skip,
    needsRevision,
    categories,
    sortColumn,
    sortDirection,
  } = ItemsGetInQuerySchema.parse(request.query);

  const filteredItems = ITEMS.filter(item => {
    return (
      item.title.toLowerCase().includes(q.toLowerCase()) &&
      (!needsRevision || doesItemNeedRevision(item)) &&
      (!categories?.length ||
        categories.some(category => item.category === category))
    );
  });

  return {
    items: filteredItems
      .toSorted((item1, item2) => {
        let comparisonValue = 0;

        if (!sortDirection) return comparisonValue;

        if (sortColumn === 'title') {
          comparisonValue = item1.title.localeCompare(item2.title);
        } else if (sortColumn === 'price') {
          comparisonValue = Number(item1.price) - Number(item2.price);
        } else if (sortColumn === 'createdAt') {
          comparisonValue =
            new Date(item1.createdAt).valueOf() -
            new Date(item2.createdAt).valueOf();
        }

        return (sortDirection === 'desc' ? -1 : 1) * comparisonValue;
      })
      .slice(skip, skip + limit)
      .map(item => ({
        id: item.id,
        category: item.category,
        title: item.title,
        price: item.price,
        needsRevision: doesItemNeedRevision(item),
      })),
    total: filteredItems.length,
  };
});

interface ItemUpdateRequest extends Fastify.RequestGenericInterface {
  Params: {
    id: string;
  };
}

fastify.put<ItemUpdateRequest>('/items/:id', (request, reply) => {
  const itemId = Number(request.params.id);

  if (!Number.isFinite(itemId)) {
    reply
      .status(400)
      .send({ success: false, error: 'Item ID path param should be a number' });
    return;
  }

  const itemIndex = ITEMS.findIndex(item => item.id === itemId);

  if (itemIndex === -1) {
    reply
      .status(404)
      .send({ success: false, error: "Item with requested id doesn't exist" });
    return;
  }

  try {
    const body = (request.body ?? {}) as {};
    const parsedData = ItemUpdateInSchema.parse({
      category: ITEMS[itemIndex].category,
      ...body,
    });

    ITEMS[itemIndex] = {
      id: ITEMS[itemIndex].id,
      createdAt: ITEMS[itemIndex].createdAt,
      updatedAt: new Date().toISOString(),
      ...parsedData,
    };

    return { success: true };
  } catch (error) {
    if (error instanceof ZodError) {
      reply.status(400).send({ success: false, error: treeifyError(error) });
      return;
    }

    throw error;
  }
});

interface GigaChatProxyRequest extends Fastify.RequestGenericInterface {
  Body: {
    messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }>;
    model?: string;
  };
}

fastify.post<GigaChatProxyRequest>('/ai/gigachat/chat', async (request, reply) => {
  try {
    const messages = Array.isArray(request.body?.messages) ? request.body.messages : [];
    if (!messages.length) {
      reply.status(400).send({ success: false, error: 'messages should not be empty' });
      return;
    }

    const model = request.body?.model || GIGACHAT_MODEL;
    const token = await getGigaChatAccessToken();

    const chatResponse = await fetch('https://gigachat.devices.sberbank.ru/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        model,
        messages,
        stream: false,
      }),
    });

    const chatPayload = (await chatResponse.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      message?: string;
    };

    if (!chatResponse.ok) {
      reply.status(chatResponse.status).send({
        success: false,
        error: chatPayload.message ?? `GigaChat chat failed with status ${chatResponse.status}`,
      });
      return;
    }

    return chatPayload;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown GigaChat proxy error';
    request.log.error({ err: error }, 'GigaChat proxy request failed');
    reply.status(502).send({ success: false, error: `GigaChat proxy error: ${message}` });
  }
});

const port = Number(process.env.port) || 8080;

fastify.listen({ port }, function (err, _address) {
  if (err) {
    fastify.log.error(err);
    process.exit(1);
  }

  fastify.log.debug(`Server is listening on port ${port}`);
});
