import type { AiChatAboutItemInput, AiChatMessage } from '~/api';

type ChatContext = AiChatAboutItemInput['itemContext'];

export function buildAiChatRequest(itemContext: ChatContext, messages: AiChatMessage[]): AiChatAboutItemInput {
  return {
    itemContext: {
      id: itemContext.id,
      title: itemContext.title,
      category: itemContext.category,
      params: itemContext.params,
      price: itemContext.price,
      description: itemContext.description,
    },
    messages,
  };
}
