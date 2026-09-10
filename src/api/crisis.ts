import {apiRequest} from './client';

export interface CrisisResource {
  id: string;
  name: string;
  phone: string;
  description: string;
  last_verified: string;
}

export interface CrisisResourcesResponse {
  version: string;
  locale: string;
  resources: CrisisResource[];
}

// No token passed → apiRequest sends no Authorization header, which is what
// FR-CRIS-010 requires (reachable without a signed-in session or app unlock).
export function getCrisisResources(): Promise<CrisisResourcesResponse> {
  return apiRequest('/crisis/resources');
}