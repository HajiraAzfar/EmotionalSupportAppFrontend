import {apiRequest} from './client';
import {CrisisEvent} from './entries';
import {getAccessToken} from '../storage/tokens';

export interface LibraryItem {
  id: string;
  name: string;
  definition?: string;
  example?: string;
}

export interface LibraryCategory {
  id: string;
  name: string;
  items: LibraryItem[];
}

// Libraries come either grouped (feelings, triggers) or flat (thinking traps).
// Flat ones are normalised to a single unnamed category.
export interface Library {
  categories: LibraryCategory[];
  total: number;
  extendable: boolean;
}

export const TERM_MAX_LENGTH = 20;

const cache: Record<string, Library> = {};

export async function getLibrary(name: string, preferValence?: string | null): Promise<Library> {
  const key = `${name}:${preferValence ?? ''}`;
  if (cache[key]) {
    return cache[key];
  }
  const token = await getAccessToken();
  const query = preferValence ? `?prefer=${encodeURIComponent(preferValence)}` : '';
  const raw = await apiRequest(`/libraries/${name}${query}`, {token: token ?? undefined});
  const categories: LibraryCategory[] = raw.categories ?? [
    {id: name, name: '', items: raw.items},
  ];
  const library = {
    categories,
    total: categories.reduce((n, c) => n + c.items.length, 0),
    extendable: Boolean(raw.extendable),
  };
  cache[key] = library;
  return library;
}

export async function addTerm(
  library: string,
  name: string,
  entryId?: string,
): Promise<{term: LibraryItem; crisis_event: CrisisEvent | null}> {
  const token = await getAccessToken();
  const result = await apiRequest(`/libraries/${library}/terms`, {
    method: 'POST',
    body: {name, entry_id: entryId},
    token: token ?? undefined,
  });
  Object.keys(cache)
    .filter(k => k.startsWith(`${library}:`))
    .forEach(k => delete cache[k]);
  return result;
}
