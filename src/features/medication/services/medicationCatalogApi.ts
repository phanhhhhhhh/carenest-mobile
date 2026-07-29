import api from '../../../core/api/client';
import { MedicationCatalogSchema, safeParseList, type MedicationCatalogParsed } from '../../../shared/schemas';

/** Autocomplete lookup against the curated medication reference catalog (see backend `medication_catalog`). */
export async function searchMedicationCatalog(
  query: string,
  signal?: AbortSignal,
): Promise<MedicationCatalogParsed[]> {
  if (query.trim().length < 2) return [];
  const res = await api.get('/medications/catalog', { params: { q: query.trim() }, signal });
  return safeParseList(MedicationCatalogSchema, res.data, 'searchMedicationCatalog');
}
