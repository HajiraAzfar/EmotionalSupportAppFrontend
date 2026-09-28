import {apiRequest} from './client';
import {getAccessToken} from '../storage/tokens';

// SRS 4.11: an article as a card — everything except the text itself.
export interface ArticleCard {
  slug: string;
  title: string;
  summary: string;
  category: string;
  minutes: number;
  featured: boolean;
  favourite: boolean;
}

export interface Article extends ArticleCard {
  body: string;
  traps: string[];
}

export interface LibraryListing {
  categories: string[];
  featured: ArticleCard[];
  articles: ArticleCard[];
  saved_count: number;
}

type Filters = {q?: string; trap?: string; category?: string; savedOnly?: boolean};

export async function listArticles(filters: Filters = {}): Promise<LibraryListing> {
  const token = await getAccessToken();
  const query = new URLSearchParams();
  if (filters.q) {
    query.set('q', filters.q);
  }
  if (filters.trap) {
    query.set('trap', filters.trap);
  }
  if (filters.category) {
    query.set('category', filters.category);
  }
  if (filters.savedOnly) {
    query.set('saved_only', 'true');
  }
  const suffix = query.toString() ? `?${query}` : '';
  return apiRequest(`/library${suffix}`, {token: token ?? undefined});
}

export async function readArticle(slug: string): Promise<Article> {
  const token = await getAccessToken();
  return apiRequest(`/library/${slug}`, {token: token ?? undefined});
}

export async function setFavourite(slug: string, favourite: boolean) {
  const token = await getAccessToken();
  return apiRequest(`/library/${slug}/favourite`, {
    method: favourite ? 'POST' : 'DELETE',
    body: favourite ? {} : undefined,
    token: token ?? undefined,
  });
}
