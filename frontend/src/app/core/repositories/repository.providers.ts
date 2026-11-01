import { Provider } from '@angular/core';
import { environment } from '../environments/environment';
import { IndexedDbMediaRepository } from './indexeddb-media.repository';
import { HttpAdapter } from './http.adapter';
import { LocalAdapter } from './local.adapter';
import {
  AUTH_REPO,
  MEDIA_REPO,
  MESSAGES_REPO,
  PROFILE_REPO,
  PROJECTS_REPO,
  SKILLS_REPO,
} from './repository.tokens';

const useApi = environment.dataSource === 'api';

export const PORTFOLIO_REPOSITORY_PROVIDERS: Provider[] = [
  { provide: PROJECTS_REPO, useExisting: useApi ? HttpAdapter : LocalAdapter },
  { provide: SKILLS_REPO, useExisting: useApi ? HttpAdapter : LocalAdapter },
  { provide: MESSAGES_REPO, useExisting: useApi ? HttpAdapter : LocalAdapter },
  { provide: PROFILE_REPO, useExisting: LocalAdapter },
  { provide: AUTH_REPO, useExisting: useApi ? HttpAdapter : LocalAdapter },
  { provide: MEDIA_REPO, useExisting: IndexedDbMediaRepository },
];
