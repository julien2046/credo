export type SeoConfig = { origin: string | null; indexable: boolean };

export function resolveSeoConfig(url?: string, indexing?: string): SeoConfig {
  if (indexing && indexing !== 'true' && indexing !== 'false') {
    throw new Error('VITE_SEO_INDEXABLE doit valoir true ou false');
  }
  const indexable = indexing === 'true';
  if (!url?.trim()) {
    if (indexable)
      throw new Error('VITE_SITE_URL est obligatoire pour indexer la boutique');
    return { origin: null, indexable: false };
  }
  const parsed = new URL(url);
  if (
    parsed.protocol !== 'https:' ||
    parsed.username ||
    parsed.password ||
    parsed.pathname !== '/' ||
    parsed.search ||
    parsed.hash
  ) {
    throw new Error(
      'VITE_SITE_URL doit etre une origine HTTPS sans chemin, identifiants ni parametres'
    );
  }
  if (
    indexable &&
    (parsed.hostname === 'localhost' || parsed.hostname.endsWith('.local'))
  ) {
    throw new Error('Une adresse locale ne peut pas etre indexable');
  }
  return { origin: parsed.origin, indexable };
}
