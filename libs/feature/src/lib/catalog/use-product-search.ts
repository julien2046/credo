import { useEffect, useMemo, useState } from 'react';
import { listPublicProducts, type PublicProduct } from '@credo/data-access';
import { getDataClient } from '@credo/platform-amplify';

function normalizeName(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function useProductSearch(query: string) {
  const [catalog, setCatalog] = useState<PublicProduct[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading'
  );
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const products = await listPublicProducts(getDataClient());
        if (active) {
          setCatalog(products);
          setStatus('ready');
        }
      } catch {
        if (active) setStatus('error');
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [attempt]);

  const index = useMemo(
    () =>
      catalog.map((product) => ({
        product,
        name: normalizeName(product.name),
      })),
    [catalog]
  );
  const term = normalizeName(query);
  const results = useMemo(() => {
    if (!term) return [];
    const words = term.split(' ');
    return index
      .filter(({ name }) => words.every((word) => name.includes(word)))
      .map(({ product }) => product);
  }, [index, term]);

  return {
    status,
    results,
    retry: () => {
      setStatus('loading');
      setAttempt((n) => n + 1);
    },
  };
}
