import { isTranslationCatalog, type TranslationCatalog } from '@neta/api-contracts';

import { NetaClientError } from '../../lib/api/errors.ts';

export function parseCatalogFile(value: string): TranslationCatalog {
  let parsed: unknown;
  try { parsed = JSON.parse(value); } catch { throw new NetaClientError('SERVER_ERROR', 'Seçilen dosya geçerli JSON değil.'); }
  if (!isTranslationCatalog(parsed)) throw new NetaClientError('SERVER_ERROR', 'Seçilen katalog beklenen formatta değil.');
  return parsed;
}
