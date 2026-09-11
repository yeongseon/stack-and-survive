import type { Architecture } from '@stack-and-survive/schema';
import { definitions, parseArchitecture } from '@stack-and-survive/cloud-domain';

export const SAVE_KEY = 'stack-and-survive.architecture.v1';
export interface SaveRepository {
  load(): Architecture | null;
  save(architecture: Architecture): void;
  clear(): void;
}
export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
export function browserSaveRepository(storage: () => KeyValueStorage): SaveRepository {
  return {
    load() {
      const text = storage().getItem(SAVE_KEY);
      if (text === null) return null;
      const parsed: unknown = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object' || !('saveVersion' in parsed) || parsed.saveVersion !== 1 || !('architecture' in parsed)) {
        throw new Error('Unsupported or malformed save. Clear local state to recover.');
      }
      const architecture = parseArchitecture(parsed.architecture);
      for (const resource of architecture.resources) {
        if (resource.remaining > 0) resource.remaining = definitions[resource.kind].provisioning;
      }
      return architecture;
    },
    save(architecture) {
      const validated = parseArchitecture(architecture);
      storage().setItem(SAVE_KEY, JSON.stringify({ saveVersion: 1, architecture: validated }));
    },
    clear() { storage().removeItem(SAVE_KEY); },
  };
}
