import type { Category } from '../../models/types';

export type ChatContextRef = {
  id: string;
  title: string;
  category: Category;
  params: Record<string, unknown>;
  price: number | null;
  description?: string;
};
