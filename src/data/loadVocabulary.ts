import { CEFRLevel, WordItem } from '../types/vocabulary';

const LEVELS: CEFRLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1'];

const isNonEmpty = (v: unknown): v is string => typeof v === 'string' && v.trim().length > 0;

/**
 * Validates raw JSON entries once at startup. Entries with missing fields or
 * duplicate ids are dropped (and reported in dev) instead of crashing screens later.
 */
export const loadVocabulary = (raw: unknown): WordItem[] => {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const result: WordItem[] = [];
  let dropped = 0;

  for (const item of raw as Partial<WordItem>[]) {
    const valid =
      item &&
      isNonEmpty(item.id) &&
      isNonEmpty(item.word) &&
      isNonEmpty(item.pos) &&
      isNonEmpty(item.ipa) &&
      isNonEmpty(item.meaning) &&
      isNonEmpty(item.example) &&
      isNonEmpty(item.exampleVi) &&
      LEVELS.includes(item.level as CEFRLevel) &&
      !seen.has(item.id as string);
    if (!valid) {
      dropped += 1;
      continue;
    }
    seen.add(item.id as string);
    result.push(item as WordItem);
  }

  if (__DEV__ && dropped > 0) {
    console.warn(`[vocabulary] dropped ${dropped} invalid or duplicate entries`);
  }
  return result;
};
